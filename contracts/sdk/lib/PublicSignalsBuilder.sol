// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {AQueryProofExecutor} from "../AQueryProofExecutor.sol";

import {IPoseidonSMT} from "../../interfaces/state/IPoseidonSMT.sol";

import {Date2Time} from "../../utils/Date2Time.sol";

/**
 * @title PublicSignalsBuilder Library.
 * @notice Provides helper functions to construct the public signals array for ZK proof verification.
 *
 * MUST be used together with AQueryProofExecutor, because it relies on the ABuilderStorage storage for validations.
 *
 * @dev This library facilitates setting specific values at predefined indices within the public signals array,
 *      which is expected by the verifier contract. The indices correspond to the specification detailed
 *      at: https://github.com/rarimo/passport-zk-circuits/?tab=readme-ov-file#query-circuit-public-signals
 * Detailed documentation: https://github.com/rarimo/docs/blob/Add-table-with-query-proof-pub-signals-description/docs/zk-passport/query-proof-table.md#verificator-svc-parametert-table
 */
library PublicSignalsBuilder {
    uint256 public constant PROOF_SIGNALS_COUNT = 23;
    uint256 public constant ZERO_DATE = 0x303030303030;

    // bytes32(uint256(keccak256("rarimo.contract.AQueryProofExecutor")) - 1)
    bytes32 public constant A_BUILDER_STORAGE =
        0x3844f6f56a171c93056bdfb3ce2525778ef493f53ef90b0283983867a69d2128;

    error InvalidDate(uint256 parsedTimestamp, uint256 currentTimestamp);
    error InvalidRegistrationRoot(address registrationSMT, bytes32 registrationRoot);

    function newPublicSignalsBuilder(
        uint256 selector_,
        uint256 nullifier_
    ) internal pure returns (uint256 dataPointer_) {
        uint256[] memory pubSignals_ = new uint256[](PROOF_SIGNALS_COUNT);

        assembly {
            dataPointer_ := pubSignals_

            // 32 + 0 = 32
            mstore(add(dataPointer_, 32), nullifier_)
            // 32 + 12*32 = 32 + 384 = 416
            mstore(add(dataPointer_, 416), selector_)

            // currentDate_
            mstore(add(dataPointer_, 448), ZERO_DATE)
            // birthDateLowerbound_
            mstore(add(dataPointer_, 608), ZERO_DATE)
            // birthDateUpperbound_
            mstore(add(dataPointer_, 640), ZERO_DATE)
            // expirationDateLowerbound_
            mstore(add(dataPointer_, 672), ZERO_DATE)
            // expirationDateUpperbound_
            mstore(add(dataPointer_, 704), ZERO_DATE)
        }
    }

    /**
     * @notice Sets the name (first name, index 3) in the public signals array.
     * @dev Represents the first name of the user.
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param name_ The first name value (encoded).
     */
    function withName(uint256 dataPointer_, uint256 name_) internal pure {
        assembly {
            // 32 + 3 * 32 = 32 + 96 = 128
            mstore(add(dataPointer_, 128), name_)
        }
    }

    /**
     * @notice Sets the nameResidual (last name, index 4) in the public signals array.
     * @dev Represents the last name of the user.
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param nameResidual_ The last name value (encoded).
     */
    function withNameResidual(uint256 dataPointer_, uint256 nameResidual_) internal pure {
        assembly {
            // 32 + 4 * 32 = 32 + 128 = 160
            mstore(add(dataPointer_, 160), nameResidual_)
        }
    }

    /**
     * @notice Sets the nationality (index 5) in the public signals array.
     * @dev Nationality in ISO 3166-1 alpha-3 format (encoded).
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param nationality_ The nationality value (encoded).
     */
    function withNationality(uint256 dataPointer_, uint256 nationality_) internal pure {
        assembly {
            // 32 + 5 * 32 = 32 + 160 = 192
            mstore(add(dataPointer_, 192), nationality_)
        }
    }

    /**
     * @notice Sets the citizenship (index 6) in the public signals array.
     * @dev Citizenship in ISO 3166-1 alpha-3 format (encoded).
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param citizenship_ The citizenship value (encoded).
     */
    function withCitizenship(uint256 dataPointer_, uint256 citizenship_) internal pure {
        assembly {
            // 32 + 6 * 32 = 32 + 192 = 224
            mstore(add(dataPointer_, 224), citizenship_)
        }
    }

    /**
     * @notice Sets the sex (index 7) in the public signals array.
     * @dev Represents the sex of the user (e.g., encoded 'M' or 'F').
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param sex_ The sex value (encoded).
     */
    function withSex(uint256 dataPointer_, uint256 sex_) internal pure {
        assembly {
            // 32 + 7 * 32 = 32 + 224 = 256
            mstore(add(dataPointer_, 256), sex_)
        }
    }

    /**
     * @notice Sets the eventId (index 9) and eventData (index 10) in the public signals array.
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param eventId_ Unique random identifier of the event, guaranteeing untraceability.
     * @param eventData_ Arbitrary data associated with the event (e.g., ETH address, hash of email). Constraints may apply.
     */
    function withEventIdAndData(
        uint256 dataPointer_,
        uint256 eventId_,
        uint256 eventData_
    ) internal pure {
        assembly {
            // 32 + 9 * 32 = 32 + 288 = 320
            mstore(add(dataPointer_, 320), eventId_)
            // 32 + 10 * 32 = 32 + 320 = 352
            mstore(add(dataPointer_, 352), eventData_)
        }
    }

    /**
     * @notice Sets the idStateRoot (index 11) in the public signals array.
     * @dev Root of the identity registration Merkle tree.
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param idStateRoot_ The Merkle root value.
     */
    function withIdStateRoot(uint256 dataPointer_, bytes32 idStateRoot_) internal view {
        AQueryProofExecutor.ABuilderStorage storage $ = getABuilderStorage();

        if (!IPoseidonSMT($.registrationSMT).isRootValid(idStateRoot_)) {
            revert InvalidRegistrationRoot($.registrationSMT, idStateRoot_);
        }

        assembly {
            // 32 + 11 * 32 = 32 + 352 = 384
            mstore(add(dataPointer_, 384), idStateRoot_)
        }
    }

    /**
     * @notice Sets the selector (index 12) in the public signals array.
     * @dev Bitmask indicating which fields are selected to be revealed/checked.
     *      See https://github.com/rarimo/passport-zk-circuits/blob/main/README.md#selector
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param selector_ The selector bitmask value.
     */
    function withSelector(uint256 dataPointer_, uint256 selector_) internal pure {
        assembly {
            // 32 + 12 * 32 = 32 + 384 = 416
            mstore(add(dataPointer_, 416), selector_)
        }
    }

    /**
     * @notice Sets the currentDate (index 13) in the public signals array.
     * @dev Current date in `yyMMdd` format (encoded).
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param currentDate_ The current date value (encoded).
     */
    function withCurrentDate(uint256 dataPointer_, uint256 currentDate_) internal view {
        uint256 parsedTimestamp_ = Date2Time.timestampFromDate(currentDate_);
        if (!validateDate(parsedTimestamp_)) {
            revert InvalidDate(parsedTimestamp_, block.timestamp);
        }

        assembly {
            // 32 + 13 * 32 = 32 + 416 = 448
            mstore(add(dataPointer_, 448), currentDate_)
        }
    }

    /**
     * @notice Sets timestampLowerbound (index 14) and timestampUpperbound (index 15) in the public signals array that
     * are used for uniqueness checks.
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param timestampLowerbound_ The lower bound timestamp value. Must be less than the passport registration time.
     * @param timestampUpperbound_ The upper bound timestamp value. Must be greater than the passport registration time.
     */
    function withTimestampLowerboundAndUpperbound(
        uint256 dataPointer_,
        uint256 timestampLowerbound_,
        uint256 timestampUpperbound_
    ) internal pure {
        assembly {
            // 32 + 14 * 32 = 32 + 448 = 480
            mstore(add(dataPointer_, 480), timestampLowerbound_)
            // 32 + 15 * 32 = 32 + 480 = 512
            mstore(add(dataPointer_, 512), timestampUpperbound_)
        }
    }

    /**
     * @notice Sets identityCounterLowerbound (index 16) and identityCounterUpperbound (index 17) in the public signals array that
     * are used for uniqueness checks.
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param identityCounterLowerbound_ The lower bound identity counter value. must be less than
     * the number of registrations of the same passport.
     * @param identityCounterUpperbound_ The upper bound identity counter value. Must be
     * greater than or equal to the number of registrations of the same passport.
     * Often set to 1 for single registration check
     */
    function withIdentityCounterLowerbound(
        uint256 dataPointer_,
        uint256 identityCounterLowerbound_,
        uint256 identityCounterUpperbound_
    ) internal pure {
        assembly {
            // 32 + 16 * 32 = 32 + 512 = 544
            mstore(add(dataPointer_, 544), identityCounterLowerbound_)
            // 32 + 17 * 32 = 32 + 544 = 576
            mstore(add(dataPointer_, 576), identityCounterUpperbound_)
        }
    }

    /**
     * @notice Sets the birthDateLowerbound (index 18) and birthDateUpperbound (index 19) in the public
     * signals array that are used for age checks.
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param birthDateLowerbound_ The lower bound birth date value (encoded). Must be less than the
     * actual birth date (encoded `yyMMdd`).
     * @param birthDateUpperbound_ The upper bound birth date value (encoded). Must be greater than
     * the actual birth date (encoded `yyMMdd`).
     */
    function withBirthDateLowerboundAndUpperbound(
        uint256 dataPointer_,
        uint256 birthDateLowerbound_,
        uint256 birthDateUpperbound_
    ) internal pure {
        assembly {
            // 32 + 18 * 32 = 32 + 576 = 608
            mstore(add(dataPointer_, 608), birthDateLowerbound_)
            // 32 + 19 * 32 = 32 + 608 = 640
            mstore(add(dataPointer_, 640), birthDateUpperbound_)
        }
    }

    /**
     * @notice Sets expirationDateLowerbound (index 20) and expirationDateUpperbound (index 21) in the
     * public signals array.
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param expirationDateLowerbound_ The lower bound expiration date value (encoded). Must be less
     * than the passport expiration date (encoded `yyMMdd`).
     * @param expirationDateUpperbound_ The upper bound expiration date value (encoded). Must be greater
     * than the passport expiration date (encoded `yyMMdd`).
     */
    function withExpirationDateLowerboundAndUpperbound(
        uint256 dataPointer_,
        uint256 expirationDateLowerbound_,
        uint256 expirationDateUpperbound_
    ) internal pure {
        assembly {
            // 32 + 20 * 32 = 32 + 640 = 672
            mstore(add(dataPointer_, 672), expirationDateLowerbound_)
            // 32 + 21 * 32 = 32 + 672 = 704
            mstore(add(dataPointer_, 704), expirationDateUpperbound_)
        }
    }

    /**
     * @notice Sets the citizenshipMask (index 22) in the public signals array.
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param citizenshipMask_ The citizenship mask value.
     */
    function withCitizenshipMask(uint256 dataPointer_, uint256 citizenshipMask_) internal pure {
        assembly {
            // 32 + 22 * 32 = 32 + 704 = 736
            mstore(add(dataPointer_, 736), citizenshipMask_)
        }
    }

    /**
     * @notice Converts the public signals array to a uint256 array.
     */
    function buildAsUintArray(
        uint256 dataPointer_
    ) internal pure returns (uint256[] memory pubSignals_) {
        assembly {
            pubSignals_ := dataPointer_
        }
    }

    /**
     * @notice Converts the public signals array to a bytes32 array.
     */
    function buildAsBytesArray(
        uint256 dataPointer_
    ) internal pure returns (bytes32[] memory pubSignals_) {
        assembly {
            pubSignals_ := dataPointer_
        }
    }

    /**
     * @notice Validates the date by checking if it is within a 1-day range of the current block timestamp.
     * @param parsedTimestamp_ The parsed timestamp value.
     * @return true if the date is valid, false otherwise.
     */
    function validateDate(uint256 parsedTimestamp_) internal view returns (bool) {
        // +- 1 day validity
        return
            parsedTimestamp_ > block.timestamp - 1 days &&
            parsedTimestamp_ < block.timestamp + 1 days;
    }

    /**
     * @notice Retrieves the AQueryProofExecutor.ABuilderStorage storage reference.
     * @return $ The AQueryProofExecutor.ABuilderStorage storage reference.
     */
    function getABuilderStorage()
        internal
        pure
        returns (AQueryProofExecutor.ABuilderStorage storage $)
    {
        assembly {
            $.slot := A_BUILDER_STORAGE
        }
    }
}
