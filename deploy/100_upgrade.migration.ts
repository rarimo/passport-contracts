import { Deployer } from "@solarity/hardhat-migrate";

import { CRSADispatcher__factory, PRSASHADispatcher__factory, Registration2, Registration2__factory } from "@ethers-v6";
import {
  PPerPassport_1_256_3_5_576_248_NAVerifier2__factory,
  PPerPassport_1_256_3_6_576_248_1_2432_5_296Verifier2__factory,
  PPerPassport_21_256_3_7_336_264_21_3072_6_2008Verifier2__factory,
  PPerPassport_2_256_3_6_336_264_21_2448_6_2008Verifier2__factory,
  PPerPassport_1_256_3_6_576_264_1_2448_3_256Verifier2__factory,
  PPerPassport_2_256_3_6_336_248_1_2432_3_256Verifier2__factory,
  PPerPassport_2_256_3_6_576_248_1_2432_3_256Verifier2__factory,
  PPerPassport_11_256_3_3_576_248_1_1184_5_264Verifier2__factory,
  PPerPassport_12_256_3_3_336_232_NAVerifier2__factory,
  PPerPassport_1_256_3_4_336_232_1_1480_5_296Verifier2__factory,
  PPerPassport_1_256_3_4_600_248_1_1496_3_256Verifier2__factory,
  PUniversal2048V2Verifier2__factory,
  PUniversalPSS2048S32E2Verifier2__factory,
  PUniversalPSS2048S32E17Verifier2__factory,
  PUniversalPSS2048S64E17Verifier2__factory,
  PMNEOptVerifier2__factory,
  PMNEOpt2Verifier2__factory,
} from "@ethers-v6";

import {
  C_RSA_SHA1_2048,
  C_RSA_SHA1_4096,
  C_RSAPSS_SHA2_2048,
  C_RSAPSS_SHA512_2048,
  P_RSA_SHA2_2688,
  P_RSA_SHA2_2688_3,
  Z_PER_PASSPORT_1_256_3_5_576_248_NA,
  Z_PER_PASSPORT_1_256_3_6_576_248_1_2432_5_296,
  Z_PER_PASSPORT_21_256_3_7_336_264_21_3072_6_2008,
  Z_PER_PASSPORT_2_256_3_6_336_264_21_2448_6_2008,
  Z_PER_PASSPORT_1_256_3_6_576_264_1_2448_3_256,
  Z_PER_PASSPORT_2_256_3_6_336_248_1_2432_3_256,
  Z_PER_PASSPORT_2_256_3_6_576_248_1_2432_3_256,
  Z_PER_PASSPORT_11_256_3_3_576_248_1_1184_5_264,
  Z_PER_PASSPORT_12_256_3_3_336_232_NA,
  Z_PER_PASSPORT_1_256_3_4_336_232_1_1480_5_296,
  Z_PER_PASSPORT_1_256_3_4_600_248_1_1496_3_256,
  Z_UNIVERSAL_2048_V2,
  Z_UNIVERSAL_PSS_2048_S32_E2,
  Z_UNIVERSAL_PSS_2048_S32_E17,
  Z_UNIVERSAL_PSS_2048_S64_E17,
  Z_MNE_OPT,
  Z_MNE_OPT_2,
} from "@/scripts/utils/types";

import { deployCRSADispatcher, deployCRSAPSSDispatcher, deployPRSASHA2688Dispatcher } from "./helpers";

import { TSSUpgrader } from "@/scripts/upgrade/upgrade-utils";
import { RegistrationMethodId } from "@/test/helpers/constants";
import { BaseContract } from "ethers";

let counter = 0;

