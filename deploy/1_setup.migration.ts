import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { deployPoseidons } from "./helpers/helper";

import { Registration__factory, PoseidonSMT__factory, ERC1967Proxy__factory } from "@ethers-v6";

const TREE_SIZE = 80;

const tssSigner = "0x038D006846a3e203738cF80A02418e124203beb2";
const icaoMasterTreeMerkleRoot = "0xca09a639ceafe2c7b3d37f1ddd78ae0b203332a3e7b180aa35435a0d3a8cd8c7";

export = async (deployer: Deployer) => {
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

  const registrationImpl = await deployer.deploy(Registration__factory);
  await deployer.deploy(ERC1967Proxy__factory, [await registrationImpl.getAddress(), "0x"], {
    name: "Registration Proxy",
  });

  const registration = await deployer.deployed(Registration__factory, "Registration Proxy");

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
    ["RegistrationImpl", `${await registrationImpl.getAddress()}`],
    ["RegistrationSMT", `${await registrationSmt.getAddress()}`],
    ["CertificatesSMT", `${await certificatesSmt.getAddress()}`],
  );
};
