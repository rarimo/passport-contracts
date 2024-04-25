import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { Reverter, getPoseidon } from "@/test/helpers/";

import { ECDSASHA1Dispatcher } from "@ethers-v6";
import { VerifierHelper } from "@/generated-types/ethers/contracts/dispatchers/ECDSASHA1Dispatcher";

describe("ECDSASHA1Dispatcher", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;

  let dispatcher: ECDSASHA1Dispatcher;

  before("setup", async () => {
    [OWNER] = await ethers.getSigners();

    const ECDSASHA1Verifier = await ethers.getContractFactory("VerifierMock");
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
      const challenge = "0xe7938ea62eb1980a";
      const signature =
        "0x13DCD0CCE676DFB4C2EF2B26F3AC8BB640146391C12EC80E052ABA2D617A58884060930A62757DC2003F4CAA38E9CFF44001E2B3D7286E03CA119B1AD7A680B1";
      const publicKey =
        "0x69501be7dac08517dfe4a44e1952cc9f5b21d22cbe4d3db26ea22542afbf85483d72a4671baa4bcd74f4cdc71bf6fe45a9ddaf50c5f6e3327078c90da2fcb304";

      expect(await dispatcher.authenticate(challenge, signature, publicKey)).to.be.true;
    });
  });

  describe("#zkProof", () => {
    it("should verify the zk proof", async () => {});
  });

  describe("#getPassportChallenge", () => {
    it("should get the challenge correctly", async () => {
      const input = "0xced3831dcf3a96049d93cbbd3eaa0010f3b97a70ef591269c8975afb4717e5";
      const result = "0x69c8975afb4717e5";

      expect(await dispatcher.getPassportChallenge(input)).to.equal(result);
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