async function deployAll(deployer: Deployer) {
  // CERTIFICATE
  await deployCRSADispatcher(deployer, "SHA1", "65537", "512", "0x0282020100");
  await deployCRSADispatcher(deployer, "SHA1", "65537", "256", "0x0282010100");

  await deployCRSAPSSDispatcher(deployer, "SHA2", "65537", "256", "0x0282010100");
  await deployCRSAPSSDispatcher(deployer, "SHA512", "65537", "256", "0x0282010100");

  // PASSPORT
  await deployPRSASHA2688Dispatcher(deployer, "65537", "SHA2");
  await deployPRSASHA2688Dispatcher(deployer, "3", "SHA2");

  // VERIFIER
  await deployer.deploy(PPerPassport_1_256_3_5_576_248_NAVerifier2__factory);
  await deployer.deploy(PPerPassport_1_256_3_6_576_248_1_2432_5_296Verifier2__factory);
  await deployer.deploy(PPerPassport_21_256_3_7_336_264_21_3072_6_2008Verifier2__factory);
  await deployer.deploy(PPerPassport_2_256_3_6_336_264_21_2448_6_2008Verifier2__factory);
  await deployer.deploy(PPerPassport_1_256_3_6_576_264_1_2448_3_256Verifier2__factory);
  await deployer.deploy(PPerPassport_2_256_3_6_336_248_1_2432_3_256Verifier2__factory);
  await deployer.deploy(PPerPassport_2_256_3_6_576_248_1_2432_3_256Verifier2__factory);
  await deployer.deploy(PPerPassport_11_256_3_3_576_248_1_1184_5_264Verifier2__factory);
  await deployer.deploy(PPerPassport_12_256_3_3_336_232_NAVerifier2__factory);
  await deployer.deploy(PPerPassport_1_256_3_4_336_232_1_1480_5_296Verifier2__factory);
  await deployer.deploy(PPerPassport_1_256_3_4_600_248_1_1496_3_256Verifier2__factory);

  await deployer.deploy(PUniversal2048V2Verifier2__factory);

  await deployer.deploy(PUniversalPSS2048S32E2Verifier2__factory);
  await deployer.deploy(PUniversalPSS2048S32E17Verifier2__factory);
  await deployer.deploy(PUniversalPSS2048S64E17Verifier2__factory);

  await deployer.deploy(PMNEOptVerifier2__factory);
  await deployer.deploy(PMNEOpt2Verifier2__factory);

  console.log("---------------------------------------------------\n");
}

async function displayCertificateUpgradeData(deployer: Deployer, chainName: string, registration: Registration2) {
  console.log("\nCERTIFICATES\n\n");

  const upgrader = new TSSUpgrader(chainName, await registration.getAddress());

  const dispatchersTypes: Record<string, string> = {
    C_RSA_SHA1_4096,
    C_RSA_SHA1_2048,
    C_RSAPSS_SHA2_2048,
    C_RSAPSS_SHA512_2048,
  };

  const dispatchers: BaseContract[] = [
    await deployer.deployed(CRSADispatcher__factory, "CRSADispatcher SHA1 512"),
    await deployer.deployed(CRSADispatcher__factory, "CRSADispatcher SHA1 256"),
    await deployer.deployed(CRSADispatcher__factory, "CRSAPSSDispatcher SHA2 256"),
    await deployer.deployed(CRSADispatcher__factory, "CRSAPSSDispatcher SHA512 256"),
  ];

  let nonce = await registration.getNonce(RegistrationMethodId.AddCertificateDispatcher);

  for (let i = 0; i < Object.keys(dispatchersTypes).length; i++) {
    const dt = Object.keys(dispatchersTypes)[i];

    const data = upgrader.getAddDependencyData(
      RegistrationMethodId.AddCertificateDispatcher,
      dispatchersTypes[dt],
      await dispatchers[i].getAddress(),
      nonce++,
    );

    console.log(++counter, dt, data);
    console.log();
  }
}

async function displayPassportUpgradeData(deployer: Deployer, chainName: string, registration: Registration2) {
  console.log("\nPASSPORTS\n\n");

  const upgrader = new TSSUpgrader(chainName, await registration.getAddress());

  const dispatchersTypes: Record<string, string> = { P_RSA_SHA2_2688, P_RSA_SHA2_2688_3 };

  const dispatchers: BaseContract[] = [
    await deployer.deployed(PRSASHADispatcher__factory, "PRSASHADispatcher 65537 SHA2"),
    await deployer.deployed(PRSASHADispatcher__factory, "PRSASHADispatcher 3 SHA2"),
  ];

  let nonce = await registration.getNonce(RegistrationMethodId.AddPassportDispatcher);

  for (let i = 0; i < Object.keys(dispatchersTypes).length; i++) {
    const dt = Object.keys(dispatchersTypes)[i];

    const data = upgrader.getAddDependencyData(
      RegistrationMethodId.AddPassportDispatcher,
      dispatchersTypes[dt],
      await dispatchers[i].getAddress(),
      nonce++,
    );

    console.log(++counter, dt, data);
    console.log();
  }
}

