// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {Bytes2Poseidon} from "../utils/Bytes2Poseidon.sol";
import {RSA} from "../utils/RSA.sol";

library X509 {
    using Bytes2Poseidon for bytes;
    using RSA for bytes;

    uint256 public constant X509_KEY_BYTE_LENGTH = 512;
    uint256 public constant E = 65537;

    function verifyICAOSignature(
        bytes memory x509SignedAttributes_,
        bytes memory icaoMemberKey_,
        bytes memory icaoMemberSignature_
    ) internal view returns (bool) {
        bytes32 x509SAHash = sha256(x509SignedAttributes_);

        bytes memory decrypted_ = icaoMemberSignature_.decrypt(
            abi.encodePacked(E),
            icaoMemberKey_
        );

        bytes32 decryptedX509SAHash_;

        assembly {
            decryptedX509SAHash_ := mload(add(decrypted_, X509_KEY_BYTE_LENGTH)) // 480 offset + 32 length
        }

        return x509SAHash == decryptedX509SAHash_;
    }

    function hashKey(bytes memory x509Key_) internal pure returns (uint256 keyHash_) {
        assembly {
            mstore(x509Key_, 128)
        }

        keyHash_ = x509Key_.hash1024();

        assembly {
            mstore(x509Key_, X509_KEY_BYTE_LENGTH)
        }

        return keyHash_;
    }

    function extractKey(
        bytes memory x509SignedAttributes_,
        uint256 keyOffset_
    ) internal pure returns (bytes memory x509Key_) {
        x509Key_ = new bytes(X509_KEY_BYTE_LENGTH);

        bytes memory check_ = hex"0282020100";

        for (uint256 i = 0; i < check_.length; ++i) {
            require(
                x509SignedAttributes_[keyOffset_ - check_.length + i] == check_[i],
                "X509: wrong key placement"
            );
        }

        assembly {
            let length_ := X509_KEY_BYTE_LENGTH

            for {
                let i := 0
            } lt(i, length_) {
                i := add(i, 32)
            } {
                mstore(
                    add(x509Key_, add(i, 32)),
                    mload(add(x509SignedAttributes_, add(keyOffset_, add(i, 32))))
                )
            }
        }
    }
}
