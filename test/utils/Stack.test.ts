import { ethers } from "hardhat";

import { StackMock } from "@ethers-v6";

import { getPoseidon, Reverter } from "@/test/helpers/";

describe.only("Stack", () => {
  const reverter = new Reverter();

  let stack: StackMock;

  before("setup", async () => {
    const Stack = await ethers.getContractFactory("StackMock");

    stack = await Stack.deploy();

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("stack", () => {
    it("stack", async () => {
      const y = BigInt("0x3d72a4671baa4bcd74f4cdc71bf6fe45a9ddaf50c5f6e3327078c90da2fcb304");
      const p = BigInt("0xA9FB57DBA1EEA9BC3E660A909D838D726E3BF623D52620282013481D1F6E5377");

      console.log(await stack.modmul("0x" + y.toString(16), "0x" + y.toString(16), "0x" + p.toString(16)));

      console.log(await stack.cmp("0x01", "0x01"));
      console.log(await stack.cmp("0x01", "0x02"));
      console.log(await stack.cmp("0x02", "0x01"));
    });
  });
});
