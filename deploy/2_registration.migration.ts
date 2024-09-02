import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import {
  deployProxy,
  deployPVerifiers,
  deployCRSADispatcher,
  deployCRSAPSSDispatcher,
  deployPNOAADispatcher,
  deployPRSASHA12688Dispatcher,
  deployPECDSASHA12704Dispatcher,
} from "./helpers";

import { Registration2Mock__factory, StateKeeperMock__factory } from "@ethers-v6";

import { getConfig } from "./config/config";

export = async (deployer: Deployer) => {
  const config = (await getConfig())!;
  const stateKeeper = await deployer.deployed(StateKeeperMock__factory, "StateKeeper Proxy");

  const registration = await deployProxy(deployer, Registration2Mock__factory, "Registration2");
  await registration.__Registration_init(config.tssSigner, config.chainName, await stateKeeper.getAddress());

  await deployPVerifiers(deployer);

  await deployCRSADispatcher(deployer, "SHA1", "65537", "512", "0x0282020100");
  await deployCRSADispatcher(deployer, "SHA1", "65537", "256", "0x0282010100");
  await deployCRSADispatcher(deployer, "SHA2", "65537", "512", "0x0282020100");
  await deployCRSADispatcher(deployer, "SHA2", "65537", "256", "0x0282010100");

  await deployCRSAPSSDispatcher(deployer, "SHA2", "65537", "256", "0x0282010100");
  await deployCRSAPSSDispatcher(deployer, "SHA2", "65537", "512", "0x0282020100");
  await deployCRSAPSSDispatcher(deployer, "SHA512", "65537", "256", "0x0282010100");
  await deployCRSAPSSDispatcher(deployer, "SHA512", "65537", "512", "0x0282020100");

  await deployPRSASHA12688Dispatcher(deployer, "65537");
  await deployPRSASHA12688Dispatcher(deployer, "3");

  await deployPNOAADispatcher(deployer);
  await deployPECDSASHA12704Dispatcher(deployer);

  Reporter.reportContracts(["Registration2", `${await registration.getAddress()}`]);
};
