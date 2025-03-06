// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/**
 * @notice Certificate dispatcher interface
 */
interface ICertificateDispatcher {
    function verifyICAOSignature(
        bytes calldata x509SignedAttributes_,
        bytes calldata icaoMemberSignature_,
        bytes calldata icaoMemberPublicKey_
    ) external view returns (bool);

    function getCertificateExpirationTimestamp(
        bytes calldata x509SignedAttributes_,
        uint256 byteOffset_
    ) external view returns (uint256);

    function getCertificatePublicKey(
        bytes calldata x509SignedAttributes_,
        uint256 byteOffset_
    ) external view returns (bytes memory);

    function getCertificateKey(
        bytes calldata certificatePublicKey_
    ) external view returns (uint256);
}
