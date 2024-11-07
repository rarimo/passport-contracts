// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {ICertificateSigner} from "../../interfaces/signers/ICertificateSigner.sol";

import {U384} from "../../utils/U384.sol";
import "hardhat/console.sol";
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
                p: hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFF"
                    .init(),
                n: hex"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973"
                    .init(),
                lowSmax: hex"7fffffffffffffffffffffffffffffffffffffffffffffffe3b1a6c0fa1b96efac0d06d9245853bd76760cb5666294b9"
                    .init(),
                call: U384.initCall(),
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

            (uint256 x1, uint256 y1) = _multiplyScalar(
                params,
                params.gx,
                params.gy,
                U384.moddiv(params.call, message, inputs.s, params.n)
            );
            console.log("RESULT");
            console.logBytes(x1.toBytes());
            console.logBytes(y1.toBytes());

            (uint256 x2, uint256 y2) = _multiplyScalar(
                params,
                inputs.x,
                inputs.y,
                U384.moddiv(params.call, inputs.r, inputs.s, params.n)
            );
            console.log("RESULT");
            console.logBytes(x2.toBytes());
            console.logBytes(y2.toBytes());

            (x1, y1, x2) = _addProj(
                params.call,
                params.p,
                params.three,
                params.a,
                x1,
                y1,
                U384.init(1),
                x2,
                y2,
                U384.init(1)
            );

            return U384.eq(U384.moddiv(params.call, x1, x2, params.p), inputs.r);
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
        unchecked {
            uint256 highBits_;
            uint256 lowBits_;

            assembly {
                highBits_ := mload(scalar)
                lowBits_ := mload(add(scalar, 0x20))
            }

            uint256 z0 = U384.init(1);
            x1 = U384.init(0);
            y1 = U384.init(0);
            uint256 z1 = U384.init(0);

            for (uint256 bit = 0; bit < 184; ++bit) {
                (x1, y1, z1) = _twiceProj(
                    params.call,
                    params.p,
                    params.three,
                    params.a,
                    x1,
                    y1,
                    z1
                );

                if ((highBits_ >> (183 - bit)) & 1 == 1) {
                    (x1, y1, z1) = _addProj(
                        params.call,
                        params.p,
                        params.three,
                        params.a,
                        x0,
                        y0,
                        z0,
                        x1,
                        y1,
                        z1
                    );
                }
            }

            for (uint256 bit = 0; bit < 256; ++bit) {
                (x1, y1, z1) = _twiceProj(
                    params.call,
                    params.p,
                    params.three,
                    params.a,
                    x1,
                    y1,
                    z1
                );

                if ((lowBits_ >> (255 - bit)) & 1 == 1) {
                    (x1, y1, z1) = _addProj(
                        params.call,
                        params.p,
                        params.three,
                        params.a,
                        x0,
                        y0,
                        z0,
                        x1,
                        y1,
                        z1
                    );
                }
            }

            uint256 p_ = params.p;
            uint256 call_ = params.call;

            return (U384.moddiv(call_, x1, z1, p_), U384.moddiv(call_, y1, z1, p_));
        }
    }

    /**
     * @dev Double an elliptic curve point in affine coordinates.
     */
    function _twice(
        uint256 call,
        uint256 p,
        uint256 three,
        uint256 a,
        uint256 x0,
        uint256 y0
    ) internal view returns (uint256, uint256) {
        unchecked {
            uint256 z0;

            (x0, y0, z0) = _twiceProj(call, p, three, a, x0, y0, U384.init(1));

            return (U384.moddiv(call, x0, z0, p), U384.moddiv(call, y0, z0, p));
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
                return (U384.init(0), U384.init(0), U384.init(0)); // zero proj
            }

            uint256 u = U384.modmul(call, y0, z0, p);
            U384.modshl1Assign(call, u, p);

            x1 = U384.modmul(call, u, x0, p);
            U384.modmulAssign(call, x1, y0, p);
            U384.modshl1Assign(call, x1, p);

            x0 = U384.modexp(call, x0, 2, p);

            y1 = U384.modmul(call, x0, three, p);

            z0 = U384.modexp(call, z0, 2, p);
            U384.modmulAssign(call, z0, a, p);
            U384.modaddAssign(call, y1, z0, p);

            z1 = U384.modexp(call, y1, 2, p);
            U384.modshl1AssignTo(call, x0, x1, p);

            uint256 diff = U384.sub(p, x0);
            U384.modaddAssign(call, z1, diff, p);

            U384.subAssignTo(diff, p, z1);
            U384.modaddAssignTo(call, x0, x1, diff, p);
            U384.modmulAssign(call, x0, y1, p);

            y0 = U384.modmul(call, y0, u, p);
            U384.modexpAssign(call, y0, 2, p);
            U384.modshl1Assign(call, y0, p);

            U384.subAssignTo(diff, p, y0);
            U384.modaddAssignTo(call, y1, x0, diff, p);

            U384.modmulAssignTo(call, x1, u, z1, p);

            U384.modexpAssignTo(call, z1, u, 2, p);
            U384.modmulAssign(call, z1, u, p);
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

            x2 = U384.modmul(call, y0, z1, p);
            y2 = U384.modmul(call, y1, z0, p);
            z2 = U384.modmul(call, x0, z1, p);
            y1 = U384.modmul(call, x1, z0, p);

            if (U384.eq(z2, y1)) {
                if (U384.eq(x2, y2)) {
                    return _twiceProj(call, p, three, a, x0, y0, z0);
                } else {
                    return (U384.init(0), U384.init(1), U384.init(0)); // zero proj
                }
            }

            a = U384.modmul(call, z0, z1, p);

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
            y2 = U384.modadd(call, t0, diff, p);

            U384.subAssignTo(diff, p, u1);
            x2 = U384.modadd(call, u0, diff, p);
            uint256 u2 = U384.modexp(call, x2, 2, p);

            z2 = U384.modexp(call, y2, 2, p);

            U384.modmulAssign(call, z2, v, p);
            u1 = U384.modadd(call, u1, u0, p);
            U384.modmulAssign(call, u1, u2, p);
            U384.subAssignTo(diff, p, u1);
            U384.modaddAssign(call, z2, diff, p);

            uint256 u3 = U384.modmul(call, u2, x2, p);

            U384.modmulAssign(call, x2, z2, p);

            u0 = U384.modmul(call, u0, u2, p);

            U384.subAssignTo(diff, p, z2);
            U384.modaddAssign(call, u0, diff, p);
            U384.modmulAssign(call, y2, u0, p);
            t0 = U384.modmul(call, t0, u3, p);

            U384.subAssignTo(diff, p, t0);
            U384.modaddAssign(call, y2, diff, p);

            U384.modmulAssignTo(call, z2, u3, v, p);
        }
    }
}
