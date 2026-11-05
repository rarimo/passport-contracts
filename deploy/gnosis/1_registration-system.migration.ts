import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import { ethers } from "ethers";

import {
  CRSADispatcher__factory,
  CRSASigner__factory,
  EvidenceDB__factory,
  EvidenceRegistry__factory,
  NoAARecovery__factory,
  NoirKeyPossession__factory,
  NoirRegisterIdentity_1_256_1_6_960_248_NA__factory,
  PNOAADispatcher__factory,
  PoseidonSMT__factory,
  Registration2__factory,
  StateKeeper__factory,
} from "@ethers-v6";

import { C_RSA_SHA2_2048, P_NO_AA, Z_NOIR_PASSPORT_1_256_1_6_960_248_NA } from "@/scripts/utils/types";

import * as config from "../config/gnosis";

import { deployInitializedProxy, deployPoseidon, expectEqual } from "./helpers";

// Registration2.MethodId
const ADD_CERTIFICATE_DISPATCHER = 1;
const ADD_PASSPORT_DISPATCHER = 3;
const ADD_PASSPORT_VERIFIER = 5;

// StateKeeper.MethodId
const ADD_REGISTRATIONS = 2;

// CRSASigner.HF
const HF_SHA256 = 1;

export = async (deployer: Deployer) => {
  const signer = await deployer.getSigner();
  const deployerAddress = await signer.getAddress();
  const coder = ethers.AbiCoder.defaultAbiCoder();

  // -------------------------- POSEIDON --------------------------

  const poseidon1 = await deployPoseidon(deployer, 1);
  const poseidon2 = await deployPoseidon(deployer, 2);
  const poseidon3 = await deployPoseidon(deployer, 3);

  const smtLibraries = {
    "contracts/libraries/Poseidon.sol:PoseidonUnit2L": poseidon2,
    "contracts/libraries/Poseidon.sol:PoseidonUnit3L": poseidon3,
  };
  const stateKeeperLibraries = { ...smtLibraries, "contracts/libraries/Poseidon.sol:PoseidonUnit1L": poseidon1 };

  // The library in @rarimo/evidence-registry is an empty interface, it must be linked explicitly
  const evidenceLibraries = {
    "@rarimo/evidence-registry/libraries/Poseidon.sol:PoseidonUnit2L": poseidon2,
    "@rarimo/evidence-registry/libraries/Poseidon.sol:PoseidonUnit3L": poseidon3,
  };

  // -------------------------- EVIDENCE --------------------------

  const evidenceDB = await deployer.deploy(EvidenceDB__factory, { libraries: evidenceLibraries });
  const evidenceRegistry = await deployer.deploy(EvidenceRegistry__factory, {
    libraries: { "@rarimo/evidence-registry/libraries/Poseidon.sol:PoseidonUnit2L": poseidon2 },
  });

  await evidenceDB.__EvidenceDB_init(await evidenceRegistry.getAddress(), config.evidenceDBMaxDepth);
  await evidenceRegistry.__EvidenceRegistry_init(await evidenceDB.getAddress());

  // ---------------------------- STATE ----------------------------

  const smtImpl = await deployer.deploy(PoseidonSMT__factory, {
    name: "PoseidonSMT Implementation",
    libraries: smtLibraries,
  });
  const stateKeeperImpl = await deployer.deploy(StateKeeper__factory, {
    name: "StateKeeper Implementation",
    libraries: stateKeeperLibraries,
  });

  // StateKeeper and the SMTs reference each other: the SMTs are initialized with the StateKeeper
  // proxy address, which is the third contract created from now on
  const stateKeeperAddress = ethers.getCreateAddress({
    from: deployerAddress,
    nonce: (await signer.provider.getTransactionCount(deployerAddress, "pending")) + 2,
  });

  const smtInitData = PoseidonSMT__factory.createInterface().encodeFunctionData("__PoseidonSMT_init", [
    stateKeeperAddress,
    await evidenceRegistry.getAddress(),
    config.treeSize,
  ]);

  const registrationSmt = await deployInitializedProxy(
    deployer,
    PoseidonSMT__factory,
    "RegistrationSMT",
    await smtImpl.getAddress(),
    smtInitData,
  );
  const certificatesSmt = await deployInitializedProxy(
    deployer,
    PoseidonSMT__factory,
    "CertificatesSMT",
    await smtImpl.getAddress(),
    smtInitData,
  );

  // The deployer stays an owner until the handover, so that it can configure the system
  const stateKeeper = await deployInitializedProxy(
    deployer,
    StateKeeper__factory,
    "StateKeeper",
    await stateKeeperImpl.getAddress(),
    StateKeeper__factory.createInterface().encodeFunctionData("__StateKeeper_init", [
      deployerAddress,
      await registrationSmt.getAddress(),
      await certificatesSmt.getAddress(),
      config.icaoMasterTreeMerkleRoot,
    ]),
  );

  expectEqual("StateKeeper proxy address", await stateKeeper.getAddress(), stateKeeperAddress);

  // ------------------------- REGISTRATION -------------------------

  const registrationImpl = await deployer.deploy(Registration2__factory, { name: "Registration2 Implementation" });
  const registration = await deployInitializedProxy(
    deployer,
    Registration2__factory,
    "Registration2",
    await registrationImpl.getAddress(),
    Registration2__factory.createInterface().encodeFunctionData("__Registration_init", [stateKeeperAddress]),
  );

  // Same configuration as the Rarimo L2 C_RSA_2048 dispatcher: RSA-2048 document signers, SHA-256 + e=65537 CSCA signature
  const cRsaSigner = await deployer.deploy(CRSASigner__factory, { name: "CRSASigner SHA2 65537" });
  await cRsaSigner.__CRSASigner_init(65537, HF_SHA256);

  const cRsa2048Sha2Dispatcher = await deployer.deploy(CRSADispatcher__factory, {
    name: "CRSADispatcher SHA2 256 65537",
  });
  await cRsa2048Sha2Dispatcher.__CRSADispatcher_init(await cRsaSigner.getAddress(), 256, "0x0282010100");

  const pNoAaDispatcher = await deployer.deploy(PNOAADispatcher__factory);
  await pNoAaDispatcher.__PNOAADispatcher_init();

  const registerVerifier = await deployer.deploy(NoirRegisterIdentity_1_256_1_6_960_248_NA__factory);

  await registration.updateDependency(
    ADD_CERTIFICATE_DISPATCHER,
    coder.encode(["bytes32", "address"], [C_RSA_SHA2_2048, await cRsa2048Sha2Dispatcher.getAddress()]),
  );
  await registration.updateDependency(
    ADD_PASSPORT_DISPATCHER,
    coder.encode(["bytes32", "address"], [P_NO_AA, await pNoAaDispatcher.getAddress()]),
  );
  await registration.updateDependency(
    ADD_PASSPORT_VERIFIER,
    coder.encode(["bytes32", "address"], [Z_NOIR_PASSPORT_1_256_1_6_960_248_NA, await registerVerifier.getAddress()]),
  );

  // --------------------------- RECOVERY ---------------------------

  const keyPossessionVerifier = await deployer.deploy(NoirKeyPossession__factory);

  const recoveryImpl = await deployer.deploy(NoAARecovery__factory, { name: "NoAARecovery Implementation" });
  const recovery = await deployInitializedProxy(
    deployer,
    NoAARecovery__factory,
    "NoAARecovery",
    await recoveryImpl.getAddress(),
    NoAARecovery__factory.createInterface().encodeFunctionData("__NoAARecovery_init", [
      stateKeeperAddress,
      await registration.getAddress(),
      await keyPossessionVerifier.getAddress(),
      config.recoveryDelay,
      config.recoveryLockDuration,
      config.recoveryZkTypes,
    ]),
  );

  await stateKeeper.updateRegistrationSet(
    ADD_REGISTRATIONS,
    coder.encode(
      ["string[]", "address[]"],
      [
        [config.registrationName, config.noAaRecoveryName],
        [await registration.getAddress(), await recovery.getAddress()],
      ],
    ),
  );

  Reporter.reportContracts(
    ["EvidenceDB", await evidenceDB.getAddress()],
    ["EvidenceRegistry", await evidenceRegistry.getAddress()],
    ["StateKeeper", await stateKeeper.getAddress()],
    ["RegistrationSMT", await registrationSmt.getAddress()],
    ["CertificatesSMT", await certificatesSmt.getAddress()],
    ["Registration2", await registration.getAddress()],
    ["NoAARecovery", await recovery.getAddress()],
  );
};
