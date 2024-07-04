import { Deployer } from "@solarity/hardhat-migrate";

import {
  StateKeeper__factory,
  StateKeeperMock__factory,
  Registration2__factory,
  Registration2Mock__factory,
} from "@ethers-v6";

export = async (deployer: Deployer) => {
  const stateKeeper = await deployer.deployed(StateKeeperMock__factory, "StateKeeper Proxy");
  const registration = await deployer.deployed(Registration2Mock__factory, "Registration Proxy");

  let stateKeeperImpl = await deployer.deploy(StateKeeper__factory);
  let registrationImpl = await deployer.deploy(Registration2__factory);

  await stateKeeper.upgradeTo(await stateKeeperImpl.getAddress());
  await registration.upgradeTo(await registrationImpl.getAddress());
};
