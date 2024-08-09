// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {RSAPSSSHA512} from "../../utils/RSAPSSSHA512.sol";

contract CRSAPSSSHA512Signer is Initializable {
    using RSAPSSSHA512 for bytes;

    uint256 public exponent; // RSAPSS exponent

    function __CRSAPSSSHA512Signer_init(uint256 exponent_) external initializer {
        exponent = exponent_;
    }

    /**
     * @notice Verifies ICAO member RSAPSS signature of the X509 certificate SA.
     */
    function verifyICAOSignature(
        bytes memory x509SignedAttributes_,
        bytes memory icaoMemberSignature_,
        bytes memory icaoMemberKey_
    ) external view returns (bool) {
        return
            x509SignedAttributes_.verify(
                icaoMemberSignature_,
                abi.encodePacked(exponent),
                icaoMemberKey_
            );
    }
}
