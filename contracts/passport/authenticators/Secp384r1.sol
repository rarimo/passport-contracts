// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "hardhat/console.sol";

import "./BigInt.sol";
import {SHA1} from "../../utils/SHA1.sol";

/**
 * @notice Forked from https://github.com/tdrerup/elliptic-curve-solidity/blob/master/contracts/curves/EllipticCurve.sol
 */
contract Secp384r1 {
    using SHA1 for bytes;
    using BigInts for *;

    BigInt zero = BigInts.zero();
    BigInt one = BigInts.one();
    BigInt two = BigInts.two();

    // Set parameters for curve
    BigInt a = hex"7D5A0975FC2C3057EEF67530417AFFE7FB8055C126DC5C6CE94A4B44F330B5D9".init(false);
    BigInt b = hex"26DC5C6CE94A4B44F330B5D9BBD77CBF958416295CF7E1CE6BCCDC18FF8C07B6".init(false);
    BigInt gx = hex"8BD2AEB9CB7E57CB2C4B482FFC81B7AFB9DE27E1E3BD23C23A4453BD9ACE3262".init(false);
    BigInt gy = hex"547EF835C3DAC4FD97F8461A14611DC9C27745132DED8E545C1D54C72F046997".init(false);
    BigInt p = hex"A9FB57DBA1EEA9BC3E660A909D838D726E3BF623D52620282013481D1F6E5377".init(false);
    BigInt n = hex"A9FB57DBA1EEA9BC3E660A909D838D718C397AA3B561A6F7901E0E82974856A7".init(false);

    BigInt lowSmax =
        hex"54fdabedd0f754de1f3305484ec1c6b9371dfb11ea9310141009a40e8fb729bb".init(false);

    // // Set parameters for curve. - sec384
    // BigInt a =
    //     hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFC"
    //         .init(false);
    // BigInt b =
    //     hex"B3312FA7E23EE7E4988E056BE3F82D19181D9C6EFE8141120314088F5013875AC656398D8A2ED19D2A85C8EDD3EC2AEF"
    //         .init(false);
    // BigInt gx =
    //     hex"aa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7"
    //         .init(false);
    // BigInt gy =
    //     hex"3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f"
    //         .init(false);
    // BigInt p =
    //     hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFF"
    //         .init(false);
    // BigInt n =
    //     hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973"
    //         .init(false);

    // BigInt lowSmax =
    //     hex"7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF".init(false);

    modifier onlyValidBigInt(BigInt[] memory numbers) {
        _validateBigInt(numbers);
        _;
    }

    function step1Partial(
        bytes memory r,
        bytes memory s,
        bytes memory x,
        bytes memory y
    )
        external
        view
        returns (BigInt memory r_, BigInt memory s_, BigInt memory x_, BigInt memory y_)
    {
        r_ = r.init(false);
        s_ = s.init(false);
        x_ = x.init(false);
        y_ = y.init(false);

        require(!r_.isZero() && !r_.gte(n) && !s_.isZero()); // s.gt(lowSmax)
        require(_isOnCurve(x_, y_), "Sec384: Not on curve");
    }

    // function step2Partial(
    //     bytes memory challenge,
    //     bytes memory sInv
    // )
    //     external
    //     view
    //     returns (BigInt memory x1_, BigInt memory y1_, BigInt memory z1_, BigInt memory sInv_)
    // {
    //     sInv_ = sInv.init(false);
    //     //BigInt memory message = uint256(uint160(challenge.sha1())).init(false);
    //     BigInt memory message = uint256(sha256(challenge)).init(false);
    //     (x1_, y1_, z1_) = _multiplyScalarPartial(gx, gy, BigInts.modmul(message, sInv_, n));
    // }

    function step2Partial2(bytes memory challenge) external view returns (uint256) {
        return uint256(uint160(challenge.sha1()));
    }

    function step3Partial(
        BigInt memory x,
        BigInt memory y,
        BigInt memory r,
        BigInt memory sInv
    ) external view returns (BigInt memory x2_, BigInt memory y2_, BigInt memory z2_) {
        (x2_, y2_, z2_) = _multiplyScalarPartial(x, y, BigInts.modmul(r, sInv, n));
    }

    function step3Partial2(
        BigInt memory x,
        BigInt memory y,
        BigInt memory r,
        bytes memory sInv
    ) external view returns (BigInt memory x2_, BigInt memory y2_, BigInt memory z2_) {
        BigInt memory sInv_ = sInv.init(false);
        (x2_, y2_, z2_) = _multiplyScalarPartial(x, y, BigInts.modmul(r, sInv_, n));
    }

    function step4Partial(
        bytes memory x1,
        bytes memory y1,
        bytes memory x2,
        bytes memory y2
    ) external view returns (BigInt memory x0, BigInt memory y0, BigInt memory z0) {
        BigInt memory x1_ = x1.init(false);
        BigInt memory y1_ = y1.init(false);
        BigInt memory x2_ = x2.init(false);
        BigInt memory y2_ = y2.init(false);

        (x0, y0, z0) = _addProj(x1_, y1_, one, x2_, y2_, one);
    }

    function step5Partial(
        bytes memory x,
        bytes memory y
    ) external view returns (BigInt[3] memory) {
        BigInt memory x_ = x.init(false);
        BigInt memory y_ = y.init(false);

        BigInt[3] memory P = _toProjectivePoint(x_, y_);

        if (P[2].isZero()) {
            revert();
        }

        return P;
    }

    function step6(
        bytes memory Px,
        BigInt memory P,
        BigInt memory r
    ) external view returns (bool) {
        BigInt memory Px_ = Px.init(false);

        Px_ = BigInts.modmul(P, BigInts.modmul(Px_, Px_, p), p);

        console.logBytes(Px_.mod(n).val);
        console.logBytes(r.val);

        return Px_.mod(n).eq(r);
    }

    /**
     * @notice Checks active authentication of a passport. ECDSA active authentication is an ECDSA signature of
     * raw SHA1 hash of challenge bytes. Usually brainpool256r1 elliptic curve is used.
     */
    // function authenticate(
    //     bytes memory challenge,
    //     bytes memory r,
    //     bytes memory s,
    //     bytes memory x,
    //     bytes memory y
    // ) external view returns (bool) {
    //     BigInt memory r_ = r.init(false);
    //     BigInt memory s_ = s.init(false);
    //     BigInt memory x_ = x.init(false);
    //     BigInt memory y_ = y.init(false);

    //     /// @dev accept s only from the lower part of the curve
    //     if (r_.isZero() || r_.gte(n) || s_.isZero()) {
    //         // s.gt(lowSmax)
    //         return false;
    //     }

    //     if (!_isOnCurve(x_, y_)) {
    //         return false;
    //     }

    //     BigInt memory message = uint256(uint160(challenge.sha1())).init(false);

    //     BigInt memory x1;
    //     BigInt memory x2;
    //     BigInt memory y1;
    //     BigInt memory y2;

    //     //0x336779f4bfd10f08150a58b993272dafaf9b1c8ad9c4956be69eee93cf22ef99
    //     //    .init(false);

    //     //BigInt memory modMul = BigInts.modmul(message, sInv, n).val;
    //     //0x44256e9a71b1bc52c7cd79956df4fd04138f5cb36b409f6be4768fef52a2a749
    //     //    .init(false);

    //     BigInt memory sInv = _inverseMod(s_, n);
    //     (x1, y1) = _multiplyScalar(gx, gy, BigInts.modmul(message, sInv, n));
    //     (x2, y2) = _multiplyScalar(x_, y_, BigInts.modmul(r_, sInv, n));
    //     BigInt[3] memory P = _addAndReturnProjectivePoint(x1, y1, x2, y2);

    //     if (P[2].isZero()) {
    //         return false;
    //     }

    //     BigInt memory Px = _inverseMod(P[2], p);

    //     Px = BigInts.modmul(P[0], BigInts.modmul(Px, Px, p), p);

    //     return Px.mod(n).eq(r_);
    // }

    /**
     * @dev Inverse of u in the field of modulo m.
     */
    // function _inverseMod(BigInt memory u, BigInt memory m) internal view returns (BigInt memory) {
    //     if (u.isZero() || u.eq(m) || m.isZero()) {
    //         return zero;
    //     }

    //     if (u.gt(m)) {
    //         u = u.mod(m);
    //     }

    //     BigInt memory t1;
    //     BigInt memory t2 = 1.init(false);
    //     BigInt memory r1 = m;
    //     BigInt memory r2 = u;
    //     BigInt memory q;

    //     while (!r2.isZero()) {
    //         uint256 r1Val = uint256(bytes32(r1.val));
    //         uint256 r2Val = uint256(bytes32(r2.val));

    //         q = (r1Val / r2Val).init(false);

    //         // if (
    //         //     bytes32(u.val) ==
    //         //     0x09af7b813c4a2ee1a72e6666f568554528541c298b8ba8ddc0e953e22dd84a37
    //         // ) {
    //         // }

    //         (t1, t2, r1, r2) = (t2, t1.sub(q.mul(t2)), r2, r1.sub(q.mul(r2)));
    //     }

    //     if (t1.lt(zero)) {
    //         if (
    //             bytes32(u.val) ==
    //             0x09af7b813c4a2ee1a72e6666f568554528541c298b8ba8ddc0e953e22dd84a37
    //         ) {
    //             return
    //                 uint256(
    //                     49427654025770062308308260736125948627696148306806506632295858369066081184270
    //                 ).init(false);
    //         }

    //         return m.sub(t1);
    //     }

    //     return t1;
    // }

    /**
     * @dev Multiply an elliptic curve point by a scalar.
     */
    function _multiplyScalarPartial(
        BigInt memory x0,
        BigInt memory y0,
        BigInt memory scalar
    ) internal view returns (BigInt memory x1, BigInt memory y1, BigInt memory z1) {
        // if (scalar.isZero()) {
        //     return _zeroAffine();
        // } else if (scalar.eq(one)) {
        //     return (x0, y0);
        // } else if (scalar.eq(two)) {
        //return _twice(x0, y0);
        // }

        BigInt memory base2X = x0;
        BigInt memory base2Y = y0;
        BigInt memory base2Z = 1.init(false);
        z1 = 1.init(false);
        x1 = x0;
        y1 = y0;

        if (scalar.mod(two).isZero()) {
            x1 = y1 = zero;
        }

        scalar = scalar.shr(1);

        while (scalar.gt(zero)) {
            (base2X, base2Y, base2Z) = _twiceProj(base2X, base2Y, base2Z);

            if (scalar.mod(two).eq(one)) {
                (x1, y1, z1) = _addProj(base2X, base2Y, base2Z, x1, y1, z1);
            }

            scalar = scalar.shr(1);
        }

        //(x1, y1) = _toAffinePoint(x1, y1, z1);
    }

    /**
     * @dev Double an elliptic curve point in projective coordinates. See
     * https://www.nayuki.io/page/elliptic-curve-point-addition-in-projective-coordinates
     */
    function _twiceProj(
        BigInt memory x0,
        BigInt memory y0,
        BigInt memory z0
    ) internal view returns (BigInt memory x1, BigInt memory y1, BigInt memory z1) {
        BigInt memory t;
        BigInt memory u;
        BigInt memory v;
        BigInt memory w;

        if (_isZeroCurve(x0, y0)) {
            return _zeroProj();
        }

        u = BigInts.modmul(y0, z0, p);
        u = BigInts.modmul(u, two, p);

        v = BigInts.modmul(u, x0, p);
        v = BigInts.modmul(v, y0, p);
        v = BigInts.modmul(v, two, p);

        x0 = BigInts.modmul(x0, x0, p);
        t = BigInts.modmul(x0, 3.init(false), p);

        z0 = BigInts.modmul(z0, z0, p);
        z0 = BigInts.modmul(z0, a, p);
        t = t.add(z0).mod(p);

        w = BigInts.modmul(t, t, p);
        x0 = BigInts.modmul(two, v, p);
        w = w.add(p.sub(x0)).mod(p);

        x0 = v.add(p.sub(w)).mod(p);
        x0 = BigInts.modmul(t, x0, p);
        y0 = BigInts.modmul(y0, u, p);
        y0 = BigInts.modmul(y0, y0, p);
        y0 = BigInts.modmul(two, y0, p);
        y1 = x0.add(p.sub(y0)).mod(p);

        x1 = BigInts.modmul(u, w, p);

        z1 = BigInts.modmul(u, u, p);
        z1 = BigInts.modmul(z1, u, p);
    }

    /**
     * @dev Add two elliptic curve points in projective coordinates. See
     * https://www.nayuki.io/page/elliptic-curve-point-addition-in-projective-coordinates
     */
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

    /**
     * @dev Add two elliptic curve points in affine coordinates.
     */
    function _add(
        BigInt memory x0,
        BigInt memory y0,
        BigInt memory x1,
        BigInt memory y1
    ) internal view returns (BigInt memory, BigInt memory) {
        BigInt memory z0;

        (x0, y0, z0) = _addProj(x0, y0, one, x1, y1, one);

        return _toAffinePoint(x0, y0, z0);
    }

    /**
     * @dev Double an elliptic curve point in affine coordinates.
     */
    function _twice(
        BigInt memory x0,
        BigInt memory y0
    ) internal view returns (BigInt memory, BigInt memory) {
        BigInt memory z0;

        (x0, y0, z0) = _twiceProj(x0, y0, one);

        return _toAffinePoint(x0, y0, z0);
    }

    /**
     * @dev Multiply an elliptic curve point by a 2 power base (i.e., (2^exp)*P)).
     */
    function _multiplyPowerBase2(
        BigInt memory x0,
        BigInt memory y0,
        BigInt memory exp
    ) internal view returns (BigInt memory, BigInt memory) {
        BigInt memory base2X = x0;
        BigInt memory base2Y = y0;
        BigInt memory base2Z = one;

        // original
        // for (uint256 i = 0; i < exp; i++) {
        //     (base2X, base2Y, base2Z) = _twiceProj(base2X, base2Y, base2Z);
        // }
        while (exp.gt(zero)) {
            (base2X, base2Y, base2Z) = _twiceProj(base2X, base2Y, base2Z);
            exp = exp.sub(one);
        }

        return _toAffinePoint(base2X, base2Y, base2Z);
    }

    /**
     * @dev Add two points in affine coordinates and return projective point.
     */
    function _addAndReturnProjectivePoint(
        BigInt memory x1,
        BigInt memory y1,
        BigInt memory x2,
        BigInt memory y2
    ) internal view returns (BigInt[3] memory P) {
        BigInt memory x;
        BigInt memory y;

        (x, y) = _add(x1, y1, x2, y2);

        P = _toProjectivePoint(x, y);
    }

    /**
     * @dev Transform from projective to affine coordinates.
     */
    function _toAffinePoint(
        BigInt memory x0,
        BigInt memory y0,
        BigInt memory z0Inv
    ) internal view returns (BigInt memory x1, BigInt memory y1) {
        //z0Inv = _inverseMod(z0, p);

        x1 = BigInts.modmul(x0, z0Inv, p);
        y1 = BigInts.modmul(y0, z0Inv, p);
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
    function _toProjectivePoint(
        BigInt memory x0,
        BigInt memory y0
    ) internal view returns (BigInt[3] memory P) {
        P[2] = zero.add(one).mod(p);
        P[0] = BigInts.modmul(x0, P[2], p);
        P[1] = BigInts.modmul(y0, P[2], p);
    }

    /**
     * @dev Return the zero curve in projective coordinates.
     */
    function _zeroProj()
        internal
        view
        returns (BigInt memory x, BigInt memory y, BigInt memory z)
    {
        return (zero, one, zero);
    }

    /**
     * @dev Return the zero curve in affine coordinates.
     */
    function _zeroAffine() internal view returns (BigInt memory x, BigInt memory y) {
        return (zero, zero);
    }

    /**
     * @dev Check if the curve is the zero curve.
     */
    function _isZeroCurve(BigInt memory x0, BigInt memory y0) internal pure returns (bool isZero) {
        return x0.isZero() && y0.isZero();
    }

    function _validateBigInt(BigInt[] memory numbers) private pure {
        for (uint256 i = 0; i < numbers.length; i++) {
            numbers[i].verify();
        }
    }
}
