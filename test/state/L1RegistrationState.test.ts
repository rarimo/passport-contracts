import { expect } from "chai";
import { ethers } from "hardhat";

import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { Reverter } from "@/test/helpers";

import { L1RegistrationState } from "@ethers-v6";

describe("L1RegistrationState", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let OTHER: SignerWithAddress;
  let RARIMO_ROLLUP: SignerWithAddress;

  let l1RegistrationState: L1RegistrationState;
  let implementation: L1RegistrationState;

  const ZERO_ROOT = ethers.ZeroHash;
  const ROOT_1 = ethers.id("ROOT_1");
  const ROOT_2 = ethers.id("ROOT_2");

  before(async () => {
    [OWNER, OTHER, RARIMO_ROLLUP] = await ethers.getSigners();

    const L1RegistrationState = await ethers.getContractFactory("L1RegistrationState");
    implementation = await L1RegistrationState.deploy();

    const Proxy = await ethers.getContractFactory("ERC1967Proxy");
    const proxy = await Proxy.deploy(await implementation.getAddress(), "0x");

    l1RegistrationState = L1RegistrationState.attach(await proxy.getAddress()) as L1RegistrationState;

    await l1RegistrationState.__L1RegistrationState_init(OWNER.address, RARIMO_ROLLUP.address);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("Initialization", () => {
    it("should set the correct owner and rarimo rollup address", async () => {
      expect(await l1RegistrationState.getOwners()).to.deep.equal([OWNER.address]);
      expect(await l1RegistrationState.rarimoRollup()).to.equal(RARIMO_ROLLUP.address);
      expect(await l1RegistrationState.latestRoot()).to.equal(ZERO_ROOT);
      expect(await l1RegistrationState.latestRootTimestamp()).to.equal(0);
    });

    it("should revert if trying to initialize twice", async () => {
      await expect(
        l1RegistrationState.__L1RegistrationState_init(OTHER.address, OTHER.address),
      ).to.be.revertedWithCustomError(l1RegistrationState, "InvalidInitialization");
    });
  });

  describe("setRegistrationRoot", () => {
    it("should allow rarimo rollup to set a root", async () => {
      const currentTimestamp = await time.latest();
      const tx = await l1RegistrationState.connect(RARIMO_ROLLUP).setRegistrationRoot(ROOT_1, currentTimestamp);

      await expect(tx).to.emit(l1RegistrationState, "RootSet").withArgs(ROOT_1);

      expect(await l1RegistrationState.roots(ROOT_1)).to.equal(currentTimestamp);
      expect(await l1RegistrationState.latestRoot()).to.equal(ROOT_1);
      expect(await l1RegistrationState.latestRootTimestamp()).to.equal(currentTimestamp);
    });

    it("should update latest root if timestamp is greater", async () => {
      const timestamp1 = (await time.latest()) + 1;
      await l1RegistrationState.connect(RARIMO_ROLLUP).setRegistrationRoot(ROOT_1, timestamp1);

      const timestamp2 = timestamp1 + 100;
      await l1RegistrationState.connect(RARIMO_ROLLUP).setRegistrationRoot(ROOT_2, timestamp2);

      expect(await l1RegistrationState.roots(ROOT_1)).to.equal(timestamp1);
      expect(await l1RegistrationState.roots(ROOT_2)).to.equal(timestamp2);
      expect(await l1RegistrationState.latestRoot()).to.equal(ROOT_2);
      expect(await l1RegistrationState.latestRootTimestamp()).to.equal(timestamp2);
    });

    it("should update latest root if timestamp is equal", async () => {
      const timestamp1 = (await time.latest()) + 1;
      await l1RegistrationState.connect(RARIMO_ROLLUP).setRegistrationRoot(ROOT_1, timestamp1);

      await l1RegistrationState.connect(RARIMO_ROLLUP).setRegistrationRoot(ROOT_2, timestamp1);

      expect(await l1RegistrationState.roots(ROOT_1)).to.equal(timestamp1);
      expect(await l1RegistrationState.roots(ROOT_2)).to.equal(timestamp1);
      expect(await l1RegistrationState.latestRoot()).to.equal(ROOT_2);
      expect(await l1RegistrationState.latestRootTimestamp()).to.equal(timestamp1);
    });

    it("should not update latest root if timestamp is smaller", async () => {
      const timestamp1 = (await time.latest()) + 100;
      await l1RegistrationState.connect(RARIMO_ROLLUP).setRegistrationRoot(ROOT_1, timestamp1);

      const timestamp2 = timestamp1 - 50; // Earlier timestamp
      await l1RegistrationState.connect(RARIMO_ROLLUP).setRegistrationRoot(ROOT_2, timestamp2);

      expect(await l1RegistrationState.roots(ROOT_1)).to.equal(timestamp1);
      expect(await l1RegistrationState.roots(ROOT_2)).to.equal(timestamp2);
      expect(await l1RegistrationState.latestRoot()).to.equal(ROOT_1); // Stays ROOT_1
      expect(await l1RegistrationState.latestRootTimestamp()).to.equal(timestamp1);
    });

    it("should revert if called by non-rarimo rollup address", async () => {
      await expect(l1RegistrationState.connect(OTHER).setRegistrationRoot(ROOT_1, (await time.latest()) + 1))
        .to.be.revertedWithCustomError(l1RegistrationState, "NotRarimoRollup")
        .withArgs(OTHER.address);
    });
  });

  describe("setRarimoRollup", () => {
    it("should allow owner to set the rarimo rollup address", async () => {
      await l1RegistrationState.connect(OWNER).setRarimoRollup(OTHER.address);
      expect(await l1RegistrationState.rarimoRollup()).to.equal(OTHER.address);
    });

    it("should revert if called by non-owner", async () => {
      await expect(l1RegistrationState.connect(OTHER).setRarimoRollup(OTHER.address)).to.be.revertedWithCustomError(
        l1RegistrationState,
        "UnauthorizedAccount",
      );
    });
  });

  describe("isRootLatest", () => {
    beforeEach(async () => {
      await l1RegistrationState.connect(RARIMO_ROLLUP).setRegistrationRoot(ROOT_1, await time.latest());
      await l1RegistrationState.connect(RARIMO_ROLLUP).setRegistrationRoot(ROOT_2, (await time.latest()) + 10);
    });

    it("should return true for the latest root", async () => {
      expect(await l1RegistrationState.isRootLatest(ROOT_2)).to.be.true;
    });

    it("should return false for a non-latest root", async () => {
      expect(await l1RegistrationState.isRootLatest(ROOT_1)).to.be.false;
    });

    it("should return false for a zero root", async () => {
      expect(await l1RegistrationState.isRootLatest(ZERO_ROOT)).to.be.false;
    });
  });

  describe("isRootValid", () => {
    let timestamp1: number;
    let timestamp2: number;
    let validityPeriod: number;

    beforeEach(async () => {
      validityPeriod = Number(await l1RegistrationState.ROOT_VALIDITY());

      timestamp1 = (await time.latest()) + 1;
      await l1RegistrationState.connect(RARIMO_ROLLUP).setRegistrationRoot(ROOT_1, timestamp1);
      timestamp2 = timestamp1 + 100;
      await l1RegistrationState.connect(RARIMO_ROLLUP).setRegistrationRoot(ROOT_2, timestamp2); // ROOT_2 is latest
    });

    it("should return false for zero root", async () => {
      expect(await l1RegistrationState.isRootValid(ZERO_ROOT)).to.be.false;
    });

    it("should return true for the latest root", async () => {
      expect(await l1RegistrationState.isRootValid(ROOT_2)).to.be.true;
    });

    it("should return true for a non-latest root within validity period", async () => {
      expect(await l1RegistrationState.isRootValid(ROOT_1)).to.be.true;

      await time.increaseTo(timestamp1 + validityPeriod - 10);

      expect(await l1RegistrationState.isRootValid(ROOT_1)).to.be.true;
    });

    it("should return false for a non-latest root after validity period", async () => {
      await time.increaseTo(timestamp1 + validityPeriod + 1);

      expect(await l1RegistrationState.isRootValid(ROOT_1)).to.be.false;
    });
  });

  describe("Upgradability Functionality", () => {
    it("should allow owner to authorize upgrade (internal check)", async () => {
      const newImplementation = await ethers.deployContract("L1RegistrationState");

      await expect(
        l1RegistrationState.connect(OTHER).upgradeToAndCall(await newImplementation.getAddress(), "0x"),
      ).to.be.revertedWithCustomError(l1RegistrationState, "UnauthorizedAccount");

      await l1RegistrationState.connect(OWNER).upgradeToAndCall(await newImplementation.getAddress(), "0x");

      expect(await l1RegistrationState.implementation()).to.equal(await newImplementation.getAddress());
    });
  });
});
