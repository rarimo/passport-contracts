// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IPassportDispatcher} from "../../interfaces/dispatchers/IPassportDispatcher.sol";
import {PRSASHA1Authenticator} from "../authenticators/PRSASHA1Authenticator.sol";
import {Bytes2Poseidon} from "../../utils/Bytes2Poseidon.sol";

contract PRSASHA1Dispatcher is IPassportDispatcher, Initializable {
    using Bytes2Poseidon for bytes;

    address public authenticator;

    function __PRSASHA1Dispatcher_init(address authenticator_) external initializer {
        authenticator = authenticator_;
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
            PRSASHA1Authenticator(authenticator).authenticate(
                challenge_,
                passportSignature_,
                passportPublicKey_
            );
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
     * @notice Get the RSASHA1 passport public key internal representation.
     */
    function getPassportKey(bytes memory passportPublicKey_) external pure returns (uint256) {
        return passportPublicKey_.hash1024();
    }
}
