// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {AbstractCDispatcher} from "./abstract/AbstractCDispatcher.sol";

import {Bytes2Poseidon} from "../../utils/Bytes2Poseidon.sol";

contract CECDSADispatcher is AbstractCDispatcher {
    using Bytes2Poseidon for bytes;

    function __CECDSADispatcher_init(
        address signer_,
        uint256 keyByteLength_,
        bytes calldata keyCheckPrefix_
    ) external initializer {
        __AbstractCDispatcher_init(signer_, keyByteLength_, keyCheckPrefix_);
    }

    function getCertificateKey(
        bytes memory certificatePublicKey_
    ) external view override returns (uint256 keyHash_) {
        return
            keyByteLength >= 128
                ? certificatePublicKey_.hash1024()
                : certificatePublicKey_.hash512();
    }
}
