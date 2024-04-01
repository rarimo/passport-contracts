import { ethers } from "hardhat";
import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { deployPoseidons } from "./helper";

import { Registration__factory, VerifierMock__factory } from "@ethers-v6";

export = async (deployer: Deployer) => {
  await deployPoseidons(
    deployer,
    new Array(6).fill(6).map((_, i) => i + 1),
  );

  const registration = await deployer.deploy(Registration__factory);

  const verifierMock = await deployer.deploy(VerifierMock__factory);

  const icaoMasterTreeMerkleRoot = ethers.hexlify(ethers.randomBytes(32));

  await registration.__Registration_init(80, await verifierMock.getAddress(), icaoMasterTreeMerkleRoot);

  Reporter.reportContracts(["Registration", `${await registration.getAddress()}`]);
};
