import { ethers } from "hardhat";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { deployPoseidons } from "./helpers/helper";

import { Registration__factory, RegistrationVerifier__factory } from "@ethers-v6";

const treeHeight = 80;
const icaoMasterTreeMerkleRoot = "0x2c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45";

export = async (deployer: Deployer) => {
  await deployPoseidons(deployer, [1, 2, 3, 5]);

  const registration = await deployer.deploy(Registration__factory);
  const registrationVerifier = await deployer.deploy(RegistrationVerifier__factory);

  await registration.__Registration_init(treeHeight, await registrationVerifier.getAddress(), icaoMasterTreeMerkleRoot);

  Reporter.reportContracts(["Registration", `${await registration.getAddress()}`]);
};
