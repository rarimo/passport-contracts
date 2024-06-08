// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {RSA} from "../../utils/RSA.sol";
import {SHA1} from "../../utils/SHA1.sol";

contract CRSASHA2Signer {
    using RSA for bytes;

    uint256 public constant E = 65537; // RSA exponent
    uint256 public constant X509_KEY_BYTE_LENGTH = 512; // 4096 bits

    function verifyICAOSignature(
        bytes memory x509SignedAttributes_,
        bytes memory icaoMemberKey_,
        bytes memory icaoMemberSignature_
    ) external view returns (bool) {
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
}
