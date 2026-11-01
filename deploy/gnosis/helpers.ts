import hre from "hardhat";

import { Deployer } from "@solarity/hardhat-migrate";
import { BaseInstance } from "@solarity/hardhat-migrate/dist/src/types/adapter";

import { BaseContract, BytesLike, ethers } from "ethers";

import { poseidon } from "@iden3/js-crypto";

import { ERC1967Proxy__factory } from "@ethers-v6";

const { poseidonContract } = require("circomlibjs");

// Deployment rules for Gnosis (no mocks, nothing left uninitialized):
// - proxies are initialized in their constructor, so there is no window to front-run the initializer;
// - plain contracts are initialized in the next transaction; if someone front-runs it, our
//   initializer reverts and the migration stops, and every value is read back before the handover.

const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

export async function deployPoseidon(deployer: Deployer, size: 1 | 2 | 3): Promise<string> {
  // Saved under the repository library name, so hardhat-migrate links PoseidonSMT and StateKeeper to it
  const poseidon = await deployer.deploy({
    abi: poseidonContract.generateABI(size),
    bytecode: poseidonContract.createCode(size),
    contractName: `contracts/libraries/Poseidon.sol:PoseidonUnit${size}L`,
  });

  return await (poseidon as BaseContract).getAddress();
}

export async function deployInitializedProxy<A, I>(
  deployer: Deployer,
  factory: BaseInstance<A, I>,
  name: string,
  implementation: string,
  initData: BytesLike,
) {
  await deployer.deploy(ERC1967Proxy__factory, [implementation, initData], { name: `${name} Proxy` });

  return await deployer.deployed(factory, `${name} Proxy`);
}

export async function getImplementation(proxy: string): Promise<string> {
  const slot = await hre.ethers.provider.getStorage(proxy, IMPLEMENTATION_SLOT);

  return ethers.getAddress(ethers.dataSlice(slot, 12));
}

function normalize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(normalize).join(",")}]`;
  }

  // Contract instances compare by address
  if (typeof value === "object" && value !== null && "target" in value) {
    return normalize(value.target);
  }

  return typeof value === "string" ? value.toLowerCase() : String(value);
}

export function expectEqual(label: string, actual: unknown, expected: unknown) {
  if (normalize(actual) !== normalize(expected)) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

/**
 * Checks that the code at `address` is the compiled `contractName` and that every linked Poseidon
 * library hashes like circom Poseidon. Unlinked or stub libraries would silently return 0.
 */
export async function expectDeployedCode(contractName: string, address: string) {
  const artifact = await hre.artifacts.readArtifact(contractName);
  const code = await hre.ethers.provider.getCode(address);

  let expected = artifact.deployedBytecode;

  for (const [sourceName, libraries] of Object.entries(artifact.deployedLinkReferences)) {
    for (const [libraryName, references] of Object.entries(libraries)) {
      const library = ethers.getAddress(ethers.dataSlice(code, references[0].start, references[0].start + 20));

      await expectPoseidon(`${contractName} -> ${sourceName}:${libraryName}`, library, libraryName, sourceName);

      for (const { start, length } of references) {
        expected =
          expected.slice(0, 2 + start * 2) + library.slice(2).toLowerCase() + expected.slice(2 + (start + length) * 2);
      }
    }
  }

  // Immutable values (e.g. the UUPS self address) are filled in at deployment
  const buildInfo = await hre.artifacts.getBuildInfo(`${artifact.sourceName}:${artifact.contractName}`);
  const immutableReferences =
    buildInfo?.output.contracts[artifact.sourceName][artifact.contractName].evm.deployedBytecode.immutableReferences;
  const immutables = Object.values(immutableReferences ?? {}).flat();

  for (const { start, length } of immutables) {
    expected =
      expected.slice(0, 2 + start * 2) +
      code.slice(2 + start * 2, 2 + (start + length) * 2) +
      expected.slice(2 + (start + length) * 2);
  }

  expectEqual(`${contractName} code at ${address}`, code, expected);
}

async function expectPoseidon(label: string, library: string, libraryName: string, sourceName: string) {
  const size = Number(libraryName.match(/^PoseidonUnit(\d)L$/)?.[1]);

  if (!size) {
    throw new Error(`${label}: unexpected library`);
  }

  // The evidence registry library interface takes bytes32 inputs, the repository one takes uint256
  const type = sourceName.startsWith("@rarimo/evidence-registry/") ? "bytes32" : "uint256";

  const inputs = Array.from({ length: size }, (_, i) => ethers.toBeHex(i + 1, 32));
  const contract = new ethers.Contract(
    library,
    [`function poseidon(${type}[${size}]) view returns (uint256)`],
    hre.ethers.provider,
  );

  expectEqual(`${label} at ${library}`, await contract.poseidon(inputs), poseidon.hash(inputs.map(BigInt)));
}
