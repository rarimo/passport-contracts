// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {VerifierHelper} from "@solarity/solidity-lib/libs/zkp/snarkjs/VerifierHelper.sol";

/**
 * @notice Passport dispatcher interface
 */
interface IPassportDispatcher {
    function authenticate(
        bytes calldata challenge_,
        bytes calldata passportSignature_,
        bytes calldata passportPublicKey_
    ) external view returns (bool);

    function verifyZKProof(
        uint256[] calldata publicSignals,
        VerifierHelper.ProofPoints calldata zkPoints_
    ) external view returns (bool);

    function getPassportChallenge(
        uint256 identityKey_
    ) external pure returns (bytes memory challenge_);

    function getPassportKey(bytes calldata passportPublicKey_) external pure returns (uint256);
}
