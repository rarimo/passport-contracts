// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {Vector} from "@solarity/solidity-lib/libs/data-structures/memory/Vector.sol";
import "hardhat/console.sol";

library MemoryStack {
    using Vector for Vector.UintVector;

    struct Stack {
        Vector.UintVector stack;
        uint256 stackSize;
        uint256 elementSize;
    }

    struct StackValue {
        bytes value;
    }

    function init(uint256 elementSize_) internal pure returns (Stack memory) {
        require(elementSize_ % 32 == 0, "MS: invalid element size");

        return Stack({stack: Vector.newUint(), stackSize: 0, elementSize: elementSize_});
    }

    function push(Stack memory stack) internal pure returns (uint256 pointer_) {
        /// @dev It's an invariant that can only be violated by direct memory manipulation
        require(stack.stackSize <= stack.stack.length(), "MS: stack overflow");

        uint256 elementSize_ = stack.elementSize;

        if (stack.stackSize == stack.stack.length()) {
            assembly {
                pointer_ := mload(0x40)

                /// @dev 32 bytes for metadata, 32 bytes for length, and `elementSize_` bytes for data
                mstore(0x40, add(pointer_, add(elementSize_, 0x40)))

                pointer_ := add(pointer_, 0x20)
            }

            stack.stack.push(pointer_);

            console.log(stack.stackSize);

            if (stack.stackSize == 33) {
                revert();
            }
        } else {
            pointer_ = stack.stack.at(stack.stackSize);
        }

        uint256 index_ = stack.stackSize;

        assembly {
            mstore(sub(pointer_, 0x20), index_)
        }

        ++stack.stackSize;
    }

    function pop(Stack memory stack, uint256 pointer_) internal pure {
        /// FIXME: still can point to another value
        uint256 index_ = _checkValue(stack, pointer_);

        if (index_ + 1 < stack.stackSize) {
            uint256 lastIndex_ = stack.stackSize - 1;
            uint256 lastPointer_ = stack.stack.at(lastIndex_);

            assembly {
                mstore(sub(lastPointer_, 0x20), index_)
            }

            stack.stack.set(index_, lastPointer_);
            stack.stack.set(lastIndex_, pointer_);
        }

        uint256 slots_ = stack.elementSize / 32 + 1;

        assembly {
            for {
                let i := 0
            } lt(i, mul(slots_, 0x20)) {
                i := add(i, 0x20)
            } {
                mstore(add(pointer_, i), 0x0)
            }
        }

        --stack.stackSize;
    }

    function toData(
        Stack memory stack,
        uint256 pointer_
    ) internal view returns (bytes memory data_) {
        _checkValue(stack, pointer_);

        assembly {
            data_ := mload(0x40)

            let dataSize_ := add(mload(pointer_), 0x20)

            let success_ := staticcall(gas(), 0x4, pointer_, dataSize_, data_, dataSize_)
            if iszero(success_) {
                revert(0, 0)
            }

            mstore(0x40, add(data_, dataSize_))
        }
    }

    function _checkValue(
        Stack memory stack,
        uint256 pointer_
    ) private pure returns (uint256 index_) {
        assembly {
            index_ := mload(sub(pointer_, 0x20))
        }

        require(index_ < stack.stackSize, "MS: invalid index");
        require(stack.stack.at(index_) == pointer_, "MS: invalid value");
    }
}
