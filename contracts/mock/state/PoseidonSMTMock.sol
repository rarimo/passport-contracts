// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {PoseidonSMT} from "../../state/PoseidonSMT.sol";

contract PoseidonSMTMock is PoseidonSMT {
    function mockRoot(bytes32 newRoot_) external {
        _roots[newRoot_] = block.timestamp;
    }
}
