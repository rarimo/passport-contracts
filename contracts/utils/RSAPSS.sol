// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {RSA} from "./RSA.sol";
import {SHA512} from "./SHA512.sol";

library RSAPSS {
    struct HashStruct {
        uint256 hashLength;
        uint256 saltLength;
        function(bytes memory) internal pure returns (bytes memory) hash;
    }

    /**
     * @notice RSAPSS verification algorithm
     */
    function verify(
        bytes memory message_,
        bytes memory s_,
        bytes memory e_,
        bytes memory n_,
        bool isSha2_
    ) internal view returns (bool) {
        if (s_.length == 0 || e_.length == 0 || n_.length == 0) {
            return false;
        }

        bytes memory decipher_ = RSA.decrypt(s_, e_, n_);

        return pss(message_, decipher_, isSha2_);
    }

    function pss(
        bytes memory message_,
        bytes memory signature_,
        bool isSha2_
    ) private pure returns (bool) {
        HashStruct memory hashStruct_ = getHashStruct(isSha2_);
        uint256 hashLength_ = hashStruct_.hashLength;
        uint256 saltLength_ = hashStruct_.saltLength;
        uint256 sigBytes_ = signature_.length;
        uint256 sigBits_ = (sigBytes_ * 8 - 1) & 7;

        if (message_.length > 2 ** 61 - 1) {
            return false;
        }

        bytes memory messageHash_ = hashStruct_.hash(message_);

        if (sigBytes_ < hashLength_ + saltLength_ + 2) {
            return false;
        }

        if (signature_[sigBytes_ - 1] != hex"BC") {
            return false;
        }

        bytes memory db_ = new bytes(sigBytes_ - hashLength_ - 1);
        bytes memory h_ = new bytes(hashLength_);

        for (uint256 i = 0; i < db_.length; ++i) {
            db_[i] = signature_[i];
        }

        for (uint256 i = 0; i < hashLength_; ++i) {
            h_[i] = signature_[i + db_.length];
        }

        if (uint8(db_[0] & bytes1(uint8(((0xFF << (sigBits_)))))) == 1) {
            return false;
        }

        bytes memory dbMask_ = mgf(h_, db_.length, hashStruct_);

        for (uint256 i = 0; i < db_.length; ++i) {
            db_[i] ^= dbMask_[i];
        }

        if (sigBits_ > 0) {
            db_[0] &= bytes1(uint8(0xFF >> (8 - sigBits_)));
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

        bytes memory salt_ = new bytes(saltLength_);

        for (uint256 i = 0; i < salt_.length; ++i) {
            salt_[i] = db_[db_.length - salt_.length + i];
        }

        bytes memory hh_ = hashStruct_.hash(
            abi.encodePacked(hex"0000000000000000", messageHash_, salt_)
        );

        if (keccak256(h_) != keccak256(hh_)) {
            return false;
        }

        return true;
    }

    function mgf(
        bytes memory message_,
        uint256 maskLen_,
        HashStruct memory hashStruct_
    ) private pure returns (bytes memory res_) {
        uint256 hashLength_ = hashStruct_.hashLength;

        bytes memory cnt_ = new bytes(4);

        require(maskLen_ <= (2 ** 32) * hashLength_, "RSAPSS: mask too lengthy");

        for (uint256 i = 0; i < (maskLen_ + hashLength_ - 1) / hashLength_; ++i) {
            cnt_[0] = bytes1(uint8((i >> 24) & 255));
            cnt_[1] = bytes1(uint8((i >> 16) & 255));
            cnt_[2] = bytes1(uint8((i >> 8) & 255));
            cnt_[3] = bytes1(uint8(i & 255));

            bytes memory hashedResInter_ = hashStruct_.hash(abi.encodePacked(message_, cnt_));

            res_ = abi.encodePacked(res_, hashedResInter_);
        }

        assembly {
            mstore(res_, maskLen_)
        }
    }

    function getHashStruct(bool isSha2_) private pure returns (HashStruct memory) {
        return
            HashStruct({
                hashLength: isSha2_ ? 32 : 64,
                saltLength: isSha2_ ? 32 : 64,
                hash: isSha2_ ? sha2 : SHA512.sha512
            });
    }

    function sha2(bytes memory data) private pure returns (bytes memory) {
        return abi.encodePacked(sha256(data));
    }
}
