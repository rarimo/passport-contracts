// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

library U384 {
    uint256 private constant SHORT_ALLOCATION = 64;
    uint256 private constant LONG_ALLOCATION = 96;
    uint256 private constant CALL_ALLOCATION = 288;

    function init(uint256 from_) internal pure returns (uint256 handler_) {
        unchecked {
            handler_ = _allocate(SHORT_ALLOCATION);

            assembly {
                mstore(handler_, 0x00)
                mstore(add(0x20, handler_), from_)
            }

            return handler_;
        }
    }

    function init(bytes memory from_) internal pure returns (uint256 handler_) {
        unchecked {
            require(from_.length == 48, "U384: not 384");

            handler_ = _allocate(SHORT_ALLOCATION);

            assembly {
                mstore(handler_, 0x00)
                mstore(add(handler_, 0x10), mload(add(from_, 0x20)))
                mstore(add(handler_, 0x20), mload(add(from_, 0x30)))
            }

            return handler_;
        }
    }

    function init2(bytes memory from2_) internal pure returns (uint256 handler1_, uint256 handler2_) {
        unchecked {
            require(from2_.length == 96, "U384: not 768");

            handler1_ = _allocate(SHORT_ALLOCATION);
            handler2_ = _allocate(SHORT_ALLOCATION);

            assembly {
                mstore(handler1_, 0x00)
                mstore(add(handler1_, 0x10), mload(add(from2_, 0x20)))
                mstore(add(handler1_, 0x20), mload(add(from2_, 0x30)))

                mstore(handler2_, 0x00)
                mstore(add(handler2_, 0x10), mload(add(from2_, 0x50)))
                mstore(add(handler2_, 0x20), mload(add(from2_, 0x60)))
            }

            return (handler1_, handler2_);
        }
    }

    function assign(uint256 to_, uint256 from_) internal pure {
        assembly {
            mstore(to_, mload(from_))
            mstore(add(to_, 0x20), mload(add(from_, 0x20)))
        }
    }

    function assignInteger(uint256 to_, uint256 fromInteger_) internal pure {
        assembly {
            mstore(to_, 0x00)
            mstore(add(to_, 0x20), fromInteger_)
        }
    }

    function initCall() internal pure returns (uint256 handler_) {
        unchecked {
            return _allocate(CALL_ALLOCATION);
        }
    }

    function copy(uint256 handler_) internal pure returns (uint256 handlerCopy_) {
        unchecked {
            handlerCopy_ = _allocate(SHORT_ALLOCATION);

            assembly {
                mstore(handlerCopy_, mload(handler_))
                mstore(add(handlerCopy_, 0x20), mload(add(handler_, 0x20)))
            }

            return handlerCopy_;
        }
    }

    function eq(uint256 a_, uint256 b_) internal pure returns (bool eq_) {
        assembly {
            eq_ := and(eq(mload(a_), mload(b_)), eq(mload(add(a_, 0x20)), mload(add(b_, 0x20))))
        }
    }

    function eqInteger(uint256 a_, uint256 bInteger_) internal pure returns (bool eq_) {
        assembly {
            eq_ := and(eq(mload(a_), 0), eq(mload(add(a_, 0x20)), bInteger_))
        }
    }

    function cmp(uint256 a_, uint256 b_) internal pure returns (int256 cmp_) {
        unchecked {
            uint256 aWord_;
            uint256 bWord_;

            assembly {
                aWord_ := mload(a_)
                bWord_ := mload(b_)
            }

            if (aWord_ > bWord_) {
                return 1;
            }

            if (aWord_ < bWord_) {
                return -1;
            }

            assembly {
                aWord_ := mload(add(a_, 0x20))
                bWord_ := mload(add(b_, 0x20))
            }

            if (aWord_ > bWord_) {
                return 1;
            }

            if (aWord_ < bWord_) {
                return -1;
            }
        }
    }

    function cmpInteger(uint256 a_, uint256 bInteger_) internal pure returns (int256 cmp_) {
        unchecked {
            uint256 aWord_;

            assembly {
                aWord_ := mload(a_)
            }

            if (aWord_ > 0) {
                return 1;
            }

            assembly {
                aWord_ := mload(add(a_, 0x20))
            }

            if (aWord_ > bInteger_) {
                return 1;
            }

            if (aWord_ < bInteger_) {
                return -1;
            }
        }
    }

    function modexp(
        uint256 call_,
        uint256 b_,
        uint256 eInteger_,
        uint256 m_
    ) internal view returns (uint256 r_) {
        unchecked {
            r_ = _allocate(SHORT_ALLOCATION);

            assembly {
                mstore(call_, 0x40)
                mstore(add(0x20, call_), 0x20)
                mstore(add(0x40, call_), 0x40)
                mstore(add(0x60, call_), mload(b_))
                mstore(add(0x80, call_), mload(add(b_, 0x20)))
                mstore(add(0xA0, call_), eInteger_)
                mstore(add(0xC0, call_), mload(m_))
                mstore(add(0xE0, call_), mload(add(m_, 0x20)))

                pop(staticcall(gas(), 0x5, call_, 0x0100, r_, 0x40))
            }

            return r_;
        }
    }

    function modexpAssign(uint256 call_, uint256 b_, uint256 eInteger_, uint256 m_) internal view {
        assembly {
            mstore(call_, 0x40)
            mstore(add(0x20, call_), 0x20)
            mstore(add(0x40, call_), 0x40)
            mstore(add(0x60, call_), mload(b_))
            mstore(add(0x80, call_), mload(add(b_, 0x20)))
            mstore(add(0xA0, call_), eInteger_)
            mstore(add(0xC0, call_), mload(m_))
            mstore(add(0xE0, call_), mload(add(m_, 0x20)))

            pop(staticcall(gas(), 0x5, call_, 0x0100, b_, 0x40))
        }
    }

    function modexpAssignTo(
        uint256 call_,
        uint256 to_,
        uint256 b_,
        uint256 eInteger_,
        uint256 m_
    ) internal view {
        assembly {
            mstore(call_, 0x40)
            mstore(add(0x20, call_), 0x20)
            mstore(add(0x40, call_), 0x40)
            mstore(add(0x60, call_), mload(b_))
            mstore(add(0x80, call_), mload(add(b_, 0x20)))
            mstore(add(0xA0, call_), eInteger_)
            mstore(add(0xC0, call_), mload(m_))
            mstore(add(0xE0, call_), mload(add(m_, 0x20)))

            pop(staticcall(gas(), 0x5, call_, 0x0100, to_, 0x40))
        }
    }

    function modadd(
        uint256 call_,
        uint256 a_,
        uint256 b_,
        uint256 m_
    ) internal view returns (uint256 r_) {
        unchecked {
            r_ = _allocate(SHORT_ALLOCATION);

            _add(a_, b_, call_ + 0x60);

            assembly {
                mstore(call_, 0x40)
                mstore(add(0x20, call_), 0x20)
                mstore(add(0x40, call_), 0x40)
                mstore(add(0xA0, call_), 0x01)
                mstore(add(0xC0, call_), mload(m_))
                mstore(add(0xE0, call_), mload(add(m_, 0x20)))

                pop(staticcall(gas(), 0x5, call_, 0x0100, r_, 0x40))
            }

            return r_;
        }
    }

    function modaddAssign(uint256 call_, uint256 a_, uint256 b_, uint256 m_) internal view {
        unchecked {
            _add(a_, b_, call_ + 0x60);

            assembly {
                mstore(call_, 0x40)
                mstore(add(0x20, call_), 0x20)
                mstore(add(0x40, call_), 0x40)
                mstore(add(0xA0, call_), 0x01)
                mstore(add(0xC0, call_), mload(m_))
                mstore(add(0xE0, call_), mload(add(m_, 0x20)))

                pop(staticcall(gas(), 0x5, call_, 0x0100, a_, 0x40))
            }
        }
    }

    function modaddAssignTo(
        uint256 call_,
        uint256 to_,
        uint256 a_,
        uint256 b_,
        uint256 m_
    ) internal view {
        unchecked {
            _add(a_, b_, call_ + 0x60);

            assembly {
                mstore(call_, 0x40)
                mstore(add(0x20, call_), 0x20)
                mstore(add(0x40, call_), 0x40)
                mstore(add(0xA0, call_), 0x01)
                mstore(add(0xC0, call_), mload(m_))
                mstore(add(0xE0, call_), mload(add(m_, 0x20)))

                pop(staticcall(gas(), 0x5, call_, 0x0100, to_, 0x40))
            }
        }
    }

    function mod(uint256 call_, uint256 a_, uint256 m_) internal view returns (uint256 r_) {
        unchecked {
            r_ = modexp(call_, a_, 1, m_);

            return r_;
        }
    }

    function modsub(
        uint256 call_,
        uint256 a_,
        uint256 b_,
        uint256 m_
    ) internal view returns (uint256 r_) {
        unchecked {
            r_ = _allocate(SHORT_ALLOCATION);

            _sub(a_, b_, call_ + 0x60);

            assembly {
                mstore(call_, 0x40)
                mstore(add(0x20, call_), 0x20)
                mstore(add(0x40, call_), 0x40)
                mstore(add(0xA0, call_), 0x01)
                mstore(add(0xC0, call_), mload(m_))
                mstore(add(0xE0, call_), mload(add(m_, 0x20)))

                pop(staticcall(gas(), 0x5, call_, 0x0100, r_, 0x40))
            }

            return r_;
        }
    }

    function modmul(
        uint256 call_,
        uint256 a_,
        uint256 b_,
        uint256 m_
    ) internal view returns (uint256 r_) {
        unchecked {
            r_ = _allocate(SHORT_ALLOCATION);

            _mul(a_, b_, call_ + 0x60);

            assembly {
                mstore(call_, 0x60)
                mstore(add(0x20, call_), 0x20)
                mstore(add(0x40, call_), 0x40)
                mstore(add(0xC0, call_), 0x01)
                mstore(add(0xE0, call_), mload(m_))
                mstore(add(0x0100, call_), mload(add(m_, 0x20)))

                pop(staticcall(gas(), 0x5, call_, 0x0120, r_, 0x40))
            }

            return r_;
        }
    }

    function modmulAssign(uint256 call_, uint256 a_, uint256 b_, uint256 m_) internal view {
        unchecked {
            _mul(a_, b_, call_ + 0x60);

            assembly {
                mstore(call_, 0x60)
                mstore(add(0x20, call_), 0x20)
                mstore(add(0x40, call_), 0x40)
                mstore(add(0xC0, call_), 0x01)
                mstore(add(0xE0, call_), mload(m_))
                mstore(add(0x0100, call_), mload(add(m_, 0x20)))

                pop(staticcall(gas(), 0x5, call_, 0x0120, a_, 0x40))
            }
        }
    }

    function modmulAssignTo(
        uint256 call_,
        uint256 to_,
        uint256 a_,
        uint256 b_,
        uint256 m_
    ) internal view {
        unchecked {
            _mul(a_, b_, call_ + 0x60);

            assembly {
                mstore(call_, 0x60)
                mstore(add(0x20, call_), 0x20)
                mstore(add(0x40, call_), 0x40)
                mstore(add(0xC0, call_), 0x01)
                mstore(add(0xE0, call_), mload(m_))
                mstore(add(0x0100, call_), mload(add(m_, 0x20)))

                pop(staticcall(gas(), 0x5, call_, 0x0120, to_, 0x40))
            }
        }
    }

    function modinv(uint256 call_, uint256 b_, uint256 m_) internal view returns (uint256 r_) {
        unchecked {
            r_ = _allocate(SHORT_ALLOCATION);

            _sub(m_, init(2), call_ + 0xA0);

            assembly {
                mstore(call_, 0x40)
                mstore(add(0x20, call_), 0x40)
                mstore(add(0x40, call_), 0x40)
                mstore(add(0x60, call_), mload(b_))
                mstore(add(0x80, call_), mload(add(b_, 0x20)))
                mstore(add(0xE0, call_), mload(m_))
                mstore(add(0x0100, call_), mload(add(m_, 0x20)))

                pop(staticcall(gas(), 0x5, call_, 0x0120, r_, 0x40))
            }
        }
    }

    function moddiv(
        uint256 call_,
        uint256 a_,
        uint256 b_,
        uint256 m_
    ) internal view returns (uint256 r_) {
        unchecked {
            r_ = _allocate(SHORT_ALLOCATION);

            _sub(m_, init(2), call_ + 0xA0);

            assembly {
                mstore(call_, 0x40)
                mstore(add(0x20, call_), 0x40)
                mstore(add(0x40, call_), 0x40)
                mstore(add(0x60, call_), mload(b_))
                mstore(add(0x80, call_), mload(add(b_, 0x20)))
                mstore(add(0xE0, call_), mload(m_))
                mstore(add(0x0100, call_), mload(add(m_, 0x20)))

                pop(staticcall(gas(), 0x5, call_, 0x0120, r_, 0x40))
            }

            return modmul(call_, a_, r_, m_);
        }
    }

    function add(uint256 a_, uint256 b_) internal pure returns (uint256 r_) {
        unchecked {
            r_ = _allocate(SHORT_ALLOCATION);

            _add(a_, b_, r_);

            return r_;
        }
    }

    function sub(uint256 a_, uint256 b_) internal pure returns (uint256 r_) {
        unchecked {
            r_ = _allocate(SHORT_ALLOCATION);

            _sub(a_, b_, r_);

            return r_;
        }
    }

    function subAssignTo(uint256 to_, uint256 a_, uint256 b_) internal pure {
        unchecked {
            _sub(a_, b_, to_);
        }
    }

    function toBytes(uint256 handler_) internal pure returns (bytes memory bytes_) {
        unchecked {
            uint256 bytesHandler_ = _allocate(LONG_ALLOCATION);

            assembly {
                bytes_ := bytesHandler_

                mstore(bytes_, 0x40)
                mstore(add(0x20, bytes_), mload(handler_))
                mstore(add(0x40, bytes_), mload(add(handler_, 0x20)))
            }

            return bytes_;
        }
    }

    function modshl1(uint256 call_, uint256 a_, uint256 m_) internal view returns (uint256 r_) {
        unchecked {
            r_ = _allocate(SHORT_ALLOCATION);

            _shl1(a_, call_ + 0x60);

            assembly {
                mstore(call_, 0x40)
                mstore(add(0x20, call_), 0x20)
                mstore(add(0x40, call_), 0x40)
                mstore(add(0xA0, call_), 0x01)
                mstore(add(0xC0, call_), mload(m_))
                mstore(add(0xE0, call_), mload(add(m_, 0x20)))

                pop(staticcall(gas(), 0x5, call_, 0x0100, r_, 0x40))
            }
        }
    }

    function modshl1Assign(uint256 call_, uint256 a_, uint256 m_) internal view {
        unchecked {
            _shl1(a_, call_ + 0x60);

            assembly {
                mstore(call_, 0x40)
                mstore(add(0x20, call_), 0x20)
                mstore(add(0x40, call_), 0x40)
                mstore(add(0xA0, call_), 0x01)
                mstore(add(0xC0, call_), mload(m_))
                mstore(add(0xE0, call_), mload(add(m_, 0x20)))

                pop(staticcall(gas(), 0x5, call_, 0x0100, a_, 0x40))
            }
        }
    }

    function modshl1AssignTo(uint256 call_, uint256 to_, uint256 a_, uint256 m_) internal view {
        unchecked {
            _shl1(a_, call_ + 0x60);

            assembly {
                mstore(call_, 0x40)
                mstore(add(0x20, call_), 0x20)
                mstore(add(0x40, call_), 0x40)
                mstore(add(0xA0, call_), 0x01)
                mstore(add(0xC0, call_), mload(m_))
                mstore(add(0xE0, call_), mload(add(m_, 0x20)))

                pop(staticcall(gas(), 0x5, call_, 0x0100, to_, 0x40))
            }
        }
    }

    function _shl1(uint256 a_, uint256 r_) internal pure {
        assembly {
            let a0_ := mload(a_)
            let a1_ := mload(add(a_, 0x20))

            mstore(r_, or(shl(1, a0_), shr(255, a1_)))
            mstore(add(r_, 0x20), shl(1, a1_))
        }
    }

    function _add(uint256 a_, uint256 b_, uint256 r_) private pure {
        assembly {
            let aWord_ := mload(add(a_, 0x20))
            let sum_ := add(aWord_, mload(add(b_, 0x20)))

            mstore(add(r_, 0x20), sum_)

            sum_ := gt(aWord_, sum_)
            sum_ := add(sum_, add(mload(a_), mload(b_)))

            mstore(r_, sum_)
        }
    }

    function _sub(uint256 a_, uint256 b_, uint256 r_) private pure {
        assembly {
            let aWord_ := mload(add(a_, 0x20))
            let diff_ := sub(aWord_, mload(add(b_, 0x20)))

            mstore(add(r_, 0x20), diff_)

            diff_ := gt(diff_, aWord_)
            diff_ := sub(sub(mload(a_), mload(b_)), diff_)

            mstore(r_, diff_)
        }
    }

    function _mul(uint256 a_, uint256 b_, uint256 r_) private view {
        assembly {
            let a0_ := mload(a_)
            let a1_ := shr(128, mload(add(a_, 0x20)))
            let a2_ := and(mload(add(a_, 0x20)), 0xffffffffffffffffffffffffffffffff)

            let b0_ := mload(b_)
            let b1_ := shr(128, mload(add(b_, 0x20)))
            let b2_ := and(mload(add(b_, 0x20)), 0xffffffffffffffffffffffffffffffff)

            // r5
            let current_ := mul(a2_, b2_)
            let r0_ := and(current_, 0xffffffffffffffffffffffffffffffff)

            // r4
            current_ := shr(128, current_)

            let temp_ := mul(a1_, b2_)
            current_ := add(current_, temp_)
            let curry_ := lt(current_, temp_)

            temp_ := mul(a2_, b1_)
            current_ := add(current_, temp_)
            curry_ := add(curry_, lt(current_, temp_))

            mstore(add(r_, 0x40), add(shl(128, current_), r0_))

            // r3
            current_ := add(shl(128, curry_), shr(128, current_))
            curry_ := callvalue() // same as := 0 but less expensive

            temp_ := mul(a0_, b2_)
            current_ := add(current_, temp_)
            curry_ := lt(current_, temp_)

            temp_ := mul(a1_, b1_)
            current_ := add(current_, temp_)
            curry_ := add(curry_, lt(current_, temp_))

            temp_ := mul(a2_, b0_)
            current_ := add(current_, temp_)
            curry_ := add(curry_, lt(current_, temp_))

            r0_ := and(current_, 0xffffffffffffffffffffffffffffffff)

            // r2
            current_ := add(shl(128, curry_), shr(128, current_))
            curry_ := callvalue()

            temp_ := mul(a0_, b1_)
            current_ := add(current_, temp_)
            curry_ := lt(current_, temp_)

            temp_ := mul(a1_, b0_)
            current_ := add(current_, temp_)
            curry_ := add(curry_, lt(current_, temp_))

            mstore(add(r_, 0x20), add(shl(128, current_), r0_))

            // r1
            current_ := add(shl(128, curry_), shr(128, current_))
            current_ := add(current_, mul(a0_, b0_))

            mstore(r_, current_)
        }
    }

    function _allocate(uint256 bytes_) private pure returns (uint256 handler_) {
        unchecked {
            assembly {
                handler_ := mload(0x40)
                mstore(0x40, add(handler_, bytes_))
            }

            return handler_;
        }
    }
}
