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

    /**
     * @notice Verifiers ICAO member RSA signature of the X509 certificate SA.
     *
     * The last 32 bytes of the decrypted signature is a SHA256 hash of the certificate signed attributes
     */
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

    /**
     * @notice Poseidon5 hashed the 4096 bit RSA X509 key.
     *
     * Concatenates the last 8 bytes by a group of 3 to form a poseidon element.
     *
     * poseidon5(
     *   x509Key_.bytes8[last] + x509Key_.bytes8[last - 1] + x509Key_.bytes8[last - 2],
     *   x509Key_.bytes8[last - 3] + x509Key_.bytes8[last - 4] + x509Key_.bytes8[last - 5],
     *   ...
     * )
     *
     * The algorithm is such to accommodate for long arithmetic in circuits.
     */
    function hashKey(bytes memory x509Key_) internal pure returns (uint256 keyHash_) {
        uint256[5] memory decomposed_;

        assembly {
            let position_ := add(x509Key_, mload(x509Key_)) // load the last 32 bytes

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

    /**
     * @notice Extracts expiration timestamp from the certificate SA.
     *
     * The timestamp starts with "170d" sequence, then go hex ASCII codes of the timestamp symbols:
     *
     * "0x170d" + "0x333030393131303732313236" -> 0x333030393131303732313236 -> "3 0  0 9  1 1  0 7  2 1  2 6" ->
     * convert to numbers = 2030-09-11 07:21:26 UTC
     */
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

    /**
     * @notice extracts 4096 bit RSA X509 key from the certificate.
     *
     * The key starts with "0282020100" sequence.
     *
     * Straightforward approach by copying memory from the given position
     */
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
