// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {SHA1} from "../../utils/SHA1.sol";
import {U384} from "../../utils/U384.sol";
import "hardhat/console.sol";

/**
 * @notice Forked from https://github.com/tdrerup/elliptic-curve-solidity/blob/master/contracts/curves/EllipticCurve.sol
 */
contract PECDSASHA1U384Authenticator {
    using SHA1 for bytes;
    using U384 for *;

    struct Parameters {
        uint256 a;
        uint256 b;
        uint256 gx;
        uint256 gy;
        uint256 p;
        uint256 n;
        uint256 lowSmax;
        uint256 call;
    }

    struct Inputs {
        bytes r;
        bytes s;
        bytes x;
        bytes y;
    }

    struct _Inputs {
        uint256 r;
        uint256 s;
        uint256 x;
        uint256 y;
    }

    /**
     * @notice Checks active authentication of a passport. ECDSA active authentication is an ECDSA signature of
     * raw SHA1 hash of challenge bytes. Usually brainpool256r1 elliptic curve is used.
     */
    function authenticate(
        bytes memory challenge,
        Inputs memory inputs
    ) external view returns (bool) {
        /// @dev accept s only from the lower part of the curve
        // if (r == 0 || r >= n || s == 0 || s > lowSmax) {
        //     return false;
        // }

        _Inputs memory _inputs;

        _inputs.r = U384.init(inputs.r);
        _inputs.s = U384.init(inputs.s);
        _inputs.x = U384.init(inputs.x);
        _inputs.y = U384.init(inputs.y);

        // brainpool256r1 parameters
        Parameters memory params = Parameters({
            a: hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFC"
                .init(),
            b: hex"B3312FA7E23EE7E4988E056BE3F82D19181D9C6EFE8141120314088F5013875AC656398D8A2ED19D2A85C8EDD3EC2AEF"
                .init(),
            gx: hex"aa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7"
                .init(),
            gy: hex"3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f"
                .init(),
            p: hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFF"
                .init(),
            n: hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973"
                .init(),
            lowSmax: hex"7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFe3b1a6c0fa1b96efac0d06d9245853bd76760cb5666294b"
                .init(),
            call: U384.initCall()
        });

        if (!_isOnCurve(params.call, params.p, params.a, params.b, _inputs.x, _inputs.y)) {
            return false;
        }

        uint256 message = uint256(sha256(challenge)).init();

        (uint256 x1, uint256 y1) = _multiplyScalar(
            params,
            params.gx,
            params.gy,
            U384.moddiv(params.call, message, _inputs.s, params.n)
        );
        console.log("x1y1");
        console.logBytes(U384.toBytes(x1));
        console.logBytes(U384.toBytes(y1));

        (uint256 x2, uint256 y2) = _multiplyScalar(
            params,
            _inputs.x,
            _inputs.y,
            U384.moddiv(params.call, _inputs.r, _inputs.s, params.n)
        );
        console.log("x2y2");
        console.logBytes(U384.toBytes(x2));
        console.logBytes(U384.toBytes(y2));

        uint256[3] memory P = _addAndReturnProjectivePoint(
            params.call,
            params.p,
            params.a,
            x1,
            y1,
            x2,
            y2
        );

        console.logBytes(P[0].toBytes());
        console.logBytes(P[1].toBytes());
        console.logBytes(P[2].toBytes());

        // if (P[2] == 0) {
        //     return false;
        // }

        // uint256 Px = _inverseMod(P[2], p);
        // Px = U384.modmul(params.call, P[0], U384.modmul(params.call, Px, Px, p), p);

        // return Px % n == r;

        return true;
    }

    /**
     * @dev Multiply an elliptic curve point by a scalar.
     */
    function _multiplyScalar(
        Parameters memory params,
        uint256 x0,
        uint256 y0,
        uint256 scalar
    ) internal view returns (uint256 x1, uint256 y1) {
        if (U384.eqInteger(scalar, 0)) {
            return _zeroAffine();
        } else if (U384.eqInteger(scalar, 1)) {
            return (x0, y0);
        } else if (U384.eqInteger(scalar, 2)) {
            return _twice(params.call, params.p, params.a, x0, y0);
        }

        uint256 base2X = x0;
        uint256 base2Y = y0;
        uint256 base2Z = U384.init(1);
        uint256 z1 = U384.init(1);

        uint256 highBits_;
        uint256 lowBits_;

        assembly {
            highBits_ := mload(scalar)
            lowBits_ := mload(add(scalar, 0x20))
        }

        if (lowBits_ & 1 == 0) {
            x1 = U384.init(0);
            y1 = U384.init(0);
        } else {
            x1 = U384.copy(x0);
            y1 = U384.copy(y0);
        }

        lowBits_ >>= 1;
        lowBits_ |= highBits_ << 255;
        highBits_ >>= 1;

        while (lowBits_ > 0 || highBits_ > 0) {
            (base2X, base2Y, base2Z) = _twiceProj(
                params.call,
                params.p,
                params.a,
                base2X,
                base2Y,
                base2Z
            );

            if (lowBits_ & 1 == 1) {
                (x1, y1, z1) = _addProj(
                    params.call,
                    params.p,
                    params.a,
                    base2X,
                    base2Y,
                    base2Z,
                    x1,
                    y1,
                    z1
                );
            }

            lowBits_ >>= 1;
            lowBits_ |= highBits_ << 255;
            highBits_ >>= 1;

            // console.log("gas", 300_000_000 - gasleft());
        }

        return _toAffinePoint(params.call, params.p, x1, y1, z1);
    }

    /**
     * @dev Double an elliptic curve point in projective coordinates. See
     * https://www.nayuki.io/page/elliptic-curve-point-addition-in-projective-coordinates
     */
    function _twiceProj(
        uint256 call,
        uint256 p,
        uint256 a,
        uint256 x0,
        uint256 y0,
        uint256 z0
    ) internal view returns (uint256 x1, uint256 y1, uint256 z1) {
        if (_isZeroCurve(x0, y0)) {
            return _zeroProj();
        }

        uint256 u;

        u = U384.modmul(call, y0, z0, p);
        u = U384.modshl1(call, u, p);

        x1 = U384.modmul(call, u, x0, p);
        x1 = U384.modmul(call, x1, y0, p);
        x1 = U384.modshl1(call, x1, p);

        x0 = U384.modexp(call, x0, 2, p);

        y1 = U384.modmul(call, x0, U384.init(3), p);

        z0 = U384.modexp(call, z0, 2, p);
        z0 = U384.modmul(call, z0, a, p);
        y1 = U384.modadd(call, y1, z0, p);

        z1 = U384.modexp(call, y1, 2, p);
        x0 = U384.modshl1(call, x1, p);
        z1 = U384.modadd(call, z1, U384.sub(p, x0), p);

        x0 = U384.modadd(call, x1, U384.sub(p, z1), p);
        x0 = U384.modmul(call, y1, x0, p);

        y0 = U384.modmul(call, y0, u, p);
        y0 = U384.modexp(call, y0, 2, p);
        y0 = U384.modshl1(call, y0, p);
        y1 = U384.modadd(call, x0, U384.sub(p, y0), p);

        x1 = U384.modmul(call, u, z1, p);

        z1 = U384.modexp(call, u, 2, p);
        z1 = U384.modmul(call, z1, u, p);
    }

    /**
     * @dev Add two elliptic curve points in projective coordinates. See
     * https://www.nayuki.io/page/elliptic-curve-point-addition-in-projective-coordinates
     */
    function _addProj(
        uint256 call,
        uint256 p,
        uint256 a,
        uint256 x0,
        uint256 y0,
        uint256 z0,
        uint256 x1,
        uint256 y1,
        uint256 z1
    ) internal view returns (uint256 x2, uint256 y2, uint256 z2) {
        if (_isZeroCurve(x0, y0)) {
            return (x1, y1, z1);
        } else if (_isZeroCurve(x1, y1)) {
            return (x0, y0, z0);
        }

        x2 = U384.modmul(call, y0, z1, p);
        y2 = U384.modmul(call, y1, z0, p);
        z2 = U384.modmul(call, x0, z1, p);
        y1 = U384.modmul(call, x1, z0, p);

        if (U384.eq(z2, y1)) {
            if (U384.eq(x2, y2)) {
                return _twiceProj(call, p, a, x0, y0, z0);
            } else {
                return _zeroProj();
            }
        }

        uint256 v = U384.modmul(call, z0, z1, p);

        return _addProj2(call, p, v, z2, y1, y2, x2);
    }

    /**
     * @dev Helper function that splits addProj to avoid too many local variables.
     */
    function _addProj2(
        uint256 call,
        uint256 p,
        uint256 v,
        uint256 u0,
        uint256 u1,
        uint256 t1,
        uint256 t0
    ) internal view returns (uint256 x2, uint256 y2, uint256 z2) {
        uint256 u2;
        uint256 u3;

        y2 = U384.modadd(call, t0, U384.sub(p, t1), p);
        x2 = U384.modadd(call, u0, U384.sub(p, u1), p);
        u2 = U384.modexp(call, x2, 2, p);

        z2 = U384.modexp(call, y2, 2, p);

        z2 = U384.modmul(call, z2, v, p);
        u1 = U384.modadd(call, u1, u0, p);
        u1 = U384.modmul(call, u1, u2, p);
        z2 = U384.modadd(call, z2, U384.sub(p, u1), p);

        u3 = U384.modmul(call, u2, x2, p);

        x2 = U384.modmul(call, x2, z2, p);

        u0 = U384.modmul(call, u0, u2, p);
        u0 = U384.modadd(call, u0, U384.sub(p, z2), p);
        y2 = U384.modmul(call, y2, u0, p);
        t0 = U384.modmul(call, t0, u3, p);

        y2 = U384.modadd(call, y2, U384.sub(p, t0), p);

        z2 = U384.modmul(call, u3, v, p);
    }

    /**
     * @dev Add two elliptic curve points in affine coordinates.
     */
    function _add(
        uint256 call,
        uint256 p,
        uint256 a,
        uint256 x0,
        uint256 y0,
        uint256 x1,
        uint256 y1
    ) internal view returns (uint256, uint256) {
        uint256 z0;

        (x0, y0, z0) = _addProj(call, p, a, x0, y0, U384.init(1), x1, y1, U384.init(1));

        return _toAffinePoint(call, p, x0, y0, z0);
    }

    /**
     * @dev Double an elliptic curve point in affine coordinates.
     */
    function _twice(
        uint256 call,
        uint256 p,
        uint256 a,
        uint256 x0,
        uint256 y0
    ) internal view returns (uint256, uint256) {
        uint256 z0;

        (x0, y0, z0) = _twiceProj(call, p, a, x0, y0, U384.init(1));

        return _toAffinePoint(call, p, x0, y0, z0);
    }

    /**
     * @dev Add two points in affine coordinates and return projective point.
     */
    function _addAndReturnProjectivePoint(
        uint256 call,
        uint256 p,
        uint256 a,
        uint256 x1,
        uint256 y1,
        uint256 x2,
        uint256 y2
    ) internal view returns (uint256[3] memory P) {
        uint256 x;
        uint256 y;

        (x, y) = _add(call, p, a, x1, y1, x2, y2);
        return _toProjectivePoint(call, p, x, y);
    }

    /**
     * @dev Transform from projective to affine coordinates.
     */
    function _toAffinePoint(
        uint256 call,
        uint256 p,
        uint256 x0,
        uint256 y0,
        uint256 z0
    ) internal view returns (uint256 x1, uint256 y1) {
        x1 = U384.moddiv(call, x0, z0, p);
        y1 = U384.moddiv(call, y0, z0, p);
    }

    /**
     * @dev Check if a point in affine coordinates is on the curve.
     */
    function _isOnCurve(
        uint256 call,
        uint256 p,
        uint256 a,
        uint256 b,
        uint256 x,
        uint256 y
    ) internal view returns (bool) {
        if (U384.eqInteger(x, 0) || U384.eq(x, p) || U384.eqInteger(y, 0) || U384.eq(y, p)) {
            return false;
        }

        uint256 LHS = U384.modexp(call, y, 2, p);
        uint256 RHS = U384.modexp(call, x, 3, p);

        if (!U384.eqInteger(a, 0)) {
            RHS = U384.modadd(call, RHS, U384.modmul(call, x, a, p), p); // x^3 + a*x
        }

        if (!U384.eqInteger(b, 0)) {
            RHS = U384.modadd(call, RHS, b, p); // x^3 + a*x + b
        }

        return U384.eq(LHS, RHS);
    }

    /**
     * @dev Transform affine coordinates into projective coordinates.
     */
    function _toProjectivePoint(
        uint256 call,
        uint256 p,
        uint256 x0,
        uint256 y0
    ) internal view returns (uint256[3] memory P) {
        P[2] = U384.init(1);
        P[0] = U384.modmul(call, x0, P[2], p);
        P[1] = U384.modmul(call, y0, P[2], p);
    }

    /**
     * @dev Return the zero curve in projective coordinates.
     */
    function _zeroProj() internal pure returns (uint256 x, uint256 y, uint256 z) {
        return (U384.init(0), U384.init(1), U384.init(0));
    }

    /**
     * @dev Return the zero curve in affine coordinates.
     */
    function _zeroAffine() internal pure returns (uint256 x, uint256 y) {
        return (U384.init(0), U384.init(0));
    }

    /**
     * @dev Check if the curve is the zero curve.
     */
    function _isZeroCurve(uint256 x0, uint256 y0) internal pure returns (bool isZero) {
        return U384.eqInteger(x0, 0) && U384.eqInteger(y0, 0);
    }
}
