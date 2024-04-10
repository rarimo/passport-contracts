import { ethers } from "hardhat";
import { HDNodeWallet } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Reverter, deployPoseidons, getPoseidon } from "@/test/helpers/";
import { RSA_SHA1_2688 } from "@/scripts/utils/passport-types";

import { Registration, RegistrationMock, RSASHA1Dispatcher } from "@ethers-v6";
import { VerifierHelper } from "@/generated-types/ethers/contracts/registration/Registration";

import { TSSMerkleTree, TSSSigner } from "../helpers";
import { ZERO_ADDR } from "@/scripts/utils/constants";

const TREE_SIZE = 80;
const icaoMerkleRoot = "0x2c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45";

const identityKey = "0xced3831dcf3a96049d93cbbd3eaa0010f3b97a70ef591269c8975afb4717e5";
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
    const RSASHA1Verifier = await ethers.getContractFactory("RSASHA1Verifier");
    const RSASHA1Authenticator = await ethers.getContractFactory("RSASHA1Authenticator");
    const RSASHA1Dispatcher = await ethers.getContractFactory("RSASHA1Dispatcher", {
      libraries: {
        PoseidonUnit5L: await (await getPoseidon(5)).getAddress(),
      },
    });

    const rsaSha1Verifier = await RSASHA1Verifier.deploy();
    const rsaSha1Authenticator = await RSASHA1Authenticator.deploy();
    rsaSha1Dispatcher = await RSASHA1Dispatcher.deploy();

    await rsaSha1Dispatcher.__RSASHA1Dispatcher_init(
      await rsaSha1Authenticator.getAddress(),
      await rsaSha1Verifier.getAddress(),
    );
  };

  before("setup", async () => {
    [OWNER, SECOND] = await ethers.getSigners();
    SIGNER = ethers.Wallet.createRandom();

    await deployPoseidons(OWNER, [1, 2, 3, 5], false);

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
        "0xa7ea14a7734f7d789c4f0493bd71cc34a10986c2ce2bfad2118f05d21b4aaf65ca15f6f408e2af0ecdbf37fbaca88998d365f39d865a8face1ca4205ca94a59630af03b2c565f29dea5f8b317a7c5f04db16f2ff115c21c9696e9d45a635c2f066cfd50df09d41328888d2c8fc386e9ebc170b56977af65a5ad74db1f0d25d46";
      const dgCommit = "0x206187ab789aca5d2073582ba86f76c57f741ed2c78ccb96d79a9600b49df8d6";

      const formattedProof: VerifierHelper.ProofPointsStruct = {
        a: [
          "0x03960af5aef41d09feedd5667557b3f66906efc99d618e1b620c258d703f464e",
          "0x0198fdc5850cf60eb9322a4698168104b17929bd788a8fc41293e484253ad3e5",
        ],
        b: [
          [
            "0x0e87a6078b813d04d28c8eece683bdafed42d09164d84d4f985e33ab8dc71632",
            "0x046a25322c4b9895633cc5843743c4bbf2a713b7e29de5a9f26a8cad8de89929",
          ],
          [
            "0x195e73b16694ab3336060030270992f8c3a7645890b21538dbbf14eefd3b7c1d",
            "0x15eb5353267f74221773d78bc90ba1f339dae7741fc579d224f5e8095dfccb11",
          ],
        ],
        c: [
          "0x10dabe3bdf9e7cdb86977c8ad8234a9ce9ca7663e221678d24790e691719f210",
          "0x02b23d6029d3a89e45d77d09ed8c81cc669dd7b6bbaf43020520e1f6bdf39249",
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
        "0xad778f0761f791cef96619cefd7709c031eeaec86c158eb5d58ad636bc494bd84cd2bc9cf21e27ff17479abbecc7bfa284f9d20505b129db8c02cbf9cacc7f883e4d2552565854ec6db2ec736133eea3d6cd0ce514c413ecc7e73dabe7bd09b96638048aff55cd495b800b93c4d8f6ca52c1bd11727aa03056dafcb83ea18364";

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
          "0x0bb9104059b8be014598f86077bd78d8cbe255e823bde3f99d9927b60ef890a7",
          "0x2da9a7f0b765069ca6f0cfa13a97c18c9c8fff4ad6f7d9ec02e0ffa5c7249fcf",
        ],
        b: [
          [
            "0x1e7c560008de96f6bb5b16558ad75c9bb15e26e70bbb47558f2cd051cc871b6a",
            "0x05311d0224e4269d26f3bd737f794dcf6c1481b6ec4ca9866b949fca6a70aacb",
          ],
          [
            "0x1d8ea47009bd910d9fc8ae73d8846d8da662254d553c1e92da691c7598a18d05",
            "0x0a396c298164888db55c66f957a02b2ba6bdcf7e5882639b60f6bcaf77c24af3",
          ],
        ],
        c: [
          "0x0b1ff154590f8a790eac03f121e4a1496afa8cb527ae71f13d2699e31684d296",
          "0x1f3496bf0bff888cac2734271621fe65fbb97300dbab972f8df3132574fc8c39",
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
        const signature =
          "0xb7ea14a7734f7d789c4f0493bd71cc34a10986c2ce2bfad2118f05d21b4aaf65ca15f6f408e2af0ecdbf37fbaca88998d365f39d865a8face1ca4205ca94a59630af03b2c565f29dea5f8b317a7c5f04db16f2ff115c21c9696e9d45a635c2f066cfd50df09d41328888d2c8fc386e9ebc170b56977af65a5ad74db1f0d25d46";

        expect(register(identityKey, signature)).to.be.revertedWith("Registration: invalid passport signature");
      });

      it("should not register with wrong ZK proof", async () => {
        const signature =
          "0xa7ea14a7734f7d789c4f0493bd71cc34a10986c2ce2bfad2118f05d21b4aaf65ca15f6f408e2af0ecdbf37fbaca88998d365f39d865a8face1ca4205ca94a59630af03b2c565f29dea5f8b317a7c5f04db16f2ff115c21c9696e9d45a635c2f066cfd50df09d41328888d2c8fc386e9ebc170b56977af65a5ad74db1f0d25d46";
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
          "0xa7ea14a7734f7d789c4f0493bd71cc34a10986c2ce2bfad2118f05d21b4aaf65ca15f6f408e2af0ecdbf37fbaca88998d365f39d865a8face1ca4205ca94a59630af03b2c565f29dea5f8b317a7c5f04db16f2ff115c21c9696e9d45a635c2f066cfd50df09d41328888d2c8fc386e9ebc170b56977af65a5ad74db1f0d25d46";

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
          ["string", "bytes32", "uint64"],
          ["Rarimo CSCA root", newIcaoMerkleRoot, timestamp],
        );

        const proof = merkleTree.getProof(leaf, true);

        await registration.changeICAOMasterTreeRoot(newIcaoMerkleRoot, timestamp, proof);

        expect(await registration.icaoMasterTreeMerkleRoot()).to.equal(newIcaoMerkleRoot);
      });

      it("should not reuse the signature", async () => {
        const leaf = ethers.solidityPackedKeccak256(
          ["string", "bytes32", "uint64"],
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
