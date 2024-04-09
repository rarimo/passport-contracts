// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {Registration} from "../../registration/Registration.sol";

contract RegistrationMock is Registration {
    function mockPassportData(bytes memory passportPublicKey_, uint256 mockIdentityKey_) external {
        uint256 passportKey_ = _getPassportKey(passportPublicKey_);

        _passportInfos[bytes32(passportKey_)].activeIdentity = bytes32(mockIdentityKey_);
    }

    function mockIdentityData(uint256 identityKey_, bytes memory mockPassportPublicKey_) external {
        uint256 passportKey_ = _getPassportKey(mockPassportPublicKey_);

        _identityInfos[bytes32(identityKey_)].activePassport = bytes32(passportKey_);
    }
}
