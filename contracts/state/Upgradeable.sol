// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {TSSSigner} from "./TSSSigner.sol";

import {UUPSSignableUpgradeable} from "../utils/UUPSSignableUpgradeable.sol";

abstract contract Upgradeable is UUPSSignableUpgradeable, TSSSigner {
    uint8 public constant MAGIC_ID = 255;

    function implementation() external view returns (address) {
        return _getImplementation();
    }

    function _authorizeUpgrade(address) internal pure virtual override {
        revert("Upgradeable: This upgrade method is off");
    }

    function _authorizeUpgrade(
        address newImplementation_,
        bytes calldata proof_
    ) internal override {
        require(newImplementation_ != address(0), "Upgradeable: Zero address");

        uint256 nonce_ = _getAndIncrementNonce(MAGIC_ID);
        bytes32 leaf_ = keccak256(
            abi.encodePacked(address(this), MAGIC_ID, newImplementation_, chainName, nonce_)
        );

        _checkMerkleSignature(leaf_, proof_);
        _useNonce(MAGIC_ID, nonce_);
    }
}
