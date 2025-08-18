import { Deployer } from "@solarity/hardhat-migrate";

import {
  Registration2Mock__factory,
  StateKeeperMock__factory,
  CRSADispatcher__factory,
  PECDSASHA1Dispatcher__factory,
  PNOAADispatcher__factory,
  PRSASHADispatcher__factory,
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
  PPerPassport_1_160_3_4_576_200_NAVerifier2__factory,
  PPerPassport_21_256_3_3_336_232_NAVerifier2__factory,
  PPerPassport_24_256_3_4_336_232_NAVerifier2__factory,
  PPerPassport_1_160_3_3_576_200_NAVerifier2__factory,
  PPerPassport_1_256_3_3_576_248_NAVerifier2__factory,
  PPerPassport_20_256_3_3_336_224_NAVerifier2__factory,
  PPerPassport_10_256_3_3_576_248_1_1184_5_264Verifier2__factory,
  PPerPassport_11_256_3_5_576_248_1_1808_4_256Verifier2__factory,
  PPerPassport_21_256_3_3_576_232_NAVerifier2__factory,
  PPerPassport_2_256_3_6_336_264_1_2448_3_256Verifier2__factory,
  PPerPassport_3_160_3_3_336_200_NAVerifier2__factory,
  PPerPassport_3_160_3_4_576_216_1_1512_3_256Verifier2__factory,
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
  CECDSADispatcher__factory,
  RegistrationSimple__factory,
  PPerPassport_11_256_3_3_576_240_1_864_5_264__factory,
  PPerPassport_11_256_3_5_576_248_1_1808_5_296__factory,
  PPerPassport_21_256_3_4_576_232_NA__factory,
  PPerPassport_11_256_3_3_336_248_NAVerifier2__factory,
  PPerPassport_14_256_3_4_336_64_1_1480_5_296Verifier2__factory,
  PPerPassport_15_512_3_3_336_248_NAVerifier2__factory,
  PPerPassport_1_256_3_6_336_248_1_2744_4_256Verifier2__factory,
  PPerPassport_1_256_3_6_336_560_1_2744_4_256Verifier2__factory,
  PPerPassport_20_160_3_3_736_200_NAVerifier2__factory,
  PPerPassport_20_256_3_5_336_72_NAVerifier2__factory,
  PPerPassport_21_256_3_5_576_232_NAVerifier2__factory,
  PPerPassport_4_160_3_3_336_216_1_1296_3_256Verifier2__factory,
  NoirRegisterIdentity_1_256_3_4_600_248_1_1496_3_256__factory,
  NoirRegisterIdentity_1_256_3_5_336_248_1_2120_4_256__factory,
  NoirRegisterIdentity_10_256_3_3_576_248_1_1184_5_264__factory,
  NoirRegisterIdentity_11_256_3_4_336_232_1_1480_4_256__factory,
  NoirRegisterIdentity_14_256_3_3_576_240_NA__factory,
  NoirRegisterIdentity_14_256_3_4_576_248_1_1496_3_256__factory,
  NoirRegisterIdentity_2_256_3_4_336_232_1_1480_4_256__factory,
  NoirRegisterIdentity_2_256_3_4_336_248_NA__factory,
  NoirRegisterIdentity_2_256_3_6_336_248_1_2432_3_256__factory,
  NoirRegisterIdentity_2_256_3_6_576_248_1_2432_3_256__factory,
  NoirRegisterIdentity_20_160_3_2_576_184_NA__factory,
  NoirRegisterIdentity_20_256_3_3_336_224_NA__factory,
  NoirRegisterIdentity_21_256_3_3_576_232_NA__factory,
  NoirRegisterIdentity_3_512_3_3_336_264_NA__factory,
  NoirRegisterIdentity_2_256_3_6_336_264_21_2448_6_2008__factory,
  NoirRegisterIdentity_21_256_3_4_576_232_NA__factory,
  NoirRegisterIdentity_1_256_3_4_576_232_1_1480_3_256__factory,
  NoirRegisterIdentity_1_256_3_5_576_248_NA__factory,
  NoirRegisterIdentity_1_256_3_6_576_264_1_2448_3_256__factory,
  NoirRegisterIdentity_3_256_3_4_600_248_1_1496_3_256__factory,
  NoirRegisterIdentity_6_160_3_3_336_216_1_1080_3_256__factory,
  NoirRegisterIdentity_11_256_3_3_576_248_NA__factory,
  NoirRegisterIdentity_11_256_3_5_576_248_NA__factory,
  NoirRegisterIdentity_14_256_3_4_336_232_1_1480_5_296__factory,
  NoirRegisterIdentity_20_160_3_3_576_200_NA__factory,
  NoirRegisterIdentity_20_256_3_5_336_248_NA__factory,
  NoirRegisterIdentity_23_160_3_3_576_200_NA__factory,
  NoirRegisterIdentity_24_256_3_4_336_248_NA__factory,
  NoirRegisterIdentity_11_256_3_5_576_248_1_1808_4_256__factory,
  NoirRegisterIdentity_11_256_3_5_576_264_NA__factory,
  NoirRegisterIdentity_11_256_3_5_584_264_1_2136_4_256__factory,
  NoirRegisterIdentity_1_256_3_4_336_232_NA__factory,
  NoirRegisterIdentity_2_256_3_4_336_248_22_1496_7_2408__factory,
  NoirRegisterIdentity_25_384_3_3_336_232_NA__factory,
  NoirRegisterIdentity_25_384_3_4_336_264_1_2904_2_256__factory,
  NoirRegisterIdentity_26_512_3_3_336_248_NA__factory,
  NoirRegisterIdentity_26_512_3_3_336_264_1_1968_2_256__factory,
  NoirRegisterIdentity_27_512_3_4_336_248_NA__factory,
  NoirRegisterIdentity_1_256_3_5_336_248_1_2120_3_256__factory,
  NoirRegisterIdentity_7_160_3_3_336_216_1_1080_3_256__factory,
  NoirRegisterIdentity_8_160_3_3_336_216_1_1080_3_256__factory,
  NoirRegisterIdentity_11_256_3_2_336_216_NA__factory,
  NoirRegisterIdentity_11_256_3_3_336_248_NA__factory,
  NoirRegisterIdentity_11_256_3_3_576_240_1_864_5_264__factory,
  NoirRegisterIdentity_11_256_3_3_576_248_1_1184_5_264__factory,
  NoirRegisterIdentity_11_256_3_4_584_248_1_1496_4_256__factory,
  NoirRegisterIdentity_11_256_3_5_576_248_1_1808_5_296__factory,
  NoirRegisterIdentity_12_256_3_3_336_232_NA__factory,
  NoirRegisterIdentity_15_512_3_3_336_248_NA__factory,
  NoirRegisterIdentity_1_160_3_3_576_200_NA__factory,
  NoirRegisterIdentity_1_256_3_3_576_248_NA__factory,
  NoirRegisterIdentity_1_256_3_4_336_232_1_1480_5_296__factory,
  NoirRegisterIdentity_1_256_3_6_336_248_1_2744_4_256__factory,
  NoirRegisterIdentity_1_256_3_6_576_248_1_2432_5_296__factory,
  NoirRegisterIdentity_21_256_3_3_336_232_NA__factory,
  NoirRegisterIdentity_21_256_3_5_576_232_NA__factory,
  NoirRegisterIdentity_24_256_3_4_336_232_NA__factory,
  NoirRegisterIdentity_25_384_3_3_336_248_NA__factory,
  NoirRegisterIdentity_25_384_3_3_336_264_1_2024_3_296__factory,
  NoirRegisterIdentity_28_384_3_3_576_264_24_2024_4_2792__factory,
  NoirRegisterIdentity_2_256_3_6_336_264_1_2448_3_256__factory,
  NoirRegisterIdentity_3_160_3_3_336_200_NA__factory,
  NoirRegisterIdentity_3_160_3_4_576_216_1_1512_3_256__factory,
  NoirRegisterIdentity_3_256_3_3_576_248_NA__factory,
} from "@ethers-v6";

