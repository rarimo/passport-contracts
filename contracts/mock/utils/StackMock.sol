// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../../utils/U384.sol";

contract StackMock {
    using U384 for *;

    function modadd(
        bytes memory a_,
        bytes memory b_,
        bytes memory m_
    ) external view returns (bytes memory) {
        uint256 a = a_.init();
        uint256 b = b_.init();
        uint256 m = m_.init();

        uint256 r = a.modadd(b, m);

        return r.toBytes();
    }

    function modsub(
        bytes memory a_,
        bytes memory b_,
        bytes memory m_
    ) external view returns (bytes memory) {
        uint256 a = a_.init();
        uint256 b = b_.init();
        uint256 m = m_.init();

        uint256 r = a.modsub(b, m);

        return r.toBytes();
    }
}
