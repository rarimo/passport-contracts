// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {AQueryProofExecutor} from "../AQueryProofExecutor.sol";

import {IPoseidonSMT} from "../../interfaces/state/IPoseidonSMT.sol";

import {Date2Time} from "../../utils/Date2Time.sol";

/**
 * @title PublicSignalsTD1Builder Library.
 * @notice Provides helper functions to construct the public signals array for ZK proof verification of ID cards.
 *
 * MUST be used together with AQueryProofExecutor, because it relies on the ABuilderStorage storage for validations.
 *
 * @dev This library facilitates setting specific values at predefined indices within the public signals array,
 *      which is expected by the verifier contract. The indices correspond to the specification detailed
 *      at: https://github.com/rarimo/passport-zk-circuits/?tab=readme-ov-file#query-circuit-public-signals
 * Detailed documentation: https://github.com/rarimo/passport-zk-circuits-noir/blob/main/query_identity_td1/Readme.md
 */
library PublicSignalsTD1Builder {
    uint256 public constant PROOF_SIGNALS_COUNT = 24;
    uint256 public constant ZERO_DATE = 0x303030303030;

    // bytes32(uint256(keccak256("rarimo.contract.AQueryProofExecutor")) - 1)
    bytes32 private constant A_BUILDER_STORAGE =
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
            // selector at index 13 -> 32 + 13*32 = 448
            mstore(add(dataPointer_, 448), selector_)

            // currentDate_ at index 14 -> 32 + 14*32 = 480
            mstore(add(dataPointer_, 480), ZERO_DATE)
            // birthDateLowerbound_ at index 19 -> 32 + 19*32 = 640
            mstore(add(dataPointer_, 640), ZERO_DATE)
            // birthDateUpperbound_ at index 20 -> 32 + 20*32 = 672
            mstore(add(dataPointer_, 672), ZERO_DATE)
            // expirationDateLowerbound_ at index 21 -> 32 + 21*32 = 704
            mstore(add(dataPointer_, 704), ZERO_DATE)
            // expirationDateUpperbound_ at index 22 -> 32 + 22*32 = 736
            mstore(add(dataPointer_, 736), ZERO_DATE)
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
     * @notice Sets the birthDate (index 1) in the public signals array.
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param birthDate_ The birth date value (encoded `yyMMdd`).
     */
    function withBirthDate(uint256 dataPointer_, uint256 birthDate_) internal pure {
        assembly {
            // 32 + 1 * 32 = 64
            mstore(add(dataPointer_, 64), birthDate_)
        }
    }

    /**
     * @notice Sets the expirationDate (index 2) in the public signals array.
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param expirationDate_ The expiration date value (encoded `yyMMdd`).
     */
    function withExpirationDate(uint256 dataPointer_, uint256 expirationDate_) internal pure {
        assembly {
            // 32 + 2 * 32 = 96
            mstore(add(dataPointer_, 96), expirationDate_)
        }
    }

    /**
     * @notice Sets the nationality (index 4) in the public signals array.
     * @dev Nationality in ISO 3166-1 alpha-3 format (encoded).
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param nationality_ The nationality value (encoded).
     */
    function withNationality(uint256 dataPointer_, uint256 nationality_) internal pure {
        assembly {
            // 32 + 4 * 32 = 160
            mstore(add(dataPointer_, 160), nationality_)
        }
    }

    /**
     * @notice Sets the citizenship (index 5) in the public signals array.
     * @dev Citizenship in ISO 3166-1 alpha-3 format (encoded).
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param citizenship_ The citizenship value (encoded).
     */
    function withCitizenship(uint256 dataPointer_, uint256 citizenship_) internal pure {
        assembly {
            // 32 + 5 * 32 = 192
            mstore(add(dataPointer_, 192), citizenship_)
        }
    }

    /**
     * @notice Sets the sex (index 6) in the public signals array.
     * @dev Represents the sex of the user (e.g., encoded 'M' or 'F').
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param sex_ The sex value (encoded).
     */
    function withSex(uint256 dataPointer_, uint256 sex_) internal pure {
        assembly {
            // 32 + 6 * 32 = 224
            mstore(add(dataPointer_, 224), sex_)
        }
    }

    /**
     * @notice Sets the documentNumberHash (index 7) in the public signals array.
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param documentNumberHash_ The hash of the document number.
     */
    function withDocumentNumberHash(
        uint256 dataPointer_,
        uint256 documentNumberHash_
    ) internal pure {
        assembly {
            // 32 + 7 * 32 = 256
            mstore(add(dataPointer_, 256), documentNumberHash_)
        }
    }

    /**
     * @notice Sets the personalNumberHash (index 8) in the public signals array.
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param personalNumberHash_ The hash of the personal number.
     */
    function withPersonalNumberHash(
        uint256 dataPointer_,
        uint256 personalNumberHash_
    ) internal pure {
        assembly {
            // 32 + 8 * 32 = 288
            mstore(add(dataPointer_, 288), personalNumberHash_)
        }
    }

    /**
     * @notice Sets the documentType (index 9) in the public signals array (e.g., encoded "ID").
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param documentType_ The document type value.
     */
    function withDocumentType(uint256 dataPointer_, uint256 documentType_) internal pure {
        assembly {
            // 32 + 9 * 32 = 320
            mstore(add(dataPointer_, 320), documentType_)
        }
    }

    /**
     * @notice Sets the eventId (index 10) and eventData (index 11) in the public signals array.
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
            // 32 + 10 * 32 = 352
            mstore(add(dataPointer_, 352), eventId_)
            // 32 + 11 * 32 = 384
            mstore(add(dataPointer_, 384), eventData_)
        }
    }

    /**
     * @notice Sets the idStateRoot (index 12) in the public signals array.
     * @dev Root of the identity registration Merkle tree.
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param idStateRoot_ The Merkle root value.
     */
    function withIdStateRoot(uint256 dataPointer_, bytes32 idStateRoot_) internal view {
        AQueryProofExecutor.AExecutorStorage storage $ = getABuilderStorage();

        if (!IPoseidonSMT($.registrationSMT).isRootValid(idStateRoot_)) {
            revert InvalidRegistrationRoot($.registrationSMT, idStateRoot_);
        }

        assembly {
            // 32 + 12 * 32 = 416
            mstore(add(dataPointer_, 416), idStateRoot_)
        }
    }

    /**
     * @notice Sets the selector (index 13) in the public signals array.
     * @dev Bitmask indicating which fields are selected to be revealed/checked.
     *      See https://github.com/rarimo/passport-zk-circuits/blob/main/README.md#selector
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param selector_ The selector bitmask value.
     */
    function withSelector(uint256 dataPointer_, uint256 selector_) internal pure {
        assembly {
            // 32 + 13 * 32 = 448
            mstore(add(dataPointer_, 448), selector_)
        }
    }

    /**
     * @notice Sets the currentDate (index 14) in the public signals array.
     * @dev Current date in `yyMMdd` format (encoded).
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param currentDate_ The current date value (encoded).
     * @param timeBound_ The time bound value (in seconds) for date validation.
     */
    function withCurrentDate(
        uint256 dataPointer_,
        uint256 currentDate_,
        uint256 timeBound_
    ) internal view {
        uint256 parsedTimestamp_ = Date2Time.timestampFromDate(currentDate_);

        if (!validateDate(parsedTimestamp_, timeBound_)) {
            revert InvalidDate(parsedTimestamp_, block.timestamp);
        }

        assembly {
            // 32 + 14 * 32 = 480
            mstore(add(dataPointer_, 480), currentDate_)
        }
    }

    /**
     * @notice Sets timestampLowerbound (index 15) and timestampUpperbound (index 16) in the public signals array that
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
            // 32 + 15 * 32 = 512
            mstore(add(dataPointer_, 512), timestampLowerbound_)
            // 32 + 16 * 32 = 544
            mstore(add(dataPointer_, 544), timestampUpperbound_)
        }
    }

    /**
     * @notice Sets identityCounterLowerbound (index 17) and identityCounterUpperbound (index 18) in the public signals array that
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
            // 32 + 17 * 32 = 576
            mstore(add(dataPointer_, 576), identityCounterLowerbound_)
            // 32 + 18 * 32 = 608
            mstore(add(dataPointer_, 608), identityCounterUpperbound_)
        }
    }

    /**
     * @notice Sets the birthDateLowerbound (index 19) and birthDateUpperbound (index 20) in the public
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
            // 32 + 19 * 32 = 640
            mstore(add(dataPointer_, 640), birthDateLowerbound_)
            // 32 + 20 * 32 = 672
            mstore(add(dataPointer_, 672), birthDateUpperbound_)
        }
    }

    /**
     * @notice Sets expirationDateLowerbound (index 21) and expirationDateUpperbound (index 22) in the
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
            // 32 + 21 * 32 = 704
            mstore(add(dataPointer_, 704), expirationDateLowerbound_)
            // 32 + 22 * 32 = 736
            mstore(add(dataPointer_, 736), expirationDateUpperbound_)
        }
    }

    /**
     * @notice Sets the citizenshipMask (index 23) in the public signals array.
     * @param dataPointer_ Pointer to the public signals array in memory.
     * @param citizenshipMask_ The citizenship mask value.
     */
    function withCitizenshipMask(uint256 dataPointer_, uint256 citizenshipMask_) internal pure {
        assembly {
            // 32 + 23 * 32 = 768
            mstore(add(dataPointer_, 768), citizenshipMask_)
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
     * @notice Validates the date by checking if it is within a timeBound_ range of the current block timestamp.
     * @param parsedTimestamp_ The parsed timestamp value.
     * @param timeBound_ The time bound value (in seconds).
     * @return true if the date is valid, false otherwise.
     */
    function validateDate(
        uint256 parsedTimestamp_,
        uint256 timeBound_
    ) internal view returns (bool) {
        // +- 1 day validity
        return
            parsedTimestamp_ > block.timestamp - timeBound_ &&
            parsedTimestamp_ < block.timestamp + timeBound_;
    }

    /**
     * @notice Retrieves the AQueryProofExecutor.ABuilderStorage storage reference.
     */
    function getABuilderStorage()
        private
        pure
        returns (AQueryProofExecutor.AExecutorStorage storage $)
    {
        assembly {
            $.slot := A_BUILDER_STORAGE
        }
    }
}
