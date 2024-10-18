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

    function modmul(
        bytes memory a_,
        bytes memory b_,
        bytes memory m_
    ) external view returns (bytes memory) {
        uint256 a = a_.init();
        uint256 b = b_.init();
        uint256 m = m_.init();

        uint256 r = a.modmul(b, m);

        return r.toBytes();
    }

    function cmp(bytes memory a_, bytes memory b_) external view returns (int256) {
        uint256 a = a_.init();
        uint256 b = b_.init();

        return a.cmp(b);
    }

    function modexp(
        bytes memory b_,
        uint256 eInteger_,
        bytes memory m_
    ) external view returns (bytes memory) {
        uint256 b = b_.init();
        uint256 m = m_.init();

        uint256 r = b.modexp(eInteger_, m);

        return r.toBytes();
    }

    function moddiv(
        bytes memory a_,
        bytes memory b_,
        bytes memory m_
    ) external view returns (bytes memory) {
        uint256 a = a_.init();
        uint256 b = b_.init();
        uint256 m = m_.init();

        uint256 r = a.moddiv(b, m);

        return r.toBytes();
    }

    function cmpInteger(bytes memory a_, uint256 bInteger_) external view returns (int256) {
        uint256 a = a_.init();

        return a.cmpInteger(bInteger_);
    }
}
