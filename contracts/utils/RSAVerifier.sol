// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {SHA1} from "./SHA1.sol";

library RSAVerifier {
    using SHA1 for bytes;

    uint256 constant HASH_LEN = 20;

    function decrypt(
        bytes memory s_,
        bytes memory e_,
        bytes memory n_
    ) internal view returns (bytes memory decipher_) {
        bytes memory input_ = abi.encodePacked(
            bytes32(s_.length),
            bytes32(e_.length),
            bytes32(n_.length),
            s_,
            e_,
            n_
        );
        uint256 inputLength_ = input_.length;

        uint256 decipherLength_ = n_.length;
        decipher_ = new bytes(decipherLength_);

        assembly {
            pop(
                staticcall(
                    sub(gas(), 2000),
                    5,
                    add(input_, 0x20),
                    inputLength_,
                    add(decipher_, 0x20),
                    decipherLength_
                )
            )
        }
    }

    function verifyPassport(
        bytes memory challenge_,
        bytes memory s_,
        bytes memory e_,
        bytes memory n_
    ) internal view returns (bool) {
        if (s_.length == 0 || e_.length == 0 || n_.length == 0) {
            return false;
        }

        bytes memory decipher_ = decrypt(s_, e_, n_);

        assembly {
            mstore(decipher_, sub(mload(decipher_), 1))
        }

        bytes memory prepared_ = new bytes(decipher_.length - HASH_LEN - 1);
        bytes memory digest_ = new bytes(HASH_LEN);

        for (uint256 i = 0; i < prepared_.length; ++i) {
            prepared_[i] = decipher_[i + 1];
        }

        for (uint256 i = 0; i < digest_.length; ++i) {
            digest_[i] = decipher_[decipher_.length - HASH_LEN + i];
        }

        return bytes20(digest_) == abi.encodePacked(prepared_, challenge_).sha1();
    }
}
