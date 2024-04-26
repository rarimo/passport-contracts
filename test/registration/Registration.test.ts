import { ethers } from "hardhat";
import { HDNodeWallet } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Reverter, getPoseidon } from "@/test/helpers/";
import { RSA_SHA1_2688 } from "@/scripts/utils/passport-types";

import { Registration, RegistrationMock, RSASHA1Dispatcher } from "@ethers-v6";
import { VerifierHelper } from "@/generated-types/ethers/contracts/registration/Registration";

import { TSSMerkleTree, TSSSigner } from "../helpers";
import { ZERO_ADDR } from "@/scripts/utils/constants";

const TREE_SIZE = 80;
const icaoMerkleRoot = "0x2c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45";

// private key: 0x163501939792ae27dcef29e894119236a12c76964d378514daa582195ea90c38
const identityKey = "0x07fe70c27b421e662c5099a884fc3291d8893391740320be101514d74801c43f";
// private key: 0x2f0c93d7fbb2565641d4d4568a59cf88793f410df86dd9315e9fd9e37f4ab4
const newIdentityKey = "0x231fc90b639cf778138f1e1c9edc5581a5b764545fbf106ada70dacb178b38d9";

const passportPubKey =
  "0xae782184c70d1c9829be95f23b2c21abf5a82019a6648b933ca8abe4dc837582068d45d0b5f94cc4cd4c7cde9bef0f4d79534469997d95018e6391d294000d536c2654f79a829ff8cb74a32fdbbab73e16cab87ff600344ef9dda6cc11c4d67672d66e875bbacd4de1e5b2d4efdd50b027bc16f357218c345861c1bc8f38b28d";

