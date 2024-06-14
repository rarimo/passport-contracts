import { expect } from "chai";
import { ethers } from "hardhat";

import { PRSASHA1Dispatcher } from "@ethers-v6";

import { Reverter, getPoseidon } from "@/test/helpers/";
import {
  identityKey,
  identityKeyChallenge,
  RSAPassportIdentitySignature1,
  RSAPassportPubKey,
} from "@/test/helpers/constants";

describe("PRSASHA1Dispatcher", () => {
  const reverter = new Reverter();

  let dispatcher: PRSASHA1Dispatcher;

  before("setup", async () => {
    const PRSASHA1Authenticator = await ethers.getContractFactory("PRSASHA1Authenticator");
    const PRSASHA1Dispatcher = await ethers.getContractFactory("PRSASHA1Dispatcher", {
      libraries: {
        PoseidonUnit5L: await (await getPoseidon(5)).getAddress(),
      },
    });

    dispatcher = await PRSASHA1Dispatcher.deploy();

    const rsaSha1Authenticator = await PRSASHA1Authenticator.deploy();
    dispatcher = await PRSASHA1Dispatcher.deploy();

    await dispatcher.__PRSASHA1Dispatcher_init(await rsaSha1Authenticator.getAddress());

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#init", () => {
    it("should not init twice", async () => {
      expect(dispatcher.__PRSASHA1Dispatcher_init(ethers.hexlify(ethers.randomBytes(20)))).to.be.revertedWith(
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
