import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
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

    await deployPoseidons(OWNER, [1, 2, 3, 5], false);

    const Registration = await ethers.getContractFactory("Registration", {
      libraries: {
        PoseidonUnit1L: await (await getPoseidon(1)).getAddress(),
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
      const poseidon2PubKey = "0xced3831dcf3a96049d93cbbd3eaa0010f3b97a70ef591269c8975afb4717e5";
      const someHash = "0x2c2b7d910cfc889cb631308bfa413b3e784693566068dd94d160521f4c4ee70a";

      await registration.__Registration_init(TREE_SIZE, await verifierMock.getAddress(), icaoMerkleRoot);

      const signature =
        "0xa7ea14a7734f7d789c4f0493bd71cc34a10986c2ce2bfad2118f05d21b4aaf65ca15f6f408e2af0ecdbf37fbaca88998d365f39d865a8face1ca4205ca94a59630af03b2c565f29dea5f8b317a7c5f04db16f2ff115c21c9696e9d45a635c2f066cfd50df09d41328888d2c8fc386e9ebc170b56977af65a5ad74db1f0d25d46";
      const modulus =
        "0xae782184c70d1c9829be95f23b2c21abf5a82019a6648b933ca8abe4dc837582068d45d0b5f94cc4cd4c7cde9bef0f4d79534469997d95018e6391d294000d536c2654f79a829ff8cb74a32fdbbab73e16cab87ff600344ef9dda6cc11c4d67672d66e875bbacd4de1e5b2d4efdd50b027bc16f357218c345861c1bc8f38b28d";

      const formattedProof: VerifierHelper.ProofPointsStruct = {
        a: [0, 0],
        b: [
          [0, 0],
          [0, 0],
        ],
        c: [0, 0],
      };

      await registration.register(poseidon2PubKey, someHash, signature, modulus, formattedProof);
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

      await registration.register(poseidon2PubKey, group1Hash, signature, modulus, formattedProof);
    });
  });
});
