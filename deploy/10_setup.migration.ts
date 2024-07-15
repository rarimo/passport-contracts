import { Deployer } from "@solarity/hardhat-migrate";

import {
  StateKeeperMock__factory,
  Registration2Mock__factory,
  CRSASHA2Dispatcher__factory,
  PNOAADispatcher__factory,
  PRSASHA1Dispatcher__factory,
  PECDSASHA1Dispatcher__factory,
  PUniversal2048Verifier2__factory,
  PUniversal4096Verifier2__factory,
  PInternalVerifier2__factory,
} from "@ethers-v6";

import {
  Z_UNIVERSAL_2048,
  Z_UNIVERSAL_4096,
  Z_INTERNAL,
  C_RSA_4096,
  C_RSA_2048,
  P_NO_AA,
  P_ECDSA_SHA1_2704,
  P_RSA_SHA1_2688,
  P_RSA_SHA1_2688_3,
} from "@/scripts/utils/types";

import { getConfig } from "./config/config";

export = async (deployer: Deployer) => {
  const config = (await getConfig())!;

  const stateKeeper = await deployer.deployed(StateKeeperMock__factory, "StateKeeper Proxy");

  const registration = await deployer.deployed(Registration2Mock__factory, "Registration Proxy");

  const cRsa4096Dispatcher = await deployer.deployed(CRSASHA2Dispatcher__factory, "CRSASHA2Dispatcher 65537 512");
  const cRsa2048Dispatcher = await deployer.deployed(CRSASHA2Dispatcher__factory, "CRSASHA2Dispatcher 65537 256");

  const pRsaSha12688Dispatcher = await deployer.deployed(PRSASHA1Dispatcher__factory, "PRSASHA1Dispatcher 65537");
  const pRsaSha126883Dispatcher = await deployer.deployed(PRSASHA1Dispatcher__factory, "PRSASHA1Dispatcher 3");

  const pNoAaDispatcher = await deployer.deployed(PNOAADispatcher__factory);
  const pEcdsaSha12704Dispatcher = await deployer.deployed(PECDSASHA1Dispatcher__factory);

  const pUniversal2048Verifier = await deployer.deployed(PUniversal2048Verifier2__factory);
  const pUniversal4096Verifier = await deployer.deployed(PUniversal4096Verifier2__factory);
  const pInternalVerifier = await deployer.deployed(PInternalVerifier2__factory);

  await registration.mockAddCertificateDispatcher(C_RSA_4096, await cRsa4096Dispatcher.getAddress());
  await registration.mockAddCertificateDispatcher(C_RSA_2048, await cRsa2048Dispatcher.getAddress());

  await registration.mockAddPassportDispatcher(P_NO_AA, await pNoAaDispatcher.getAddress());
  await registration.mockAddPassportDispatcher(P_RSA_SHA1_2688, await pRsaSha12688Dispatcher.getAddress());
  await registration.mockAddPassportDispatcher(P_RSA_SHA1_2688_3, await pRsaSha126883Dispatcher.getAddress());
  await registration.mockAddPassportDispatcher(P_ECDSA_SHA1_2704, await pEcdsaSha12704Dispatcher.getAddress());

  await registration.mockAddPassportVerifier(Z_UNIVERSAL_2048, await pUniversal2048Verifier.getAddress());
  await registration.mockAddPassportVerifier(Z_UNIVERSAL_4096, await pUniversal4096Verifier.getAddress());
  await registration.mockAddPassportVerifier(Z_INTERNAL, await pInternalVerifier.getAddress());

  await stateKeeper.mockAddRegistrations([config.registrationName], [await registration.getAddress()]);
};
