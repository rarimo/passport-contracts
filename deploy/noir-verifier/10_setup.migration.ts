import { Deployer } from "@solarity/hardhat-migrate";

import {
  Registration2Mock__factory,
  StateKeeperMock__factory,
  CRSADispatcher__factory,
  PECDSASHA1Dispatcher__factory,
  UltraVerifier__factory,
} from "@ethers-v6";

import { getConfig } from "../config/config";
import { C_RSA_SHA1_2048, C_RSA_SHA2_4096, P_ECDSA_SHA1_2704, Z_PASSPORT_NOIR } from "@/scripts/utils/types";

export = async (deployer: Deployer) => {
  const config = (await getConfig())!;
  const stateKeeper = await deployer.deployed(StateKeeperMock__factory, "StateKeeper Proxy");
  const registration = await deployer.deployed(Registration2Mock__factory, "Registration3 Proxy");

  // ------------------------ CERTIFICATE ------------------------

  const cRsa4096Sha2Dispatcher = await deployer.deployed(CRSADispatcher__factory, "CRSADispatcher SHA2 512");

  // -------------------------- PASSPORT --------------------------

  const pEcdsaSha12704Dispatcher = await deployer.deployed(PECDSASHA1Dispatcher__factory);

  // -------------------------- VERIFIER --------------------------

  const newVerifier = await deployer.deployed(UltraVerifier__factory);

  // ------------------------ CERTIFICATE ------------------------

  await registration.mockAddCertificateDispatcher(C_RSA_SHA2_4096, await cRsa4096Sha2Dispatcher.getAddress());

  // -------------------------- PASSPORT --------------------------

  await registration.mockAddPassportDispatcher(P_ECDSA_SHA1_2704, await pEcdsaSha12704Dispatcher.getAddress());

  // -------------------------- VERIFIER --------------------------

  await registration.mockAddPassportVerifier(Z_PASSPORT_NOIR, await newVerifier.getAddress());

  console.log(Z_PASSPORT_NOIR);

  await stateKeeper.mockAddRegistrations([config.registrationName], [await registration.getAddress()]);
};
