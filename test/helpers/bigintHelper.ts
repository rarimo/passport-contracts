export const a = BigInt("0x7D5A0975FC2C3057EEF67530417AFFE7FB8055C126DC5C6CE94A4B44F330B5D9");
export const b = BigInt("0x26DC5C6CE94A4B44F330B5D9BBD77CBF958416295CF7E1CE6BCCDC18FF8C07B6");
export const gx = BigInt("0x8BD2AEB9CB7E57CB2C4B482FFC81B7AFB9DE27E1E3BD23C23A4453BD9ACE3262");
export const gy = BigInt("0x547EF835C3DAC4FD97F8461A14611DC9C27745132DED8E545C1D54C72F046997");
export const p = BigInt("0xA9FB57DBA1EEA9BC3E660A909D838D726E3BF623D52620282013481D1F6E5377");
export const n = BigInt("0xA9FB57DBA1EEA9BC3E660A909D838D718C397AA3B561A6F7901E0E82974856A7");
export const lowSmax = BigInt("0x54fdabedd0f754de1f3305484ec1c6b9371dfb11ea9310141009a40e8fb729bb");

// sec384r1
// export const a = BigInt(
//   "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFC",
// );
// export const b = BigInt(
//   "0xB3312FA7E23EE7E4988E056BE3F82D19181D9C6EFE8141120314088F5013875AC656398D8A2ED19D2A85C8EDD3EC2AEF",
// );
// export const gx = BigInt(
//   "0xaa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7",
// );
// export const gy = BigInt(
//   "0x3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f",
// );
// export const p = BigInt(
//   "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFF",
// );
// export const n = BigInt(
//   "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973",
// );
// export const lowSmax = BigInt("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");

export function modmul(a: bigint, b: bigint, mod: bigint): bigint {
  return (a * b) % mod;
}

export function inverseMod(u: bigint, m: bigint): bigint {
  const zero = 0n;

  if (u === 0n || u === m || m === 0n) {
    return zero;
  }

  if (u > m) {
    u = u % m;
  }

  let t1 = zero;
  let t2 = 1n;
  let r1 = m;
  let r2 = u;
  let q: bigint;

  while (r2 !== 0n) {
    q = r1 / r2;

    [t1, t2, r1, r2] = [t2, t1 - q * t2, r2, r1 - q * r2];
  }

  if (t1 < zero) {
    return m - -t1;
  }

  return t1;
}

export function toAffinePoint(x0: bigint, y0: bigint, z0: bigint): { x: bigint; y: bigint } {
  // Calculate the inverse mod of z0Inv with respect to p
  const z0Inv = inverseMod(z0, p);
  // Calculate the affine coordinates
  const x = modmul(x0, z0Inv, p);
  const y = modmul(y0, z0Inv, p);

  // Return the affine coordinates
  return { x, y };
}

export function multiplyScalar(x0: bigint, y0: bigint, scalar: bigint): { x: bigint; y: bigint } {
  if (scalar === 0n) {
    return zeroAffine();
  } else if (scalar === 1n) {
    return { x: x0, y: y0 };
  } else if (scalar === 2n) {
    return twice(x0, y0);
  }

  let base2X = x0;
  let base2Y = y0;
  let base2Z = 1n;
  let z1 = 1n;
  let x1 = x0;
  let y1 = y0;

  if (scalar % 2n === 0n) {
    x1 = 0n;
    y1 = 0n;
  }

  scalar = scalar >> 1n;

  while (scalar > 0n) {
    ({ x: base2X, y: base2Y, z: base2Z } = twiceProj(base2X, base2Y, base2Z));

    if (scalar % 2n === 1n) {
      ({ x: x1, y: y1, z: z1 } = addProj(base2X, base2Y, base2Z, x1, y1, z1));
    }

    scalar = scalar >> 1n;
  }

  return toAffinePoint(x1, y1, z1);
}

function twice(x0: bigint, y0: bigint) {
  const { x, y, z } = twiceProj(x0, y0, 1n);
  return toAffinePoint(x, y, z);
}

function twiceProj(x0: bigint, y0: bigint, z0: bigint): { x: bigint; y: bigint; z: bigint } {
  let t: bigint;
  let u: bigint;
  let v: bigint;
  let w: bigint;

  if (isZeroCurve(x0, y0)) {
    return zeroProj();
  }

  u = modmul(y0, z0, p);
  u = modmul(u, 2n, p);

  v = modmul(u, x0, p);
  v = modmul(v, y0, p);
  v = modmul(v, 2n, p);

  x0 = modmul(x0, x0, p);
  t = modmul(x0, BigInt(3), p);

  z0 = modmul(z0, z0, p);
  z0 = modmul(z0, a, p);
  t = (t + z0) % p;

  w = modmul(t, t, p);
  x0 = modmul(2n, v, p);
  w = (w + (p - x0)) % p;

  x0 = (v + (p - w)) % p;
  x0 = modmul(t, x0, p);
  y0 = modmul(y0, u, p);
  y0 = modmul(y0, y0, p);
  y0 = modmul(2n, y0, p);
  let y1 = (x0 + (p - y0)) % p;

  let x1 = modmul(u, w, p);

  let z1 = modmul(u, u, p);
  z1 = modmul(z1, u, p);

  return { x: x1, y: y1, z: z1 };
}

function addProj(
  x0: bigint,
  y0: bigint,
  z0: bigint,
  x1: bigint,
  y1: bigint,
  z1: bigint,
): { x: bigint; y: bigint; z: bigint } {
  let t0: bigint;
  let t1: bigint;
  let u0: bigint;
  let u1: bigint;

  if (isZeroCurve(x0, y0)) {
    return { x: x1, y: y1, z: z1 };
  } else if (isZeroCurve(x1, y1)) {
    return { x: x0, y: y0, z: z0 };
  }

  t0 = modmul(y0, z1, p);
  t1 = modmul(y1, z0, p);

  u0 = modmul(x0, z1, p);
  u1 = modmul(x1, z0, p);

  if (u0 === u1) {
    if (t0 === t1) {
      return twiceProj(x0, y0, z0);
    } else {
      return zeroProj();
    }
  }

  return addProj2(modmul(z0, z1, p), u0, u1, t1, t0);
}

function addProj2(v: bigint, u0: bigint, u1: bigint, t1: bigint, t0: bigint): { x: bigint; y: bigint; z: bigint } {
  let u: bigint;
  let u2: bigint;
  let u3: bigint;
  let w: bigint;
  let t: bigint;

  t = (t0 + (p - t1)) % p;
  u = (u0 + (p - u1)) % p;
  u2 = modmul(u, u, p);

  w = modmul(t, t, p);
  w = modmul(w, v, p);
  u1 = (u1 + u0) % p;
  u1 = modmul(u1, u2, p);
  w = (w + (p - u1)) % p;

  const x2 = modmul(u, w, p);

  u3 = modmul(u2, u, p);
  u0 = modmul(u0, u2, p);
  u0 = (u0 + (p - w)) % p;
  t = modmul(t, u0, p);
  t0 = modmul(t0, u3, p);

  const y2 = (t + (p - t0)) % p;

  const z2 = modmul(u3, v, p);

  return { x: x2, y: y2, z: z2 };
}

function isZeroCurve(x: bigint, y: bigint): boolean {
  return x === BigInt(0) && y === BigInt(0);
}

function zeroProj(): { x: bigint; y: bigint; z: bigint } {
  return { x: 0n, y: 1n, z: 0n };
}

function zeroAffine(): { x: bigint; y: bigint } {
  return { x: 0n, y: 0n };
}
