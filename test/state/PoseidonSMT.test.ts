import { expect } from "chai";
import { ethers } from "hardhat";
import { ZeroHash } from "ethers";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { ERC1967Proxy__factory, PoseidonSMT } from "@ethers-v6";

import { getPoseidon, Reverter } from "@/test/helpers";

const treeSize = 80;

describe("PoseidonSMT", () => {
  const reverter = new Reverter();

  let STATE_KEEPER: SignerWithAddress;
  let ADDRESS1: SignerWithAddress;

  let tree: PoseidonSMT;

  before("setup", async () => {
    [STATE_KEEPER, ADDRESS1] = await ethers.getSigners();

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
    await tree.__PoseidonSMT_init(STATE_KEEPER.address, ethers.ZeroAddress, treeSize);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("access", () => {
    it("should not be called by non-registrations", async () => {
      await expect(tree.connect(ADDRESS1).add(ZeroHash, ZeroHash)).to.be.rejectedWith(
        "PoseidonSMT: not a state keeper",
      );
      await expect(tree.connect(ADDRESS1).update(ZeroHash, ZeroHash)).to.be.rejectedWith(
        "PoseidonSMT: not a state keeper",
      );
      await expect(tree.connect(ADDRESS1).remove(ZeroHash)).to.be.rejectedWith("PoseidonSMT: not a state keeper");
    });
  });

  describe("$init flow", () => {
    describe("#init", () => {
      it("should not initialize twice", async () => {
        expect(tree.__PoseidonSMT_init(STATE_KEEPER.address, ethers.ZeroAddress, treeSize)).to.be.revertedWith(
          "Initializable: contract is already initialized",
        );
      });
    });
  });
});
