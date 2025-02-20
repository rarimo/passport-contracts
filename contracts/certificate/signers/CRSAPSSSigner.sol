// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {RSASSAPSS} from "@solarity/solidity-lib/libs/crypto/RSASSAPSS.sol";

import {ICertificateSigner} from "../../interfaces/signers/ICertificateSigner.sol";

import {SHA512} from "../../utils/SHA512.sol";

contract CRSAPSSSigner is ICertificateSigner, Initializable {
    using RSASSAPSS for *;

    uint256 public exponent; // RSAPSS exponent
    bool public isSha2; // hash function switcher, true - sha2, false - sha512

    function __CRSAPSSSigner_init(uint256 exponent_, bool isSha2_) external initializer {
        exponent = exponent_;
        isSha2 = isSha2_;
    }

    /**
     * @notice Verifies ICAO member RSAPSS signature of the X509 certificate SA.
     */
    function verifyICAOSignature(
        bytes memory x509SignedAttributes_,
        bytes memory icaoMemberSignature_,
        bytes memory icaoMemberKey_
    ) external view override returns (bool) {
        RSASSAPSS.Parameters memory params_;

        if (isSha2) {
            params_ = RSASSAPSS.Parameters({hashLength: 32, saltLength: 32, hasher: _sha2});
        } else {
            params_ = RSASSAPSS.Parameters({
                hashLength: 64,
                saltLength: 64,
                hasher: SHA512.sha512
            });
        }

        return
            params_.verify(
                x509SignedAttributes_,
                icaoMemberSignature_,
                abi.encodePacked(exponent),
                icaoMemberKey_
            );
    }

    function _sha2(bytes memory data) private pure returns (bytes memory) {
        return abi.encodePacked(sha256(data));
    }
}
