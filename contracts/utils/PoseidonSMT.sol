// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {PermanentOwnable} from "@solarity/solidity-lib/access/PermanentOwnable.sol";
import {SparseMerkleTree} from "@solarity/solidity-lib/libs/data-structures/SparseMerkleTree.sol";

import {PoseidonUnit1L, PoseidonUnit2L, PoseidonUnit3L} from "@iden3/contracts/lib/Poseidon.sol";

contract PoseidonSMT is Initializable {
    using SparseMerkleTree for SparseMerkleTree.Bytes32SMT;

    address public registration;

    SparseMerkleTree.Bytes32SMT internal bytes32Tree;

    modifier onlyRegistration() {
        _onlyRegistration();
        _;
    }

    function __PoseidonSMT_init(uint256 treeHeight_, address registration_) external initializer {
        bytes32Tree.initialize(uint32(treeHeight_));
        bytes32Tree.setHashers(_hash2, _hash3);

        registration = registration_;
    }

    function add(bytes32 keyOfElement_, bytes32 element_) external onlyRegistration {
        bytes32Tree.add(keyOfElement_, element_);
    }

    function remove(bytes32 keyOfElement_) external onlyRegistration {
        bytes32Tree.remove(keyOfElement_);
    }

    function update(bytes32 keyOfElement_, bytes32 newElement_) external onlyRegistration {
        bytes32Tree.update(keyOfElement_, newElement_);
    }

    function getProof(bytes32 key_) external view returns (SparseMerkleTree.Proof memory) {
        return bytes32Tree.getProof(key_);
    }

    function getRoot() external view returns (bytes32) {
        return bytes32Tree.getRoot();
    }

    function getNodeByKey(bytes32 key_) external view returns (SparseMerkleTree.Node memory) {
        return bytes32Tree.getNodeByKey(key_);
    }

    function _onlyRegistration() internal view {
        require(msg.sender == registration, "PoseidonSMT: not registration");
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

    uint256[45] private _gap;
}
