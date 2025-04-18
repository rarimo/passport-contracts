// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {RegistrationSMT} from "../../state/RegistrationSMT.sol";

contract RegistrationSMTMock is RegistrationSMT {
    function mockRoot(bytes32 newRoot_) external {
        _roots[newRoot_] = block.timestamp;
    }
}
