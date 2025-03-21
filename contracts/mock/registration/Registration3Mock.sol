// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {Registration3} from "../../registration/Registration3.sol";

contract Registration3Mock is Registration3 {
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
