// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {PoseidonUnit5L} from "@iden3/contracts/lib/Poseidon.sol";

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {ICertificateDispatcher} from "../../interfaces/dispatchers/ICertificateDispatcher.sol";

import {CRSASHA2Signer} from "../signers/CRSASHA2Signer.sol";

import {RSA} from "../../utils/RSA.sol";
import {X509} from "../../utils/X509.sol";

contract CRSASHA2Dispatcher is ICertificateDispatcher, Initializable {
    using X509 for bytes;
    using RSA for bytes;

    uint256 public constant X509_KEY_BYTE_LENGTH = 512; // 4096 bits

    address public signer;

    function __CRSASHA2Dispatcher_init(address signer_) external initializer {
        signer = signer_;
    }

    /**
     * @notice Verifiers ICAO member RSA signature of the X509 certificate SA.
     *
     * The last 32 bytes of the decrypted signature is a SHA256 hash of the certificate signed attributes
     */
    function verifyICAOSignature(
        bytes memory x509SignedAttributes_,
        bytes memory icaoMemberSignature_,
        bytes memory icaoMemberKey_
    ) external view override returns (bool) {
        return
            CRSASHA2Signer(signer).verifyICAOSignature(
                x509SignedAttributes_,
                icaoMemberSignature_,
                icaoMemberKey_
            );
    }

    function getCertificateExpirationTimestamp(
        bytes memory x509SignedAttributes_,
        uint256 byteOffset_
    ) external pure override returns (uint256) {
        return x509SignedAttributes_.extractExpirationTimestamp(byteOffset_);
    }

    function getCertificatePublicKey(
        bytes memory x509SignedAttributes_,
        uint256 byteOffset_
    ) external view override returns (bytes memory) {
        return x509SignedAttributes_.extractPublicKey(byteOffset_, X509_KEY_BYTE_LENGTH);
    }

    /**
     * @notice Poseidon5 hash of the 4096 bit RSA X509 key.
     *
     * Concatenates the last 8 bytes by a group of 3 to form a poseidon element.
     *
     * poseidon5(
     *   x509Key_.bytes8[last] + x509Key_.bytes8[last - 1] + x509Key_.bytes8[last - 2],
     *   x509Key_.bytes8[last - 3] + x509Key_.bytes8[last - 4] + x509Key_.bytes8[last - 5],
     *   ...
     * )
     *
     * The algorithm is such to accommodate for long arithmetic in circuits.
     */
    function getCertificateKey(
        bytes memory certificatePublicKey_
    ) external pure override returns (uint256 keyHash_) {
        uint256[5] memory decomposed_;

        assembly {
            let position_ := add(certificatePublicKey_, mload(certificatePublicKey_)) // load the last 32 bytes

            for {
                let i := 0
            } lt(i, 5) {
                i := add(i, 1)
            } {
                let element_ := mload(position_)
                let reversed_ := 0

                for {
                    let j := 0
                } lt(j, 3) {
                    j := add(j, 1)
                } {
                    let extracted_ := and(shr(mul(j, 64), element_), 0xffffffffffffffff) // pack by 3 via shifting
                    reversed_ := or(shl(64, reversed_), extracted_)
                }

                mstore(add(decomposed_, mul(i, 32)), reversed_)

                position_ := sub(position_, 24)
            }
        }

        return PoseidonUnit5L.poseidon(decomposed_);
    }
}
