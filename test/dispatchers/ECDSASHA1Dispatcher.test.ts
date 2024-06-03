import { expect } from "chai";
import { ethers } from "hardhat";

import { ECDSASHA1Dispatcher } from "@ethers-v6";

import { Reverter, getPoseidon } from "@/test/helpers/";

import {
  ECDSAPassportIdentityProof,
  ECDSAPassportIdentityPublicSignals,
  ECDSAPassportIdentitySignature1,
  ECDSAPassportPubKey,
  identityKey,
  identityKeyChallenge,
} from "@/test/helpers/constants";

describe("ECDSASHA1Dispatcher", () => {
  const reverter = new Reverter();

  let dispatcher: ECDSASHA1Dispatcher;

  before("setup", async () => {
    const ECDSASHA1Verifier = await ethers.getContractFactory("RSAECDSAVerifier");
    const ECDSASHA1Authenticator = await ethers.getContractFactory("ECDSASHA1Authenticator");
    const ECDSASHA1Dispatcher = await ethers.getContractFactory("ECDSASHA1Dispatcher", {
      libraries: {
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
      },
    });

    dispatcher = await ECDSASHA1Dispatcher.deploy();

    const ecdsaSha1Verifier = await ECDSASHA1Verifier.deploy();
    const ecdsaSha1Authenticator = await ECDSASHA1Authenticator.deploy();
    dispatcher = await ECDSASHA1Dispatcher.deploy();

    await dispatcher.__ECDSASHA1Dispatcher_init(
      await ecdsaSha1Authenticator.getAddress(),
      await ecdsaSha1Verifier.getAddress(),
    );

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#init", () => {
    it("should not init twice", async () => {
      expect(
        dispatcher.__ECDSASHA1Dispatcher_init(
          ethers.hexlify(ethers.randomBytes(20)),
          ethers.hexlify(ethers.randomBytes(20)),
        ),
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("#authenticate", () => {
    it("should authenticate", async () => {
      expect(await dispatcher.authenticate(identityKeyChallenge, ECDSAPassportIdentitySignature1, ECDSAPassportPubKey))
        .to.be.true;
    });
  });

  describe("#zkProof", () => {
    it("should verify the zk proof", async () => {
      expect(await dispatcher.verifyZKProof(ECDSAPassportIdentityPublicSignals, ECDSAPassportIdentityProof)).to.be.true;
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
        "0x69501be7dac08517dfe4a44e1952cc9f5b21d22cbe4d3db26ea22542afbf85483d72a4671baa4bcd74f4cdc71bf6fe45a9ddaf50c5f6e3327078c90da2fcb304";
      const result = "0x817879ff35b4a000f9207ff2be1a85c9fd39c01ac669aa7c2f6c4b743f8a168";

      expect(await dispatcher.getPassportKey(input)).to.equal(result);
    });
  });
});
