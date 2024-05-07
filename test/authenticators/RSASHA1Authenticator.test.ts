import { ethers } from "hardhat";
import { expect } from "chai";
import { Reverter } from "@/test/helpers/";

import { RSASHA1Authenticator } from "@ethers-v6";

describe("RSASHA1Authenticator", () => {
  const reverter = new Reverter();

  let auth: RSASHA1Authenticator;

  before("setup", async () => {
    const RSASHA1Authenticator = await ethers.getContractFactory("RSASHA1Authenticator");

    auth = await RSASHA1Authenticator.deploy();

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#authenticate", () => {
    it("should authenticate passport", async () => {
      const challenge = "0x5119311531111100";

      const signature =
        "0xA997B163DC908BC84B3B804750B9F37268F75F2B716D3BF040398FCA7B7EF1FA12BF6A737D8714C682CB2FC8E0FC9E9149FA8DC811EF621F66BB25FE2A72751E7CCEB090B1D9B1AD77565D7F286AE5B9D17C55A3C950F550DD242EB141BEDEB9E5D4137C4828976D0F2B7AE9070FBB38D0F09D619E16CFD6E4E6203BE3A4E1BB";
      const modulus =
        "0xd21f63969effab33383ab4f8a3955739ad8ae14879d17509b4f444284e52de3956ed40e5245ea8d9db9540c7ed21aa5ca17fb84f1651d218d183a19b017d80335dbcc2e8c5c2ba1705235ac897f942190d2a2ad60119178ef2b555ea5772c65a32bf42699ee512949235702c7b9d2176e498fef69be5651f8434686f7aa1adf7";

      expect(await auth.authenticate(challenge, signature, modulus)).to.be.true;
    });
  });
});
