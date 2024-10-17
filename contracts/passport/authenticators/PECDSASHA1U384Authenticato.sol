// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {SHA1} from "../../utils/SHA1.sol";
import {U384} from "../../utils/U384.sol";
import "hardhat/console.sol";

/**
 * @notice Forked from https://github.com/tdrerup/elliptic-curve-solidity/blob/master/contracts/curves/EllipticCurve.sol
 */
contract PECDSASHA1Authenticator {
    using SHA1 for bytes;
    using U384 for *;

    // brainpool256r1 parameters
    uint256 a = 0x7D5A0975FC2C3057EEF67530417AFFE7FB8055C126DC5C6CE94A4B44F330B5D9.init();
    uint256 b = 0x26DC5C6CE94A4B44F330B5D9BBD77CBF958416295CF7E1CE6BCCDC18FF8C07B6.init();
    uint256 gx = 0x8BD2AEB9CB7E57CB2C4B482FFC81B7AFB9DE27E1E3BD23C23A4453BD9ACE3262.init();
    uint256 gy = 0x547EF835C3DAC4FD97F8461A14611DC9C27745132DED8E545C1D54C72F046997.init();
    uint256 p = 0xA9FB57DBA1EEA9BC3E660A909D838D726E3BF623D52620282013481D1F6E5377.init();
    uint256 n = 0xA9FB57DBA1EEA9BC3E660A909D838D718C397AA3B561A6F7901E0E82974856A7.init();

    uint256 lowSmax = 0x54fdabedd0f754de1f3305484ec1c6b9371dfb11ea9310141009a40e8fb729bb.init();

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

        if (!_isOnCurve(x, y)) {
            return false;
        }

        uint256 message = uint256(uint160(challenge.sha1())).init();

        uint256 x1;
        uint256 x2;
        uint256 y1;
        uint256 y2;

        (x1, y1) = _multiplyScalar(gx, gy, U384.moddiv(message, s, n));
        (x2, y2) = _multiplyScalar(x, y, U384.moddiv(r, s, n));

        uint256[3] memory P = _addAndReturnProjectivePoint(x1, y1, x2, y2);

        console.logBytes32(bytes32(P[0]));
        console.logBytes32(bytes32(P[1]));
        console.logBytes32(bytes32(P[2]));

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
        uint256 x0,
        uint256 y0,
        uint256 scalar
    ) internal view returns (uint256 x1, uint256 y1) {
        if (scalar == 0) {
            return _zeroAffine();
        } else if (scalar == 1) {
            return (x0, y0);
        } else if (scalar == 2) {
            return _twice(x0, y0);
        }

        uint256 base2X = x0;
        uint256 base2Y = y0;
        uint256 base2Z = 1;
        uint256 z1 = 1;
        x1 = x0;
        y1 = y0;

        if (scalar % 2 == 0) {
            x1 = y1 = 0;
        }

        scalar = scalar >> 1;

        while (scalar > 0) {
            (base2X, base2Y, base2Z) = _twiceProj(base2X, base2Y, base2Z);

            if (scalar % 2 == 1) {
                (x1, y1, z1) = _addProj(base2X, base2Y, base2Z, x1, y1, z1);
            }

            scalar = scalar >> 1;
        }

        return _toAffinePoint(x1, y1, z1);
    }

    /**
     * @dev Double an elliptic curve point in projective coordinates. See
     * https://www.nayuki.io/page/elliptic-curve-point-addition-in-projective-coordinates
     */
    function _twiceProj(
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

        u = U384.modmul(y0, z0, p);
        u = U384.modmul(u, 2, p);

        v = U384.modmul(u, x0, p);
        v = U384.modmul(v, y0, p);
        v = U384.modmul(v, 2, p);

        x0 = U384.modmul(x0, x0, p);
        t = U384.modmul(x0, 3, p);

        z0 = U384.modmul(z0, z0, p);
        z0 = U384.modmul(z0, a, p);
        t = U384.modadd(t, z0, p);

        w = U384.modmul(t, t, p);
        x0 = U384.modmul(2, v, p);
        w = U384.modadd(w, p - x0, p);

        x0 = U384.modadd(v, p - w, p);
        x0 = U384.modmul(t, x0, p);
        y0 = U384.modmul(y0, u, p);
        y0 = U384.modmul(y0, y0, p);
        y0 = U384.modmul(2, y0, p);
        y1 = U384.modadd(x0, p - y0, p);

        x1 = U384.modmul(u, w, p);

        z1 = U384.modmul(u, u, p);
        z1 = U384.modmul(z1, u, p);
    }

    /**
     * @dev Add two elliptic curve points in projective coordinates. See
     * https://www.nayuki.io/page/elliptic-curve-point-addition-in-projective-coordinates
     */
    function _addProj(
        uint256 x0,
        uint256 y0,
        uint256 z0,
        uint256 x1,
        uint256 y1,
        uint256 z1
    ) internal view returns (uint256 x2, uint256 y2, uint256 z2) {
        uint256 t0;
        uint256 t1;
        uint256 u0;
        uint256 u1;

        if (_isZeroCurve(x0, y0)) {
            return (x1, y1, z1);
        } else if (_isZeroCurve(x1, y1)) {
            return (x0, y0, z0);
        }

        t0 = U384.modmul(y0, z1, p);
        t1 = U384.modmul(y1, z0, p);

        u0 = U384.modmul(x0, z1, p);
        u1 = U384.modmul(x1, z0, p);

        if (u0 == u1) {
            if (t0 == t1) {
                return _twiceProj(x0, y0, z0);
            } else {
                return _zeroProj();
            }
        }

        (x2, y2, z2) = _addProj2(U384.modmul(z0, z1, p), u0, u1, t1, t0);
    }

    /**
     * @dev Helper function that splits addProj to avoid too many local variables.
     */
    function _addProj2(
        uint256 v,
        uint256 u0,
        uint256 u1,
        uint256 t1,
        uint256 t0
    ) internal view returns (uint256 x2, uint256 y2, uint256 z2) {
        uint256 u;
        uint256 u2;
        uint256 u3;
        uint256 w;
        uint256 t;

        t = U384.modadd(t0, p - t1, p);
        u = U384.modadd(u0, p - u1, p);

        //u2 = U384.modmul(u, u, p);
        u2 = U384.modexp(u, 2, p);

        //w = U384.modmul(t, t, p);
        w = U384.modexp(t, 2, p);

        w = U384.modmul(w, v, p);
        u1 = U384.modadd(u1, u0, p);
        u1 = U384.modmul(u1, u2, p);
        w = U384.modadd(w, p - u1, p);

        x2 = U384.modmul(u, w, p);

        u3 = U384.modmul(u2, u, p);
        u0 = U384.modmul(u0, u2, p);
        u0 = U384.modadd(u0, p - w, p);
        t = U384.modmul(t, u0, p);
        t0 = U384.modmul(t0, u3, p);

        y2 = U384.modadd(t, p - t0, p);

        z2 = U384.modmul(u3, v, p);
    }

    /**
     * @dev Add two elliptic curve points in affine coordinates.
     */
    function _add(
        uint256 x0,
        uint256 y0,
        uint256 x1,
        uint256 y1
    ) internal view returns (uint256, uint256) {
        uint256 z0;

        (x0, y0, z0) = _addProj(x0, y0, 1, x1, y1, 1);

        return _toAffinePoint(x0, y0, z0);
    }

    /**
     * @dev Double an elliptic curve point in affine coordinates.
     */
    function _twice(uint256 x0, uint256 y0) internal view returns (uint256, uint256) {
        uint256 z0;

        (x0, y0, z0) = _twiceProj(x0, y0, 1);

        return _toAffinePoint(x0, y0, z0);
    }

    /**
     * @dev Add two points in affine coordinates and return projective point.
     */
    function _addAndReturnProjectivePoint(
        uint256 x1,
        uint256 y1,
        uint256 x2,
        uint256 y2
    ) internal view returns (uint256[3] memory P) {
        uint256 x;
        uint256 y;

        (x, y) = _add(x1, y1, x2, y2);
        P = _toProjectivePoint(x, y);
    }

    /**
     * @dev Transform from projective to affine coordinates.
     */
    function _toAffinePoint(
        uint256 x0,
        uint256 y0,
        uint256 z0
    ) internal view returns (uint256 x1, uint256 y1) {
        x1 = U384.moddiv(x0, z0, p);
        y1 = U384.moddiv(y0, z0, p);
    }

    /**
     * @dev Check if a point in affine coordinates is on the curve.
     */
    function _isOnCurve(uint256 x, uint256 y) internal view returns (bool) {
        // if (0 == x || x == p || 0 == y || y == p) {
        //     return false;
        // }

        //uint256 LHS = U384.modmul(y, y, p); // y^2 --> modexp(y, 2, p)
        uint256 LHS = U384.modexp(y, 2, p);
        //uint256 RHS = U384.modmul(U384.modmul(x, x, p), x, p); // x^3 --> modexp(x, 3, p)
        uint256 RHS = U384.modexp(x, 3, p);

        if (a != 0) {
            RHS = U384.modadd(RHS, U384.modmul(x, a, p), p); // x^3 + a*x
        }

        if (b != 0) {
            RHS = U384.modadd(RHS, b, p); // x^3 + a*x + b
        }

        return LHS == RHS;
    }

    /**
     * @dev Transform affine coordinates into projective coordinates.
     */
    function _toProjectivePoint(
        uint256 x0,
        uint256 y0
    ) internal view returns (uint256[3] memory P) {
        P[2] = U384.modadd(0, 1, p);
        P[0] = U384.modmul(x0, P[2], p);
        P[1] = U384.modmul(y0, P[2], p);
    }

    /**
     * @dev Return the zero curve in projective coordinates.
     */
    function _zeroProj() internal pure returns (uint256 x, uint256 y, uint256 z) {
        return (0.init(), 1.init(), 0.init());
    }

    /**
     * @dev Return the zero curve in affine coordinates.
     */
    function _zeroAffine() internal pure returns (uint256 x, uint256 y) {
        return (0.init(), 0.init());
    }

    /**
     * @dev Check if the curve is the zero curve.
     */
    function _isZeroCurve(uint256 x0, uint256 y0) internal pure returns (bool isZero) {
        if (x0 == 0 && y0 == 0) {
            return true;
        }

        return false;
    }
}
