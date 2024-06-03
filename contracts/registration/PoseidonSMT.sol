// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {SetHelper} from "@solarity/solidity-lib/libs/arrays/SetHelper.sol";
import {SparseMerkleTree} from "@solarity/solidity-lib/libs/data-structures/SparseMerkleTree.sol";

import {PoseidonUnit1L, PoseidonUnit2L, PoseidonUnit3L} from "@iden3/contracts/lib/Poseidon.sol";

import {TSSSigner} from "./TSSSigner.sol";

import {UUPSSignableUpgradeable} from "../utils/UUPSSignableUpgradeable.sol";

contract PoseidonSMT is Initializable, UUPSSignableUpgradeable, TSSSigner {
    using SparseMerkleTree for SparseMerkleTree.Bytes32SMT;
    using SetHelper for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 public constant ROOT_VALIDITY = 1 hours;

    enum MethodId {
        None,
        AuthorizeUpgrade,
        AddRegistrations,
        RemoveRegistrations
    }

    EnumerableSet.AddressSet internal _registrations;

    mapping(bytes32 => uint256) internal _roots;

    SparseMerkleTree.Bytes32SMT internal _bytes32Tree;

    event RootUpdated(bytes32 root);

    modifier onlyRegistration() {
        _onlyRegistration();
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
        address signer_,
        string calldata chainName_,
        uint256 treeHeight_,
        address registration_
    ) external initializer {
        __TSSSigner_init(signer_, chainName_);

        _bytes32Tree.initialize(uint32(treeHeight_));
        _bytes32Tree.setHashers(_hash2, _hash3);

        _registrations.add(registration_);
    }

    /**
     * @notice Add or Remove registrations via Rarimo TSS
     * @param methodId_ the method id (AddRegistrations or RemoveRegistrations)
     * @param data_ An ABI encoded array of addresses to add or remove
     * @param proof_ the Rarimo TSS signature with MTP
     */
    function updateRegistrationSet(
        MethodId methodId_,
        bytes calldata data_,
        bytes calldata proof_
    ) external {
        uint256 nonce_ = _getAndIncrementNonce(uint8(methodId_));
        bytes32 leaf_ = keccak256(
            abi.encodePacked(address(this), methodId_, data_, chainName, nonce_)
        );

        _checkMerkleSignature(leaf_, proof_);
        _useNonce(uint8(methodId_), nonce_);

        if (methodId_ == MethodId.AddRegistrations) {
            _registrations.add(abi.decode(data_, (address[])));
        } else if (methodId_ == MethodId.RemoveRegistrations) {
            _registrations.remove(abi.decode(data_, (address[])));
        } else {
            revert("PoseidonSMT: Invalid method");
        }
    }

    /**
     * @notice Change the Rarimo TSS signer via Rarimo TSS
     * @param newSignerPubKey_ the new signer public key
     * @param signature_ the Rarimo TSS signature
     */
    function changeSigner(bytes memory newSignerPubKey_, bytes memory signature_) external {
        _checkSignature(keccak256(newSignerPubKey_), signature_);

        signer = _convertPubKeyToAddress(newSignerPubKey_);
    }

    /**
     * @notice Adds the new element to the tree.
     */
    function add(
        bytes32 keyOfElement_,
        bytes32 element_
    ) external onlyRegistration withRootUpdate {
        _bytes32Tree.add(keyOfElement_, element_);
    }

    /**
     * @notice Removes the element from the tree.
     */
    function remove(bytes32 keyOfElement_) external onlyRegistration withRootUpdate {
        _bytes32Tree.remove(keyOfElement_);
    }

    /**
     * @notice Updates the element in the tree.
     */
    function update(
        bytes32 keyOfElement_,
        bytes32 newElement_
    ) external onlyRegistration withRootUpdate {
        _bytes32Tree.update(keyOfElement_, newElement_);
    }

    /**
     * @notice Gets Merkle (inclusion/exclusion) proof of the element.
     */
    function getProof(bytes32 key_) external view returns (SparseMerkleTree.Proof memory) {
        return _bytes32Tree.getProof(key_);
    }

    /**
     * @notice Gets the SMT root
     */
    function getRoot() external view returns (bytes32) {
        return _bytes32Tree.getRoot();
    }

    /**
     * @notice Gets the node info by its key.
     */
    function getNodeByKey(bytes32 key_) external view returns (SparseMerkleTree.Node memory) {
        return _bytes32Tree.getNodeByKey(key_);
    }

    /**
     * @notice Check if the SMT root is valid. Zero root in always invalid and latest root is always a valid one.
     */
    function isRootValid(bytes32 root_) external view returns (bool) {
        if (root_ == bytes32(0)) {
            return false;
        }

        return isRootLatest(root_) || _roots[root_] + ROOT_VALIDITY > block.timestamp;
    }

    /**
     * @notice Check if the SMT root is a latest one
     */
    function isRootLatest(bytes32 root_) public view returns (bool) {
        return _bytes32Tree.getRoot() == root_;
    }

    function getRegistrations() external view returns (address[] memory) {
        return _registrations.values();
    }

    function isRegistrationExists(address registration_) external view returns (bool) {
        return _registrations.contains(registration_);
    }

    function _saveRoot() internal {
        _roots[_bytes32Tree.getRoot()] = block.timestamp;
    }

    function _notifyRoot() internal {
        emit RootUpdated(_bytes32Tree.getRoot());
    }

    function _onlyRegistration() internal view {
        require(_registrations.contains(msg.sender), "PoseidonSMT: not registration");
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

    function _authorizeUpgrade(address) internal pure virtual override {
        revert("PoseidonSMT: This upgrade method is off");
    }

    function _authorizeUpgrade(
        address newImplementation_,
        bytes calldata proof_
    ) internal override {
        require(newImplementation_ != address(0), "PoseidonSMT: Zero address");

        uint256 nonce_ = _getAndIncrementNonce(uint8(MethodId.AuthorizeUpgrade));
        bytes32 leaf_ = keccak256(
            abi.encodePacked(
                address(this),
                uint8(MethodId.AuthorizeUpgrade),
                newImplementation_,
                chainName,
                nonce_
            )
        );

        _checkMerkleSignature(leaf_, proof_);
        _useNonce(uint8(MethodId.AuthorizeUpgrade), nonce_);
    }

    function implementation() external view returns (address) {
        return _getImplementation();
    }
}
