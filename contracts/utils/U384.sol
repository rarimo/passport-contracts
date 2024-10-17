// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

library U384 {
    uint256 private constant SHORT_ALLOCATION = 64;
    uint256 private constant CALL_ALLOCATION = 288;

    function init(uint256 from_) internal pure returns (uint256 handler_) {
        handler_ = _allocate(SHORT_ALLOCATION);

        assembly {
            mstore(add(0x20, handler_), from_)
        }

        return handler_;
    }

    function init(bytes memory from_) internal view returns (uint256 handler_) {
        handler_ = _allocate(SHORT_ALLOCATION);

        assembly {
            mstore(handler_, mload(add(from_, 0x20)))
            mstore(add(handler_, 0x20), mload(add(from_, 0x40)))
        }

        return handler_;
    }

    function cmp(uint256 a_, uint256 b_) internal pure returns (int256 cmp_) {
        assembly {
            let aWord_ := mload(a_)
            let bWord_ := mload(b_)

            if gt(aWord_, bWord_) {
                mstore(0x00, 0x01)
                return(0x00, 0x20)
            }

            if lt(aWord_, bWord_) {
                mstore(0x00, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
                return(0x00, 0x20)
            }

            aWord_ := mload(add(a_, 0x20))
            bWord_ := mload(add(b_, 0x20))

            if gt(aWord_, bWord_) {
                mstore(0x00, 0x01)
                return(0x00, 0x20)
            }

            if lt(aWord_, bWord_) {
                mstore(0x00, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
                return(0x00, 0x20)
            }

            mstore(0x00, 0x00)
            return(0x00, 0x20)
        }
    }

    function modexp(uint256 b_, uint256 eInteger_, uint256 m_) internal view returns (uint256 r_) {
        r_ = _allocate(CALL_ALLOCATION);

        assembly {
            mstore(r_, 0x40)
            mstore(add(0x20, r_), 0x20)
            mstore(add(0x40, r_), 0x40)
            mstore(add(0x60, r_), mload(b_))
            mstore(add(0x80, r_), mload(add(b_, 0x20)))
            mstore(add(0xA0, r_), eInteger_)
            mstore(add(0xC0, r_), mload(m_))
            mstore(add(0xE0, r_), mload(add(m_, 0x20)))

            if iszero(staticcall(gas(), 0x5, r_, 0x0100, r_, 0x40)) {
                revert(0, 0)
            }
        }

        return r_;
    }

    function modadd(uint256 a_, uint256 b_, uint256 m_) internal view returns (uint256 r_) {
        r_ = _allocate(CALL_ALLOCATION);

        _add(a_, b_, r_ + 0x60);

        assembly {
            mstore(r_, 0x40)
            mstore(add(0x20, r_), 0x20)
            mstore(add(0x40, r_), 0x40)
            mstore(add(0xA0, r_), 0x01)
            mstore(add(0xC0, r_), mload(m_))
            mstore(add(0xE0, r_), mload(add(m_, 0x20)))

            if iszero(staticcall(gas(), 0x5, r_, 0x0100, r_, 0x40)) {
                revert(0, 0)
            }
        }

        return r_;
    }

    function mod(uint256 a_, uint256 m_) internal view returns (uint256 r_) {
        r_ = modexp(a_, 1, m_);

        return r_;
    }

    function modsub(uint256 a_, uint256 b_, uint256 m_) internal view returns (uint256 r_) {
        r_ = _allocate(CALL_ALLOCATION);

        _sub(a_, b_, r_ + 0x60);

        assembly {
            mstore(r_, 0x40)
            mstore(add(0x20, r_), 0x20)
            mstore(add(0x40, r_), 0x40)
            mstore(add(0xA0, r_), 0x01)
            mstore(add(0xC0, r_), mload(m_))
            mstore(add(0xE0, r_), mload(add(m_, 0x20)))

            if iszero(staticcall(gas(), 0x5, r_, 0x0100, r_, 0x40)) {
                revert(0, 0)
            }
        }

        return r_;
    }

    function modmul(uint256 a_, uint256 b_, uint256 m_) internal view returns (uint256 r_) {
        r_ = _allocate(CALL_ALLOCATION);

        _mul(a_, b_, r_ + 0x60);

        assembly {
            mstore(r_, 0x60)
            mstore(add(0x20, r_), 0x20)
            mstore(add(0x40, r_), 0x40)
            mstore(add(0xC0, r_), 0x01)
            mstore(add(0xE0, r_), mload(m_))
            mstore(add(0x0100, r_), mload(add(m_, 0x20)))

            if iszero(staticcall(gas(), 0x5, r_, 0x0120, r_, 0x40)) {
                revert(0, 0)
            }
        }

        return r_;
    }

    function add(uint256 a_, uint256 b_) internal pure returns (uint256 r_) {
        r_ = _allocate(SHORT_ALLOCATION);

        _add(a_, b_, r_);

        return r_;
    }

    function sub(uint256 a_, uint256 b_) internal pure returns (uint256 r_) {
        r_ = _allocate(SHORT_ALLOCATION);

        _sub(a_, b_, r_);

        return r_;
    }

    function toBytes(uint256 handler_) internal pure returns (bytes memory bytes_) {
        assembly {
            mstore(bytes_, 0x40)
            mstore(add(0x20, bytes_), mload(handler_))
            mstore(add(0x40, bytes_), mload(add(handler_, 0x20)))
        }

        return bytes_;
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
            function high128(x) -> y {
                y := shr(128, x)
            }

            function low128(x) -> y {
                y := and(x, 0xffffffffffffffffffffffffffffffff)
            }

            let a0_ := mload(a_)
            let a1_ := high128(mload(add(a_, 0x20)))
            let a2_ := low128(mload(add(a_, 0x20)))

            let b0_ := mload(b_)
            let b1_ := high128(mload(add(b_, 0x20)))
            let b2_ := low128(mload(add(b_, 0x20)))

            // r5
            let current_ := mul(a2_, b2_)
            let r5_ := low128(current_)

            // r4
            current_ := shr(128, current_)

            let temp_ := mul(a1_, b2_)
            current_ := add(current_, temp_)
            let curry_ := lt(current_, temp_)

            temp_ := mul(a2_, b1_)
            current_ := add(current_, temp_)
            curry_ := add(curry_, lt(current_, temp_))

            let r4_ := low128(current_)

            // r3
            current_ := add(shl(128, curry_), shr(128, current_))
            curry_ := 0

            temp_ := mul(a0_, b2_)
            current_ := add(current_, temp_)
            curry_ := lt(current_, temp_)

            temp_ := mul(a1_, b1_)
            current_ := add(current_, temp_)
            curry_ := add(curry_, lt(current_, temp_))

            temp_ := mul(a2_, b0_)
            current_ := add(current_, temp_)
            curry_ := add(curry_, lt(current_, temp_))

            let r3_ := low128(current_)

            // r2
            current_ := add(shl(128, curry_), shr(128, current_))
            curry_ := 0

            temp_ := mul(a0_, b1_)
            current_ := add(current_, temp_)
            curry_ := lt(current_, temp_)

            temp_ := mul(a1_, b0_)
            current_ := add(current_, temp_)
            curry_ := add(curry_, lt(current_, temp_))

            let r2_ := low128(current_)

            // r1
            current_ := add(shl(128, curry_), shr(128, current_))
            curry_ := 0

            temp_ := mul(a0_, b0_)
            current_ := add(current_, temp_)
            curry_ := lt(current_, temp_)

            let r1_ := low128(current_)

            // r0
            let r0_ := shr(128, current_)

            mstore(r_, add(shl(128, r0_), r1_))
            mstore(add(r_, 0x20), add(shl(128, r2_), r3_))
            mstore(add(r_, 0x40), add(shl(128, r4_), r5_))
        }
    }

    function _allocate(uint256 bytes_) private pure returns (uint256 handler_) {
        assembly {
            handler_ := mload(0x40)
            mstore(0x40, add(handler_, bytes_))
        }

        return handler_;
    }
}
