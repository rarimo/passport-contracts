// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {PoseidonUnit2L, PoseidonUnit5L} from "@iden3/contracts/lib/Poseidon.sol";

library Bytes2Poseidon {
    /**
     * @notice Apply poseidon2 to [32, 32] bytes long integers mod 2 ** 248
     */
    function hash512(bytes memory byteArray_) internal pure returns (uint256) {
        assert(byteArray_.length == 64);

        uint256[2] memory decomposed_;

        assembly {
            mstore(decomposed_, mload(add(byteArray_, 32)))
            mstore(add(decomposed_, 32), mload(add(byteArray_, 64)))
        }

        decomposed_[0] %= 2 ** 248;
        decomposed_[1] %= 2 ** 248;

        return PoseidonUnit2L.poseidon(decomposed_);
    }

    /**
     * @notice Apply poseidon5 to [25, 25, 25, 25, 28] bytes long integers
     */
    function hash1024(bytes memory byteArray_) internal pure returns (uint256) {
        assert(byteArray_.length == 128);

        uint256[5] memory decomposed_;

        assembly {
            for {
                let i := 0
            } lt(i, 5) {
                i := add(i, 1)
            } {
                let someData_ := mload(add(byteArray_, add(32, mul(i, 25))))

                switch i
                case 4 {
                    someData_ := shr(32, someData_)
                }
                default {
                    someData_ := shr(56, someData_)
                }

                mstore(add(decomposed_, mul(i, 32)), someData_)
            }
        }

        return PoseidonUnit5L.poseidon(decomposed_);
    }
}
