// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {MemoryStack} from "./MemoryStack.sol";

library MemoryUint {
    using MemoryStack for *;

    struct SharedMemory {
        MemoryStack.Stack stack;
        MemoryStack.Stack overflowStack;
        MemoryStack.Stack callStack;
    }

    struct Uint512 {
        MemoryStack.StackValue data;
    }

    function newUint512SharedMemory() internal view returns (SharedMemory memory mem_) {
        mem_.stack = MemoryStack.init(64);
        mem_.overflowStack = MemoryStack.init(160);
        mem_.callStack = MemoryStack.init(1024);

        return mem_;
    }

    function newUint512(
        SharedMemory memory mem_,
        bytes memory data_
    ) internal view returns (Uint512 memory u512_) {
        require(data_.length <= 64, "MBI: data is too large");
        _checkMemory(mem_, 64);

        /// TODO: Can we pass here mem as a pointer?
        return Uint512(_initUint(mem_, data_));
    }

    function destruct(SharedMemory memory mem_, Uint512 memory u512_) internal view {
        _destruct(mem_, u512_.data, _StackType._UINT);
    }

    enum _StackType {
        _UINT,
        _OVERFLOW_UINT,
        _CALL
    }

    function _checkMemory(SharedMemory memory mem_, uint256 bytesCount_) private view {
        require(mem_.stack.elementSize == bytesCount_, "MBI: invalid memory");
    }

    function _new(
        SharedMemory memory mem_,
        _StackType stackType_
    ) private view returns (MemoryStack.StackValue memory value_) {
        if (stackType_ == _StackType._UINT) {
            return mem_.stack.push0();
        }

        if (stackType_ == _StackType._OVERFLOW_UINT) {
            return mem_.overflowStack.push0();
        }

        return mem_.callStack.push0();
    }

    function _destruct(
        SharedMemory memory mem_,
        MemoryStack.StackValue memory value_,
        _StackType stackType_
    ) private view {
        if (stackType_ == _StackType._UINT) {
            mem_.stack.pop(value_);
            return;
        }

        if (stackType_ == _StackType._OVERFLOW_UINT) {
            mem_.overflowStack.pop(value_);
            return;
        }

        mem_.callStack.pop(value_);
    }

    function _memSize(
        SharedMemory memory mem_,
        _StackType stackType_
    ) private view returns (uint256) {
        if (stackType_ == _StackType._UINT) {
            return mem_.stack.elementSize;
        }

        if (stackType_ == _StackType._OVERFLOW_UINT) {
            return mem_.overflowStack.elementSize;
        }

        return mem_.callStack.elementSize;
    }

    function _valueType(
        SharedMemory memory mem_,
        MemoryStack.StackValue memory value_
    ) private view returns (_StackType) {
        if (value_.value.length == mem_.stack.elementSize) {
            return _StackType._UINT;
        }

        if (value_.value.length == mem_.overflowStack.elementSize) {
            return _StackType._OVERFLOW_UINT;
        }

        return _StackType._CALL;
    }

    function _newUint(
        SharedMemory memory mem_,
        uint256 value_
    ) private view returns (MemoryStack.StackValue memory r_) {
        uint256 overflowMemSize_ = _memSize(mem_, _StackType._OVERFLOW_UINT);

        r_ = _new(mem_, _StackType._OVERFLOW_UINT);

        assembly {
            mstore(mload(r_), overflowMemSize_)
            mstore(add(mload(r_), overflowMemSize_), value_)
        }
    }

    function add(
        SharedMemory memory mem_,
        Uint512 memory a_,
        Uint512 memory b_
    ) internal view returns (Uint512 memory r_) {
        _checkMemory(mem_, 64);

        MemoryStack.StackValue memory sum_ = _add(mem_, a_.data, b_.data);

        r_ = Uint512(_cut(mem_, sum_));

        _destruct(mem_, sum_, _StackType._OVERFLOW_UINT);
    }

    function modadd(
        SharedMemory memory mem_,
        Uint512 memory a_,
        Uint512 memory b_,
        Uint512 memory m_
    ) internal view returns (Uint512 memory r_) {
        _checkMemory(mem_, 64);

        MemoryStack.StackValue memory sum_ = _add(mem_, a_.data, b_.data);

        r_ = Uint512(_mod(mem_, sum_, m_.data));

        _destruct(mem_, sum_, _StackType._OVERFLOW_UINT);
    }

    function mod(
        SharedMemory memory mem_,
        Uint512 memory a_,
        Uint512 memory m_
    ) private view returns (Uint512 memory r_) {
        _checkMemory(mem_, 64);

        return Uint512(_mod(mem_, a_.data, m_.data));
    }

    function modexp(
        SharedMemory memory mem_,
        Uint512 memory a_,
        Uint512 memory e_,
        Uint512 memory m_
    ) internal view returns (Uint512 memory r_) {
        _checkMemory(mem_, 64);

        return Uint512(_modexp(mem_, a_.data, e_.data, m_.data));
    }

    function _mod(
        SharedMemory memory mem_,
        MemoryStack.StackValue memory a_,
        MemoryStack.StackValue memory m_
    ) private view returns (MemoryStack.StackValue memory r_) {
        MemoryStack.StackValue memory one_ = _newUint(mem_, 1);

        r_ = _modexp(mem_, a_, one_, m_);

        _destruct(mem_, one_, _StackType._OVERFLOW_UINT);
    }

    function cmp(
        SharedMemory memory mem_,
        Uint512 memory a_,
        Uint512 memory b_
    ) internal view returns (int) {
        _checkMemory(mem_, 64);

        return _cmp(mem_, a_.data, b_.data);
    }

    function _cmp(
        SharedMemory memory mem_,
        MemoryStack.StackValue memory a_,
        MemoryStack.StackValue memory b_
    ) internal view returns (int256) {
        uint256 memSize_ = _memSize(mem_, _StackType._UINT);

        uint256 aPtr_;
        uint256 bPtr_;

        assembly {
            aPtr_ := add(mload(a_), 0x20)
            bPtr_ := add(mload(b_), 0x20)
        }

        for (uint i = 0; i < memSize_; i += 32) {
            uint256 aWord_;
            uint256 bWord_;

            assembly {
                aWord_ := mload(add(aPtr_, i))
                bWord_ := mload(add(bPtr_, i))
            }

            if (aWord_ > bWord_) {
                return 1;
            }

            if (bWord_ > aWord_) {
                return -1;
            }
        }

        return 0;
    }

    function _cut(
        SharedMemory memory mem_,
        MemoryStack.StackValue memory a_
    ) private view returns (MemoryStack.StackValue memory r_) {
        r_ = _new(mem_, _StackType._UINT);

        uint256 memSize_ = _memSize(mem_, _StackType._UINT);
        uint256 overflowMemSize_ = _memSize(mem_, _StackType._OVERFLOW_UINT);

        assembly {
            mstore(mload(r_), memSize_)

            let offset_ := add(sub(overflowMemSize_, memSize_), 0x20)

            if iszero(
                staticcall(
                    gas(),
                    0x4,
                    add(mload(a_), offset_),
                    memSize_,
                    add(mload(r_), 0x20),
                    memSize_
                )
            ) {
                revert(0, 0)
            }
        }
    }

    function _add(
        SharedMemory memory mem_,
        MemoryStack.StackValue memory a_,
        MemoryStack.StackValue memory b_
    ) private view returns (MemoryStack.StackValue memory r_) {
        r_ = _new(mem_, _StackType._OVERFLOW_UINT);

        uint256 memSize_ = _memSize(mem_, _StackType._UINT);
        uint256 overflowMemSize_ = _memSize(mem_, _StackType._OVERFLOW_UINT);

        assembly {
            mstore(mload(r_), overflowMemSize_)

            let aPtr_ := add(mload(a_), memSize_)
            let bPtr_ := add(mload(b_), memSize_)
            let rPtr_ := add(mload(r_), overflowMemSize_)

            let carry_ := 0

            for {
                let i := memSize_
            } eq(iszero(i), 0) {
                i := sub(i, 0x20)
            } {
                let aWord_ := mload(aPtr_)
                let bWord_ := mload(bPtr_)

                let rWord_ := add(add(aWord_, bWord_), carry_)

                carry_ := and(
                    eq(gt(rWord_, aWord_), 0),
                    or(eq(iszero(carry_), 0), eq(iszero(bWord_), 0))
                )

                mstore(rPtr_, rWord_)

                aPtr_ := sub(aPtr_, 0x20)
                bPtr_ := sub(bPtr_, 0x20)
                rPtr_ := sub(rPtr_, 0x20)
            }

            mstore(rPtr_, carry_)
        }
    }

    function _modexp(
        SharedMemory memory mem_,
        MemoryStack.StackValue memory a_,
        MemoryStack.StackValue memory e_,
        MemoryStack.StackValue memory m_
    ) private view returns (MemoryStack.StackValue memory r_) {
        r_ = _new(mem_, _valueType(mem_, m_));
        MemoryStack.StackValue memory call_ = _new(mem_, _StackType._CALL);

        assembly {
            let aSize_ := mload(mload(a_))
            let eSize_ := mload(mload(e_))
            let mSize_ := mload(mload(m_))

            mstore(mload(call_), aSize_)
            mstore(add(mload(call_), 0x20), eSize_)
            mstore(add(mload(call_), 0x40), mSize_)

            let offset_ := 0x60

            if iszero(
                staticcall(
                    gas(),
                    0x4,
                    add(mload(a_), 0x20),
                    aSize_,
                    add(mload(call_), offset_),
                    aSize_
                )
            ) {
                revert(0, 0)
            }

            offset_ := add(offset_, aSize_)

            if iszero(
                staticcall(
                    gas(),
                    0x4,
                    add(mload(e_), 0x20),
                    eSize_,
                    add(mload(call_), offset_),
                    eSize_
                )
            ) {
                revert(0, 0)
            }

            offset_ := add(offset_, eSize_)

            if iszero(
                staticcall(
                    gas(),
                    0x4,
                    add(mload(m_), 0x20),
                    mSize_,
                    add(mload(call_), offset_),
                    mSize_
                )
            ) {
                revert(0, 0)
            }

            offset_ := add(offset_, mSize_)

            mstore(mload(r_), mSize_)

            if iszero(
                staticcall(gas(), 0x5, mload(call_), offset_, add(mload(r_), 0x20), mSize_)
            ) {
                revert(0, 0)
            }
        }

        _destruct(mem_, call_, _StackType._CALL);
    }

    function _initUint(
        SharedMemory memory mem_,
        bytes memory data_
    ) private view returns (MemoryStack.StackValue memory r_) {
        r_ = _new(mem_, _StackType._UINT);

        uint256 uSize_ = _memSize(mem_, _StackType._UINT);

        assembly {
            let dataSize_ := mload(data_)
            let offset_ := sub(uSize_, dataSize_)

            mstore(mload(r_), uSize_)

            let success_ := staticcall(
                gas(),
                0x4,
                add(data_, 0x20),
                dataSize_,
                add(add(mload(r_), 0x20), offset_),
                dataSize_
            )
            if iszero(success_) {
                revert(0, 0)
            }
        }
    }
}
