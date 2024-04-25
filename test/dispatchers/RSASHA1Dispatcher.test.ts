import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { Reverter, getPoseidon } from "@/test/helpers/";

import { RSASHA1Dispatcher } from "@ethers-v6";
import { VerifierHelper } from "@/generated-types/ethers/contracts/dispatchers/RSASHA1Dispatcher";

describe("RSASHA1Dispatcher", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;

  let dispatcher: RSASHA1Dispatcher;

  before("setup", async () => {
    [OWNER] = await ethers.getSigners();

    const RSASHA1Verifier = await ethers.getContractFactory("RSASHA12688Verifier");
    const RSASHA1Authenticator = await ethers.getContractFactory("RSASHA1Authenticator");
    const RSASHA1Dispatcher = await ethers.getContractFactory("RSASHA1Dispatcher", {
      libraries: {
        PoseidonUnit5L: await (await getPoseidon(5)).getAddress(),
      },
    });

    dispatcher = await RSASHA1Dispatcher.deploy();

    const rsaSha1Verifier = await RSASHA1Verifier.deploy();
    const rsaSha1Authenticator = await RSASHA1Authenticator.deploy();
    dispatcher = await RSASHA1Dispatcher.deploy();

    await dispatcher.__RSASHA1Dispatcher_init(
      await rsaSha1Authenticator.getAddress(),
      await rsaSha1Verifier.getAddress(),
    );

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#init", () => {
    it("should not init twice", async () => {
      expect(
        dispatcher.__RSASHA1Dispatcher_init(
          ethers.hexlify(ethers.randomBytes(20)),
          ethers.hexlify(ethers.randomBytes(20)),
        ),
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("#authenticate", () => {
    it("should authenticate", async () => {
      const challenge = "0x69c8975afb4717e5";
      const signature =
        "0xad778f0761f791cef96619cefd7709c031eeaec86c158eb5d58ad636bc494bd84cd2bc9cf21e27ff17479abbecc7bfa284f9d20505b129db8c02cbf9cacc7f883e4d2552565854ec6db2ec736133eea3d6cd0ce514c413ecc7e73dabe7bd09b96638048aff55cd495b800b93c4d8f6ca52c1bd11727aa03056dafcb83ea18364";
      const publicKey =
        "0xae782184c70d1c9829be95f23b2c21abf5a82019a6648b933ca8abe4dc837582068d45d0b5f94cc4cd4c7cde9bef0f4d79534469997d95018e6391d294000d536c2654f79a829ff8cb74a32fdbbab73e16cab87ff600344ef9dda6cc11c4d67672d66e875bbacd4de1e5b2d4efdd50b027bc16f357218c345861c1bc8f38b28d";

      expect(await dispatcher.authenticate(challenge, signature, publicKey)).to.be.true;
    });
  });

  describe("#zkProof", () => {
    it("should verify the zk proof", async () => {
      const formattedProof: VerifierHelper.ProofPointsStruct = {
        a: [
          "0x15de5889727e79822971005ea72180c8725d2e6ac54b328943ef6271c187dd0d",
          "0x2519660da877dc05ac6a4a13fd726ac4a0ee4684a19cd1113706a8d07a7f8933",
        ],
        b: [
          [
            "0x0aba84f244e63a6881796d00a1bf83d14d52cd158c603bfeabc7e2d259173fd4",
            "0x0c21c15d954f8606fc0ca9fbb4fc7685f483d375c3cf56b1a2c527617614f8c0",
          ],
          [
            "0x2f959e54d27c6f631e386acb62055e3b76dfb11bb1ba3b959e42f4795172502f",
            "0x0b376e519853315c8d9de4bdddeadadeaffb92a8e67655e015a3701f2129e959",
          ],
        ],
        c: [
          "0x1830b4a1177c4c723642de99d1dbac59d039a5ec854487dc02ea78fce09518e3",
          "0x2dfadba71d1a6cf7d004f7b149228af6135896691c712cfac7320bf5a32cbd57",
        ],
      };
      const publicSignals = [
        "0x2baee9a30a3e327ebe5153524acfde2674bb4d54146c903ed8969c94d1f20301",
        "0x2d7a28fe5dcf90a75e00ebb85bf867efec70b2644f4533e617710ed8b816c5f8",
        "0x07fe70c27b421e662c5099a884fc3291d8893391740320be101514d74801c43f",
        "0x2c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45",
      ];

      expect(await dispatcher.verifyZKProof(publicSignals, formattedProof)).to.be.true;
    });
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
        "0xae782184c70d1c9829be95f23b2c21abf5a82019a6648b933ca8abe4dc837582068d45d0b5f94cc4cd4c7cde9bef0f4d79534469997d95018e6391d294000d536c2654f79a829ff8cb74a32fdbbab73e16cab87ff600344ef9dda6cc11c4d67672d66e875bbacd4de1e5b2d4efdd50b027bc16f357218c345861c1bc8f38b28d";
      const result = "0x2baee9a30a3e327ebe5153524acfde2674bb4d54146c903ed8969c94d1f20301";

      expect(await dispatcher.getPassportKey(input)).to.equal(result);
    });
  });
});
