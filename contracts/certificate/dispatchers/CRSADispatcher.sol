// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {PoseidonUnit5L} from "@iden3/contracts/lib/Poseidon.sol";

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {ICertificateDispatcher} from "../../interfaces/dispatchers/ICertificateDispatcher.sol";
import {ICertificateRSASigner} from "../../interfaces/signers/ICertificateRSASigner.sol";

import {Bytes2Poseidon} from "../../utils/Bytes2Poseidon.sol";
import {RSA} from "../../utils/RSA.sol";
import {X509} from "../../utils/X509.sol";

contract CRSADispatcher is ICertificateDispatcher, Initializable {
    using Bytes2Poseidon for bytes;
    using X509 for bytes;
    using RSA for bytes;

    uint256 public keyByteLength;
    bytes public keyCheckPrefix;

    address public signer;

    function __CRSADispatcher_init(
        address signer_,
        uint256 keyByteLength_,
        bytes calldata keyCheckPrefix_
    ) external initializer {
        signer = signer_;
        keyByteLength = keyByteLength_;
        keyCheckPrefix = keyCheckPrefix_;
    }

    /**
     * @notice Verifies the ICAO master signature over certificate's signed attributes
     */
    function verifyICAOSignature(
        bytes memory x509SignedAttributes_,
        bytes memory icaoMemberSignature_,
        bytes memory icaoMemberKey_
    ) external view override returns (bool) {
        return
            ICertificateRSASigner(signer).verifyICAOSignature(
                x509SignedAttributes_,
                icaoMemberSignature_,
                icaoMemberKey_
            );
    }

    /**
     * @notice Extracts the certificate's expiration timestamp from its signed attributes
     */
    function getCertificateExpirationTimestamp(
        bytes memory x509SignedAttributes_,
        uint256 byteOffset_
    ) external pure override returns (uint256) {
        return x509SignedAttributes_.extractExpirationTimestamp(byteOffset_);
    }

    /**
     * @notice Extracts the certificate's public key from its signed attributes
     */
    function getCertificatePublicKey(
        bytes memory x509SignedAttributes_,
        uint256 byteOffset_
    ) external view override returns (bytes memory) {
        return x509SignedAttributes_.extractPublicKey(keyCheckPrefix, byteOffset_, keyByteLength);
    }

    /**
     * @notice Poseidon5 hash of the `x509KeyByteLength` long RSA X509 key.
     *
     * See X509 library for more information
     */
    function getCertificateKey(
        bytes memory certificatePublicKey_
    ) external pure override returns (uint256 keyHash_) {
        return certificatePublicKey_.hashPacked();
    }
}
