import { Deployer, Reporter } from "@solarity/hardhat-migrate";
import { deployPoseidons } from "./helpers/helper";

import {
  Registration__factory,
  RSASHA1Dispatcher__factory,
  ECDSASHA1Dispatcher__factory,
  RSASHA1Authenticator__factory,
  ECDSASHA1Authenticator__factory,
  RSASHA12688Verifier__factory,
  RSASHA12688TimestampVerifier__factory,
  VerifierMock__factory,
} from "@ethers-v6";

import { ECDSA_SHA1_2704, RSA_SHA1_2688, RSA_SHA1_2688_TIMESTAMP } from "@/scripts/utils/passport-types";

const treeHeight = 80;
const tssSigner = "0x038D006846a3e203738cF80A02418e124203beb2";
const icaoMasterTreeMerkleRoot = "0x2c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45";

const deployRSASHA12688Dispatcher = async (deployer: Deployer) => {
  const verifier = await deployer.deploy(RSASHA12688Verifier__factory);
  const authenticator = await deployer.deploy(RSASHA1Authenticator__factory, { name: "RSASHA12688Authenticator" });
  const dispatcher = await deployer.deploy(RSASHA1Dispatcher__factory, { name: "RSASHA12688Dispatcher" });

  await dispatcher.__RSASHA1Dispatcher_init(await authenticator.getAddress(), await verifier.getAddress());

  return dispatcher;
};

const deployRSASHA12688TimestampDispatcher = async (deployer: Deployer) => {
  const verifier = await deployer.deploy(RSASHA12688TimestampVerifier__factory);
  const authenticator = await deployer.deploy(RSASHA1Authenticator__factory, {
    name: "RSASHA12688TimestampAuthenticator",
  });
  const dispatcher = await deployer.deploy(RSASHA1Dispatcher__factory, { name: "RSASHA12688TimestampDispatcher" });

  await dispatcher.__RSASHA1Dispatcher_init(await authenticator.getAddress(), await verifier.getAddress());

  return dispatcher;
};

const deployECDSASHA12704Dispatcher = async (deployer: Deployer) => {
  const verifier = await deployer.deploy(VerifierMock__factory);
  const authenticator = await deployer.deploy(ECDSASHA1Authenticator__factory);
  const dispatcher = await deployer.deploy(ECDSASHA1Dispatcher__factory);

  await dispatcher.__ECDSASHA1Dispatcher_init(await authenticator.getAddress(), await verifier.getAddress());

  return dispatcher;
};

export = async (deployer: Deployer) => {
  await deployPoseidons(deployer, [1, 2, 3, 5]);

  const rsaSha12688Dispatcher = await deployRSASHA12688Dispatcher(deployer);
  const rsaSha12688TimestampDispatcher = await deployRSASHA12688TimestampDispatcher(deployer);
  const ecdsaSha12704Dispatcher = await deployECDSASHA12704Dispatcher(deployer);

  const registration = await deployer.deploy(Registration__factory);

  await registration.__Registration_init(treeHeight, tssSigner, icaoMasterTreeMerkleRoot);

  await registration.addDispatcher(RSA_SHA1_2688, await rsaSha12688Dispatcher.getAddress());
  await registration.addDispatcher(RSA_SHA1_2688_TIMESTAMP, await rsaSha12688TimestampDispatcher.getAddress());
  await registration.addDispatcher(ECDSA_SHA1_2704, await ecdsaSha12704Dispatcher.getAddress());

  Reporter.reportContracts(
    ["Registration", `${await registration.getAddress()}`],
    ["RSASHA12688Dispatcher", `${await rsaSha12688Dispatcher.getAddress()}`],
    ["RSASHA12688TimestampDispatcher", `${await rsaSha12688TimestampDispatcher.getAddress()}`],
    ["ECDSASHA12704Dispatcher", `${await ecdsaSha12704Dispatcher.getAddress()}`],
  );
};
