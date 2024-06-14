import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import {
  StateKeeperMock__factory,
  ERC1967Proxy__factory,
  RegistrationMock__factory,
  CRSASHA2Dispatcher__factory,
  CRSASHA2Signer__factory,
  PNOAADispatcher__factory,
  PRSASHA1Dispatcher__factory,
  PECDSASHA1Dispatcher__factory,
  PRSASHA1Authenticator__factory,
  PECDSASHA1Authenticator__factory,
  PUniversal2048Verifier__factory,
  PUniversal4096Verifier__factory,
} from "@ethers-v6";

import { getConfig } from "./config/config";

const deployCRSASHA2Dispatcher = async (deployer: Deployer, keyLength: string, keyPrefix: string) => {
  const signer = await deployer.deployed(CRSASHA2Signer__factory);
  const dispatcher = await deployer.deploy(CRSASHA2Dispatcher__factory, { name: `CRSASHA2Dispatcher ${keyLength}` });

  await dispatcher.__CRSASHA2Dispatcher_init(await signer.getAddress(), keyLength, keyPrefix);
};

const deployPNOAADispatcher = async (deployer: Deployer) => {
  const dispatcher = await deployer.deploy(PNOAADispatcher__factory);

  await dispatcher.__PNOAADispatcher_init();
};

const deployPRSASHA12688Dispatcher = async (deployer: Deployer) => {
  const authenticator = await deployer.deploy(PRSASHA1Authenticator__factory);
  const dispatcher = await deployer.deploy(PRSASHA1Dispatcher__factory);

  await dispatcher.__PRSASHA1Dispatcher_init(await authenticator.getAddress());
};

const deployPECDSASHA12704Dispatcher = async (deployer: Deployer) => {
  const authenticator = await deployer.deploy(PECDSASHA1Authenticator__factory);
  const dispatcher = await deployer.deploy(PECDSASHA1Dispatcher__factory);

  await dispatcher.__PECDSASHA1Dispatcher_init(await authenticator.getAddress());
};

const deployCSigners = async (deployer: Deployer) => {
  await deployer.deploy(CRSASHA2Signer__factory);
};

const deployPVerifiers = async (deployer: Deployer) => {
  await deployer.deploy(PUniversal2048Verifier__factory);
  await deployer.deploy(PUniversal4096Verifier__factory);
};

export = async (deployer: Deployer) => {
  const config = (await getConfig())!;
  const stateKeeper = await deployer.deployed(StateKeeperMock__factory, "StateKeeper Proxy");

  let registration = await deployer.deploy(RegistrationMock__factory);
  await deployer.deploy(ERC1967Proxy__factory, [await registration.getAddress(), "0x"], {
    name: "Registration Proxy",
  });
  registration = await deployer.deployed(RegistrationMock__factory, "Registration Proxy");

  await registration.__Registration_init(config.tssSigner, config.chainName, await stateKeeper.getAddress());

  await deployCSigners(deployer);
  await deployPVerifiers(deployer);

  await deployCRSASHA2Dispatcher(deployer, "512", "0x0282020100");
  await deployCRSASHA2Dispatcher(deployer, "256", "0x0282010100");

  await deployPNOAADispatcher(deployer);
  await deployPRSASHA12688Dispatcher(deployer);
  await deployPECDSASHA12704Dispatcher(deployer);

  Reporter.reportContracts(["Registration", `${await registration.getAddress()}`]);
};
