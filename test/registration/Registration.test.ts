import { expect } from "chai";
import { ethers } from "hardhat";
import { HDNodeWallet } from "ethers";

import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { Z_UNIVERSAL_4096, C_RSA_SHA2_4096, P_ECDSA_SHA1_2704, P_RSA_SHA1_2688, P_NO_AA } from "@/scripts/utils/types";

import {
  StateKeeperMock,
  CRSADispatcher,
  PNOAADispatcher,
  PRSASHADispatcher,
  PECDSASHA1Dispatcher,
  PoseidonSMTMock,
  Registration2Mock,
  Registration2,
  RegistrationSMTMock,
} from "@ethers-v6";
import { Groth16VerifierHelper } from "@/generated-types/ethers/contracts/registration/Registration2";

import { MerkleTreeHelper } from "@/test/helpers";
import { Reverter, getPoseidon } from "@/test/helpers/";
import {
  identityKey,
  newIdentityKey,
  RegistrationMethodId,
  ECDSAPassportNewIdentityProof,
  ECDSAPassportIdentitySignature1,
  ECDSAPassportIdentitySignature2,
  ECDSAPassportNewIdentitySignature1,
  ECDSAPassportIdentityProof,
  ECDSAPassportPubKey,
  ECDSAPassportIdentityPublicSignals,
  x509CertificateKeyCheckPrefix,
  x509CertificateSA,
  ECDSAPassportNewIdentityPublicSignals,
} from "@/test/helpers/constants";

const treeSize = 80;

const registrationName = "Initial";

const icaoMerkleRoot = "0x2c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45";