async function displayVerifierUpgradeData(deployer: Deployer, chainName: string, registration: Registration2) {
  console.log("\nVERIFIERS\n\n");

  const upgrader = new TSSUpgrader(chainName, await registration.getAddress());

  const dispatchersTypes: Record<string, string> = {
    Z_PER_PASSPORT_1_256_3_5_576_248_NA,
    Z_PER_PASSPORT_1_256_3_6_576_248_1_2432_5_296,
    Z_PER_PASSPORT_21_256_3_7_336_264_21_3072_6_2008,
    Z_PER_PASSPORT_2_256_3_6_336_264_21_2448_6_2008,
    Z_PER_PASSPORT_1_256_3_6_576_264_1_2448_3_256,
    Z_PER_PASSPORT_2_256_3_6_336_248_1_2432_3_256,
    Z_PER_PASSPORT_2_256_3_6_576_248_1_2432_3_256,
    Z_PER_PASSPORT_11_256_3_3_576_248_1_1184_5_264,
    Z_PER_PASSPORT_12_256_3_3_336_232_NA,
    Z_PER_PASSPORT_1_256_3_4_336_232_1_1480_5_296,
    Z_PER_PASSPORT_1_256_3_4_600_248_1_1496_3_256,
    Z_UNIVERSAL_2048_V2,
    Z_UNIVERSAL_PSS_2048_S32_E2,
    Z_UNIVERSAL_PSS_2048_S32_E17,
    Z_UNIVERSAL_PSS_2048_S64_E17,
    Z_MNE_OPT,
    Z_MNE_OPT_2,
  };

  const dispatchers: BaseContract[] = [
    await deployer.deployed(PPerPassport_1_256_3_5_576_248_NAVerifier2__factory),
    await deployer.deployed(PPerPassport_1_256_3_6_576_248_1_2432_5_296Verifier2__factory),
    await deployer.deployed(PPerPassport_21_256_3_7_336_264_21_3072_6_2008Verifier2__factory),
    await deployer.deployed(PPerPassport_2_256_3_6_336_264_21_2448_6_2008Verifier2__factory),
    await deployer.deployed(PPerPassport_1_256_3_6_576_264_1_2448_3_256Verifier2__factory),
    await deployer.deployed(PPerPassport_2_256_3_6_336_248_1_2432_3_256Verifier2__factory),
    await deployer.deployed(PPerPassport_2_256_3_6_576_248_1_2432_3_256Verifier2__factory),
    await deployer.deployed(PPerPassport_11_256_3_3_576_248_1_1184_5_264Verifier2__factory),
    await deployer.deployed(PPerPassport_12_256_3_3_336_232_NAVerifier2__factory),
    await deployer.deployed(PPerPassport_1_256_3_4_336_232_1_1480_5_296Verifier2__factory),
    await deployer.deployed(PPerPassport_1_256_3_4_600_248_1_1496_3_256Verifier2__factory),
    await deployer.deployed(PUniversal2048V2Verifier2__factory),
    await deployer.deployed(PUniversalPSS2048S32E2Verifier2__factory),
    await deployer.deployed(PUniversalPSS2048S32E17Verifier2__factory),
    await deployer.deployed(PUniversalPSS2048S64E17Verifier2__factory),
    await deployer.deployed(PMNEOptVerifier2__factory),
    await deployer.deployed(PMNEOpt2Verifier2__factory),
  ];

  let nonce = await registration.getNonce(RegistrationMethodId.AddPassportVerifier);

  for (let i = 0; i < Object.keys(dispatchersTypes).length; i++) {
    const dt = Object.keys(dispatchersTypes)[i];

    const data = upgrader.getAddDependencyData(
      RegistrationMethodId.AddPassportVerifier,
      dispatchersTypes[dt],
      await dispatchers[i].getAddress(),
      nonce++,
    );

    console.log(++counter, dt, data);
    console.log();
  }
}

export = async (deployer: Deployer) => {
  const chainName = "Rarimo-mainnet";
  const registration = await deployer.deployed(Registration2__factory, "0xC0B09085Fa2ad3A8BbF96494B8d5cd10702FE20d");

  await deployAll(deployer);

  await displayCertificateUpgradeData(deployer, chainName, registration);
  await displayPassportUpgradeData(deployer, chainName, registration);
  await displayVerifierUpgradeData(deployer, chainName, registration);
};
