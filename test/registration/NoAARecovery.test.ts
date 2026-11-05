import { expect } from "chai";
import { ethers } from "hardhat";

import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { P_NO_AA, Z_NOIR_PASSPORT_1_256_1_6_960_248_NA } from "@/scripts/utils/types";

import {
  StateKeeperMock,
  PoseidonSMTMock,
  Registration2,
  NoAARecovery,
  NoirVerifierMock,
  NoirKeyPossession,
} from "@ethers-v6";

import { Reverter, getPoseidon, poseidonHash } from "@/test/helpers/";
import { RegistrationMethodId, StateKeeperMethodId } from "@/test/helpers/constants";
import { KeyPossessionIdentityKey, KeyPossessionMessage, KeyPossessionProof } from "@/test/helpers/key-possession";

const treeSize = 80;

const registrationName = "SecondRegistration";
const recoveryName = "NO_AA_RECOVERY";

const recoveryDelay = 3n * 24n * 60n * 60n;
const lockDuration = 30n * 24n * 60n * 60n;

enum Action {
  None,
  CancelRecovery,
  LockRecovery,
  UnlockRecovery,
}

const REVOKED = ethers.keccak256(ethers.toUtf8Bytes("REVOKED"));
const USED = ethers.keccak256(ethers.toUtf8Bytes("USED"));

const FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// UltraPlonk verifier error, not part of the ABI
const PAIRING_FAILED_SELECTOR = "0xd71fd263";

const word = (value: bigint | string) => ethers.toBeHex(value, 32);

const certificatesRoot = word(0xcafen);
const passportHash = word(0x1111n);
const oldIdentityKey = word(0x2222n);
const newIdentityKey = word(0x3333n);
const otherIdentityKey = word(0x4444n);
const dgCommit = word(0x5555n);
const newDgCommit = word(0x6666n);