describe("Registration", () => {
  const reverter = new Reverter();

  let signHelper: TSSSigner;
  let merkleTree: TSSMerkleTree;

  let OWNER: SignerWithAddress;
  let SECOND: SignerWithAddress;
  let SIGNER: HDNodeWallet;

  let rsaSha1Dispatcher: RSASHA1Dispatcher;
  let registration: RegistrationMock;

  const deployRSASHA1Disaptcher = async () => {
    const RSASHA12688Verifier = await ethers.getContractFactory("RSASHA12688Verifier");
    const RSASHA1Authenticator = await ethers.getContractFactory("RSASHA1Authenticator");
    const RSASHA1Dispatcher = await ethers.getContractFactory("RSASHA1Dispatcher", {
      libraries: {
        PoseidonUnit5L: await (await getPoseidon(5)).getAddress(),
      },
    });

    const rsaSha12688Verifier = await RSASHA12688Verifier.deploy();
    const rsaSha1Authenticator = await RSASHA1Authenticator.deploy();
    rsaSha1Dispatcher = await RSASHA1Dispatcher.deploy();

    await rsaSha1Dispatcher.__RSASHA1Dispatcher_init(
      await rsaSha1Authenticator.getAddress(),
      await rsaSha12688Verifier.getAddress(),
    );
  };

  before("setup", async () => {
    [OWNER, SECOND] = await ethers.getSigners();
    SIGNER = ethers.Wallet.createRandom();

    const Registration = await ethers.getContractFactory("RegistrationMock", {
      libraries: {
        PoseidonUnit1L: await (await getPoseidon(1)).getAddress(),
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
        PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
      },
    });

    registration = await Registration.deploy();

    await deployRSASHA1Disaptcher();

    await registration.__Registration_init(TREE_SIZE, SIGNER.address, icaoMerkleRoot);

    await registration.addDispatcher(RSA_SHA1_2688, await rsaSha1Dispatcher.getAddress());

    signHelper = new TSSSigner(SIGNER);
    merkleTree = new TSSMerkleTree(signHelper);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("$init flow", () => {
    describe("#init", () => {
      it("should not initialize twice", async () => {
        expect(registration.__Registration_init(TREE_SIZE, SIGNER.address, icaoMerkleRoot)).to.be.revertedWith(
          "Initializable: contract is already initialized",
        );
      });
    });
  });

  describe("$ownable flow", () => {
    describe("#addDispatcher, #removeDispatcher", () => {
      it("should add and remove dispatchers", async () => {
        const someType = ethers.randomBytes(32);

        expect(await registration.passportDispatchers(someType)).to.equal(ZERO_ADDR);

        await registration.addDispatcher(someType, SIGNER.address);

        expect(registration.addDispatcher(someType, SIGNER.address)).to.be.revertedWith(
          "Registration: dispatcher already exists",
        );
        expect(await registration.passportDispatchers(someType)).to.equal(SIGNER.address);
      });

      it("should not be called by not owner", async () => {
        expect(registration.connect(SECOND).addDispatcher(ethers.randomBytes(32), SIGNER.address)).to.be.rejectedWith(
          "Ownable: caller is not the owner",
        );
        expect(registration.connect(SECOND).removeDispatcher(ethers.randomBytes(32))).to.be.rejectedWith(
          "Ownable: caller is not the owner",
        );
      });
    });
  });

  describe("$registration flow", () => {
    const register = async (
      identityOverride?: string,
      signatureOverride?: string,
      proofOverride?: VerifierHelper.ProofPointsStruct,
    ) => {
      const signature =
        "0x0eefd853e9a72a4fc802336f015da6bcfe5741d6ad6b292f6907c7a9f2aa81336b7cbd68cfd959c8a1877457f14b098eeb6c7a70ffdafdeb8346ac66301b3e16fc226bc3cc803fa3f9804e7801fbdad3ec45304763bd19aa92ab8f8dc8c9d0083e6368c001b8a8c40c7fdaee40934e798b15229fc14056bad9fc26dac34125bf";
      const dgCommit = "0x2d7a28fe5dcf90a75e00ebb85bf867efec70b2644f4533e617710ed8b816c5f8";

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

      const passport: Registration.PassportStruct = {
        dataType: RSA_SHA1_2688,
        signature: signatureOverride ?? signature,
        publicKey: passportPubKey,
      };

      return registration.register(
        identityOverride ?? identityKey,
        dgCommit,
        passport,
        proofOverride ?? formattedProof,
      );
    };

    const revoke = async (identityOverride?: string, signatureOverride?: string) => {
      const signature =
        "0x8314bacd355e2c40e03a383397d1cdae63b2b80351bcf69c96f3b48c618bff96c0836881010a37f675b19582c8c97a5e781213293202c9ebde8cef08a14e5f5a564ca3ee375b4f03f570a063a9a2edeb1a28c5b6bbc83d3a3e1ddf36b4774152e849051462fe1c8bf3010a8a215873151e95a480f265585032daa3ac4a3fd8e0";

      const passport: Registration.PassportStruct = {
        dataType: RSA_SHA1_2688,
        signature: signatureOverride ?? signature,
        publicKey: passportPubKey,
      };

      return registration.revoke(identityOverride ?? identityKey, passport);
    };

    const reissueIdentity = async (
      identityOverride?: string,
      signatureOverride?: string,
      proofOverride?: VerifierHelper.ProofPointsStruct,
    ) => {
      const signature =
        "0x8020affeaf4a48fef2ad2846985a4155e05ced9d2c94be1cd2ff86fbdef8196bbbea2ab0a51b28cbb2630b232f9101d1ea09c3f4cf1599e8771219367d9f06bf3ea4968f0412926880d50cfaff35254c56f8a08e303d6ec5a3c48480b4366d4e80a6aa367af8bf9a9f42ea713c00650058d7bd7ca6ce6f4bc8782111b17bc8b9";
      const dgCommit = "0x13b1f399cfaa3d3c26dfbf6c2acd28a747eb044cfc86c2366b10ef059e590192";

      const formattedProof: VerifierHelper.ProofPointsStruct = {
        a: [
          "0x03faf40920464d40669f53ac4bc8054104fb7a24b94c56bede306d1f0a7a4b51",
          "0x0af26d591f48411483faed852e33ac1ce7c5109369c6c1a19631b954baa2f2da",
        ],
        b: [
          [
            "0x18023b0b805ed4b30e9d68ace0c107d179dc2196b61a976d1f41e0cade425baa",
            "0x117c06f6b1e6c283cb36e71d541821cbde39e5f7a52f8ed85f406a5e5a9e2944",
          ],
          [
            "0x1397aa5bb3acccfe4e6c41a31d35190f1c94b8ee990c5c9af6dfe0bfab108c21",
            "0x06ba072e8b290c22cbe3d96f1782cf08d448528c1bb6a8f44c45ae0ef89e002f",
          ],
        ],
        c: [
          "0x2e5da360d6c630e345c7bf76750563730348ed43e5d4af3534ce384d7ce74e4e",
          "0x17b445c640a68df6e3ad0405e5d3734a7505cce5fc4ab1f3a60376da3268f9e1",
        ],
      };

      const passport: Registration.PassportStruct = {
        dataType: RSA_SHA1_2688,
        signature: signatureOverride ?? signature,
        publicKey: passportPubKey,
      };

      return registration.reissueIdentity(
        identityOverride ?? newIdentityKey,
        dgCommit,
        passport,
        proofOverride ?? formattedProof,
      );
    };

    describe("#register", () => {
      it("should register", async () => {
        await register();

        const passportInfo = await registration.getPassportInfo(
          ethers.toBeHex(await rsaSha1Dispatcher.getPassportKey(passportPubKey), 32),
        );

        expect(passportInfo.passportInfo_.activeIdentity).to.equal(ethers.toBeHex(identityKey, 32));
        expect(passportInfo.passportInfo_.identityReissueCounter).to.equal(0n);
      });

      it("should not register with wrong AA", async () => {
        const signature = "0x1111";

        expect(register(identityKey, signature)).to.be.revertedWith("Registration: invalid passport signature");
      });

      it("should not register with wrong ZK proof", async () => {
        const signature =
          "0x0eefd853e9a72a4fc802336f015da6bcfe5741d6ad6b292f6907c7a9f2aa81336b7cbd68cfd959c8a1877457f14b098eeb6c7a70ffdafdeb8346ac66301b3e16fc226bc3cc803fa3f9804e7801fbdad3ec45304763bd19aa92ab8f8dc8c9d0083e6368c001b8a8c40c7fdaee40934e798b15229fc14056bad9fc26dac34125bf";
        const formattedProof: VerifierHelper.ProofPointsStruct = {
          a: [0, 0],
          b: [
            [0, 0],
            [0, 0],
          ],
          c: [0, 0],
        };

        expect(register(identityKey, signature, formattedProof)).to.be.revertedWith("Registration: invalid zk proof");
      });

      it("should revert if passport already registered", async () => {
        await registration.mockPassportData(
          ethers.toBeHex(await rsaSha1Dispatcher.getPassportKey(passportPubKey), 32),
          identityKey,
        );

        expect(register()).to.be.revertedWith("Registration: passport already registered");
      });

      it("should revert if identity already registered", async () => {
        await registration.mockIdentityData(
          identityKey,
          ethers.toBeHex(await rsaSha1Dispatcher.getPassportKey(passportPubKey), 32),
        );

        expect(register()).to.be.revertedWith("Registration: identity already registered");
      });

      it("should revert if identity is zero", async () => {
        expect(register("0")).to.be.revertedWith("Registration: identity can not be zero");
      });
    });

    describe("#revoke", () => {
      it("should revoke", async () => {
        await register();
        await revoke();

        const passportInfo = await registration.getPassportInfo(
          ethers.toBeHex(await rsaSha1Dispatcher.getPassportKey(passportPubKey), 32),
        );

        const revoked = ethers.keccak256(ethers.toUtf8Bytes("REVOKED"));

        expect(passportInfo.passportInfo_.activeIdentity).to.equal(revoked);
      });

      it("should not revoke with the same signature", async () => {
        const signature =
          "0x8314bacd355e2c40e03a383397d1cdae63b2b80351bcf69c96f3b48c618bff96c0836881010a37f675b19582c8c97a5e781213293202c9ebde8cef08a14e5f5a564ca3ee375b4f03f570a063a9a2edeb1a28c5b6bbc83d3a3e1ddf36b4774152e849051462fe1c8bf3010a8a215873151e95a480f265585032daa3ac4a3fd8e0";

        await register();

        expect(revoke(identityKey, signature)).to.be.revertedWith("Registration: signature used");
      });

      it("should revert if passport already revoked", async () => {
        await register();

        await registration.mockPassportData(
          ethers.toBeHex(await rsaSha1Dispatcher.getPassportKey(passportPubKey), 32),
          newIdentityKey,
        );

        expect(revoke()).to.be.revertedWith("Registration: passport already revoked");
      });

      it("should revert if identity already revoked", async () => {
        await register();

        await registration.mockIdentityData(
          identityKey,
          ethers.toBeHex(await rsaSha1Dispatcher.getPassportKey(passportPubKey), 32).slice(0, -2) + "aa",
        );

        expect(revoke()).to.be.revertedWith("Registration: identity already revoked");
      });

      it("should revert if identity is zero", async () => {
        expect(revoke("0")).to.be.revertedWith("Registration: identity can not be zero");
      });
    });

    describe("#reissueIdentity", () => {
      it("should reissue identity", async () => {
        await register();
        await revoke();
        await reissueIdentity();

        const passportInfo = await registration.getPassportInfo(
          ethers.toBeHex(await rsaSha1Dispatcher.getPassportKey(passportPubKey), 32),
        );

        expect(passportInfo.passportInfo_.activeIdentity).to.equal(ethers.toBeHex(newIdentityKey, 32));
        expect(passportInfo.passportInfo_.identityReissueCounter).to.equal(1n);
      });

      it("should revert if passport is not revoked", async () => {
        await register();
        await revoke();

        await registration.mockPassportData(
          ethers.toBeHex(await rsaSha1Dispatcher.getPassportKey(passportPubKey), 32),
          newIdentityKey,
        );

        expect(reissueIdentity()).to.be.revertedWith("Registration: passport is not revoked");
      });

      it("should revert if identity is already registered", async () => {
        await register();
        await revoke();

        await registration.mockIdentityData(
          newIdentityKey,
          ethers.toBeHex(await rsaSha1Dispatcher.getPassportKey(passportPubKey), 32),
        );

        expect(reissueIdentity()).to.be.revertedWith("Registration: identity already registered");
      });

      it("should revert if identity is zero", async () => {
        expect(reissueIdentity("0")).to.be.revertedWith("Registration: identity can not be zero");
      });
    });
  });

  describe("$TSS flow", () => {
    describe("#changeSigner", () => {
      const newSigner = ethers.Wallet.createRandom();
      const tssPublicKey = "0x" + newSigner.signingKey.publicKey.slice(4);

      it("should not change signer if invalid signature", async () => {
        const signature = signHelper.signChangeSigner(newSigner.privateKey);
        const tx = registration.changeSigner(tssPublicKey, signature);

        await expect(tx).to.be.revertedWith("TSSSigner: invalid signature");
      });

      it("should not change signer if wrong pubKey length", async () => {
        const signature = signHelper.signChangeSigner(newSigner.privateKey);
        const tx = registration.changeSigner(newSigner.privateKey, signature);

        await expect(tx).to.be.revertedWith("TSSSigner: wrong pubKey length");
      });

      it("should not change signer if zero pubKey", async () => {
        const pBytes = "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F";
        const zeroBytes = "0000000000000000000000000000000000000000000000000000000000000000";
        const notNull = "0000000000000000000000000000000000000000000000000000000000000001";

        const zeroPubKeys = [
          "0x" + zeroBytes + notNull,
          "0x" + pBytes + notNull,
          "0x" + notNull + zeroBytes,
          "0x" + notNull + pBytes,
        ];

        for (const pubKey of zeroPubKeys) {
          const signature = signHelper.signChangeSigner(pubKey);
          const tx = registration.changeSigner(pubKey, signature);

          await expect(tx).to.be.revertedWith("TSSSigner: zero pubKey");
        }
      });

      it("should not change signer if pubKey not on the curve", async () => {
        const wrongPubKey =
          "0x10101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010";

        const signature = signHelper.signChangeSigner(wrongPubKey);
        const tx = registration.changeSigner(wrongPubKey, signature);

        await expect(tx).to.be.revertedWith("TSSSigner: pubKey not on the curve");
      });

      it("should change signer if all conditions are met", async () => {
        expect(await registration.getFunction("signer").staticCall()).to.eq(SIGNER.address);

        const signature = signHelper.signChangeSigner(tssPublicKey);

        await registration.changeSigner(tssPublicKey, signature);

        expect(await registration.getFunction("signer").staticCall()).to.eq(newSigner.address);
      });
    });

    describe("#changeICAOMasterTreeRoot", () => {
      const newIcaoMerkleRoot = "0x3c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45";
      const timestamp = "123456";

      it("should change the root", async () => {
        expect(await registration.icaoMasterTreeMerkleRoot()).to.equal(icaoMerkleRoot);

        const leaf = ethers.solidityPackedKeccak256(
          ["string", "bytes32", "uint256"],
          ["Rarimo CSCA root", newIcaoMerkleRoot, timestamp],
        );

        const proof = merkleTree.getProof(leaf, true);

        await registration.changeICAOMasterTreeRoot(newIcaoMerkleRoot, timestamp, proof);

        expect(await registration.icaoMasterTreeMerkleRoot()).to.equal(newIcaoMerkleRoot);
      });

      it("should not reuse the signature", async () => {
        const leaf = ethers.solidityPackedKeccak256(
          ["string", "bytes32", "uint256"],
          ["Rarimo CSCA root", newIcaoMerkleRoot, timestamp],
        );

        const proof = merkleTree.getProof(leaf, true);

        await registration.changeICAOMasterTreeRoot(newIcaoMerkleRoot, timestamp, proof);

        expect(registration.changeICAOMasterTreeRoot(newIcaoMerkleRoot, timestamp, proof)).to.be.revertedWith(
          "TSSSigner: nonce used",
        );
      });
    });
  });
});
