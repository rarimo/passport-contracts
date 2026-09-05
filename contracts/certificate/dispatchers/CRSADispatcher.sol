// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {AbstractCDispatcher} from "./abstract/AbstractCDispatcher.sol";

contract CRSADispatcher is AbstractCDispatcher {
    function __CRSADispatcher_init(
        address signer_,
        uint256 keyByteLength_,
        bytes calldata keyCheckPrefix_
    ) external initializer {
        __AbstractCDispatcher_init(signer_, keyByteLength_, keyCheckPrefix_);
    }

    function getCertificateKey(
        bytes memory certificatePublicKey_
    ) external pure override returns (uint256 keyHash_) {
        return uint256(sha256(certificatePublicKey_)) >> 8;
    }
}
