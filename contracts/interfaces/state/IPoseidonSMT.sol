// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IPoseidonSMT {
    function ROOT_VALIDITY() external view returns (uint256);

    function getRootValidity() external view returns (uint256);

    function isRootValid(bytes32 root_) external view returns (bool);
}
