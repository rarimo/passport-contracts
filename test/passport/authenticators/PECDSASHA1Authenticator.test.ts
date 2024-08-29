import { ethers } from "hardhat";
import { toBeHex as hex } from "ethers";
import { expect } from "chai";
import { Reverter } from "@/test/helpers/";
import { inverseMod, toAffinePoint, multiplyScalar, n, p, gx, gy, modmul } from "@/test/helpers/";

import { PECDSASHA1Authenticator, Secp384r1 } from "@ethers-v6";
import { BigIntStructOutput } from "@/generated-types/ethers/contracts/passport/authenticators/Secp384r1";

describe("PECDSASHA1Authenticator", () => {
  const reverter = new Reverter();

  let auth: PECDSASHA1Authenticator;
  let auth2: Secp384r1;

  before("setup", async () => {
    const PECDSASHA1Authenticator = await ethers.getContractFactory("PECDSASHA1Authenticator");
    const Secp384r1 = await ethers.getContractFactory("Secp384r1");

    auth = await PECDSASHA1Authenticator.deploy();
    auth2 = await Secp384r1.deploy();

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("#authenticate", () => {
    it.only("should authenticate passport", async () => {
      const challenge = "0xe7938ea62eb1980a";

      const r = "0x13DCD0CCE676DFB4C2EF2B26F3AC8BB640146391C12EC80E052ABA2D617A5888";
      const s = "0x4060930A62757DC2003F4CAA38E9CFF44001E2B3D7286E03CA119B1AD7A680B1";
      const x = "0x69501be7dac08517dfe4a44e1952cc9f5b21d22cbe4d3db26ea22542afbf8548";
      const y = "0x3d72a4671baa4bcd74f4cdc71bf6fe45a9ddaf50c5f6e3327078c90da2fcb304";

      expect(await auth.authenticate(challenge, r, s, x, y)).to.be.true;
    });

    it.only("bigint - oldData", async () => {
      const bigint = (val: any[]) => ({ val: val[0] == "0x" ? "0x00" : val[0], neg: val[1], bitlen: val[2] });

      const challenge = "0xe7938ea62eb1980a";

      const r = "0x13DCD0CCE676DFB4C2EF2B26F3AC8BB640146391C12EC80E052ABA2D617A5888";
      const s = "0x4060930A62757DC2003F4CAA38E9CFF44001E2B3D7286E03CA119B1AD7A680B1";
      const x = "0x69501be7dac08517dfe4a44e1952cc9f5b21d22cbe4d3db26ea22542afbf8548";
      const y = "0x3d72a4671baa4bcd74f4cdc71bf6fe45a9ddaf50c5f6e3327078c90da2fcb304";

      let { r_, s_, x_, y_ } = await auth2.step1Partial(r, s, x, y);
      const sInvLocal = inverseMod(BigInt(bigint(s_).val), n);

      //let { x1_, y1_, z1_, sInv_ } = await auth2.step2Partial(challenge, hex(sInvLocal));
      //let { x: xP, y: yP } = toAffinePoint(BigInt(bigint(x1_).val), BigInt(bigint(y1_).val), BigInt(bigint(z1_).val));

      let xP: bigint, yP: bigint;

      ({ x: xP, y: yP } = multiplyScalar(gx, gy, modmul(await auth2.step2Partial2(challenge), sInvLocal, n)));

      const x1 = xP;
      const y1 = yP;

      //let { x2_, y2_, z2_ } = await auth2.step3Partial2(bigint(x_), bigint(y_), bigint(r_), hex(sInvLocal));
      //({ x: xP, y: yP } = toAffinePoint(BigInt(bigint(x2_).val), BigInt(bigint(y2_).val), BigInt(bigint(z2_).val)));

      ({ x: xP, y: yP } = multiplyScalar(BigInt(x), BigInt(y), modmul(BigInt(r), sInvLocal, n)));

      const x2 = xP;
      const y2 = yP;

      const { x0, y0, z0 } = await auth2.step4Partial(hex(x1), hex(y1), hex(x2), hex(y2));

      ({ x: xP, y: yP } = toAffinePoint(BigInt(bigint(x0).val), BigInt(bigint(y0).val), BigInt(bigint(z0).val)));

      const P = await auth2.step5Partial(hex(xP), hex(yP));

      const Px = inverseMod(BigInt(P[2].val), p);

      expect(await auth2.step6(hex(Px), bigint(P[0]), bigint(r_))).to.be.true;
    });

    it("bigint - sec384r1", async () => {
      const bigint = (val: any[]) => ({ val: val[0] == "0x" ? "0x00" : val[0], neg: val[1], bitlen: val[2] });

      const challenge = "0xe7938ea62eb1980a";

      const r = "0x7B80357D84040D780AEDFF4806D3974B50015911A9585F3D8CFB32A32774F32175F13C4D643154BA50245A94FD396CD7";
      const s = "0x48BB1EFB823DB1C45F0BF7BA36E6DAA1AE00E6DD2781779AB1AD3DC148F3F7124B856556AA7041E33BE8F77B6F3D8BF6";
      const x = "0x54e00e0f15b87f22763fb966ea8c2136ba68f9ac05db144317a76d85f73815799c9ae4667002962c2d14f4df6a6cab51";
      const y = "0x2c5fb3d43468815d653fb9f44fb495b897b7828a73273258a368ebf199e0dd92c61bd27890f582eb4ab6e0701ad06317";

      let { r_, s_, x_, y_ } = await auth2.step1Partial(r, s, x, y);
      const sInvLocal = inverseMod(BigInt(bigint(s_).val), n);

      //let { x1_, y1_, z1_, sInv_ } = await auth2.step2Partial(challenge, hex(sInvLocal));
      //let { x: xP, y: yP } = toAffinePoint(BigInt(bigint(x1_).val), BigInt(bigint(y1_).val), BigInt(bigint(z1_).val));

      let xP: bigint, yP: bigint;

      ({ x: xP, y: yP } = multiplyScalar(gx, gy, modmul(BigInt(ethers.sha256(challenge)), sInvLocal, n)));

      const x1 = xP;
      const y1 = yP;

      //let { x2_, y2_, z2_ } = await auth2.step3Partial2(bigint(x_), bigint(y_), bigint(r_), hex(sInvLocal));
      //({ x: xP, y: yP } = toAffinePoint(BigInt(bigint(x2_).val), BigInt(bigint(y2_).val), BigInt(bigint(z2_).val)));

      ({ x: xP, y: yP } = multiplyScalar(BigInt(x), BigInt(y), modmul(BigInt(r), sInvLocal, n)));

      const x2 = xP;
      const y2 = yP;

      const { x0, y0, z0 } = await auth2.step4Partial(hex(x1), hex(y1), hex(x2), hex(y2));

      ({ x: xP, y: yP } = toAffinePoint(BigInt(bigint(x0).val), BigInt(bigint(y0).val), BigInt(bigint(z0).val)));

      const P = await auth2.step5Partial(hex(xP), hex(yP));

      const Px = inverseMod(BigInt(P[2].val), p);

      expect(await auth2.step6(hex(Px), bigint(P[0]), bigint(r_))).to.be.true;
    });
  });
});
