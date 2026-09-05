// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {PoseidonUnit1L, PoseidonUnit2L, PoseidonUnit3L} from "../libraries/Poseidon.sol";

import {ERC1967Utils} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {TypeCaster} from "@solarity/solidity-lib/libs/utils/TypeCaster.sol";
import {AMultiOwnable} from "@solarity/solidity-lib/access/AMultiOwnable.sol";

import {DynamicSet} from "@solarity/solidity-lib/libs/data-structures/DynamicSet.sol";

import {PoseidonSMT} from "./PoseidonSMT.sol";
import {ICertificateDispatcher} from "../interfaces/dispatchers/ICertificateDispatcher.sol";

interface ICertificateDispatcherRegistry {
    function certificateDispatchers(bytes32 dataType_) external view returns (address);
}

contract StateKeeper is Initializable, AMultiOwnable, UUPSUpgradeable {
    using TypeCaster for address;
    using DynamicSet for DynamicSet.StringSet;

    string public constant ICAO_PREFIX = "Rarimo CSCA root";
    bytes32 public constant REVOKED = keccak256("REVOKED");
    bytes32 public constant USED = keccak256("USED");

    enum MethodId {
        None,
        ChangeICAOMasterTreeRoot,
        AddRegistrations,
        RemoveRegistrations
    }

    struct CertificateInfo {
        uint64 expirationTimestamp;
    }

    struct Certificate {
        bytes32 dataType;
        bytes signedAttributes;
        uint256 keyOffset;
        uint256 expirationOffset;
    }

    uint256 public constant MAX_CERTIFICATE_MIGRATION_BATCH = 3;

    struct PassportInfo {
        bytes32 activeIdentity;
        uint64 identityReissueCounter;
    }

    struct IdentityInfo {
        bytes32 activePassport;
        uint64 issueTimestamp;
    }

    // Previously, _owners (type: struct EnumerableSet.AddressSet) from the old AMultiOwnable
    bytes32[2] private _deprecated;

    PoseidonSMT public registrationSmt;
    PoseidonSMT public certificatesSmt;

    bytes32 public icaoMasterTreeMerkleRoot;

    mapping(bytes32 => bool) public usedSignatures;

    mapping(bytes32 => CertificateInfo) internal _certificateInfos;

    mapping(bytes32 => PassportInfo) internal _passportInfos;
    mapping(bytes32 => IdentityInfo) internal _identityInfos;

    DynamicSet.StringSet internal _registrationKeys;
    mapping(string => address) internal _registrations;
    mapping(address => bool) internal _registrationExists;

    /**
     * @notice Number of certificates successfully rotated by the temporary migration implementation.
     * @dev Appended after all production storage. The terminal migration phase requires the exact
     *      inventory count before restoring the reviewed production implementation.
     */
    uint256 public migratedCertificateCount;

    // Append-only recovery checkpoint. Add the corrected key first, then remove the legacy key.
    // At most one certificate can be pending; its counter advances only on completion.
    bytes32 public pendingMigrationOldKey;
    bytes32 public pendingMigrationNewKey;
    uint256 public pendingMigrationExpiration;

    event CertificateAdded(bytes32 certificateKey, uint256 expirationTimestamp);
    event CertificateRemoved(bytes32 certificateKey);
    event BondAdded(bytes32 passportKey, bytes32 identityKey);
    event BondRevoked(bytes32 passportKey, bytes32 identityKey);
    event BondIdentityReissued(bytes32 passportKey, bytes32 identityKey);

    modifier onlyRegistration() {
        _onlyRegistration();
        _;
    }

    constructor() {
        _disableInitializers();
    }

    function __StateKeeper_init(
        address initialOwner_,
        address registrationSmt_,
        address certificatesSmt_,
        bytes32 icaoMasterTreeMerkleRoot_
    ) external initializer {
        __AMultiOwnable_init();

        registrationSmt = PoseidonSMT(registrationSmt_);
        certificatesSmt = PoseidonSMT(certificatesSmt_);

        icaoMasterTreeMerkleRoot = icaoMasterTreeMerkleRoot_;

        addOwners(initialOwner_.asSingletonArray());
    }

    function __StateKeeper_init_v2() external reinitializer(2) {
        __AMultiOwnable_init();
    }

    /**
     * @notice Adds passport's certificate
     */
    function addCertificate(
        bytes32 certificateKey_,
        uint256 expirationTimestamp_
    ) external virtual onlyRegistration {
        _addCertificate(certificateKey_, expirationTimestamp_);
    }

    function _deriveCertificate(
        Certificate calldata certificate_,
        address dispatcherRegistry_
    ) internal view returns (bytes32 certificateKey_, uint256 expirationTimestamp_) {
        address dispatcherAddress_ = ICertificateDispatcherRegistry(dispatcherRegistry_)
            .certificateDispatchers(certificate_.dataType);

        require(
            dispatcherAddress_ != address(0),
            "StateKeeper: certificate dispatcher does not exist"
        );

        ICertificateDispatcher dispatcher_ = ICertificateDispatcher(dispatcherAddress_);
        bytes memory certificatePubKey_ = dispatcher_.getCertificatePublicKey(
            certificate_.signedAttributes,
            certificate_.keyOffset
        );
        certificateKey_ = bytes32(dispatcher_.getCertificateKey(certificatePubKey_));
        expirationTimestamp_ = dispatcher_.getCertificateExpirationTimestamp(
            certificate_.signedAttributes,
            certificate_.expirationOffset
        );
    }

    function _addCertificate(bytes32 certificateKey_, uint256 expirationTimestamp_) internal {
        require(
            expirationTimestamp_ + 5 * 365 days > block.timestamp,
            "StateKeeper: certificate is expired"
        );

        _certificateInfos[certificateKey_].expirationTimestamp = uint64(expirationTimestamp_);

        certificatesSmt.add(certificateKey_, certificateKey_);

        emit CertificateAdded(certificateKey_, expirationTimestamp_);
    }

    /**
     * @notice Removes passport's certificate
     */
    function removeCertificate(bytes32 certificateKey_) external virtual onlyRegistration {
        require(
            certificateKey_ != pendingMigrationNewKey,
            "StateKeeper: replacement migration pending"
        );
        CertificateInfo storage _info = _certificateInfos[certificateKey_];

        require(
            _info.expirationTimestamp > 0 && _info.expirationTimestamp < block.timestamp,
            "StateKeeper: certificate is not expired"
        );

        _removeCertificate(certificateKey_);
    }

    /**
     * @notice Removes a certificate regardless of its expiration during an owner-authorized migration.
     * @dev This deliberately bypasses only the expiration check. The certificate must exist, and the
     *      same storage, SMT, and event effects as `removeCertificate` are applied.
     */
    function removeCertificateMock(bytes32 certificateKey_) external virtual onlyOwner {
        require(pendingMigrationOldKey == bytes32(0), "StateKeeper: migration pending");
        require(
            _certificateInfos[certificateKey_].expirationTimestamp > 0,
            "StateKeeper: certificate does not exist"
        );

        _removeCertificate(certificateKey_);
    }

    /**
     * @notice Atomically rotates a historical certificate from its legacy key to the key derived
     *         by the currently configured dispatcher.
     * @dev Both the removal and re-registration revert together. This prevents an interrupted
     *      migration from leaving a certificate absent under both keys.
     */
    function migrateCertificateMock(
        bytes32 oldCertificateKey_,
        Certificate calldata certificate_,
        address dispatcherRegistry_
    ) external virtual onlyOwner {
        _migrateCertificateMock(oldCertificateKey_, certificate_, dispatcherRegistry_);
    }

    /**
     * @notice Atomically rotates a bounded batch of historical certificates.
     * @dev The bound keeps each transaction within a predictable gas envelope. A failed item reverts
     *      the whole batch, and completed batches can be safely skipped by the migration on resume.
     */
    function migrateCertificateMockBatch(
        bytes32[] calldata oldCertificateKeys_,
        Certificate[] calldata certificates_,
        address dispatcherRegistry_
    ) external virtual onlyOwner {
        require(
            oldCertificateKeys_.length == certificates_.length,
            "StateKeeper: certificate batch length mismatch"
        );
        require(
            oldCertificateKeys_.length > 0 &&
                oldCertificateKeys_.length <= MAX_CERTIFICATE_MIGRATION_BATCH,
            "StateKeeper: invalid certificate batch size"
        );

        for (uint256 i = 0; i < oldCertificateKeys_.length; ++i) {
            _migrateCertificateMock(oldCertificateKeys_[i], certificates_[i], dispatcherRegistry_);
        }
    }

    function _migrateCertificateMock(
        bytes32 oldCertificateKey_,
        Certificate calldata certificate_,
        address dispatcherRegistry_
    ) internal {
        require(pendingMigrationOldKey == bytes32(0), "StateKeeper: migration pending");
        (bytes32 newCertificateKey_, uint256 expirationTimestamp_) = _deriveCertificate(
            certificate_,
            dispatcherRegistry_
        );

        require(
            oldCertificateKey_ != newCertificateKey_,
            "StateKeeper: certificate key did not change"
        );

        uint64 oldExpirationTimestamp_ = _certificateInfos[oldCertificateKey_].expirationTimestamp;
        uint64 newExpirationTimestamp_ = _certificateInfos[newCertificateKey_].expirationTimestamp;

        if (oldExpirationTimestamp_ == 0 && newExpirationTimestamp_ == expirationTimestamp_) {
            return;
        }

        require(
            oldExpirationTimestamp_ == expirationTimestamp_ && newExpirationTimestamp_ == 0,
            "StateKeeper: certificate is not in a migratable state"
        );

        _removeCertificate(oldCertificateKey_);
        _addCertificate(newCertificateKey_, expirationTimestamp_);

        ++migratedCertificateCount;
    }

    /**
     * @notice First proving-resource-bounded component: authenticate and add the corrected key.
     * @dev The legacy key remains available until completion. The pending checkpoint and SMT add
     *      commit together. An interrupted owner can resume exactly this record, never a different one.
     */
    function beginCertificateMigration(
        bytes32 oldCertificateKey_,
        Certificate calldata certificate_,
        address dispatcherRegistry_
    ) external onlyOwner {
        (bytes32 newCertificateKey_, uint256 expirationTimestamp_) = _deriveCertificate(
            certificate_,
            dispatcherRegistry_
        );
        require(
            oldCertificateKey_ != bytes32(0) &&
                oldCertificateKey_ != newCertificateKey_ &&
                expirationTimestamp_ > 0 &&
                expirationTimestamp_ <= type(uint64).max,
            "StateKeeper: invalid migration certificate"
        );
        if (pendingMigrationOldKey != bytes32(0)) {
            require(
                pendingMigrationOldKey == oldCertificateKey_ &&
                    pendingMigrationNewKey == newCertificateKey_ &&
                    pendingMigrationExpiration == expirationTimestamp_,
                "StateKeeper: different migration pending"
            );
            require(
                _certificateInfos[newCertificateKey_].expirationTimestamp == expirationTimestamp_,
                "StateKeeper: pending replacement missing"
            );
            return;
        }
        uint64 oldExpiration_ = _certificateInfos[oldCertificateKey_].expirationTimestamp;
        uint64 newExpiration_ = _certificateInfos[newCertificateKey_].expirationTimestamp;
        if (oldExpiration_ == 0 && newExpiration_ == expirationTimestamp_) return;
        require(
            oldExpiration_ == expirationTimestamp_ && newExpiration_ == 0,
            "StateKeeper: certificate is not in a migratable state"
        );
        pendingMigrationOldKey = oldCertificateKey_;
        pendingMigrationNewKey = newCertificateKey_;
        pendingMigrationExpiration = expirationTimestamp_;
        _addCertificate(newCertificateKey_, expirationTimestamp_);
    }

    /**
     * @notice Second component: remove the legacy key only while the exact replacement exists.
     * @dev Unique record arguments also make framework transaction recovery unambiguous. No pending
     *      checkpoint means only an already-completed record is accepted, without incrementing again.
     */
    function completeCertificateMigration(
        bytes32 oldCertificateKey_,
        bytes32 newCertificateKey_,
        uint256 expirationTimestamp_
    ) external onlyOwner {
        require(
            oldCertificateKey_ != bytes32(0) &&
                oldCertificateKey_ != newCertificateKey_ &&
                expirationTimestamp_ > 0 &&
                _certificateInfos[newCertificateKey_].expirationTimestamp == expirationTimestamp_,
            "StateKeeper: replacement does not match"
        );
        uint64 oldExpiration_ = _certificateInfos[oldCertificateKey_].expirationTimestamp;
        if (pendingMigrationOldKey == bytes32(0)) {
            require(oldExpiration_ == 0, "StateKeeper: no migration pending");
            return;
        }
        require(
            pendingMigrationOldKey == oldCertificateKey_ &&
                pendingMigrationNewKey == newCertificateKey_ &&
                pendingMigrationExpiration == expirationTimestamp_,
            "StateKeeper: different migration pending"
        );
        // A normal authorized expiry removal may already have removed the old key in the gap.
        require(
            oldExpiration_ == 0 || oldExpiration_ == expirationTimestamp_,
            "StateKeeper: legacy certificate changed"
        );
        if (oldExpiration_ != 0) _removeCertificate(oldCertificateKey_);
        delete pendingMigrationOldKey;
        delete pendingMigrationNewKey;
        delete pendingMigrationExpiration;
        ++migratedCertificateCount;
    }

    function _removeCertificate(bytes32 certificateKey_) internal {
        delete _certificateInfos[certificateKey_];

        certificatesSmt.remove(certificateKey_);

        emit CertificateRemoved(certificateKey_);
    }

    /**
     * @notice Adds new identity bond
     */
    function addBond(
        bytes32 passportKey_,
        bytes32 passportHash_,
        bytes32 identityKey_,
        uint256 dgCommit_
    ) external virtual onlyRegistration {
        if (passportKey_ == bytes32(0)) {
            (passportHash_, passportKey_) = (passportKey_, passportHash_);
        }

        PassportInfo storage _passportInfo = _passportInfos[passportKey_];
        IdentityInfo storage _identityInfo = _identityInfos[identityKey_];

        require(
            _passportInfo.activeIdentity == bytes32(0),
            "StateKeeper: passport already registered"
        );
        require(
            _identityInfo.activePassport == bytes32(0),
            "StateKeeper: identity already registered"
        );

        if (passportKey_ != bytes32(0) && passportHash_ != bytes32(0)) {
            PassportInfo storage _passportHashInfo = _passportInfos[passportHash_];

            require(
                _passportHashInfo.activeIdentity == bytes32(0),
                "StateKeeper: passport hash already registered"
            );

            _passportHashInfo.activeIdentity = USED;
        }

        _passportInfo.activeIdentity = identityKey_;

        _identityInfo.activePassport = passportKey_;
        _identityInfo.issueTimestamp = uint64(block.timestamp);

        uint256 index_ = PoseidonUnit2L.poseidon([uint256(passportKey_), uint256(identityKey_)]);
        uint256 value_ = PoseidonUnit3L.poseidon(
            [dgCommit_, _passportInfo.identityReissueCounter, uint64(block.timestamp)]
        );

        registrationSmt.add(bytes32(index_), bytes32(value_));

        emit BondAdded(passportKey_, identityKey_);
    }

    /**
     * @notice Revoked identity bond
     */
    function revokeBond(
        bytes32 passportKey_,
        bytes32 identityKey_
    ) external virtual onlyRegistration {
        PassportInfo storage _passportInfo = _passportInfos[passportKey_];
        IdentityInfo storage _identityInfo = _identityInfos[identityKey_];

        require(
            _passportInfo.activeIdentity == bytes32(identityKey_),
            "StateKeeper: passport already revoked"
        );
        require(
            _identityInfo.activePassport == bytes32(passportKey_),
            "StateKeeper: identity already revoked"
        );

        _passportInfo.activeIdentity = REVOKED;
        _identityInfo.activePassport = REVOKED;

        uint256 index_ = PoseidonUnit2L.poseidon([uint256(passportKey_), uint256(identityKey_)]);
        uint256 value_ = PoseidonUnit1L.poseidon([uint256(REVOKED)]);

        registrationSmt.update(bytes32(index_), bytes32(value_));

        emit BondRevoked(passportKey_, identityKey_);
    }

    /**
     * @notice Reissues identity bond
     */
    function reissueBondIdentity(
        bytes32 passportKey_,
        bytes32 identityKey_,
        uint256 dgCommit_
    ) external virtual onlyRegistration {
        PassportInfo storage _passportInfo = _passportInfos[passportKey_];
        IdentityInfo storage _identityInfo = _identityInfos[identityKey_];

        require(_passportInfo.activeIdentity == REVOKED, "StateKeeper: passport is not revoked");
        require(
            _identityInfo.activePassport == bytes32(0),
            "StateKeeper: identity already registered"
        );

        _passportInfo.activeIdentity = bytes32(identityKey_);
        ++_passportInfo.identityReissueCounter;

        _identityInfo.activePassport = bytes32(passportKey_);
        _identityInfo.issueTimestamp = uint64(block.timestamp);

        uint256 index_ = PoseidonUnit2L.poseidon([uint256(passportKey_), uint256(identityKey_)]);
        uint256 value_ = PoseidonUnit3L.poseidon(
            [dgCommit_, _passportInfo.identityReissueCounter, uint64(block.timestamp)]
        );

        registrationSmt.add(bytes32(index_), bytes32(value_));

        emit BondIdentityReissued(passportKey_, identityKey_);
    }

    /**
     * @notice Stores used signatures throughout the registrations
     */
    function useSignature(bytes32 sigHash_) external virtual onlyRegistration {
        require(!usedSignatures[sigHash_], "StateKeeper: signature used");

        usedSignatures[sigHash_] = true;
    }

    /**
     * @notice Change ICAO tree Merkle root to a new one via Rarimo TSS.
     * @param newRoot_ the new ICAO root
     */
    function changeICAOMasterTreeRoot(bytes32 newRoot_) external virtual onlyOwner {
        icaoMasterTreeMerkleRoot = newRoot_;
    }

    /**
     * @notice Add or Remove registrations via Rarimo TSS
     * @param methodId_ the method id (AddRegistrations or RemoveRegistrations)
     * @param data_ An ABI encoded arrays of string keys addresses to add or remove
     */
    function updateRegistrationSet(
        MethodId methodId_,
        bytes calldata data_
    ) external virtual onlyOwner {
        if (methodId_ == MethodId.AddRegistrations) {
            (string[] memory keys_, address[] memory values_) = abi.decode(
                data_,
                (string[], address[])
            );

            for (uint256 i = 0; i < keys_.length; i++) {
                require(_registrationKeys.add(keys_[i]), "StateKeeper: duplicate registration");
                _registrations[keys_[i]] = values_[i];
                _registrationExists[values_[i]] = true;
            }
        } else if (methodId_ == MethodId.RemoveRegistrations) {
            string[] memory keys_ = abi.decode(data_, (string[]));

            for (uint256 i = 0; i < keys_.length; i++) {
                delete _registrationExists[_registrations[keys_[i]]];
                delete _registrations[keys_[i]];
                _registrationKeys.remove(keys_[i]);
            }
        } else {
            revert("StateKeeper: Invalid method");
        }
    }

    /**
     * @notice Get info about the registered X509 certificate
     * @param certificateKey_ the hash of a certificate public key
     * @return the certificate info
     */
    function getCertificateInfo(
        bytes32 certificateKey_
    ) external view virtual returns (CertificateInfo memory) {
        return _certificateInfos[certificateKey_];
    }

    /**
     * @notice Get info about the registers passport + its identity
     * @param passportKey_ the hash of a passport public key
     * @return passportInfo_ the passport info
     * @return identityInfo_ the attached identity info
     */
    function getPassportInfo(
        bytes32 passportKey_
    )
        external
        view
        virtual
        returns (PassportInfo memory passportInfo_, IdentityInfo memory identityInfo_)
    {
        passportInfo_ = _passportInfos[passportKey_];

        if (passportInfo_.activeIdentity != REVOKED) {
            identityInfo_ = _identityInfos[passportInfo_.activeIdentity];
        }
    }

    /**
     * @notice Lists all the registrations with their keys
     */
    function getRegistrations()
        external
        view
        virtual
        returns (string[] memory keys_, address[] memory values_)
    {
        keys_ = _registrationKeys.values();
        values_ = new address[](keys_.length);

        for (uint256 i = 0; i < keys_.length; i++) {
            values_[i] = _registrations[keys_[i]];
        }
    }

    /**
     * @notice Get the registration address by its key
     */
    function getRegistrationByKey(string memory key_) external view virtual returns (address) {
        return _registrations[key_];
    }

    /**
     * @notice Checks whether the passed address is a registration
     */
    function isRegistration(address registration_) external view virtual returns (bool) {
        return _registrationExists[registration_];
    }

    function _onlyRegistration() internal view {
        require(_registrationExists[msg.sender], "StateKeeper: not a registration");
    }

    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal virtual override onlyOwner {
        require(pendingMigrationOldKey == bytes32(0), "StateKeeper: migration pending");
    }

    function implementation() external view returns (address) {
        return ERC1967Utils.getImplementation();
    }
}
