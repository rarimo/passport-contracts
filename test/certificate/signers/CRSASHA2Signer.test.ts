import { ethers } from "hardhat";
import { expect } from "chai";
import { Reverter } from "@/test/helpers/";

import { CRSASHA2Signer } from "@ethers-v6";

describe("CRSASHA2Signer", () => {
  const reverter = new Reverter();

  let signer: CRSASHA2Signer;

  before("setup", async () => {
    const CRSASHA2Signer = await ethers.getContractFactory("CRSASHA2Signer");

    signer = await CRSASHA2Signer.deploy();

    await signer.__CRSASHA2Signer_init(65537);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#verifyICAOSignature", () => {
    it("should verify icao signature", async () => {
      const signedAttributes =
        "0x30820584a00302010202097a1b6c194ef9472494300d06092a864886f70d01010b0500306c310b3009060355040613024d453117301506035504610c0e5641544d452d3032303136303130312a3028060355040a0c214d696e69737461727374766f20756e75747261c5a16e6a696820706f736c6f76613118301606035504030c0f4d4e452065494420526f6f74204341301e170d3230303331323135323631345a170d3430303631323134323631345a3068310b3009060355040613024d453117301506035504610c0e5641544d452d3032303136303130312a3028060355040a0c214d696e69737461727374766f20756e75747261c5a16e6a696820706f736c6f76613114301206035504030c0b4d4e452065494420434131308201a2300d06092a864886f70d01010105000382018f003082018a0282018100a4f8d01ed6ec94453796c35ff993a1f12d2c757a146b986a31664e5a742d388cbadfe9d031746d705d338e9faeefd3ac3e81156536345d62a880395317ac795c91cc547c3dcd329bbe21640e14a54d2e1dc7af7ae1959e23ae505d46f1b156dcd36f8d620dc60b9b3cc79be64c16d21e138c9e82896b9c20e905c90135eb60c7acff8646530dd2b9e2c16f5860a4773badff5dbf3667ec839e8368a3e87d149bef8eb7a3f04cfa46fc6502f2c50994fffc580b38c9ca1ba85adea52d5dcc50ff33d2d6a80bb1c1395ae5446c77c2405e6d3df043ff9fa30d38f8e12f2434284249acb6037f63c1d85a8d56ef58240859da1c3bca508652fe0fa039ed4b147161e53abb2ca0c9055e13e23d6195f58a4178a32257b86c26243fa5520ec05417e92990bd6affffced1b02d0bb28144625828a70227fa0ff1e7c1cc2098aae324f368bc584a72e8253de9b459280e9a576e5f770095465cae9fb8e6f2c3babeb32bbd7bd79839921a24ac1f0eb6a45f456004313b5e5ec5f1f9753dff8d6ba4309b0203010001a38202c3308202bf30120603551d130101ff040830060101ff020100300e0603551d0f0101ff040403020106301f0603551d230418301680147798362515c7a2379ebb76e7c5c97ce7f9e5eb41301d0603551d0e04160414be39265a35611589cf302f8d21c3ced8b1b827e23081e90603551d1f0481e13081de3081dba081d8a081d58681a76c6461703a2f2f6c6461702e656c6b2e676f762e6d652f434e3d4d4e45253230654944253230526f6f7425323043412c4f3d4d696e69737461727374766f253230756e757472612563352561316e6a6968253230706f736c6f76612c6f7267616e697a6174696f6e4964656e7469666965723d5641544d452d30323031363031302c433d4d453f63657274696669636174655265766f636174696f6e4c6973743b62696e6172798629687474703a2f2f63612e656c6b2e676f762e6d652f63726c2f4d4e45654944526f6f7443412e63726c3082012c06082b060105050701010482011e3082011a3081a806082b0601050507300286819b6c6461703a2f2f6c6461702e656c6b2e676f762e6d652f434e3d4d4e45253230654944253230526f6f7425323043412c4f3d4d696e69737461727374766f253230756e757472612563352561316e6a6968253230706f736c6f76612c6f7267616e697a6174696f6e4964656e7469666965723d5641544d452d30323031363031302c433d4d453f634143657274696669636174653b62696e617279303806082b06010505073002862c687474703a2f2f63612e656c6b2e676f762e6d652f6361636572742f4d4e45654944526f6f7443412e636572303306082b060105050730018627687474703a2f2f6f6373702e656c6b2e676f762e6d652f4d4e45654944526f6f7443414f435350303d0603551d200436303430320604551d2000302a302806082b06010505070201161c68747470733a2f2f63612e656c6b2e676f762e6d652f63706370732f";
      const icaoMemberSignature =
        "0x596eda7b8cad1a9352ed069f1704c838d8cb252b8aa75aa3452acde553270afd835644f382b8d76fd1c734610fb8f88e091b80ac9e3f7e4eb261c325f544d72e4dadac52d482feb4e3dbe84482db33c9e11225e4b2f413408d8d1b9640efa27b135e3dfb5513799199ebd2b1460b10a99b1a9cd593d8af3f5bc39909b4a6691531f5009f07cec1c8abb01a82df377e5929ed31151af9b668978786baa9b4c344491913b91dd54f2a32d3400b4ab62c18c29b4baf64fb87bd6deb7fcf3b6c2962a6ae2eeacab5709c74b71a20ebf46169a1b962e2d4c2eaf6370006193951d6b0b3c3089bd869504e6678e9778f1454bc889b834de76b4eb41bebdbaf3593de4f63dab79ce8b37b862b13e3fc43709d4f557a916539597d8a77f6a2a3a672cb686f3ba2757c5ac88f26d04ade3bf54f23c59aa152d25dba4bad1f2b23ef801e30f3815f6d6204ad4ae9a94ace7860de5642f8baa09d3ce8ba3355367ece681383f162cf04b76051a0cb09e4b16d858978027426f479b01f3921cb6fc3ab6e5c5e";
      const icaoMemberKey =
        "0xb182c2d29ea6bde39b2e6ae1cb6c6676cca8d76f52809a2b1cbec9006e3c946246667589da122342ed7a816322041c218f85ffe609356a07a258f6183bec271ddc6ee5a612a58631a99c9e6000b65e68e7f247bb741b33b81a4f464662a62d025fb75ef61e038be308f4dda4433fddd85dde33bcc8489d7bad4ecfb7953e93ce1189a50f5c5500ba1ea7388dfd5c200a00c499553d72389e806126c16433632639808f21482b6f4ad7ac8ec2f67cef4bfd9c96fa57eb865135400ce675071a473f3c76f7316f668896fc84edd18525696dc2a75ca409cd98ec26a19f73ae93235e2027db8c7d6cf93ea53f54fd3273be131dad4f446bbf07c1f99b4c44047caaa6101baa803c1f4c0d24e6577833c7ebe9a31f9e14d4ae57b0fa98fbb7ead6dc68c5c4294fd9289221ff51ae4f08e7ba40e819595d120dcabac18921f97a88d341b02cb519c1d6a691878f4fa13e753f223651803d96676d05af3c711192b20f4cf7cf6a79b5043f74e5d30f1891453bfcccf5ccc3fdd13b2404ca17a6df4c43";

      expect(await signer.verifyICAOSignature(signedAttributes, icaoMemberSignature, icaoMemberKey)).to.be.true;
    });
  });
});