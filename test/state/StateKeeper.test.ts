import { expect } from "chai";
import { ethers } from "hardhat";
import { HDNodeWallet, ZeroAddress, ZeroHash } from "ethers";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { StateKeeperMock, PoseidonSMTMock } from "@ethers-v6";

import { MerkleTreeHelper } from "@/test/helpers";
import { Reverter, getPoseidon } from "@/test/helpers/";

import { StateKeeperMethodId } from "@/test/helpers/constants";

const treeSize = 80;
const chainName = "Tests";

const icaoMerkleRoot = "0x2c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45";

describe("StateKeeper", () => {
  const reverter = new Reverter();

  let merkleTree: MerkleTreeHelper;

  let ADDRESS1: SignerWithAddress;
  let ADDRESS2: SignerWithAddress;
  let SIGNER: HDNodeWallet;

  let registrationSmt: PoseidonSMTMock;
  let certificatesSmt: PoseidonSMTMock;
  let stateKeeper: StateKeeperMock;

  before("setup", async () => {
    [ADDRESS1, ADDRESS2] = await ethers.getSigners();
    SIGNER = ethers.Wallet.createRandom();

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
    const Proxy = await ethers.getContractFactory("ERC1967Proxy");

    registrationSmt = await PoseidonSMT.deploy();
    certificatesSmt = await PoseidonSMT.deploy();
    stateKeeper = await StateKeeper.deploy();

    let proxy = await Proxy.deploy(await stateKeeper.getAddress(), "0x");
    stateKeeper = stateKeeper.attach(await proxy.getAddress()) as StateKeeperMock;

    proxy = await Proxy.deploy(await registrationSmt.getAddress(), "0x");
    registrationSmt = registrationSmt.attach(await proxy.getAddress()) as PoseidonSMTMock;

    proxy = await Proxy.deploy(await certificatesSmt.getAddress(), "0x");
    certificatesSmt = certificatesSmt.attach(await proxy.getAddress()) as PoseidonSMTMock;

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

    await evidenceDB.__EvidenceDB_init(await evidenceRegistry.getAddress(), 80);
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
      ADDRESS1.address,
      await registrationSmt.getAddress(),
      await certificatesSmt.getAddress(),
      icaoMerkleRoot,
    );

    merkleTree = new MerkleTreeHelper();

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("access", () => {
    it("should not be called by non-registrations", async () => {
      await expect(stateKeeper.addCertificate(ZeroHash, 0)).to.be.rejectedWith("StateKeeper: not a registration");
      await expect(stateKeeper.removeCertificate(ZeroHash)).to.be.rejectedWith("StateKeeper: not a registration");
      await expect(stateKeeper.addBond(ZeroHash, ZeroHash, ZeroHash, 0)).to.be.rejectedWith(
        "StateKeeper: not a registration",
      );
      await expect(stateKeeper.revokeBond(ZeroHash, ZeroHash)).to.be.rejectedWith("StateKeeper: not a registration");
      await expect(stateKeeper.reissueBondIdentity(ZeroHash, ZeroHash, 0)).to.be.rejectedWith(
        "StateKeeper: not a registration",
      );
      await expect(stateKeeper.useSignature(ZeroHash)).to.be.rejectedWith("StateKeeper: not a registration");
    });

    it("should not be called by non-owner", async () => {
      await stateKeeper.transferOwnership(ADDRESS2);
      await expect(stateKeeper.transferOwnership(ADDRESS2)).to.be.revertedWith("StateKeeper: not an owner");

      expect(await stateKeeper.owner()).to.be.equal(ADDRESS2);
    });
  });

  describe("$TSS flow", () => {
    describe("#changeICAOMasterTreeRoot", () => {
      const newIcaoMerkleRoot = "0x3c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45";
      const timestamp = "123456";

      it("should change the root", async () => {
        expect(await stateKeeper.icaoMasterTreeMerkleRoot()).to.equal(icaoMerkleRoot);

        await stateKeeper.changeICAOMasterTreeRoot(newIcaoMerkleRoot);

        expect(await stateKeeper.icaoMasterTreeMerkleRoot()).to.equal(newIcaoMerkleRoot);
      });

      it("should not reuse the signature", async () => {
        await stateKeeper.changeICAOMasterTreeRoot(newIcaoMerkleRoot);

        expect(stateKeeper.changeICAOMasterTreeRoot(newIcaoMerkleRoot)).to.be.revertedWith("TSSSigner: nonce used");
      });
    });

    describe("#addRegistrations, #removeRegistrations", () => {
      const REG1 = "ONE";
      const REG2 = "TWO";

      const addRegistrations = async (registrationKeys: string[], registrations: string[]) => {
        const encoder = new ethers.AbiCoder();
        const data = encoder.encode(["string[]", "address[]"], [registrationKeys, registrations]);

        await stateKeeper.updateRegistrationSet(StateKeeperMethodId.AddRegistrations, data);
      };

      const removeRegistrations = async (registrationKeys: string[]) => {
        const encoder = new ethers.AbiCoder();
        const data = encoder.encode(["string[]"], [registrationKeys]);

        await stateKeeper.updateRegistrationSet(StateKeeperMethodId.RemoveRegistrations, data);
      };

      it("should add multiple registrations", async () => {
        await addRegistrations([REG1, REG2], [ADDRESS1.address, ADDRESS2.address]);

        expect(await stateKeeper.isRegistration(ADDRESS1.address)).to.be.true;
        expect(await stateKeeper.isRegistration(ADDRESS2.address)).to.be.true;

        const registrations = await stateKeeper.getRegistrations();

        expect(registrations).to.have.lengthOf(2);
        expect(registrations).to.be.deep.eq([
          [REG1, REG2],
          [ADDRESS1.address, ADDRESS2.address],
        ]);

        await removeRegistrations([REG2]);

        expect(await stateKeeper.isRegistration(ADDRESS1.address)).to.be.true;
        expect(await stateKeeper.isRegistration(ADDRESS2.address)).to.be.false;
        expect(await stateKeeper.getRegistrationByKey(REG1)).to.equal(ADDRESS1.address);
        expect(await stateKeeper.getRegistrationByKey(REG2)).to.equal(ZeroAddress);
      });

      it("should not be able to add/remove with invalid signer", async () => {
        const encoder = new ethers.AbiCoder();
        const data = encoder.encode(["string[]", "address[]"], [[REG1], [ADDRESS1.address]]);

        await expect(
          stateKeeper.connect(ADDRESS2).updateRegistrationSet(StateKeeperMethodId.AddRegistrations, data),
        ).to.be.rejectedWith("TSSSigner: invalid signature");

        await expect(
          stateKeeper.connect(ADDRESS2).updateRegistrationSet(StateKeeperMethodId.RemoveRegistrations, data),
        ).to.be.rejectedWith("TSSSigner: invalid signature");
      });

      it("should revert if invalid operation was signed", async () => {
        await expect(stateKeeper.updateRegistrationSet(StateKeeperMethodId.None, "0x")).to.be.rejectedWith(
          "StateKeeper: Invalid method",
        );
      });
    });
  });
});
