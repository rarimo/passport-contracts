import { expect } from "chai";
import { ethers } from "hardhat";

import { CRSADispatcher } from "@ethers-v6";

import { Reverter, getPoseidon } from "@/test/helpers/";

describe("CRSADispatcher", () => {
  const reverter = new Reverter();

  let dispatcher: CRSADispatcher;

  before("setup", async () => {
    const CRSAPSSSigner = await ethers.getContractFactory("CRSAPSSSigner");
    const CRSADispatcher = await ethers.getContractFactory("CRSADispatcher", {
      libraries: {
        PoseidonUnit5L: await (await getPoseidon(5)).getAddress(),
      },
    });

    const signerSha2 = await CRSAPSSSigner.deploy();
    dispatcher = await CRSADispatcher.deploy();

    await signerSha2.__CRSAPSSSigner_init(65537, true);
    await dispatcher.__CRSADispatcher_init(await signerSha2.getAddress(), 256, "0x0282010100");

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#init", () => {
    it("should not init twice", async () => {
      expect(dispatcher.__CRSADispatcher_init(ethers.hexlify(ethers.randomBytes(20)), 1337, "0x")).to.be.revertedWith(
        "Initializable: contract is already initialized",
      );
    });
  });

  describe("#getCertificatePublicKey", () => {
    it("should getCertificatePublicKey correctly", async () => {
      expect(
        await dispatcher.getCertificatePublicKey(
          "0x3082036da003020102020200bb304106092a864886f70d01010a3034a00f300d06096086480165030402010500a11c301a06092a864886f70d010108300d06096086480165030402010500a203020120306e310b3009060355040613024a50311c301a060355040a0c134a6170616e65736520476f7665726e6d656e7431283026060355040b0c1f546865204d696e6973747279206f6620466f726569676e20416666616972733117301506035504030c0e652d70617373706f727443534341301e170d3137303932303031353431315a170d3238303932303031353431315a308193310b3009060355040613024a50311c301a060355040a0c134a6170616e65736520476f7665726e6d656e7431283026060355040b0c1f546865204d696e6973747279206f6620466f726569676e204166666169727331153013060355040b0c0c652d70617373706f727444533125302306035504030c1c4d696e697374657220666f7220466f726569676e204166666169727330820122300d06092a864886f70d01010105000382010f003082010a0282010100a55c562c1f959457331c3840904a103eaa691a15f0c675068a14dfe200051ac8d4edfe549d2bcf54e6544cd0b21028a5077887e952ec71759a027b91a45924f1d9a6c11d77d0a0b9542ab9dac85fe59d31c65f5fc37c8a04c7c69b37bf2117f59dde035946bcf3750019dcdd054d832e179df3d265f10e5f8c88e8a4162ea170a5912c1d30715a61063ec5ed164c1971469fb80846b24bbf7f60baa37d9f17dc9d26510e9f8f6521f5ea30092817553e27b7d98e3483677a846655710687b61b42b569309c0ef28d3c231982fe910f9a08eb32eb69e17b422c074ee593d9c9641bd0612ed1d189a042e9ed6eb84ac6186e8afbb92a2df3221fa52c6182c043e50203010001a381d23081cf302b0603551d1204243022810e706b69406d6f66612e676f2e6a70a410300e310c300a06035504070c034a504e301f0603551d2304183016801448458e886926a0d0b11d2b422fc59b459be1ec7b300e0603551d0f0101ff040403020780302b0603551d1004243022800f32303137303932303031353431315a810f32303138303432303031353431315a302b0603551d1104243022810e706b69406d6f66612e676f2e6a70a410300e310c300a06035504070c034a504e3015060767810801010602040a30080201003103130150",
          407,
        ),
      ).to.equal(
        "0xa55c562c1f959457331c3840904a103eaa691a15f0c675068a14dfe200051ac8d4edfe549d2bcf54e6544cd0b21028a5077887e952ec71759a027b91a45924f1d9a6c11d77d0a0b9542ab9dac85fe59d31c65f5fc37c8a04c7c69b37bf2117f59dde035946bcf3750019dcdd054d832e179df3d265f10e5f8c88e8a4162ea170a5912c1d30715a61063ec5ed164c1971469fb80846b24bbf7f60baa37d9f17dc9d26510e9f8f6521f5ea30092817553e27b7d98e3483677a846655710687b61b42b569309c0ef28d3c231982fe910f9a08eb32eb69e17b422c074ee593d9c9641bd0612ed1d189a042e9ed6eb84ac6186e8afbb92a2df3221fa52c6182c043e5",
      );
    });
  });

  describe("#getCertificateKey", () => {
    it("should getCertificateKey correctly", async () => {
      expect(
        await dispatcher.getCertificateKey(
          "0xa55c562c1f959457331c3840904a103eaa691a15f0c675068a14dfe200051ac8d4edfe549d2bcf54e6544cd0b21028a5077887e952ec71759a027b91a45924f1d9a6c11d77d0a0b9542ab9dac85fe59d31c65f5fc37c8a04c7c69b37bf2117f59dde035946bcf3750019dcdd054d832e179df3d265f10e5f8c88e8a4162ea170a5912c1d30715a61063ec5ed164c1971469fb80846b24bbf7f60baa37d9f17dc9d26510e9f8f6521f5ea30092817553e27b7d98e3483677a846655710687b61b42b569309c0ef28d3c231982fe910f9a08eb32eb69e17b422c074ee593d9c9641bd0612ed1d189a042e9ed6eb84ac6186e8afbb92a2df3221fa52c6182c043e5",
        ),
      ).to.equal("0x28762f4450a4cea80aa7170e60f7bd430b48b532ca96243e691b999841139938");
    });
  });
});