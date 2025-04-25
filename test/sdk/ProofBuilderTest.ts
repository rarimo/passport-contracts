import { expect } from "chai";
import { ethers } from "hardhat";

import { time } from "@nomicfoundation/hardhat-network-helpers";

import { getPoseidon, Reverter } from "@/test/helpers";

import { ProofBuilderTest, RegistrationSMTMock } from "@ethers-v6";

describe("ProofBuilderTest", () => {
  const reverter = new Reverter();

  const MOCKED_ROOT = ethers.id("MOCKED_ROOT");

  let test: ProofBuilderTest;
  let registrationSMTMock: RegistrationSMTMock;

  before("setup", async () => {
    test = await ethers.deployContract("ProofBuilderTest");

    registrationSMTMock = await ethers.deployContract("RegistrationSMTMock", {
      libraries: {
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
        PoseidonUnit3L: await (await getPoseidon(3)).getAddress(),
      },
    });

    await test.init(await registrationSMTMock.getAddress());

    await registrationSMTMock.mockRoot(MOCKED_ROOT);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  it("should set the correct initial state", async () => {
    await test.testEquivalencePart1_NewBuilder();
    await test.testEquivalencePart2_Name();
    await test.testEquivalencePart3_NationalityCitizenshipSex();
    await test.testEquivalencePart4_Event();
    await test.testEquivalencePart5_IdStateRoot(MOCKED_ROOT);
    await test.testEquivalencePart6_CurrentDate(await getCurrentDate());
    await test.testEquivalencePart7_TimestampBounds();
    await test.testEquivalencePart8_IdentityCounterBounds();
    await test.testEquivalencePart9_BirthDateBounds();
    await test.testEquivalencePart10_ExpirationDateBounds();
    await test.testEquivalencePart11_CitizenshipMask();
  });

  it("should revert if trying to set invalid root", async () => {
    await expect(test.testEquivalencePart5_IdStateRoot(ethers.ZeroHash)).to.be.revertedWithCustomError(
      test,
      "InvalidRegistrationRoot",
    );
  });

  it("should revert if trying to set invalid date", async () => {
    await expect(test.testEquivalencePart6_CurrentDate(0x303030303030)).to.be.revertedWithCustomError(
      test,
      "InvalidDate",
    );
  });

  async function getCurrentDate() {
    let res: string = "0x";
    const date = new Date((await time.latest()) * 1000);

    res += "3" + date.getUTCFullYear().toString()[2] + "3" + date.getUTCFullYear().toString()[3];

    let month = (date.getUTCMonth() + 1).toString();

    if (month.length == 1) {
      month = "0" + month;
    }

    res += "3" + month[0] + "3" + month[1];

    let day = date.getUTCDate().toString();

    if (day.length == 1) {
      day = "0" + day;
    }

    res += "3" + day[0] + "3" + day[1];

    return res;
  }
});
