// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {ERC1967Utils} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {TypeCaster} from "@solarity/solidity-lib/libs/utils/TypeCaster.sol";
import {AMultiOwnable} from "@solarity/solidity-lib/access/AMultiOwnable.sol";

contract RegistrationSMTReplicator is AMultiOwnable, UUPSUpgradeable {
    using TypeCaster for *;

    uint256 public constant ROOT_VALIDITY = 1 hours;

    bytes32 public latestRoot;
    uint256 public latestTimestamp;

    mapping(bytes32 root => uint256 transitionTimestamp) internal _roots;

    event RootTransitioned(bytes32 newRoot, uint256 transitionTimestamp);

    function __RegistrationSMTReplicator_init(address[] memory signers_) external initializer {
        __AMultiOwnable_init(signers_);
    }

    function transitionRoot(
        bytes32 newRoot_,
        uint256 transitionTimestamp_,
        bytes calldata proof_
    ) external virtual onlyOwner {
        if (_roots[newRoot_] != 0) {
            return;
        }

        _updateRoot(newRoot_, transitionTimestamp_);
    }

    function isRootValid(bytes32 root_) external view virtual returns (bool) {
        if (root_ == bytes32(0)) {
            return false;
        }

        return isRootLatest(root_) || _roots[root_] + ROOT_VALIDITY > block.timestamp;
    }

    function isRootLatest(bytes32 root_) public view virtual returns (bool) {
        return root_ == latestRoot;
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

    function _authorizeUpgrade(address) internal virtual override onlyOwner {}

    function implementation() external view returns (address) {
        return ERC1967Utils.getImplementation();
    }
}
