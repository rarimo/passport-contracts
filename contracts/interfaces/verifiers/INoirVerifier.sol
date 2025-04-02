// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

interface INoirVerifier {
    /**
     * @notice Returns the hash of the verification key used by this contract.
     * @return The 32-byte verification key hash.
     */
    function getVerificationKeyHash() external pure returns (bytes32);

    /**
     * @notice Verify a Ultra Plonk proof.
     * @param _proof The serialized proof data.
     * @param _publicInputs An array of the public inputs for the proof.
     * @return True if the proof is valid, reverts otherwise.
     */
    function verify(
        bytes calldata _proof,
        bytes32[] calldata _publicInputs
    ) external view returns (bool);
}
