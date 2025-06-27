// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {RSASSAPSS} from "@solarity/solidity-lib/libs/crypto/RSASSAPSS.sol";

import {ICertificateSigner} from "../../interfaces/signers/ICertificateSigner.sol";

import {SHA384} from "../../utils/SHA384.sol";
import {SHA512} from "../../utils/SHA512.sol";

contract CRSAPSSSigner is ICertificateSigner, Initializable {
    using RSASSAPSS for *;

    enum HF {
        sha256,
        sha512,
        sha384
    }

    uint256 public exponent; // RSAPSS exponent
    HF public hashFunction; // hash function switcher

    function __CRSAPSSSigner_init(uint256 exponent_, HF hashFunction_) external initializer {
        exponent = exponent_;
        hashFunction = hashFunction_;
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

        if (hashFunction == HF.sha256) {
            params_ = RSASSAPSS.Parameters({hashLength: 32, saltLength: 32, hasher: _sha2});
        } else if (hashFunction == HF.sha384) {
            params_ = RSASSAPSS.Parameters({
                hashLength: 48,
                saltLength: 48,
                hasher: SHA384.sha384
            });
        } else if (hashFunction == HF.sha512) {
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
