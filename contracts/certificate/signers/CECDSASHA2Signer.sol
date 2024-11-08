// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {ICertificateSigner} from "../../interfaces/signers/ICertificateSigner.sol";

import {U384} from "../../utils/U384.sol";

/**
 * @notice Forked from https://github.com/tdrerup/elliptic-curve-solidity/blob/master/contracts/curves/EllipticCurve.sol
 */
contract CECDSASHA2Signer is ICertificateSigner, Initializable {
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
        uint256 three;
    }

    struct Inputs {
        uint256 r;
        uint256 s;
        uint256 x;
        uint256 y;
    }

    struct GH {
        uint256 gx;
        uint256 gy;
        uint256 hx;
        uint256 hy;
    }

    function __CECDSASHA2Signer_init() external initializer {}

    function verifyICAOSignature(
        bytes memory x509SignedAttributes_,
        bytes memory icaoMemberSignature_,
        bytes memory icaoMemberKey_
    ) external view returns (bool) {
        unchecked {
            Inputs memory inputs;

            (inputs.r, inputs.s) = U384.init2(icaoMemberSignature_);
            (inputs.x, inputs.y) = U384.init2(icaoMemberKey_);

            uint256 p = hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFF"
                    .init();

            // secp384r1 parameters
            Parameters memory params = Parameters({
                a: hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFC"
                    .init(),
                b: hex"B3312FA7E23EE7E4988E056BE3F82D19181D9C6EFE8141120314088F5013875AC656398D8A2ED19D2A85C8EDD3EC2AEF"
                    .init(),
                gx: hex"aa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7"
                    .init(),
                gy: hex"3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f"
                    .init(),
                p: p,
                n: hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973"
                    .init(),
                lowSmax: hex"7fffffffffffffffffffffffffffffffffffffffffffffffe3b1a6c0fa1b96efac0d06d9245853bd76760cb5666294b9"
                    .init(),
                call: U384.initCall(p),
                three: U384.init(3)
            });

            /// @dev accept s only from the lower part of the curve
            if (
                U384.eqInteger(inputs.r, 0) ||
                U384.cmp(inputs.r, params.n) >= 0 ||
                U384.eqInteger(inputs.s, 0) ||
                U384.cmp(inputs.s, params.lowSmax) > 0
            ) {
                return false;
            }

            if (!_isOnCurve(params.call, params.p, params.a, params.b, inputs.x, inputs.y)) {
                return false;
            }

            uint256 message = uint256(sha256(x509SignedAttributes_)).init();
            uint256 scalar1 = U384.moddiv(params.call, message, inputs.s, params.n);
            uint256 scalar2 = U384.moddiv(params.call, inputs.r, inputs.s, params.n);

            (uint256 x, , uint256 z) = _doubleScalarMultiplication(
                params,
                GH(params.gx, params.gy, inputs.x, inputs.y),
                scalar1,
                scalar2
            );

            return U384.eq(U384.moddiv(params.call, x, z, params.p), inputs.r);
        }
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
        unchecked {
            if (U384.eqInteger(x, 0) || U384.eq(x, p) || U384.eqInteger(y, 0) || U384.eq(y, p)) {
                return false;
            }

            uint256 LHS = U384.modexp(call, y, 2);
            uint256 RHS = U384.modexp(call, x, 3);

            if (!U384.eqInteger(a, 0)) {
                RHS = U384.modadd(RHS, U384.modmul(call, x, a), p); // x^3 + a*x
            }

            if (!U384.eqInteger(b, 0)) {
                RHS = U384.modadd(RHS, b, p); // x^3 + a*x + b
            }

            return U384.eq(LHS, RHS);
        }
    }

    /**
     * @dev Compute the double scalar multiplication scalar1*G + scalar2*H.
     */
    function _doubleScalarMultiplication(
        Parameters memory params,
        GH memory gh,
        uint256 scalar1,
        uint256 scalar2
    ) internal view returns (uint256 x, uint256 y, uint256 z) {
        unchecked {
            /// We use 4-bit masks where the first 2 bits refer to `scalar1` and the last 2 bits refer to `scalar2`.
            uint256[3][16] memory points = _precomputePointsTable(
                params.call,
                params.p,
                params.three,
                params.a,
                gh
            );

            uint256 scalar1Bits_;
            uint256 scalar2Bits_;

            assembly {
                scalar1Bits_ := mload(scalar1)
                scalar2Bits_ := mload(scalar2)
            }

            x = U384.init(0);
            y = U384.init(0);
            z = U384.init(1);

            for (uint256 word = 2; word <= 184; word += 2) {
                (x, y, z) = _twiceProj(params.call, params.p, params.three, params.a, x, y, z);
                (x, y, z) = _twiceProj(params.call, params.p, params.three, params.a, x, y, z);

                uint256 mask = (((scalar1Bits_ >> (184 - word)) & 0x03) << 2) |
                    ((scalar2Bits_ >> (184 - word)) & 0x03);

                if (mask != 0) {
                    (x, y, z) = _addProj(
                        params.call,
                        params.p,
                        params.three,
                        params.a,
                        points[mask][0],
                        points[mask][1],
                        points[mask][2],
                        x,
                        y,
                        z
                    );
                }
            }

            assembly {
                scalar1Bits_ := mload(add(scalar1, 0x20))
                scalar2Bits_ := mload(add(scalar2, 0x20))
            }

            for (uint256 word = 2; word <= 256; word += 2) {
                (x, y, z) = _twiceProj(params.call, params.p, params.three, params.a, x, y, z);
                (x, y, z) = _twiceProj(params.call, params.p, params.three, params.a, x, y, z);

                uint256 mask = (((scalar1Bits_ >> (256 - word)) & 0x03) << 2) |
                    ((scalar2Bits_ >> (256 - word)) & 0x03);

                if (mask != 0) {
                    (x, y, z) = _addProj(
                        params.call,
                        params.p,
                        params.three,
                        params.a,
                        points[mask][0],
                        points[mask][1],
                        points[mask][2],
                        x,
                        y,
                        z
                    );
                }
            }

            return (x, y, z);
        }
    }

    /**
     * @dev Double an elliptic curve point in projective coordinates. See
     * https://www.nayuki.io/page/elliptic-curve-point-addition-in-projective-coordinates
     */
    function _twiceProj(
        uint256 call,
        uint256 p,
        uint256 three,
        uint256 a,
        uint256 x0,
        uint256 y0,
        uint256 z0
    ) internal view returns (uint256 x1, uint256 y1, uint256 z1) {
        unchecked {
            if (U384.eqInteger(x0, 0) && U384.eqInteger(y0, 0)) {
                return (U384.init(0), U384.init(0), U384.init(1)); // zero proj
            }

            uint256 u = U384.modmul(call, y0, z0);
            U384.modshl1Assign(u, p);

            x1 = U384.modmul(call, u, x0);
            U384.modmulAssign(call, x1, y0);
            U384.modshl1Assign(x1, p);

            x0 = U384.modexp(call, x0, 2);

            y1 = U384.modmul(call, x0, three);

            z0 = U384.modexp(call, z0, 2);
            U384.modmulAssign(call, z0, a);
            U384.modaddAssign(y1, z0, p);

            z1 = U384.modexp(call, y1, 2);
            U384.modshl1AssignTo(x0, x1, p);

            uint256 diff = U384.sub(p, x0);
            U384.modaddAssign(z1, diff, p);

            U384.subAssignTo(diff, p, z1);
            U384.modaddAssignTo(x0, x1, diff, p);
            U384.modmulAssign(call, x0, y1);

            y0 = U384.modmul(call, y0, u);
            U384.modexpAssign(call, y0, 2);
            U384.modshl1Assign(y0, p);

            U384.subAssignTo(diff, p, y0);
            U384.modaddAssignTo(y1, x0, diff, p);

            U384.modmulAssignTo(call, x1, u, z1);

            U384.modexpAssignTo(call, z1, u, 2);
            U384.modmulAssign(call, z1, u);
        }
    }

    /**
     * @dev Add two elliptic curve points in projective coordinates. See
     * https://www.nayuki.io/page/elliptic-curve-point-addition-in-projective-coordinates
     */
    function _addProj(
        uint256 call,
        uint256 p,
        uint256 three,
        uint256 a,
        uint256 x0,
        uint256 y0,
        uint256 z0,
        uint256 x1,
        uint256 y1,
        uint256 z1
    ) internal view returns (uint256 x2, uint256 y2, uint256 z2) {
        unchecked {
            if (U384.eqInteger(x0, 0) && U384.eqInteger(y0, 0)) {
                return (x1.copy(), y1.copy(), z1.copy());
            } else if (U384.eqInteger(x1, 0) && U384.eqInteger(y1, 0)) {
                return (x0.copy(), y0.copy(), z0.copy());
            }

            x2 = U384.modmul(call, y0, z1);
            y2 = U384.modmul(call, y1, z0);
            z2 = U384.modmul(call, x0, z1);
            y1 = U384.modmul(call, x1, z0);

            if (U384.eq(z2, y1)) {
                if (U384.eq(x2, y2)) {
                    return _twiceProj(call, p, three, a, x0, y0, z0);
                } else {
                    return (U384.init(0), U384.init(0), U384.init(1)); // zero proj
                }
            }

            a = U384.modmul(call, z0, z1);

            return _addProj2(call, a, z2, p, y1, y2, x2);
        }
    }

    /**
     * @dev Helper function that splits addProj to avoid too many local variables.
     */
    function _addProj2(
        uint256 call,
        uint256 v,
        uint256 u0,
        uint256 p,
        uint256 u1,
        uint256 t1,
        uint256 t0
    ) internal view returns (uint256 x2, uint256 y2, uint256 z2) {
        unchecked {
            uint256 diff = U384.sub(p, t1);
            y2 = U384.modadd(t0, diff, p);

            U384.subAssignTo(diff, p, u1);
            x2 = U384.modadd(u0, diff, p);
            uint256 u2 = U384.modexp(call, x2, 2);

            z2 = U384.modexp(call, y2, 2);

            U384.modmulAssign(call, z2, v);
            u1 = U384.modadd(u1, u0, p);
            U384.modmulAssign(call, u1, u2);
            U384.subAssignTo(diff, p, u1);
            U384.modaddAssign(z2, diff, p);

            uint256 u3 = U384.modmul(call, u2, x2);

            U384.modmulAssign(call, x2, z2);

            u0 = U384.modmul(call, u0, u2);

            U384.subAssignTo(diff, p, z2);
            U384.modaddAssign(u0, diff, p);
            U384.modmulAssign(call, y2, u0);
            t0 = U384.modmul(call, t0, u3);

            U384.subAssignTo(diff, p, t0);
            U384.modaddAssign(y2, diff, p);

            U384.modmulAssignTo(call, z2, u3, v);
        }
    }

    function _precomputePointsTable(
        uint256 call,
        uint256 p,
        uint256 three,
        uint256 a,
        GH memory gh
    ) private view returns (uint256[3][16] memory points) {
        /// 0b0100: 1G + 0H
        (points[0x04][0], points[0x04][1], points[0x04][2]) = (
            gh.gx.copy(),
            gh.gy.copy(),
            U384.init(1)
        );
        /// 0b1000: 2G + 0H
        (points[0x08][0], points[0x08][1], points[0x08][2]) = _twiceProj(
            call,
            p,
            three,
            a,
            points[0x04][0],
            points[0x04][1],
            points[0x04][2]
        );
        /// 0b1100: 3G + 0H
        (points[0x0C][0], points[0x0C][1], points[0x0C][2]) = _addProj(
            call,
            p,
            three,
            a,
            points[0x04][0],
            points[0x04][1],
            points[0x04][2],
            points[0x08][0],
            points[0x08][1],
            points[0x08][2]
        );
        /// 0b0001: 0G + 1H
        (points[0x01][0], points[0x01][1], points[0x01][2]) = (
            gh.hx.copy(),
            gh.hy.copy(),
            U384.init(1)
        );
        /// 0b0010: 0G + 2H
        (points[0x02][0], points[0x02][1], points[0x02][2]) = _twiceProj(
            call,
            p,
            three,
            a,
            points[0x01][0],
            points[0x01][1],
            points[0x01][2]
        );
        /// 0b0011: 0G + 3H
        (points[0x03][0], points[0x03][1], points[0x03][2]) = _addProj(
            call,
            p,
            three,
            a,
            points[0x01][0],
            points[0x01][1],
            points[0x01][2],
            points[0x02][0],
            points[0x02][1],
            points[0x02][2]
        );
        /// 0b0101: 1G + 1H
        (points[0x05][0], points[0x05][1], points[0x05][2]) = _addProj(
            call,
            p,
            three,
            a,
            points[0x04][0],
            points[0x04][1],
            points[0x04][2],
            points[0x01][0],
            points[0x01][1],
            points[0x01][2]
        );
        /// 0b0110: 1G + 2H
        (points[0x06][0], points[0x06][1], points[0x06][2]) = _addProj(
            call,
            p,
            three,
            a,
            points[0x04][0],
            points[0x04][1],
            points[0x04][2],
            points[0x02][0],
            points[0x02][1],
            points[0x02][2]
        );
        /// 0b0111: 1G + 3H
        (points[0x07][0], points[0x07][1], points[0x07][2]) = _addProj(
            call,
            p,
            three,
            a,
            points[0x04][0],
            points[0x04][1],
            points[0x04][2],
            points[0x03][0],
            points[0x03][1],
            points[0x03][2]
        );
        /// 0b1001: 2G + 1H
        (points[0x09][0], points[0x09][1], points[0x09][2]) = _addProj(
            call,
            p,
            three,
            a,
            points[0x08][0],
            points[0x08][1],
            points[0x08][2],
            points[0x01][0],
            points[0x01][1],
            points[0x01][2]
        );
        /// 0b1010: 2G + 2H
        (points[0x0A][0], points[0x0A][1], points[0x0A][2]) = _addProj(
            call,
            p,
            three,
            a,
            points[0x08][0],
            points[0x08][1],
            points[0x08][2],
            points[0x02][0],
            points[0x02][1],
            points[0x02][2]
        );
        /// 0b1011: 2G + 3H
        (points[0x0B][0], points[0x0B][1], points[0x0B][2]) = _addProj(
            call,
            p,
            three,
            a,
            points[0x08][0],
            points[0x08][1],
            points[0x08][2],
            points[0x03][0],
            points[0x03][1],
            points[0x03][2]
        );
        /// 0b1101: 3G + 1H
        (points[0x0D][0], points[0x0D][1], points[0x0D][2]) = _addProj(
            call,
            p,
            three,
            a,
            points[0x0C][0],
            points[0x0C][1],
            points[0x0C][2],
            points[0x01][0],
            points[0x01][1],
            points[0x01][2]
        );
        /// 0b1110: 3G + 2H
        (points[0x0E][0], points[0x0E][1], points[0x0E][2]) = _addProj(
            call,
            p,
            three,
            a,
            points[0x0C][0],
            points[0x0C][1],
            points[0x0C][2],
            points[0x02][0],
            points[0x02][1],
            points[0x02][2]
        );
        /// 0b1111: 3G + 3H
        (points[0x0F][0], points[0x0F][1], points[0x0F][2]) = _addProj(
            call,
            p,
            three,
            a,
            points[0x0C][0],
            points[0x0C][1],
            points[0x0C][2],
            points[0x03][0],
            points[0x03][1],
            points[0x03][2]
        );

        return points;
    }
}
