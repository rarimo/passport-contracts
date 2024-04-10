// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {Registration} from "../../registration/Registration.sol";

contract RegistrationMock is Registration {
    function mockPassportData(bytes32 passportKey_, uint256 mockIdentityKey_) external {
        _passportInfos[bytes32(passportKey_)].activeIdentity = bytes32(mockIdentityKey_);
    }

    function mockIdentityData(uint256 identityKey_, bytes32 mockPassportKey_) external {
        _identityInfos[bytes32(identityKey_)].activePassport = bytes32(mockPassportKey_);
    }
}
