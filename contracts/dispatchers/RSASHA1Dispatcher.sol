// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {PoseidonUnit5L} from "@iden3/contracts/lib/Poseidon.sol";

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {VerifierHelper} from "@solarity/solidity-lib/libs/zkp/snarkjs/VerifierHelper.sol";

import {IPassportDispatcher} from "../interfaces/dispatchers/IPassportDispatcher.sol";
import {RSASHA1Authenticator} from "../authenticators/RSASHA1Authenticator.sol";

contract RSASHA1Dispatcher is IPassportDispatcher, Initializable {
    using VerifierHelper for address;
    using RSASHA1Authenticator for bytes;

    uint256 public constant E = 65537;

    address public verifier;

    function __RSASHA1Dispather_init(address verifier_) external initializer {
        verifier = verifier_;
    }

    function authenticate(
        bytes memory challenge_,
        bytes memory passportSignature_,
        bytes memory passportPublicKey_
    ) external view returns (bool) {
        return
            challenge_.authenticate(passportSignature_, abi.encodePacked(E), passportPublicKey_);
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
        uint256[5] memory decomposed_;

        assembly {
            for {
                let i := 0
            } lt(i, 5) {
                i := add(i, 1)
            } {
                let someData_ := mload(add(passportPublicKey_, add(32, mul(i, 25))))

                switch i
                case 4 {
                    someData_ := shr(32, someData_)
                }
                default {
                    someData_ := shr(56, someData_)
                }

                mstore(add(decomposed_, mul(i, 32)), someData_)
            }
        }

        return PoseidonUnit5L.poseidon(decomposed_);
    }
}