describe("NoAARecovery", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let SECOND: SignerWithAddress;

  let registrationSmt: PoseidonSMTMock;
  let certificatesSmt: PoseidonSMTMock;
  let stateKeeper: StateKeeperMock;
  let registration: Registration2;
  let recovery: NoAARecovery;

  let registerVerifier: NoirVerifierMock;
  let keyPossessionVerifier: NoirVerifierMock;

  const noAaPassport = (hash: string = passportHash) => ({
    dataType: P_NO_AA,
    zkType: Z_NOIR_PASSPORT_1_256_1_6_960_248_NA,
    signature: "0x",
    publicKey: "0x",
    passportHash: hash,
  });

  const registerNoAa = async (identityKey: string, hash: string = passportHash) => {
    await certificatesSmt.mockRoot(certificatesRoot);

    return registration.registerViaNoir(certificatesRoot, identityKey, dgCommit, noAaPassport(hash), "0x");
  };

  const requestRecovery = async (identityKey: string, from: SignerWithAddress = OWNER) => {
    await certificatesSmt.mockRoot(certificatesRoot);

    return recovery
      .connect(from)
      .requestRecovery(
        certificatesRoot,
        identityKey,
        newDgCommit,
        passportHash,
        Z_NOIR_PASSPORT_1_256_1_6_960_248_NA,
        "0x",
      );
  };

  const keyPossessionMessage = async (action: Action, nonce: bigint, hash: string = passportHash) => {
    const { chainId } = await ethers.provider.getNetwork();

    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "address", "uint8", "bytes32", "uint256"],
      [chainId, await recovery.getAddress(), action, hash, nonce],
    );

    return word(BigInt(ethers.keccak256(encoded)) >> 8n);
  };

  const expectKeyPossession = async (identityKey: string, action: Action, hash: string = passportHash) => {
    await keyPossessionVerifier.setExpectedPublicInputs([
      identityKey,
      await recovery.getKeyPossessionMessage(hash, action),
    ]);
  };

  before("setup", async () => {
    [OWNER, SECOND] = await ethers.getSigners();

    const StateKeeper = await ethers.getContractFactory("StateKeeperMock", {
      libraries: {
        PoseidonUnit1L: await (await getPoseidon(1)).getAddress(),
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
        PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
      },
    });
    const PoseidonSMT = await ethers.getContractFactory("PoseidonSMTMock", {
      libraries: {
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
        PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
      },
    });
    const Registration = await ethers.getContractFactory("Registration2");
    const Recovery = await ethers.getContractFactory("NoAARecovery");
    const Proxy = await ethers.getContractFactory("ERC1967Proxy");

    registrationSmt = await PoseidonSMT.deploy();
    certificatesSmt = await PoseidonSMT.deploy();
    stateKeeper = await StateKeeper.deploy();
    registration = await Registration.deploy();
    recovery = await Recovery.deploy();

    let proxy = await Proxy.deploy(await stateKeeper.getAddress(), "0x");
    stateKeeper = stateKeeper.attach(await proxy.getAddress()) as StateKeeperMock;

    proxy = await Proxy.deploy(await registrationSmt.getAddress(), "0x");
    registrationSmt = registrationSmt.attach(await proxy.getAddress()) as PoseidonSMTMock;

    proxy = await Proxy.deploy(await certificatesSmt.getAddress(), "0x");
    certificatesSmt = certificatesSmt.attach(await proxy.getAddress()) as PoseidonSMTMock;

    proxy = await Proxy.deploy(await registration.getAddress(), "0x");
    registration = registration.attach(await proxy.getAddress()) as Registration2;

    proxy = await Proxy.deploy(await recovery.getAddress(), "0x");
    recovery = recovery.attach(await proxy.getAddress()) as NoAARecovery;

    const evidenceDB = await ethers.deployContract("EvidenceDB", {
      libraries: {
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
        PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
      },
    });
    const evidenceRegistry = await ethers.deployContract("EvidenceRegistry", {
      libraries: {
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
      },
    });

    await evidenceDB.__EvidenceDB_init(await evidenceRegistry.getAddress(), treeSize);
    await evidenceRegistry.__EvidenceRegistry_init(await evidenceDB.getAddress());

    await registrationSmt.__PoseidonSMT_init(
      await stateKeeper.getAddress(),
      await evidenceRegistry.getAddress(),
      treeSize,
    );
    await certificatesSmt.__PoseidonSMT_init(
      await stateKeeper.getAddress(),
      await evidenceRegistry.getAddress(),
      treeSize,
    );

    await stateKeeper.__StateKeeper_init(
      OWNER.address,
      await registrationSmt.getAddress(),
      await certificatesSmt.getAddress(),
      ethers.ZeroHash,
    );

    await registration.__Registration_init(await stateKeeper.getAddress());

    registerVerifier = await ethers.deployContract("NoirVerifierMock");
    keyPossessionVerifier = await ethers.deployContract("NoirVerifierMock");

    const pNoAaDispatcher = await ethers.deployContract("PNOAADispatcher");
    await pNoAaDispatcher.__PNOAADispatcher_init();

    const encoder = ethers.AbiCoder.defaultAbiCoder();

    await registration.updateDependency(
      RegistrationMethodId.AddPassportDispatcher,
      encoder.encode(["bytes32", "address"], [P_NO_AA, await pNoAaDispatcher.getAddress()]),
    );
    await registration.updateDependency(
      RegistrationMethodId.AddPassportVerifier,
      encoder.encode(
        ["bytes32", "address"],
        [Z_NOIR_PASSPORT_1_256_1_6_960_248_NA, await registerVerifier.getAddress()],
      ),
    );

    await recovery.__NoAARecovery_init(
      await stateKeeper.getAddress(),
      await registration.getAddress(),
      await keyPossessionVerifier.getAddress(),
      recoveryDelay,
      lockDuration,
      [Z_NOIR_PASSPORT_1_256_1_6_960_248_NA],
    );

    await stateKeeper.updateRegistrationSet(
      StateKeeperMethodId.AddRegistrations,
      encoder.encode(
        ["string[]", "address[]"],
        [
          [registrationName, recoveryName],
          [await registration.getAddress(), await recovery.getAddress()],
        ],
      ),
    );

    await registerNoAa(oldIdentityKey);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#init", () => {
    it("should set the parameters", async () => {
      expect(await recovery.stateKeeper()).to.equal(await stateKeeper.getAddress());
      expect(await recovery.registration()).to.equal(await registration.getAddress());
      expect(await recovery.keyPossessionVerifier()).to.equal(await keyPossessionVerifier.getAddress());
      expect(await recovery.recoveryDelay()).to.equal(recoveryDelay);
      expect(await recovery.lockDuration()).to.equal(lockDuration);
      expect(await recovery.allowedZkTypes(Z_NOIR_PASSPORT_1_256_1_6_960_248_NA)).to.be.true;
    });

    it("should not initialize twice", async () => {
      await expect(
        recovery.__NoAARecovery_init(ethers.ZeroAddress, ethers.ZeroAddress, SECOND.address, 1, 1, []),
      ).to.be.revertedWithCustomError(recovery, "InvalidInitialization");
    });

    it("should bond a P_NO_AA document by its passport hash", async () => {
      const [passportInfo] = await stateKeeper.getPassportInfo(passportHash);

      expect(passportInfo.activeIdentity).to.equal(oldIdentityKey);
      expect(passportInfo.identityReissueCounter).to.equal(0n);
    });
  });

  describe("#requestRecovery", () => {
    it("should request a recovery", async () => {
      const tx = await requestRecovery(newIdentityKey, SECOND);
      const readyAt = BigInt(await time.latest()) + recoveryDelay;

      await expect(tx).to.emit(recovery, "RecoveryRequested").withArgs(passportHash, newIdentityKey, readyAt);

      const request = await recovery.getRecoveryRequest(passportHash);

      expect(request.oldIdentityKey).to.equal(oldIdentityKey);
      expect(request.newIdentityKey).to.equal(newIdentityKey);
      expect(request.dgCommit).to.equal(newDgCommit);
      expect(request.readyAt).to.equal(readyAt);
    });

    it("should verify the same public signals as the registration", async () => {
      await registerVerifier.setExpectedPublicInputs([
        ethers.ZeroHash,
        passportHash,
        newDgCommit,
        newIdentityKey,
        certificatesRoot,
      ]);

      await expect(requestRecovery(newIdentityKey)).to.emit(recovery, "RecoveryRequested");

      await registerVerifier.setExpectedPublicInputs([
        ethers.ZeroHash,
        passportHash,
        newDgCommit,
        otherIdentityKey,
        certificatesRoot,
      ]);

      await expect(requestRecovery(newIdentityKey)).to.be.revertedWithCustomError(recovery, "InvalidNoirProof");
    });

    it("should revert if the proof is invalid", async () => {
      await registerVerifier.setResult(false);

      await expect(requestRecovery(newIdentityKey)).to.be.revertedWithCustomError(recovery, "InvalidNoirProof");
    });

    it("should revert if the certificates root is invalid", async () => {
      await expect(
        recovery.requestRecovery(
          word(0xbeefn),
          newIdentityKey,
          newDgCommit,
          passportHash,
          Z_NOIR_PASSPORT_1_256_1_6_960_248_NA,
          "0x",
        ),
      ).to.be.revertedWith("NoAARecovery: invalid certificates root");
    });

    it("should revert if the identity is zero", async () => {
      await expect(requestRecovery(ethers.ZeroHash)).to.be.revertedWith("NoAARecovery: identity can not be zero");
    });

    it("should revert if the zk type is not allowed", async () => {
      await recovery.setZkTypes([Z_NOIR_PASSPORT_1_256_1_6_960_248_NA], false);

      await expect(requestRecovery(newIdentityKey)).to.be.revertedWith("NoAARecovery: zk type is not allowed");
    });

    it("should revert if the verifier is removed from the registration", async () => {
      await registration.updateDependency(
        RegistrationMethodId.RemovePassportVerifier,
        ethers.AbiCoder.defaultAbiCoder().encode(["bytes32"], [Z_NOIR_PASSPORT_1_256_1_6_960_248_NA]),
      );

      await expect(requestRecovery(newIdentityKey)).to.be.revertedWith(
        "NoAARecovery: passport verifier does not exist",
      );
    });

    it("should revert if the passport is not registered", async () => {
      await certificatesSmt.mockRoot(certificatesRoot);

      await expect(
        recovery.requestRecovery(
          certificatesRoot,
          newIdentityKey,
          newDgCommit,
          word(0x9999n),
          Z_NOIR_PASSPORT_1_256_1_6_960_248_NA,
          "0x",
        ),
      ).to.be.revertedWith("NoAARecovery: passport is not registered");
    });

    it("should revert for revoked bonds and hashes of documents with AA", async () => {
      await stateKeeper.mockPassportData(passportHash, REVOKED);

      await expect(requestRecovery(newIdentityKey)).to.be.revertedWith("NoAARecovery: passport is not registered");

      await stateKeeper.mockPassportData(passportHash, USED);

      await expect(requestRecovery(newIdentityKey)).to.be.revertedWith("NoAARecovery: passport is not registered");
    });

    it("should revert if the identity is already active", async () => {
      await expect(requestRecovery(oldIdentityKey)).to.be.revertedWith("NoAARecovery: identity already active");
    });

    it("should revert if the same recovery is requested twice", async () => {
      await requestRecovery(newIdentityKey);

      await expect(requestRecovery(newIdentityKey)).to.be.revertedWith("NoAARecovery: recovery already requested");
    });
  });

  describe("#contest", () => {
    it("should drop both requests and lock the passport", async () => {
      await requestRecovery(newIdentityKey);

      const tx = await requestRecovery(otherIdentityKey, SECOND);
      const lockedUntil = BigInt(await time.latest()) + lockDuration;

      await expect(tx).to.emit(recovery, "RecoveryContested").withArgs(passportHash, newIdentityKey, otherIdentityKey);

      expect((await recovery.getRecoveryRequest(passportHash)).readyAt).to.equal(0n);
      expect(await recovery.lockedUntil(passportHash)).to.equal(lockedUntil);

      await expect(recovery.finalizeRecovery(passportHash)).to.be.revertedWith(
        "NoAARecovery: recovery is not requested",
      );
    });

    it("should contest a request that is ready but not finalized", async () => {
      await requestRecovery(newIdentityKey);

      await time.increase(recoveryDelay);

      await expect(requestRecovery(otherIdentityKey)).to.emit(recovery, "RecoveryContested");
    });

    it("should accept requests again after the lock", async () => {
      await requestRecovery(newIdentityKey);
      await requestRecovery(otherIdentityKey);

      await expect(requestRecovery(newIdentityKey)).to.be.revertedWith("NoAARecovery: passport is locked");

      await time.increase(lockDuration);

      await expect(requestRecovery(newIdentityKey)).to.emit(recovery, "RecoveryRequested");
    });
  });

  describe("#finalizeRecovery", () => {
    it("should move the bond to the new identity", async () => {
      await requestRecovery(newIdentityKey);

      await time.increase(recoveryDelay);

      const tx = await recovery.connect(SECOND).finalizeRecovery(passportHash);
      const timestamp = BigInt(await time.latest());

      await expect(tx).to.emit(recovery, "RecoveryFinalized").withArgs(passportHash, oldIdentityKey, newIdentityKey);
      await expect(tx).to.emit(stateKeeper, "BondRevoked").withArgs(passportHash, oldIdentityKey);
      await expect(tx).to.emit(stateKeeper, "BondIdentityReissued").withArgs(passportHash, newIdentityKey);

      const [passportInfo, identityInfo] = await stateKeeper.getPassportInfo(passportHash);

      expect(passportInfo.activeIdentity).to.equal(newIdentityKey);
      expect(passportInfo.identityReissueCounter).to.equal(1n);
      expect(identityInfo.activePassport).to.equal(passportHash);
      expect(identityInfo.issueTimestamp).to.equal(timestamp);

      const oldLeaf = await registrationSmt.getNodeByKey(poseidonHash(passportHash + oldIdentityKey.slice(2)));
      const newLeaf = await registrationSmt.getNodeByKey(poseidonHash(passportHash + newIdentityKey.slice(2)));

      expect(oldLeaf.value).to.equal(poseidonHash(word(BigInt(REVOKED) % FIELD_SIZE)));
      expect(newLeaf.value).to.equal(poseidonHash(newDgCommit + word(1n).slice(2) + word(timestamp).slice(2)));

      expect((await recovery.getRecoveryRequest(passportHash)).readyAt).to.equal(0n);
    });

    it("should increase the counter on every recovery", async () => {
      await requestRecovery(newIdentityKey);
      await time.increase(recoveryDelay);
      await recovery.finalizeRecovery(passportHash);

      await requestRecovery(otherIdentityKey);
      await time.increase(recoveryDelay);
      await recovery.finalizeRecovery(passportHash);

      const [passportInfo] = await stateKeeper.getPassportInfo(passportHash);

      expect(passportInfo.activeIdentity).to.equal(otherIdentityKey);
      expect(passportInfo.identityReissueCounter).to.equal(2n);
    });

    it("should revert if the recovery is not ready", async () => {
      await requestRecovery(newIdentityKey);

      await time.increase(recoveryDelay - 5n);

      await expect(recovery.finalizeRecovery(passportHash)).to.be.revertedWith("NoAARecovery: recovery is not ready");
    });

    it("should revert if the recovery is not requested", async () => {
      await expect(recovery.finalizeRecovery(passportHash)).to.be.revertedWith(
        "NoAARecovery: recovery is not requested",
      );
    });

    it("should revert if the active identity changed", async () => {
      await requestRecovery(newIdentityKey);

      await stateKeeper.mockPassportData(passportHash, otherIdentityKey);
      await time.increase(recoveryDelay);

      await expect(recovery.finalizeRecovery(passportHash)).to.be.revertedWith("NoAARecovery: active identity changed");
    });

    it("should keep the old bond if the new identity got registered meanwhile", async () => {
      await requestRecovery(newIdentityKey);

      await registerNoAa(newIdentityKey, word(0x7777n));
      await time.increase(recoveryDelay);

      await expect(recovery.finalizeRecovery(passportHash)).to.be.revertedWith(
        "StateKeeper: identity already registered",
      );

      const [passportInfo] = await stateKeeper.getPassportInfo(passportHash);

      expect(passportInfo.activeIdentity).to.equal(oldIdentityKey);
    });

    it("should revert if the module is not a registration", async () => {
      await requestRecovery(newIdentityKey);

      await stateKeeper.updateRegistrationSet(
        StateKeeperMethodId.RemoveRegistrations,
        ethers.AbiCoder.defaultAbiCoder().encode(["string[]"], [[recoveryName]]),
      );
      await time.increase(recoveryDelay);

      await expect(recovery.finalizeRecovery(passportHash)).to.be.revertedWith("StateKeeper: not a registration");
    });
  });

  describe("#cancelRecovery", () => {
    it("should cancel the request with a proof of the active key", async () => {
      await requestRecovery(newIdentityKey);
      await expectKeyPossession(oldIdentityKey, Action.CancelRecovery);

      const tx = await recovery.connect(SECOND).cancelRecovery(passportHash, "0x");
      const lockedUntil = BigInt(await time.latest()) + lockDuration;

      await expect(tx).to.emit(recovery, "RecoveryCancelled").withArgs(passportHash, newIdentityKey);

      expect((await recovery.getRecoveryRequest(passportHash)).readyAt).to.equal(0n);
      expect(await recovery.lockedUntil(passportHash)).to.equal(lockedUntil);
      expect(await recovery.nonces(passportHash)).to.equal(1n);
    });

    it("should bind the message to chain, contract, action, passport and nonce", async () => {
      expect(await recovery.getKeyPossessionMessage(passportHash, Action.CancelRecovery)).to.equal(
        await keyPossessionMessage(Action.CancelRecovery, 0n),
      );

      const messages = new Set([
        await recovery.getKeyPossessionMessage(passportHash, Action.CancelRecovery),
        await recovery.getKeyPossessionMessage(passportHash, Action.LockRecovery),
        await recovery.getKeyPossessionMessage(passportHash, Action.UnlockRecovery),
        await recovery.getKeyPossessionMessage(word(0x9999n), Action.CancelRecovery),
      ]);

      expect(messages.size).to.equal(4);
    });

    it("should revert if the proof is for another key or action", async () => {
      await requestRecovery(newIdentityKey);

      await expectKeyPossession(newIdentityKey, Action.CancelRecovery);
      await expect(recovery.cancelRecovery(passportHash, "0x")).to.be.revertedWithCustomError(
        recovery,
        "InvalidNoirProof",
      );

      await expectKeyPossession(oldIdentityKey, Action.LockRecovery);
      await expect(recovery.cancelRecovery(passportHash, "0x")).to.be.revertedWithCustomError(
        recovery,
        "InvalidNoirProof",
      );
    });

    it("should not accept a used proof again", async () => {
      await requestRecovery(newIdentityKey);
      await expectKeyPossession(oldIdentityKey, Action.CancelRecovery);
      await recovery.cancelRecovery(passportHash, "0x");

      await time.increase(lockDuration);
      await requestRecovery(newIdentityKey);

      await expect(recovery.cancelRecovery(passportHash, "0x")).to.be.revertedWithCustomError(
        recovery,
        "InvalidNoirProof",
      );
    });

    it("should revert if the recovery is not requested", async () => {
      await expect(recovery.cancelRecovery(passportHash, "0x")).to.be.revertedWith(
        "NoAARecovery: recovery is not requested",
      );
    });
  });

  describe("#lockRecovery, #unlockRecovery", () => {
    it("should lock and unlock the recovery", async () => {
      await expectKeyPossession(oldIdentityKey, Action.LockRecovery);
      await expect(recovery.lockRecovery(passportHash, "0x"))
        .to.emit(recovery, "RecoveryLocked")
        .withArgs(passportHash);

      expect(await recovery.isRecoveryLocked(passportHash)).to.be.true;

      await expect(requestRecovery(newIdentityKey)).to.be.revertedWith("NoAARecovery: recovery is locked");

      await expectKeyPossession(oldIdentityKey, Action.UnlockRecovery);
      await expect(recovery.unlockRecovery(passportHash, "0x"))
        .to.emit(recovery, "RecoveryUnlocked")
        .withArgs(passportHash);

      expect(await recovery.isRecoveryLocked(passportHash)).to.be.false;

      await expect(requestRecovery(newIdentityKey)).to.emit(recovery, "RecoveryRequested");
    });

    it("should drop the pending request on lock", async () => {
      await requestRecovery(newIdentityKey);
      await expectKeyPossession(oldIdentityKey, Action.LockRecovery);

      await expect(recovery.lockRecovery(passportHash, "0x"))
        .to.emit(recovery, "RecoveryCancelled")
        .withArgs(passportHash, newIdentityKey);

      expect((await recovery.getRecoveryRequest(passportHash)).readyAt).to.equal(0n);
    });

    it("should revert on a wrong lock state", async () => {
      await expect(recovery.unlockRecovery(passportHash, "0x")).to.be.revertedWith(
        "NoAARecovery: recovery is not locked",
      );

      await recovery.lockRecovery(passportHash, "0x");

      await expect(recovery.lockRecovery(passportHash, "0x")).to.be.revertedWith("NoAARecovery: recovery is locked");
    });

    it("should revert if the passport is not registered", async () => {
      await expect(recovery.lockRecovery(word(0x9999n), "0x")).to.be.revertedWith(
        "NoAARecovery: passport is not registered",
      );
    });
  });

  describe("NoirKeyPossession", () => {
    let verifier: NoirKeyPossession;

    beforeEach(async () => {
      verifier = await ethers.deployContract("NoirKeyPossession");
    });

    it("should verify a real proof", async () => {
      expect(await verifier.verify(KeyPossessionProof, [KeyPossessionIdentityKey, KeyPossessionMessage])).to.be.true;
    });

    it("should reject the proof for another key or message", async () => {
      const call = async (publicInputs: string[]) =>
        ethers.provider.call({
          to: await verifier.getAddress(),
          data: verifier.interface.encodeFunctionData("verify", [KeyPossessionProof, publicInputs]),
        });

      for (const publicInputs of [
        [oldIdentityKey, KeyPossessionMessage],
        [KeyPossessionIdentityKey, word(1n)],
      ]) {
        await expect(call(publicInputs)).to.be.rejected.and.eventually.have.property("data", PAIRING_FAILED_SELECTOR);
      }
    });
  });

  describe("$ownable flow", () => {
    it("should update the parameters", async () => {
      await recovery.setRecoveryParams(1n, 2n);
      await recovery.setKeyPossessionVerifier(SECOND.address);
      await recovery.setZkTypes([P_NO_AA], true);

      expect(await recovery.recoveryDelay()).to.equal(1n);
      expect(await recovery.lockDuration()).to.equal(2n);
      expect(await recovery.keyPossessionVerifier()).to.equal(SECOND.address);
      expect(await recovery.allowedZkTypes(P_NO_AA)).to.be.true;
    });

    it("should revert on invalid parameters", async () => {
      await expect(recovery.setRecoveryParams(0n, 2n)).to.be.revertedWith("NoAARecovery: zero recovery delay");
      await expect(recovery.setKeyPossessionVerifier(ethers.ZeroAddress)).to.be.revertedWith(
        "NoAARecovery: zero verifier",
      );
    });

    it("should revert if not an owner", async () => {
      await expect(recovery.connect(SECOND).setRecoveryParams(1n, 2n)).to.be.revertedWith("NoAARecovery: not an owner");
      await expect(recovery.connect(SECOND).setKeyPossessionVerifier(SECOND.address)).to.be.revertedWith(
        "NoAARecovery: not an owner",
      );
      await expect(recovery.connect(SECOND).setZkTypes([P_NO_AA], true)).to.be.revertedWith(
        "NoAARecovery: not an owner",
      );
    });

    it("should upgrade only by an owner", async () => {
      const newImplementation = await ethers.deployContract("NoAARecovery");

      await expect(
        recovery.connect(SECOND).upgradeToAndCall(await newImplementation.getAddress(), "0x"),
      ).to.be.revertedWith("NoAARecovery: not an owner");

      await recovery.upgradeToAndCall(await newImplementation.getAddress(), "0x");

      expect(await recovery.implementation()).to.equal(await newImplementation.getAddress());
    });
  });
});
