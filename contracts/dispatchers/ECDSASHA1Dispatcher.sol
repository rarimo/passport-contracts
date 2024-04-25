// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {PoseidonUnit2L} from "@iden3/contracts/lib/Poseidon.sol";

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {VerifierHelper} from "@solarity/solidity-lib/libs/zkp/snarkjs/VerifierHelper.sol";

import {IPassportDispatcher} from "../interfaces/dispatchers/IPassportDispatcher.sol";
import {ECDSASHA1Authenticator} from "../authenticators/ECDSASHA1Authenticator.sol";

contract ECDSASHA1Dispatcher is IPassportDispatcher, Initializable {
    using VerifierHelper for address;

    address public authenticator;
    address public verifier;

    function __ECDSASHA1Dispatcher_init(
        address authenticator_,
        address verifier_
    ) external initializer {
        authenticator = authenticator_;
        verifier = verifier_;
    }

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

        return ECDSASHA1Authenticator(authenticator).authenticate(challenge_, r_, s_, x_, y_);
    }

    function verifyZKProof(
        uint256[] memory pubSignals_,
        VerifierHelper.ProofPoints memory zkPoints_
    ) external view returns (bool) {
        return verifier.verifyProof(pubSignals_, zkPoints_);
    }

    function getPassportChallenge(
        uint256 identityKey_
    ) external pure returns (bytes memory challenge_) {
        challenge_ = new bytes(8);

        for (uint256 i = 0; i < challenge_.length; ++i) {
            challenge_[challenge_.length - i - 1] = bytes1(uint8(identityKey_ >> (8 * i)));
        }
    }

    function getPassportKey(bytes memory passportPublicKey_) external pure returns (uint256) {
        uint256[2] memory decomposed_;

        assembly {
            mstore(decomposed_, mload(add(passportPublicKey_, 32)))
            mstore(add(decomposed_, 32), mload(add(passportPublicKey_, 64)))
        }

        decomposed_[0] %= 2 ** 248;
        decomposed_[1] %= 2 ** 248;

        return PoseidonUnit2L.poseidon(decomposed_);
    }
}
