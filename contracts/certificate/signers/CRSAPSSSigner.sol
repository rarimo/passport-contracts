// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {ICertificateSigner} from "../../interfaces/signers/ICertificateSigner.sol";

import {RSAPSS} from "../../utils/RSAPSS.sol";

contract CRSAPSSSigner is ICertificateSigner, Initializable {
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
        return
            RSAPSS.verify(
                x509SignedAttributes_,
                icaoMemberSignature_,
                abi.encodePacked(exponent),
                icaoMemberKey_,
                isSha2
            );
    }
}
