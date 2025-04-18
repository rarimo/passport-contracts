// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {SparseMerkleTree} from "@solarity/solidity-lib/libs/data-structures/SparseMerkleTree.sol";

import {PoseidonSMT} from "./PoseidonSMT.sol";
import {L1RegistrationState} from "./L1RegistrationState.sol";

import {IMessageService} from "../interfaces/rollup/IMessageService.sol";

contract RegistrationSMT is PoseidonSMT {
    using SparseMerkleTree for SparseMerkleTree.Bytes32SMT;

    address public l2MessageService;
    address public l1RegistrationState;

    function __SetL1TransitionRootData_init(
        address l2MessageService_,
        address l1RegistrationState_
    ) external reinitializer(2) {
        l2MessageService = l2MessageService_;
        l1RegistrationState = l1RegistrationState_;
    }

    function _commitRoot() internal override {
        bytes32 root_ = _bytes32Tree.getRoot();

        IMessageService(l2MessageService).sendMessage(
            l1RegistrationState,
            0,
            abi.encodeWithSelector(
                L1RegistrationState.setRegistrationRoot.selector,
                root_,
                block.timestamp
            )
        );

        super._commitRoot();
    }

    function setL1RegistrationState(address l1RegistrationState_) external onlyOwner {
        l1RegistrationState = l1RegistrationState_;
    }

    function setL2MessageService(address l2MessageService_) external onlyOwner {
        l2MessageService = l2MessageService_;
    }
}
