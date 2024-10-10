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
      console.log(await stack.mock());
    });
  });
});
