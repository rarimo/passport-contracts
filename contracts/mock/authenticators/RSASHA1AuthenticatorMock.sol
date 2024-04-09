// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {RSASHA1Authenticator} from "../../authenticators/RSASHA1Authenticator.sol";

contract RSASHA1AuthenticatorMock {
    using RSASHA1Authenticator for *;

    function authenticate(
        bytes memory message_,
        bytes memory s_,
        bytes memory e_,
        bytes memory n_
    ) external view returns (bool) {
        return message_.authenticate(s_, e_, n_);
    }
}
