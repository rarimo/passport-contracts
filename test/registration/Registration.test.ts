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

// private key: 0x0ed54a648103a338f9f9873534951457d99020e6a070c0a565cb0b6308485b57
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
        "0x0eefd853e9a72a4fc802336f015da6bcfe5741d6ad6b292f6907c7a9f2aa81336b7cbd68cfd959c8a1877457f14b098eeb6c7a70ffdafdeb8346ac66301b3e16fc226bc3cc803fa3f9804e7801fbdad3ec45304763bd19aa92ab8f8dc8c9d0083e6368c001b8a8c40c7fdaee40934e798b15229fc14056bad9fc26dac34125bf";
      const dgCommit = "0x2d7a28fe5dcf90a75e00ebb85bf867efec70b2644f4533e617710ed8b816c5f8";

      const formattedProof: VerifierHelper.ProofPointsStruct = {
        a: [
          "0x2726196d623151786a5312430e452fc127d67f6f71c3f1e41f82635bcc347c12",
          "0x22210da66624f0738b238824490fc2ac4a7e3fd14c3ae8d72df12c9b3ba2769f",
        ],
        b: [
          [
            "0x18a24cb8849b87786b87aff05910823f887d7d406729662be4ccfd62711d6ea",
            "0x140ac60fa018ef7d932497a901ac09041a3f7231d99dc679fac713360bff32b2",
          ],
          [
            "0x1d1c3e720cb9fe13d7514d219fd52bd19ae3551b5be58a9acfc0054b6670ab9e",
            "0xad27c6f62410c1aab61a2afd45e6924b03d37dea99419dcde4d92b837ac9365",
          ],
        ],
        c: [
          "0x3de5ac6addc35b2a7dfe2475dc473cbb1c037e4232dd33a02ed7b2bf850b739",
          "0x2ad4d1892eabad69b85f9e076e8376d1e5649cb0336254b364bf074b415acfd8",
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
          "0x2a1f0aca3ce44d0f556f8035dc27d38a976bd1912a2749c9ac7659f4100ce258",
          "0x27804b0d2ebad01b1109e5c405d757547073871ba93c528d692896b78b658ac8",
        ],
        b: [
          [
            "0x262514555a71427078779ce3272990696089d1d940e35017d8bb002bf7f4ab9",
            "0xc533882ebd7fb923d5701bbf986a4a509bafafeb7e19c4e3920f4785fc2089b",
          ],
          [
            "0x167ccd27caedd2fb1f60a1c699cb927636b29c28a09bd6937eeef72b264f3719",
            "0x28ac83ad4d9f537d1f64698201c5ea7480f03a79079868a83edc6c2cf315a7ce",
          ],
        ],
        c: [
          "0x1a5fd97fb5edb93b85bf20d08f4a404ab5ba95d09d0021a2c678178ca6237a1b",
          "0x164ee20866ea97865c9cf6d64115d28609c16066de7b18b27f85152bece6cbd8",
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
