// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ERC1967Utils} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {SparseMerkleTree} from "@solarity/solidity-lib/libs/data-structures/SparseMerkleTree.sol";

import {IEvidenceRegistry} from "@rarimo/evidence-registry/interfaces/IEvidenceRegistry.sol";

import {StateKeeper} from "./StateKeeper.sol";

import {PoseidonUnit2L, PoseidonUnit3L} from "../libraries/Poseidon.sol";

contract PoseidonSMT is Initializable, UUPSUpgradeable {
    using SparseMerkleTree for SparseMerkleTree.Bytes32SMT;

    uint256 public constant ROOT_VALIDITY = 1 hours;

    address public stateKeeper;
    address public evidenceRegistry;

    mapping(bytes32 => uint256) internal _roots;

    SparseMerkleTree.Bytes32SMT internal _bytes32Tree;

    event RootUpdated(bytes32 root);

    modifier onlyStateKeeper() {
        _onlyStateKeeper();
        _;
    }

    modifier withRootUpdate() {
        _saveRoot();
        _;
        _notifyRoot();
    }

    constructor() {
        _disableInitializers();
    }

    function __PoseidonSMT_init(
        address stateKeeper_,
        address evidenceRegistry_,
        uint256 treeHeight_
    ) external initializer {
        _bytes32Tree.initialize(uint32(treeHeight_));
        _bytes32Tree.setHashers(_hash2, _hash3);

        stateKeeper = stateKeeper_;
        evidenceRegistry = evidenceRegistry_;
    }

    /**
     * @notice Adds the new element to the tree.
     */
    function add(
        bytes32 keyOfElement_,
        bytes32 element_
    ) external virtual onlyStateKeeper withRootUpdate {
        _bytes32Tree.add(keyOfElement_, element_);
    }

    /**
     * @notice Removes the element from the tree.
     */
    function remove(bytes32 keyOfElement_) external virtual onlyStateKeeper withRootUpdate {
        _bytes32Tree.remove(keyOfElement_);
    }

    /**
     * @notice Updates the element in the tree.
     */
    function update(
        bytes32 keyOfElement_,
        bytes32 newElement_
    ) external virtual onlyStateKeeper withRootUpdate {
        _bytes32Tree.update(keyOfElement_, newElement_);
    }

    /**
     * @notice Gets Merkle (inclusion/exclusion) proof of the element.
     */
    function getProof(bytes32 key_) external view virtual returns (SparseMerkleTree.Proof memory) {
        return _bytes32Tree.getProof(key_);
    }

    /**
     * @notice Gets the SMT root
     */
    function getRoot() external view virtual returns (bytes32) {
        return _bytes32Tree.getRoot();
    }

    /**
     * @notice Gets the node info by its key.
     */
    function getNodeByKey(
        bytes32 key_
    ) external view virtual returns (SparseMerkleTree.Node memory) {
        return _bytes32Tree.getNodeByKey(key_);
    }

    /**
     * @notice Check if the SMT root is valid. Zero root in always invalid and latest root is always a valid one.
     */
    function isRootValid(bytes32 root_) external view virtual returns (bool) {
        if (root_ == bytes32(0)) {
            return false;
        }

        return isRootLatest(root_) || _roots[root_] + ROOT_VALIDITY > block.timestamp;
    }

    /**
     * @notice Check if the SMT root is a latest one
     */
    function isRootLatest(bytes32 root_) public view virtual returns (bool) {
        return _bytes32Tree.getRoot() == root_;
    }

    function _saveRoot() internal {
        _roots[_bytes32Tree.getRoot()] = block.timestamp;
    }

    function _notifyRoot() internal {
        bytes32 root_ = _bytes32Tree.getRoot();

        IEvidenceRegistry(evidenceRegistry).addStatement(root_, bytes32(block.timestamp));

        emit RootUpdated(root_);
    }

    function _onlyStateKeeper() internal view {
        require(stateKeeper == msg.sender, "PoseidonSMT: not a state keeper");
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

    function _onlyOwner() internal view {
        require(StateKeeper(stateKeeper).isOwner(msg.sender), "Registration: not an owner");
    }

    function _authorizeUpgrade(address) internal virtual override {
        _onlyOwner();
    }

    function implementation() external view returns (address) {
        return ERC1967Utils.getImplementation();
    }
}