import {
  C_RSA_SHA1_2048,
  C_RSA_SHA1_4096,
  C_RSA_SHA2_2048,
  C_RSA_SHA2_3072,
  C_RSA_SHA2_4096,
  C_RSA_SHA2_2048_122125,
  C_RSA_SHA2_3072_56611,
  C_RSA_SHA512_2048,
  C_RSA_SHA512_4096,
  C_RSAPSS_SHA2_2048,
  C_RSAPSS_SHA2_3072,
  C_RSAPSS_SHA2_4096,
  C_RSAPSS_SHA2_2048_3,
  C_RSAPSS_SHA512_2048,
  C_RSAPSS_SHA384_2048,
  C_RSAPSS_SHA512_4096,
  C_ECDSA_SECP256R1_SHA1_256,
  C_ECDSA_SECP256R1_SHA1_384,
  C_ECDSA_SECP256R1_SHA1_512,
  C_ECDSA_SECP256R1_SHA2_512,
  C_ECDSA_SECP256R1_SHA2_2048,
  C_ECDSA_SECP384R1_SHA2_512,
  C_ECDSA_SECP256R1_SHA2_768,
  C_ECDSA_SECP384R1_SHA384_512,
  C_ECDSA_BRAINPOOLP256R1_SHA1_448,
  C_ECDSA_BRAINPOOLP256R1_SHA2_512,
  C_ECDSA_BRAINPOOLP384R1_SHA2_512,
  C_ECDSA_BRAINPOOLP384R1_SHA384_512,
  C_ECDSA_BRAINPOOLP384R1_SHA384_768,
  C_ECDSA_BRAINPOOLP512R1_SHA512_1024,
  P_ECDSA_SHA1_2704,
  P_NO_AA,
  P_RSA_SHA1_2688,
  P_RSA_SHA1_2688_3,
  P_RSA_SHA256_2688,
  P_RSA_SHA256_2688_3,
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
  Z_PER_PASSPORT_1_160_3_4_576_200_NA,
  Z_PER_PASSPORT_21_256_3_3_336_232_NA,
  Z_PER_PASSPORT_24_256_3_4_336_232_NA,
  Z_PER_PASSPORT_1_160_3_3_576_200_NA,
  Z_PER_PASSPORT_1_256_3_3_576_248_NA,
  Z_PER_PASSPORT_20_256_3_3_336_224_NA,
  Z_PER_PASSPORT_10_256_3_3_576_248_1_1184_5_264,
  Z_PER_PASSPORT_11_256_3_5_576_248_1_1808_4_256,
  Z_PER_PASSPORT_21_256_3_3_576_232_NA,
  Z_PER_PASSPORT_2_256_3_6_336_264_1_2448_3_256,
  Z_PER_PASSPORT_3_160_3_3_336_200_NA,
  Z_PER_PASSPORT_3_160_3_4_576_216_1_1512_3_256,
  Z_UNIVERSAL_2048,
  Z_UNIVERSAL_2048_V2,
  Z_UNIVERSAL_4096,
  Z_UNIVERSAL_PSS_2048_S32_E2,
  Z_UNIVERSAL_PSS_2048_S32_E17,
  Z_UNIVERSAL_PSS_2048_S64_E17,
  Z_INTERNAL,
  Z_INTERNAL_OPT,
  Z_MNE_OPT,
  Z_MNE_OPT_2,
  Z_PER_PASSPORT_11_256_3_3_576_240_1_864_5_264,
  Z_PER_PASSPORT_11_256_3_5_576_248_1_1808_5_296,
  Z_PER_PASSPORT_21_256_3_4_576_232_NA,
  Z_PER_PASSPORT_11_256_3_3_336_248_NA,
  Z_PER_PASSPORT_14_256_3_4_336_64_1_1480_5_296,
  Z_PER_PASSPORT_15_512_3_3_336_248_NA,
  Z_PER_PASSPORT_1_256_3_6_336_248_1_2744_4_256,
  Z_PER_PASSPORT_1_256_3_6_336_560_1_2744_4_256,
  Z_PER_PASSPORT_20_160_3_3_736_200_NA,
  Z_PER_PASSPORT_20_256_3_5_336_72_NA,
  Z_PER_PASSPORT_21_256_3_5_576_232_NA,
  Z_PER_PASSPORT_4_160_3_3_336_216_1_1296_3_256,
  Z_NOIR_PASSPORT_1_256_3_4_600_248_1_1496_3_256,
  Z_NOIR_PASSPORT_1_256_3_5_336_248_1_2120_4_256,
  Z_NOIR_PASSPORT_10_256_3_3_576_248_1_1184_5_264,
  Z_NOIR_PASSPORT_11_256_3_4_336_232_1_1480_4_256,
  Z_NOIR_PASSPORT_14_256_3_3_576_240_NA,
  Z_NOIR_PASSPORT_14_256_3_4_576_248_1_1496_3_256,
  Z_NOIR_PASSPORT_2_256_3_4_336_232_1_1480_4_256,
  Z_NOIR_PASSPORT_2_256_3_4_336_248_NA,
  Z_NOIR_PASSPORT_2_256_3_6_336_248_1_2432_3_256,
  Z_NOIR_PASSPORT_2_256_3_6_576_248_1_2432_3_256,
  Z_NOIR_PASSPORT_20_160_3_2_576_184_NA,
  Z_NOIR_PASSPORT_20_256_3_3_336_224_NA,
  Z_NOIR_PASSPORT_21_256_3_3_576_232_NA,
  Z_NOIR_PASSPORT_3_512_3_3_336_264_NA,
  Z_NOIR_PASSPORT_2_256_3_6_336_264_21_2448_6_2008,
  Z_NOIR_PASSPORT_21_256_3_4_576_232_NA,
  Z_NOIR_PASSPORT_1_256_3_4_576_232_1_1480_3_256,
  Z_NOIR_PASSPORT_1_256_3_5_576_248_NA,
  Z_NOIR_PASSPORT_1_256_3_6_576_264_1_2448_3_256,
  Z_NOIR_PASSPORT_3_256_3_4_600_248_1_1496_3_256,
  Z_NOIR_PASSPORT_6_160_3_3_336_216_1_1080_3_256,
  Z_NOIR_PASSPORT_11_256_3_3_576_248_NA,
  Z_NOIR_PASSPORT_11_256_3_5_576_248_NA,
  Z_NOIR_PASSPORT_14_256_3_4_336_232_1_1480_5_296,
  Z_NOIR_PASSPORT_20_160_3_3_576_200_NA,
  Z_NOIR_PASSPORT_20_256_3_5_336_248_NA,
  Z_NOIR_PASSPORT_23_160_3_3_576_200_NA,
  Z_NOIR_PASSPORT_24_256_3_4_336_248_NA,
  Z_NOIR_PASSPORT_11_256_3_5_576_248_1_1808_4_256,
  Z_NOIR_PASSPORT_11_256_3_5_576_264_NA,
  Z_NOIR_PASSPORT_11_256_3_5_584_264_1_2136_4_256,
  Z_NOIR_PASSPORT_1_256_3_4_336_232_NA,
  Z_NOIR_PASSPORT_2_256_3_4_336_248_22_1496_7_2408,
  Z_NOIR_PASSPORT_25_384_3_3_336_232_NA,
  Z_NOIR_PASSPORT_25_384_3_4_336_264_1_2904_2_256,
  Z_NOIR_PASSPORT_26_512_3_3_336_248_NA,
  Z_NOIR_PASSPORT_26_512_3_3_336_264_1_1968_2_256,
  Z_NOIR_PASSPORT_27_512_3_4_336_248_NA,
  Z_NOIR_PASSPORT_1_256_3_5_336_248_1_2120_3_256,
  Z_NOIR_PASSPORT_7_160_3_3_336_216_1_1080_3_256,
  Z_NOIR_PASSPORT_8_160_3_3_336_216_1_1080_3_256,
  Z_NOIR_PASSPORT_11_256_3_2_336_216_NA,
  Z_NOIR_PASSPORT_11_256_3_3_336_248_NA,
  Z_NOIR_PASSPORT_11_256_3_3_576_240_1_864_5_264,
  Z_NOIR_PASSPORT_11_256_3_3_576_248_1_1184_5_264,
  Z_NOIR_PASSPORT_11_256_3_4_584_248_1_1496_4_256,
  Z_NOIR_PASSPORT_11_256_3_5_576_248_1_1808_5_296,
  Z_NOIR_PASSPORT_12_256_3_3_336_232_NA,
  Z_NOIR_PASSPORT_15_512_3_3_336_248_NA,
  Z_NOIR_PASSPORT_1_160_3_3_576_200_NA,
  Z_NOIR_PASSPORT_1_256_3_3_576_248_NA,
  Z_NOIR_PASSPORT_1_256_3_4_336_232_1_1480_5_296,
  Z_NOIR_PASSPORT_1_256_3_6_336_248_1_2744_4_256,
  Z_NOIR_PASSPORT_1_256_3_6_576_248_1_2432_5_296,
  Z_NOIR_PASSPORT_21_256_3_3_336_232_NA,
  Z_NOIR_PASSPORT_21_256_3_5_576_232_NA,
  Z_NOIR_PASSPORT_24_256_3_4_336_232_NA,
  Z_NOIR_PASSPORT_25_384_3_3_336_248_NA,
  Z_NOIR_PASSPORT_25_384_3_3_336_264_1_2024_3_296,
  Z_NOIR_PASSPORT_28_384_3_3_576_264_24_2024_4_2792,
  Z_NOIR_PASSPORT_2_256_3_6_336_264_1_2448_3_256,
  Z_NOIR_PASSPORT_3_160_3_3_336_200_NA,
  Z_NOIR_PASSPORT_3_160_3_4_576_216_1_1512_3_256,
  Z_NOIR_PASSPORT_3_256_3_3_576_248_NA,
} from "@/scripts/utils/types";

