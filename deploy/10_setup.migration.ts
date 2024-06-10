import { Deployer } from "@solarity/hardhat-migrate";

import {
  StateKeeperMock__factory,
  RegistrationMock__factory,
  CRSASHA2Dispatcher__factory,
  PRSASHA1Dispatcher__factory,
  PECDSASHA1Dispatcher__factory,
} from "@ethers-v6";

import { C_RSA, P_ECDSA_SHA1_2704, P_RSA_SHA1_2688 } from "@/scripts/utils/passport-types";

import { getConfig } from "./config/config";

export = async (deployer: Deployer) => {
  const config = (await getConfig())!;

  const stateKeeper = await deployer.deployed(StateKeeperMock__factory, "StateKeeper Proxy");

  const registration = await deployer.deployed(RegistrationMock__factory, "Registration Proxy");

  const cRsaDispatcher = await deployer.deployed(CRSASHA2Dispatcher__factory);

  const pRsaSha12688Dispatcher = await deployer.deployed(PRSASHA1Dispatcher__factory);
  const pEcdsaSha12704Dispatcher = await deployer.deployed(PECDSASHA1Dispatcher__factory);

  await registration.addCertificateDispatcher(C_RSA, await cRsaDispatcher.getAddress());

  await registration.addPassportDispatcher(P_RSA_SHA1_2688, await pRsaSha12688Dispatcher.getAddress());
  await registration.addPassportDispatcher(P_ECDSA_SHA1_2704, await pEcdsaSha12704Dispatcher.getAddress());

  await stateKeeper.addRegistrations([config.registrationName], [await registration.getAddress()]);
};
