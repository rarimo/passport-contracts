// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {VerifierHelper} from "@solarity/solidity-lib/libs/zkp/snarkjs/VerifierHelper.sol";

import {IPassportDispatcher} from "../interfaces/dispatchers/IPassportDispatcher.sol";
import {RSASHA1Authenticator} from "../authenticators/RSASHA1Authenticator.sol";
import {Bytes2Poseidon} from "../utils/Bytes2Poseidon.sol";

contract RSASHA1Dispatcher is IPassportDispatcher, Initializable {
    using Bytes2Poseidon for bytes;
    using VerifierHelper for address;

    address public authenticator;
    address public verifier;

    function __RSASHA1Dispatcher_init(
        address authenticator_,
        address verifier_
    ) external initializer {
        authenticator = authenticator_;
        verifier = verifier_;
    }

    /**
     * @notice Authenticate the RSASHA1 passport.
     */
    function authenticate(
        bytes memory challenge_,
        bytes memory passportSignature_,
        bytes memory passportPublicKey_
    ) external view returns (bool) {
        return
            RSASHA1Authenticator(authenticator).authenticate(
                challenge_,
                passportSignature_,
                passportPublicKey_
            );
    }

    /**
     * @notice Verify passport validity ZK proof.
     */
    function verifyZKProof(
        uint256[] memory pubSignals_,
        VerifierHelper.ProofPoints memory zkPoints_
    ) external view returns (bool) {
        return verifier.verifyProof(pubSignals_, zkPoints_);
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
     * @notice Get the RSASHA1 passport public key representation
     */
    function getPassportKey(bytes memory passportPublicKey_) external pure returns (uint256) {
        return passportPublicKey_.hash1024();
    }
}
