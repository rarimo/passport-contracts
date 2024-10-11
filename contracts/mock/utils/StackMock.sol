// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {MemoryStack} from "../../utils/MemoryStack.sol";
import {MemoryUint} from "../../utils/MemoryUint.sol";
import "hardhat/console.sol";

contract StackMock {
    using MemoryStack for MemoryStack.Stack;
    using MemoryUint for *;

    ////        let t: bigint;
    ////        let u: bigint;
    ////        let v: bigint;
    ////        let w: bigint;
    ////
    ////        if (isZeroCurve(x0, y0)) {
    ////            return zeroProj();
    ////        }
    ////
    ////        u = modmul(y0, z0, p);
    ////        u = modmul(u, 2n, p);
    ////
    ////        v = modmul(u, x0, p);
    ////        v = modmul(v, y0, p);
    ////        v = modmul(v, 2n, p);
    ////
    ////        x0 = modmul(x0, x0, p);
    ////        t = modmul(x0, BigInt(3), p);
    ////
    ////        z0 = modmul(z0, z0, p);
    ////        z0 = modmul(z0, a, p);
    ////        t = (t + z0) % p;
    ////
    ////        w = modmul(t, t, p);
    ////        x0 = modmul(2n, v, p);
    ////        w = (w + (p - x0)) % p;
    ////
    ////        x0 = (v + (p - w)) % p;
    ////        x0 = modmul(t, x0, p);
    ////        y0 = modmul(y0, u, p);
    ////        y0 = modmul(y0, y0, p);
    ////        y0 = modmul(2n, y0, p);
    ////        let y1 = (x0 + (p - y0)) % p;
    ////
    ////        let x1 = modmul(u, w, p);
    ////
    ////        let z1 = modmul(u, u, p);
    ////        z1 = modmul(z1, u, p);
    ////
    function mock() external view returns (MemoryUint.Uint512 memory) {
        MemoryUint.SharedMemory memory mem_ = MemoryUint.newUint512SharedMemory();

        MemoryUint.Uint512 memory a_ = mem_.newUint512(hex"05");
        MemoryUint.Uint512 memory b_ = mem_.newUint512(hex"07");
        MemoryUint.Uint512 memory m_ = mem_.newUint512(hex"0A");

        return MemoryUint.moddiv(mem_, a_, b_, m_);
    }
}
