import { expect } from "chai";
import { ethers } from "hardhat";
import { HDNodeWallet } from "ethers";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { ERC1967Proxy__factory, PoseidonSMT } from "@ethers-v6";

import { getPoseidon, Reverter, TSSMerkleTree, TSSSigner } from "@/test/helpers";
import { PoseidonSMTMethodId } from "@/test/helpers/constants";

const TREE_SIZE = 80;
const CHAIN_NAME = "Tests";

describe("PoseidonSMT", () => {
  const reverter = new Reverter();

  let signHelper: TSSSigner;
  let merkleTree: TSSMerkleTree;

  let SIGNER: HDNodeWallet;
  let REGISTRATION: SignerWithAddress;

  let ADDRESS1: SignerWithAddress;
  let ADDRESS2: SignerWithAddress;

  let tree: PoseidonSMT;

  const addRegistrations = async (registrations: string[]) => {
    const operations = merkleTree.addRegistrationsOperation(
      registrations,
      CHAIN_NAME,
      await tree.getNonce(PoseidonSMTMethodId.AddRegistrations),
      await tree.getAddress(),
    );

    await tree.updateRegistrationSet(PoseidonSMTMethodId.AddRegistrations, operations.data, operations.proof);
  };

  const removeRegistrations = async (registrations: string[]) => {
    const operations = merkleTree.removeRegistrationsOperation(
      registrations,
      CHAIN_NAME,
      await tree.getNonce(PoseidonSMTMethodId.RemoveRegistrations),
      await tree.getAddress(),
    );

    await tree.updateRegistrationSet(PoseidonSMTMethodId.RemoveRegistrations, operations.data, operations.proof);
  };

  before("setup", async () => {
    [REGISTRATION, ADDRESS1, ADDRESS2] = await ethers.getSigners();
    SIGNER = ethers.Wallet.createRandom();

    const PoseidonSMT = await ethers.getContractFactory("PoseidonSMT", {
      libraries: {
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
        PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
      },
    });
    tree = await PoseidonSMT.deploy();

    const Proxy: ERC1967Proxy__factory = await ethers.getContractFactory("ERC1967Proxy");

    const proxy = await Proxy.deploy(await tree.getAddress(), "0x");
    tree = tree.attach(await proxy.getAddress()) as PoseidonSMT;
    await tree.__PoseidonSMT_init(SIGNER.address, CHAIN_NAME, TREE_SIZE, REGISTRATION.address);

    signHelper = new TSSSigner(SIGNER);
    merkleTree = new TSSMerkleTree(signHelper);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("$init flow", () => {
    describe("#init", () => {
      it("should not initialize twice", async () => {
        expect(tree.__PoseidonSMT_init(SIGNER.address, CHAIN_NAME, TREE_SIZE, REGISTRATION.address)).to.be.revertedWith(
          "Initializable: contract is already initialized",
        );
      });
    });
  });

  describe("$registration management flow", async () => {
    describe("#addRegistrations, #removeRegistrations", () => {
      it("should add multiple registrations", async () => {
        await addRegistrations([ADDRESS1.address, ADDRESS2.address]);

        expect(await tree.isRegistrationExists(ADDRESS1.address)).to.be.true;
        expect(await tree.isRegistrationExists(ADDRESS2.address)).to.be.true;

        const registrations = await tree.getRegistrations();

        expect(registrations).to.have.lengthOf(3);
        expect(registrations).to.be.deep.eq([REGISTRATION.address, ADDRESS1.address, ADDRESS2.address]);

        await removeRegistrations([ADDRESS2.address]);

        expect(await tree.isRegistrationExists(ADDRESS1.address)).to.be.true;
        expect(await tree.isRegistrationExists(ADDRESS2.address)).to.be.false;
      });

      it("should not be able to add/remove with invalid signer", async () => {
        const ANOTHER_SIGNER = ethers.Wallet.createRandom();

        let operation = merkleTree.addRegistrationsOperation(
          [ADDRESS1.address],
          CHAIN_NAME,
          await tree.getNonce(PoseidonSMTMethodId.AddRegistrations),
          await tree.getAddress(),
          ANOTHER_SIGNER,
        );

        await expect(
          tree.updateRegistrationSet(PoseidonSMTMethodId.AddRegistrations, operation.data, operation.proof),
        ).to.be.rejectedWith("TSSSigner: invalid signature");

        operation = merkleTree.removeRegistrationsOperation(
          [ADDRESS1.address],
          CHAIN_NAME,
          await tree.getNonce(PoseidonSMTMethodId.RemoveRegistrations),
          await tree.getAddress(),
          ANOTHER_SIGNER,
        );

        await expect(
          tree.updateRegistrationSet(PoseidonSMTMethodId.RemoveRegistrations, operation.data, operation.proof),
        ).to.be.rejectedWith("TSSSigner: invalid signature");
      });

      it("should revert if trying to use same signature twice", async () => {
        const operation = merkleTree.addRegistrationsOperation(
          [ADDRESS1.address],
          CHAIN_NAME,
          await tree.getNonce(PoseidonSMTMethodId.AddRegistrations),
          await tree.getAddress(),
        );

        await tree.updateRegistrationSet(PoseidonSMTMethodId.AddRegistrations, operation.data, operation.proof);

        await expect(
          tree.updateRegistrationSet(PoseidonSMTMethodId.AddRegistrations, operation.data, operation.proof),
        ).to.be.rejectedWith("TSSSigner: invalid signature");
      });
    });

    it("should revert if invalid operation was signed", async () => {
      const signature = merkleTree.authorizeUpgradeOperation(
        PoseidonSMTMethodId.None,
        ethers.ZeroAddress,
        CHAIN_NAME,
        await tree.getNonce(PoseidonSMTMethodId.AddRegistrations),
        await tree.getAddress(),
      );

      await expect(
        tree.updateRegistrationSet(PoseidonSMTMethodId.None, ethers.ZeroAddress, signature),
      ).to.be.rejectedWith("PoseidonSMT: Invalid method");
    });
  });

  describe("$TSS flow", () => {
    describe("#changeSigner", () => {
      const newSigner = ethers.Wallet.createRandom();
      const tssPublicKey = "0x" + newSigner.signingKey.publicKey.slice(4);

      it("should change signer if signature and new public key are valid", async () => {
        expect(await tree.getFunction("signer").staticCall()).to.eq(SIGNER.address);

        const signature = signHelper.signChangeSigner(tssPublicKey);

        await tree.changeSigner(tssPublicKey, signature);

        expect(await tree.getFunction("signer").staticCall()).to.eq(newSigner.address);
      });
    });
  });

  describe("$upgrade flow", () => {
    describe("#upgrade", () => {
      it("should upgrade the contract", async () => {
        const PoseidonSMT = await ethers.getContractFactory("PoseidonSMT", {
          libraries: {
            PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
            PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
          },
        });
        const newTree = await PoseidonSMT.deploy();

        const signature = merkleTree.authorizeUpgradeOperation(
          PoseidonSMTMethodId.AuthorizeUpgrade,
          await newTree.getAddress(),
          CHAIN_NAME,
          await tree.getNonce(PoseidonSMTMethodId.AuthorizeUpgrade),
          await tree.getAddress(),
        );

        await tree.upgradeToWithProof(await newTree.getAddress(), signature);

        expect(await tree.implementation()).to.be.eq(await newTree.getAddress());
      });

      it("should revert if trying to upgrade to zero address", async () => {
        const signature = merkleTree.authorizeUpgradeOperation(
          PoseidonSMTMethodId.AuthorizeUpgrade,
          ethers.ZeroAddress,
          CHAIN_NAME,
          await tree.getNonce(PoseidonSMTMethodId.AuthorizeUpgrade),
          await tree.getAddress(),
        );

        await expect(tree.upgradeToWithProof(ethers.ZeroAddress, signature)).to.be.rejectedWith(
          "PoseidonSMT: Zero address",
        );
      });

      it("should revert if operation was signed by the invalid signer", async () => {
        const ANOTHER_SIGNER = ethers.Wallet.createRandom();

        const signature = merkleTree.authorizeUpgradeOperation(
          PoseidonSMTMethodId.AuthorizeUpgrade,
          await tree.getAddress(),
          CHAIN_NAME,
          await tree.getNonce(PoseidonSMTMethodId.AuthorizeUpgrade),
          await tree.getAddress(),
          ANOTHER_SIGNER,
        );

        await expect(tree.upgradeToWithProof(await tree.getAddress(), signature)).to.be.rejectedWith(
          "TSSSigner: invalid signature",
        );
      });
    });

    it("should revert if trying to use default `upgradeTo` method", async () => {
      await expect(tree.upgradeTo(ethers.ZeroAddress)).to.be.rejectedWith("PoseidonSMT: This upgrade method is off");
    });
  });
});
