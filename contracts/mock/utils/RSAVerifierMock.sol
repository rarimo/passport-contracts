// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {RSAVerifier} from "../../utils/RSAVerifier.sol";

contract RSAVerifierMock {
    using RSAVerifier for *;

    function verifyPassport(
        bytes memory message_,
        bytes memory s_,
        bytes memory e_,
        bytes memory n_
    ) external view returns (bool) {
        return message_.verifyPassport(s_, e_, n_);
    }
}
