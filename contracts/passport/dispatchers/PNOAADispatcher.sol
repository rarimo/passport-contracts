// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IPassportDispatcher} from "../../interfaces/dispatchers/IPassportDispatcher.sol";

contract PNOAADispatcher is IPassportDispatcher, Initializable {
    function __PNOAADispatcher_init() external initializer {}

    /**
     * @notice Authenticate the passport without AA. Just return `true`
     */
    function authenticate(
        bytes memory,
        bytes memory passportSignature_,
        bytes memory
    ) external pure returns (bool) {
        return passportSignature_.length == 0;
    }

    /**
     * @notice Passports without AA omit the challenge
     */
    function getPassportChallenge(uint256 identityKey_) external pure returns (bytes memory) {}

    /**
     * @notice Get the passport without AA hash
     */
    function getPassportKey(bytes memory passportHash_) external pure returns (uint256) {
        return uint256(bytes32(passportHash_));
    }
}
