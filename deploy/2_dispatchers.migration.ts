import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import {
  Registration__factory,
  RSASHA1Dispatcher__factory,
  ECDSASHA1Dispatcher__factory,
  RSASHA1Authenticator__factory,
  ECDSASHA1Authenticator__factory,
  RSAECDSAVerifier__factory,
} from "@ethers-v6";

import { ECDSA_SHA1_2704, RSA_SHA1_2688 } from "@/scripts/utils/passport-types";

const deployVerifiers = async (deployer: Deployer) => {
  await deployer.deploy(RSAECDSAVerifier__factory);
};

const deployRSASHA12688Dispatcher = async (deployer: Deployer) => {
  const verifier = await deployer.deployed(RSAECDSAVerifier__factory);
  const authenticator = await deployer.deploy(RSASHA1Authenticator__factory);
  const dispatcher = await deployer.deploy(RSASHA1Dispatcher__factory);

  await dispatcher.__RSASHA1Dispatcher_init(await authenticator.getAddress(), await verifier.getAddress());

  return dispatcher;
};

const deployECDSASHA12704Dispatcher = async (deployer: Deployer) => {
  const verifier = await deployer.deployed(RSAECDSAVerifier__factory);
  const authenticator = await deployer.deploy(ECDSASHA1Authenticator__factory);
  const dispatcher = await deployer.deploy(ECDSASHA1Dispatcher__factory);

  await dispatcher.__ECDSASHA1Dispatcher_init(await authenticator.getAddress(), await verifier.getAddress());

  return dispatcher;
};

export = async (deployer: Deployer) => {
  await deployVerifiers(deployer);

  const registration = await deployer.deployed(Registration__factory, "Registration Proxy");

  const rsaSha12688Dispatcher = await deployRSASHA12688Dispatcher(deployer);
  const ecdsaSha12704Dispatcher = await deployECDSASHA12704Dispatcher(deployer);

  await registration.addDispatcher(RSA_SHA1_2688, await rsaSha12688Dispatcher.getAddress());
  await registration.addDispatcher(ECDSA_SHA1_2704, await ecdsaSha12704Dispatcher.getAddress());

  Reporter.reportContracts(
    ["RSASHA12688Dispatcher", `${await rsaSha12688Dispatcher.getAddress()}`],
    ["ECDSASHA12704Dispatcher", `${await ecdsaSha12704Dispatcher.getAddress()}`],
  );
};
