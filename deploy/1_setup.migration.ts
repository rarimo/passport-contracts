import { ethers } from "hardhat";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { deployPoseidons } from "./helpers/helper";

import { Registration__factory, RegistrationVerifier__factory } from "@ethers-v6";

const treeHeight = 80;
const icaoMasterTreeMerkleRoot = ethers.hexlify(
  "20044536444086118591887109164436364136320990398424186763077840515405091245125",
);

export = async (deployer: Deployer) => {
  await deployPoseidons(
    deployer,
    new Array(6).fill(6).map((_, i) => i + 1),
  );

  const registration = await deployer.deploy(Registration__factory);
  const registrationVerifier = await deployer.deploy(RegistrationVerifier__factory);

  await registration.__Registration_init(treeHeight, await registrationVerifier.getAddress(), icaoMasterTreeMerkleRoot);

  Reporter.reportContracts(["Registration", `${await registration.getAddress()}`]);
};
