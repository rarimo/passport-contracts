// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../../utils/MemoryStack.sol";
import "../../utils/MemoryBigInt.sol";
import "hardhat/console.sol";

contract StackMock {
    using MemoryStack for MemoryStack.Stack;
    using MemoryBigInt for *;

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
    function mock() external view returns (MemoryBigInt.BigInt memory) {
        MemoryBigInt.Heap memory heap_ = MemoryBigInt.initHeap(64);

        MemoryBigInt.BigInt memory a_ = heap_.initBigInt(hex"1337");

        return a_;
    }
}
