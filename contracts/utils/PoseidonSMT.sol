// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {SparseMerkleTree} from "@solarity/solidity-lib/libs/data-structures/SparseMerkleTree.sol";

import {PoseidonUnit1L, PoseidonUnit2L, PoseidonUnit3L} from "@iden3/contracts/lib/Poseidon.sol";

contract PoseidonSMT {
    using SparseMerkleTree for SparseMerkleTree.Bytes32SMT;

    SparseMerkleTree.Bytes32SMT internal bytes32Tree;

    function __PoseidonSMT_init(uint256 treeHeight_) internal {
        bytes32Tree.initialize(uint64(treeHeight_));
        bytes32Tree.setHashers(_hash2, _hash3);
    }

    function getProof(bytes32 key_) external view returns (SparseMerkleTree.Proof memory) {
        return bytes32Tree.getProof(key_);
    }

    function getRoot() public view returns (bytes32) {
        return bytes32Tree.getRoot();
    }

    function getNodeByKey(bytes32 key_) public view returns (SparseMerkleTree.Node memory) {
        return bytes32Tree.getNodeByKey(key_);
    }

    function _add(bytes32 keyOfElement_, bytes32 element_) internal {
        bytes32Tree.add(keyOfElement_, element_);
    }

    function _hash1(bytes32 element1_) internal pure returns (bytes32) {
        return bytes32(PoseidonUnit1L.poseidon([uint256(element1_)]));
    }

    function _hash2(bytes32 element1_, bytes32 element2_) internal pure returns (bytes32) {
        return bytes32(PoseidonUnit2L.poseidon([uint256(element1_), uint256(element2_)]));
    }

    function _hash3(
        bytes32 element1_,
        bytes32 element2_,
        bytes32 element3_
    ) internal pure returns (bytes32) {
        return
            bytes32(
                PoseidonUnit3L.poseidon(
                    [uint256(element1_), uint256(element2_), uint256(element3_)]
                )
            );
    }
}
