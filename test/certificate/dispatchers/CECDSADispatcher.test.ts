import { expect } from "chai";
import { ethers } from "hardhat";

import { CECDSADispatcher } from "@ethers-v6";

import { Reverter, getPoseidon } from "@/test/helpers/";

describe("CECDSADispatcher", () => {
  const reverter = new Reverter();

  let dispatcher: CECDSADispatcher;

  before("setup", async () => {
    const CECDSASHA2Signer = await ethers.getContractFactory("CECDSASHA2Signer");
    const CECDSADispatcher = await ethers.getContractFactory("CECDSADispatcher", {
      libraries: {
        PoseidonUnit2L: await (await getPoseidon(2)).getAddress(),
      },
    });

    const signerSha2 = await CECDSASHA2Signer.deploy();
    dispatcher = await CECDSADispatcher.deploy();

    await signerSha2.__CECDSASHA2Signer_init(true, true);
    await dispatcher.__CECDSADispatcher_init(await signerSha2.getAddress(), 64, "0x0103420004");

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#init", () => {
    it("should not init twice", async () => {
      expect(dispatcher.__CECDSADispatcher_init(ethers.hexlify(ethers.randomBytes(20)), 1337, "0x")).to.be.revertedWith(
        "Initializable: contract is already initialized",
      );
    });
  });

  describe("#getCertificatePublicKey", () => {
    it("should getCertificatePublicKey correctly", async () => {
      expect(
        await dispatcher.getCertificatePublicKey(
          "0x308203cfa0030201020204492f01a0300a06082a8648ce3d0403023041310b3009060355040613024742310e300c060355040a1305554b4b50413122302006035504031319436f756e747279205369676e696e6720417574686f72697479301e170d3232303830313030303030305a170d3333313230313030303030305a305c310b3009060355040613024742311b3019060355040a1312484d2050617373706f7274204f6666696365310f300d060355040b13064c6f6e646f6e311f301d06035504031316446f63756d656e74205369676e696e67204b657920363082014b3082010306072a8648ce3d02013081f7020101302c06072a8648ce3d0101022100ffffffff00000001000000000000000000000000ffffffffffffffffffffffff305b0420ffffffff00000001000000000000000000000000fffffffffffffffffffffffc04205ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b031500c49d360886e704936a6678e1139d26b7819f7e900441046b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c2964fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5022100ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc63255102010103420004369b6087115805a184e0a04e522acc1c58959aa0c9b19d80c8dd293fdd504ec0675381123b71874d105693f18105022fe4eb9ac7c2dfbcdcc58cbd7351d263d4a38201a4308201a030420603551d11043b30398125646f63756d656e742e746563686e6f6c6f677940686f6d656f66666963652e676f762e756ba410300e310c300a06035504071303474252302b0603551d1004243022800f32303232303830313030303030305a810f32303232313130343030303030305a300e0603551d0f0101ff04040302078030630603551d12045c305aa410300e310c300a06035504071303474252811f646f63756d656e742e746563686e6f6c6f677940686d706f2e676f762e756b8125646f63756d656e742e746563686e6f6c6f677940686f6d656f66666963652e676f762e756b3019060767810801010602040e300c020100310713015013025054305d0603551d1f045630543052a050a04e862068747470733a2f2f686d706f2e676f762e756b2f637363612f4742522e63726c862a68747470733a2f2f706b64646f776e6c6f6164312e6963616f2e696e742f43524c732f4742522e63726c301f0603551d23041830168014499e4730278520c57cfc118024e14c1562a249d6301d0603551d0e0416041439b5abb7415fb8629b55c137d12a01c35fb49486",
          491,
        ),
      ).to.equal(
        "0x369b6087115805a184e0a04e522acc1c58959aa0c9b19d80c8dd293fdd504ec0675381123b71874d105693f18105022fe4eb9ac7c2dfbcdcc58cbd7351d263d4",
      );
    });
  });

  describe("#getCertificateKey", () => {
    it("should getCertificateKey correctly", async () => {
      expect(
        await dispatcher.getCertificateKey(
          "0x369b6087115805a184e0a04e522acc1c58959aa0c9b19d80c8dd293fdd504ec0675381123b71874d105693f18105022fe4eb9ac7c2dfbcdcc58cbd7351d263d4",
        ),
      ).to.equal("0x1538393fe3820ec37e606e1eb9e7b9c97b2bdfc3c43066006d6bed6b3618f287");
    });
  });
});
