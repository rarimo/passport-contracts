// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {PoseidonUnit2L, PoseidonUnit5L} from "@iden3/contracts/lib/Poseidon.sol";

library Bytes2Poseidon {
    /**
     * @notice Apply poseidon2 to [32, 32] bytes long integers mod 2 ** 248
     */
    function hash512(bytes memory byteArray_) internal pure returns (uint256) {
        assert(byteArray_.length >= 64);

        uint256[2] memory decomposed_;

        assembly {
            mstore(decomposed_, mload(add(byteArray_, 32))) // skip length and read first 32 bytes
            mstore(add(decomposed_, 32), mload(add(byteArray_, 64))) // skip length and read second 32 bytes
        }

        decomposed_[0] %= 2 ** 248;
        decomposed_[1] %= 2 ** 248;

        return PoseidonUnit2L.poseidon(decomposed_);
    }

    /**
     * @notice Apply poseidon5 to [25, 25, 25, 25, 28] bytes long integers
     */
    function hash1024(bytes memory byteArray_) internal pure returns (uint256) {
        assert(byteArray_.length >= 128);

        uint256[5] memory decomposed_;

        assembly {
            for {
                let i := 0
            } lt(i, 5) {
                i := add(i, 1)
            } {
                let someData_ := mload(add(byteArray_, add(32, mul(i, 25)))) // read current 32 bytes chunk

                switch i
                case 4 {
                    someData_ := shr(32, someData_) // shift by 4 (32 - 28) bytes to the right
                }
                default {
                    someData_ := shr(56, someData_) // shift by 7 (32 - 25) bytes to the right
                }

                mstore(add(decomposed_, mul(i, 32)), someData_)
            }
        }

        return PoseidonUnit5L.poseidon(decomposed_);
    }

    /**
     * @notice Concatenates the last 8 bytes by a group of 3 to form a poseidon element.
     *
     * poseidon5(
     *   byteArray_.bytes8[last] + byteArray_.bytes8[last - 1] + byteArray_.bytes8[last - 2],
     *   byteArray_.bytes8[last - 3] + byteArray_.bytes8[last - 4] + byteArray_.bytes8[last - 5],
     *   ...
     * )
     *
     * The algorithm is such to accommodate for long arithmetic in circuits.
     */
    function hashPacked(bytes memory byteArray_) internal pure returns (uint256) {
        assert(byteArray_.length >= 120);

        uint256[5] memory decomposed_;

        assembly {
            let position_ := add(byteArray_, mload(byteArray_)) // load the last 32 bytes

            for {
                let i := 0
            } lt(i, 5) {
                i := add(i, 1)
            } {
                let element_ := mload(position_)
                let reversed_ := 0

                for {
                    let j := 0
                } lt(j, 3) {
                    j := add(j, 1)
                } {
                    let extracted_ := and(shr(mul(j, 64), element_), 0xffffffffffffffff) // pack by 3 via shifting
                    reversed_ := or(shl(64, reversed_), extracted_)
                }

                mstore(add(decomposed_, mul(i, 32)), reversed_)

                position_ := sub(position_, 24)
            }
        }

        return PoseidonUnit5L.poseidon(decomposed_);
    }
}
