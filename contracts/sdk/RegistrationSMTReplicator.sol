// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ERC1967Utils} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import {SetHelper} from "@solarity/solidity-lib/libs/arrays/SetHelper.sol";
import {TypeCaster} from "@solarity/solidity-lib/libs/utils/TypeCaster.sol";
import {AMultiOwnable} from "@solarity/solidity-lib/access/AMultiOwnable.sol";

import {IPoseidonSMT} from "../interfaces/state/IPoseidonSMT.sol";

/**
 * @title State Replicator for Registration SMT
 * @notice This contract is meant to be deployed on the chain for the Registration SMT is not available.
 * The owner of the replicator will be able to set a set of oracles that can transition the root.
 */
contract RegistrationSMTReplicator is IPoseidonSMT, AMultiOwnable, UUPSUpgradeable {
    using TypeCaster for *;

    using SetHelper for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 public constant ROOT_VALIDITY = 1 hours;
    string public constant REGISTRATION_ROOT_PREFIX = "Rarimo root";

    address public sourceSMT;

    bytes32 public latestRoot;
    uint256 public latestTimestamp;

    mapping(bytes32 root => uint256 transitionTimestamp) internal _roots;

    EnumerableSet.AddressSet internal _oracles;

    modifier onlyOracle() {
        _onlyOracle();
        _;
    }

    event RootTransitioned(bytes32 newRoot, uint256 transitionTimestamp);

    error NotAnOracle(address sender);
    error InvalidSignature();

    function __RegistrationSMTReplicator_init(
        address[] memory oracles_,
        address sourceSMT_
    ) external initializer {
        __AMultiOwnable_init();

        sourceSMT = sourceSMT_;

        _oracles.add(oracles_);
    }

    /*
     * @notice Adds a new oracle to the list of oracles.
     */
    function addOracles(address[] memory oracles_) external onlyOwner {
        _oracles.add(oracles_);
    }

    /*
     * @notice Removes an oracle from the list of oracles.
     */
    function removeOracles(address[] memory oracles_) external onlyOwner {
        _oracles.remove(oracles_);
    }

    /*
     * @notice Transitions the root of the Registration SMT.
     * @param newRoot_ The new root to be set.
     * @param transitionTimestamp_ The timestamp of the transition.
     */
    function transitionRoot(
        bytes32 newRoot_,
        uint256 transitionTimestamp_
    ) external virtual onlyOracle {
        if (_roots[newRoot_] != 0) {
            return;
        }

        _updateRoot(newRoot_, transitionTimestamp_);
    }

    /*
     * @notice Transitions the root of the Registration SMT with signature verification.
     * @param newRoot_ The new root to be set.
     * @param transitionTimestamp_ The timestamp of the transition.
     * @param signature_ The signature from the sourceSMT verifying the root transition.
     */
    function transitionRoot(
        bytes32 newRoot_,
        uint256 transitionTimestamp_,
        bytes memory signature_
    ) external virtual {
        if (_roots[newRoot_] != 0) {
            return;
        }

        bytes32 messageHash_ = keccak256(
            abi.encodePacked(
                REGISTRATION_ROOT_PREFIX,
                sourceSMT,
                address(this),
                newRoot_,
                transitionTimestamp_
            )
        );

        address signer_ = ECDSA.recover(
            MessageHashUtils.toEthSignedMessageHash(messageHash_),
            signature_
        );
        require(isOracle(signer_), NotAnOracle(signer_));

        _updateRoot(newRoot_, transitionTimestamp_);
    }

    /*
     * @notice Checks if the root is valid.
     * The root is valid if it is the latest transited root or if it was transitioned within the ROOT_VALIDITY period.
     */
    function isRootValid(bytes32 root_) external view virtual returns (bool) {
        if (root_ == bytes32(0)) {
            return false;
        }

        return isRootLatest(root_) || _roots[root_] + ROOT_VALIDITY > block.timestamp;
    }

    /*
     * @notice Checks if the root is the latest transited root.
     */
    function isRootLatest(bytes32 root_) public view virtual returns (bool) {
        return root_ == latestRoot;
    }

    /*
     * @notice Checks if the address is an oracle.
     */
    function isOracle(address oracle_) public view returns (bool) {
        return _oracles.contains(oracle_);
    }

    /*
     * @notice Returns the list of oracles.
     */
    function getOracles() external view returns (address[] memory) {
        return _oracles.values();
    }

    function _updateRoot(bytes32 newRoot_, uint256 transitionTimestamp_) internal virtual {
        if (transitionTimestamp_ > latestTimestamp) {
            _roots[latestRoot] = transitionTimestamp_;

            (latestRoot, latestTimestamp) = (newRoot_, transitionTimestamp_);
        } else {
            _roots[newRoot_] = transitionTimestamp_;
        }

        emit RootTransitioned(newRoot_, transitionTimestamp_);
    }

    function _onlyOracle() internal view {
        require(isOracle(msg.sender), NotAnOracle(msg.sender));
    }

    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal virtual override onlyOwner {}

    function implementation() external view returns (address) {
        return ERC1967Utils.getImplementation();
    }
}
