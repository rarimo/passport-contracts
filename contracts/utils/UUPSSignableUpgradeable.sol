// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

abstract contract UUPSSignableUpgradeable is UUPSUpgradeable {
    function _authorizeUpgrade(
        address newImplementation_,
        bytes calldata signature_
    ) internal virtual;

    function upgradeToWithProof(
        address newImplementation_,
        bytes calldata proof_
    ) external virtual onlyProxy {
        _authorizeUpgrade(newImplementation_, proof_);
        _upgradeToAndCallUUPS(newImplementation_, new bytes(0), false);
    }

    function upgradeToAndCallWithProof(
        address newImplementation_,
        bytes calldata proof_,
        bytes calldata data_
    ) external virtual onlyProxy {
        _authorizeUpgrade(newImplementation_, proof_);
        _upgradeToAndCallUUPS(newImplementation_, data_, true);
    }
}
