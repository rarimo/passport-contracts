// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {DynamicSet} from "@solarity/solidity-lib/libs/data-structures/DynamicSet.sol";

import {StateKeeper} from "../../state/StateKeeper.sol";

contract StateKeeperMock is StateKeeper {
    using DynamicSet for DynamicSet.StringSet;

    function mockAddRegistrations(string[] memory keys_, address[] memory values_) external {
        for (uint256 i = 0; i < keys_.length; i++) {
            require(_registrationKeys.add(keys_[i]), "StateKeeperMock: duplicate registration");
            _registrations[keys_[i]] = values_[i];
            _registrationExists[values_[i]] = true;
        }
    }

    function mockChangeICAOMasterTreeRoot(bytes32 newRoot_) external {
        icaoMasterTreeMerkleRoot = newRoot_;
    }

    function mockPassportData(bytes32 passportKey_, bytes32 mockIdentityKey_) external {
        _passportInfos[passportKey_].activeIdentity = mockIdentityKey_;
    }

    function mockIdentityData(bytes32 identityKey_, bytes32 mockPassportKey_) external {
        _identityInfos[identityKey_].activePassport = mockPassportKey_;
    }

    function _authorizeUpgrade(address) internal pure virtual override {}
}
