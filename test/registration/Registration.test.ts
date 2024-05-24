import { ethers } from "hardhat";
import { HDNodeWallet } from "ethers";
import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Reverter, getPoseidon } from "@/test/helpers/";
import { RSA_SHA1_2688 } from "@/scripts/utils/passport-types";

import { Registration, PoseidonSMT, RegistrationMock, RSASHA1Dispatcher } from "@ethers-v6";
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
  "0xae782184c70d1c9829be95f23b2c21abf5a82019a6648b933ca8abe4dc837582068d45d0b5f94cc4cd4\
c7cde9bef0f4d79534469997d95018e6391d294000d536c2654f79a829ff8cb74a32fdbbab73e16cab87ff6\
00344ef9dda6cc11c4d67672d66e875bbacd4de1e5b2d4efdd50b027bc16f357218c345861c1bc8f38b28d";

const x509CertificateSA =
  "0x308204cda00302010202031870b2300d06092a864886f70d01010b0500308190310b3009060355040613\
025541311930170603550405131055412d31363238363434312d30303031313c303a060355040a0c33506f6\
c79677261706820636f6d62696e6520554b5241494e4120666f7220736563757269746965732070726f6475\
6374696f6e3111300f060355040b0c0853435044205043553115301306035504030c0c435343412d554b524\
1494e45301e170d3230303631313037323132365a170d3330303931313037323132365a3081c8310b300906\
0355040613025541310d300b06035504070c044b796976313f303d060355040a0c36534520506f6c7967726\
1706820636f6d62696e6520554b5241494e4120666f7220736563757269746965732070726f64756374696f\
6e310d300b060355040b0c0453435044313f303d06035504030c36534520506f6c79677261706820636f6d6\
2696e6520554b5241494e4120666f7220736563757269746965732070726f64756374696f6e311930170603\
550405131055412d31363238363434312d3030303230820222300d06092a864886f70d01010105000382020\
f003082020a0282020100ecfaea022c3d5f9f3cee2dd4f0a647625906f5839aff07dcf46898792da92b35cd\
61c5467825d656387beac6fe6fed30929c34974b3425dcacd5c3ff970b845710d5bc9ae722188b872966e53\
136e21f38c8935cb403d58c59bf30a1a67152b6ecc495fc01e3de797f89d13d25863912805f23268fd69828\
d42d095b3b68553852a0021a984933e866ec3ac2dcec308f913e1cfca321640479cf5d2c5e68ade15220f00\
51694e1ffdfb2549667838a87f7506de66c62eeb63cfc134a3b2059f778b9103c6b7575e6d525bf2689797f\
1af596417c9c69527bb7e0dfc818abb3058e725e05a9d15ad5111d8767e6c7a2679c5bb79f0563914b102c8\
33e90c7049bae3dcc780eeabb0271a72097ce4e4186e665603dbc316ef13e994fce04e6d5ab20c35a490185\
63e7f604c1dc3eda31c3e3d341838a13f346f4fb57327227fcaf965c6cff605f3ad385e5f8e94f5d0b73dae\
3a3b7877a2fef576f7e717b12b3b27e86ee1dd6d55a9efe6457dabce4e9679c49e4410e22a033827fa3844d\
2ab0dac3963d3a9bf45b49a0c9cb2927d9ff4840b704bf4e854dc56b3709de3bf98f5446434393ace8107fd\
d4832237b12339ef8e436364d1246957559aaff170afa3630c3656493ad39883de94597647eeb37df5dc8e3\
8fe7205b276bdcb1c257d0058e1c45c0e0137bf64dd673c56ec56fe28552eaccf7b6db5272a98ad291dfdfe\
90203010001a382010c30820108301d0603551d0e041604144d80204241bdb1d57682005c09c1a244dd47a6\
b3301f0603551d23041830168014f4ce2f8ca64b63b3f1d0ea751fabef7ef452358d302b0603551d1004243\
022800f32303230303631313037323132365a810f32303230303931313037323132365a300e0603551d0f01\
01ff040403020780303f0603551d1f043830363034a032a030862e68747470733a2f2f63612e706b2d756b7\
261696e612e676f762e75612f646f776e6c6f61642f66756c6c2e63726c3015060767810801010602040a30\
08020100310313015030310603551d12042a3028a40f300d310b300906035504070c0255418115706b69407\
06b2d756b7261696e612e676f762e7561";

