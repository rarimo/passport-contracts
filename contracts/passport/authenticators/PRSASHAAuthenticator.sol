// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {RSA} from "../../utils/RSA.sol";
import {SHA1} from "../../utils/SHA1.sol";

contract PRSASHAAuthenticator is Initializable {
    using RSA for bytes;
    using SHA1 for bytes;

    uint256 public exponent; // RSA exponent
    bool public isSha1;
    uint256 private hashLen;

    function __PRSASHAAuthenticator_init(uint256 exponent_, bool isSha1_) external initializer {
        exponent = exponent_;
        isSha1 = isSha1_;
        hashLen = isSha1 ? 20 : 32;
    }

    /**
     * @notice Checks active authentication of a passport. The RSA algorithm is as follows:
     *
     * 1. Decrypt the signature
     * 2. Remove the 1 byte (hash function indicator) suffix
     * 3. The last 20 bytes of the decrypted signature is the SHA1 hash of random + challenge or the last 32 bytes in case SHA2 hash
     */
    function authenticate(
        bytes memory challenge_,
        bytes memory s_,
        bytes memory n_
    ) external view returns (bool) {
        bytes memory e_ = abi.encodePacked(exponent);

        if (s_.length == 0 || n_.length == 0) {
            return false;
        }

        bytes memory decipher_ = s_.decrypt(e_, n_);

        assembly {
            mstore(decipher_, sub(mload(decipher_), 1))
        }

        bytes memory prepared_ = new bytes(decipher_.length - hashLen - 1);
        bytes memory digest_ = new bytes(hashLen);

        for (uint256 i = 0; i < prepared_.length; ++i) {
            prepared_[i] = decipher_[i + 1];
        }

        for (uint256 i = 0; i < digest_.length; ++i) {
            digest_[i] = decipher_[decipher_.length - hashLen + i];
        }

        return bytes32(digest_) == _hash(abi.encodePacked(prepared_, challenge_));
    }

    function _hash(bytes memory data_) private view returns (bytes32) {
        return isSha1 ? data_.sha1() : sha256(data_);
    }
}
