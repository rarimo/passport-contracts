// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../../utils/BigInt.sol";

/**
 * @notice Forked from https://github.com/tdrerup/elliptic-curve-solidity/blob/master/contracts/curves/EllipticCurve.sol
 */
contract PECDSASHA2Authenticator {
    using BigInts for *;

    BigInt zero = BigInts.zero();
    BigInt one = BigInts.one();
    BigInt two = BigInts.two();

    // Set parameters for curve. - secp384r1
    BigInt a =
        hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFC"
            .init(false);
    BigInt b =
        hex"B3312FA7E23EE7E4988E056BE3F82D19181D9C6EFE8141120314088F5013875AC656398D8A2ED19D2A85C8EDD3EC2AEF"
            .init(false);
    BigInt gx =
        hex"aa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7"
            .init(false);
    BigInt gy =
        hex"3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f"
            .init(false);
    BigInt p =
        hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFF"
            .init(false);
    BigInt n =
        hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973"
            .init(false);

    BigInt lowSmax =
        hex"7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFe3b1a6c0fa1b96efac0d06d9245853bd76760cb5666294b"
            .init(false);

    // step1
    function authenticate(
        bytes memory r,
        bytes memory s,
        bytes memory x,
        bytes memory y,
        bytes memory x0,
        bytes memory Px
    ) external view returns (bool) {
        BigInt memory r_ = r.init(false);

        require(!r_.isZero() && !r_.gte(n) && !s.init(false).isZero()); // && !s.init(false).gt(lowSmax));
        require(_isOnCurve(x.init(false), y.init(false)), "Sec384: Not on curve");

        BigInt memory Px_ = Px.init(false);
        BigInt memory P = _toProjectivePoint(x0.init(false));

        Px_ = BigInts.modmul(P, BigInts.modmul(Px_, Px_, p), p);

        return Px_.mod(n).eq(r_);
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
}
