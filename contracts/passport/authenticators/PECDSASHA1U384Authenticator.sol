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
    }

    struct Inputs {
        bytes challenge;
        bytes r;
        bytes s;
        bytes x;
        bytes y;
    }

    /**
     * @notice Checks active authentication of a passport. ECDSA active authentication is an ECDSA signature of
     * raw SHA1 hash of challenge bytes. Usually brainpool256r1 elliptic curve is used.
     */
    function authenticate(
        bytes memory challenge,
        uint256 r,
        uint256 s,
        uint256 x,
        uint256 y
    ) external view returns (bool) {
        /// @dev accept s only from the lower part of the curve
        // if (r == 0 || r >= n || s == 0 || s > lowSmax) {
        //     return false;
        // }

        r = U384.init(r);
        s = U384.init(s);
        x = U384.init(x);
        y = U384.init(y);

        // brainpool256r1 parameters
        Parameters memory params = Parameters({
            a: 0x7D5A0975FC2C3057EEF67530417AFFE7FB8055C126DC5C6CE94A4B44F330B5D9.init(),
            b: 0x26DC5C6CE94A4B44F330B5D9BBD77CBF958416295CF7E1CE6BCCDC18FF8C07B6.init(),
            gx: 0x8BD2AEB9CB7E57CB2C4B482FFC81B7AFB9DE27E1E3BD23C23A4453BD9ACE3262.init(),
            gy: 0x547EF835C3DAC4FD97F8461A14611DC9C27745132DED8E545C1D54C72F046997.init(),
            p: 0xA9FB57DBA1EEA9BC3E660A909D838D726E3BF623D52620282013481D1F6E5377.init(),
            n: 0xA9FB57DBA1EEA9BC3E660A909D838D718C397AA3B561A6F7901E0E82974856A7.init(),
            lowSmax: 0x54fdabedd0f754de1f3305484ec1c6b9371dfb11ea9310141009a40e8fb729bb.init()
        });

        if (!_isOnCurve(params, x, y)) {
            return false;
        }

        uint256 message = uint256(uint160(challenge.sha1())).init();

        (uint256 x1, uint256 y1) = _multiplyScalar(params, params.gx, params.gy, U384.moddiv(message, s, params.n));
        console.log("x1y1");
        console.logBytes(U384.toBytes(x1));
        console.logBytes(U384.toBytes(y1));

        (uint256 x2, uint256 y2) = _multiplyScalar(params, x, y, U384.moddiv(r, s, params.n));
        console.log("x2y2");
        console.logBytes(U384.toBytes(x2));
        console.logBytes(U384.toBytes(y2));

        uint256[3] memory P = _addAndReturnProjectivePoint(params, x1, y1, x2, y2);

        console.logBytes(P[0].toBytes());
        console.logBytes(P[1].toBytes());
        console.logBytes(P[2].toBytes());

        // if (P[2] == 0) {
        //     return false;
        // }

        // uint256 Px = _inverseMod(P[2], p);
        // Px = U384.modmul(P[0], U384.modmul(Px, Px, p), p);

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
        if (U384.cmpInteger(scalar, 0) == 0) {
            return _zeroAffine();
        } else if (U384.cmpInteger(scalar, 1) == 0) {
            return (x0, y0);
        } else if (U384.cmpInteger(scalar, 2) == 0) {
            return _twice(params, x0, y0);
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

        if (lowBits_ % 2 == 0) {
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
            (base2X, base2Y, base2Z) = _twiceProj(params, base2X, base2Y, base2Z);

            if (lowBits_ % 2 == 1) {
                (x1, y1, z1) = _addProj(params, base2X, base2Y, base2Z, x1, y1, z1);
            }

            lowBits_ >>= 1;
            lowBits_ |= highBits_ << 255;
            highBits_ >>= 1;

            //console.log("gas", 300_000_000 - gasleft());
        }

        return _toAffinePoint(params, x1, y1, z1);
    }

    /**
     * @dev Double an elliptic curve point in projective coordinates. See
     * https://www.nayuki.io/page/elliptic-curve-point-addition-in-projective-coordinates
     */
    function _twiceProj(
        Parameters memory params,
        uint256 x0,
        uint256 y0,
        uint256 z0
    ) internal view returns (uint256 x1, uint256 y1, uint256 z1) {
        uint256 t;
        uint256 u;
        uint256 v;
        uint256 w;

        if (_isZeroCurve(x0, y0)) {
            return _zeroProj();
        }

        uint256 two = U384.init(2);
        uint256 three = U384.init(3);

        u = U384.modmul(y0, z0, params.p);
        u = U384.modmul(u, two, params.p);

        v = U384.modmul(u, x0, params.p);
        v = U384.modmul(v, y0, params.p);
        v = U384.modmul(v, two, params.p);

        x0 = U384.modmul(x0, x0, params.p);
        t = U384.modmul(x0, three, params.p);

        z0 = U384.modmul(z0, z0, params.p);
        z0 = U384.modmul(z0, params.a, params.p);
        t = U384.modadd(t, z0, params.p);

        w = U384.modmul(t, t, params.p);
        x0 = U384.modmul(two, v, params.p);
        w = U384.modadd(w, U384.sub(params.p, x0), params.p);

        x0 = U384.modadd(v, U384.sub(params.p, w), params.p);
        x0 = U384.modmul(t, x0, params.p);
        y0 = U384.modmul(y0, u, params.p);
        y0 = U384.modmul(y0, y0, params.p);
        y0 = U384.modmul(two, y0, params.p);
        y1 = U384.modadd(x0, U384.sub(params.p, y0), params.p);

        x1 = U384.modmul(u, w, params.p);

        z1 = U384.modmul(u, u, params.p);
        z1 = U384.modmul(z1, u, params.p);
    }

    struct UT {
        uint256 u0;
        uint256 u1;
        uint256 t0;
        uint256 t1;
    }

    /**
     * @dev Add two elliptic curve points in projective coordinates. See
     * https://www.nayuki.io/page/elliptic-curve-point-addition-in-projective-coordinates
     */
    function _addProj(
        Parameters memory params,
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

        UT memory ut;

        ut.t0 = U384.modmul(y0, z1, params.p);
        ut.t1 = U384.modmul(y1, z0, params.p);
        ut.u0 = U384.modmul(x0, z1, params.p);
        ut.u1 = U384.modmul(x1, z0, params.p);

        if (U384.cmp(ut.u0, ut.u1) == 0) {
            if (U384.cmp(ut.t0, ut.t1) == 0) {
                return _twiceProj(params, x0, y0, z0);
            } else {
                return _zeroProj();
            }
        }

        (x2, y2, z2) = _addProj2(params, U384.modmul(z0, z1, params.p), ut.u0, ut.u1, ut.t1, ut.t0);
    }

    struct UTW {
        uint256 u;
        uint256 u2;
        uint256 u3;
        uint256 w;
        uint256 t;
    }

    /**
     * @dev Helper function that splits addProj to avoid too many local variables.
     */
    function _addProj2(
        Parameters memory params,
        uint256 v,
        uint256 u0,
        uint256 u1,
        uint256 t1,
        uint256 t0
    ) internal view returns (uint256 x2, uint256 y2, uint256 z2) {
        UTW memory utw;

        utw.t = U384.modadd(t0, U384.sub(params.p, t1), params.p);
        utw.u = U384.modadd(u0, U384.sub(params.p, u1), params.p);

        //u2 = U384.modmul(u, u, p);
        utw.u2 = U384.modexp(utw.u, 2, params.p);

        //w = U384.modmul(t, t, p);
        utw.w = U384.modexp(utw.t, 2, params.p);

        utw.w = U384.modmul(utw.w, v, params.p);
        u1 = U384.modadd(u1, u0, params.p);
        u1 = U384.modmul(u1, utw.u2, params.p);
        utw.w = U384.modadd(utw.w, U384.sub(params.p, u1), params.p);

        x2 = U384.modmul(utw.u, utw.w, params.p);

        utw.u3 = U384.modmul(utw.u2, utw.u, params.p);
        u0 = U384.modmul(u0, utw.u2, params.p);
        u0 = U384.modadd(u0, U384.sub(params.p, utw.w), params.p);
        utw.t = U384.modmul(utw.t, u0, params.p);
        t0 = U384.modmul(t0, utw.u3, params.p);

        y2 = U384.modadd(utw.t, U384.sub(params.p, t0), params.p);

        z2 = U384.modmul(utw.u3, v, params.p);
    }

    /**
     * @dev Add two elliptic curve points in affine coordinates.
     */
    function _add(
        Parameters memory params,
        uint256 x0,
        uint256 y0,
        uint256 x1,
        uint256 y1
    ) internal view returns (uint256, uint256) {
        uint256 z0;

        (x0, y0, z0) = _addProj(params, x0, y0, U384.init(1), x1, y1, U384.init(1));

        return _toAffinePoint(params,x0, y0, z0);
    }

    /**
     * @dev Double an elliptic curve point in affine coordinates.
     */
    function _twice(Parameters memory params, uint256 x0, uint256 y0) internal view returns (uint256, uint256) {
        uint256 z0;

        (x0, y0, z0) = _twiceProj(params, x0, y0, U384.init(1));

        return _toAffinePoint(params,x0, y0, z0);
    }

    /**
     * @dev Add two points in affine coordinates and return projective point.
     */
    function _addAndReturnProjectivePoint(
        Parameters memory params,
        uint256 x1,
        uint256 y1,
        uint256 x2,
        uint256 y2
    ) internal view returns (uint256[3] memory P) {
        uint256 x;
        uint256 y;

        (x, y) = _add(params, x1, y1, x2, y2);
        P = _toProjectivePoint(params,x, y);
    }

    /**
     * @dev Transform from projective to affine coordinates.
     */
    function _toAffinePoint(
        Parameters memory params,
        uint256 x0,
        uint256 y0,
        uint256 z0
    ) internal view returns (uint256 x1, uint256 y1) {
        x1 = U384.moddiv(x0, z0, params.p);
        y1 = U384.moddiv(y0, z0, params.p);
    }

    /**
     * @dev Check if a point in affine coordinates is on the curve.
     */
    function _isOnCurve(Parameters memory params, uint256 x, uint256 y) internal view returns (bool) {
         if (
             U384.cmpInteger(x, 0) == 0 ||
             U384.cmp(x, params.p) == 0 ||
             U384.cmpInteger(y, 0) == 0 ||
             U384.cmp(y, params.p) == 0
         ) {
             return false;
         }

        //uint256 LHS = U384.modmul(y, y, p); // y^2 --> modexp(y, 2, p)
        uint256 LHS = U384.modexp(y, 2, params.p);
        //uint256 RHS = U384.modmul(U384.modmul(x, x, p), x, p); // x^3 --> modexp(x, 3, p)
        uint256 RHS = U384.modexp(x, 3, params.p);

        if (U384.cmpInteger(params.a, 0) != 0) {
            RHS = U384.modadd(RHS, U384.modmul(x, params.a, params.p), params.p); // x^3 + a*x
        }

        if (U384.cmpInteger(params.b, 0) != 0) {
            RHS = U384.modadd(RHS, params.b, params.p); // x^3 + a*x + b
        }

        return U384.cmp(LHS, RHS) == 0;
    }

    /**
     * @dev Transform affine coordinates into projective coordinates.
     */
    function _toProjectivePoint(
        Parameters memory params,
        uint256 x0,
        uint256 y0
    ) internal view returns (uint256[3] memory P) {
        P[2] = U384.modadd(U384.init(0), U384.init(1), params.p);
        P[0] = U384.modmul(x0, P[2], params.p);
        P[1] = U384.modmul(y0, P[2], params.p);
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
        return U384.cmpInteger(x0, 0) == 0 && U384.cmpInteger(y0, 0) == 0;
    }
}
