// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {SetHelper} from "@solarity/solidity-lib/libs/arrays/SetHelper.sol";

import {StateKeeper} from "../../state/StateKeeper.sol";

contract StateKeeperMock is StateKeeper {
    using SetHelper for EnumerableSet.AddressSet;

    function addRegistrations(address[] memory registrations_) external {
        _registrations.add(registrations_);
    }

    function _authorizeUpgrade(address) internal pure virtual override {}
}
