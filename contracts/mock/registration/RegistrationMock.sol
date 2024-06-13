// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {Registration} from "../../registration/Registration.sol";

contract RegistrationMock is Registration {
    function mockAddPassportDispatcher(bytes32 dispatcherType_, address dispatcher_) external {
        _addDispatcher(passportDispatchers, dispatcherType_, dispatcher_);
    }

    function mockAddCertificateDispatcher(bytes32 dispatcherType_, address dispatcher_) external {
        _addDispatcher(certificateDispatchers, dispatcherType_, dispatcher_);
    }

    function _authorizeUpgrade(address) internal pure virtual override {}
}
