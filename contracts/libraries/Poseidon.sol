// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

// solhint-disable

import {PoseidonT2} from "poseidon-solidity/PoseidonT2.sol";
import {PoseidonT3} from "poseidon-solidity/PoseidonT3.sol";
import {PoseidonT4} from "poseidon-solidity/PoseidonT4.sol";
import {PoseidonT5} from "poseidon-solidity/PoseidonT5.sol";
import {PoseidonT6} from "poseidon-solidity/PoseidonT6.sol";

library PoseidonUnit1L {
    function poseidon(uint256[1] calldata inputs_) public pure returns (uint256) {
        return PoseidonT2.hash([inputs_[0]]);
    }
}

library PoseidonUnit2L {
    function poseidon(uint256[2] calldata inputs_) public pure returns (uint256) {
        return PoseidonT3.hash([inputs_[0], inputs_[1]]);
    }
}

library PoseidonUnit3L {
    function poseidon(uint256[3] calldata inputs_) public pure returns (uint256) {
        return PoseidonT4.hash([inputs_[0], inputs_[1], inputs_[2]]);
    }
}

library PoseidonUnit4L {
    function poseidon(uint256[4] calldata inputs_) public pure returns (uint256) {
        return PoseidonT5.hash([inputs_[0], inputs_[1], inputs_[2], inputs_[3]]);
    }
}

library PoseidonUnit5L {
    function poseidon(uint256[5] calldata inputs_) public pure returns (uint256) {
        return PoseidonT6.hash([inputs_[0], inputs_[1], inputs_[2], inputs_[3], inputs_[4]]);
    }
}
