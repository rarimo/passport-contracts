// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {MemoryStack} from "./MemoryStack.sol";
import "hardhat/console.sol";

library MemoryBigInt {
    using MemoryStack for *;

    struct Heap {
        uint256 field;
        MemoryStack.Stack stack;
        MemoryStack.Stack stack2x;
        MemoryStack.Stack stack3x96;
    }

    struct BigInt {
        MemoryStack.StackValue data;
    }

    function initHeap(uint256 field_) internal pure returns (Heap memory) {
        return
            Heap({
                field: field_,
                stack: MemoryStack.init(field_),
                stack2x: MemoryStack.init(2 * field_),
                stack3x96: MemoryStack.init(3 * field_ + 96)
            });
    }

    function initBigInt(
        Heap memory heap,
        bytes memory data_
    ) internal view returns (BigInt memory bigInt_) {
        return _initBigInt(heap, data_);
    }

    //    function destruct(Heap memory heap, BigInt memory bigInt_) internal pure {
    //        storage_.stack.pop(bigInt_.val);
    //    }

    //
    //    function add(Storage memory storage_, bytes memory a_, bytes memory b_) internal pure returns (bytes memory r_) {
    //
    //    }
    //
    //    function mul(Storage memory storage_, bytes memory a_, bytes memory b_) internal pure returns (bytes memory r_) {
    //
    //    }

    function _initBigInt(
        Heap memory heap,
        bytes memory data_
    ) private view returns (BigInt memory r_) {
        r_ = BigInt(heap.stack.push0());

        uint256 rPointer_ = heap.stack.toPointer(r_.data);
        uint256 field_ = heap.field;

        assembly {
            let dataSize_ := mload(data_)
            let offset_ := sub(field_, dataSize_)

            mstore(rPointer_, field_)

            let success_ := staticcall(
                gas(),
                0x4,
                add(data_, 0x20),
                dataSize_,
                add(add(rPointer_, 0x20), offset_),
                dataSize_
            )
            if iszero(success_) {
                revert(0, 0)
            }
        }
    }
}
