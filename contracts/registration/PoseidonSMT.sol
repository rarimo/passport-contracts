// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {PermanentOwnable} from "@solarity/solidity-lib/access/PermanentOwnable.sol";
import {SparseMerkleTree} from "@solarity/solidity-lib/libs/data-structures/SparseMerkleTree.sol";

import {PoseidonUnit1L, PoseidonUnit2L, PoseidonUnit3L} from "@iden3/contracts/lib/Poseidon.sol";

contract PoseidonSMT is Initializable {
    using SparseMerkleTree for SparseMerkleTree.Bytes32SMT;

    uint256 public constant ROOT_VALIDITY = 1 hours;

    address public registration;

    mapping(bytes32 => uint256) internal _roots;

    SparseMerkleTree.Bytes32SMT internal _bytes32Tree;

    modifier onlyRegistration() {
        _onlyRegistration();
        _;
    }

    modifier withRootUpdate() {
        _;
        _updateRoot();
    }

    function __PoseidonSMT_init(uint256 treeHeight_, address registration_) external initializer {
        _bytes32Tree.initialize(uint32(treeHeight_));
        _bytes32Tree.setHashers(_hash2, _hash3);

        registration = registration_;
    }

    function add(
        bytes32 keyOfElement_,
        bytes32 element_
    ) external onlyRegistration withRootUpdate {
        _bytes32Tree.add(keyOfElement_, element_);
    }

    function remove(bytes32 keyOfElement_) external onlyRegistration withRootUpdate {
        _bytes32Tree.remove(keyOfElement_);
    }

    function update(
        bytes32 keyOfElement_,
        bytes32 newElement_
    ) external onlyRegistration withRootUpdate {
        _bytes32Tree.update(keyOfElement_, newElement_);
    }

    function getProof(bytes32 key_) external view returns (SparseMerkleTree.Proof memory) {
        return _bytes32Tree.getProof(key_);
    }

    function getRoot() external view returns (bytes32) {
        return _bytes32Tree.getRoot();
    }

    function getNodeByKey(bytes32 key_) external view returns (SparseMerkleTree.Node memory) {
        return _bytes32Tree.getNodeByKey(key_);
    }

    function isRootValid(bytes32 root_) external view returns (bool) {
        if (root_ == bytes32(0)) {
            return false;
        }

        return isRootLatest(root_) || _roots[root_] + ROOT_VALIDITY > block.timestamp;
    }

    function isRootLatest(bytes32 root_) public view returns (bool) {
        return _bytes32Tree.getRoot() == root_;
    }

    function _updateRoot() internal {
        _roots[_bytes32Tree.getRoot()] = block.timestamp;
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
}
