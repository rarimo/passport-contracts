import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { deployPoseidons, deployProxy, deploySMTProxy } from "./helpers";

import { StateKeeperMock__factory } from "@ethers-v6";

import { getConfig } from "./config/config";

export = async (deployer: Deployer) => {
  const config = (await getConfig())!;

  await deployPoseidons(deployer, [1, 2, 3, 4, 5]);

  const registrationSmt = await deploySMTProxy(deployer, "RegistrationSMT");
  const certificatesSmt = await deploySMTProxy(deployer, "CertificatesSMT");

  const stateKeeper = await deployProxy(deployer, StateKeeperMock__factory, "StateKeeper");

  await registrationSmt.__PoseidonSMT_init(
    config.tssSigner,
    config.chainName,
    await stateKeeper.getAddress(),
    config.treeSize,
  );

  await certificatesSmt.__PoseidonSMT_init(
    config.tssSigner,
    config.chainName,
    await stateKeeper.getAddress(),
    config.treeSize,
  );

  await stateKeeper.__StateKeeper_init(
    config.tssSigner,
    config.chainName,
    await registrationSmt.getAddress(),
    await certificatesSmt.getAddress(),
    config.icaoMasterTreeMerkleRoot,
  );
  await stateKeeper.__StateKeeper_upgrade_1(config.owner);

  Reporter.reportContracts(
    ["StateKeeper", `${await stateKeeper.getAddress()}`],
    ["RegistrationSMT", `${await registrationSmt.getAddress()}`],
    ["CertificatesSMT", `${await certificatesSmt.getAddress()}`],
  );
};
