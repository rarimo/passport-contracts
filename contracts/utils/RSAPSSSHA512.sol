// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {RSA} from "./RSA.sol";
import {SHA512} from "./SHA512.sol";

library RSAPSSSHA512 {
    using SHA512 for bytes;

    uint256 constant HASH_LEN = 64;
    uint256 constant SALT_LEN = 64;
    uint256 constant MS_BITS = 4095 & 7;
    uint256 constant MS_BYTES = 512;

    /**
     * @notice RSAPSS verification algorithm
     */
    function verify(
        bytes memory message_,
        bytes memory s_,
        bytes memory e_,
        bytes memory n_
    ) internal view returns (bool) {
        if (s_.length == 0 || e_.length == 0 || n_.length == 0) {
            return false;
        }

        bytes memory decipher_ = RSA.decrypt(s_, e_, n_);

        return pss(message_, decipher_);
    }

    function pss(bytes memory message_, bytes memory signature_) private pure returns (bool) {
        if (message_.length > 2 ** 61 - 1) {
            return false;
        }

        bytes memory messageHash_ = message_.sha512();

        if (MS_BYTES < HASH_LEN + SALT_LEN + 2) {
            return false;
        }

        if (signature_[MS_BYTES - 1] != hex"BC") {
            return false;
        }

        bytes memory db_ = new bytes(MS_BYTES - HASH_LEN - 1);
        bytes memory h_ = new bytes(HASH_LEN);

        for (uint256 i = 0; i < db_.length; ++i) {
            db_[i] = signature_[i];
        }

        for (uint256 i = 0; i < HASH_LEN; ++i) {
            h_[i] = signature_[i + db_.length];
        }

        if (uint8(db_[0] & bytes1(uint8(((0xFF << (MS_BITS)))))) == 1) {
            return false;
        }

        bytes memory dbMask_ = mgf(h_, db_.length);

        for (uint256 i = 0; i < db_.length; ++i) {
            db_[i] ^= dbMask_[i];
        }

        if (MS_BITS > 0) {
            db_[0] &= bytes1(uint8(0xFF >> (8 - MS_BITS)));
        }

        uint256 zeroBytes_;

        for (
            zeroBytes_ = 0;
            db_[zeroBytes_] == 0 && zeroBytes_ < (db_.length - 1);
            ++zeroBytes_
        ) {}

        if (db_[zeroBytes_++] != hex"01") {
            return false;
        }

        bytes memory salt_ = new bytes(SALT_LEN);

        for (uint256 i = 0; i < salt_.length; ++i) {
            salt_[i] = db_[db_.length - salt_.length + i];
        }

        bytes memory hh_ = abi.encodePacked(hex"0000000000000000", messageHash_, salt_).sha512();

        if (keccak256(h_) != keccak256(hh_)) {
            return false;
        }

        return true;
    }

    function mgf(
        bytes memory message_,
        uint256 maskLen_
    ) private pure returns (bytes memory res_) {
        bytes memory cnt_ = new bytes(4);

        require(maskLen_ <= (2 ** 32) * HASH_LEN, "RSAPSS: mask too lengthy");

        for (uint256 i = 0; i < (maskLen_ + HASH_LEN - 1) / HASH_LEN; ++i) {
            cnt_[0] = bytes1(uint8((i >> 24) & 255));
            cnt_[1] = bytes1(uint8((i >> 16) & 255));
            cnt_[2] = bytes1(uint8((i >> 8) & 255));
            cnt_[3] = bytes1(uint8(i & 255));

            bytes memory hashedResInter_ = abi.encodePacked(message_, cnt_).sha512();

            res_ = abi.encodePacked(res_, hashedResInter_);
        }

        assembly {
            mstore(res_, maskLen_)
        }
    }
}
