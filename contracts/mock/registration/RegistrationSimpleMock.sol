// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {RegistrationSimple} from "../../registration/RegistrationSimple.sol";

contract RegistrationSimpleMock is RegistrationSimple {
    function registerSimpleMock(
        uint256 identityKey_,
        Passport memory passport_,
        bytes memory signature_
    ) external {
        require(identityKey_ > 0, "RegistrationSimple: identity can not be zero");

        stateKeeper.addBond(
            passport_.publicKey,
            passport_.passportHash,
            bytes32(identityKey_),
            passport_.dgCommit
        );
    }

    function _authorizeUpgrade(address) internal pure virtual override {}
}
