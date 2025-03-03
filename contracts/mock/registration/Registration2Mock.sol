// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {Registration2, IPassportDispatcher} from "../../registration/Registration2.sol";

contract Registration2Mock is Registration2 {
    function registerDep(
        bytes32 certificatesRoot_,
        uint256 identityKey_,
        uint256 dgCommit_,
        Passport memory passport_
    ) external {
        require(identityKey_ > 0, "Registration: identity can not be zero");

        IPassportDispatcher dispatcher_ = _getPassportDispatcher(passport_.dataType);
        uint256 passportKey_ = dispatcher_.getPassportKey(passport_.publicKey);

        stateKeeper.addBond(
            bytes32(passportKey_),
            passport_.passportHash,
            bytes32(identityKey_),
            dgCommit_
        );
    }

    function mockAddCertificateDispatcher(bytes32 dispatcherType_, address dispatcher_) external {
        _addDependency(certificateDispatchers, dispatcherType_, dispatcher_);
    }

    function mockAddPassportDispatcher(bytes32 dispatcherType_, address dispatcher_) external {
        _addDependency(passportDispatchers, dispatcherType_, dispatcher_);
    }

    function mockAddPassportVerifier(bytes32 verifierType_, address verifier_) external {
        _addDependency(passportVerifiers, verifierType_, verifier_);
    }

    function _authorizeUpgrade(address) internal pure virtual override {}
}
