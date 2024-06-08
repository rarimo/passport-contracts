// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {RSA} from "../../utils/RSA.sol";
import {SHA1} from "../../utils/SHA1.sol";

contract PRSASHA1Authenticator {
    using RSA for bytes;
    using SHA1 for bytes;

    uint256 public constant E = 65537; // RSA exponent
    uint256 public constant HASH_LEN = 20; // SHA1 hash length

    /**
     * @notice Checks active authentication of a passport. The RSA algorithm is as follows:
     *
     * 1. Decrypt the signature
     * 2. Remove the 1 byte (hash function indicator) suffix
     * 3. The last 20 bytes of the decrypted signature is the SHA1 hash of random + challenge
     */
    function authenticate(
        bytes memory challenge_,
        bytes memory s_,
        bytes memory n_
    ) external view returns (bool) {
        bytes memory e_ = abi.encodePacked(E);

        if (s_.length == 0 || n_.length == 0) {
            return false;
        }

        bytes memory decipher_ = s_.decrypt(e_, n_);

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
