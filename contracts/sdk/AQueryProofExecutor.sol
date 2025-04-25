// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {PublicSignalsBuilder} from "./lib/PublicSignalsBuilder.sol";

import {INoirVerifier} from "../interfaces/verifiers/INoirVerifier.sol";

/**
 * @title Abstract Query Proof Executor
 * @notice An abstract contract providing a framework for verifying ZK proofs related to user queries,
 * supporting both Circom (Groth16) and Noir systems.
 */
abstract contract AQueryProofExecutor is Initializable {
    using Strings for uint256;
    using PublicSignalsBuilder for uint256;

    // bytes32(uint256(keccak256("rarimo.contract.AQueryProofExecutor")) - 1)
    bytes32 private constant A_BUILDER_STORAGE =
        0x3844f6f56a171c93056bdfb3ce2525778ef493f53ef90b0283983867a69d2128;

    struct AExecutorStorage {
        address registrationSMT;
        address verifier;
    }

    struct ProofPoints {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    error FailedToCallVerifyProof();
    error InvalidNoirProof(bytes32[] pubSignals, bytes zkPoints);
    error InvalidCircomProof(uint256[] pubSignals, ProofPoints zkPoints);

    function __AQueryProofExecutor_init(
        address registrationSMT_,
        address verifier
    ) internal onlyInitializing {
        AExecutorStorage storage $ = _getABuilderStorage();

        $.registrationSMT = registrationSMT_;
        $.verifier = verifier;
    }

    /**
     * @notice Hook executed before the ZK proof verification call.
     * @dev Intended to be overridden by inheriting contracts to perform checks or setup based
     *      on application-specific data encoded in `userPayload_`.
     * @param userPayload_ Encoded application-specific data passed from the external `execute` or `executeNoir` call.
     */
    // solhint-disable-next-line no-empty-blocks
    function _beforeVerify(
        bytes32 registrationRoot_,
        uint256 currentDate_,
        bytes memory userPayload_
    ) public virtual {}

    /**
     * @notice Hook executed after a `successful` ZK proof verification.
     * @dev Intended to be overridden by inheriting contracts to perform actions (e.g., record a vote, update state)
     *      based on application-specific data encoded in `userPayload_`.
     * @param userPayload_ Encoded application-specific data passed from the external `execute` or `executeNoir` call.
     */
    // solhint-disable-next-line no-empty-blocks
    function _afterVerify(
        bytes32 registrationRoot_,
        uint256 currentDate_,
        bytes memory userPayload_
    ) public virtual {}

    /**
     * @notice Abstract function responsible for constructing the public signals array for the ZK proof.
     * @dev This function should decode `userPayload_` and use the `PublicSignalsBuilder` library functions
     * (attached via `using for`) to populate the public signals array based on the specific application's requirements.
     * @param userPayload_ Encoded application-specific data required to build the public signals.
     * @return dataPointer_ A `uint256` representing the memory pointer to the constructed public signals array.
     */
    function _buildPublicSignals(
        bytes32 registrationRoot_,
        uint256 currentDate_,
        bytes memory userPayload_
    ) public virtual returns (uint256 dataPointer_);

    /**
     * @notice Executes the full ZK proof verification workflow for a Circom (Groth16) proof.
     * @param registrationRoot_ The root of the identity SMT against which the proof was generated.
     * @param currentDate_ The current date (encoded as `yyMMdd`) to be included in the public signals.
     * @param userPayload_ Encoded application-specific data to be used by hooks and the signal builder.
     * @param zkPoints_ The Circom Groth16 proof points (`ProofPoints` struct).
     */
    function execute(
        bytes32 registrationRoot_,
        uint256 currentDate_,
        bytes memory userPayload_,
        ProofPoints memory zkPoints_
    ) external {
        _beforeVerify(registrationRoot_, currentDate_, userPayload_);

        uint256 builder_ = _buildPublicSignals(registrationRoot_, currentDate_, userPayload_);
        builder_.withIdStateRoot(registrationRoot_);

        uint256[] memory publicSignals_ = PublicSignalsBuilder.buildAsUintArray(builder_);

        if (!_verifyCircomProof(zkPoints_, publicSignals_)) {
            revert InvalidCircomProof(publicSignals_, zkPoints_);
        }

        _afterVerify(registrationRoot_, currentDate_, userPayload_);
    }

    /**
     * @notice Executes the full ZK proof verification workflow for a Noir proof.
     * @param registrationRoot_ The root of the identity SMT against which the proof was generated.
     * @param currentDate_ The current date (encoded as `yyMMdd`) to be included in the public signals.
     * @param userPayload_ Encoded application-specific data to be used by hooks and the signal builder.
     * @param zkPoints_ The raw bytes of the Noir proof.
     */
    function executeNoir(
        bytes32 registrationRoot_,
        uint256 currentDate_,
        bytes memory userPayload_,
        bytes memory zkPoints_
    ) external {
        _beforeVerify(registrationRoot_, currentDate_, userPayload_);

        uint256 builder_ = _buildPublicSignals(registrationRoot_, currentDate_, userPayload_);
        builder_.withIdStateRoot(registrationRoot_);

        bytes32[] memory publicSignals_ = PublicSignalsBuilder.buildAsBytesArray(builder_);

        AExecutorStorage storage $ = _getABuilderStorage();

        if (!INoirVerifier($.verifier).verify(zkPoints_, publicSignals_)) {
            revert InvalidNoirProof(publicSignals_, zkPoints_);
        }

        _afterVerify(registrationRoot_, currentDate_, userPayload_);
    }

    function getRegistrationSMT() public view returns (address) {
        return _getABuilderStorage().registrationSMT;
    }

    function getVerifier() public view returns (address) {
        return _getABuilderStorage().verifier;
    }

    function _setVerifier(address verifier_) internal {
        _getABuilderStorage().verifier = verifier_;
    }

    function _verifyCircomProof(
        ProofPoints memory zkPoints_,
        uint256[] memory pubSignals_
    ) private view returns (bool) {
        AExecutorStorage storage $ = _getABuilderStorage();

        string memory funcSign_ = string(
            abi.encodePacked(
                "verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[",
                pubSignals_.length.toString(),
                "])"
            )
        );

        /// @dev We have to use abi.encodePacked to encode a dynamic array as a static array (without offset and length)
        (bool success_, bytes memory returnData_) = $.verifier.staticcall(
            abi.encodePacked(
                abi.encodeWithSignature(funcSign_, zkPoints_.a, zkPoints_.b, zkPoints_.c),
                pubSignals_
            )
        );

        if (!success_) revert FailedToCallVerifyProof();

        return abi.decode(returnData_, (bool));
    }

    /**
     * @notice Retrieves the ABuilderStorage storage reference.
     */
    function _getABuilderStorage() private pure returns (AExecutorStorage storage $) {
        assembly {
            $.slot := A_BUILDER_STORAGE
        }
    }
}
