import { expect } from "chai";
import { ethers } from "hardhat";
import { HDNodeWallet } from "ethers";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { StateKeeperMock, PoseidonSMTMock } from "@ethers-v6";

import { TSSMerkleTree, TSSSigner } from "@/test/helpers";
import { Reverter, getPoseidon } from "@/test/helpers/";

import { StateKeeperMethodId } from "@/test/helpers/constants";

const treeSize = 80;
const chainName = "Tests";

const icaoMerkleRoot = "0x2c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45";

describe("StateKeeper", () => {
  const reverter = new Reverter();

  let signHelper: TSSSigner;
  let merkleTree: TSSMerkleTree;

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

    await registrationSmt.__PoseidonSMT_init(SIGNER.address, chainName, await stateKeeper.getAddress(), treeSize);
    await certificatesSmt.__PoseidonSMT_init(SIGNER.address, chainName, await stateKeeper.getAddress(), treeSize);

    await stateKeeper.__StateKeeper_init(
      SIGNER.address,
      chainName,
      await registrationSmt.getAddress(),
      await certificatesSmt.getAddress(),
      icaoMerkleRoot,
    );

    signHelper = new TSSSigner(SIGNER);
    merkleTree = new TSSMerkleTree(signHelper);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("$TSS flow", async () => {
    describe("#changeICAOMasterTreeRoot", () => {
      const newIcaoMerkleRoot = "0x3c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45";
      const timestamp = "123456";

      it("should change the root", async () => {
        expect(await stateKeeper.icaoMasterTreeMerkleRoot()).to.equal(icaoMerkleRoot);

        const leaf = ethers.solidityPackedKeccak256(
          ["string", "bytes32", "uint256"],
          ["Rarimo CSCA root", newIcaoMerkleRoot, timestamp],
        );

        const proof = merkleTree.getProof(leaf, true);

        await stateKeeper.changeICAOMasterTreeRoot(newIcaoMerkleRoot, timestamp, proof);

        expect(await stateKeeper.icaoMasterTreeMerkleRoot()).to.equal(newIcaoMerkleRoot);
      });

      it("should not reuse the signature", async () => {
        const leaf = ethers.solidityPackedKeccak256(
          ["string", "bytes32", "uint256"],
          ["Rarimo CSCA root", newIcaoMerkleRoot, timestamp],
        );

        const proof = merkleTree.getProof(leaf, true);

        await stateKeeper.changeICAOMasterTreeRoot(newIcaoMerkleRoot, timestamp, proof);

        expect(stateKeeper.changeICAOMasterTreeRoot(newIcaoMerkleRoot, timestamp, proof)).to.be.revertedWith(
          "TSSSigner: nonce used",
        );
      });
    });

    describe("#addRegistrations, #removeRegistrations", () => {
      const REG1 = "ONE";
      const REG2 = "TWO";

      const addRegistrations = async (registrationKeys: string[], registrations: string[]) => {
        const operations = merkleTree.addRegistrationsOperation(
          registrationKeys,
          registrations,
          chainName,
          await stateKeeper.getNonce(StateKeeperMethodId.AddRegistrations),
          await stateKeeper.getAddress(),
        );

        await stateKeeper.updateRegistrationSet(
          StateKeeperMethodId.AddRegistrations,
          operations.data,
          operations.proof,
        );
      };

      const removeRegistrations = async (registrationKeys: string[]) => {
        const operations = merkleTree.removeRegistrationsOperation(
          registrationKeys,
          chainName,
          await stateKeeper.getNonce(StateKeeperMethodId.RemoveRegistrations),
          await stateKeeper.getAddress(),
        );

        await stateKeeper.updateRegistrationSet(
          StateKeeperMethodId.RemoveRegistrations,
          operations.data,
          operations.proof,
        );
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
      });

      it("should not be able to add/remove with invalid signer", async () => {
        const ANOTHER_SIGNER = ethers.Wallet.createRandom();

        let operation = merkleTree.addRegistrationsOperation(
          [REG1],
          [ADDRESS1.address],
          chainName,
          await stateKeeper.getNonce(StateKeeperMethodId.AddRegistrations),
          await stateKeeper.getAddress(),
          ANOTHER_SIGNER,
        );

        await expect(
          stateKeeper.updateRegistrationSet(StateKeeperMethodId.AddRegistrations, operation.data, operation.proof),
        ).to.be.rejectedWith("TSSSigner: invalid signature");

        operation = merkleTree.removeRegistrationsOperation(
          [REG1],
          chainName,
          await stateKeeper.getNonce(StateKeeperMethodId.RemoveRegistrations),
          await stateKeeper.getAddress(),
          ANOTHER_SIGNER,
        );

        await expect(
          stateKeeper.updateRegistrationSet(StateKeeperMethodId.RemoveRegistrations, operation.data, operation.proof),
        ).to.be.rejectedWith("TSSSigner: invalid signature");
      });

      it("should revert if trying to use same signature twice", async () => {
        const operation = merkleTree.addRegistrationsOperation(
          [REG1],
          [ADDRESS1.address],
          chainName,
          await stateKeeper.getNonce(StateKeeperMethodId.AddRegistrations),
          await stateKeeper.getAddress(),
        );

        await stateKeeper.updateRegistrationSet(StateKeeperMethodId.AddRegistrations, operation.data, operation.proof);

        await expect(
          stateKeeper.updateRegistrationSet(StateKeeperMethodId.AddRegistrations, operation.data, operation.proof),
        ).to.be.rejectedWith("TSSSigner: invalid signature");
      });
    });
  });
});
