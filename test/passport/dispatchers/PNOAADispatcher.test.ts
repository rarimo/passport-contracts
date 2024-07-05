import { expect } from "chai";
import { ethers } from "hardhat";

import { PNOAADispatcher } from "@ethers-v6";

import { Reverter } from "@/test/helpers/";

describe("PNOAADispatcher", () => {
  const reverter = new Reverter();

  let dispatcher: PNOAADispatcher;

  before("setup", async () => {
    const PNOAADispatcher = await ethers.getContractFactory("PNOAADispatcher");

    dispatcher = await PNOAADispatcher.deploy();

    await dispatcher.__PNOAADispatcher_init();

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#init", () => {
    it("should not init twice", async () => {
      expect(dispatcher.__PNOAADispatcher_init()).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("#authenticate", () => {
    it("should authenticate", async () => {
      expect(await dispatcher.authenticate("0x", "0x", "0x")).to.be.true;
    });
  });

  describe("#getPassportChallenge", () => {
    it("should get the challenge correctly", async () => {
      expect(await dispatcher.getPassportChallenge(0)).to.equal("0x");
    });
  });

  describe("#getPassportKey", () => {
    it("should get the key correctly", async () => {
      expect(await dispatcher.getPassportKey("0x")).to.equal(0);
    });
  });
});
