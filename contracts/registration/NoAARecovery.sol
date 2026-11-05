// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ERC1967Utils} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {StateKeeper} from "../state/StateKeeper.sol";
import {PoseidonSMT} from "../state/PoseidonSMT.sol";
import {Registration2} from "./Registration2.sol";

import {INoirVerifier} from "../interfaces/verifiers/INoirVerifier.sol";

/**
 * @notice Restores the identity of a document without Active Authentication (P_NO_AA).
 *
 * Such documents can't be revoked through Registration2, so a lost identity key would lock the document forever.
 * This module lets the holder of the document move the bond to a new identity key:
 *
 * requestRecovery (register proof for the new key) -> recoveryDelay -> finalizeRecovery (anyone)
 *
 * During the delay the current key holder can cancel the request with a KeyPossession proof.
 * A second request for another key contests the first one: both are dropped and the document is locked.
 *
 * Reissued bonds get identityReissueCounter >= 1, which lets votings exclude them from already running proposals.
 * The module must be added to the StateKeeper registrations to call revokeBond and reissueBondIdentity.
 */
contract NoAARecovery is Initializable, UUPSUpgradeable {
    bytes32 public constant REVOKED = keccak256("REVOKED");
    bytes32 public constant USED = keccak256("USED");

    uint256 internal constant _PROOF_SIGNALS_COUNT = 5;
    uint256 internal constant _KEY_POSSESSION_SIGNALS_COUNT = 2;

    enum Action {
        None,
        CancelRecovery,
        LockRecovery,
        UnlockRecovery
    }

    struct RecoveryRequest {
        bytes32 oldIdentityKey;
        bytes32 newIdentityKey;
        uint256 dgCommit;
        uint64 readyAt;
    }

    StateKeeper public stateKeeper;
    Registration2 public registration;

    address public keyPossessionVerifier;

    uint64 public recoveryDelay;
    uint64 public lockDuration;

    mapping(bytes32 => bool) public allowedZkTypes;

    mapping(bytes32 => RecoveryRequest) internal _requests;

    mapping(bytes32 => uint64) public lockedUntil;
    mapping(bytes32 => bool) public isRecoveryLocked;
    mapping(bytes32 => uint256) public nonces;

    event RecoveryRequested(bytes32 passportHash, bytes32 newIdentityKey, uint256 readyAt);
    event RecoveryContested(
        bytes32 passportHash,
        bytes32 pendingIdentityKey,
        bytes32 newIdentityKey
    );
    event RecoveryCancelled(bytes32 passportHash, bytes32 pendingIdentityKey);
    event RecoveryFinalized(bytes32 passportHash, bytes32 oldIdentityKey, bytes32 newIdentityKey);
    event RecoveryLocked(bytes32 passportHash);
    event RecoveryUnlocked(bytes32 passportHash);

    error InvalidNoirProof(bytes proof, bytes32[] pubSignals);

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    constructor() {
        _disableInitializers();
    }

    function __NoAARecovery_init(
        address stateKeeper_,
        address registration_,
        address keyPossessionVerifier_,
        uint64 recoveryDelay_,
        uint64 lockDuration_,
        bytes32[] calldata zkTypes_
    ) external initializer {
        stateKeeper = StateKeeper(stateKeeper_);
        registration = Registration2(registration_);

        _setKeyPossessionVerifier(keyPossessionVerifier_);
        _setRecoveryParams(recoveryDelay_, lockDuration_);
        _setZkTypes(zkTypes_, true);
    }

    /**
     * @notice Requests to move the document bond to a new identity key.
     * @param certificatesRoot_ the root of certificates MT
     * @param identityKey_ the hash of the public key of the new identity
     * @param dgCommit_ the commitment of DG1 for the new identity
     * @param passportHash_ the hash of the document (the bond key of a P_NO_AA document)
     * @param zkType_ the register circuit type, must be allowed for recovery
     * @param zkPoints_ the register Noir proof generated for the new identity key
     */
    function requestRecovery(
        bytes32 certificatesRoot_,
        uint256 identityKey_,
        uint256 dgCommit_,
        bytes32 passportHash_,
        bytes32 zkType_,
        bytes memory zkPoints_
    ) external virtual {
        require(identityKey_ > 0, "NoAARecovery: identity can not be zero");
        require(allowedZkTypes[zkType_], "NoAARecovery: zk type is not allowed");
        require(!isRecoveryLocked[passportHash_], "NoAARecovery: recovery is locked");
        require(lockedUntil[passportHash_] <= block.timestamp, "NoAARecovery: passport is locked");

        bytes32 activeIdentity_ = _getActiveIdentity(passportHash_);

        require(activeIdentity_ != bytes32(identityKey_), "NoAARecovery: identity already active");

        _verifyRegisterProof(
            zkType_,
            certificatesRoot_,
            passportHash_,
            identityKey_,
            dgCommit_,
            zkPoints_
        );

        RecoveryRequest storage request_ = _requests[passportHash_];

        if (request_.readyAt == 0) {
            uint64 readyAt_ = uint64(block.timestamp) + recoveryDelay;

            request_.oldIdentityKey = activeIdentity_;
            request_.newIdentityKey = bytes32(identityKey_);
            request_.dgCommit = dgCommit_;
            request_.readyAt = readyAt_;

            emit RecoveryRequested(passportHash_, bytes32(identityKey_), readyAt_);

            return;
        }

        bytes32 pendingIdentityKey_ = request_.newIdentityKey;

        require(
            pendingIdentityKey_ != bytes32(identityKey_),
            "NoAARecovery: recovery already requested"
        );

        delete _requests[passportHash_];
        lockedUntil[passportHash_] = uint64(block.timestamp) + lockDuration;

        emit RecoveryContested(passportHash_, pendingIdentityKey_, bytes32(identityKey_));
    }

    /**
     * @notice Moves the bond to the requested identity key once the delay has passed. Callable by anyone.
     * @param passportHash_ the hash of the document
     */
    function finalizeRecovery(bytes32 passportHash_) external virtual {
        RecoveryRequest memory request_ = _requests[passportHash_];

        require(request_.readyAt != 0, "NoAARecovery: recovery is not requested");
        require(request_.readyAt <= block.timestamp, "NoAARecovery: recovery is not ready");
        require(
            _getActiveIdentity(passportHash_) == request_.oldIdentityKey,
            "NoAARecovery: active identity changed"
        );

        delete _requests[passportHash_];

        stateKeeper.revokeBond(passportHash_, request_.oldIdentityKey);
        stateKeeper.reissueBondIdentity(passportHash_, request_.newIdentityKey, request_.dgCommit);

        emit RecoveryFinalized(passportHash_, request_.oldIdentityKey, request_.newIdentityKey);
    }

    /**
     * @notice Cancels the pending request and locks the document for `lockDuration`.
     * @param passportHash_ the hash of the document
     * @param zkPoints_ the KeyPossession proof of the active identity key
     */
    function cancelRecovery(bytes32 passportHash_, bytes memory zkPoints_) external virtual {
        bytes32 pendingIdentityKey_ = _requests[passportHash_].newIdentityKey;

        require(pendingIdentityKey_ != bytes32(0), "NoAARecovery: recovery is not requested");

        _verifyKeyPossession(passportHash_, Action.CancelRecovery, zkPoints_);

        delete _requests[passportHash_];
        lockedUntil[passportHash_] = uint64(block.timestamp) + lockDuration;

        emit RecoveryCancelled(passportHash_, pendingIdentityKey_);
    }

    /**
     * @notice Disables recovery of the document until unlocked. Drops the pending request, if any.
     * @dev If the identity key is lost while locked, the document can never be recovered.
     * @param passportHash_ the hash of the document
     * @param zkPoints_ the KeyPossession proof of the active identity key
     */
    function lockRecovery(bytes32 passportHash_, bytes memory zkPoints_) external virtual {
        require(!isRecoveryLocked[passportHash_], "NoAARecovery: recovery is locked");

        _verifyKeyPossession(passportHash_, Action.LockRecovery, zkPoints_);

        isRecoveryLocked[passportHash_] = true;

        bytes32 pendingIdentityKey_ = _requests[passportHash_].newIdentityKey;

        if (pendingIdentityKey_ != bytes32(0)) {
            delete _requests[passportHash_];

            emit RecoveryCancelled(passportHash_, pendingIdentityKey_);
        }

        emit RecoveryLocked(passportHash_);
    }

    /**
     * @notice Enables recovery of the document again.
     * @param passportHash_ the hash of the document
     * @param zkPoints_ the KeyPossession proof of the active identity key
     */
    function unlockRecovery(bytes32 passportHash_, bytes memory zkPoints_) external virtual {
        require(isRecoveryLocked[passportHash_], "NoAARecovery: recovery is not locked");

        _verifyKeyPossession(passportHash_, Action.UnlockRecovery, zkPoints_);

        isRecoveryLocked[passportHash_] = false;

        emit RecoveryUnlocked(passportHash_);
    }

    function setRecoveryParams(
        uint64 recoveryDelay_,
        uint64 lockDuration_
    ) external virtual onlyOwner {
        _setRecoveryParams(recoveryDelay_, lockDuration_);
    }

    function setKeyPossessionVerifier(address keyPossessionVerifier_) external virtual onlyOwner {
        _setKeyPossessionVerifier(keyPossessionVerifier_);
    }

    function setZkTypes(bytes32[] calldata zkTypes_, bool allowed_) external virtual onlyOwner {
        _setZkTypes(zkTypes_, allowed_);
    }

    /**
     * @notice Get the pending recovery request of the document
     */
    function getRecoveryRequest(
        bytes32 passportHash_
    ) external view virtual returns (RecoveryRequest memory) {
        return _requests[passportHash_];
    }

    /**
     * @notice Get the message the next KeyPossession proof for the document and action must be bound to
     */
    function getKeyPossessionMessage(
        bytes32 passportHash_,
        Action action_
    ) public view virtual returns (bytes32) {
        return _getKeyPossessionMessage(passportHash_, action_, nonces[passportHash_]);
    }

    function _setRecoveryParams(uint64 recoveryDelay_, uint64 lockDuration_) internal {
        require(recoveryDelay_ > 0, "NoAARecovery: zero recovery delay");

        recoveryDelay = recoveryDelay_;
        lockDuration = lockDuration_;
    }

    function _setKeyPossessionVerifier(address keyPossessionVerifier_) internal {
        require(keyPossessionVerifier_ != address(0), "NoAARecovery: zero verifier");

        keyPossessionVerifier = keyPossessionVerifier_;
    }

    function _setZkTypes(bytes32[] calldata zkTypes_, bool allowed_) internal {
        for (uint256 i = 0; i < zkTypes_.length; i++) {
            allowedZkTypes[zkTypes_[i]] = allowed_;
        }
    }

    function _verifyRegisterProof(
        bytes32 zkType_,
        bytes32 certificatesRoot_,
        bytes32 passportHash_,
        uint256 identityKey_,
        uint256 dgCommit_,
        bytes memory zkPoints_
    ) internal view {
        require(
            PoseidonSMT(stateKeeper.certificatesSmt()).isRootValid(certificatesRoot_),
            "NoAARecovery: invalid certificates root"
        );

        address verifier_ = registration.passportVerifiers(zkType_);

        require(verifier_ != address(0), "NoAARecovery: passport verifier does not exist");

        bytes32[] memory pubSignals_ = new bytes32[](_PROOF_SIGNALS_COUNT);

        // pubSignals_[0] is the AA public key hash, always zero for circuits without AA
        pubSignals_[1] = passportHash_; // output
        pubSignals_[2] = bytes32(dgCommit_); // output
        pubSignals_[3] = bytes32(identityKey_); // output
        pubSignals_[4] = certificatesRoot_; // public input

        require(
            INoirVerifier(verifier_).verify(zkPoints_, pubSignals_),
            InvalidNoirProof(zkPoints_, pubSignals_)
        );
    }

    function _verifyKeyPossession(
        bytes32 passportHash_,
        Action action_,
        bytes memory zkPoints_
    ) internal {
        bytes32[] memory pubSignals_ = new bytes32[](_KEY_POSSESSION_SIGNALS_COUNT);

        pubSignals_[0] = _getActiveIdentity(passportHash_);
        pubSignals_[1] = _getKeyPossessionMessage(passportHash_, action_, nonces[passportHash_]++);

        require(
            INoirVerifier(keyPossessionVerifier).verify(zkPoints_, pubSignals_),
            InvalidNoirProof(zkPoints_, pubSignals_)
        );
    }

    function _getActiveIdentity(bytes32 passportHash_) internal view returns (bytes32) {
        (StateKeeper.PassportInfo memory passportInfo_, ) = stateKeeper.getPassportInfo(
            passportHash_
        );

        bytes32 activeIdentity_ = passportInfo_.activeIdentity;

        require(
            activeIdentity_ != bytes32(0) && activeIdentity_ != REVOKED && activeIdentity_ != USED,
            "NoAARecovery: passport is not registered"
        );

        return activeIdentity_;
    }

    /**
     * @dev The message is shifted to fit into the BN254 scalar field.
     */
    function _getKeyPossessionMessage(
        bytes32 passportHash_,
        Action action_,
        uint256 nonce_
    ) internal view returns (bytes32) {
        return
            bytes32(
                uint256(
                    keccak256(
                        abi.encode(block.chainid, address(this), action_, passportHash_, nonce_)
                    )
                ) >> 8
            );
    }

    function _onlyOwner() internal view {
        require(stateKeeper.isOwner(msg.sender), "NoAARecovery: not an owner");
    }

    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal virtual override onlyOwner {}

    function implementation() external view returns (address) {
        return ERC1967Utils.getImplementation();
    }
}
