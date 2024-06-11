import { expect } from "chai";
import { ethers } from "hardhat";
import { HDNodeWallet } from "ethers";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { ERC1967Proxy__factory, PoseidonSMT } from "@ethers-v6";

import { getPoseidon, Reverter, TSSMerkleTree, TSSSigner } from "@/test/helpers";

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
});
