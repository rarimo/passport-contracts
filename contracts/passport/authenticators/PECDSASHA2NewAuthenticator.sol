// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "hardhat/console.sol";
import {SharedMemory, MemoryUint} from "../../utils/MemoryUint.sol";
import {SHA1} from "../../utils/SHA1.sol";

/**
 * @notice Forked from https://github.com/tdrerup/elliptic-curve-solidity/blob/master/contracts/curves/EllipticCurve.sol
 */
contract PECDSASHA2NewAuthenticator {
    using MemoryUint for *;
    using SHA1 for bytes;

    // secp384r1 parameters
    struct Secp384rParams {
        uint256 a;
        uint256 b;
        uint256 gx;
        uint256 gy;
        uint256 p;
        uint256 n;
        uint256 lowSmax;
    }

    struct XYZ {
        uint256 x;
        uint256 y;
        uint256 z;
    }

    struct UT {
        uint256 u0;
        uint256 u1;
        uint256 t0;
        uint256 t1;
    }

    struct UWT {
        uint256 u;
        uint256 u2;
        uint256 u3;
        uint256 w;
        uint256 t;
    }

    struct TUVW {
        uint256 t;
        uint256 u;
        uint256 v;
        uint256 w;
    }

    /**
     * @notice Checks active authentication of a passport. ECDSA active authentication is an ECDSA signature of
     * raw SHA2 hash of challenge bytes. Usually brainpool256r1 elliptic curve is used.
     */
    function authenticate(
        bytes memory challenge,
        bytes memory r,
        bytes memory s,
        bytes memory x,
        bytes memory y
    ) external view returns (bool) {
        SharedMemory memory _shMem = MemoryUint.newUint512SharedMemory();
        Secp384rParams memory _params = Secp384rParams({
            a: _shMem.newUint512(
                hex"7D5A0975FC2C3057EEF67530417AFFE7FB8055C126DC5C6CE94A4B44F330B5D9"
            ),
            b: _shMem.newUint512(
                hex"26DC5C6CE94A4B44F330B5D9BBD77CBF958416295CF7E1CE6BCCDC18FF8C07B6"
            ),
            gx: _shMem.newUint512(
                hex"8BD2AEB9CB7E57CB2C4B482FFC81B7AFB9DE27E1E3BD23C23A4453BD9ACE3262"
            ),
            gy: _shMem.newUint512(
                hex"547EF835C3DAC4FD97F8461A14611DC9C27745132DED8E545C1D54C72F046997"
            ),
            p: _shMem.newUint512(
                hex"A9FB57DBA1EEA9BC3E660A909D838D726E3BF623D52620282013481D1F6E5377"
            ),
            n: _shMem.newUint512(
                hex"A9FB57DBA1EEA9BC3E660A909D838D718C397AA3B561A6F7901E0E82974856A7"
            ),
            lowSmax: _shMem.newUint512(
                hex"54fdabedd0f754de1f3305484ec1c6b9371dfb11ea9310141009a40e8fb729bb"
            )
        });

        uint256 _x = _shMem.newUint512(x);
        uint256 _y = _shMem.newUint512(y);

        /// @dev accept s only from the lower part of the curve
        // if (r == 0 || r >= n || s == 0 || s > lowSmax) {
        //     return false;
        // }

        if (!_isOnCurve(_shMem, _params, _x, _y)) {
            return false;
        }

        uint256 message = _shMem.newUint512(abi.encodePacked(uint160(challenge.sha1())));
        uint256 temp = _shMem.moddiv(
            message,
            _shMem.newUint512(s),
            _params.n,
            MemoryUint.Destructor.SECOND
        );

        (uint256 x1, uint256 y1) = _multiplyScalar(_shMem, _params, _params.gx, _params.gy, temp);

        _shMem.destruct(temp);

        console.logBytes(MemoryUint.toData(x1));
        console.logBytes(MemoryUint.toData(y1));

        return false;

        // uint256 _r = _shMem.newUint512(r);

        // temp = _shMem.moddiv(_r, _s, _params.n);
        // (uint256 x2, uint256 y2) = _multiplyScalar(_shMem, _params, _x, _y, temp);
        // _shMem.destruct(temp);

        // _shMem.destruct(_s);

        // uint256 x1 = _shMem.newUint512(
        //     hex"237544e26b27436fe2825685b0c8c479b5a9fba1424eed1bdb46662edf7357a7"
        // );
        // uint256 x2 = _shMem.newUint512(
        //     hex"09e5dd89d2c91b8e803a1582af8835ef03824a43cbcd4cb7320b1aa675706add"
        // );
        // uint256 y1 = _shMem.newUint512(
        //     hex"5c746bb1eaef6275433511fbc7afa832abd79e58d7b06fe63104696f957e47fc"
        // );
        // uint256 y2 = _shMem.newUint512(
        //     hex"8fd8e0c00ea0ca899cbd668e8de533e5cadb188a3d37a633b953501196194f39"
        // );

        // Uint512[3] memory P = _addAndReturnProjectivePoint(_shMem, _params, x1, y1, x2, y2);

        // _shMem.destruct(x1);
        // _shMem.destruct(x2);
        // _shMem.destruct(y1);
        // _shMem.destruct(y2);

        // uint256 temp = _shMem.zero();
        // if (_shMem.cmp(P[2], temp) == 0) {
        //     return false;
        // }
        // _shMem.destruct(temp);

        // temp = _shMem.moddiv(P[2], P[2], _params.p);
        // uint256 Px = _shMem.modmul(P[0], temp, _params.p);
        // _shMem.destruct(temp);

        // temp = _shMem.mod(Px, _params.n);

        // return _shMem.cmp(temp, _r) == 0;
    }

    /**
     * @dev Multiply an elliptic curve point by a scalar.
     */
    function _multiplyScalar(
        SharedMemory memory shMem,
        Secp384rParams memory params,
        uint256 x0,
        uint256 y0,
        uint256 scalar
    ) internal view returns (uint256 x1, uint256 y1) {
        {
            uint256 zero = shMem.zero();
            uint256 one = shMem.one();

            if (shMem.cmp(scalar, zero) == 0) {
                return _zeroAffine(shMem);
            } else if (shMem.cmp(scalar, one) == 0) {
                return (x0, y0);
            } else {
                uint256 two = shMem.two();
                int256 res = shMem.cmp(scalar, two);

                shMem.destruct(two);

                if (res == 0) {
                    return _twice(shMem, params, x0, y0);
                }
            }
        }

        XYZ memory xyzBase;
        XYZ memory xyz1;
        XYZ memory temp;

        {
            bytes memory x0Bytes;
            bytes memory y0Bytes;

            assembly {
                x0Bytes := x0
                y0Bytes := y0
            }

            xyzBase = XYZ(shMem.newUint512(x0Bytes), shMem.newUint512(y0Bytes), shMem.one());
            xyz1 = XYZ(shMem.newUint512(x0Bytes), shMem.newUint512(y0Bytes), shMem.one());
        }

        uint256 lowBits_;

        assembly {
            lowBits_ := mload(add(scalar, 0x40))
        }

        lowBits_ = lowBits_ >> 1;

        // while (lowBits_ > 0) {
        for (uint256 i = 0; i < 10; i++) {
            temp = _twiceProj(shMem, params, xyzBase);

            shMem.destruct(xyzBase.x);
            shMem.destruct(xyzBase.y);
            shMem.destruct(xyzBase.z);

            xyzBase = temp;

            if (lowBits_ & 1 == 1) {
                temp = _addProj(shMem, params, xyzBase, xyz1);

                shMem.destruct(xyz1.x);
                shMem.destruct(xyz1.y);
                shMem.destruct(xyz1.z);

                xyz1 = temp;
            }

            lowBits_ = lowBits_ >> 1;

            uint256 mem_;

            assembly {
                mem_ := msize()
            }

            console.log(mem_);
        }

        shMem.destruct(xyzBase.x);
        shMem.destruct(xyzBase.y);
        shMem.destruct(xyzBase.z);

        (x1, y1) = _toAffinePoint(shMem, params, xyz1);

        shMem.destruct(xyz1.x);
        shMem.destruct(xyz1.y);
        shMem.destruct(xyz1.z);
    }

    /**
     * @dev Double an elliptic curve point in projective coordinates. See
     * https://www.nayuki.io/page/elliptic-curve-point-addition-in-projective-coordinates
     */
    function _twiceProj(
        SharedMemory memory shMem,
        Secp384rParams memory params,
        XYZ memory xyz0
    ) internal view returns (XYZ memory xyz) {
        TUVW memory tuvw;

        if (_isZeroCurve(shMem, xyz0.x, xyz0.y)) {
            return _zeroProj(shMem);
        }

        uint256 two = shMem.two();

        tuvw.u = shMem.modmul(xyz0.y, xyz0.z, params.p);
        tuvw.u = shMem.modmul(tuvw.u, two, params.p, MemoryUint.Destructor.FIRST);

        tuvw.v = shMem.modmul(tuvw.u, xyz0.x, params.p);
        tuvw.v = shMem.modmul(tuvw.v, xyz0.y, params.p, MemoryUint.Destructor.FIRST);
        tuvw.v = shMem.modmul(tuvw.v, two, params.p, MemoryUint.Destructor.FIRST);

        xyz0.x = shMem.modmul(xyz0.x, xyz0.x, params.p, MemoryUint.Destructor.FIRST);

        tuvw.t = shMem.modmul(xyz0.x, shMem.three(), params.p, MemoryUint.Destructor.BOTH);

        xyz0.z = shMem.modmul(xyz0.z, xyz0.z, params.p, MemoryUint.Destructor.FIRST);
        xyz0.z = shMem.modmul(xyz0.z, params.a, params.p, MemoryUint.Destructor.FIRST);

        tuvw.t = shMem.modadd(tuvw.t, xyz0.z, params.p, MemoryUint.Destructor.FIRST);
        tuvw.w = shMem.modmul(tuvw.t, tuvw.t, params.p);

        xyz0.x = shMem.modmul(two, tuvw.v, params.p);

        tuvw.w = shMem.modadd(
            tuvw.w,
            shMem.sub(params.p, xyz0.x),
            params.p,
            MemoryUint.Destructor.BOTH
        );

        xyz0.x = shMem.modadd(
            tuvw.v,
            shMem.sub(params.p, tuvw.w),
            params.p,
            MemoryUint.Destructor.SECOND
        );
        xyz0.x = shMem.modmul(tuvw.t, xyz0.x, params.p, MemoryUint.Destructor.SECOND);
        xyz0.y = shMem.modmul(xyz0.y, tuvw.u, params.p, MemoryUint.Destructor.FIRST);
        xyz0.y = shMem.modmul(xyz0.y, xyz0.y, params.p, MemoryUint.Destructor.FIRST);
        xyz0.y = shMem.modmul(two, xyz0.y, params.p, MemoryUint.Destructor.BOTH);

        xyz.y = shMem.modadd(
            xyz0.x,
            shMem.sub(params.p, xyz0.y),
            params.p,
            MemoryUint.Destructor.SECOND
        );
        xyz.x = shMem.modmul(tuvw.u, tuvw.w, params.p);
        xyz.z = shMem.modmul(tuvw.u, tuvw.u, params.p);
        xyz.z = shMem.modmul(xyz.z, tuvw.u, params.p, MemoryUint.Destructor.FIRST);

        shMem.destruct(tuvw.t);
        shMem.destruct(tuvw.u);
        shMem.destruct(tuvw.v);
        shMem.destruct(tuvw.w);
    }

    /**
     * @dev Add two elliptic curve points in projective coordinates. See
     * https://www.nayuki.io/page/elliptic-curve-point-addition-in-projective-coordinates
     */
    function _addProj(
        SharedMemory memory shMem,
        Secp384rParams memory params,
        XYZ memory xyz0,
        XYZ memory xyz1
    ) internal view returns (XYZ memory xyz) {
        if (_isZeroCurve(shMem, xyz0.x, xyz0.y)) {
            return XYZ(xyz1.x, xyz1.y, xyz1.z); // FIXME copy
        } else if (_isZeroCurve(shMem, xyz1.x, xyz1.y)) {
            return XYZ(xyz0.x, xyz0.y, xyz0.z); // FIXME copy
        }

        UT memory ut;

        ut.t0 = shMem.modmul(xyz0.y, xyz1.z, params.p);
        ut.t1 = shMem.modmul(xyz1.y, xyz0.z, params.p);

        ut.u0 = shMem.modmul(xyz0.x, xyz1.z, params.p);
        ut.u1 = shMem.modmul(xyz1.x, xyz0.z, params.p);

        if (shMem.cmp(ut.u0, ut.u1) == 0) {
            if (shMem.cmp(ut.t0, ut.t1) == 0) {
                xyz = _twiceProj(shMem, params, xyz0);
            } else {
                xyz = _zeroProj(shMem);
            }
        } else {
            xyz = _addProj2(shMem, params, shMem.modmul(xyz0.z, xyz1.z, params.p), ut);
        }

        shMem.destruct(ut.t0);
        shMem.destruct(ut.t1);
        shMem.destruct(ut.u0);
        shMem.destruct(ut.u1);
    }

    /**
     * @dev Helper function that splits addProj to avoid too many local variables.
     */
    function _addProj2(
        SharedMemory memory shMem,
        Secp384rParams memory params,
        uint256 v,
        UT memory ut
    ) internal view returns (XYZ memory xyz) {
        UWT memory uwt;

        uwt.t = shMem.modadd(
            ut.t0,
            shMem.sub(params.p, ut.t1),
            params.p,
            MemoryUint.Destructor.SECOND
        );
        uwt.u = shMem.modadd(
            ut.u0,
            shMem.sub(params.p, ut.u1),
            params.p,
            MemoryUint.Destructor.SECOND
        );

        uwt.u2 = shMem.modmul(uwt.u, uwt.u, params.p);
        uwt.w = shMem.modmul(uwt.t, uwt.t, params.p);
        uwt.w = shMem.modmul(uwt.w, v, params.p, MemoryUint.Destructor.FIRST);

        ut.u1 = shMem.modadd(ut.u1, ut.u0, params.p, MemoryUint.Destructor.FIRST);
        ut.u1 = shMem.modmul(ut.u1, uwt.u2, params.p, MemoryUint.Destructor.FIRST);

        uwt.w = shMem.modadd(
            uwt.w,
            shMem.sub(params.p, ut.u1),
            params.p,
            MemoryUint.Destructor.BOTH
        );

        xyz.x = shMem.modmul(uwt.u, uwt.w, params.p);

        uwt.u3 = shMem.modmul(uwt.u2, uwt.u, params.p);

        ut.u0 = shMem.modmul(ut.u0, uwt.u2, params.p, MemoryUint.Destructor.FIRST);
        ut.u0 = shMem.modadd(
            ut.u0,
            shMem.sub(params.p, uwt.w),
            params.p,
            MemoryUint.Destructor.BOTH
        );

        uwt.t = shMem.modmul(uwt.t, ut.u0, params.p, MemoryUint.Destructor.FIRST);

        ut.t0 = shMem.modmul(ut.t0, uwt.u3, params.p, MemoryUint.Destructor.FIRST);

        xyz.y = shMem.modadd(
            uwt.t,
            shMem.sub(params.p, ut.t0),
            params.p,
            MemoryUint.Destructor.SECOND
        );
        xyz.z = shMem.modmul(uwt.u3, v, params.p, MemoryUint.Destructor.SECOND);

        shMem.destruct(uwt.u);
        shMem.destruct(uwt.u2);
        shMem.destruct(uwt.u3);
        shMem.destruct(uwt.w);
        shMem.destruct(uwt.t);
    }

    /**
     * @dev Add two elliptic curve points in affine coordinates.
     */
    function _add(
        SharedMemory memory shMem,
        Secp384rParams memory params,
        uint256 x0,
        uint256 y0,
        uint256 x1,
        uint256 y1
    ) internal view returns (uint256 x, uint256 y) {
        uint256 one = shMem.one();

        XYZ memory xyz = _addProj(shMem, params, XYZ(x0, y0, one), XYZ(x1, y1, one));
        (x, y) = _toAffinePoint(shMem, params, xyz);

        shMem.destruct(one);
        shMem.destruct(xyz.x);
        shMem.destruct(xyz.y);
        shMem.destruct(xyz.z);
    }

    /**
     * @dev Double an elliptic curve point in affine coordinates.
     */
    function _twice(
        SharedMemory memory shMem,
        Secp384rParams memory params,
        uint256 x0,
        uint256 y0
    ) internal view returns (uint256 x, uint256 y) {
        uint256 one = shMem.one();

        XYZ memory xyz = _twiceProj(shMem, params, XYZ(x0, y0, one));

        (x, y) = _toAffinePoint(shMem, params, xyz);

        shMem.destruct(one);
        shMem.destruct(xyz.x);
        shMem.destruct(xyz.y);
        shMem.destruct(xyz.z);
    }

    /**
     * @dev Add two points in affine coordinates and return projective point.
     */
    function _addAndReturnProjectivePoint(
        SharedMemory memory shMem,
        Secp384rParams memory params,
        uint256 x1,
        uint256 y1,
        uint256 x2,
        uint256 y2
    ) internal view returns (uint256[3] memory P) {
        (uint256 x, uint256 y) = _add(shMem, params, x1, y1, x2, y2);
        P = _toProjectivePoint(shMem, params, x, y);

        shMem.destruct(x);
        shMem.destruct(y);
    }

    /**
     * @dev Transform from projective to affine coordinates.
     */
    function _toAffinePoint(
        SharedMemory memory shMem,
        Secp384rParams memory params,
        XYZ memory xyz
    ) internal view returns (uint256 x1, uint256 y1) {
        x1 = shMem.moddiv(xyz.x, xyz.z, params.p);
        y1 = shMem.moddiv(xyz.y, xyz.z, params.p);
    }

    /**
     * @dev Check if a point in affine coordinates is on the curve.
     */
    function _isOnCurve(
        SharedMemory memory shMem,
        Secp384rParams memory params,
        uint256 x,
        uint256 y
    ) internal view returns (bool res) {
        uint256 zero = shMem.zero();

        if (
            shMem.cmp(x, zero) == 0 ||
            shMem.cmp(y, zero) == 0 ||
            shMem.cmp(x, params.p) == 0 ||
            shMem.cmp(y, params.p) == 0
        ) {
            return false;
        }

        uint256 RHS = shMem.modmul(
            shMem.modmul(x, x, params.p),
            x,
            params.p,
            MemoryUint.Destructor.FIRST
        ); // x^3
        uint256 LHS = shMem.modmul(y, y, params.p); // y^2x

        if (shMem.cmp(params.a, zero) != 0) {
            RHS = shMem.modadd(
                RHS,
                shMem.modmul(x, params.a, params.p),
                params.p,
                MemoryUint.Destructor.BOTH
            ); // x^3 + a*x
        }

        if (shMem.cmp(params.b, zero) != 0) {
            RHS = shMem.modadd(RHS, params.b, params.p, MemoryUint.Destructor.FIRST); // x^3 + a*x + b
        }

        res = shMem.cmp(LHS, RHS) == 0;

        shMem.destruct(zero);
        shMem.destruct(LHS);
        shMem.destruct(RHS);
    }

    /**
     * @dev Transform affine coordinates into projective coordinates.
     */
    function _toProjectivePoint(
        SharedMemory memory shMem,
        Secp384rParams memory params,
        uint256 x0,
        uint256 y0
    ) internal view returns (uint256[3] memory P) {
        P[2] = shMem.one();
        P[0] = shMem.modmul(x0, P[2], params.p);
        P[1] = shMem.modmul(y0, P[2], params.p);
    }

    /**
     * @dev Return the zero curve in projective coordinates.
     */
    function _zeroProj(SharedMemory memory shMem) internal view returns (XYZ memory) {
        return XYZ(shMem.zero(), shMem.one(), shMem.zero());
    }

    /**
     * @dev Return the zero curve in affine coordinates.
     */
    function _zeroAffine(SharedMemory memory shMem) internal view returns (uint256 x, uint256 y) {
        return (shMem.zero(), shMem.zero());
    }

    /**
     * @dev Check if the curve is the zero curve.
     */
    function _isZeroCurve(
        SharedMemory memory shMem,
        uint256 x0,
        uint256 y0
    ) internal view returns (bool isZero) {
        uint256 zero = shMem.zero();
        isZero = shMem.cmp(x0, zero) == 0 && shMem.cmp(y0, zero) == 0;

        shMem.destruct(zero);
    }
}
