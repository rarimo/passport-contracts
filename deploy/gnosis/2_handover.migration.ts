import hre from "hardhat";

import { Deployer } from "@solarity/hardhat-migrate";

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

import { expectDeployedCode, expectEqual, getImplementation } from "./helpers";

export = async (deployer: Deployer) => {
  const deployerAddress = await (await deployer.getSigner()).getAddress();

  const evidenceDB = await deployer.deployed(EvidenceDB__factory);
  const evidenceRegistry = await deployer.deployed(EvidenceRegistry__factory);
  const registrationSmt = await deployer.deployed(PoseidonSMT__factory, "RegistrationSMT Proxy");
  const certificatesSmt = await deployer.deployed(PoseidonSMT__factory, "CertificatesSMT Proxy");
  const stateKeeper = await deployer.deployed(StateKeeper__factory, "StateKeeper Proxy");
  const registration = await deployer.deployed(Registration2__factory, "Registration2 Proxy");
  const recovery = await deployer.deployed(NoAARecovery__factory, "NoAARecovery Proxy");
  const cRsaSigner = await deployer.deployed(CRSASigner__factory, "CRSASigner SHA2 65537");
  const cRsa2048Sha2Dispatcher = await deployer.deployed(CRSADispatcher__factory, "CRSADispatcher SHA2 256 65537");
  const pNoAaDispatcher = await deployer.deployed(PNOAADispatcher__factory);
  const registerVerifier = await deployer.deployed(NoirRegisterIdentity_1_256_1_6_960_248_NA__factory);
  const keyPossessionVerifier = await deployer.deployed(NoirKeyPossession__factory);

  // ------------------------------ CODE ------------------------------

  const proxies: [string, string][] = [
    ["contracts/state/PoseidonSMT.sol:PoseidonSMT", await registrationSmt.getAddress()],
    ["contracts/state/PoseidonSMT.sol:PoseidonSMT", await certificatesSmt.getAddress()],
    ["contracts/state/StateKeeper.sol:StateKeeper", await stateKeeper.getAddress()],
    ["contracts/registration/Registration2.sol:Registration2", await registration.getAddress()],
    ["contracts/registration/NoAARecovery.sol:NoAARecovery", await recovery.getAddress()],
  ];

  for (const [contractName, proxy] of proxies) {
    await expectDeployedCode("@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy", proxy);
    await expectDeployedCode(contractName, await getImplementation(proxy));
  }

  const contracts: [string, string][] = [
    ["@rarimo/evidence-registry/EvidenceDB.sol:EvidenceDB", await evidenceDB.getAddress()],
    ["@rarimo/evidence-registry/EvidenceRegistry.sol:EvidenceRegistry", await evidenceRegistry.getAddress()],
    ["contracts/certificate/signers/CRSASigner.sol:CRSASigner", await cRsaSigner.getAddress()],
    ["contracts/certificate/dispatchers/CRSADispatcher.sol:CRSADispatcher", await cRsa2048Sha2Dispatcher.getAddress()],
    ["contracts/passport/dispatchers/PNOAADispatcher.sol:PNOAADispatcher", await pNoAaDispatcher.getAddress()],
    [
      "contracts/passport/verifiers2/noir/NoirRegisterIdentity_1_256_1_6_960_248_NA.sol:NoirRegisterIdentity_1_256_1_6_960_248_NA",
      await registerVerifier.getAddress(),
    ],
    [
      "contracts/passport/verifiers2/noir/NoirKeyPossession.sol:NoirKeyPossession",
      await keyPossessionVerifier.getAddress(),
    ],
  ];

  for (const [contractName, address] of contracts) {
    await expectDeployedCode(contractName, address);
  }

  // ------------------------------ STATE ------------------------------

  expectEqual("EvidenceDB.getEvidenceRegistry", await evidenceDB.getEvidenceRegistry(), evidenceRegistry);
  expectEqual("EvidenceDB.getMaxHeight", await evidenceDB.getMaxHeight(), config.evidenceDBMaxDepth);
  expectEqual("EvidenceRegistry.getEvidenceDB", await evidenceRegistry.getEvidenceDB(), evidenceDB);

  for (const [name, smt] of [
    ["RegistrationSMT", registrationSmt],
    ["CertificatesSMT", certificatesSmt],
  ] as const) {
    expectEqual(`${name}.stateKeeper`, await smt.stateKeeper(), stateKeeper);
    expectEqual(`${name}.evidenceRegistry`, await smt.evidenceRegistry(), evidenceRegistry);
    expectEqual(`${name}.getRoot`, await smt.getRoot(), hre.ethers.ZeroHash);
  }

  expectEqual("StateKeeper.registrationSmt", await stateKeeper.registrationSmt(), registrationSmt);
  expectEqual("StateKeeper.certificatesSmt", await stateKeeper.certificatesSmt(), certificatesSmt);
  expectEqual(
    "StateKeeper.icaoMasterTreeMerkleRoot",
    await stateKeeper.icaoMasterTreeMerkleRoot(),
    config.icaoMasterTreeMerkleRoot,
  );

  const [registrationKeys, registrationAddresses] = await stateKeeper.getRegistrations();

  expectEqual("StateKeeper.getRegistrations keys", registrationKeys, [
    config.registrationName,
    config.noAaRecoveryName,
  ]);
  expectEqual("StateKeeper.getRegistrations addresses", registrationAddresses, [registration, recovery]);

  expectEqual("Registration2.stateKeeper", await registration.stateKeeper(), stateKeeper);
  expectEqual(
    "Registration2.certificateDispatchers(C_RSA_SHA2_2048)",
    await registration.certificateDispatchers(C_RSA_SHA2_2048),
    cRsa2048Sha2Dispatcher,
  );
  expectEqual(
    "Registration2.passportDispatchers(P_NO_AA)",
    await registration.passportDispatchers(P_NO_AA),
    pNoAaDispatcher,
  );
  expectEqual(
    "Registration2.passportVerifiers(Z_NOIR_PASSPORT_1_256_1_6_960_248_NA)",
    await registration.passportVerifiers(Z_NOIR_PASSPORT_1_256_1_6_960_248_NA),
    registerVerifier,
  );

  expectEqual("CRSADispatcher.signer", await cRsa2048Sha2Dispatcher.getFunction("signer")(), cRsaSigner);
  expectEqual("CRSADispatcher.keyByteLength", await cRsa2048Sha2Dispatcher.keyByteLength(), 256);
  expectEqual("CRSADispatcher.keyCheckPrefix", await cRsa2048Sha2Dispatcher.keyCheckPrefix(), "0x0282010100");
  expectEqual("CRSASigner.exponent", await cRsaSigner.exponent(), 65537);
  expectEqual("CRSASigner.hashFunction", await cRsaSigner.hashFunction(), 1);

  expectEqual("NoAARecovery.stateKeeper", await recovery.stateKeeper(), stateKeeper);
  expectEqual("NoAARecovery.registration", await recovery.registration(), registration);
  expectEqual("NoAARecovery.keyPossessionVerifier", await recovery.keyPossessionVerifier(), keyPossessionVerifier);
  expectEqual("NoAARecovery.recoveryDelay", await recovery.recoveryDelay(), config.recoveryDelay);
  expectEqual("NoAARecovery.lockDuration", await recovery.lockDuration(), config.recoveryLockDuration);

  for (const zkType of config.recoveryZkTypes) {
    expectEqual(`NoAARecovery.allowedZkTypes(${zkType})`, await recovery.allowedZkTypes(zkType), true);
  }

  // ----------------------------- HANDOVER -----------------------------

  if ((await hre.ethers.provider.getCode(config.owner)) === "0x") {
    throw new Error(`Owner ${config.owner} is not a contract, expected the Safe`);
  }

  expectEqual("StateKeeper.getOwners before handover", await stateKeeper.getOwners(), [deployerAddress]);

  await stateKeeper.addOwners([config.owner]);
  await stateKeeper.removeOwners([deployerAddress]);

  expectEqual("StateKeeper.getOwners", await stateKeeper.getOwners(), [config.owner]);
};
