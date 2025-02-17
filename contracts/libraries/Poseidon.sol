// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

// solhint-disable

library Poseidon1L {
    function poseidon(bytes32[1] calldata) public pure returns (bytes32) {}
}

library Poseidon2L {
    function poseidon(bytes32[2] calldata) public pure returns (bytes32) {}
}

library Poseidon3L {
    function poseidon(bytes32[3] calldata) public pure returns (bytes32) {}
}

library Poseidon4L {
    function poseidon(bytes32[4] calldata) public pure returns (bytes32) {}
}

library Poseidon5L {
    function poseidon(bytes32[5] calldata) public pure returns (bytes32) {}
}

library PoseidonUnit1L {
    function poseidon(uint256[1] calldata) public pure returns (uint256) {}
}

library PoseidonUnit2L {
    function poseidon(uint256[2] calldata) public pure returns (uint256) {}
}

library PoseidonUnit3L {
    function poseidon(uint256[3] calldata) public pure returns (uint256) {}
}

library PoseidonUnit4L {
    function poseidon(uint256[4] calldata) public pure returns (uint256) {}
}

library PoseidonUnit5L {
    function poseidon(uint256[5] calldata) public pure returns (uint256) {}
}
