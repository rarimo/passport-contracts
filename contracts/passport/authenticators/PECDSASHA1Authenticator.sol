// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {SHA1} from "../../utils/SHA1.sol";

/**
 * @notice Forked from https://github.com/tdrerup/elliptic-curve-solidity/blob/master/contracts/curves/EllipticCurve.sol
 */
contract PECDSASHA1Authenticator {
    using SHA1 for bytes;

    // brainpool256r1 parameters
    uint256 private constant A =
        0x7D5A0975FC2C3057EEF67530417AFFE7FB8055C126DC5C6CE94A4B44F330B5D9;
    uint256 private constant B =
        0x26DC5C6CE94A4B44F330B5D9BBD77CBF958416295CF7E1CE6BCCDC18FF8C07B6;
    uint256 private constant GX =
        0x8BD2AEB9CB7E57CB2C4B482FFC81B7AFB9DE27E1E3BD23C23A4453BD9ACE3262;
    uint256 private constant GY =
        0x547EF835C3DAC4FD97F8461A14611DC9C27745132DED8E545C1D54C72F046997;
    uint256 private constant _P =
        0xA9FB57DBA1EEA9BC3E660A909D838D726E3BF623D52620282013481D1F6E5377;
    uint256 private constant N =
        0xA9FB57DBA1EEA9BC3E660A909D838D718C397AA3B561A6F7901E0E82974856A7;

    uint256 private constant LOW_SMAX =
        0x54fdabedd0f754de1f3305484ec1c6b9371dfb11ea9310141009a40e8fb729bb;

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
    ) external pure returns (bool) {
        /// @dev accept s only from the lower part of the curve
        if (r == 0 || r >= N || s == 0 || s > LOW_SMAX) {
            return false;
        }

        if (!_isOnCurve(x, y)) {
            return false;
        }

        uint256 message = uint256(uint160(challenge.sha1()));

        uint256 x1;
        uint256 x2;
        uint256 y1;
        uint256 y2;

        uint256 sInv = _inverseMod(s, N);

        (x1, y1) = _multiplyScalar(GX, GY, mulmod(message, sInv, N));
        (x2, y2) = _multiplyScalar(x, y, mulmod(r, sInv, N));

        uint256[3] memory P = _addAndReturnProjectivePoint(x1, y1, x2, y2);

        if (P[2] == 0) {
            return false;
        }

        uint256 Px = _inverseMod(P[2], _P);
        Px = mulmod(P[0], mulmod(Px, Px, _P), _P);

        return Px % N == r;
    }

    /**
     * @dev Inverse of u in the field of modulo m.
     */
    function _inverseMod(uint256 u, uint256 m) internal pure returns (uint256) {
        if (u == 0 || u == m || m == 0) {
            return 0;
        }

        if (u > m) {
            u = u % m;
        }

        int256 t1;
        int256 t2 = 1;
        uint256 r1 = m;
        uint256 r2 = u;
        uint256 q;

        while (r2 != 0) {
            q = r1 / r2;
            unchecked {
                (t1, t2, r1, r2) = (t2, t1 - int256(q) * t2, r2, r1 - q * r2);
            }
        }

        if (t1 < 0) {
            unchecked {
                return (m - uint256(-t1));
            }
        }

        return uint256(t1);
    }

    /**
     * @dev Multiply an elliptic curve point by a scalar.
     */
    function _multiplyScalar(
        uint256 x0,
        uint256 y0,
        uint256 scalar
    ) internal pure returns (uint256 x1, uint256 y1) {
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
    ) internal pure returns (uint256 x1, uint256 y1, uint256 z1) {
        uint256 t;
        uint256 u;
        uint256 v;
        uint256 w;

        if (_isZeroCurve(x0, y0)) {
            return _zeroProj();
        }

        u = mulmod(y0, z0, _P);
        u = mulmod(u, 2, _P);

        v = mulmod(u, x0, _P);
        v = mulmod(v, y0, _P);
        v = mulmod(v, 2, _P);

        x0 = mulmod(x0, x0, _P);
        t = mulmod(x0, 3, _P);

        z0 = mulmod(z0, z0, _P);
        z0 = mulmod(z0, A, _P);
        t = addmod(t, z0, _P);

        w = mulmod(t, t, _P);
        x0 = mulmod(2, v, _P);
        w = addmod(w, _P - x0, _P);

        x0 = addmod(v, _P - w, _P);
        x0 = mulmod(t, x0, _P);
        y0 = mulmod(y0, u, _P);
        y0 = mulmod(y0, y0, _P);
        y0 = mulmod(2, y0, _P);
        y1 = addmod(x0, _P - y0, _P);

        x1 = mulmod(u, w, _P);

        z1 = mulmod(u, u, _P);
        z1 = mulmod(z1, u, _P);
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
    ) internal pure returns (uint256 x2, uint256 y2, uint256 z2) {
        uint256 t0;
        uint256 t1;
        uint256 u0;
        uint256 u1;

        if (_isZeroCurve(x0, y0)) {
            return (x1, y1, z1);
        } else if (_isZeroCurve(x1, y1)) {
            return (x0, y0, z0);
        }

        t0 = mulmod(y0, z1, _P);
        t1 = mulmod(y1, z0, _P);

        u0 = mulmod(x0, z1, _P);
        u1 = mulmod(x1, z0, _P);

        if (u0 == u1) {
            if (t0 == t1) {
                return _twiceProj(x0, y0, z0);
            } else {
                return _zeroProj();
            }
        }

        (x2, y2, z2) = _addProj2(mulmod(z0, z1, _P), u0, u1, t1, t0);
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
    ) internal pure returns (uint256 x2, uint256 y2, uint256 z2) {
        uint256 u;
        uint256 u2;
        uint256 u3;
        uint256 w;
        uint256 t;

        unchecked {
            t = addmod(t0, _P - t1, _P);
            u = addmod(u0, _P - u1, _P);
            u2 = mulmod(u, u, _P);

            w = mulmod(t, t, _P);
            w = mulmod(w, v, _P);
            u1 = addmod(u1, u0, _P);
            u1 = mulmod(u1, u2, _P);
            w = addmod(w, _P - u1, _P);

            x2 = mulmod(u, w, _P);

            u3 = mulmod(u2, u, _P);
            u0 = mulmod(u0, u2, _P);
            u0 = addmod(u0, _P - w, _P);
            t = mulmod(t, u0, _P);
            t0 = mulmod(t0, u3, _P);

            y2 = addmod(t, _P - t0, _P);

            z2 = mulmod(u3, v, _P);
        }
    }

    /**
     * @dev Add two elliptic curve points in affine coordinates.
     */
    function _add(
        uint256 x0,
        uint256 y0,
        uint256 x1,
        uint256 y1
    ) internal pure returns (uint256, uint256) {
        uint256 z0;

        (x0, y0, z0) = _addProj(x0, y0, 1, x1, y1, 1);

        return _toAffinePoint(x0, y0, z0);
    }

    /**
     * @dev Double an elliptic curve point in affine coordinates.
     */
    function _twice(uint256 x0, uint256 y0) internal pure returns (uint256, uint256) {
        uint256 z0;

        (x0, y0, z0) = _twiceProj(x0, y0, 1);

        return _toAffinePoint(x0, y0, z0);
    }

    /**
     * @dev Multiply an elliptic curve point by a 2 power base (i.e., (2^exp)*P)).
     */
    function _multiplyPowerBase2(
        uint256 x0,
        uint256 y0,
        uint256 exp
    ) internal pure returns (uint256, uint256) {
        uint256 base2X = x0;
        uint256 base2Y = y0;
        uint256 base2Z = 1;

        for (uint256 i = 0; i < exp; i++) {
            (base2X, base2Y, base2Z) = _twiceProj(base2X, base2Y, base2Z);
        }

        return _toAffinePoint(base2X, base2Y, base2Z);
    }

    /**
     * @dev Add two points in affine coordinates and return projective point.
     */
    function _addAndReturnProjectivePoint(
        uint256 x1,
        uint256 y1,
        uint256 x2,
        uint256 y2
    ) internal pure returns (uint256[3] memory P) {
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
    ) internal pure returns (uint256 x1, uint256 y1) {
        uint256 z0Inv;

        z0Inv = _inverseMod(z0, _P);
        x1 = mulmod(x0, z0Inv, _P);
        y1 = mulmod(y0, z0Inv, _P);
    }

    /**
     * @dev Check if a point in affine coordinates is on the curve.
     */
    function _isOnCurve(uint256 x, uint256 y) internal pure returns (bool) {
        if (0 == x || x == _P || 0 == y || y == _P) {
            return false;
        }

        uint256 LHS = mulmod(y, y, _P); // y^2
        uint256 RHS = mulmod(mulmod(x, x, _P), x, _P); // x^3

        if (A != 0) {
            RHS = addmod(RHS, mulmod(x, A, _P), _P); // x^3 + a*x
        }

        if (B != 0) {
            RHS = addmod(RHS, B, _P); // x^3 + a*x + b
        }

        return LHS == RHS;
    }

    /**
     * @dev Transform affine coordinates into projective coordinates.
     */
    function _toProjectivePoint(
        uint256 x0,
        uint256 y0
    ) internal pure returns (uint256[3] memory P) {
        P[2] = addmod(0, 1, _P);
        P[0] = mulmod(x0, P[2], _P);
        P[1] = mulmod(y0, P[2], _P);
    }

    /**
     * @dev Return the zero curve in projective coordinates.
     */
    function _zeroProj() internal pure returns (uint256 x, uint256 y, uint256 z) {
        return (0, 0, 1);
    }

    /**
     * @dev Return the zero curve in affine coordinates.
     */
    function _zeroAffine() internal pure returns (uint256 x, uint256 y) {
        return (0, 0);
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
