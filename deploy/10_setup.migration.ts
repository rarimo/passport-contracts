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
} from "@ethers-v6";

import {
  C_RSA_SHA1_2048,
  C_RSA_SHA2_2048,
  C_RSA_SHA1_4096,
  C_RSA_SHA2_4096,
  C_RSAPSS_SHA2_2048,
  C_RSAPSS_SHA2_4096,
  C_RSAPSS_SHA512_2048,
  C_RSAPSS_SHA512_4096,
  C_ECDSA_SECP384R1_SHA2_512,
  C_ECDSA_SECP384R1_SHA384_512,
  C_ECDSA_BRAINPOOLP384R1_SHA2_512,
  C_ECDSA_BRAINPOOLP384R1_SHA384_512,
  P_ECDSA_SHA1_2704,
  P_NO_AA,
  P_RSA_SHA1_2688,
  P_RSA_SHA1_2688_3,
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
} from "@/scripts/utils/types";

import { getConfig } from "./config/config";

export = async (deployer: Deployer) => {
  const config = (await getConfig())!;
  const stateKeeper = await deployer.deployed(StateKeeperMock__factory, "StateKeeper Proxy");
  const registration = await deployer.deployed(Registration2Mock__factory, "Registration2 Proxy");
  const registrationSimple = await deployer.deployed(RegistrationSimple__factory, "RegistrationSimple Proxy");

  // ------------------------ CERTIFICATE ------------------------

  const cRsa4096Sha1Dispatcher = await deployer.deployed(CRSADispatcher__factory, "CRSADispatcher SHA1 512");
  const cRsa2048Sha1Dispatcher = await deployer.deployed(CRSADispatcher__factory, "CRSADispatcher SHA1 256");
  const cRsa4096Sha2Dispatcher = await deployer.deployed(CRSADispatcher__factory, "CRSADispatcher SHA2 512");
  const cRsa2048Sha2Dispatcher = await deployer.deployed(CRSADispatcher__factory, "CRSADispatcher SHA2 256");

  const cRsaPss2048Sha2Dispatcher = await deployer.deployed(
    CRSADispatcher__factory,
    "CRSAPSSDispatcher SHA2 65537 256",
  );
  const cRsaPss4096Sha2Dispatcher = await deployer.deployed(
    CRSADispatcher__factory,
    "CRSAPSSDispatcher SHA2 65537 512",
  );
  const cRsaPss2048Sha512Dispatcher = await deployer.deployed(
    CRSADispatcher__factory,
    "CRSAPSSDispatcher SHA512 65537 256",
  );
  const cRsaPss4096Sha512Dispatcher = await deployer.deployed(
    CRSADispatcher__factory,
    "CRSAPSSDispatcher SHA512 65537 512",
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

  // ------------------------ CERTIFICATE ------------------------

  await registration.mockAddCertificateDispatcher(C_RSA_SHA1_4096, await cRsa4096Sha1Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSA_SHA1_2048, await cRsa2048Sha1Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSA_SHA2_4096, await cRsa4096Sha2Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSA_SHA2_2048, await cRsa2048Sha2Dispatcher.getAddress());

  await registration.mockAddCertificateDispatcher(C_RSAPSS_SHA2_2048, await cRsaPss2048Sha2Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSAPSS_SHA2_4096, await cRsaPss4096Sha2Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSAPSS_SHA512_2048, await cRsaPss2048Sha512Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSAPSS_SHA512_4096, await cRsaPss4096Sha512Dispatcher.getAddress());

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

  // -------------------------- PASSPORT --------------------------

  await registration.mockAddPassportDispatcher(P_RSA_SHA1_2688, await pRsaSha12688Dispatcher.getAddress());
  await registration.mockAddPassportDispatcher(P_RSA_SHA1_2688_3, await pRsaSha126883Dispatcher.getAddress());

  await registration.mockAddPassportDispatcher(P_RSA_SHA2_2688, await pRsaSha22688Dispatcher.getAddress());
  await registration.mockAddPassportDispatcher(P_RSA_SHA2_2688_3, await pRsaSha226883Dispatcher.getAddress());

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

  await stateKeeper.mockAddRegistrations([config.registrationName], [await registration.getAddress()]);
  await stateKeeper.mockAddRegistrations([config.simpleRegistrationName], [await registrationSimple.getAddress()]);
};
