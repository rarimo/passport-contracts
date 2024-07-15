// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {RSA} from "../../utils/RSA.sol";
import {SHA1} from "../../utils/SHA1.sol";

contract CRSASHA2Signer is Initializable {
    using RSA for bytes;

    uint256 public exponent; // RSA exponent

    function __CRSASHA2Signer_init(uint256 exponent_) external initializer {
        exponent = exponent_;
    }

    /**
     * @notice Verifies ICAO member RSA signature of the X509 certificate SA.
     *
     * The last 32 bytes of the decrypted signature is a SHA256 hash of the certificate signed attributes
     */
    function verifyICAOSignature(
        bytes memory x509SignedAttributes_,
        bytes memory icaoMemberSignature_,
        bytes memory icaoMemberKey_
    ) external view returns (bool) {
        bytes32 x509SAHash = sha256(x509SignedAttributes_);

        bytes memory decrypted_ = icaoMemberSignature_.decrypt(
            abi.encodePacked(exponent),
            icaoMemberKey_
        );

        bytes32 decryptedX509SAHash_;

        assembly {
            decryptedX509SAHash_ := mload(add(decrypted_, mload(decrypted_))) // load the last 32 bytes
        }

        return x509SAHash == decryptedX509SAHash_;
    }
}
