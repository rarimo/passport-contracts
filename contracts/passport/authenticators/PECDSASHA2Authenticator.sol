// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "hardhat/console.sol";
import "../../utils/BigInt.sol";
import "../../utils/BigIntOpt.sol";

/**
 * @notice Forked from https://github.com/tdrerup/elliptic-curve-solidity/blob/master/contracts/curves/EllipticCurve.sol
 */
contract PECDSASHA2Authenticator {
    using BigInts for *;
    using BigIntsOpt for *;

    BigInt zero = BigInts.zero();
    BigInt one = BigInts.one();
    BigInt two = BigInts.two();

    BigIntOpt zeroOpt = BigIntsOpt.zero();
    BigIntOpt oneOpt = BigIntsOpt.one();
    BigIntOpt twoOpt = BigIntsOpt.two();

    // Set parameters for curve. - secp384r1
    BigInt a = hex"7D5A0975FC2C3057EEF67530417AFFE7FB8055C126DC5C6CE94A4B44F330B5D9".init(false);
    BigInt b = hex"26DC5C6CE94A4B44F330B5D9BBD77CBF958416295CF7E1CE6BCCDC18FF8C07B6".init(false);
    BigInt gx =
        hex"aa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7"
            .init(false);
    BigInt gy =
        hex"3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f"
            .init(false);
    BigInt p = hex"A9FB57DBA1EEA9BC3E660A909D838D726E3BF623D52620282013481D1F6E5377".init(false);
    BigInt n =
        hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973"
            .init(false);

    BigInt lowSmax =
        hex"7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFe3b1a6c0fa1b96efac0d06d9245853bd76760cb5666294b"
            .init(false);

    BigIntOpt aOpt =
        hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFC"
            .initOpt(false);
    BigIntOpt bOpt =
        hex"B3312FA7E23EE7E4988E056BE3F82D19181D9C6EFE8141120314088F5013875AC656398D8A2ED19D2A85C8EDD3EC2AEF"
            .initOpt(false);
    BigIntOpt gxOpt =
        hex"aa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7"
            .initOpt(false);
    BigIntOpt gyOpt =
        hex"3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f"
            .initOpt(false);
    BigIntOpt pOpt =
        hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFF"
            .initOpt(false);
    BigIntOpt nOpt =
        hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973"
            .initOpt(false);

    BigIntOpt lowSmaxOpt =
        hex"7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFe3b1a6c0fa1b96efac0d06d9245853bd76760cb5666294b"
            .initOpt(false);

    // step1
    function authenticate(
        bytes memory challange,
        bytes memory r,
        bytes memory s,
        bytes memory x,
        bytes memory y
    )
        external
        view
        returns (
            // bytes memory x0,
            // bytes memory Px
            bool
        )
    {
        BigInt memory r_ = r.init(false);

        //require(!r_.isZero() && !r_.gte(n) && !s.init(false).isZero()); // && !s.init(false).gt(lowSmax));
        require(_isOnCurve(x.init(false), y.init(false)), "Sec384: Not on curve");

        // BigInt memory Px_ = Px.init(false);
        // BigInt memory P = _toProjectivePoint(x0.init(false));

        // Px_ = BigInts.modmul(P, BigInts.modmul(Px_, Px_, p), p);

        // return Px_.mod(n).eq(r_);

        return true;
    }

    /**
     * @dev Check if a point in affine coordinates is on the curve.
     */
    function _isOnCurve(BigInt memory x, BigInt memory y) internal view returns (bool) {
        if (x.isZero() || x.eq(p) || y.isZero() || y.eq(p)) {
            return false;
        }

        BigInt memory LHS = BigInts.modmul(y, y, p); // y^2
        BigInt memory RHS = BigInts.modmul(BigInts.modmul(x, x, p), x, p); // x^3

        if (!a.isZero()) {
            RHS = RHS.add(BigInts.modmul(x, a, p)).mod(p);
        }

        if (!b.isZero()) {
            RHS = RHS.add(b).mod(p); // x^3 + a*x + b
        }

        return LHS.eq(RHS);
    }

    /**
     * @dev Transform affine coordinates into projective coordinates.
     */
    function _toProjectivePoint(BigInt memory x0) internal view returns (BigInt memory) {
        BigInt memory P = zero.add(one).mod(p); // P[2]

        require(!P.isZero());

        return BigInts.modmul(x0, P, p); // P[0]
        //P[1] = BigInts.modmul(y0, P[2], p);
    }

    function _multiplyScalarPartial(
        bytes memory x0,
        bytes memory y0,
        bytes memory scalar
    ) public view returns (BigInt memory x1, BigInt memory y1, BigInt memory z1) {
        BigInt memory x0_ = x0.init(false);
        BigInt memory y0_ = y0.init(false);
        BigInt memory scalar_ = scalar.init(false);

        // if (scalar === 0n) {
        //   return zeroAffine();
        // } else if (scalar === 1n) {
        //   return { x: x0, y: y0 };
        // } else if (scalar === 2n) {
        //   return twice(x0, y0);
        // }

        BigInt memory base2X = x0_;
        BigInt memory base2Y = y0_;
        BigInt memory base2Z = one;
        z1 = one;
        x1 = x0_;
        y1 = y0_;

        if (scalar_.mod(two).eq(one)) {
            x1 = zero;
            y1 = zero;
        }

        scalar_ = scalar_.shr(1);

        //uint i = 0;
        //while (scalar_.gt(zero)) {
        // 382
        for (uint i = 0; i < 5; i++) {
            (base2X, base2Y, base2Z) = _twiceProj(base2X, base2Y, base2Z);

            if (scalar_.mod(two).eq(one)) {
                (x1, y1, z1) = _addProj(base2X, base2Y, base2Z, x1, y1, z1);
            }

            scalar_ = scalar_.shr(1);
        }

        // console.logBytes(base2X.val);
        // console.logBytes(base2Y.val);
        // console.logBytes(base2Z.val);
        console.logBytes(x1.val);
        console.logBytes(y1.val);
        console.logBytes(z1.val);

        bytes32 size;

        console.log("msize");
        //4.211.872
        //4044a0
        assembly {
            size := msize()
        }

        console.log(uint256(size));

        console.log("================");
    }

    function _twiceProj(
        BigInt memory x0,
        BigInt memory y0,
        BigInt memory z0
    ) internal view returns (BigInt memory x1, BigInt memory y1, BigInt memory z1) {
        BigInt memory t;
        BigInt memory u;
        BigInt memory v;
        BigInt memory w;

        // if (_isZeroCurve(x0, y0)) {
        //     return _zeroProj();
        // }

        u = BigInts.modmul(y0, z0, p);
        u = BigInts.modmul(u, two, p);

        v = BigInts.modmul(u, x0, p);
        v = BigInts.modmul(v, y0, p);
        v = BigInts.modmul(v, two, p);

        x0 = BigInts.modmul(x0, x0, p);
        t = BigInts.modmul(x0, 3.init(false), p);

        z0 = BigInts.modmul(z0, z0, p);
        z0 = BigInts.modmul(z0, a, p);

        // //t = (t + z0) % p;
        t = t.add(z0).mod(p);

        w = BigInts.modmul(t, t, p);
        x0 = BigInts.modmul(two, v, p);

        // //w = (w + (p - x0)) % p;
        w = w.add(p.sub(x0)).mod(p);

        // //x0 = (v + (p - w)) % p;
        x0 = v.add(p.sub(w)).mod(p);

        x0 = BigInts.modmul(t, x0, p);
        y0 = BigInts.modmul(y0, u, p);
        y0 = BigInts.modmul(y0, y0, p);
        y0 = BigInts.modmul(two, y0, p);

        // //y1 = (x0 + (p - y0)) % p;
        y1 = x0.add(p.sub(y0)).mod(p);

        x1 = BigInts.modmul(u, w, p);

        z1 = BigInts.modmul(u, u, p);
        z1 = BigInts.modmul(z1, u, p);
    }

    //2,724,209
    function _addProj(
        BigInt memory x0,
        BigInt memory y0,
        BigInt memory z0,
        BigInt memory x1,
        BigInt memory y1,
        BigInt memory z1
    ) internal view returns (BigInt memory x2, BigInt memory y2, BigInt memory z2) {
        BigInt memory t0;
        BigInt memory t1;
        BigInt memory u0;
        BigInt memory u1;

        if (_isZeroCurve(x0, y0)) {
            return (x1, y1, z1);
        } else if (_isZeroCurve(x1, y1)) {
            return (x0, y0, z0);
        }

        t0 = BigInts.modmul(y0, z1, p);
        t1 = BigInts.modmul(y1, z0, p);

        u0 = BigInts.modmul(x0, z1, p);
        u1 = BigInts.modmul(x1, z0, p);

        if (u0.eq(u1)) {
            if (t0.eq(t1)) {
                return _twiceProj(x0, y0, z0);
            } else {
                return _zeroProj();
            }
        }

        (x2, y2, z2) = _addProj2(BigInts.modmul(z0, z1, p), u0, u1, t1, t0);
    }

    /**
     * @dev Helper function that splits addProj to avoid too many local variables.
     */
    function _addProj2(
        BigInt memory v,
        BigInt memory u0,
        BigInt memory u1,
        BigInt memory t1,
        BigInt memory t0
    ) internal view returns (BigInt memory x2, BigInt memory y2, BigInt memory z2) {
        BigInt memory u;
        BigInt memory u2;
        BigInt memory u3;
        BigInt memory w;
        BigInt memory t;

        t = t0.add(p.sub(t1)).mod(p);
        u = u0.add(p.sub(u1)).mod(p);
        u2 = BigInts.modmul(u, u, p);

        w = BigInts.modmul(t, t, p);
        w = BigInts.modmul(w, v, p);
        u1 = u1.add(u0).mod(p);
        u1 = BigInts.modmul(u1, u2, p);
        w = w.add(p.sub(u1)).mod(p);

        x2 = BigInts.modmul(u, w, p);

        u3 = BigInts.modmul(u2, u, p);
        u0 = BigInts.modmul(u0, u2, p);
        u0 = u0.add(p.sub(w)).mod(p);

        t = BigInts.modmul(t, u0, p);
        t0 = BigInts.modmul(t0, u3, p);

        y2 = t.add(p.sub(t0)).mod(p);

        z2 = BigInts.modmul(u3, v, p);
    }

    function _isZeroCurve(BigInt memory x, BigInt memory y) internal view returns (bool) {
        return x.eq(zero) && y.eq(zero);
    }

    function _zeroProj() internal view returns (BigInt memory, BigInt memory, BigInt memory) {
        return (zero, one, zero);
    }

    function _zeroAffine() internal view returns (BigInt memory, BigInt memory) {
        return (zero, zero);
    }
}
