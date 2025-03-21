import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import { deployProxy, deployCRSADispatcher, deployPECDSASHA12704Dispatcher } from "../helpers";

import { Registration3Mock__factory, StateKeeperMock__factory, UltraVerifier__factory } from "@ethers-v6";

import { getConfig } from "../config/config";

export = async (deployer: Deployer) => {
  const config = (await getConfig())!;
  const stateKeeper = await deployer.deployed(StateKeeperMock__factory, "StateKeeper Proxy");

  const registration = await deployProxy(deployer, Registration3Mock__factory, "Registration3");
  await registration.__Registration_init(await stateKeeper.getAddress());

  await deployer.deploy(UltraVerifier__factory);

  await deployCRSADispatcher(deployer, "SHA2", "65537", "512", "0x0282020100");

  await deployPECDSASHA12704Dispatcher(deployer);

  Reporter.reportContracts(["Registration3", `${await registration.getAddress()}`]);
};
