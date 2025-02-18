import { Deployer } from "@solarity/hardhat-migrate";

import { deployPoseidons } from "./helpers";

import { getConfig } from "./config/config";

import { Registration2__factory, StateKeeper__factory } from "@ethers-v6";

import { TSSUpgrader } from "@/scripts/upgrade/upgrade-utils";

export = async (deployer: Deployer) => {
  const config = (await getConfig())!;

  await deployPoseidons(deployer, [1, 2, 3, 4, 5]);

  const chainName = "Rarimo-mainnet";
  const stateKeeper = await deployer.deployed(StateKeeper__factory, "0x7d4E8Da1d10f8Db46C52414175d4003ab0Aef506");
  const registration = await deployer.deployed(Registration2__factory, "0xC0B09085Fa2ad3A8BbF96494B8d5cd10702FE20d");

  const upgrader = new TSSUpgrader(chainName, await stateKeeper.getAddress(), await registration.getAddress());

  const stateKeeperImpl = await deployer.deploy(StateKeeper__factory);
  const registrationImpl = await deployer.deploy(Registration2__factory);

  const stateKeeperUpgradeDataToSign = upgrader.getStateKeeperUpgradeData(
    await stateKeeperImpl.getAddress(),
    await stateKeeper.getNonce(255),
  );

  const stateKeeperUpgradeCall = stateKeeper.interface.encodeFunctionData("__StateKeeper_upgrade_1", [config.owner]);

  const registrationUpgradeDataToSign = upgrader.getRegistrationUpgradeData(
    await registrationImpl.getAddress(),
    await registration.getNonce(255),
  );

  console.log(1, "StateKeeper Upgrade");
  console.log("Data to sign:", stateKeeperUpgradeDataToSign);
  console.log("Data for upgrade:", stateKeeperUpgradeCall);

  console.log(2, "Registration Upgrade");
  console.log("Data to sign:", registrationUpgradeDataToSign);
};
