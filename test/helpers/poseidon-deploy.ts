import { ethers } from "hardhat";

const { poseidonContract } = require("circomlibjs");

export async function deployPoseidons(deployer: any, poseidonSizeParams: number[], isLog: boolean = true) {
  poseidonSizeParams.forEach((size) => {
    if (![1, 2, 3, 4, 5, 6].includes(size)) {
      throw new Error(`Poseidon should be integer in a range 1..6. Poseidon size provided: ${size}`);
    }
  });

  const deployPoseidon = async (params: number, isLog: boolean) => {
    const abi = poseidonContract.generateABI(params);
    const code = poseidonContract.createCode(params);

    const PoseidonElements = new ethers.ContractFactory(abi, code, deployer);
    const poseidonElements = await PoseidonElements.deploy();

    if (isLog) {
      console.log(`Poseidon${params}Elements deployed to:`, await poseidonElements.getAddress());
    }

    return poseidonElements;
  };

  const result = [];

  for (const size of poseidonSizeParams) {
    result.push(await deployPoseidon(size, isLog));
  }

  return result;
}

export async function deployPoseidonFacade() {
  const poseidonContracts = await deployPoseidons(
    (await ethers.getSigners())[0],
    new Array(6).fill(6).map((_, i) => i + 1),
    false,
  );

  const SpongePoseidonFactory = await ethers.getContractFactory("SpongePoseidon", {
    libraries: {
      PoseidonUnit6L: await poseidonContracts[5].getAddress(),
    },
  });

  const spongePoseidon = await SpongePoseidonFactory.deploy();

  const PoseidonFacadeFactory = await ethers.getContractFactory("PoseidonFacade", {
    libraries: {
      PoseidonUnit1L: await poseidonContracts[0].getAddress(),
      PoseidonUnit2L: await poseidonContracts[1].getAddress(),
      PoseidonUnit3L: await poseidonContracts[2].getAddress(),
      PoseidonUnit4L: await poseidonContracts[3].getAddress(),
      PoseidonUnit5L: await poseidonContracts[4].getAddress(),
      PoseidonUnit6L: await poseidonContracts[5].getAddress(),
      SpongePoseidon: await spongePoseidon.getAddress(),
    },
  });

  const poseidonFacade = await PoseidonFacadeFactory.deploy();

  return {
    poseidonContracts,
    spongePoseidon,
    poseidonFacade,
  };
}
