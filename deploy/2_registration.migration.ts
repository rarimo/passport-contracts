import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import {
  StateKeeperMock__factory,
  ERC1967Proxy__factory,
  RegistrationMock__factory,
  CRSASHA2Dispatcher__factory,
  CRSASHA2Signer__factory,
  PRSASHA1Dispatcher__factory,
  PECDSASHA1Dispatcher__factory,
  PRSASHA1Authenticator__factory,
  PECDSASHA1Authenticator__factory,
  PRSAECDSAVerifier__factory,
} from "@ethers-v6";

import { getConfig } from "./config/config";

const deployCRSASHA2Dispatcher = async (deployer: Deployer) => {
  const signer = await deployer.deploy(CRSASHA2Signer__factory);
  const dispatcher = await deployer.deploy(CRSASHA2Dispatcher__factory);

  await dispatcher.__CRSASHA2Dispatcher_init(await signer.getAddress());

  return dispatcher;
};

const deployPRSASHA12688Dispatcher = async (deployer: Deployer) => {
  const verifier = await deployer.deployed(PRSAECDSAVerifier__factory);
  const authenticator = await deployer.deploy(PRSASHA1Authenticator__factory);
  const dispatcher = await deployer.deploy(PRSASHA1Dispatcher__factory);

  await dispatcher.__PRSASHA1Dispatcher_init(await authenticator.getAddress(), await verifier.getAddress());

  return dispatcher;
};

const deployPECDSASHA12704Dispatcher = async (deployer: Deployer) => {
  const verifier = await deployer.deployed(PRSAECDSAVerifier__factory);
  const authenticator = await deployer.deploy(PECDSASHA1Authenticator__factory);
  const dispatcher = await deployer.deploy(PECDSASHA1Dispatcher__factory);

  await dispatcher.__PECDSASHA1Dispatcher_init(await authenticator.getAddress(), await verifier.getAddress());

  return dispatcher;
};

const deployPVerifiers = async (deployer: Deployer) => {
  await deployer.deploy(PRSAECDSAVerifier__factory);
};

export = async (deployer: Deployer) => {
  const config = (await getConfig())!;
  const stateKeeper = await deployer.deployed(StateKeeperMock__factory, "StateKeeper Proxy");

  await deployPVerifiers(deployer);

  let registration = await deployer.deploy(RegistrationMock__factory);
  await deployer.deploy(ERC1967Proxy__factory, [await registration.getAddress(), "0x"], {
    name: "Registration Proxy",
  });
  registration = await deployer.deployed(RegistrationMock__factory, "Registration Proxy");

  await registration.__Registration_init(config.tssSigner, config.chainName, await stateKeeper.getAddress());

  const cRsaDispatcher = await deployCRSASHA2Dispatcher(deployer);

  const pRsaSha12688Dispatcher = await deployPRSASHA12688Dispatcher(deployer);
  const pEcdsaSha12704Dispatcher = await deployPECDSASHA12704Dispatcher(deployer);

  Reporter.reportContracts(
    ["Registration", `${await registration.getAddress()}`],
    ["CRSADispatcher", `${await cRsaDispatcher.getAddress()}`],
    ["PRSASHA12688Dispatcher", `${await pRsaSha12688Dispatcher.getAddress()}`],
    ["PECDSASHA12704Dispatcher", `${await pEcdsaSha12704Dispatcher.getAddress()}`],
  );
};