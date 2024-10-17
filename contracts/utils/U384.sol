// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "hardhat/console.sol";

library U384 {
    uint256 private constant LONG_ALLOCATION = 96;
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

    function _allocate(uint256 bytes_) private pure returns (uint256 handler_) {
        assembly {
            handler_ := mload(0x40)
            mstore(0x40, add(handler_, bytes_))
        }

        return handler_;
    }
}
