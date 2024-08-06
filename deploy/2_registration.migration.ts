import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import {
  CRSAPSSSHA2Signer__factory,
  CRSASHA2Dispatcher__factory,
  CRSASHA2Signer__factory,
  PECDSASHA1Authenticator__factory,
  PECDSASHA1Dispatcher__factory,
  PInternalVerifier2__factory,
  PNOAADispatcher__factory,
  PRSASHA1Authenticator__factory,
  PRSASHA1Dispatcher__factory,
  PUniversal2048Verifier2__factory,
  PUniversal4096Verifier2__factory,
  Registration2Mock__factory,
  StateKeeperMock__factory,
} from "@ethers-v6";

import { BaseContract } from "ethers";
import { getConfig } from "./config/config";
import { deployProxy } from "./helpers/helper";

const deployDispatcher = async (
  deployer: Deployer,
  signer: BaseContract,
  keyLength: string,
  keyPrefix: string,
  name: string,
) => {
  const dispatcher = await deployer.deploy(CRSASHA2Dispatcher__factory, { name: `${name} ${keyLength}` });
  await dispatcher.__CRSASHA2Dispatcher_init(await signer.getAddress(), keyLength, keyPrefix);
};

const deployCRSASHA2Dispatcher = async (deployer: Deployer, exponent: string, keyLength: string, keyPrefix: string) => {
  const signer = await deployer.deploy(CRSASHA2Signer__factory, { name: `CRSASHA2Signer ${exponent} ${keyLength}` });
  await signer.__CRSASHA2Signer_init(exponent);

  await deployDispatcher(deployer, signer, keyLength, keyPrefix, "CRSASHA2Dispatcher");
};

const deployCRSAPSSSHA2Dispatcher = async (
  deployer: Deployer,
  exponent: string,
  keyLength: string,
  keyPrefix: string,
) => {
  const signer = await deployer.deploy(CRSAPSSSHA2Signer__factory, {
    name: `CRSAPSSSHA2Signer ${exponent} ${keyLength}`,
  });
  await signer.__CRSAPSSSHA2Signer_init(exponent);

  await deployDispatcher(deployer, signer, keyLength, keyPrefix, "CRSAPSSSHA2Dispatcher");
};

const deployPNOAADispatcher = async (deployer: Deployer) => {
  const dispatcher = await deployer.deploy(PNOAADispatcher__factory);

  await dispatcher.__PNOAADispatcher_init();
};

const deployPRSASHA12688Dispatcher = async (deployer: Deployer, exponent: string) => {
  const authenticator = await deployer.deploy(PRSASHA1Authenticator__factory, {
    name: `PRSASHA1Authenticator ${exponent}`,
  });
  const dispatcher = await deployer.deploy(PRSASHA1Dispatcher__factory, {
    name: `PRSASHA1Dispatcher ${exponent}`,
  });

  await authenticator.__PRSASHA1Authenticator_init(exponent);
  await dispatcher.__PRSASHA1Dispatcher_init(await authenticator.getAddress());
};

const deployPECDSASHA12704Dispatcher = async (deployer: Deployer) => {
  const authenticator = await deployer.deploy(PECDSASHA1Authenticator__factory);
  const dispatcher = await deployer.deploy(PECDSASHA1Dispatcher__factory);

  await dispatcher.__PECDSASHA1Dispatcher_init(await authenticator.getAddress());
};

const deployPVerifiers = async (deployer: Deployer) => {
  await deployer.deploy(PUniversal2048Verifier2__factory);
  await deployer.deploy(PUniversal4096Verifier2__factory);
  await deployer.deploy(PInternalVerifier2__factory);
};

export = async (deployer: Deployer) => {
  const config = (await getConfig())!;
  const stateKeeper = await deployer.deployed(StateKeeperMock__factory, "StateKeeper Proxy");

  const registration = await deployProxy(deployer, Registration2Mock__factory, "Registration");
  await registration.__Registration_init(config.tssSigner, config.chainName, await stateKeeper.getAddress());

  await deployPVerifiers(deployer);

  await deployCRSASHA2Dispatcher(deployer, "65537", "512", "0x0282020100");
  await deployCRSASHA2Dispatcher(deployer, "65537", "256", "0x0282010100");
  await deployCRSAPSSSHA2Dispatcher(deployer, "65537", "512", "0x0282020100");

  await deployPRSASHA12688Dispatcher(deployer, "65537");
  await deployPRSASHA12688Dispatcher(deployer, "3");

  await deployPNOAADispatcher(deployer);
  await deployPECDSASHA12704Dispatcher(deployer);

  Reporter.reportContracts(["Registration", `${await registration.getAddress()}`]);
};
