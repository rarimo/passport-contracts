import { expect } from "chai";
import { ethers } from "hardhat";
import { HDNodeWallet } from "ethers";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { ERC1967Proxy__factory, PoseidonSMT } from "@ethers-v6";

import { getPoseidon, Reverter, TSSMerkleTree, TSSSigner } from "@/test/helpers";
import { TSSUpgradeableId } from "@/test/helpers/constants";

const treeSize = 80;
const chainName = "Tests";

describe("PoseidonSMT", () => {
  const reverter = new Reverter();

  let signHelper: TSSSigner;
  let merkleTree: TSSMerkleTree;

  let SIGNER: HDNodeWallet;
  let STATEKEEPER: SignerWithAddress;

  let ADDRESS1: SignerWithAddress;
  let ADDRESS2: SignerWithAddress;

  let tree: PoseidonSMT;

  before("setup", async () => {
    [STATEKEEPER, ADDRESS1, ADDRESS2] = await ethers.getSigners();
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
    await tree.__PoseidonSMT_init(SIGNER.address, chainName, STATEKEEPER.address, treeSize);

    signHelper = new TSSSigner(SIGNER);
    merkleTree = new TSSMerkleTree(signHelper);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("$init flow", () => {
    describe("#init", () => {
      it("should not initialize twice", async () => {
        expect(tree.__PoseidonSMT_init(SIGNER.address, chainName, STATEKEEPER.address, treeSize)).to.be.revertedWith(
          "Initializable: contract is already initialized",
        );
      });
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
          await newTree.getAddress(),
          chainName,
          await tree.getNonce(TSSUpgradeableId.MAGIC_ID),
          await tree.getAddress(),
        );

        await tree.upgradeToWithProof(await newTree.getAddress(), signature);

        expect(await tree.implementation()).to.be.eq(await newTree.getAddress());
      });

      it("should revert if trying to upgrade to zero address", async () => {
        const signature = merkleTree.authorizeUpgradeOperation(
          ethers.ZeroAddress,
          chainName,
          await tree.getNonce(TSSUpgradeableId.MAGIC_ID),
          await tree.getAddress(),
        );

        await expect(tree.upgradeToWithProof(ethers.ZeroAddress, signature)).to.be.rejectedWith(
          "Upgradeable: Zero address",
        );
      });

      it("should revert if operation was signed by the invalid signer", async () => {
        const ANOTHER_SIGNER = ethers.Wallet.createRandom();

        const signature = merkleTree.authorizeUpgradeOperation(
          await tree.getAddress(),
          chainName,
          await tree.getNonce(TSSUpgradeableId.MAGIC_ID),
          await tree.getAddress(),
          ANOTHER_SIGNER,
        );

        await expect(tree.upgradeToWithProof(await tree.getAddress(), signature)).to.be.rejectedWith(
          "TSSSigner: invalid signature",
        );
      });
    });

    it("should revert if trying to use default `upgradeTo` method", async () => {
      await expect(tree.upgradeTo(ethers.ZeroAddress)).to.be.rejectedWith("Upgradeable: This upgrade method is off");
    });
  });
});
