// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {MemoryStack} from "./MemoryStack.sol";

struct SharedMemory {
    MemoryStack.Stack stack;
    MemoryStack.Stack extStack;
    MemoryStack.Stack callStack;
}

library MemoryUint {
    using MemoryStack for *;

    function newUint512SharedMemory() internal view returns (SharedMemory memory mem_) {
        mem_.stack = MemoryStack.init(64);
        mem_.extStack = MemoryStack.init(160);
        mem_.callStack = MemoryStack.init(1024);

        return mem_;
    }

    function toData(uint256 value_) internal pure returns (bytes memory data_) {
        assembly {
            data_ := value_
        }
    }

    function zero(SharedMemory memory mem) internal view returns (uint256) {
        return _newUint(mem, 0);
    }

    function one(SharedMemory memory mem) internal view returns (uint256) {
        return _newUint(mem, 1);
    }

    function two(SharedMemory memory mem) internal view returns (uint256) {
        return _newUint(mem, 2);
    }

    function three(SharedMemory memory mem) internal view returns (uint256) {
        return _newUint(mem, 3);
    }

    function newUint512(
        SharedMemory memory mem_,
        bytes memory data_
    ) internal view returns (uint256 u512_) {
        require(data_.length <= 64, "MU: data is too large");
        _checkMemory(mem_, 64);

        /// TODO: Can we pass here mem as a pointer?
        return _initUint(mem_, data_);
    }

    function destruct(SharedMemory memory mem_, uint256 u512_) internal view {
        _destruct(mem_, u512_, _StackType._UINT);
    }

    function add(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 b_
    ) internal view returns (uint256 r_) {
        _checkMemory(mem_, 64);

        return _add(mem_, a_, b_);
    }

    function sub(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 b_
    ) internal view returns (uint256 r_) {
        _checkMemory(mem_, 64);

        return _sub(mem_, a_, b_);
    }

    function mod(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 m_
    ) internal view returns (uint256 r_) {
        _checkMemory(mem_, 64);

        return _mod(mem_, a_, m_);
    }

    function mul(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 b_
    ) internal view returns (uint256 r_) {
        _checkMemory(mem_, 64);

        uint256 rExt_ = _mul(mem_, a_, b_);

        r_ = _cut(mem_, rExt_);

        _destruct(mem_, rExt_, _StackType._EXT_UINT);
    }

    function modadd(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 b_,
        uint256 m_
    ) internal view returns (uint256 r_) {
        _checkMemory(mem_, 64);

        uint256 aExt_ = _extend(mem_, a_);
        uint256 bExt_ = _extend(mem_, b_);

        uint256 sum_ = _add(mem_, aExt_, bExt_);

        r_ = _mod(mem_, sum_, m_);

        _destruct(mem_, aExt_, _StackType._EXT_UINT);
        _destruct(mem_, bExt_, _StackType._EXT_UINT);
        _destruct(mem_, sum_, _StackType._EXT_UINT);
    }

    function modsub(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 b_,
        uint256 m_
    ) internal view returns (uint256 r_) {
        _checkMemory(mem_, 64);

        int cmp_ = _cmp(mem_, a_, b_);

        uint256 diff_ = cmp_ >= 0 ? _sub(mem_, a_, b_) : _sub(mem_, b_, a_);
        uint256 modDiff_ = _mod(mem_, diff_, m_);

        _destruct(mem_, diff_, _StackType._UINT);

        if (cmp_ >= 0) {
            return modDiff_;
        }

        r_ = _sub(mem_, m_, modDiff_);

        _destruct(mem_, modDiff_, _StackType._UINT);
    }

    function modmul(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 b_,
        uint256 m_
    ) internal view returns (uint256 r_) {
        _checkMemory(mem_, 64);

        uint256 rExt_ = _mul(mem_, a_, b_);

        r_ = _mod(mem_, rExt_, m_);

        _destruct(mem_, rExt_, _StackType._EXT_UINT);
    }

    function modexp(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 e_,
        uint256 m_
    ) internal view returns (uint256 r_) {
        _checkMemory(mem_, 64);

        return _modexp(mem_, a_, e_, m_);
    }

    function modinv(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 m_
    ) internal view returns (uint256 r_) {
        _checkMemory(mem_, 64);

        return _modinv(mem_, a_, m_);
    }

    function moddiv(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 b_,
        uint256 m_
    ) internal view returns (uint256 r_) {
        _checkMemory(mem_, 64);

        uint256 bInv_ = _modinv(mem_, b_, m_);
        uint256 rExt_ = _mul(mem_, a_, bInv_);

        r_ = _mod(mem_, rExt_, m_);

        _destruct(mem_, rExt_, _StackType._EXT_UINT);
        _destruct(mem_, bInv_, _StackType._UINT);
    }

    function cmp(SharedMemory memory mem_, uint256 a_, uint256 b_) internal view returns (int) {
        _checkMemory(mem_, 64);

        return _cmp(mem_, a_, b_);
    }

    /// @dev a_, b_ and r_ are of the same size
    function _add(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 b_
    ) private view returns (uint256 r_) {
        r_ = _new(mem_, _valueType(mem_, a_));

        assembly {
            let memSize_ := mload(a_)

            mstore(r_, memSize_)

            let aPtr_ := add(a_, memSize_)
            let bPtr_ := add(b_, memSize_)
            let rPtr_ := add(r_, memSize_)

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
        }
    }

    /// @dev a_, b_ and r_ are of the same size, a >= b
    function _sub(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 b_
    ) private view returns (uint256 r_) {
        r_ = _new(mem_, _valueType(mem_, a_));

        assembly {
            let memSize_ := mload(a_)

            mstore(r_, memSize_)

            let aPtr_ := add(a_, memSize_)
            let bPtr_ := add(b_, memSize_)
            let rPtr_ := add(r_, memSize_)

            let carry_ := 0

            for {
                let i := memSize_
            } eq(iszero(i), 0) {
                i := sub(i, 0x20)
            } {
                let aWord_ := mload(aPtr_)
                let bWord_ := mload(bPtr_)

                mstore(rPtr_, sub(sub(aWord_, bWord_), carry_))

                carry_ := or(
                    lt(aWord_, add(bWord_, carry_)),
                    and(eq(bWord_, sub(0, 1)), eq(carry_, 1))
                )

                aPtr_ := sub(aPtr_, 0x20)
                bPtr_ := sub(bPtr_, 0x20)
                rPtr_ := sub(rPtr_, 0x20)
            }
        }
    }

    /// @dev a_, b_ are of the same size, r_ is extended
    function _mul(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 b_
    ) private view returns (uint256 r_) {
        uint256 aExt_ = _extend(mem_, a_);
        uint256 bExt_ = _extend(mem_, b_);

        uint256 sumExt_ = _add(mem_, aExt_, bExt_);

        uint256 two_ = _newUint(mem_, 2);
        uint256 maxModExt_ = _newMaxUint(mem_);

        uint256 sqSumExt_ = _modexp(mem_, sumExt_, two_, maxModExt_);

        _destruct(mem_, sumExt_, _StackType._EXT_UINT);

        int256 cmp_ = _cmp(mem_, a_, b_);

        uint256 diffExt_ = cmp_ >= 0 ? _sub(mem_, aExt_, bExt_) : _sub(mem_, bExt_, aExt_);

        uint256 sqDiffExt_ = _modexp(mem_, diffExt_, two_, maxModExt_);

        _destruct(mem_, aExt_, _StackType._EXT_UINT);
        _destruct(mem_, bExt_, _StackType._EXT_UINT);
        _destruct(mem_, two_, _StackType._UINT);
        _destruct(mem_, maxModExt_, _StackType._EXT_UINT);
        _destruct(mem_, diffExt_, _StackType._EXT_UINT);

        r_ = _sub(mem_, sqSumExt_, sqDiffExt_);

        _destruct(mem_, sqSumExt_, _StackType._EXT_UINT);
        _destruct(mem_, sqDiffExt_, _StackType._EXT_UINT);

        assembly {
            let rSize_ := mload(r_)
            let rPtr_ := add(r_, rSize_)

            for {
                let i := 0x20
            } lt(i, rSize_) {
                i := add(i, 0x20)
            } {
                let rPtrNext_ := sub(rPtr_, 0x20)
                let rWord_ := mload(rPtr_)
                let rWordNext_ := mload(rPtrNext_)

            /// @dev (rWord_ >> 2) | (rWordNext_ << 254)
                mstore(rPtr_, or(shr(2, rWord_), shl(254, rWordNext_)))

                rPtr_ := rPtrNext_
            }

            mstore(rPtr_, shr(2, mload(rPtr_)))
        }
    }

    function _mod(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 m_
    ) private view returns (uint256 r_) {
        uint256 one_ = _newUint(mem_, 1);

        r_ = _modexp(mem_, a_, one_, m_);

        _destruct(mem_, one_, _StackType._UINT);
    }

    /// @dev a_, e_, m_ can be of different sizes
    function _modexp(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 e_,
        uint256 m_
    ) private view returns (uint256 r_) {
        r_ = _new(mem_, _valueType(mem_, m_));
        uint256 call_ = _new(mem_, _StackType._CALL);

        assembly {
            let aSize_ := mload(a_)
            let eSize_ := mload(e_)
            let mSize_ := mload(m_)

            mstore(call_, aSize_)
            mstore(add(call_, 0x20), eSize_)
            mstore(add(call_, 0x40), mSize_)

            let offset_ := 0x60

            if iszero(staticcall(gas(), 0x4, add(a_, 0x20), aSize_, add(call_, offset_), aSize_)) {
                revert(0, 0)
            }

            offset_ := add(offset_, aSize_)

            if iszero(staticcall(gas(), 0x4, add(e_, 0x20), eSize_, add(call_, offset_), eSize_)) {
                revert(0, 0)
            }

            offset_ := add(offset_, eSize_)

            if iszero(staticcall(gas(), 0x4, add(m_, 0x20), mSize_, add(call_, offset_), mSize_)) {
                revert(0, 0)
            }

            offset_ := add(offset_, mSize_)

            mstore(r_, mSize_)

            if iszero(staticcall(gas(), 0x5, call_, offset_, add(r_, 0x20), mSize_)) {
                revert(0, 0)
            }
        }

        _destruct(mem_, call_, _StackType._CALL);
    }

    function _modinv(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 m_
    ) private view returns (uint256 r_) {
        uint256 two_ = _newUint(mem_, 2);

        require(_cmp(mem_, m_, two_) >= 0, "MU: invalid modulus");

        uint256 exponent_ = _sub(mem_, m_, two_);

        _destruct(mem_, two_, _StackType._UINT);

        r_ = _modexp(mem_, a_, exponent_, m_);

        _destruct(mem_, exponent_, _StackType._UINT);
    }

    /// @dev a_ and b_ are of the same size
    function _cmp(
        SharedMemory memory mem_,
        uint256 a_,
        uint256 b_
    ) private view returns (int256 cmp_) {
        assembly {
            let aSize_ := mload(a_)
            let aPtr_ := add(a_, 0x20)
            let bPtr_ := add(b_, 0x20)

            for {
                let i := 0
            } lt(i, aSize_) {
                i := add(i, 0x20)
            } {
                let aWord_ := add(aPtr_, i)
                let bWord_ := add(bPtr_, i)

                if gt(aWord_, bWord_) {
                    cmp_ := 1
                    break
                }

                if gt(bWord_, aWord_) {
                    cmp_ := sub(0, 1)
                    break
                }
            }
        }

        return cmp_;
    }

    function _extend(
        SharedMemory memory mem_,
        uint256 value_
    ) private view returns (uint256 valueExt_) {
        valueExt_ = _new(mem_, _StackType._EXT_UINT);

        uint256 memSize_ = _memSize(mem_, _StackType._UINT);
        uint256 extMemSize_ = _memSize(mem_, _StackType._EXT_UINT);

        assembly {
            mstore(valueExt_, extMemSize_)

            let offset_ := sub(extMemSize_, memSize_)

            if iszero(
                staticcall(
                    gas(),
                    0x4,
                    add(value_, 0x20),
                    memSize_,
                    add(add(valueExt_, 0x20), offset_),
                    memSize_
                )
            ) {
                revert(0, 0)
            }
        }
    }

    function _cut(SharedMemory memory mem_, uint256 a_) private view returns (uint256 r_) {
        r_ = _new(mem_, _StackType._UINT);

        uint256 memSize_ = _memSize(mem_, _StackType._UINT);
        uint256 extMemSize_ = _memSize(mem_, _StackType._EXT_UINT);

        assembly {
            mstore(r_, memSize_)

            let offset_ := add(sub(extMemSize_, memSize_), 0x20)

            if iszero(
                staticcall(gas(), 0x4, add(a_, offset_), memSize_, add(r_, 0x20), memSize_)
            ) {
                revert(0, 0)
            }
        }
    }

    enum _StackType {
        _UINT,
        _EXT_UINT,
        _CALL
    }

    function _checkMemory(SharedMemory memory mem_, uint256 bytesCount_) private view {
        require(mem_.stack.elementSize == bytesCount_, "MU: invalid memory");
    }

    function _new(
        SharedMemory memory mem_,
        _StackType stackType_
    ) private view returns (uint256 value_) {
        if (stackType_ == _StackType._UINT) {
            return mem_.stack.push0();
        }

        if (stackType_ == _StackType._EXT_UINT) {
            return mem_.extStack.push0();
        }

        return mem_.callStack.push0();
    }

    function _destruct(
        SharedMemory memory mem_,
        uint256 value_,
        _StackType stackType_
    ) private view {
        if (stackType_ == _StackType._UINT) {
            mem_.stack.pop(value_);
            return;
        }

        if (stackType_ == _StackType._EXT_UINT) {
            mem_.extStack.pop(value_);
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

        if (stackType_ == _StackType._EXT_UINT) {
            return mem_.extStack.elementSize;
        }

        return mem_.callStack.elementSize;
    }

    function _valueType(
        SharedMemory memory mem_,
        uint256 value_
    ) private view returns (_StackType) {
        uint256 length_;
        assembly {
            length_ := mload(value_)
        }

        if (length_ == mem_.stack.elementSize) {
            return _StackType._UINT;
        }

        if (length_ == mem_.extStack.elementSize) {
            return _StackType._EXT_UINT;
        }

        return _StackType._CALL;
    }

    function _newUint(SharedMemory memory mem_, uint256 value_) private view returns (uint256 r_) {
        uint256 memSize_ = _memSize(mem_, _StackType._UINT);

        r_ = _new(mem_, _StackType._UINT);

        assembly {
            mstore(r_, memSize_)
            mstore(add(r_, memSize_), value_)
        }
    }

    function _newMaxUint(SharedMemory memory mem_) private view returns (uint256 r_) {
        uint256 extMemSize_ = _memSize(mem_, _StackType._EXT_UINT);

        r_ = _new(mem_, _StackType._EXT_UINT);

        assembly {
            mstore(r_, extMemSize_)

            for {
                let i := 0
            } lt(i, extMemSize_) {
                i := add(i, 0x20)
            } {
                mstore(add(r_, add(i, 0x20)), sub(0, 1))
            }
        }
    }

    function _initUint(
        SharedMemory memory mem_,
        bytes memory data_
    ) private view returns (uint256 r_) {
        r_ = _new(mem_, _StackType._UINT);

        uint256 uSize_ = _memSize(mem_, _StackType._UINT);

        assembly {
            let dataSize_ := mload(data_)
            let offset_ := sub(uSize_, dataSize_)

            mstore(r_, uSize_)

            let success_ := staticcall(
                gas(),
                0x4,
                add(data_, 0x20),
                dataSize_,
                add(add(r_, 0x20), offset_),
                dataSize_
            )
            if iszero(success_) {
                revert(0, 0)
            }
        }
    }
}
