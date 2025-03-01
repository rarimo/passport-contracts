import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { deployProxy, deploySMTProxy } from "./helpers";

import { StateKeeperMock__factory } from "@ethers-v6";

import { getConfig } from "./config/config";

export = async (deployer: Deployer) => {
  const config = (await getConfig())!;

  const registrationSmt = await deploySMTProxy(deployer, "RegistrationSMT");
  const certificatesSmt = await deploySMTProxy(deployer, "CertificatesSMT");

  const stateKeeper = await deployProxy(deployer, StateKeeperMock__factory, "StateKeeper");

  await registrationSmt.__PoseidonSMT_init(await stateKeeper.getAddress(), config.evidenceRegistry, config.treeSize);

  await certificatesSmt.__PoseidonSMT_init(await stateKeeper.getAddress(), config.evidenceRegistry, config.treeSize);

  await stateKeeper.__StateKeeper_init(
    config.owner,
    await registrationSmt.getAddress(),
    await certificatesSmt.getAddress(),
    config.icaoMasterTreeMerkleRoot,
  );

  Reporter.reportContracts(
    ["StateKeeper", `${await stateKeeper.getAddress()}`],
    ["RegistrationSMT", `${await registrationSmt.getAddress()}`],
    ["CertificatesSMT", `${await certificatesSmt.getAddress()}`],
  );
};
