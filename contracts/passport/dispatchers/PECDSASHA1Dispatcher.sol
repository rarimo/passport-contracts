// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IPassportDispatcher} from "../../interfaces/dispatchers/IPassportDispatcher.sol";
import {PECDSASHA1Authenticator} from "../authenticators/PECDSASHA1Authenticator.sol";
import {Bytes2Poseidon} from "../../utils/Bytes2Poseidon.sol";

contract PECDSASHA1Dispatcher is IPassportDispatcher, Initializable {
    using Bytes2Poseidon for bytes;

    address public authenticator;

    function __PECDSASHA1Dispatcher_init(address authenticator_) external initializer {
        authenticator = authenticator_;
    }

    /**
     * @notice Authenticate the ECDSA passport. Decode the pubkey and signature.
     */
    function authenticate(
        bytes memory challenge_,
        bytes memory passportSignature_,
        bytes memory passportPublicKey_
    ) external view returns (bool) {
        uint256 r_;
        uint256 s_;
        uint256 x_;
        uint256 y_;

        assembly {
            r_ := mload(add(passportSignature_, 32))
            s_ := mload(add(passportSignature_, 64))

            x_ := mload(add(passportPublicKey_, 32))
            y_ := mload(add(passportPublicKey_, 64))
        }

        return PECDSASHA1Authenticator(authenticator).authenticate(challenge_, r_, s_, x_, y_);
    }

    /**
     * @notice Get the passport challenge to be used in active authentication. The challenge is the last 8 bytes
     * of the identity key.
     */
    function getPassportChallenge(
        uint256 identityKey_
    ) external pure returns (bytes memory challenge_) {
        challenge_ = new bytes(8);

        for (uint256 i = 0; i < challenge_.length; ++i) {
            challenge_[challenge_.length - i - 1] = bytes1(uint8(identityKey_ >> (8 * i)));
        }
    }

    /**
     * @notice Get the ECDSA passport public key internal representation.
     */
    function getPassportKey(bytes memory passportPublicKey_) external pure returns (uint256) {
        return passportPublicKey_.hash512();
    }
}
