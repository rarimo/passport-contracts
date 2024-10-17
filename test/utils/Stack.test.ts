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
      const a = BigInt("0x113d72a4671baa4bcd74f4cdc71bf6fe45a9ddaf50c5f6e3327078c90da2fcb304");
      const b = BigInt("0xAd72a4671baa4bcd74f4cdc71bf6fe45a9ddaf50c5f6e3327078c90da2fcb304");
      const m = BigInt("0x10FB57DBA1EEA9BC3E660A909D838D726E3BF623D52620282013481D1F6E5377");

      console.log(
        await stack.modadd(
          "0x" + a.toString(16).padStart(128, "0"),
          "0x" + b.toString(16).padStart(128, "0"),
          "0x" + m.toString(16).padStart(128, "0"),
        ),
      );
      console.log(((a + b) % m).toString(16));

      console.log(
        await stack.modsub(
          "0x" + a.toString(16).padStart(128, "0"),
          "0x" + b.toString(16).padStart(128, "0"),
          "0x" + m.toString(16).padStart(128, "0"),
        ),
      );
      console.log(((a - b) % m).toString(16));

      console.log(
        await stack.modmul(
          "0x" + a.toString(16).padStart(128, "0"),
          "0x" + b.toString(16).padStart(128, "0"),
          "0x" + m.toString(16).padStart(128, "0"),
        ),
      );
      console.log(((a * b) % m).toString(16));

      console.log(await stack.cmp("0x" + a.toString(16).padStart(128, "0"), "0x" + b.toString(16).padStart(128, "0")));
      console.log(await stack.cmp("0x" + b.toString(16).padStart(128, "0"), "0x" + a.toString(16).padStart(128, "0")));
      console.log(await stack.cmp("0x" + a.toString(16).padStart(128, "0"), "0x" + a.toString(16).padStart(128, "0")));

      console.log(
        await stack.modexp("0x" + a.toString(16).padStart(128, "0"), 100, "0x" + m.toString(16).padStart(128, "0")),
      );
      console.log((a ** 100n % m).toString(16));
    });
  });
});
