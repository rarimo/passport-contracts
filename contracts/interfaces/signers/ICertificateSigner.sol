// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

/**
 * @notice Certificate signer interface
 */
interface ICertificateSigner {
    function verifyICAOSignature(
        bytes calldata x509SignedAttributes_,
        bytes calldata icaoMemberSignature_,
        bytes calldata icaoMemberKey_
    ) external view returns (bool);
}
