import { expect } from "chai";
import { ethers } from "hardhat";

import { PRSASHADispatcher } from "@ethers-v6";

import { Reverter, getPoseidon } from "@/test/helpers/";
import {
  identityKey,
  identityKeyChallenge,
  RSAPassportIdentitySignature1,
  RSAPassportPubKey,
} from "@/test/helpers/constants";

describe("PRSASHADispatcher", () => {
  const reverter = new Reverter();

  let dispatcher: PRSASHADispatcher;

  before("setup", async () => {
    const PRSASHAAuthenticator = await ethers.getContractFactory("PRSASHAAuthenticator");
    const PRSASHADispatcher = await ethers.getContractFactory("PRSASHADispatcher", {
      libraries: {
        PoseidonUnit5L: await (await getPoseidon(5)).getAddress(),
      },
    });

    dispatcher = await PRSASHADispatcher.deploy();

    const rsaShaAuthenticator = await PRSASHAAuthenticator.deploy();
    dispatcher = await PRSASHADispatcher.deploy();

    await rsaShaAuthenticator.__PRSASHAAuthenticator_init(65537, true);
    await dispatcher.__PRSASHADispatcher_init(await rsaShaAuthenticator.getAddress());

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#init", () => {
    it("should not init twice", async () => {
      expect(dispatcher.__PRSASHADispatcher_init(ethers.hexlify(ethers.randomBytes(20)))).to.be.revertedWith(
        "Initializable: contract is already initialized",
      );
    });
  });

  describe("#authenticate", () => {
    it("should authenticate", async () => {
      expect(await dispatcher.authenticate(identityKeyChallenge, RSAPassportIdentitySignature1, RSAPassportPubKey)).to
        .be.true;
    });
  });

  describe("#getPassportChallenge", () => {
    it("should get the challenge correctly", async () => {
      expect(await dispatcher.getPassportChallenge(identityKey)).to.equal(identityKeyChallenge);
    });
  });

  describe("#getPassportKey", () => {
    it("should get the key correctly", async () => {
      const input =
        "0xae782184c70d1c9829be95f23b2c21abf5a82019a6648b933ca8abe4dc837582068d45d0b5f94cc4cd4c7cde9bef0f4d79534469997d95018e6391d294000d536c2654f79a829ff8cb74a32fdbbab73e16cab87ff600344ef9dda6cc11c4d67672d66e875bbacd4de1e5b2d4efdd50b027bc16f357218c345861c1bc8f38b28d";
      const result = "0x2baee9a30a3e327ebe5153524acfde2674bb4d54146c903ed8969c94d1f20301";

      expect(await dispatcher.getPassportKey(input)).to.equal(result);
    });
  });
});
