import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { deployPoseidons } from "./helpers/helper";

import { Registration__factory, PoseidonSMT__factory } from "@ethers-v6";

const TREE_SIZE = 80;

const tssSigner = "0x038D006846a3e203738cF80A02418e124203beb2";
const icaoMasterTreeMerkleRoot = "0x2c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45";

export = async (deployer: Deployer) => {
  await deployPoseidons(deployer, [1, 2, 3, 5]);

  const registrationSmt = await deployer.deploy(PoseidonSMT__factory, { name: "RegistrationSMT" });
  const certificatesSmt = await deployer.deploy(PoseidonSMT__factory, { name: "CertificatesSMT" });
  const registration = await deployer.deploy(Registration__factory);

  await registrationSmt.__PoseidonSMT_init(TREE_SIZE, await registration.getAddress());
  await certificatesSmt.__PoseidonSMT_init(TREE_SIZE, await registration.getAddress());

  await registration.__Registration_init(
    tssSigner,
    await registrationSmt.getAddress(),
    await certificatesSmt.getAddress(),
    icaoMasterTreeMerkleRoot,
  );

  Reporter.reportContracts(
    ["Registration", `${await registration.getAddress()}`],
    ["RegistrationSMT", `${await registrationSmt.getAddress()}`],
    ["CertificatesSMT", `${await certificatesSmt.getAddress()}`],
  );
};
