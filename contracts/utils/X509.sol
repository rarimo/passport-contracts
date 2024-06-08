// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {MemoryUtils} from "@solarity/solidity-lib/libs/utils/MemoryUtils.sol";

import {Date2Time} from "./Date2Time.sol";

library X509 {
    using MemoryUtils for bytes;

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
        _checkPrefix(x509SignedAttributes_, hex"170d", expirationOffset_);

        uint256[] memory asciiTime = new uint256[](6);

        for (uint256 i = 0; i < 12; i++) {
            uint256 asciiNum_ = uint8(x509SignedAttributes_[expirationOffset_ + i]) - 48;

            asciiTime[i / 2] += i % 2 == 0 ? asciiNum_ * 10 : asciiNum_;
        }

        return
            Date2Time.timestampFromDateTime(
                asciiTime[0] + 2000, // only the last 2 digits of the year are encoded
                asciiTime[1],
                asciiTime[2],
                asciiTime[3],
                asciiTime[4],
                asciiTime[5]
            );
    }

    /**
     * @notice extracts 4096 bit RSA X509 public key from the certificate.
     *
     * The key starts with "0282020100" sequence.
     *
     * Straightforward approach by copying memory from the given position
     */
    function extractPublicKey(
        bytes memory x509SignedAttributes_,
        uint256 keyOffset_,
        uint256 keyLength_
    ) internal view returns (bytes memory x509Key_) {
        _checkPrefix(x509SignedAttributes_, hex"0282020100", keyOffset_);

        x509Key_ = new bytes(keyLength_);

        MemoryUtils.unsafeCopy(
            x509SignedAttributes_.getDataPointer() + keyOffset_,
            x509Key_.getDataPointer(),
            keyLength_
        );
    }

    function _checkPrefix(
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
