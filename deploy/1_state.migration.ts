import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { deployPoseidons, deployProxy, deploySMTProxy } from "./helpers/helper";

import { PoseidonSMT, StateKeeperMock, StateKeeperMock__factory } from "@ethers-v6";

import { getConfig } from "./config/config";

const smtInit = async (smt: PoseidonSMT, stateKeeper: StateKeeperMock, config: any) => {
  await smt.__PoseidonSMT_init(config.tssSigner, config.chainName, await stateKeeper.getAddress(), config.treeSize);
};

export = async (deployer: Deployer) => {
  const config = (await getConfig())!;

  await deployPoseidons(deployer, [1, 2, 3, 5]);

  const registrationSmt = await deploySMTProxy(deployer, "RegistrationSMT");
  const certificatesSmt = await deploySMTProxy(deployer, "CertificatesSMT");

  const stateKeeper = await deployProxy(deployer, StateKeeperMock__factory, "StateKeeper");

  await smtInit(registrationSmt, stateKeeper, config);
  await smtInit(certificatesSmt, stateKeeper, config);

  await stateKeeper.__StateKeeper_init(
    config.tssSigner,
    config.chainName,
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
