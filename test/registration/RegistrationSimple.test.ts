import { zkit, ethers } from "hardhat";
import { HDNodeWallet } from "ethers";

import { Groth16Proof } from "@solarity/zkit";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { createDG1Data } from "@/test/helpers/dg1";

import { getPoseidon, Reverter, TSSMerkleTree, TSSSigner } from "@/test/helpers";

import { PoseidonSMTMock, RegisterIdentityLight256Verifier, RegistrationSimple, StateKeeperMock } from "@ethers-v6";

import { PrivateRegisterIdentityLight256Groth16, RegisterIdentityLight256 } from "@/generated-types/zkit";
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
  let SIGNER: HDNodeWallet;

  let registerLight: RegisterIdentityLight256;

  let registrationSimple: RegistrationSimple;

  let registrationSmt: PoseidonSMTMock;
  let certificatesSmt: PoseidonSMTMock;
  let stateKeeper: StateKeeperMock;

  let registerLightVerifier: RegisterIdentityLight256Verifier;

  before(async () => {
    registerLight = await zkit.getCircuit("RegisterIdentityLight256");

    [OWNER] = await ethers.getSigners();
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

    await registrationSimple.__RegistrationSimple_init(SIGNER.address, chainName, await stateKeeper.getAddress());

    signHelper = new TSSSigner(SIGNER);
    merkleTree = new TSSMerkleTree(signHelper);

    await stateKeeper.mockAddRegistrations([registrationName], [await registrationSimple.getAddress()]);

    await registrationSimple.addOwners([OWNER.address]);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  it("should successfully register a user", async () => {
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
    const proof = await registerLight.generateProof(inputs);
    const passportData: RegistrationSimple.PassportStruct = {
      dgCommit: proof.publicSignals.dg1Commitment,
      dg1Hash: ethers.toBeHex(proof.publicSignals.dg1Hash, 32),
      publicKey: ethers.toBeHex(0n, 32),
      passportHash: ethers.toBeHex(proof.publicSignals.dg1Hash, 32),
      verifier: await registerLightVerifier.getAddress(),
    };

    const signature = await getSimpleSignature(passportData);

    await registrationSimple.registerSimple(
      proof.publicSignals.pkIdentityHash,
      passportData,
      signature,
      formatProof(proof.proof),
    );
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
        passportData.dg1Hash,
        passportData.publicKey,
        passportData.verifier,
      ],
    );

    return OWNER.provider.send("eth_sign", [OWNER.address, message]);
  }
});
