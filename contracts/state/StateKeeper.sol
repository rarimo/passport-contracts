// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {PoseidonUnit1L, PoseidonUnit2L, PoseidonUnit3L} from "@iden3/contracts/lib/Poseidon.sol";

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {DynamicSet} from "@solarity/solidity-lib/libs/data-structures/DynamicSet.sol";

import {TSSUpgradeable} from "./TSSUpgradeable.sol";
import {PoseidonSMT} from "./PoseidonSMT.sol";

contract StateKeeper is Initializable, TSSUpgradeable {
    using DynamicSet for DynamicSet.StringSet;

    string public constant ICAO_PREFIX = "Rarimo CSCA root";
    bytes32 public constant REVOKED = keccak256("REVOKED");

    enum MethodId {
        None,
        ChangeICAOMasterTreeRoot,
        AddRegistrations,
        RemoveRegistrations
    }

    struct CertificateInfo {
        uint64 expirationTimestamp;
    }

    struct PassportInfo {
        bytes32 activeIdentity;
        uint64 identityReissueCounter;
    }

    struct IdentityInfo {
        bytes32 activePassport;
        uint64 issueTimestamp;
    }

    PoseidonSMT public registrationSmt;
    PoseidonSMT public certificatesSmt;

    bytes32 public icaoMasterTreeMerkleRoot;

    mapping(bytes32 => CertificateInfo) internal _certificateInfos;

    mapping(bytes32 => PassportInfo) internal _passportInfos;
    mapping(bytes32 => IdentityInfo) internal _identityInfos;

    mapping(bytes32 => bool) internal _usedSignatures;

    DynamicSet.StringSet internal _registrationKeys;
    mapping(string => address) internal _registrations;
    mapping(address => bool) internal _registrationExists;

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
        address signer_,
        string calldata chainName_,
        address registrationSmt_,
        address certificatesSmt_,
        bytes32 icaoMasterTreeMerkleRoot_
    ) external initializer {
        __TSSSigner_init(signer_, chainName_);

        registrationSmt = PoseidonSMT(registrationSmt_);
        certificatesSmt = PoseidonSMT(certificatesSmt_);

        icaoMasterTreeMerkleRoot = icaoMasterTreeMerkleRoot_;
    }

    function addCertificate(
        bytes32 certificateKey_,
        uint256 expirationTimestamp_
    ) external onlyRegistration {
        require(expirationTimestamp_ > block.timestamp, "StateKeeper: certificate is expired");

        _certificateInfos[certificateKey_].expirationTimestamp = uint64(expirationTimestamp_);

        certificatesSmt.add(certificateKey_, certificateKey_);

        emit CertificateAdded(certificateKey_, expirationTimestamp_);
    }

    function removeCertificate(bytes32 certificateKey_) external onlyRegistration {
        CertificateInfo storage _info = _certificateInfos[certificateKey_];

        require(
            _info.expirationTimestamp > 0 && _info.expirationTimestamp < block.timestamp,
            "StateKeeper: certificate is not expired"
        );

        delete _certificateInfos[certificateKey_];

        certificatesSmt.remove(certificateKey_);

        emit CertificateRemoved(certificateKey_);
    }

    function addBond(
        bytes32 passportKey_,
        bytes32 identityKey_,
        uint256 dgCommit_
    ) external onlyRegistration {
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

    function revokeBond(bytes32 passportKey_, bytes32 identityKey_) external onlyRegistration {
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

    function reissueBondIdentity(
        bytes32 passportKey_,
        bytes32 identityKey_,
        uint256 dgCommit_
    ) external onlyRegistration {
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

    function useSignature(bytes32 sigHash_) external onlyRegistration {
        require(!_usedSignatures[sigHash_], "StateKeeper: signature used");

        _usedSignatures[sigHash_] = true;
    }

    /**
     * @notice Change ICAO tree Merkle root to a new one via Rarimo TSS.
     * @param newRoot_ the new ICAO root
     * @param timestamp the "nonce"
     * @param proof_ the Rarimo TSS Merkle proof
     */
    function changeICAOMasterTreeRoot(
        bytes32 newRoot_,
        uint256 timestamp,
        bytes memory proof_
    ) external {
        bytes32 leaf_ = keccak256(abi.encodePacked(ICAO_PREFIX, newRoot_, timestamp));

        _useNonce(uint8(MethodId.ChangeICAOMasterTreeRoot), timestamp);
        _checkMerkleSignature(leaf_, proof_);

        icaoMasterTreeMerkleRoot = newRoot_;
    }

    /**
     * @notice Change the Rarimo TSS signer via Rarimo TSS
     * @param newSignerPubKey_ the new signer public key
     * @param signature_ the Rarimo TSS signature
     */
    function changeSigner(bytes memory newSignerPubKey_, bytes memory signature_) external {
        _checkSignature(keccak256(newSignerPubKey_), signature_);

        signer = _convertPubKeyToAddress(newSignerPubKey_);
    }

    /**
     * @notice Add or Remove registrations via Rarimo TSS
     * @param methodId_ the method id (AddRegistrations or RemoveRegistrations)
     * @param data_ An ABI encoded array of addresses to add or remove
     * @param proof_ the Rarimo TSS signature with MTP
     */
    function updateRegistrationSet(
        MethodId methodId_,
        bytes calldata data_,
        bytes calldata proof_
    ) external {
        uint256 nonce_ = _getAndIncrementNonce(uint8(methodId_));
        bytes32 leaf_ = keccak256(
            abi.encodePacked(address(this), methodId_, data_, chainName, nonce_)
        );

        _checkMerkleSignature(leaf_, proof_);
        _useNonce(uint8(methodId_), nonce_);

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
    ) external view returns (CertificateInfo memory) {
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
        returns (PassportInfo memory passportInfo_, IdentityInfo memory identityInfo_)
    {
        passportInfo_ = _passportInfos[passportKey_];

        if (passportInfo_.activeIdentity != REVOKED) {
            identityInfo_ = _identityInfos[passportInfo_.activeIdentity];
        }
    }

    function getRegistrations()
        external
        view
        returns (string[] memory keys_, address[] memory values_)
    {
        keys_ = _registrationKeys.values();
        values_ = new address[](keys_.length);

        for (uint256 i = 0; i < keys_.length; i++) {
            values_[i] = _registrations[keys_[i]];
        }
    }

    function getRegistrationByKey(string memory key_) external view returns (address) {
        return _registrations[key_];
    }

    function _onlyRegistration() internal view {
        require(_registrationExists[msg.sender], "StateKeeper: not a registration");
    }
}
