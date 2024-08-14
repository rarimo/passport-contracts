// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "hardhat/console.sol";

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {ICertificateRSASigner} from "../../interfaces/signers/ICertificateRSASigner.sol";

import {RSA} from "../../utils/RSA.sol";
import {SHA1} from "../../utils/SHA1.sol";

contract CRSASigner is ICertificateRSASigner, Initializable {
    using RSA for bytes;
    using SHA1 for bytes;

    uint256 public exponent; // RSA exponent
    bool public isSha1; // hash function switcher, true - sha1, false - sha2

    function __CRSASigner_init(uint256 exponent_, bool isSha1_) external initializer {
        exponent = exponent_;
        isSha1 = isSha1_;
    }

    /**
     * @notice Verifies ICAO member RSA signature of the X509 certificate SA.
     *
     * The last 32 bytes of the decrypted signature is a SHA256 hash of the certificate signed attributes
     * The last 20 bytes of the decrypted signature is a SHA1 hash of the certificate signed attributes
     */
    function verifyICAOSignature(
        bytes memory x509SignedAttributes_,
        bytes memory icaoMemberSignature_,
        bytes memory icaoMemberKey_
    ) external view override returns (bool) {
        bytes memory x509SAHash = isSha1
            ? abi.encodePacked(x509SignedAttributes_.sha1())
            : abi.encodePacked(sha256(x509SignedAttributes_));

        bytes memory decrypted_ = icaoMemberSignature_.decrypt(
            abi.encodePacked(exponent),
            icaoMemberKey_
        );

        bytes32 decryptedX509SAHash_;
        uint256 offset_ = isSha1 ? 12 : 0; // offset for sha1 or sha2

        assembly {
            decryptedX509SAHash_ := mload(add(add(decrypted_, mload(decrypted_)), offset_)) // load the last 32 or 20 bytes (depends on hash function)
        }

        return bytes32(x509SAHash) == decryptedX509SAHash_;
    }
}
// 0x
// 0001ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
// ffffffffffffffffffffffff003031300d060960864801650304020105000420
// af261f351b8983c862db893d655910b2b065471447806d26504b29da7cdcc168
