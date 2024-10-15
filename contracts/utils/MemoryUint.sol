// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {MemoryStack} from "./MemoryStack.sol";
import "hardhat/console.sol";
library MemoryUint {
    using MemoryStack for *;

    struct SharedMemory {
        MemoryStack.Stack stack;
        MemoryStack.Stack extStack;
        MemoryStack.Stack callStack;
    }

    struct Uint512 {
        MemoryStack.StackValue data;
    }

    function newUint512SharedMemory() internal view returns (SharedMemory memory mem_) {
        mem_.stack = MemoryStack.init(64);
        mem_.extStack = MemoryStack.init(160);
        mem_.callStack = MemoryStack.init(1024);

        return mem_;
    }

    function newUint512(
        SharedMemory memory mem_,
        bytes memory data_
    ) internal view returns (Uint512 memory u512_) {
        require(data_.length <= 64, "MU: data is too large");
        _checkMemory(mem_, 64);

        /// TODO: Can we pass here mem as a pointer?
        return Uint512(_initUint(mem_, data_));
    }

    function destruct(SharedMemory memory mem_, Uint512 memory u512_) internal view {
        _destruct(mem_, u512_.data, _StackType._UINT);
    }

    function add(
        SharedMemory memory mem_,
        Uint512 memory a_,
        Uint512 memory b_
    ) internal view returns (Uint512 memory r_) {
        _checkMemory(mem_, 64);

        return Uint512(_add(mem_, a_.data, b_.data));
    }

    function sub(
        SharedMemory memory mem_,
        Uint512 memory a_,
        Uint512 memory b_
    ) internal view returns (Uint512 memory r_) {
        _checkMemory(mem_, 64);

        return Uint512(_sub(mem_, a_.data, b_.data));
    }

    function mod(
        SharedMemory memory mem_,
        Uint512 memory a_,
        Uint512 memory m_
    ) internal view returns (Uint512 memory r_) {
        _checkMemory(mem_, 64);

        return Uint512(_mod(mem_, a_.data, m_.data));
    }

    function mul(
        SharedMemory memory mem_,
        Uint512 memory a_,
        Uint512 memory b_
    ) internal view returns (Uint512 memory r_) {
        _checkMemory(mem_, 64);

        MemoryStack.StackValue memory rExt_ = _mul(mem_, a_.data, b_.data);

        r_ = Uint512(_cut(mem_, rExt_));

        _destruct(mem_, rExt_, _StackType._EXT_UINT);
    }

    function modadd(
        SharedMemory memory mem_,
        Uint512 memory a_,
        Uint512 memory b_,
        Uint512 memory m_
    ) internal view returns (Uint512 memory r_) {
        _checkMemory(mem_, 64);

        MemoryStack.StackValue memory aExt_ = _extend(mem_, a_.data);
        MemoryStack.StackValue memory bExt_ = _extend(mem_, b_.data);

        MemoryStack.StackValue memory sum_ = _add(mem_, aExt_, bExt_);

        r_ = Uint512(_mod(mem_, sum_, m_.data));

        _destruct(mem_, aExt_, _StackType._EXT_UINT);
        _destruct(mem_, bExt_, _StackType._EXT_UINT);
        _destruct(mem_, sum_, _StackType._EXT_UINT);
    }

    function modsub(
        SharedMemory memory mem_,
        Uint512 memory a_,
        Uint512 memory b_,
        Uint512 memory m_
    ) internal view returns (Uint512 memory r_) {
        _checkMemory(mem_, 64);

        int cmp_ = _cmp(mem_, a_.data, b_.data);

        MemoryStack.StackValue memory diff_ = cmp_ >= 0
            ? _sub(mem_, a_.data, b_.data)
            : _sub(mem_, b_.data, a_.data);
        MemoryStack.StackValue memory modDiff_ = _mod(mem_, diff_, m_.data);

        _destruct(mem_, diff_, _StackType._UINT);

        if (cmp_ >= 0) {
            return Uint512(modDiff_);
        }

        r_ = Uint512(_sub(mem_, m_.data, modDiff_));

        _destruct(mem_, modDiff_, _StackType._UINT);
    }

    function modmul(
        SharedMemory memory mem_,
        Uint512 memory a_,
        Uint512 memory b_,
        Uint512 memory m_
    ) internal view returns (Uint512 memory r_) {
        _checkMemory(mem_, 64);

        MemoryStack.StackValue memory rExt_ = _mul(mem_, a_.data, b_.data);

        r_ = Uint512(_mod(mem_, rExt_, m_.data));

        _destruct(mem_, rExt_, _StackType._EXT_UINT);
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

    function modinv(
        SharedMemory memory mem_,
        Uint512 memory a_,
        Uint512 memory m_
    ) internal view returns (Uint512 memory r_) {
        _checkMemory(mem_, 64);

        return Uint512(_modinv(mem_, a_.data, m_.data));
    }

    function moddiv(
        SharedMemory memory mem_,
        Uint512 memory a_,
        Uint512 memory b_,
        Uint512 memory m_
    ) internal view returns (Uint512 memory r_) {
        _checkMemory(mem_, 64);

        MemoryStack.StackValue memory bInv_ = _modinv(mem_, b_.data, m_.data);
        MemoryStack.StackValue memory rExt_ = _mul(mem_, a_.data, bInv_);

        r_ = Uint512(_mod(mem_, rExt_, m_.data));

        _destruct(mem_, rExt_, _StackType._EXT_UINT);
        _destruct(mem_, bInv_, _StackType._UINT);
    }

    function cmp(
        SharedMemory memory mem_,
        Uint512 memory a_,
        Uint512 memory b_
    ) internal view returns (int) {
        _checkMemory(mem_, 64);

        return _cmp(mem_, a_.data, b_.data);
    }

    /// @dev a_, b_ and r_ are of the same size
    function _add(
        SharedMemory memory mem_,
        MemoryStack.StackValue memory a_,
        MemoryStack.StackValue memory b_
    ) private view returns (MemoryStack.StackValue memory r_) {
        r_ = _new(mem_, _valueType(mem_, a_));

        assembly {
            let memSize_ := mload(mload(a_))

            mstore(mload(r_), memSize_)

            let aPtr_ := add(mload(a_), memSize_)
            let bPtr_ := add(mload(b_), memSize_)
            let rPtr_ := add(mload(r_), memSize_)

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
        MemoryStack.StackValue memory a_,
        MemoryStack.StackValue memory b_
    ) private view returns (MemoryStack.StackValue memory r_) {
        r_ = _new(mem_, _valueType(mem_, a_));

        assembly {
            let memSize_ := mload(mload(a_))

            mstore(mload(r_), memSize_)

            let aPtr_ := add(mload(a_), memSize_)
            let bPtr_ := add(mload(b_), memSize_)
            let rPtr_ := add(mload(r_), memSize_)

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
        MemoryStack.StackValue memory a_,
        MemoryStack.StackValue memory b_
    ) private view returns (MemoryStack.StackValue memory r_) {
        MemoryStack.StackValue memory aExt_ = _extend(mem_, a_);
        MemoryStack.StackValue memory bExt_ = _extend(mem_, b_);

        MemoryStack.StackValue memory sumExt_ = _add(mem_, aExt_, bExt_);

        MemoryStack.StackValue memory two_ = _newUint(mem_, 2);
        MemoryStack.StackValue memory maxModExt_ = _newMaxUint(mem_);

        MemoryStack.StackValue memory sqSumExt_ = _modexp(mem_, sumExt_, two_, maxModExt_);

        _destruct(mem_, sumExt_, _StackType._EXT_UINT);

        int256 cmp_ = _cmp(mem_, a_, b_);

        MemoryStack.StackValue memory diffExt_ = cmp_ >= 0
            ? _sub(mem_, aExt_, bExt_)
            : _sub(mem_, bExt_, aExt_);

        MemoryStack.StackValue memory sqDiffExt_ = _modexp(mem_, diffExt_, two_, maxModExt_);

        _destruct(mem_, aExt_, _StackType._EXT_UINT);
        _destruct(mem_, bExt_, _StackType._EXT_UINT);
        _destruct(mem_, two_, _StackType._UINT);
        _destruct(mem_, maxModExt_, _StackType._EXT_UINT);
        _destruct(mem_, diffExt_, _StackType._EXT_UINT);

        r_ = _sub(mem_, sqSumExt_, sqDiffExt_);

        _destruct(mem_, sqSumExt_, _StackType._EXT_UINT);
        _destruct(mem_, sqDiffExt_, _StackType._EXT_UINT);

        assembly {
            let rSize_ := mload(mload(r_))
            let rPtr_ := add(mload(r_), rSize_)

            for {
                let i := 0x20
            } lt(i, rSize_) {
                i := add(i, 0x20)
            } {
                let rPtrNext_ := sub(rPtr_, 0x20)
                let rWord_ := mload(rPtr_)
                let rWordNext_ := mload(rPtrNext_)

                /// @dev (rWord_ >> 2) | ((rWordNext_ & 3) << 254)
                mstore(rPtr_, or(shr(2, rWord_), shl(254, and(3, rWordNext_))))

                rPtr_ := rPtrNext_
            }

            mstore(rPtr_, shr(2, mload(rPtr_)))
        }
    }

    function _mod(
        SharedMemory memory mem_,
        MemoryStack.StackValue memory a_,
        MemoryStack.StackValue memory m_
    ) private view returns (MemoryStack.StackValue memory r_) {
        MemoryStack.StackValue memory one_ = _newUint(mem_, 1);

        r_ = _modexp(mem_, a_, one_, m_);

        _destruct(mem_, one_, _StackType._UINT);
    }

    /// @dev a_, e_, m_ can be of different sizes
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

    function _modinv(
        SharedMemory memory mem_,
        MemoryStack.StackValue memory a_,
        MemoryStack.StackValue memory m_
    ) private view returns (MemoryStack.StackValue memory r_) {
        MemoryStack.StackValue memory two_ = _newUint(mem_, 2);

        require(_cmp(mem_, m_, two_) >= 0, "MU: invalid modulus");

        MemoryStack.StackValue memory exponent_ = _sub(mem_, m_, two_);

        _destruct(mem_, two_, _StackType._UINT);

        r_ = _modexp(mem_, a_, exponent_, m_);

        _destruct(mem_, exponent_, _StackType._UINT);
    }

    /// @dev a_ and b_ are of the same size
    function _cmp(
        SharedMemory memory mem_,
        MemoryStack.StackValue memory a_,
        MemoryStack.StackValue memory b_
    ) internal view returns (int256) {
        uint256 memSize_ = _memSize(mem_, _valueType(mem_, a_));

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

    function _extend(
        SharedMemory memory mem_,
        MemoryStack.StackValue memory value_
    ) private view returns (MemoryStack.StackValue memory valueExt_) {
        valueExt_ = _new(mem_, _StackType._EXT_UINT);

        uint256 memSize_ = _memSize(mem_, _StackType._UINT);
        uint256 extMemSize_ = _memSize(mem_, _StackType._EXT_UINT);

        assembly {
            mstore(mload(valueExt_), extMemSize_)

            let offset_ := sub(extMemSize_, memSize_)

            if iszero(
                staticcall(
                    gas(),
                    0x4,
                    add(mload(value_), 0x20),
                    memSize_,
                    add(add(mload(valueExt_), 0x20), offset_),
                    memSize_
                )
            ) {
                revert(0, 0)
            }
        }
    }

    function _cut(
        SharedMemory memory mem_,
        MemoryStack.StackValue memory a_
    ) private view returns (MemoryStack.StackValue memory r_) {
        r_ = _new(mem_, _StackType._UINT);

        uint256 memSize_ = _memSize(mem_, _StackType._UINT);
        uint256 extMemSize_ = _memSize(mem_, _StackType._EXT_UINT);

        assembly {
            mstore(mload(r_), memSize_)

            let offset_ := add(sub(extMemSize_, memSize_), 0x20)

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
    ) private view returns (MemoryStack.StackValue memory value_) {
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
        MemoryStack.StackValue memory value_,
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
        MemoryStack.StackValue memory value_
    ) private view returns (_StackType) {
        if (value_.value.length == mem_.stack.elementSize) {
            return _StackType._UINT;
        }

        if (value_.value.length == mem_.extStack.elementSize) {
            return _StackType._EXT_UINT;
        }

        return _StackType._CALL;
    }

    function _newUint(
        SharedMemory memory mem_,
        uint256 value_
    ) private view returns (MemoryStack.StackValue memory r_) {
        uint256 memSize_ = _memSize(mem_, _StackType._UINT);

        r_ = _new(mem_, _StackType._UINT);

        assembly {
            mstore(mload(r_), memSize_)
            mstore(add(mload(r_), memSize_), value_)
        }
    }

    function _newMaxUint(
        SharedMemory memory mem_
    ) private view returns (MemoryStack.StackValue memory r_) {
        uint256 extMemSize_ = _memSize(mem_, _StackType._EXT_UINT);

        r_ = _new(mem_, _StackType._EXT_UINT);

        assembly {
            mstore(mload(r_), extMemSize_)

            for {
                let i := 0
            } lt(i, extMemSize_) {
                i := add(i, 0x20)
            } {
                mstore(add(mload(r_), add(i, 0x20)), sub(0, 1))
            }
        }
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
