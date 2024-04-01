import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { Reverter, deployPoseidons, getPoseidon, poseidonHash } from "@/test/helpers/";

import { Registration, VerifierMock } from "@ethers-v6";
import { VerifierHelper } from "@/generated-types/ethers/contracts/registration/Registration";

const ICAO_MERKLE_ROOT = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";

describe("Registration", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let registration: Registration;
  let verifierMock: VerifierMock;

  before("setup", async () => {
    [OWNER] = await ethers.getSigners();

    await deployPoseidons(OWNER, [2, 3, 5], false);

    const Registration = await ethers.getContractFactory("Registration", {
      libraries: {
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
        PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
        PoseidonUnit5L: await (await getPoseidon(5)).getAddress(),
      },
    });
    const VerifierMock = await ethers.getContractFactory("VerifierMock");

    registration = await Registration.deploy();
    verifierMock = await VerifierMock.deploy();

    await registration.__Registration_init(80, await verifierMock.getAddress(), ICAO_MERKLE_ROOT);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#register", () => {
    function packDate(timestamp: number) {
      const date = new Date(timestamp * 1000);

      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      return day | ((month + 1) << 8) | ((year - 2000) << 16);
    }

    it("should register", async () => {
      const privKey = "0xed54a648103a338f9f9873534951457d99020e6a070c0a565cb0b6308485b577";
      const pubKeyX = "0x2c2b7d910cfc889cb631308bfa413b3e784693566068dd94d160521f4c4ee70a";
      const pubKeyY = "0x229f68b51ac40d9086d4fa03ffcb0c7db4c4d37f883a71250b3186a3da7f8d25";

      const poseidon2PubKey = "0x0cc57e8bd4b27f09511b68436da005d50eac2d7b1a86b446fcedfc7153e46fe0";

      const signature =
        "0xB745585770567DB51CC8C9BAE4B04D9F2DC482D16CB20A4EAB9CEB5D197D5E7E0126667F8E24896A9A177F15FD6C17141B174EF7E091E9E1337F99C19D8D6B2AAF6CE0821363D9BEBE40AB25B9D82688C2EB4CF5F67AA7AE4B7114D6ECF1C97EE56DF3E8E024BAA41B9C31604D9396AE22C4B50F429573850D3B6C9F3468A18D";
      const modulus =
        "0xd21f63969effab33383ab4f8a3955739ad8ae14879d17509b4f444284e52de3956ed40e5245ea8d9db9540c7ed21aa5ca17fb84f1651d218d183a19b017d80335dbcc2e8c5c2ba1705235ac897f942190d2a2ad60119178ef2b555ea5772c65a32bf42699ee512949235702c7b9d2176e498fef69be5651f8434686f7aa1adf7";

      const formattedProof: VerifierHelper.ProofPointsStruct = {
        a: [0, 0],
        b: [
          [0, 0],
          [0, 0],
        ],
        c: [0, 0],
      };
      const proofTime = await time.latest();

      await registration.register(pubKeyX, pubKeyY, signature, modulus, formattedProof, packDate(proofTime), pubKeyX);
    });
  });
});
