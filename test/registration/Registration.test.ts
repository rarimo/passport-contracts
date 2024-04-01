import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { Reverter, deployPoseidons, getPoseidon, poseidonHash } from "@/test/helpers/";

import { Registration, VerifierMock, RegistrationVerifier } from "@ethers-v6";
import { VerifierHelper } from "@/generated-types/ethers/contracts/registration/Registration";

const TREE_SIZE = 80;

describe("Registration", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let registration: Registration;
  let verifierMock: VerifierMock;
  let registrationVerifier: RegistrationVerifier;

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
    const RegistrationVerifier = await ethers.getContractFactory("RegistrationVerifier");

    registration = await Registration.deploy();
    verifierMock = await VerifierMock.deploy();
    registrationVerifier = await RegistrationVerifier.deploy();

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#register", () => {
    it("should register without proof", async () => {
      const icaoMerkleRoot = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";
      const someHash = "0x2c2b7d910cfc889cb631308bfa413b3e784693566068dd94d160521f4c4ee70a";
      const poseidon2PubKey = "0x0cc57e8bd4b27f09511b68436da005d50eac2d7b1a86b446fcedfc7153e46fe0";

      await registration.__Registration_init(TREE_SIZE, await verifierMock.getAddress(), icaoMerkleRoot);

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

      await registration.register(poseidon2PubKey, signature, modulus, formattedProof, someHash);
    });

    it.skip("should register", async () => {
      const icaoMerkleRoot = "0x2c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45";
      const poseidon2PubKey = "0x07fe70c27b421e662c5099a884fc3291d8893391740320be101514d74801c43f";
      const group1Hash = "0x2a18950489dbbae3eb7ad61e9a521439a937fe400f13e26a28cb31445b23f66c";

      await registration.__Registration_init(TREE_SIZE, await registrationVerifier.getAddress(), icaoMerkleRoot);

      const signature = "";
      const modulus = "";

      const formattedProof: VerifierHelper.ProofPointsStruct = {
        a: [
          "0x0d1bf791b8f9d2b48a57e0eaecf5ac2e44826f67c49ea577d3d0681d3f0c9a8c",
          "0x261d567a004ec9f622fb8d774c1462a7d33922d5cc24d1012c3f3362deea444e",
        ],
        b: [
          [
            "0x26f1df4f1fd7abbd637d6d8b16cf564d0d364e5742ae80a2c2c5ed14afb3a3fb",
            "0x18d5cb5297b2b0004cb4e62dca6269e201649452f0916bd3a69f68710a57d69c",
          ],
          [
            "0x04915499904fc3ee304d3c205b67f5a606bbc7b1c3e486b25691a768b4759462",
            "0x1fc32fd2b7b098384fff6e605422d60b42f720ac2c7dfcfccd3278403958220b",
          ],
        ],
        c: [
          "0x1242b4237e9c89883b4054e4a0e38e6076fadf62840387225e195627d85bce85",
          "0x24f71e79d7e1ad5a2abd8cca38cd99c228cda6d416113c54f4c019d7ac4baca6",
        ],
      };

      await registration.register(poseidon2PubKey, signature, modulus, formattedProof, group1Hash);
    });
  });
});
