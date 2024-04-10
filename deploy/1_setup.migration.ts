import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { deployPoseidons } from "./helpers/helper";

import {
  Registration__factory,
  RSASHA1Dispatcher__factory,
  RSASHA1Authenticator__factory,
  RSASHA1Verifier__factory,
} from "@ethers-v6";

import { RSA_SHA1_2688 } from "@/scripts/utils/passport-types";

const treeHeight = 80;
const tssSigner = "0x038D006846a3e203738cF80A02418e124203beb2";
const icaoMasterTreeMerkleRoot = "0x2c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45";

const deployRSASHA1Disaptcher = async (deployer: Deployer) => {
  const rsaSha1Verifier = await deployer.deploy(RSASHA1Verifier__factory);
  const rsaSha1Authenticator = await deployer.deploy(RSASHA1Authenticator__factory);
  const rsaSha1Dispatcher = await deployer.deploy(RSASHA1Dispatcher__factory);

  await rsaSha1Dispatcher.__RSASHA1Dispatcher_init(
    await rsaSha1Authenticator.getAddress(),
    await rsaSha1Verifier.getAddress(),
  );

  return rsaSha1Dispatcher;
};

export = async (deployer: Deployer) => {
  await deployPoseidons(deployer, [1, 2, 3, 5]);

  const rsaSha1Dispatcher = await deployRSASHA1Disaptcher(deployer);
  const registration = await deployer.deploy(Registration__factory);

  await registration.__Registration_init(treeHeight, tssSigner, icaoMasterTreeMerkleRoot);

  await registration.addDispatcher(RSA_SHA1_2688, await rsaSha1Dispatcher.getAddress());

  Reporter.reportContracts(
    ["Registration", `${await registration.getAddress()}`],
    ["RSASHA1Dispatcher", `${await rsaSha1Dispatcher.getAddress()}`],
  );
};
