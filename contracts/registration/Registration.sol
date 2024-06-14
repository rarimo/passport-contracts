// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {VerifierHelper} from "@solarity/solidity-lib/libs/zkp/snarkjs/VerifierHelper.sol";

import {TSSUpgradeable} from "../state/TSSUpgradeable.sol";
import {StateKeeper} from "../state/StateKeeper.sol";
import {PoseidonSMT} from "../state/PoseidonSMT.sol";

import {IPassportDispatcher} from "../interfaces/dispatchers/IPassportDispatcher.sol";
import {ICertificateDispatcher} from "../interfaces/dispatchers/ICertificateDispatcher.sol";

import {P_NO_AA} from "./types.sol";

contract Registration is Initializable, TSSUpgradeable {
    using MerkleProof for bytes32[];
    using VerifierHelper for address;

    uint256 internal constant _PROOF_SIGNALS_COUNT = 5;

    enum MethodId {
        None,
        AddCertificateDispatcher,
        RemoveCertificateDispatcher,
        AddPassportDispatcher,
        RemovePassportDispatcher,
        AddPassportVerifier,
        RemovePassportVerifier
    }

    struct Passport {
        bytes32 dataType;
        bytes32 zkType;
        bytes signature;
        bytes publicKey;
    }

    struct Certificate {
        bytes32 dataType;
        bytes signedAttributes;
        uint256 keyOffset;
        uint256 expirationOffset;
    }

    struct ICAOMember {
        bytes signature;
        bytes publicKey;
    }

    StateKeeper public stateKeeper;

    mapping(bytes32 => address) public certificateDispatchers;
    mapping(bytes32 => address) public passportDispatchers;
    mapping(bytes32 => address) public passportVerifiers;

    constructor() {
        _disableInitializers();
    }

    function __Registration_init(
        address signer_,
        string calldata chainName_,
        address stateKeeper_
    ) external initializer {
        __TSSSigner_init(signer_, chainName_);

        stateKeeper = StateKeeper(stateKeeper_);
    }

    /**
     * @notice Registers an X509 certificate in the certificates SMT.
     * @param certificate_ the X509 certificate struct
     * @param icaoMember_ the ICAO master signer struct
     * @param icaoMerkleProof_ the ICAO list membership Merkle proof
     */
    function registerCertificate(
        Certificate memory certificate_,
        ICAOMember memory icaoMember_,
        bytes32[] memory icaoMerkleProof_
    ) external {
        ICertificateDispatcher dispatcher_ = _getCertificateDispatcher(certificate_.dataType);

        bytes32 icaoMerkleRoot_ = icaoMerkleProof_.processProof(keccak256(icaoMember_.publicKey));

        require(
            icaoMerkleRoot_ == stateKeeper.icaoMasterTreeMerkleRoot(),
            "Registration: invalid icao proof"
        );

        _verifyICAOSignature(
            dispatcher_,
            certificate_.signedAttributes,
            icaoMember_.signature,
            icaoMember_.publicKey
        );

        bytes memory certificatePubKey_ = dispatcher_.getCertificatePublicKey(
            certificate_.signedAttributes,
            certificate_.keyOffset
        );
        uint256 certificateKey = dispatcher_.getCertificateKey(certificatePubKey_);
        uint256 expirationTimestamp_ = dispatcher_.getCertificateExpirationTimestamp(
            certificate_.signedAttributes,
            certificate_.expirationOffset
        );

        stateKeeper.addCertificate(bytes32(certificateKey), expirationTimestamp_);
    }

    /**
     * @notice Revokes an expired X509 certificate
     * @param certificateKey_ the "fancy hashed" (see X509 util) hash of a public key of a certificate
     */
    function revokeCertificate(bytes32 certificateKey_) external {
        stateKeeper.removeCertificate(certificateKey_);
    }

    /**
     * @notice Registers the user passport <> user identity bond in the registration SMT.
     * @param certificatesRoot_ the root of certificates MT (prevents accidental frontrunning)
     * @param identityKey_ the hash of the public key of an identity
     * @param dgCommit_ the commitment of DG1 (is used for identity query proof)
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
        require(identityKey_ > 0, "Registration: identity can not be zero");

        IPassportDispatcher dispatcher_ = _getPassportDispatcher(passport_.dataType);
        address verifier_ = _getPassportVerifier(passport_.zkType);

        bytes memory challenge_ = dispatcher_.getPassportChallenge(identityKey_);
        uint256 passportKey_ = dispatcher_.getPassportKey(passport_.publicKey);

        _useSignature(passport_.signature);
        _authenticate(dispatcher_, challenge_, passport_);
        _verifyZKProof(
            dispatcher_,
            verifier_,
            certificatesRoot_,
            passportKey_,
            identityKey_,
            dgCommit_,
            zkPoints_
        );

        stateKeeper.addBond(bytes32(passportKey_), bytes32(identityKey_), dgCommit_);
    }

    /**
     * @notice Revokes the passport <> identity bond (doesn't actually remove it, sets as "revoked")
     * @param identityKey_ the hash of the public key of an identity
     * @param passport_ the passport info
     */
    function revoke(uint256 identityKey_, Passport memory passport_) external {
        require(identityKey_ > 0, "Registration: identity can not be zero");

        IPassportDispatcher dispatcher_ = _getPassportDispatcher(passport_.dataType);

        bytes memory challenge_ = dispatcher_.getPassportChallenge(identityKey_);
        uint256 passportKey_ = dispatcher_.getPassportKey(passport_.publicKey);

        _useSignature(passport_.signature);
        _authenticate(dispatcher_, challenge_, passport_);

        stateKeeper.revokeBond(bytes32(passportKey_), bytes32(identityKey_));
    }

    /**
     * @notice Reissues the passport <> identity bond by migration to a new identity. The previous bond must be revoked
     * @param certificatesRoot_ the root of certificates MT (prevents accidental frontrunning)
     * @param identityKey_ the hash of the public key of an identity
     * @param dgCommit_ the commitment of DG1 (is used for identity query proof)
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
        require(identityKey_ > 0, "Registration: identity can not be zero");

        IPassportDispatcher dispatcher_ = _getPassportDispatcher(passport_.dataType);
        address verifier_ = _getPassportVerifier(passport_.zkType);

        bytes memory challenge_ = dispatcher_.getPassportChallenge(identityKey_);
        uint256 passportKey_ = dispatcher_.getPassportKey(passport_.publicKey);

        _useSignature(passport_.signature);
        _authenticate(dispatcher_, challenge_, passport_);
        _verifyZKProof(
            dispatcher_,
            verifier_,
            certificatesRoot_,
            passportKey_,
            identityKey_,
            dgCommit_,
            zkPoints_
        );

        stateKeeper.reissueBondIdentity(bytes32(passportKey_), bytes32(identityKey_), dgCommit_);
    }

    /**
     * @notice Adds or removes a dispatcher via Rarimo TSS
     * @param methodId_ the method id
     * (AddCertificateDispatcher, AddPassportDispatcher or RemoveCertificateDispatcher, RemovePassportDispatcher)
     * @param data_ an ABI encoded data for the method
     * - `dispatcherType` of bytes32 and `dispatcher` of address for AddDispatcher
     * - `dispatcherType` of bytes32 for RemoveDispatcher
     * @param proof_ the Rarimo TSS signature with MTP
     */
    function updateDependency(
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

        if (
            methodId_ == MethodId.AddCertificateDispatcher ||
            methodId_ == MethodId.AddPassportDispatcher ||
            methodId_ == MethodId.AddPassportVerifier
        ) {
            (bytes32 dependencyType_, address dependency_) = abi.decode(data_, (bytes32, address));

            _addDependency(_getDependency(methodId_), dependencyType_, dependency_);
        } else if (
            methodId_ == MethodId.RemoveCertificateDispatcher ||
            methodId_ == MethodId.RemovePassportDispatcher ||
            methodId_ == MethodId.RemovePassportVerifier
        ) {
            bytes32 dependencyType_ = abi.decode(data_, (bytes32));

            _removeDependency(_getDependency(methodId_), dependencyType_);
        } else {
            revert("Registration: invalid methodId");
        }
    }

    function _addDependency(
        mapping(bytes32 => address) storage dependencies,
        bytes32 dependencyType_,
        address dependency_
    ) internal {
        require(
            dependencies[dependencyType_] == address(0),
            "Registration: dispatcher already exists"
        );

        dependencies[dependencyType_] = dependency_;
    }

    function _removeDependency(
        mapping(bytes32 => address) storage dependencies,
        bytes32 dependencyType_
    ) internal {
        delete dependencies[dependencyType_];
    }

    /**
     * @dev passports AA is sufficiently randomized to use signatures as nonce.
     */
    function _useSignature(bytes memory passportSignature_) internal {
        bytes32 sigHash_ = keccak256(passportSignature_);

        stateKeeper.useSignature(sigHash_);
    }

    function _verifyICAOSignature(
        ICertificateDispatcher dispatcher_,
        bytes memory x509SignedAttributes_,
        bytes memory icaoMemberSignature_,
        bytes memory icaoMemberPublicKey_
    ) internal view {
        require(
            dispatcher_.verifyICAOSignature(
                x509SignedAttributes_,
                icaoMemberSignature_,
                icaoMemberPublicKey_
            ),
            "Registration: invalid x509 certificate"
        );
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
        address verifier_,
        bytes32 certificatesRoot_,
        uint256 passportKey_,
        uint256 identityKey_,
        uint256 dgCommit_,
        VerifierHelper.ProofPoints memory zkPoints_
    ) internal view {
        require(
            PoseidonSMT(stateKeeper.certificatesSmt()).isRootValid(certificatesRoot_),
            "Registration: invalid certificates root"
        );

        uint256[] memory pubSignals_ = new uint256[](_PROOF_SIGNALS_COUNT);

        pubSignals_[0] = passportKey_; // output
        pubSignals_[1] = 0; // output

        // if there is no active authentication, swap first two outputs
        if (_getPassportDispatcher(P_NO_AA) == dispatcher_) {
            (pubSignals_[0], pubSignals_[1]) = (pubSignals_[1], pubSignals_[0]);
        }

        pubSignals_[2] = dgCommit_; // output
        pubSignals_[3] = identityKey_; // output
        pubSignals_[4] = uint256(certificatesRoot_); // public input

        require(verifier_.verifyProof(pubSignals_, zkPoints_), "Registration: invalid zk proof");
    }

    function _getCertificateDispatcher(
        bytes32 icaoType_
    ) internal view returns (ICertificateDispatcher dispatcher_) {
        dispatcher_ = ICertificateDispatcher(certificateDispatchers[icaoType_]);

        require(
            address(dispatcher_) != address(0),
            "Registration: certificate dispatcher does not exist"
        );
    }

    function _getPassportDispatcher(
        bytes32 passportType_
    ) internal view returns (IPassportDispatcher dispatcher_) {
        dispatcher_ = IPassportDispatcher(passportDispatchers[passportType_]);

        require(
            address(dispatcher_) != address(0),
            "Registration: passport dispatcher does not exist"
        );
    }

    function _getPassportVerifier(bytes32 zkType_) internal view returns (address verifier_) {
        verifier_ = passportVerifiers[zkType_];

        require(verifier_ != address(0), "Registration: passport verifier does not exist");
    }

    function _getDependency(
        MethodId methodId_
    ) internal view returns (mapping(bytes32 => address) storage) {
        if (
            methodId_ == MethodId.AddCertificateDispatcher ||
            methodId_ == MethodId.RemoveCertificateDispatcher
        ) {
            return certificateDispatchers;
        } else if (
            methodId_ == MethodId.AddPassportDispatcher ||
            methodId_ == MethodId.RemovePassportDispatcher
        ) {
            return passportDispatchers;
        } else if (
            methodId_ == MethodId.AddPassportVerifier ||
            methodId_ == MethodId.RemovePassportVerifier
        ) {
            return passportVerifiers;
        } else {
            revert("Registration: unknown dependency");
        }
    }
}