describe("Registration", () => {
  const reverter = new Reverter();

  let signHelper: TSSSigner;
  let merkleTree: TSSMerkleTree;

  let OWNER: SignerWithAddress;
  let SECOND: SignerWithAddress;
  let SIGNER: HDNodeWallet;

  let rsaSha1Dispatcher: RSASHA1Dispatcher;
  let registrationSmt: PoseidonSMT;
  let certificatesSmt: PoseidonSMT;
  let registration: RegistrationMock;

  const deployRSASHA1Disaptcher = async () => {
    const RSAECDSAVerifier = await ethers.getContractFactory("RSAECDSAVerifier");
    const RSASHA1Authenticator = await ethers.getContractFactory("RSASHA1Authenticator");
    const RSASHA1Dispatcher = await ethers.getContractFactory("RSASHA1Dispatcher", {
      libraries: {
        PoseidonUnit5L: await (await getPoseidon(5)).getAddress(),
      },
    });

    const rsaEcdsaVerifier = await RSAECDSAVerifier.deploy();
    const rsaSha1Authenticator = await RSASHA1Authenticator.deploy();
    rsaSha1Dispatcher = await RSASHA1Dispatcher.deploy();

    await rsaSha1Dispatcher.__RSASHA1Dispatcher_init(
      await rsaSha1Authenticator.getAddress(),
      await rsaEcdsaVerifier.getAddress(),
    );
  };

  before("setup", async () => {
    [OWNER, SECOND] = await ethers.getSigners();
    SIGNER = ethers.Wallet.createRandom();

    const PoseidonSMT = await ethers.getContractFactory("PoseidonSMT", {
      libraries: {
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
        PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
      },
    });
    const Registration = await ethers.getContractFactory("RegistrationMock", {
      libraries: {
        PoseidonUnit1L: await (await getPoseidon(1)).getAddress(),
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
        PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
        PoseidonUnit5L: await (await getPoseidon(5)).getAddress(),
      },
    });

    registrationSmt = await PoseidonSMT.deploy();
    certificatesSmt = await PoseidonSMT.deploy();
    registration = await Registration.deploy();

    await deployRSASHA1Disaptcher();

    const Proxy = await ethers.getContractFactory("ERC1967Proxy");
    let proxy = await Proxy.deploy(await registration.getAddress(), "0x");
    registration = registration.attach(await proxy.getAddress()) as RegistrationMock;

    proxy = await Proxy.deploy(await registrationSmt.getAddress(), "0x");
    registrationSmt = registrationSmt.attach(await proxy.getAddress()) as PoseidonSMT;
    await registrationSmt.__PoseidonSMT_init(TREE_SIZE, await registration.getAddress());

    proxy = await Proxy.deploy(await certificatesSmt.getAddress(), "0x");
    certificatesSmt = certificatesSmt.attach(await proxy.getAddress()) as PoseidonSMT;
    await certificatesSmt.__PoseidonSMT_init(TREE_SIZE, await registration.getAddress());

    await registration.__Registration_init(
      SIGNER.address,
      await registrationSmt.getAddress(),
      await certificatesSmt.getAddress(),
      icaoMerkleRoot,
    );

    await registration.addDispatcher(RSA_SHA1_2688, await rsaSha1Dispatcher.getAddress());

    signHelper = new TSSSigner(SIGNER);
    merkleTree = new TSSMerkleTree(signHelper);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("$init flow", () => {
    describe("#init", () => {
      it("should not initialize twice", async () => {
        expect(
          registration.__Registration_init(SIGNER.address, ZERO_ADDR, ZERO_ADDR, icaoMerkleRoot),
        ).to.be.revertedWith("Initializable: contract is already initialized");
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

        await registration.mockChangeICAOMasterTreeRoot(root);

        expect(await registration.registerCertificate(proof, icaoPublicKey, icaoSignature, x509CertificateSA, 444, 195))
          .to.emit(registration, "CertificateRegistered")
          .withArgs("0x143607139f5db6f9af9db0c948d40a61c10493ddedb629499095cce3104d4b72");
      });
    });

    describe("#revokeCertificate", () => {
      it("should revoke the certificate", async () => {
        const leaf = ethers.solidityPackedKeccak256(["bytes"], [icaoPublicKey]);
        const proof = merkleTree.getRawProof(leaf, true);
        const root = merkleTree.getRoot();

        await registration.mockChangeICAOMasterTreeRoot(root);

        await registration.registerCertificate(proof, icaoPublicKey, icaoSignature, x509CertificateSA, 444, 195);

        await time.increaseTo(2015341686);

        await registration.revokeCertificate("0x143607139f5db6f9af9db0c948d40a61c10493ddedb629499095cce3104d4b72");
      });
    });
  });

  describe("$registration flow", () => {
    const register = async (
      identityOverride?: string,
      signatureOverride?: string,
      proofOverride?: VerifierHelper.ProofPointsStruct,
      certificatesRootOverride?: string,
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

      const certificatesRoot = "0x0000000000000000000000000000000000000000000000000000000000000000";

      const passport: Registration.PassportStruct = {
        dataType: RSA_SHA1_2688,
        signature: signatureOverride ?? signature,
        publicKey: passportPubKey,
      };

      return registration.register(
        certificatesRootOverride ?? certificatesRoot,
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
      certificatesRootOverride?: string,
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

      const certificatesRoot = "0x0000000000000000000000000000000000000000000000000000000000000000";

      const passport: Registration.PassportStruct = {
        dataType: RSA_SHA1_2688,
        signature: signatureOverride ?? signature,
        publicKey: passportPubKey,
      };

      return registration.reissueIdentity(
        certificatesRootOverride ?? certificatesRoot,
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
