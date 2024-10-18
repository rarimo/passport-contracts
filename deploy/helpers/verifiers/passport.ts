import { Deployer } from "@solarity/hardhat-migrate";

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
  PUniversal2048Verifier2__factory,
  PUniversal2048V2Verifier2__factory,
  PUniversal4096Verifier2__factory,
  PUniversalPSS2048S32E2Verifier2__factory,
  PUniversalPSS2048S32E17Verifier2__factory,
  PUniversalPSS2048S64E17Verifier2__factory,
  PInternalVerifier2__factory,
  PInternalOptVerifier2__factory,
  PMNEOptVerifier2__factory,
  PMNEOpt2Verifier2__factory,
} from "@ethers-v6";

export const deployPVerifiers = async (deployer: Deployer) => {
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

  await deployer.deploy(PUniversal2048Verifier2__factory);
  await deployer.deploy(PUniversal2048V2Verifier2__factory);
  await deployer.deploy(PUniversal4096Verifier2__factory);

  await deployer.deploy(PUniversalPSS2048S32E2Verifier2__factory);
  await deployer.deploy(PUniversalPSS2048S32E17Verifier2__factory);
  await deployer.deploy(PUniversalPSS2048S64E17Verifier2__factory);

  await deployer.deploy(PInternalVerifier2__factory);
  await deployer.deploy(PInternalOptVerifier2__factory);

  await deployer.deploy(PMNEOptVerifier2__factory);
  await deployer.deploy(PMNEOpt2Verifier2__factory);
};
