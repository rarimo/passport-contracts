import { expect } from "chai";
import { zkit, ethers } from "hardhat";
import { HDNodeWallet } from "ethers";

import { Groth16Proof } from "@solarity/zkit";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { createDG1Data } from "@/test/helpers/dg1";

import { getPoseidon, Reverter, TSSMerkleTree, TSSSigner } from "@/test/helpers";
import { RegistrationSimpleMethodId, RegistrationSimpleOperationId } from "@/test/helpers/constants";

import { PoseidonSMTMock, RegisterIdentityLight256Verifier, RegistrationSimple, StateKeeperMock } from "@ethers-v6";

import {
  PrivateRegisterIdentityLight256Groth16,
  ProofRegisterIdentityLight256Groth16,
  RegisterIdentityLight256,
} from "@/generated-types/zkit";
import { VerifierHelper } from "@/generated-types/ethers/contracts/registration/Registration";

const treeSize = 80;
const chainName = "Tests";

const registrationName = "Registration";

const icaoMerkleRoot = "0x2c50ce3aa92bc3dd0351a89970b02630415547ea83c487befbc8b1795ea90c45";

describe("RegistrationSimple", () => {
  const reverter = new Reverter();

  let signHelper: TSSSigner;
  let merkleTree: TSSMerkleTree;

  let OWNER: SignerWithAddress;
  let FIRST: SignerWithAddress;
  let SIGNER: HDNodeWallet;

  let registerLight: RegisterIdentityLight256;

  let registrationSimple: RegistrationSimple;

  let registrationSmt: PoseidonSMTMock;
  let certificatesSmt: PoseidonSMTMock;
  let stateKeeper: StateKeeperMock;

  let registerLightVerifier: RegisterIdentityLight256Verifier;

  before(async () => {
    registerLight = await zkit.getCircuit("RegisterIdentityLight256");

    [OWNER, FIRST] = await ethers.getSigners();
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

    registerLightVerifier = await ethers.deployContract("RegisterIdentityLight256Verifier");

    registrationSimple = await ethers.deployContract("RegistrationSimple");

    const Proxy = await ethers.getContractFactory("ERC1967Proxy");

    registrationSmt = await PoseidonSMT.deploy();
    certificatesSmt = await PoseidonSMT.deploy();
    stateKeeper = await StateKeeper.deploy();

    let proxy = await Proxy.deploy(await stateKeeper.getAddress(), "0x");
    stateKeeper = await ethers.getContractAt("StateKeeperMock", await proxy.getAddress());

    proxy = await Proxy.deploy(await registrationSmt.getAddress(), "0x");
    registrationSmt = await ethers.getContractAt("PoseidonSMTMock", await proxy.getAddress());

    proxy = await Proxy.deploy(await certificatesSmt.getAddress(), "0x");
    certificatesSmt = await ethers.getContractAt("PoseidonSMTMock", await proxy.getAddress());

    proxy = await Proxy.deploy(await registrationSimple.getAddress(), "0x");
    registrationSimple = await ethers.getContractAt("RegistrationSimple", await proxy.getAddress());

    await registrationSmt.__PoseidonSMT_init(SIGNER.address, chainName, await stateKeeper.getAddress(), treeSize);
    await certificatesSmt.__PoseidonSMT_init(SIGNER.address, chainName, await stateKeeper.getAddress(), treeSize);

    await stateKeeper.__StateKeeper_init(
      SIGNER.address,
      chainName,
      await registrationSmt.getAddress(),
      await certificatesSmt.getAddress(),
      icaoMerkleRoot,
    );

    await registrationSimple.__RegistrationSimple_init(SIGNER.address, chainName, await stateKeeper.getAddress(), [
      OWNER.address,
    ]);

    signHelper = new TSSSigner(SIGNER);
    merkleTree = new TSSMerkleTree(signHelper);

    await stateKeeper.mockAddRegistrations([registrationName], [await registrationSimple.getAddress()]);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("$Registration Process", () => {
    const dg1Data = createDG1Data({
      citizenship: "ABW",
      name: "Somebody",
      nameResidual: "",
      documentNumber: "",
      expirationDate: "251210",
      birthDate: "221210",
      sex: "M",
      nationality: "ABW",
    });

    const identityKey = 123n;

    const inputs: PrivateRegisterIdentityLight256Groth16 = {
      dg1: dg1Data,
      skIdentity: identityKey,
    };

    let proof: ProofRegisterIdentityLight256Groth16;
    let passportData: RegistrationSimple.PassportStruct;

    let signature: string;

    before(async () => {
      proof = await registerLight.generateProof(inputs);

      passportData = {
        dgCommit: ethers.toBeHex(proof.publicSignals.dg1Commitment, 32),
        dg1Hash: ethers.toBeHex(proof.publicSignals.dg1Hash, 32),
        publicKey: ethers.toBeHex(0n, 32),
        passportHash: ethers.toBeHex(proof.publicSignals.dg1Hash, 32),
        verifier: await registerLightVerifier.getAddress(),
      };

      signature = await getSimpleSignature(passportData);
    });

    it("should successfully register a user", async () => {
      await registrationSimple.registerSimple(
        proof.publicSignals.pkIdentityHash,
        passportData,
        signature,
        formatProof(proof.proof),
      );
    });

    it("should revert if trying to use the same signature twice", async () => {
      await registrationSimple.registerSimple(
        proof.publicSignals.pkIdentityHash,
        passportData,
        signature,
        formatProof(proof.proof),
      );

      await expect(
        registrationSimple.registerSimple(
          proof.publicSignals.pkIdentityHash,
          passportData,
          signature,
          formatProof(proof.proof),
        ),
      ).to.be.revertedWith("StateKeeper: signature used");
    });

    it("should revert if invalid signature is provided", async () => {
      const localPassportData = JSON.parse(JSON.stringify(passportData));

      localPassportData.dgCommit = ethers.toBeHex(0n, 32);

      await expect(
        registrationSimple.registerSimple(
          proof.publicSignals.pkIdentityHash,
          localPassportData,
          signature,
          formatProof(proof.proof),
        ),
      ).to.be.revertedWith("RegistrationSimple: caller is not a signer");
    });

    it("should revert if invalid proof is provided", async () => {
      const localProof: VerifierHelper.ProofPointsStruct = JSON.parse(JSON.stringify(formatProof(proof.proof)));

      localProof.a[0] = 0n;

      await expect(
        registrationSimple.registerSimple(proof.publicSignals.pkIdentityHash, passportData, signature, localProof),
      ).to.be.revertedWith("RegistrationSimple: invalid zk proof");
    });

    it("should revert if identity key is zero", async () => {
      await expect(
        registrationSimple.registerSimple(0n, passportData, signature, formatProof(proof.proof)),
      ).to.be.revertedWith("RegistrationSimple: identity can not be zero");
    });
  });

  describe("$Update Signers list", () => {
    it("should successfully add a new signer and remove old one", async () => {
      const operation = merkleTree.updateSignersListOperation(
        [FIRST.address, OWNER.address],
        [RegistrationSimpleOperationId.AddSigner, RegistrationSimpleOperationId.RemoveSigner],
        chainName,
        await registrationSimple.getNonce(RegistrationSimpleMethodId.UpdateSignerList),
        await registrationSimple.getAddress(),
      );

      await expect(registrationSimple.updateSignerList(operation.data, operation.proof))
        .to.emit(registrationSimple, "SignersListUpdated")
        .withArgs(
          [FIRST.address, OWNER.address],
          [RegistrationSimpleOperationId.AddSigner, RegistrationSimpleOperationId.RemoveSigner],
        );
    });

    it("should revert if None was provided as an operation ID", async () => {
      const operation = merkleTree.updateSignersListOperation(
        [FIRST.address],
        [RegistrationSimpleOperationId.None],
        chainName,
        await registrationSimple.getNonce(RegistrationSimpleMethodId.UpdateSignerList),
        await registrationSimple.getAddress(),
      );

      await expect(registrationSimple.updateSignerList(operation.data, operation.proof)).to.be.revertedWith(
        "RegistrationSimple: invalid operationId",
      );
    });

    it("should revert if non-exising operation ID was provided", async () => {
      const operation = merkleTree.updateSignersListOperation(
        [FIRST.address],
        [12 as RegistrationSimpleOperationId],
        chainName,
        await registrationSimple.getNonce(RegistrationSimpleMethodId.UpdateSignerList),
        await registrationSimple.getAddress(),
      );

      await expect(registrationSimple.updateSignerList(operation.data, operation.proof)).to.be.reverted;
    });

    it("should revert if different length of signers and actions was provided", async () => {
      const operation = merkleTree.updateSignersListOperation(
        [FIRST.address],
        [RegistrationSimpleOperationId.AddSigner, RegistrationSimpleOperationId.RemoveSigner],
        chainName,
        await registrationSimple.getNonce(RegistrationSimpleMethodId.UpdateSignerList),
        await registrationSimple.getAddress(),
      );

      await expect(registrationSimple.updateSignerList(operation.data, operation.proof)).to.be.revertedWith(
        "RegistrationSimple: invalid input length",
      );
    });
  });

  describe("$Contract Management", () => {
    it("should revert if trying to initialize the contract twice", async () => {
      await expect(
        registrationSimple.__RegistrationSimple_init(SIGNER.address, chainName, await stateKeeper.getAddress(), [
          OWNER.address,
        ]),
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("should retrieve all signers", async () => {
      expect(await registrationSimple.getSigners()).to.be.deep.eq([OWNER.address]);
    });
  });

  function formatProof(data: Groth16Proof): VerifierHelper.ProofPointsStruct {
    return {
      a: [data.pi_a[0], data.pi_a[1]],
      b: [
        [data.pi_b[0][1], data.pi_b[0][0]],
        [data.pi_b[1][1], data.pi_b[1][0]],
      ],
      c: [data.pi_c[0], data.pi_c[1]],
    };
  }

  async function getSimpleSignature(passportData: RegistrationSimple.PassportStruct) {
    const message = ethers.solidityPackedKeccak256(
      ["string", "address", "bytes32", "bytes32", "bytes32", "address"],
      [
        await registrationSimple.REGISTRATION_SIMPLE_PREFIX(),
        await registrationSimple.getAddress(),
        passportData.passportHash,
        passportData.dgCommit,
        passportData.publicKey,
        passportData.verifier,
      ],
    );

    return OWNER.provider.send("eth_sign", [OWNER.address, message]);
  }
});
