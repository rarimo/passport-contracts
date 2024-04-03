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

    it("should register", async () => {
      const icaoMerkleRoot = "0x2c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45";
      const poseidon2PubKey = "0xced3831dcf3a96049d93cbbd3eaa0010f3b97a70ef591269c8975afb4717e5";
      const group1Hash = "0x206187ab789aca5d2073582ba86f76c57f741ed2c78ccb96d79a9600b49df8d6";

      await registration.__Registration_init(TREE_SIZE, await registrationVerifier.getAddress(), icaoMerkleRoot);

      const signature =
        "0xa7ea14a7734f7d789c4f0493bd71cc34a10986c2ce2bfad2118f05d21b4aaf65ca15f6f408e2af0ecdbf37fbaca88998d365f39d865a8face1ca4205ca94a59630af03b2c565f29dea5f8b317a7c5f04db16f2ff115c21c9696e9d45a635c2f066cfd50df09d41328888d2c8fc386e9ebc170b56977af65a5ad74db1f0d25d46";
      const modulus =
        "0xae782184c70d1c9829be95f23b2c21abf5a82019a6648b933ca8abe4dc837582068d45d0b5f94cc4cd4c7cde9bef0f4d79534469997d95018e6391d294000d536c2654f79a829ff8cb74a32fdbbab73e16cab87ff600344ef9dda6cc11c4d67672d66e875bbacd4de1e5b2d4efdd50b027bc16f357218c345861c1bc8f38b28d";

      const formattedProof: VerifierHelper.ProofPointsStruct = {
        a: [
          "1622041246541719364375676140649029264387193270370653169743832721239417243214",
          "722625069376678952553619045676340161711899918862386545751619200743655527397",
        ],
        b: [
          [
            "6572050127215579342758288551258667828591362018934803711682159999142616045106",
            "1996793900476578136991719456987382418754060631791252473062149656295472929065",
          ],
          [
            "11474703322214281363488857985126449840456992969047601331951461879251837090845",
            "9914353967148169935499110567230984688508910023569876879292780630014387079953",
          ],
        ],
        c: [
          "7623491183446532677235094307063287140332555288468746029766903390272933720592",
          "1219548073783994741160491826962226753539985534696345160639380550580308251209",
        ],
      };

      await registration.register(poseidon2PubKey, signature, modulus, formattedProof, group1Hash);
    });
  });
});
