// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {DynamicSet} from "@solarity/solidity-lib/libs/data-structures/DynamicSet.sol";

import {StateKeeper} from "../../state/StateKeeper.sol";

contract StateKeeperMock is StateKeeper {
    using DynamicSet for DynamicSet.StringSet;

    function addRegistrations(string[] memory keys_, address[] memory values_) external {
        for (uint256 i = 0; i < keys_.length; i++) {
            require(_registrationKeys.add(keys_[i]), "StateKeeperMock: duplicate registration");
            _registrations[keys_[i]] = values_[i];
            _registrationExists[values_[i]] = true;
        }
    }

    function _authorizeUpgrade(address) internal pure virtual override {}
}
