// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {PoseidonUnit1L, PoseidonUnit2L, PoseidonUnit3L} from "@iden3/contracts/lib/Poseidon.sol";

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {VerifierHelper} from "@solarity/solidity-lib/libs/zkp/snarkjs/VerifierHelper.sol";

import {UUPSSignableUpgradeable} from "@rarimo/evm-bridge-contracts/bridge/proxy/UUPSSignableUpgradeable.sol";

import {TSSSigner} from "./TSSSigner.sol";
import {PoseidonSMT} from "./PoseidonSMT.sol";

import {X509} from "../utils/X509.sol";

import {IPassportDispatcher} from "../interfaces/dispatchers/IPassportDispatcher.sol";

contract Registration is Initializable, UUPSSignableUpgradeable, TSSSigner {
    using MerkleProof for bytes32[];
    using X509 for bytes;

    string public constant ICAO_PREFIX = "Rarimo CSCA root";
    bytes32 public constant REVOKED = keccak256("REVOKED");

    struct Passport {
        bytes32 dataType;
        bytes signature;
        bytes publicKey;
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

    enum MethodId {
        None,
        AuthorizeUpgrade,
        AddDispatchers,
        RemoveDispatchers
    }

    PoseidonSMT public registrationSmt;
    PoseidonSMT public certificatesSmt;

    bytes32 public icaoMasterTreeMerkleRoot;

    mapping(bytes32 => IPassportDispatcher) public passportDispatchers;

    mapping(bytes32 => CertificateInfo) internal _certificateInfos;

    mapping(bytes32 => PassportInfo) internal _passportInfos;
    mapping(bytes32 => IdentityInfo) internal _identityInfos;

    mapping(bytes32 => bool) internal _usedSignatures;

    event CertificateRegistered(bytes32 certificateKey, uint256 expirationTimestamp);
    event CertificateRevoked(bytes32 certificateKey);
    event Registered(bytes32 passportKey, bytes32 identityKey);
    event Revoked(bytes32 passportKey, bytes32 identityKey);
    event ReissuedIdentity(bytes32 passportKey, bytes32 identityKey);

    constructor() {
        _disableInitializers();
    }

    function __Registration_init(
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

    /**
     * @notice Registers an X509 certificate in the certificates SMT.
     * @param icaoMerkleProof_ the Merkle inclusion proof of a ICAO member that signed the certificate
     * @param icaoMemberKey_ the ICAO signer public key
     * @param icaoMemberSignature_ the ICAO signer signature
     * @param x509SignedAttributes_ the certificate signed attributes
     * @param x509KeyOffset_ the offset in the attributes where the certificate key lives
     * @param x509ExpirationOffset_ the offset in the attributes where the certificate expiration date lives
     */
    function registerCertificate(
        bytes32[] memory icaoMerkleProof_,
        bytes memory icaoMemberKey_,
        bytes memory icaoMemberSignature_,
        bytes memory x509SignedAttributes_,
        uint256 x509KeyOffset_,
        uint256 x509ExpirationOffset_
    ) external {
        bytes32 icaoMerkleRoot_ = icaoMerkleProof_.processProof(keccak256(icaoMemberKey_));

        require(icaoMerkleRoot_ == icaoMasterTreeMerkleRoot, "Registration: invalid icao proof");
        require(
            x509SignedAttributes_.verifyICAOSignature(icaoMemberKey_, icaoMemberSignature_),
            "Registration: invalid x509 certificate"
        );

        uint256 expirationTimestamp_ = x509SignedAttributes_.extractExpirationTimestamp(
            x509ExpirationOffset_
        );

        require(expirationTimestamp_ > block.timestamp, "Registration: certificate is expired");

        bytes memory certificatePubKey_ = x509SignedAttributes_.extractKey(x509KeyOffset_);

        uint256 certificateKey_ = certificatePubKey_.hashKey();

        _certificateInfos[bytes32(certificateKey_)].expirationTimestamp = uint64(
            expirationTimestamp_
        );

        certificatesSmt.add(bytes32(certificateKey_), bytes32(certificateKey_));

        emit CertificateRegistered(bytes32(certificateKey_), expirationTimestamp_);
    }

    /**
     * @notice Revokes an expired X509 certificate
     * @param certificateKey_ the "fancy hashed" (see X509 util) hash of a public key of a certificate
     */
    function revokeCertificate(bytes32 certificateKey_) external {
        CertificateInfo storage _info = _certificateInfos[certificateKey_];

        require(
            _info.expirationTimestamp > 0 && _info.expirationTimestamp < block.timestamp,
            "Registration: certificate is not expired"
        );

        delete _certificateInfos[certificateKey_];

        certificatesSmt.remove(certificateKey_);

        emit CertificateRevoked(certificateKey_);
    }

    /**
     * @notice Registers the user passport <> user identity bond in the registration SMT.
     * @param certificatesRoot_ the root of certificates MT (prevents accidental frontrunning)
     * @param identityKey_ the hash of the public key of an identity
     * @param dgCommit_ the commitment of DG15 (proves the passport ownership)
     * @param passport_ the passport info
     * @param zkPoints_ the passport validity ZK proof
     */
    function register(
        bytes32 certificatesRoot_,
        uint256 identityKey_,
        uint256 dgCommit_,
        Passport memory passport_,
        VerifierHelper.ProofPoints memory zkPoints_
    ) external {
        IPassportDispatcher dispatcher_ = _getDispatcher(passport_.dataType);

        bytes memory challenge_ = dispatcher_.getPassportChallenge(identityKey_);
        uint256 passportKey_ = dispatcher_.getPassportKey(passport_.publicKey);

        PassportInfo storage _passportInfo = _passportInfos[bytes32(passportKey_)];
        IdentityInfo storage _identityInfo = _identityInfos[bytes32(identityKey_)];

        require(identityKey_ > 0, "Registration: identity can not be zero");
        require(
            _passportInfo.activeIdentity == bytes32(0),
            "Registration: passport already registered"
        );
        require(
            _identityInfo.activePassport == bytes32(0),
            "Registration: identity already registered"
        );

        _useSignature(passport_.signature);
        _authenticate(dispatcher_, challenge_, passport_);
        _verifyZKProof(
            dispatcher_,
            certificatesRoot_,
            passportKey_,
            identityKey_,
            dgCommit_,
            zkPoints_
        );

        _passportInfo.activeIdentity = bytes32(identityKey_);

        _identityInfo.activePassport = bytes32(passportKey_);
        _identityInfo.issueTimestamp = uint64(block.timestamp);

        uint256 index_ = PoseidonUnit2L.poseidon([passportKey_, identityKey_]);
        uint256 value_ = PoseidonUnit3L.poseidon(
            [dgCommit_, _passportInfo.identityReissueCounter, uint64(block.timestamp)]
        );

        registrationSmt.add(bytes32(index_), bytes32(value_));

        emit Registered(bytes32(passportKey_), bytes32(identityKey_));
    }

    /**
     * @notice Revokes the passport <> idenitty bond (doesn't actually remove it, sets as "revoked")
     * @param identityKey_ the hash of the public key of an identity
     * @param passport_ the passport info
     */
    function revoke(uint256 identityKey_, Passport memory passport_) external {
        IPassportDispatcher dispatcher_ = _getDispatcher(passport_.dataType);

        bytes memory challenge_ = dispatcher_.getPassportChallenge(identityKey_);
        uint256 passportKey_ = dispatcher_.getPassportKey(passport_.publicKey);

        PassportInfo storage _passportInfo = _passportInfos[bytes32(passportKey_)];
        IdentityInfo storage _identityInfo = _identityInfos[bytes32(identityKey_)];

        require(identityKey_ > 0, "Registration: identity can not be zero");
        require(
            _passportInfo.activeIdentity == bytes32(identityKey_),
            "Registration: passport already revoked"
        );
        require(
            _identityInfo.activePassport == bytes32(passportKey_),
            "Registration: identity already revoked"
        );

        _useSignature(passport_.signature);
        _authenticate(dispatcher_, challenge_, passport_);

        _passportInfo.activeIdentity = REVOKED;
        _identityInfo.activePassport = REVOKED;

        uint256 index_ = PoseidonUnit2L.poseidon([passportKey_, identityKey_]);
        uint256 value_ = PoseidonUnit1L.poseidon([uint256(REVOKED)]);

        registrationSmt.update(bytes32(index_), bytes32(value_));

        emit Revoked(bytes32(passportKey_), bytes32(identityKey_));
    }

    /**
     * @notice Reissues the passport <> identity bond by migration to a new identity. The previous bond must be revoked
     * @param certificatesRoot_ the root of certificates MT (prevents accidental frontrunning)
     * @param identityKey_ the hash of the public key of an identity
     * @param dgCommit_ the commitment of DG15 (proves the passport ownership)
     * @param passport_ the passport info
     * @param zkPoints_ the passport validity ZK proof
     */
    function reissueIdentity(
        bytes32 certificatesRoot_,
        uint256 identityKey_,
        uint256 dgCommit_,
        Passport memory passport_,
        VerifierHelper.ProofPoints memory zkPoints_
    ) external {
        IPassportDispatcher dispatcher_ = _getDispatcher(passport_.dataType);

        bytes memory challenge_ = dispatcher_.getPassportChallenge(identityKey_);
        uint256 passportKey_ = dispatcher_.getPassportKey(passport_.publicKey);

        PassportInfo storage _passportInfo = _passportInfos[bytes32(passportKey_)];
        IdentityInfo storage _identityInfo = _identityInfos[bytes32(identityKey_)];

        require(identityKey_ > 0, "Registration: identity can not be zero");
        require(_passportInfo.activeIdentity == REVOKED, "Registration: passport is not revoked");
        require(
            _identityInfo.activePassport == bytes32(0),
            "Registration: identity already registered"
        );

        _useSignature(passport_.signature);
        _authenticate(dispatcher_, challenge_, passport_);
        _verifyZKProof(
            dispatcher_,
            certificatesRoot_,
            passportKey_,
            identityKey_,
            dgCommit_,
            zkPoints_
        );

        _passportInfo.activeIdentity = bytes32(identityKey_);
        ++_passportInfo.identityReissueCounter;

        _identityInfo.activePassport = bytes32(passportKey_);
        _identityInfo.issueTimestamp = uint64(block.timestamp);

        uint256 index_ = PoseidonUnit2L.poseidon([passportKey_, identityKey_]);
        uint256 value_ = PoseidonUnit3L.poseidon(
            [dgCommit_, _passportInfo.identityReissueCounter, uint64(block.timestamp)]
        );

        registrationSmt.add(bytes32(index_), bytes32(value_));

        emit ReissuedIdentity(bytes32(passportKey_), bytes32(identityKey_));
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

        _useNonce(uint8(MethodId.None), timestamp);
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

    function updateDispatcher(
        MethodId methodId_,
        bytes calldata data_,
        bytes calldata signature_
    ) external {
        uint256 nonce_ = _getAndIncrementNonce(uint8(methodId_));
        bytes32 signHash_ = keccak256(
            abi.encodePacked(methodId_, data_, "Rarimo", nonce_, address(this))
        );

        _checkSignature(signHash_, signature_);
        _useNonce(uint8(methodId_), nonce_);

        if (methodId_ == MethodId.AddDispatchers) {
            (bytes32 dispatcherType_, address dispatcher_) = abi.decode(data_, (bytes32, address));

            _addDispatcher(dispatcherType_, dispatcher_);
        } else if (methodId_ == MethodId.RemoveDispatchers) {
            bytes32 dispatcherType_ = abi.decode(data_, (bytes32));

            _removeDispatcher(dispatcherType_);
        } else {
            revert("Registration: invalid methodId");
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

    /**
     * @notice Add new passport dispatchers if new passport types are discovered
     * @param dispatcherType_ the new passport type
     * @param dispatcher_ the address of a new dispatcher
     */
    function _addDispatcher(bytes32 dispatcherType_, address dispatcher_) internal {
        require(
            address(passportDispatchers[dispatcherType_]) == address(0),
            "Registration: dispatcher already exists"
        );

        passportDispatchers[dispatcherType_] = IPassportDispatcher(dispatcher_);
    }

    /**
     * @notice Removes the passport dispatcher
     * @param dispatcherType_ the passport type
     */
    function _removeDispatcher(bytes32 dispatcherType_) internal {
        delete passportDispatchers[dispatcherType_];
    }

    function _authorizeUpgrade(address) internal pure virtual override {
        revert("PoseidonSMT: This upgrade method is off");
    }

    function _authorizeUpgrade(
        address newImplementation_,
        bytes calldata signature_
    ) internal override {
        require(newImplementation_ != address(0), "PoseidonSMT: Zero address");

        uint256 nonce_ = _getAndIncrementNonce(uint8(MethodId.AuthorizeUpgrade));
        bytes32 signHash_ = keccak256(
            abi.encodePacked(
                uint8(MethodId.AuthorizeUpgrade),
                newImplementation_,
                "Rarimo",
                nonce_,
                address(this)
            )
        );

        _checkSignature(signHash_, signature_);
        _useNonce(uint8(MethodId.AuthorizeUpgrade), nonce_);
    }

    /**
     * @dev passports AA is sufficiently randomized to use signatures as nonce.
     */
    function _useSignature(bytes memory passportSignature_) internal {
        bytes32 sigHash_ = keccak256(passportSignature_);

        require(!_usedSignatures[sigHash_], "Registration: signature used");

        _usedSignatures[sigHash_] = true;
    }

    function _authenticate(
        IPassportDispatcher dispatcher_,
        bytes memory challenge_,
        Passport memory passport_
    ) internal view {
        require(
            dispatcher_.authenticate(challenge_, passport_.signature, passport_.publicKey),
            "Registration: invalid passport authentication"
        );
    }

    function _verifyZKProof(
        IPassportDispatcher dispatcher_,
        bytes32 certificatesRoot_,
        uint256 passportKey_,
        uint256 identityKey_,
        uint256 dgCommit_,
        VerifierHelper.ProofPoints memory zkPoints_
    ) internal view {
        require(
            certificatesSmt.isRootValid(certificatesRoot_),
            "Registration: invalid certificates root"
        );

        uint256[] memory pubSignals_ = new uint256[](4);

        pubSignals_[0] = passportKey_; // output
        pubSignals_[1] = dgCommit_; // output
        pubSignals_[2] = identityKey_; // output
        pubSignals_[3] = uint256(certificatesRoot_); // public input

        require(
            dispatcher_.verifyZKProof(pubSignals_, zkPoints_),
            "Registration: invalid zk proof"
        );
    }

    function _getDispatcher(
        bytes32 passportType_
    ) internal view returns (IPassportDispatcher dispatcher_) {
        dispatcher_ = passportDispatchers[passportType_];

        require(address(dispatcher_) != address(0), "Registration: dispatcher does not exist");
    }
}
