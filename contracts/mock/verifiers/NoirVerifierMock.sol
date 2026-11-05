// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {INoirVerifier} from "../../interfaces/verifiers/INoirVerifier.sol";

contract NoirVerifierMock is INoirVerifier {
    bool public result = true;

    bytes32[] internal _expectedPublicInputs;

    function setResult(bool result_) external {
        result = result_;
    }

    function setExpectedPublicInputs(bytes32[] calldata publicInputs_) external {
        _expectedPublicInputs = publicInputs_;
    }

    function getVerificationKeyHash() external pure returns (bytes32) {}

    function verify(
        bytes calldata,
        bytes32[] calldata publicInputs_
    ) external view returns (bool) {
        if (_expectedPublicInputs.length == 0) {
            return result;
        }

        if (publicInputs_.length != _expectedPublicInputs.length) {
            return false;
        }

        for (uint256 i = 0; i < publicInputs_.length; i++) {
            if (publicInputs_[i] != _expectedPublicInputs[i]) {
                return false;
            }
        }

        return result;
    }
}
