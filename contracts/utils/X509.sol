// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {PoseidonUnit5L} from "@iden3/contracts/lib/Poseidon.sol";

import {Bytes2Poseidon} from "./Bytes2Poseidon.sol";
import {RSA} from "./RSA.sol";
import {Date2Time} from "./Date2Time.sol";

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
        uint256[5] memory decomposed_;

        assembly {
            let position_ := add(x509Key_, mload(x509Key_))

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
                    let extracted_ := and(shr(mul(j, 64), element_), 0xffffffffffffffff)
                    reversed_ := or(shl(64, reversed_), extracted_)
                }

                mstore(add(decomposed_, mul(i, 32)), reversed_)

                position_ := sub(position_, 24)
            }
        }

        return PoseidonUnit5L.poseidon(decomposed_);
    }

    function extractExpirationTimestamp(
        bytes memory x509SignedAttributes_,
        uint256 expirationOffset_
    ) internal pure returns (uint256) {
        _check(x509SignedAttributes_, hex"170d", expirationOffset_);

        uint256[] memory asciiTime = new uint256[](6);

        for (uint256 i = 0; i < 12; i++) {
            uint256 asciiNum_ = uint8(x509SignedAttributes_[expirationOffset_ + i]) - 48;

            asciiTime[i / 2] += i % 2 == 0 ? asciiNum_ * 10 : asciiNum_;
        }

        return
            Date2Time.timestampFromDateTime(
                asciiTime[0] + 2000,
                asciiTime[1],
                asciiTime[2],
                asciiTime[3],
                asciiTime[4],
                asciiTime[5]
            );
    }

    function extractKey(
        bytes memory x509SignedAttributes_,
        uint256 keyOffset_
    ) internal pure returns (bytes memory x509Key_) {
        _check(x509SignedAttributes_, hex"0282020100", keyOffset_);

        x509Key_ = new bytes(X509_KEY_BYTE_LENGTH);

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

    function _check(
        bytes memory x509SignedAttributes_,
        bytes memory checker_,
        uint256 offset_
    ) private pure {
        for (uint256 i = 0; i < checker_.length; ++i) {
            require(
                x509SignedAttributes_[offset_ - checker_.length + i] == checker_[i],
                "X509: wrong check placement"
            );
        }
    }
}
