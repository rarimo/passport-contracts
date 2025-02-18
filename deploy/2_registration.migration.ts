import { ethers } from "hardhat";

import { Deployer } from "@solarity/hardhat-migrate";

import { deployPoseidons, deployCECDSADispatcher } from "./helpers";

import {
  Registration2Mock__factory,
  CECDSADispatcher__factory,
  PPerPassport_11_256_3_3_336_248_NAVerifier2__factory,
  PPerPassport_14_256_3_4_336_64_1_1480_5_296Verifier2__factory,
  PPerPassport_15_512_3_3_336_248_NAVerifier2__factory,
  PPerPassport_1_256_3_6_336_248_1_2744_4_256Verifier2__factory,
  PPerPassport_1_256_3_6_336_560_1_2744_4_256Verifier2__factory,
  PPerPassport_20_160_3_3_736_200_NAVerifier2__factory,
  PPerPassport_20_256_3_5_336_72_NAVerifier2__factory,
  PPerPassport_21_256_3_5_576_232_NAVerifier2__factory,
  PPerPassport_4_160_3_3_336_216_1_1296_3_256Verifier2__factory,
} from "@ethers-v6";

import {
  C_ECDSA_BRAINPOOLP512R1_SHA512_1024,
  Z_PER_PASSPORT_11_256_3_3_336_248_NA,
  Z_PER_PASSPORT_14_256_3_4_336_64_1_1480_5_296,
  Z_PER_PASSPORT_15_512_3_3_336_248_NA,
  Z_PER_PASSPORT_1_256_3_6_336_248_1_2744_4_256,
  Z_PER_PASSPORT_1_256_3_6_336_560_1_2744_4_256,
  Z_PER_PASSPORT_20_160_3_3_736_200_NA,
  Z_PER_PASSPORT_20_256_3_5_336_72_NA,
  Z_PER_PASSPORT_21_256_3_5_576_232_NA,
  Z_PER_PASSPORT_4_160_3_3_336_216_1_1296_3_256,
} from "@/scripts/utils/types";

export = async (deployer: Deployer) => {
  await deployPoseidons(deployer, [1, 2, 3, 4, 5]);

  const registration = await deployer.deployed(
    Registration2Mock__factory,
    "0xC0B09085Fa2ad3A8BbF96494B8d5cd10702FE20d",
  );

  await deployCECDSADispatcher(deployer, "brainpoolP512r1", "SHA512", "128", "0x0381820004");

  const v0 = await deployer.deployed(CECDSADispatcher__factory, "CECDSADispatcher brainpoolP512r1 SHA512 128");
  const v1 = await deployer.deploy(PPerPassport_11_256_3_3_336_248_NAVerifier2__factory);
  const v2 = await deployer.deploy(PPerPassport_14_256_3_4_336_64_1_1480_5_296Verifier2__factory);
  const v3 = await deployer.deploy(PPerPassport_15_512_3_3_336_248_NAVerifier2__factory);
  const v4 = await deployer.deploy(PPerPassport_1_256_3_6_336_248_1_2744_4_256Verifier2__factory);
  const v5 = await deployer.deploy(PPerPassport_1_256_3_6_336_560_1_2744_4_256Verifier2__factory);
  const v6 = await deployer.deploy(PPerPassport_20_160_3_3_736_200_NAVerifier2__factory);
  const v7 = await deployer.deploy(PPerPassport_20_256_3_5_336_72_NAVerifier2__factory);
  const v8 = await deployer.deploy(PPerPassport_21_256_3_5_576_232_NAVerifier2__factory);
  const v9 = await deployer.deploy(PPerPassport_4_160_3_3_336_216_1_1296_3_256Verifier2__factory);

  const coder = ethers.AbiCoder.defaultAbiCoder();

  let data = coder.encode(["bytes32", "address"], [C_ECDSA_BRAINPOOLP512R1_SHA512_1024, await v0.getAddress()]);

  await registration.updateDependency(1, data, "0x");

  data = coder.encode(["bytes32", "address"], [Z_PER_PASSPORT_11_256_3_3_336_248_NA, await v1.getAddress()]);

  await registration.updateDependency(5, data, "0x");

  data = coder.encode(["bytes32", "address"], [Z_PER_PASSPORT_14_256_3_4_336_64_1_1480_5_296, await v2.getAddress()]);

  await registration.updateDependency(5, data, "0x");

  data = coder.encode(["bytes32", "address"], [Z_PER_PASSPORT_15_512_3_3_336_248_NA, await v3.getAddress()]);

  await registration.updateDependency(5, data, "0x");

  data = coder.encode(["bytes32", "address"], [Z_PER_PASSPORT_1_256_3_6_336_248_1_2744_4_256, await v4.getAddress()]);

  await registration.updateDependency(5, data, "0x");

  data = coder.encode(["bytes32", "address"], [Z_PER_PASSPORT_1_256_3_6_336_560_1_2744_4_256, await v5.getAddress()]);

  await registration.updateDependency(5, data, "0x");

  data = coder.encode(["bytes32", "address"], [Z_PER_PASSPORT_20_160_3_3_736_200_NA, await v6.getAddress()]);

  await registration.updateDependency(5, data, "0x");

  data = coder.encode(["bytes32", "address"], [Z_PER_PASSPORT_20_256_3_5_336_72_NA, await v7.getAddress()]);

  await registration.updateDependency(5, data, "0x");

  data = coder.encode(["bytes32", "address"], [Z_PER_PASSPORT_21_256_3_5_576_232_NA, await v8.getAddress()]);

  await registration.updateDependency(5, data, "0x");

  data = coder.encode(["bytes32", "address"], [Z_PER_PASSPORT_4_160_3_3_336_216_1_1296_3_256, await v9.getAddress()]);

  await registration.updateDependency(5, data, "0x");
};
