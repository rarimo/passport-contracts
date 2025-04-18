import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { getPoseidon, Reverter } from "@/test/helpers";

import { L1RegistrationState, MessageServiceMock, RegistrationSMTMock } from "@ethers-v6";

describe("RegistrationSMT", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let OTHER: SignerWithAddress;

  let registrationSmt: RegistrationSMTMock;

  let l1RegistrationState: L1RegistrationState;
  let messageService: MessageServiceMock;

  before(async () => {
    [OWNER, OTHER] = await ethers.getSigners();

    const poseidon1L = await (await getPoseidon(1)).getAddress();
    const poseidon2L = await (await getPoseidon(2)).getAddress();
    const poseidon3L = await (await getPoseidon(3)).getAddress();

    const L1RegistrationStateFactory = await ethers.getContractFactory("L1RegistrationState");
    const MessageServiceFactory = await ethers.getContractFactory("MessageServiceMock");
    const RegistrationSMTFactory = await ethers.getContractFactory("RegistrationSMTMock", {
      libraries: {
        PoseidonUnit2L: poseidon2L,
        PoseidonUnit3L: poseidon3L,
      },
    });
    const StateKeeper = await ethers.getContractFactory("StateKeeperMock", {
      libraries: {
        PoseidonUnit1L: poseidon1L,
        PoseidonUnit2L: poseidon2L,
        PoseidonUnit3L: poseidon3L,
      },
    });

    const ProxyFactory = await ethers.getContractFactory("ERC1967Proxy");

    const l1RegStateImpl = await L1RegistrationStateFactory.deploy();
    const registrationSmtImpl = await RegistrationSMTFactory.deploy();

    messageService = await MessageServiceFactory.deploy();

    let stateKeeper = await StateKeeper.deploy();

    let proxy = await ProxyFactory.deploy(await l1RegStateImpl.getAddress(), "0x");
    l1RegistrationState = L1RegistrationStateFactory.attach(await proxy.getAddress()) as L1RegistrationState;

    proxy = await ProxyFactory.deploy(await registrationSmtImpl.getAddress(), "0x");
    registrationSmt = RegistrationSMTFactory.attach(await proxy.getAddress()) as RegistrationSMTMock;

    proxy = await ProxyFactory.deploy(await stateKeeper.getAddress(), "0x");
    stateKeeper = (await ethers.getContractAt("StateKeeperMock", await proxy.getAddress())) as any;

    await stateKeeper.__StateKeeper_init(OWNER.address, ethers.ZeroAddress, ethers.ZeroAddress, ethers.ZeroHash);

    await registrationSmt.__PoseidonSMT_init(await stateKeeper.getAddress(), ethers.ZeroAddress, 80);

    await registrationSmt.__SetL1TransitionRootData_init(
      await messageService.getAddress(),
      await l1RegistrationState.getAddress(),
    );

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("Initialization", () => {
    it("should set correct initial values", async () => {
      expect(await registrationSmt.l2MessageService()).to.equal(await messageService.getAddress());
      expect(await registrationSmt.l1RegistrationState()).to.equal(await l1RegistrationState.getAddress());
    });

    it("should revert if trying to re-initialize L1 transition data (level 2)", async () => {
      await expect(
        registrationSmt.connect(OWNER).__SetL1TransitionRootData_init(ethers.ZeroAddress, ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(registrationSmt, "InvalidInitialization");
    });
  });

  describe("setL1RegistrationState", () => {
    it("should allow owner to set the L1 registration state address", async () => {
      await registrationSmt.connect(OWNER).setL1RegistrationState(OTHER.address);
      expect(await registrationSmt.l1RegistrationState()).to.equal(OTHER.address);
    });

    it("should revert if called by non-owner", async () => {
      await expect(registrationSmt.connect(OTHER).setL1RegistrationState(OTHER.address)).to.be.rejectedWith(
        "PoseidonSMT: not an owner",
      );
    });
  });

  describe("setL2MessageService", () => {
    it("should allow owner to set the L2 message service address", async () => {
      await registrationSmt.connect(OWNER).setL2MessageService(OTHER.address);
      expect(await registrationSmt.l2MessageService()).to.equal(OTHER.address);
    });

    it("should revert if called by non-owner", async () => {
      await expect(registrationSmt.connect(OTHER).setL2MessageService(OTHER.address)).to.be.rejectedWith(
        "PoseidonSMT: not an owner",
      );
    });
  });
});
