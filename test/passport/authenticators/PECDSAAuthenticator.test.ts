import { ethers } from "hardhat";
import { toBeHex as hex } from "ethers";
import { expect } from "chai";
import { Reverter } from "@/test/helpers/";
import { inverseMod, toAffinePoint, multiplyScalar, addProj, n, p, gx, gy, modmul } from "@/test/helpers/";

import {
  PECDSASHA1Authenticator,
  PECDSASHA2Authenticator,
  PECDSASHA2NewAuthenticator,
  PECDSASHA1U384Authenticator,
} from "@ethers-v6";

describe("PECDSAAuthenticator", () => {
  const reverter = new Reverter();

  let authSha1: PECDSASHA1Authenticator;
  let authSha2: PECDSASHA2Authenticator;
  let authSha2New: PECDSASHA2NewAuthenticator;
  let authU384: PECDSASHA1U384Authenticator;

  before("setup", async () => {
    const PECDSASHA1Authenticator = await ethers.getContractFactory("PECDSASHA1Authenticator");
    const PECDSASHA2Authenticator = await ethers.getContractFactory("PECDSASHA2Authenticator");
    const PECDSASHA2NewAuthenticator = await ethers.getContractFactory("PECDSASHA2NewAuthenticator");
    const PECDSASHA1U384Authenticator = await ethers.getContractFactory("PECDSASHA1U384Authenticator");

    authSha1 = await PECDSASHA1Authenticator.deploy();
    authSha2 = await PECDSASHA2Authenticator.deploy();
    authSha2New = await PECDSASHA2NewAuthenticator.deploy();
    authU384 = await PECDSASHA1U384Authenticator.deploy();

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#authenticate", () => {
    it.only("should authenticate passport - brainpool256r1 & sha1", async () => {
      const challenge = "0xe7938ea62eb1980a";

      const r = "0x13DCD0CCE676DFB4C2EF2B26F3AC8BB640146391C12EC80E052ABA2D617A5888";
      const s = "0x4060930A62757DC2003F4CAA38E9CFF44001E2B3D7286E03CA119B1AD7A680B1";
      const x = "0x69501be7dac08517dfe4a44e1952cc9f5b21d22cbe4d3db26ea22542afbf8548";
      const y = "0x3d72a4671baa4bcd74f4cdc71bf6fe45a9ddaf50c5f6e3327078c90da2fcb304";

      expect(await authSha1.authenticate(challenge, r, s, x, y)).to.be.true;
    });

    it("should authenticate passport - brainpool256r1 & sha2", async () => {
      const challenge = "0xe7938ea62eb1980a";

      const r = "0x13DCD0CCE676DFB4C2EF2B26F3AC8BB640146391C12EC80E052ABA2D617A5888";
      const s = "0x4060930A62757DC2003F4CAA38E9CFF44001E2B3D7286E03CA119B1AD7A680B1";
      const x = "0x69501be7dac08517dfe4a44e1952cc9f5b21d22cbe4d3db26ea22542afbf8548";
      const y = "0x3d72a4671baa4bcd74f4cdc71bf6fe45a9ddaf50c5f6e3327078c90da2fcb304";

      expect(await authSha2.authenticate(challenge, r, s, x, y)).to.be.true;
    });

    it.only("should authenticate passport - secp384r1 & sha2 new", async () => {
      const challenge =
        "0x308203cfa0030201020204492f01a0300a06082a8648ce3d0403023041310b3009060355040613024742310e300c060355040a1305554b4b50413122302006035504031319436f756e747279205369676e696e6720417574686f72697479301e170d3232303830313030303030305a170d3333313230313030303030305a305c310b3009060355040613024742311b3019060355040a1312484d2050617373706f7274204f6666696365310f300d060355040b13064c6f6e646f6e311f301d06035504031316446f63756d656e74205369676e696e67204b657920363082014b3082010306072a8648ce3d02013081f7020101302c06072a8648ce3d0101022100ffffffff00000001000000000000000000000000ffffffffffffffffffffffff305b0420ffffffff00000001000000000000000000000000fffffffffffffffffffffffc04205ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b031500c49d360886e704936a6678e1139d26b7819f7e900441046b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c2964fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5022100ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc63255102010103420004369b6087115805a184e0a04e522acc1c58959aa0c9b19d80c8dd293fdd504ec0675381123b71874d105693f18105022fe4eb9ac7c2dfbcdcc58cbd7351d263d4a38201a4308201a030420603551d11043b30398125646f63756d656e742e746563686e6f6c6f677940686f6d656f66666963652e676f762e756ba410300e310c300a06035504071303474252302b0603551d1004243022800f32303232303830313030303030305a810f32303232313130343030303030305a300e0603551d0f0101ff04040302078030630603551d12045c305aa410300e310c300a06035504071303474252811f646f63756d656e742e746563686e6f6c6f677940686d706f2e676f762e756b8125646f63756d656e742e746563686e6f6c6f677940686f6d656f66666963652e676f762e756b3019060767810801010602040e300c020100310713015013025054305d0603551d1f045630543052a050a04e862068747470733a2f2f686d706f2e676f762e756b2f637363612f4742522e63726c862a68747470733a2f2f706b64646f776e6c6f6164312e6963616f2e696e742f43524c732f4742522e63726c301f0603551d23041830168014499e4730278520c57cfc118024e14c1562a249d6301d0603551d0e0416041439b5abb7415fb8629b55c137d12a01c35fb49486";

      const r = "0x3044b552135e5eb46368e739b3138f9f1f2eb37a0518f564d2767d02ac67a9f41fb71bad06a99f54ee2e43ead2916f63";
      const s = "0xf1f85ce14adeb8671a134fcd1b6a7a0a2c2ad4908b27428dcb65ed17afd07f6524a7d892015394132b48bb3a2bdd1edd";
      const x = "0x56931fd7d42942eec92298d7291371cdbac29c60230c9f635d010939ab7f8f5d977ccfe90bd7528cafa53afad6225bf6";
      const y = "0x1e2af4d20831aed1e6b578ccb00e1534182f6d1ee6bf524fbd62bd056d0d538c24eb7f2a436e336e139f00a072b0ba1a";

      // const challenge = "0xe7938ea62eb1980a";
      //
      // const r = "0x13DCD0CCE676DFB4C2EF2B26F3AC8BB640146391C12EC80E052ABA2D617A5888";
      // const s = "0x4060930A62757DC2003F4CAA38E9CFF44001E2B3D7286E03CA119B1AD7A680B1";
      // const x = "0x69501be7dac08517dfe4a44e1952cc9f5b21d22cbe4d3db26ea22542afbf8548";
      // const y = "0x3d72a4671baa4bcd74f4cdc71bf6fe45a9ddaf50c5f6e3327078c90da2fcb304";

      //await authSha2New.forTest(y);
      expect(await authU384.authenticate(challenge, { r, s, x, y })).to.be.true;

      //  console.log(gx, gy, modmul(BigInt(ethers.sha256(challenge)), sInv, n));

      // const sInv = inverseMod(BigInt(s), n);
      // const { x: x1, y: y1 } = multiplyScalar(gx, gy, modmul(BigInt(ethers.sha256(challenge)), sInv, n));
      // // const points1 = await authSha2._multiplyScalarPartial(
      // //   hex(gx),
      // //   hex(gy),
      // //   hex(modmul(BigInt(ethers.sha256(challenge)), sInv, n)),
      // // );
      // // const points2 = await authSha2._multiplyScalarPartial(
      // //   hex(gx),
      // //   hex(gy),
      // //   hex(modmul(BigInt(ethers.sha256(challenge)), sInv, n)),
      // // );

      // const { x: x2, y: y2 } = multiplyScalar(BigInt(x), BigInt(y), modmul(BigInt(r), sInv, n));
      // const {
      //   x: x0,
      //   y: y0,
      //   z: z0,
      // } = addProj(
      //   BigInt(points1.x1.val),
      //   BigInt(points1.y1.val),
      //   1n,
      //   BigInt(points2.x1.val),
      //   BigInt(points2.y1.val),
      //   1n,
      // );

      // const { x: xP } = toAffinePoint(x0, y0, z0);
      // const Px = inverseMod(1n % p, p);

      // expect(await authSha2.authenticate(r, s, x, y, hex(xP), hex(Px))).to.be.true;

      // console.log("_multiplyScalarPartial+", new Intl.NumberFormat("en-US").format(gas1));
      // console.log("_multiplyScalarPartial-", new Intl.NumberFormat("en-US").format(gas2));
    });
  });
});