import { getConfig } from "./config/config";

export = async (deployer: Deployer) => {
  const config = (await getConfig())!;
  const stateKeeper = await deployer.deployed(StateKeeperMock__factory, "StateKeeper Proxy");
  const registration = await deployer.deployed(Registration2Mock__factory, "Registration2 Proxy");
  const registrationSimple = await deployer.deployed(RegistrationSimple__factory, "RegistrationSimple Proxy");

  // ------------------------ CERTIFICATE ------------------------

  const cRsa4096Sha1Dispatcher = await deployer.deployed(CRSADispatcher__factory, "CRSADispatcher SHA1 512 65537");
  const cRsa2048Sha1Dispatcher = await deployer.deployed(CRSADispatcher__factory, "CRSADispatcher SHA1 256 65537");
  const cRsa4096Sha2Dispatcher = await deployer.deployed(CRSADispatcher__factory, "CRSADispatcher SHA2 512 65537");
  const cRsa3072Sha2Dispatcher = await deployer.deployed(CRSADispatcher__factory, "CRSADispatcher SHA2 384 65537");
  const cRsa2048Sha2Dispatcher = await deployer.deployed(CRSADispatcher__factory, "CRSADispatcher SHA2 256 65537");
  const cRsa4096Sha256Dispatcher = await deployer.deployed(CRSADispatcher__factory, "CRSADispatcher SHA512 256 65537");
  const cRsa4096Sha512Dispatcher = await deployer.deployed(CRSADispatcher__factory, "CRSADispatcher SHA512 512 65537");
  const cRsa3072Sha2Dispatcher_56611 = await deployer.deployed(
    CRSADispatcher__factory,
    "CRSADispatcher SHA2 512 56611",
  );
  const cRsa2048Sha2Dispatcher_122125 = await deployer.deployed(
    CRSADispatcher__factory,
    "CRSADispatcher SHA2 256 122125",
  );

  const cRsaPss2048Sha2Dispatcher = await deployer.deployed(
    CRSADispatcher__factory,
    "CRSAPSSDispatcher SHA2 65537 256 0x0282010100",
  );
  const cRsaPss4096Sha2Dispatcher = await deployer.deployed(
    CRSADispatcher__factory,
    "CRSAPSSDispatcher SHA2 65537 512 0x0282020100",
  );
  const cRsaPss2048Sha512Dispatcher = await deployer.deployed(
    CRSADispatcher__factory,
    "CRSAPSSDispatcher SHA512 65537 256 0x0282010100",
  );
  const cRsaPss4096Sha512Dispatcher = await deployer.deployed(
    CRSADispatcher__factory,
    "CRSAPSSDispatcher SHA512 65537 512 0x0282020100",
  );

  const cRsaPss2048Sha2Dispatcher_3 = await deployer.deployed(
    CRSADispatcher__factory,
    "CRSAPSSDispatcher SHA2 3 384 0x0282010100",
  );
  const cRsaPss3072Sha2Dispatcher = await deployer.deployed(
    CRSADispatcher__factory,
    "CRSAPSSDispatcher SHA2 65537 512 0x0282018100",
  );
  const cRsaPss3072Sha384Dispatcher = await deployer.deployed(
    CRSADispatcher__factory,
    "CRSAPSSDispatcher SHA384 65537 512 0x0282010100",
  );

  const cEcdsaSecp256r1256Sha1Dispatcher = await deployer.deployed(
    CECDSADispatcher__factory,
    "CECDSADispatcher SECP256 SHA1 64",
  );

  const cEcdsaSecp256r1384Sha1Dispatcher = await deployer.deployed(
    CECDSADispatcher__factory,
    "CECDSADispatcher SECP256 SHA1 96",
  );

  const cEcdsaSecp256r1512Sha1Dispatcher = await deployer.deployed(
    CECDSADispatcher__factory,
    "CECDSADispatcher SECP256 SHA1 128",
  );

  const cEcdsaSecp256r1512Sha2Dispatcher = await deployer.deployed(
    CECDSADispatcher__factory,
    "CECDSADispatcher SECP256 SHA2 128",
  );

  const cEcdsaSecp256r1768Sha2Dispatcher = await deployer.deployed(
    CECDSADispatcher__factory,
    "CECDSADispatcher SECP256 SHA2 192",
  );

  const cEcdsaSecp256r12048Sha2Dispatcher = await deployer.deployed(
    CECDSADispatcher__factory,
    "CECDSADispatcher SECP256 SHA2 512",
  );

  const cEcdsaBrainpoolP256r1128Sha2Dispatcher = await deployer.deployed(
    CECDSADispatcher__factory,
    "CECDSADispatcher brainpoolP256r1 SHA2 128",
  );

  const cEcdsaBrainpoolP256r1112Sha1Dispatcher = await deployer.deployed(
    CECDSADispatcher__factory,
    "CECDSADispatcher brainpoolP256r1 SHA1 112",
  );

  const cEcdsaSecp384r1512Sha2Dispatcher = await deployer.deployed(
    CECDSADispatcher__factory,
    "CECDSADispatcher SECP384 SHA2 64",
  );
  const cEcdsaSecp384r1512Sha384Dispatcher = await deployer.deployed(
    CECDSADispatcher__factory,
    "CECDSADispatcher SECP384 SHA384 64",
  );
  const cEcdsaBrainpoolP384r1512Sha2Dispatcher = await deployer.deployed(
    CECDSADispatcher__factory,
    "CECDSADispatcher brainpoolP384r1 SHA2 64",
  );
  const cEcdsaBrainpoolP384r1512Sha384Dispatcher = await deployer.deployed(
    CECDSADispatcher__factory,
    "CECDSADispatcher brainpoolP384r1 SHA384 64",
  );
  const cEcdsaBrainpoolP384r1768Sha384Dispatcher = await deployer.deployed(
    CECDSADispatcher__factory,
    "CECDSADispatcher brainpoolP384r1 SHA384 96",
  );
  const cEcdsaBrainpoolP512r11024Sha512Dispatcher = await deployer.deployed(
    CECDSADispatcher__factory,
    "CECDSADispatcher brainpoolP512r1 SHA512 128",
  );

  // -------------------------- PASSPORT --------------------------

  const pRsaSha12688Dispatcher = await deployer.deployed(PRSASHADispatcher__factory, "PRSASHADispatcher 65537 SHA1");
  const pRsaSha126883Dispatcher = await deployer.deployed(PRSASHADispatcher__factory, "PRSASHADispatcher 3 SHA1");

  const pRsaSha22688Dispatcher = await deployer.deployed(PRSASHADispatcher__factory, "PRSASHADispatcher 65537 SHA2");
  const pRsaSha226883Dispatcher = await deployer.deployed(PRSASHADispatcher__factory, "PRSASHADispatcher 3 SHA2");

  const pEcdsaSha12704Dispatcher = await deployer.deployed(PECDSASHA1Dispatcher__factory);

  const pNoAaDispatcher = await deployer.deployed(PNOAADispatcher__factory);

  // -------------------------- VERIFIER --------------------------

  const pPerPassport_1_256_3_5_576_248_NAVerifier = await deployer.deployed(
    PPerPassport_1_256_3_5_576_248_NAVerifier2__factory,
  );
  const pPerPassport_1_256_3_6_576_248_1_2432_5_296Verifier = await deployer.deployed(
    PPerPassport_1_256_3_6_576_248_1_2432_5_296Verifier2__factory,
  );
  const pPerPassport_21_256_3_7_336_264_21_3072_6_2008Verifier = await deployer.deployed(
    PPerPassport_21_256_3_7_336_264_21_3072_6_2008Verifier2__factory,
  );
  const pPerPassport_2_256_3_6_336_264_21_2448_6_2008Verifier = await deployer.deployed(
    PPerPassport_2_256_3_6_336_264_21_2448_6_2008Verifier2__factory,
  );
  const pPerPassport_1_256_3_6_576_264_1_2448_3_256Verifier = await deployer.deployed(
    PPerPassport_1_256_3_6_576_264_1_2448_3_256Verifier2__factory,
  );
  const pPerPassport_2_256_3_6_336_248_1_2432_3_256Verifier = await deployer.deployed(
    PPerPassport_2_256_3_6_336_248_1_2432_3_256Verifier2__factory,
  );
  const pPerPassport_2_256_3_6_576_248_1_2432_3_256Verifier = await deployer.deployed(
    PPerPassport_2_256_3_6_576_248_1_2432_3_256Verifier2__factory,
  );
  const pPerPassport_11_256_3_3_576_248_1_1184_5_264Verifier = await deployer.deployed(
    PPerPassport_11_256_3_3_576_248_1_1184_5_264Verifier2__factory,
  );
  const pPerPassport_12_256_3_3_336_232_NAVerifier = await deployer.deployed(
    PPerPassport_12_256_3_3_336_232_NAVerifier2__factory,
  );
  const pPerPassport_1_256_3_4_336_232_1_1480_5_296Verifier = await deployer.deployed(
    PPerPassport_1_256_3_4_336_232_1_1480_5_296Verifier2__factory,
  );
  const pPerPassport_1_256_3_4_600_248_1_1496_3_256Verifier = await deployer.deployed(
    PPerPassport_1_256_3_4_600_248_1_1496_3_256Verifier2__factory,
  );
  const pPerPassport_1_160_3_4_576_200_NAVerifier = await deployer.deployed(
    PPerPassport_1_160_3_4_576_200_NAVerifier2__factory,
  );
  const pPerPassport_21_256_3_3_336_232_NAVerifier = await deployer.deployed(
    PPerPassport_21_256_3_3_336_232_NAVerifier2__factory,
  );
  const pPerPassport_24_256_3_4_336_232_NAVerifier = await deployer.deployed(
    PPerPassport_24_256_3_4_336_232_NAVerifier2__factory,
  );
  const pPerPassport_1_160_3_3_576_200_NAVerifier = await deployer.deployed(
    PPerPassport_1_160_3_3_576_200_NAVerifier2__factory,
  );
  const pPerPassport_1_256_3_3_576_248_NAVerifier = await deployer.deployed(
    PPerPassport_1_256_3_3_576_248_NAVerifier2__factory,
  );
  const pPerPassport_20_256_3_3_336_224_NAVerifier = await deployer.deployed(
    PPerPassport_20_256_3_3_336_224_NAVerifier2__factory,
  );
  const pPerPassport_10_256_3_3_576_248_1_1184_5_264Verifier = await deployer.deployed(
    PPerPassport_10_256_3_3_576_248_1_1184_5_264Verifier2__factory,
  );
  const pPerPassport_11_256_3_5_576_248_1_1808_4_256Verifier = await deployer.deployed(
    PPerPassport_11_256_3_5_576_248_1_1808_4_256Verifier2__factory,
  );
  const pPerPassport_21_256_3_3_576_232_NAVerifier = await deployer.deployed(
    PPerPassport_21_256_3_3_576_232_NAVerifier2__factory,
  );
  const pPerPassport_2_256_3_6_336_264_1_2448_3_256Verifier = await deployer.deployed(
    PPerPassport_2_256_3_6_336_264_1_2448_3_256Verifier2__factory,
  );
  const pPerPassport_3_160_3_3_336_200_NAVerifier = await deployer.deployed(
    PPerPassport_3_160_3_3_336_200_NAVerifier2__factory,
  );
  const pPerPassport_3_160_3_4_576_216_1_1512_3_256Verifier = await deployer.deployed(
    PPerPassport_3_160_3_4_576_216_1_1512_3_256Verifier2__factory,
  );
  const pPerPassport_11_256_3_3_576_240_1_864_5_264Verifier = await deployer.deployed(
    PPerPassport_11_256_3_3_576_240_1_864_5_264__factory,
  );
  const pPerPassport_11_256_3_5_576_248_1_1808_5_296Verifier = await deployer.deployed(
    PPerPassport_11_256_3_5_576_248_1_1808_5_296__factory,
  );
  const pPerPassport_21_256_3_4_576_232_NAVerifier = await deployer.deployed(
    PPerPassport_21_256_3_4_576_232_NA__factory,
  );
  const pPerPassport_11_256_3_3_336_248_NAVerifier = await deployer.deployed(
    PPerPassport_11_256_3_3_336_248_NAVerifier2__factory,
  );
  const pPerPassport_14_256_3_4_336_64_1_1480_5_296Verifier = await deployer.deployed(
    PPerPassport_14_256_3_4_336_64_1_1480_5_296Verifier2__factory,
  );
  const pPerPassport_15_512_3_3_336_248_NAVerifier = await deployer.deployed(
    PPerPassport_15_512_3_3_336_248_NAVerifier2__factory,
  );
  const pPerPassport_1_256_3_6_336_248_1_2744_4_256Verifier = await deployer.deployed(
    PPerPassport_1_256_3_6_336_248_1_2744_4_256Verifier2__factory,
  );
  const pPerPassport_1_256_3_6_336_560_1_2744_4_256Verifier = await deployer.deployed(
    PPerPassport_1_256_3_6_336_560_1_2744_4_256Verifier2__factory,
  );
  const pPerPassport_20_160_3_3_736_200_NAVerifier = await deployer.deployed(
    PPerPassport_20_160_3_3_736_200_NAVerifier2__factory,
  );
  const pPerPassport_20_256_3_5_336_72_NAVerifier = await deployer.deployed(
    PPerPassport_20_256_3_5_336_72_NAVerifier2__factory,
  );
  const pPerPassport_21_256_3_5_576_232_NAVerifier = await deployer.deployed(
    PPerPassport_21_256_3_5_576_232_NAVerifier2__factory,
  );
  const pPerPassport_4_160_3_3_336_216_1_1296_3_256Verifier = await deployer.deployed(
    PPerPassport_4_160_3_3_336_216_1_1296_3_256Verifier2__factory,
  );

  const pUniversal2048Verifier = await deployer.deployed(PUniversal2048Verifier2__factory);
  const pUniversal2048V2Verifier = await deployer.deployed(PUniversal2048V2Verifier2__factory);
  const pUniversal4096Verifier = await deployer.deployed(PUniversal4096Verifier2__factory);

  const pUniversalPSS2048S32E2Verifier = await deployer.deployed(PUniversalPSS2048S32E2Verifier2__factory);
  const pUniversalPSS2048S32E17Verifier = await deployer.deployed(PUniversalPSS2048S32E17Verifier2__factory);
  const pUniversalPSS2048S64E17Verifier = await deployer.deployed(PUniversalPSS2048S64E17Verifier2__factory);

  const pInternalVerifier = await deployer.deployed(PInternalVerifier2__factory);
  const pInternalOptVerifier = await deployer.deployed(PInternalOptVerifier2__factory);

  const pMneOptVerifier = await deployer.deployed(PMNEOptVerifier2__factory);
  const pMneOpt2Verifier = await deployer.deployed(PMNEOpt2Verifier2__factory);

  const pNoirPassport_1_256_3_4_600_248_1_1496_3_256 = await deployer.deployed(
    NoirRegisterIdentity_1_256_3_4_600_248_1_1496_3_256__factory,
  );
  const pNoirPassport_1_256_3_5_336_248_1_2120_4_256 = await deployer.deployed(
    NoirRegisterIdentity_1_256_3_5_336_248_1_2120_4_256__factory,
  );
  const pNoirPassport_10_256_3_3_576_248_1_1184_5_264 = await deployer.deployed(
    NoirRegisterIdentity_10_256_3_3_576_248_1_1184_5_264__factory,
  );
  const pNoirPassport_11_256_3_4_336_232_1_1480_4_256 = await deployer.deployed(
    NoirRegisterIdentity_11_256_3_4_336_232_1_1480_4_256__factory,
  );
  const pNoirPassport_14_256_3_3_576_240_NA = await deployer.deployed(
    NoirRegisterIdentity_14_256_3_3_576_240_NA__factory,
  );
  const pNoirPassport_14_256_3_4_576_248_1_1496_3_256 = await deployer.deployed(
    NoirRegisterIdentity_14_256_3_4_576_248_1_1496_3_256__factory,
  );
  const pNoirPassport_2_256_3_4_336_232_1_1480_4_256 = await deployer.deployed(
    NoirRegisterIdentity_2_256_3_4_336_232_1_1480_4_256__factory,
  );
  const pNoirPassport_2_256_3_4_336_248_NA = await deployer.deployed(
    NoirRegisterIdentity_2_256_3_4_336_248_NA__factory,
  );
  const pNoirPassport_2_256_3_6_336_248_1_2432_3_256 = await deployer.deployed(
    NoirRegisterIdentity_2_256_3_6_336_248_1_2432_3_256__factory,
  );
  const pNoirPassport_2_256_3_6_576_248_1_2432_3_256 = await deployer.deployed(
    NoirRegisterIdentity_2_256_3_6_576_248_1_2432_3_256__factory,
  );
  const pNoirPassport_20_160_3_2_576_184_NA = await deployer.deployed(
    NoirRegisterIdentity_20_160_3_2_576_184_NA__factory,
  );
  const pNoirPassport_20_256_3_3_336_224_NA = await deployer.deployed(
    NoirRegisterIdentity_20_256_3_3_336_224_NA__factory,
  );
  const pNoirPassport_21_256_3_3_576_232_NA = await deployer.deployed(
    NoirRegisterIdentity_21_256_3_3_576_232_NA__factory,
  );
  const pNoirPassport_3_512_3_3_336_264_NA = await deployer.deployed(
    NoirRegisterIdentity_3_512_3_3_336_264_NA__factory,
  );
  const pNoirPassport_2_256_3_6_336_264_21_2448_6_2008 = await deployer.deployed(
    NoirRegisterIdentity_2_256_3_6_336_264_21_2448_6_2008__factory,
  );
  const pNoirPassport_21_256_3_4_576_232_NA = await deployer.deployed(
    NoirRegisterIdentity_21_256_3_4_576_232_NA__factory,
  );
  const pNoirPassport_1_256_3_4_576_232_1_1480_3_256 = await deployer.deployed(
    NoirRegisterIdentity_1_256_3_4_576_232_1_1480_3_256__factory,
  );
  const pNoirPassport_1_256_3_5_576_248_NA = await deployer.deployed(
    NoirRegisterIdentity_1_256_3_5_576_248_NA__factory,
  );
  const pNoirPassport_1_256_3_6_576_264_1_2448_3_256 = await deployer.deployed(
    NoirRegisterIdentity_1_256_3_6_576_264_1_2448_3_256__factory,
  );
  const pNoirPassport_3_256_3_4_600_248_1_1496_3_256 = await deployer.deployed(
    NoirRegisterIdentity_3_256_3_4_600_248_1_1496_3_256__factory,
  );
  const pNoirPassport_6_160_3_3_336_216_1_1080_3_256 = await deployer.deployed(
    NoirRegisterIdentity_6_160_3_3_336_216_1_1080_3_256__factory,
  );
  const pNoirPassport_11_256_3_3_576_248_NA = await deployer.deployed(
    NoirRegisterIdentity_11_256_3_3_576_248_NA__factory,
  );
  const pNoirPassport_11_256_3_5_576_248_NA = await deployer.deployed(
    NoirRegisterIdentity_11_256_3_5_576_248_NA__factory,
  );
  const pNoirPassport_14_256_3_4_336_232_1_1480_5_296 = await deployer.deployed(
    NoirRegisterIdentity_14_256_3_4_336_232_1_1480_5_296__factory,
  );
  const pNoirPassport_20_160_3_3_576_200_NA = await deployer.deployed(
    NoirRegisterIdentity_20_160_3_3_576_200_NA__factory,
  );
  const pNoirPassport_20_256_3_5_336_248_NA = await deployer.deployed(
    NoirRegisterIdentity_20_256_3_5_336_248_NA__factory,
  );
  const pNoirPassport_23_160_3_3_576_200_NA = await deployer.deployed(
    NoirRegisterIdentity_23_160_3_3_576_200_NA__factory,
  );
  const pNoirPassport_24_256_3_4_336_248_NA = await deployer.deployed(
    NoirRegisterIdentity_24_256_3_4_336_248_NA__factory,
  );

  const pNoirPassport_11_256_3_5_576_248_1_1808_4_256 = await deployer.deployed(
    NoirRegisterIdentity_11_256_3_5_576_248_1_1808_4_256__factory,
  );
  const pNoirPassport_11_256_3_5_576_264_NA = await deployer.deployed(
    NoirRegisterIdentity_11_256_3_5_576_264_NA__factory,
  );
  const pNoirPassport_11_256_3_5_584_264_1_2136_4_256 = await deployer.deployed(
    NoirRegisterIdentity_11_256_3_5_584_264_1_2136_4_256__factory,
  );
  const pNoirPassport_1_256_3_4_336_232_NA = await deployer.deployed(
    NoirRegisterIdentity_1_256_3_4_336_232_NA__factory,
  );
  const pNoirPassport_2_256_3_4_336_248_22_1496_7_2408 = await deployer.deployed(
    NoirRegisterIdentity_2_256_3_4_336_248_22_1496_7_2408__factory,
  );

  const pNoirPassport_25_384_3_3_336_232_NA = await deployer.deployed(
    NoirRegisterIdentity_25_384_3_3_336_232_NA__factory,
  );
  const pNoirPassport_25_384_3_4_336_264_1_2904_2_256 = await deployer.deployed(
    NoirRegisterIdentity_25_384_3_4_336_264_1_2904_2_256__factory,
  );
  const pNoirPassport_26_512_3_3_336_248_NA = await deployer.deployed(
    NoirRegisterIdentity_26_512_3_3_336_248_NA__factory,
  );
  const pNoirPassport_26_512_3_3_336_264_1_1968_2_256 = await deployer.deployed(
    NoirRegisterIdentity_26_512_3_3_336_264_1_1968_2_256__factory,
  );
  const pNoirPassport_27_512_3_4_336_248_NA = await deployer.deployed(
    NoirRegisterIdentity_27_512_3_4_336_248_NA__factory,
  );

  const pNoirPassport_1_256_3_5_336_248_1_2120_3_256 = await deployer.deployed(
    NoirRegisterIdentity_1_256_3_5_336_248_1_2120_3_256__factory,
  );
  const pNoirPassport_7_160_3_3_336_216_1_1080_3_256 = await deployer.deployed(
    NoirRegisterIdentity_7_160_3_3_336_216_1_1080_3_256__factory,
  );
  const pNoirPassport_8_160_3_3_336_216_1_1080_3_256 = await deployer.deployed(
    NoirRegisterIdentity_8_160_3_3_336_216_1_1080_3_256__factory,
  );

  const pNoirPassport_11_256_3_2_336_216_NA = await deployer.deployed(
    NoirRegisterIdentity_11_256_3_2_336_216_NA__factory,
  );
  const pNoirPassport_11_256_3_3_336_248_NA = await deployer.deployed(
    NoirRegisterIdentity_11_256_3_3_336_248_NA__factory,
  );
  const pNoirPassport_11_256_3_3_576_240_1_864_5_264 = await deployer.deployed(
    NoirRegisterIdentity_11_256_3_3_576_240_1_864_5_264__factory,
  );
  const pNoirPassport_11_256_3_3_576_248_1_1184_5_264 = await deployer.deployed(
    NoirRegisterIdentity_11_256_3_3_576_248_1_1184_5_264__factory,
  );
  const pNoirPassport_11_256_3_4_584_248_1_1496_4_256 = await deployer.deployed(
    NoirRegisterIdentity_11_256_3_4_584_248_1_1496_4_256__factory,
  );
  const pNoirPassport_11_256_3_5_576_248_1_1808_5_296 = await deployer.deployed(
    NoirRegisterIdentity_11_256_3_5_576_248_1_1808_5_296__factory,
  );
  const pNoirPassport_12_256_3_3_336_232_NA = await deployer.deployed(
    NoirRegisterIdentity_12_256_3_3_336_232_NA__factory,
  );
  const pNoirPassport_15_512_3_3_336_248_NA = await deployer.deployed(
    NoirRegisterIdentity_15_512_3_3_336_248_NA__factory,
  );
  const pNoirPassport_1_160_3_3_576_200_NA = await deployer.deployed(
    NoirRegisterIdentity_1_160_3_3_576_200_NA__factory,
  );
  const pNoirPassport_1_256_3_3_576_248_NA = await deployer.deployed(
    NoirRegisterIdentity_1_256_3_3_576_248_NA__factory,
  );
  const pNoirPassport_1_256_3_4_336_232_1_1480_5_296 = await deployer.deployed(
    NoirRegisterIdentity_1_256_3_4_336_232_1_1480_5_296__factory,
  );
  const pNoirPassport_1_256_3_6_336_248_1_2744_4_256 = await deployer.deployed(
    NoirRegisterIdentity_1_256_3_6_336_248_1_2744_4_256__factory,
  );
  const pNoirPassport_1_256_3_6_576_248_1_2432_5_296 = await deployer.deployed(
    NoirRegisterIdentity_1_256_3_6_576_248_1_2432_5_296__factory,
  );
  const pNoirPassport_21_256_3_3_336_232_NA = await deployer.deployed(
    NoirRegisterIdentity_21_256_3_3_336_232_NA__factory,
  );
  const pNoirPassport_21_256_3_5_576_232_NA = await deployer.deployed(
    NoirRegisterIdentity_21_256_3_5_576_232_NA__factory,
  );
  const pNoirPassport_24_256_3_4_336_232_NA = await deployer.deployed(
    NoirRegisterIdentity_24_256_3_4_336_232_NA__factory,
  );
  const pNoirPassport_25_384_3_3_336_248_NA = await deployer.deployed(
    NoirRegisterIdentity_25_384_3_3_336_248_NA__factory,
  );
  const pNoirPassport_25_384_3_3_336_264_1_2024_3_296 = await deployer.deployed(
    NoirRegisterIdentity_25_384_3_3_336_264_1_2024_3_296__factory,
  );
  const pNoirPassport_28_384_3_3_576_264_24_2024_4_2792 = await deployer.deployed(
    NoirRegisterIdentity_28_384_3_3_576_264_24_2024_4_2792__factory,
  );
  const pNoirPassport_2_256_3_6_336_264_1_2448_3_256 = await deployer.deployed(
    NoirRegisterIdentity_2_256_3_6_336_264_1_2448_3_256__factory,
  );
  const pNoirPassport_3_160_3_3_336_200_NA = await deployer.deployed(
    NoirRegisterIdentity_3_160_3_3_336_200_NA__factory,
  );
  const pNoirPassport_3_160_3_4_576_216_1_1512_3_256 = await deployer.deployed(
    NoirRegisterIdentity_3_160_3_4_576_216_1_1512_3_256__factory,
  );
  const pNoirPassport_3_256_3_3_576_248_NA = await deployer.deployed(
    NoirRegisterIdentity_3_256_3_3_576_248_NA__factory,
  );

  // ------------------------ CERTIFICATE ------------------------

  await registration.mockAddCertificateDispatcher(C_RSA_SHA1_4096, await cRsa4096Sha1Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSA_SHA1_2048, await cRsa2048Sha1Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSA_SHA2_4096, await cRsa4096Sha2Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSA_SHA2_3072, await cRsa3072Sha2Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSA_SHA2_2048, await cRsa2048Sha2Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSA_SHA512_2048, await cRsa4096Sha256Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSA_SHA512_4096, await cRsa4096Sha512Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(
    C_RSA_SHA2_3072_56611,
    await cRsa3072Sha2Dispatcher_56611.getAddress(),
  );
  await registration.mockAddCertificateDispatcher(
    C_RSA_SHA2_2048_122125,
    await cRsa2048Sha2Dispatcher_122125.getAddress(),
  );

  await registration.mockAddCertificateDispatcher(C_RSAPSS_SHA2_2048, await cRsaPss2048Sha2Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSAPSS_SHA2_4096, await cRsaPss4096Sha2Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSAPSS_SHA512_2048, await cRsaPss2048Sha512Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSAPSS_SHA512_4096, await cRsaPss4096Sha512Dispatcher.getAddress());

  await registration.mockAddCertificateDispatcher(C_RSAPSS_SHA2_2048_3, await cRsaPss2048Sha2Dispatcher_3.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSAPSS_SHA2_3072, await cRsaPss3072Sha2Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSAPSS_SHA384_2048, await cRsaPss3072Sha384Dispatcher.getAddress());

  await registration.mockAddCertificateDispatcher(
    C_ECDSA_SECP256R1_SHA1_256,
    await cEcdsaSecp256r1256Sha1Dispatcher.getAddress(),
  );
  await registration.mockAddCertificateDispatcher(
    C_ECDSA_SECP256R1_SHA1_384,
    await cEcdsaSecp256r1384Sha1Dispatcher.getAddress(),
  );
  await registration.mockAddCertificateDispatcher(
    C_ECDSA_SECP256R1_SHA1_512,
    await cEcdsaSecp256r1512Sha1Dispatcher.getAddress(),
  );
  await registration.mockAddCertificateDispatcher(
    C_ECDSA_SECP256R1_SHA2_512,
    await cEcdsaSecp256r1512Sha2Dispatcher.getAddress(),
  );
  await registration.mockAddCertificateDispatcher(
    C_ECDSA_SECP256R1_SHA2_768,
    await cEcdsaSecp256r1768Sha2Dispatcher.getAddress(),
  );
  await registration.mockAddCertificateDispatcher(
    C_ECDSA_SECP256R1_SHA2_2048,
    await cEcdsaSecp256r12048Sha2Dispatcher.getAddress(),
  );
  await registration.mockAddCertificateDispatcher(
    C_ECDSA_BRAINPOOLP256R1_SHA2_512,
    await cEcdsaBrainpoolP256r1128Sha2Dispatcher.getAddress(),
  );
  await registration.mockAddCertificateDispatcher(
    C_ECDSA_BRAINPOOLP256R1_SHA1_448,
    await cEcdsaBrainpoolP256r1112Sha1Dispatcher.getAddress(),
  );
  await registration.mockAddCertificateDispatcher(
    C_ECDSA_SECP384R1_SHA2_512,
    await cEcdsaSecp384r1512Sha2Dispatcher.getAddress(),
  );
  await registration.mockAddCertificateDispatcher(
    C_ECDSA_SECP384R1_SHA384_512,
    await cEcdsaSecp384r1512Sha384Dispatcher.getAddress(),
  );
  await registration.mockAddCertificateDispatcher(
    C_ECDSA_BRAINPOOLP384R1_SHA2_512,
    await cEcdsaBrainpoolP384r1512Sha2Dispatcher.getAddress(),
  );
  await registration.mockAddCertificateDispatcher(
    C_ECDSA_BRAINPOOLP384R1_SHA384_512,
    await cEcdsaBrainpoolP384r1512Sha384Dispatcher.getAddress(),
  );
  await registration.mockAddCertificateDispatcher(
    C_ECDSA_BRAINPOOLP384R1_SHA384_768,
    await cEcdsaBrainpoolP384r1768Sha384Dispatcher.getAddress(),
  );
  await registration.mockAddCertificateDispatcher(
    C_ECDSA_BRAINPOOLP512R1_SHA512_1024,
    await cEcdsaBrainpoolP512r11024Sha512Dispatcher.getAddress(),
  );

  // -------------------------- PASSPORT --------------------------

  await registration.mockAddPassportDispatcher(P_RSA_SHA1_2688, await pRsaSha12688Dispatcher.getAddress());
  await registration.mockAddPassportDispatcher(P_RSA_SHA1_2688_3, await pRsaSha126883Dispatcher.getAddress());

  await registration.mockAddPassportDispatcher(P_RSA_SHA256_2688, await pRsaSha22688Dispatcher.getAddress());
  await registration.mockAddPassportDispatcher(P_RSA_SHA256_2688_3, await pRsaSha226883Dispatcher.getAddress());

  await registration.mockAddPassportDispatcher(P_ECDSA_SHA1_2704, await pEcdsaSha12704Dispatcher.getAddress());

  await registration.mockAddPassportDispatcher(P_NO_AA, await pNoAaDispatcher.getAddress());

  // -------------------------- VERIFIER --------------------------

  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_1_256_3_5_576_248_NA,
    await pPerPassport_1_256_3_5_576_248_NAVerifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_1_256_3_6_576_248_1_2432_5_296,
    await pPerPassport_1_256_3_6_576_248_1_2432_5_296Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_21_256_3_7_336_264_21_3072_6_2008,
    await pPerPassport_21_256_3_7_336_264_21_3072_6_2008Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_2_256_3_6_336_264_21_2448_6_2008,
    await pPerPassport_2_256_3_6_336_264_21_2448_6_2008Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_1_256_3_6_576_264_1_2448_3_256,
    await pPerPassport_1_256_3_6_576_264_1_2448_3_256Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_2_256_3_6_336_248_1_2432_3_256,
    await pPerPassport_2_256_3_6_336_248_1_2432_3_256Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_2_256_3_6_576_248_1_2432_3_256,
    await pPerPassport_2_256_3_6_576_248_1_2432_3_256Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_11_256_3_3_576_248_1_1184_5_264,
    await pPerPassport_11_256_3_3_576_248_1_1184_5_264Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_12_256_3_3_336_232_NA,
    await pPerPassport_12_256_3_3_336_232_NAVerifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_1_256_3_4_336_232_1_1480_5_296,
    await pPerPassport_1_256_3_4_336_232_1_1480_5_296Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_1_256_3_4_600_248_1_1496_3_256,
    await pPerPassport_1_256_3_4_600_248_1_1496_3_256Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_1_160_3_4_576_200_NA,
    await pPerPassport_1_160_3_4_576_200_NAVerifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_21_256_3_3_336_232_NA,
    await pPerPassport_21_256_3_3_336_232_NAVerifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_24_256_3_4_336_232_NA,
    await pPerPassport_24_256_3_4_336_232_NAVerifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_1_160_3_3_576_200_NA,
    await pPerPassport_1_160_3_3_576_200_NAVerifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_1_256_3_3_576_248_NA,
    await pPerPassport_1_256_3_3_576_248_NAVerifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_20_256_3_3_336_224_NA,
    await pPerPassport_20_256_3_3_336_224_NAVerifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_10_256_3_3_576_248_1_1184_5_264,
    await pPerPassport_10_256_3_3_576_248_1_1184_5_264Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_11_256_3_5_576_248_1_1808_4_256,
    await pPerPassport_11_256_3_5_576_248_1_1808_4_256Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_21_256_3_3_576_232_NA,
    await pPerPassport_21_256_3_3_576_232_NAVerifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_2_256_3_6_336_264_1_2448_3_256,
    await pPerPassport_2_256_3_6_336_264_1_2448_3_256Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_3_160_3_3_336_200_NA,
    await pPerPassport_3_160_3_3_336_200_NAVerifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_3_160_3_4_576_216_1_1512_3_256,
    await pPerPassport_3_160_3_4_576_216_1_1512_3_256Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_11_256_3_3_576_240_1_864_5_264,
    await pPerPassport_11_256_3_3_576_240_1_864_5_264Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_11_256_3_5_576_248_1_1808_5_296,
    await pPerPassport_11_256_3_5_576_248_1_1808_5_296Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_21_256_3_4_576_232_NA,
    await pPerPassport_21_256_3_4_576_232_NAVerifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_11_256_3_3_336_248_NA,
    await pPerPassport_11_256_3_3_336_248_NAVerifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_14_256_3_4_336_64_1_1480_5_296,
    await pPerPassport_14_256_3_4_336_64_1_1480_5_296Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_15_512_3_3_336_248_NA,
    await pPerPassport_15_512_3_3_336_248_NAVerifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_1_256_3_6_336_248_1_2744_4_256,
    await pPerPassport_1_256_3_6_336_248_1_2744_4_256Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_1_256_3_6_336_560_1_2744_4_256,
    await pPerPassport_1_256_3_6_336_560_1_2744_4_256Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_20_160_3_3_736_200_NA,
    await pPerPassport_20_160_3_3_736_200_NAVerifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_20_256_3_5_336_72_NA,
    await pPerPassport_20_256_3_5_336_72_NAVerifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_21_256_3_5_576_232_NA,
    await pPerPassport_21_256_3_5_576_232_NAVerifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_PER_PASSPORT_4_160_3_3_336_216_1_1296_3_256,
    await pPerPassport_4_160_3_3_336_216_1_1296_3_256Verifier.getAddress(),
  );

  await registration.mockAddPassportVerifier(Z_UNIVERSAL_2048, await pUniversal2048Verifier.getAddress());
  await registration.mockAddPassportVerifier(Z_UNIVERSAL_2048_V2, await pUniversal2048V2Verifier.getAddress());
  await registration.mockAddPassportVerifier(Z_UNIVERSAL_4096, await pUniversal4096Verifier.getAddress());

  await registration.mockAddPassportVerifier(
    Z_UNIVERSAL_PSS_2048_S32_E2,
    await pUniversalPSS2048S32E2Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_UNIVERSAL_PSS_2048_S32_E17,
    await pUniversalPSS2048S32E17Verifier.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_UNIVERSAL_PSS_2048_S64_E17,
    await pUniversalPSS2048S64E17Verifier.getAddress(),
  );

  await registration.mockAddPassportVerifier(Z_INTERNAL, await pInternalVerifier.getAddress());
  await registration.mockAddPassportVerifier(Z_INTERNAL_OPT, await pInternalOptVerifier.getAddress());

  await registration.mockAddPassportVerifier(Z_MNE_OPT, await pMneOptVerifier.getAddress());
  await registration.mockAddPassportVerifier(Z_MNE_OPT_2, await pMneOpt2Verifier.getAddress());

  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_1_256_3_4_600_248_1_1496_3_256,
    await pNoirPassport_1_256_3_4_600_248_1_1496_3_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_1_256_3_5_336_248_1_2120_4_256,
    await pNoirPassport_1_256_3_5_336_248_1_2120_4_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_10_256_3_3_576_248_1_1184_5_264,
    await pNoirPassport_10_256_3_3_576_248_1_1184_5_264.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_11_256_3_4_336_232_1_1480_4_256,
    await pNoirPassport_11_256_3_4_336_232_1_1480_4_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_14_256_3_3_576_240_NA,
    await pNoirPassport_14_256_3_3_576_240_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_14_256_3_4_576_248_1_1496_3_256,
    await pNoirPassport_14_256_3_4_576_248_1_1496_3_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_2_256_3_4_336_232_1_1480_4_256,
    await pNoirPassport_2_256_3_4_336_232_1_1480_4_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_2_256_3_4_336_248_NA,
    await pNoirPassport_2_256_3_4_336_248_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_2_256_3_6_336_248_1_2432_3_256,
    await pNoirPassport_2_256_3_6_336_248_1_2432_3_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_2_256_3_6_576_248_1_2432_3_256,
    await pNoirPassport_2_256_3_6_576_248_1_2432_3_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_20_160_3_2_576_184_NA,
    await pNoirPassport_20_160_3_2_576_184_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_20_256_3_3_336_224_NA,
    await pNoirPassport_20_256_3_3_336_224_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_21_256_3_3_576_232_NA,
    await pNoirPassport_21_256_3_3_576_232_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_3_512_3_3_336_264_NA,
    await pNoirPassport_3_512_3_3_336_264_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_2_256_3_6_336_264_21_2448_6_2008,
    await pNoirPassport_2_256_3_6_336_264_21_2448_6_2008.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_21_256_3_4_576_232_NA,
    await pNoirPassport_21_256_3_4_576_232_NA.getAddress(),
  );

  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_1_256_3_4_576_232_1_1480_3_256,
    await pNoirPassport_1_256_3_4_576_232_1_1480_3_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_1_256_3_5_576_248_NA,
    await pNoirPassport_1_256_3_5_576_248_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_1_256_3_6_576_264_1_2448_3_256,
    await pNoirPassport_1_256_3_6_576_264_1_2448_3_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_3_256_3_4_600_248_1_1496_3_256,
    await pNoirPassport_3_256_3_4_600_248_1_1496_3_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_6_160_3_3_336_216_1_1080_3_256,
    await pNoirPassport_6_160_3_3_336_216_1_1080_3_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_11_256_3_3_576_248_NA,
    await pNoirPassport_11_256_3_3_576_248_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_11_256_3_5_576_248_NA,
    await pNoirPassport_11_256_3_5_576_248_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_14_256_3_4_336_232_1_1480_5_296,
    await pNoirPassport_14_256_3_4_336_232_1_1480_5_296.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_20_160_3_3_576_200_NA,
    await pNoirPassport_20_160_3_3_576_200_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_20_256_3_5_336_248_NA,
    await pNoirPassport_20_256_3_5_336_248_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_23_160_3_3_576_200_NA,
    await pNoirPassport_23_160_3_3_576_200_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_24_256_3_4_336_248_NA,
    await pNoirPassport_24_256_3_4_336_248_NA.getAddress(),
  );

  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_11_256_3_5_576_248_1_1808_4_256,
    await pNoirPassport_11_256_3_5_576_248_1_1808_4_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_11_256_3_5_576_264_NA,
    await pNoirPassport_11_256_3_5_576_264_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_11_256_3_5_584_264_1_2136_4_256,
    await pNoirPassport_11_256_3_5_584_264_1_2136_4_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_1_256_3_4_336_232_NA,
    await pNoirPassport_1_256_3_4_336_232_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_2_256_3_4_336_248_22_1496_7_2408,
    await pNoirPassport_2_256_3_4_336_248_22_1496_7_2408.getAddress(),
  );

  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_25_384_3_3_336_232_NA,
    await pNoirPassport_25_384_3_3_336_232_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_25_384_3_4_336_264_1_2904_2_256,
    await pNoirPassport_25_384_3_4_336_264_1_2904_2_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_26_512_3_3_336_248_NA,
    await pNoirPassport_26_512_3_3_336_248_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_26_512_3_3_336_264_1_1968_2_256,
    await pNoirPassport_26_512_3_3_336_264_1_1968_2_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_27_512_3_4_336_248_NA,
    await pNoirPassport_27_512_3_4_336_248_NA.getAddress(),
  );

  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_1_256_3_5_336_248_1_2120_3_256,
    await pNoirPassport_1_256_3_5_336_248_1_2120_3_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_7_160_3_3_336_216_1_1080_3_256,
    await pNoirPassport_7_160_3_3_336_216_1_1080_3_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_8_160_3_3_336_216_1_1080_3_256,
    await pNoirPassport_8_160_3_3_336_216_1_1080_3_256.getAddress(),
  );

  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_11_256_3_2_336_216_NA,
    await pNoirPassport_11_256_3_2_336_216_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_11_256_3_3_336_248_NA,
    await pNoirPassport_11_256_3_3_336_248_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_11_256_3_3_576_240_1_864_5_264,
    await pNoirPassport_11_256_3_3_576_240_1_864_5_264.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_11_256_3_3_576_248_1_1184_5_264,
    await pNoirPassport_11_256_3_3_576_248_1_1184_5_264.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_11_256_3_4_584_248_1_1496_4_256,
    await pNoirPassport_11_256_3_4_584_248_1_1496_4_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_11_256_3_5_576_248_1_1808_5_296,
    await pNoirPassport_11_256_3_5_576_248_1_1808_5_296.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_12_256_3_3_336_232_NA,
    await pNoirPassport_12_256_3_3_336_232_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_15_512_3_3_336_248_NA,
    await pNoirPassport_15_512_3_3_336_248_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_1_160_3_3_576_200_NA,
    await pNoirPassport_1_160_3_3_576_200_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_1_256_3_3_576_248_NA,
    await pNoirPassport_1_256_3_3_576_248_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_1_256_3_4_336_232_1_1480_5_296,
    await pNoirPassport_1_256_3_4_336_232_1_1480_5_296.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_1_256_3_6_336_248_1_2744_4_256,
    await pNoirPassport_1_256_3_6_336_248_1_2744_4_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_1_256_3_6_576_248_1_2432_5_296,
    await pNoirPassport_1_256_3_6_576_248_1_2432_5_296.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_21_256_3_3_336_232_NA,
    await pNoirPassport_21_256_3_3_336_232_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_21_256_3_5_576_232_NA,
    await pNoirPassport_21_256_3_5_576_232_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_24_256_3_4_336_232_NA,
    await pNoirPassport_24_256_3_4_336_232_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_25_384_3_3_336_248_NA,
    await pNoirPassport_25_384_3_3_336_248_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_25_384_3_3_336_264_1_2024_3_296,
    await pNoirPassport_25_384_3_3_336_264_1_2024_3_296.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_28_384_3_3_576_264_24_2024_4_2792,
    await pNoirPassport_28_384_3_3_576_264_24_2024_4_2792.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_2_256_3_6_336_264_1_2448_3_256,
    await pNoirPassport_2_256_3_6_336_264_1_2448_3_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_3_160_3_3_336_200_NA,
    await pNoirPassport_3_160_3_3_336_200_NA.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_3_160_3_4_576_216_1_1512_3_256,
    await pNoirPassport_3_160_3_4_576_216_1_1512_3_256.getAddress(),
  );
  await registration.mockAddPassportVerifier(
    Z_NOIR_PASSPORT_3_256_3_3_576_248_NA,
    await pNoirPassport_3_256_3_3_576_248_NA.getAddress(),
  );

  await stateKeeper.mockAddRegistrations([config.registrationName], [await registration.getAddress()]);
  await stateKeeper.mockAddRegistrations([config.simpleRegistrationName], [await registrationSimple.getAddress()]);
};
