import { Deployer } from "@solarity/hardhat-migrate";
import { EthersContract } from "@solarity/hardhat-migrate/dist/src/types/adapter";

import { BaseContract } from "ethers";

import { ERC1967Proxy__factory, PoseidonSMT, PoseidonSMT__factory } from "@/generated-types/ethers";

export async function deploySMTProxy(deployer: Deployer, name: string) {
  return (await deployProxy(deployer, PoseidonSMT__factory, name)) as PoseidonSMT;
}

export async function deployProxy<T, I = BaseContract>(
  deployer: Deployer,
  factory: EthersContract<T, I>,
  name: string,
) {
  const implementation = (await deployer.deploy(factory, { name: name })) as BaseContract;

  await deployer.deploy(ERC1967Proxy__factory, [await implementation.getAddress(), "0x"], {
    name: `${name} Proxy`,
  });

  return await deployer.deployed(factory, `${name} Proxy`);
}
