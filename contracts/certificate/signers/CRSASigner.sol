// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {ICertificateSigner} from "../../interfaces/signers/ICertificateSigner.sol";

import {RSA} from "../../utils/RSA.sol";
import {SHA1} from "../../utils/SHA1.sol";
import {SHA512} from "../../utils/SHA512.sol";

contract CRSASigner is ICertificateSigner, Initializable {
    using RSA for bytes;
    using SHA1 for bytes;
    using SHA512 for bytes;

    enum HF {
        sha1,
        sha256,
        sha512
    }

    uint256 public exponent; // RSA exponent
    HF public hashFunction; // hash function switcher

    function __CRSASigner_init(uint256 exponent_, HF hashFunction_) external initializer {
        exponent = exponent_;
        hashFunction = hashFunction_;
    }

    /**
     * @notice Verifies ICAO member RSA signature of the X509 certificate SA.
     *
     * The last 64 bytes of the decrypted signature is a SHA512 hash of the certificate signed attributes
     * The last 32 bytes of the decrypted signature is a SHA256 hash of the certificate signed attributes
     * The last 20 bytes of the decrypted signature is a SHA1 hash of the certificate signed attributes
     */
    function verifyICAOSignature(
        bytes memory x509SignedAttributes_,
        bytes memory icaoMemberSignature_,
        bytes memory icaoMemberKey_
    ) external view override returns (bool) {
        bytes memory decrypted_ = icaoMemberSignature_.decrypt(
            abi.encodePacked(exponent),
            icaoMemberKey_
        );

        bytes32 x509SAHash;
        bytes32 decryptedX509SAHash_;

        if (hashFunction == HF.sha1) {
            x509SAHash = x509SignedAttributes_.sha1();

            assembly {
                decryptedX509SAHash_ := shl(
                    96,
                    shr(96, mload(add(add(decrypted_, mload(decrypted_)), 12)))
                ) // load last 20 bytes
            }
        } else if (hashFunction == HF.sha256) {
            x509SAHash = sha256(x509SignedAttributes_);

            assembly {
                decryptedX509SAHash_ := mload(add(decrypted_, mload(decrypted_))) // load last 32 bytes
            }
        } else if (hashFunction == HF.sha512) {
            x509SAHash = keccak256(x509SignedAttributes_.sha512());

            assembly {
                mstore(0, mload(sub(add(decrypted_, mload(decrypted_)), 32))) // load prelast 32 bytes
                mstore(32, mload(add(decrypted_, mload(decrypted_)))) // load last 32 bytes

                decryptedX509SAHash_ := keccak256(0, 64) // calculate a hash for quick comparison
            }
        }

        return x509SAHash == decryptedX509SAHash_;
    }
}