describe("Registration2", () => {
  const reverter = new Reverter();

  let merkleTree: MerkleTreeHelper;

  let OWNER: SignerWithAddress;
  let SECOND: SignerWithAddress;
  let SIGNER: HDNodeWallet;

  let pNoAaDispatcher: PNOAADispatcher;
  let pRsaSha1Dispatcher: PRSASHADispatcher;
  let pEcdsaSha1Dispatcher: PECDSASHA1Dispatcher;
  let cRsaDispatcher: CRSADispatcher;

  let registrationSmt: RegistrationSMTMock;
  let certificatesSmt: PoseidonSMTMock;
  let registration: Registration2Mock;
  let stateKeeper: StateKeeperMock;

  const deployCRSADispatcher = async () => {
    const CRSASHA2Signer = await ethers.getContractFactory("CRSASigner");
    const CRSADispatcher = await ethers.getContractFactory("CRSADispatcher", {
      libraries: {
        PoseidonUnit5L: await (await getPoseidon(5)).getAddress(),
      },
    });

    const rsaSha2Signer = await CRSASHA2Signer.deploy();
    cRsaDispatcher = await CRSADispatcher.deploy();

    await rsaSha2Signer.__CRSASigner_init(65537, 1);
    await cRsaDispatcher.__CRSADispatcher_init(await rsaSha2Signer.getAddress(), 512, x509CertificateKeyCheckPrefix);
  };

  const deployPNOAADispatcher = async () => {
    const PNOAADispatcher = await ethers.getContractFactory("PNOAADispatcher");

    pNoAaDispatcher = await PNOAADispatcher.deploy();

    await pNoAaDispatcher.__PNOAADispatcher_init();
  };

  const deployPRSASHA1Dispatcher = async () => {
    const PRSASHA1Authenticator = await ethers.getContractFactory("PRSASHAAuthenticator");
    const PRSASHA1Dispatcher = await ethers.getContractFactory("PRSASHADispatcher", {
      libraries: {
        PoseidonUnit5L: await (await getPoseidon(5)).getAddress(),
      },
    });

    const rsaSha1Authenticator = await PRSASHA1Authenticator.deploy();
    pRsaSha1Dispatcher = await PRSASHA1Dispatcher.deploy();

    await rsaSha1Authenticator.__PRSASHAAuthenticator_init(65537, true);
    await pRsaSha1Dispatcher.__PRSASHADispatcher_init(await rsaSha1Authenticator.getAddress());
  };

  const deployPECDSASHA1Dispatcher = async () => {
    const PECDSASHA1Authenticator = await ethers.getContractFactory("PECDSASHA1Authenticator");
    const PECDSASHA1Dispatcher = await ethers.getContractFactory("PECDSASHA1Dispatcher", {
      libraries: {
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
      },
    });

    const ecdsaSha1Authenticator = await PECDSASHA1Authenticator.deploy();
    pEcdsaSha1Dispatcher = await PECDSASHA1Dispatcher.deploy();

    await pEcdsaSha1Dispatcher.__PECDSASHA1Dispatcher_init(await ecdsaSha1Authenticator.getAddress());
  };

  const addDependency = async (
    operationType:
      | RegistrationMethodId.AddPassportDispatcher
      | RegistrationMethodId.AddCertificateDispatcher
      | RegistrationMethodId.AddPassportVerifier,
    dispatcherType: string,
    dispatcher: string,
  ) => {
    const encoder = new ethers.AbiCoder();
    const data = encoder.encode(["bytes32", "address"], [dispatcherType, dispatcher]);

    return registration.updateDependency(operationType, data);
  };

  const removeDependency = async (
    operationType:
      | RegistrationMethodId.RemovePassportDispatcher
      | RegistrationMethodId.RemoveCertificateDispatcher
      | RegistrationMethodId.RemovePassportVerifier,
    dispatcherType: string,
  ) => {
    const encoder = new ethers.AbiCoder();
    const data = encoder.encode(["bytes32"], [dispatcherType]);

    return registration.updateDependency(operationType, data);
  };

  before("setup", async () => {
    [OWNER, SECOND] = await ethers.getSigners();
    SIGNER = ethers.Wallet.createRandom();

    const StateKeeper = await ethers.getContractFactory("StateKeeperMock", {
      libraries: {
        PoseidonUnit1L: await (await getPoseidon(1)).getAddress(),
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
        PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
      },
    });
    const PoseidonSMT = await ethers.getContractFactory("PoseidonSMTMock", {
      libraries: {
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
        PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
      },
    });
    const RegistrationSMT = await ethers.getContractFactory("RegistrationSMTMock", {
      libraries: {
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
        PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
      },
    });
    const Registration = await ethers.getContractFactory("Registration2");
    const Proxy = await ethers.getContractFactory("ERC1967Proxy");

    registrationSmt = await RegistrationSMT.deploy();
    certificatesSmt = await PoseidonSMT.deploy();
    registration = (await Registration.deploy()) as any;
    stateKeeper = await StateKeeper.deploy();

    await deployCRSADispatcher();
    await deployPNOAADispatcher();
    await deployPRSASHA1Dispatcher();
    await deployPECDSASHA1Dispatcher();

    let proxy = await Proxy.deploy(await stateKeeper.getAddress(), "0x");
    stateKeeper = stateKeeper.attach(await proxy.getAddress()) as StateKeeperMock;

    proxy = await Proxy.deploy(await registrationSmt.getAddress(), "0x");
    registrationSmt = registrationSmt.attach(await proxy.getAddress()) as RegistrationSMTMock;

    proxy = await Proxy.deploy(await certificatesSmt.getAddress(), "0x");
    certificatesSmt = certificatesSmt.attach(await proxy.getAddress()) as PoseidonSMTMock;

    proxy = await Proxy.deploy(await registration.getAddress(), "0x");
    registration = registration.attach(await proxy.getAddress()) as Registration2Mock;

    const evidenceDB = await ethers.deployContract("EvidenceDB", {
      libraries: {
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
        PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
      },
    });
    const evidenceRegistry = await ethers.deployContract("EvidenceRegistry", {
      libraries: {
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
      },
    });

    await evidenceDB.__EvidenceDB_init(await evidenceRegistry.getAddress(), 80);
    await evidenceRegistry.__EvidenceRegistry_init(await evidenceDB.getAddress());

    await registrationSmt.__PoseidonSMT_init(
      await stateKeeper.getAddress(),
      await evidenceRegistry.getAddress(),
      treeSize,
    );
    await certificatesSmt.__PoseidonSMT_init(
      await stateKeeper.getAddress(),
      await evidenceRegistry.getAddress(),
      treeSize,
    );

    const messageServiceMock = await ethers.deployContract("MessageServiceMock");
    await registrationSmt.__SetL1TransitionRootData_init(await messageServiceMock.getAddress(), ethers.ZeroAddress);

    await stateKeeper.__StateKeeper_init(
      OWNER.address,
      await registrationSmt.getAddress(),
      await certificatesSmt.getAddress(),
      icaoMerkleRoot,
    );

    await registration.__Registration_init(await stateKeeper.getAddress());

    merkleTree = new MerkleTreeHelper();

    await stateKeeper.mockAddRegistrations([registrationName], [await registration.getAddress()]);

    await addDependency(
      RegistrationMethodId.AddCertificateDispatcher,
      C_RSA_SHA2_4096,
      await cRsaDispatcher.getAddress(),
    );
    await addDependency(RegistrationMethodId.AddPassportDispatcher, P_NO_AA, await pNoAaDispatcher.getAddress());
    await addDependency(
      RegistrationMethodId.AddPassportDispatcher,
      P_RSA_SHA1_2688,
      await pRsaSha1Dispatcher.getAddress(),
    );
    await addDependency(
      RegistrationMethodId.AddPassportDispatcher,
      P_ECDSA_SHA1_2704,
      await pEcdsaSha1Dispatcher.getAddress(),
    );

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("$init flow", () => {
    describe("#init", () => {
      it("should not initialize twice", async () => {
        expect(registration.__Registration_init(ethers.ZeroAddress)).to.be.revertedWith(
          "Initializable: contract is already initialized",
        );
      });
    });
  });

  describe("$ownable flow", () => {
    describe("#addDependency, #removeDependency", () => {
      it("should add and remove passport dispatchers", async () => {
        const someType = ethers.randomBytes(32);

        expect(await registration.passportDispatchers(someType)).to.equal(ethers.ZeroAddress);

        await addDependency(RegistrationMethodId.AddPassportDispatcher, ethers.hexlify(someType), SIGNER.address);

        expect(
          addDependency(RegistrationMethodId.AddPassportDispatcher, ethers.hexlify(someType), SIGNER.address),
        ).to.be.revertedWith("Registration: dispatcher already exists");
        expect(await registration.passportDispatchers(someType)).to.equal(SIGNER.address);

        await removeDependency(RegistrationMethodId.RemovePassportDispatcher, ethers.hexlify(someType));
        expect(await registration.passportDispatchers(someType)).to.equal(ethers.ZeroAddress);
      });

      it("should not be called by not owner", async () => {
        const encoder = new ethers.AbiCoder();
        const data = encoder.encode(["bytes32", "address"], [ethers.hexlify(ethers.randomBytes(32)), SIGNER.address]);

        await expect(
          registration.connect(SECOND).updateDependency(RegistrationMethodId.AddPassportDispatcher, data),
        ).to.be.rejectedWith("Registration: not an owner");

        await expect(
          registration.connect(SECOND).updateDependency(RegistrationMethodId.RemovePassportDispatcher, data),
        ).to.be.rejectedWith("Registration: not an owner");
      });
    });

    it("should revert if invalid operation was signed", async () => {
      await expect(registration.updateDependency(RegistrationMethodId.None, ethers.ZeroHash)).to.be.rejectedWith(
        "Registration: invalid methodId",
      );
    });
  });

  describe("$certificate flow", () => {
    const icaoPublicKey =
      "0xb6fc5ebd4d20b43e92ca6ffb1fca1097921a138b652592c0f94330f10baaa35feb55e889d353a93035bdb5a9cb8517fc3cda58bae757113714f09b74674955558f2fa4ac1351b04c203833f17f74b237621ae9cd31f970daac56e827352a8c89675e9aebf3459936f25e1efa3ae353e029448b54c690723df961551e6b6c7c4753accc80a3becc336aa58a502146cadcff0b7b549abe502bc9b0c27c210bd904ee8557a9f6a59dbc54016142288bd4611b97a35c248e3cce5f7a06f910cdd93e10121746bcb813f011e40723101d04498f8142baeb5bfa1ca33d56ebbb4bf951a99eeef4bb17d7136b1e8624e0db9b7af9e81ff571b4fd7d0fc1bb02f8722d511d3396238af1f39e7908155b24c532564f9b16cae228aa863286427d1d7dc8e3ef14d3ced507dd7d89b3eec3fa2ba25ac3047d56cc6a55227341ca196ab2219fddf45a52f5d47a2f5d6ea4944562e416aa77e37708ce2c8541834b3f0af5438482faf1992d9d9fdfba1fb3ea4a8e07a9663b4aa329d365c48c05f3900ff4e7337a9c7709a075b5a0d4efd4d6e4f03d23cf1ccfbb0c0ec2ca8769cf6dcc0e65ea672d586f91df90611087a197b2978f6a76e727697210f1916e0ed6e862aa7dd5cf6674fd620a6c4e57d1ecefe75f1fc7a1cdd235e6c75e8b7313088e73b2e2467aae7c510093e24509f5ca9450a863ef3c5fd2c804d99702e3cd4d9bf4886783";
    const icaoSignature =
      "0x0c69da150f37010a10b3a6b14c6fa3999d7c665bc0ed22861178fca64f329a968b012415cba9fe37f15648e094c12254304f73561e4554dc789d4c2d4714b214922a1b573b85d41f387986ce032790b80b5d99cd3efb9089b34b1897b619890b198409e24772e259fed4216881bdc2e612fe0d078f26209b9210b841555bc75753ebcbaa7f0e0f0172599e4cab22eb2f67d2c056bb6fee0cf94d13cecdf06183c0ad1878df2132e8c0adf4eebf8811a92236f97985e30a821909e3198bef855eafcd93d71014fc590f5db2a11843ae5230f780f4db6fac4436fa7c3e2a2b7e39e164f36bc36f55684a2941e30b7dee0fbb1d44658548ddc9c9d350af87f5360274f8acf951b50536fa4efe7bf07919ffc93782595dfeeecad6130037cd2defa9b73c5c3dd53b0f1212718e8c2d7c1d562f086f941161d7be11de2782102f047d55bc6bf8e665f8ec32f7dc5b84f473994b753004757d438bb7b148a7c6248938c291c4133248741340af6c81d90a2318b65bd19a558d89b08b89688fdb6fea0a72ec79b9e8729f3f655f6b85d02747ec122305d6524b85f327baee37c3cab6fc223d882ccdf3075d64a194478a2df46b96ace3ad4baabb5bac7fa7e93275c33fbe1dfa48059c26edf077a138a4e74d493d3968d5309985d85a03a1aa9937cb4461ec93f09b0b66cc21c337388d234244a2e1974129666c21933d6bef6dbe229f";

    describe("#registerCertificate", () => {
      it("should register the certificate", async () => {
        const leaf = ethers.solidityPackedKeccak256(["bytes"], [icaoPublicKey]);
        const proof = merkleTree.getRawProof(leaf, true);
        const root = merkleTree.getRoot();

        const certificate: Registration2.CertificateStruct = {
          dataType: C_RSA_SHA2_4096,
          signedAttributes: x509CertificateSA,
          keyOffset: 444,
          expirationOffset: 195,
        };

        const icaoMember: Registration2.ICAOMemberStruct = {
          signature: icaoSignature,
          publicKey: icaoPublicKey,
        };

        await stateKeeper.mockChangeICAOMasterTreeRoot(root);

        expect(await registration.registerCertificate(certificate, icaoMember, proof))
          .to.emit(registration, "CertificateRegistered")
          .withArgs("0x143607139f5db6f9af9db0c948d40a61c10493ddedb629499095cce3104d4b72");
        expect(
          await stateKeeper.getCertificateInfo("0x143607139f5db6f9af9db0c948d40a61c10493ddedb629499095cce3104d4b72"),
        ).to.deep.equal([1915341686n]);
      });
    });

    describe("#revokeCertificate", () => {
      it("should revoke the certificate", async () => {
        const leaf = ethers.solidityPackedKeccak256(["bytes"], [icaoPublicKey]);
        const proof = merkleTree.getRawProof(leaf, true);
        const root = merkleTree.getRoot();

        const certificate: Registration2.CertificateStruct = {
          dataType: C_RSA_SHA2_4096,
          signedAttributes: x509CertificateSA,
          keyOffset: 444,
          expirationOffset: 195,
        };

        const icaoMember: Registration2.ICAOMemberStruct = {
          signature: icaoSignature,
          publicKey: icaoPublicKey,
        };

        await stateKeeper.mockChangeICAOMasterTreeRoot(root);

        await registration.registerCertificate(certificate, icaoMember, proof);

        await time.increaseTo(2015341686);

        await registration.revokeCertificate("0x143607139f5db6f9af9db0c948d40a61c10493ddedb629499095cce3104d4b72");
      });
    });
  });

  describe("$registration flow", () => {
    const register = async (
      identityOverride?: string,
      signatureOverride?: string,
      proofOverride?: Groth16VerifierHelper.ProofPointsStruct,
      certificatesRootOverride?: string,
    ) => {
      const dgCommit = ECDSAPassportIdentityPublicSignals[1];

      await certificatesSmt.mockRoot(ECDSAPassportIdentityPublicSignals[3]);

      const passport: Registration2.PassportStruct = {
        dataType: P_ECDSA_SHA1_2704,
        zkType: Z_UNIVERSAL_4096,
        signature: signatureOverride ?? ECDSAPassportIdentitySignature1,
        publicKey: ECDSAPassportPubKey,
        passportHash: ethers.ZeroHash,
      };

      return registration.register(
        certificatesRootOverride ?? ECDSAPassportIdentityPublicSignals[3],
        identityOverride ?? identityKey,
        dgCommit,
        passport,
        proofOverride ?? ECDSAPassportIdentityProof,
      );
    };

    const revoke = async (identityOverride?: string, signatureOverride?: string) => {
      const passport: Registration2.PassportStruct = {
        dataType: P_ECDSA_SHA1_2704,
        zkType: Z_UNIVERSAL_4096,
        signature: signatureOverride ?? ECDSAPassportIdentitySignature2,
        publicKey: ECDSAPassportPubKey,
        passportHash: ethers.ZeroHash,
      };

      return registration.revoke(identityOverride ?? identityKey, passport);
    };

    const reissueIdentity = async (
      identityOverride?: string,
      signatureOverride?: string,
      proofOverride?: Groth16VerifierHelper.ProofPointsStruct,
      certificatesRootOverride?: string,
    ) => {
      const dgCommit = ECDSAPassportNewIdentityPublicSignals[1];

      await certificatesSmt.mockRoot(ECDSAPassportNewIdentityPublicSignals[3]);

      const passport: Registration2.PassportStruct = {
        dataType: P_ECDSA_SHA1_2704,
        zkType: Z_UNIVERSAL_4096,
        signature: signatureOverride ?? ECDSAPassportNewIdentitySignature1,
        publicKey: ECDSAPassportPubKey,
        passportHash: ethers.ZeroHash,
      };

      return registration.reissueIdentity(
        certificatesRootOverride ?? ECDSAPassportNewIdentityPublicSignals[3],
        identityOverride ?? newIdentityKey,
        dgCommit,
        passport,
        proofOverride ?? ECDSAPassportNewIdentityProof,
      );
    };

    describe("#register", () => {
      it("should not register with wrong AA", async () => {
        const signature = "0x1111";

        expect(register(identityKey, signature)).to.be.revertedWith("Registration: invalid passport signature");
      });

      it("should not register with wrong ZK proof", async () => {
        const formattedProof: Groth16VerifierHelper.ProofPointsStruct = {
          a: [0, 0],
          b: [
            [0, 0],
            [0, 0],
          ],
          c: [0, 0],
        };

        expect(register(identityKey, ECDSAPassportIdentitySignature1, formattedProof)).to.be.revertedWith(
          "Registration: invalid zk proof",
        );
      });

      it("should revert if passport already registered", async () => {
        await stateKeeper.mockPassportData(
          ethers.toBeHex(await pEcdsaSha1Dispatcher.getPassportKey(ECDSAPassportPubKey), 32),
          identityKey,
        );

        expect(register()).to.be.revertedWith("Registration: passport already registered");
      });

      it("should revert if identity already registered", async () => {
        await stateKeeper.mockIdentityData(
          identityKey,
          ethers.toBeHex(await pEcdsaSha1Dispatcher.getPassportKey(ECDSAPassportPubKey), 32),
        );

        expect(register()).to.be.revertedWith("Registration: identity already registered");
      });

      it("should revert if identity is zero", async () => {
        expect(register("0")).to.be.revertedWith("Registration: identity can not be zero");
      });
    });

    describe("#revoke", () => {
      it("should revert if identity is zero", async () => {
        expect(revoke("0")).to.be.revertedWith("Registration: identity can not be zero");
      });
    });

    describe("#reissueIdentity", () => {
      it("should revert if identity is zero", async () => {
        expect(reissueIdentity("0")).to.be.revertedWith("Registration: identity can not be zero");
      });
    });
  });

  describe("$upgrade flow", () => {
    describe("#upgrade", () => {
      it("should upgrade the contract", async () => {
        const Registration = await ethers.getContractFactory("Registration2Mock");
        const newRegistration = await Registration.deploy();

        await registration.upgradeToAndCall(await newRegistration.getAddress(), "0x");

        expect(await registration.implementation()).to.be.eq(await newRegistration.getAddress());
      });

      it("should revert if operation was signed by the invalid signer", async () => {
        const newRegistration = await ethers.deployContract("Registration2Mock");

        await expect(
          registration.connect(SECOND).upgradeToAndCall(await newRegistration.getAddress(), "0x"),
        ).to.be.rejectedWith("Registration: not an owner");
      });
    });
  });
});
