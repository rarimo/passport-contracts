import { ERC1967Proxy__factory, PoseidonSMT, PoseidonSMT__factory } from "@/generated-types/ethers";
import { Deployer } from "@solarity/hardhat-migrate";
import { Instance } from "@solarity/hardhat-migrate/dist/src/types/adapter";
import { BaseContract } from "ethers";

const { poseidonContract } = require("circomlibjs");

export async function deployPoseidons(deployer: Deployer, poseidonSizeParams: number[]) {
  poseidonSizeParams.forEach((size) => {
    if (![1, 2, 3, 4, 5, 6].includes(size)) {
      throw new Error(`Poseidon should be integer in a range 1..6. Poseidon size provided: ${size}`);
    }
  });

  const deployPoseidon = async (size: number) => {
    const abi = poseidonContract.generateABI(size);
    const bytecode = poseidonContract.createCode(size);

    await deployer.deploy({
      abi,
      bytecode,
      contractName: `@iden3/contracts/lib/Poseidon.sol:PoseidonUnit${size}L`,
    });
  };

  for (const size of poseidonSizeParams) {
    await deployPoseidon(size);
  }
}

export async function deploySMTProxy(deployer: Deployer, name: string) {
  return (await deployProxy(deployer, PoseidonSMT__factory, name)) as PoseidonSMT;
}

export async function deployProxy<T, A = T, I = any>(
  deployer: Deployer,
  contract: Instance<A, I> | (T extends Truffle.Contract<I> ? T : never),
  name: string,
) {
  const implementation = (await deployer.deploy(contract, { name: name })) as BaseContract;

  await deployer.deploy(ERC1967Proxy__factory, [await implementation.getAddress(), "0x"], {
    name: `${name} Proxy`,
  });

  return await deployer.deployed(contract, `${name} Proxy`);
}
