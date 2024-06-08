import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { deployPoseidons } from "./helpers/helper";

import { StateKeeperMock__factory, PoseidonSMT__factory, ERC1967Proxy__factory } from "@ethers-v6";

import { getConfig } from "./config/config";

export = async (deployer: Deployer) => {
  const config = (await getConfig())!;

  await deployPoseidons(deployer, [1, 2, 3, 5]);

  let registrationSmt = await deployer.deploy(PoseidonSMT__factory, { name: "RegistrationSMT" });
  await deployer.deploy(ERC1967Proxy__factory, [await registrationSmt.getAddress(), "0x"], {
    name: "RegistrationSMT Proxy",
  });
  registrationSmt = await deployer.deployed(PoseidonSMT__factory, "RegistrationSMT Proxy");

  let certificatesSmt = await deployer.deploy(PoseidonSMT__factory, { name: "CertificatesSMT" });
  await deployer.deploy(ERC1967Proxy__factory, [await certificatesSmt.getAddress(), "0x"], {
    name: "CertificatesSMT Proxy",
  });
  certificatesSmt = await deployer.deployed(PoseidonSMT__factory, "CertificatesSMT Proxy");

  let stateKeeper = await deployer.deploy(StateKeeperMock__factory);
  await deployer.deploy(ERC1967Proxy__factory, [await stateKeeper.getAddress(), "0x"], {
    name: "StateKeeper Proxy",
  });
  stateKeeper = await deployer.deployed(StateKeeperMock__factory, "StateKeeper Proxy");

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

  Reporter.reportContracts(
    ["StateKeeper", `${await stateKeeper.getAddress()}`],
    ["RegistrationSMT", `${await registrationSmt.getAddress()}`],
    ["CertificatesSMT", `${await certificatesSmt.getAddress()}`],
  );
};
