import { expect } from "chai";
import { ethers } from "hardhat";

import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { Reverter } from "@/test/helpers";

import { RegistrationSMTReplicator } from "@ethers-v6";

describe("RegistrationSMTReplicator", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let ORACLE1: SignerWithAddress;
  let ORACLE2: SignerWithAddress;
  let OTHER: SignerWithAddress;

  let replicator: RegistrationSMTReplicator;

  before("setup", async () => {
    [OWNER, ORACLE1, ORACLE2, OTHER] = await ethers.getSigners();

    const implementation = await ethers.deployContract("RegistrationSMTReplicator");

    const proxy = await ethers.deployContract("ERC1967Proxy", [await implementation.getAddress(), "0x"]);
    replicator = await ethers.getContractAt("RegistrationSMTReplicator", await proxy.getAddress());

    await replicator.__RegistrationSMTReplicator_init(3600, [ORACLE1]);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("Initialization", () => {
    it("should set the correct initial state", async () => {
      expect(await replicator.getOwners()).to.deep.equal([OWNER.address]);

      expect(await replicator.isOracle(ORACLE1.address)).to.be.true;
      expect(await replicator.getOracles()).to.deep.equal([ORACLE1.address]);
    });

    it("should revert if trying to initialize twice", async () => {
      await expect(replicator.__RegistrationSMTReplicator_init(3600, [OTHER.address])).to.be.revertedWithCustomError(
        replicator,
        "InvalidInitialization",
      );
    });
  });

  describe("Oracle Management", () => {
    describe("addOracles", () => {
      it("should allow owner to add multiple oracles", async () => {
        const newOracle3 = ethers.Wallet.createRandom().address;

        await replicator.connect(OWNER).addOracles([ORACLE2.address, newOracle3]);

        expect(await replicator.isOracle(ORACLE2.address)).to.be.true;
        expect(await replicator.isOracle(newOracle3)).to.be.true;
        expect(await replicator.getOracles()).to.deep.equal([ORACLE1.address, ORACLE2.address, newOracle3]);
      });

      it("should be idempotent when adding existing oracles", async () => {
        await replicator.connect(OWNER).addOracles([ORACLE1.address]);
        expect(await replicator.getOracles()).to.deep.equal([ORACLE1.address]); // No change

        await replicator.connect(OWNER).addOracles([ORACLE2.address, ORACLE1.address]);
        expect(await replicator.getOracles()).to.deep.equal([ORACLE1.address, ORACLE2.address]);
      });

      it("should revert if called by non-owner", async () => {
        await expect(replicator.connect(OTHER).addOracles([ORACLE2.address])).to.be.revertedWithCustomError(
          replicator,
          "UnauthorizedAccount",
        );
      });
    });

    describe("removeOracles", () => {
      beforeEach(async () => {
        await replicator.connect(OWNER).addOracles([ORACLE2.address]);

        expect(await replicator.getOracles()).to.deep.equal([ORACLE1.address, ORACLE2.address]);
      });

      it("should allow owner to remove an oracle", async () => {
        await replicator.connect(OWNER).removeOracles([ORACLE1.address]);

        expect(await replicator.isOracle(ORACLE1.address)).to.be.false;
        expect(await replicator.getOracles()).to.deep.equal([ORACLE2.address]);
      });

      it("should allow owner to remove multiple oracles", async () => {
        await replicator.connect(OWNER).removeOracles([ORACLE1.address, ORACLE2.address]);

        expect(await replicator.isOracle(ORACLE1.address)).to.be.false;
        expect(await replicator.isOracle(ORACLE2.address)).to.be.false;
        expect(await replicator.getOracles()).to.deep.equal([]);
      });

      it("should handle removing non-existent oracles gracefully", async () => {
        await replicator.connect(OWNER).removeOracles([OTHER.address]); // OTHER is not an oracle
        expect(await replicator.getOracles()).to.deep.equal([ORACLE1.address, ORACLE2.address]); // No change

        await replicator.connect(OWNER).removeOracles([ORACLE1.address, OTHER.address]);
        expect(await replicator.isOracle(ORACLE1.address)).to.be.false;
        expect(await replicator.getOracles()).to.deep.equal([ORACLE2.address]);
      });

      it("should revert if called by non-owner", async () => {
        await expect(replicator.connect(OTHER).removeOracles([ORACLE1.address])).to.be.revertedWithCustomError(
          replicator,
          "UnauthorizedAccount",
        );
      });
    });
  });

  describe("transitionRoot()", () => {
    it("should transit state", async () => {
      const randomRoot = ethers.hexlify(ethers.randomBytes(32));
      const currentTime = await time.latest();

      expect(await replicator.isRootValid(randomRoot)).to.be.false;

      await replicator.connect(ORACLE1).transitionRoot(randomRoot, currentTime);

      expect(await replicator.latestRoot()).to.equal(randomRoot);
      expect(await replicator.latestTimestamp()).to.equal(currentTime);

      expect(await replicator.isRootValid(randomRoot)).to.be.true;
    });

    it("should transit old root", async () => {
      const firstRoot = ethers.hexlify(ethers.randomBytes(32));
      const currentTime = await time.latest();

      await replicator.connect(ORACLE1).transitionRoot(firstRoot, currentTime);

      const secondRoot = ethers.hexlify(ethers.randomBytes(32));
      const secondTime = currentTime - 1;

      await replicator.connect(ORACLE1).transitionRoot(secondRoot, secondTime);

      expect(await replicator.latestRoot()).to.equal(firstRoot);

      expect(await replicator.isRootValid(secondRoot)).to.be.true;
    });
  });

  describe("Upgradability", () => {
    it("should allow owner to upgrade", async () => {
      const newImplementation = await ethers.deployContract("RegistrationSMTReplicator");
      const newImplementationAddress = await newImplementation.getAddress();

      const currentImplementationAddress = await replicator.implementation();
      expect(currentImplementationAddress).to.not.equal(newImplementationAddress);

      await replicator.connect(OWNER).upgradeToAndCall(newImplementationAddress, "0x");

      expect(await replicator.implementation()).to.equal(newImplementationAddress);
    });

    it("should revert if non-owner tries to upgrade", async () => {
      const newImplementation = await ethers.deployContract("RegistrationSMTReplicator");
      const newImplementationAddress = await newImplementation.getAddress();

      await expect(
        replicator.connect(OTHER).upgradeToAndCall(newImplementationAddress, "0x"),
      ).to.be.revertedWithCustomError(replicator, "UnauthorizedAccount");
    });
  });
});
