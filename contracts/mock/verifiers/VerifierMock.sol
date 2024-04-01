// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

contract VerifierMock {
    function verifyProof(
        uint256[2] calldata pA_,
        uint256[2][2] calldata pB_,
        uint256[2] calldata pC_,
        uint256[4] calldata pubSignals_
    ) public view returns (bool) {
        return true;
    }
}
