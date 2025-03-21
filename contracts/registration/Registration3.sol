// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ERC1967Utils} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {Groth16VerifierHelper} from "@solarity/solidity-lib/libs/zkp/Groth16VerifierHelper.sol";

import {StateKeeper} from "../state/StateKeeper.sol";
import {PoseidonSMT} from "../state/PoseidonSMT.sol";

import {IPassportDispatcher} from "../interfaces/dispatchers/IPassportDispatcher.sol";
import {ICertificateDispatcher} from "../interfaces/dispatchers/ICertificateDispatcher.sol";

import {BaseUltraVerifier} from "../passport/verifiers2/noir/UltraPlonkPassport.sol";

contract Registration3 is Initializable, UUPSUpgradeable {
    using MerkleProof for bytes32[];
    using Groth16VerifierHelper for address;

    bytes32 public constant P_NO_AA = keccak256("P_NO_AA");
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
        bytes32 passportHash;
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

    error InvalidProof(bytes proof, bytes32[] pubSignals);

    function __Registration_init(address stateKeeper_) external initializer {
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
    ) external virtual {
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
    function revokeCertificate(bytes32 certificateKey_) external virtual {
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
        bytes calldata zkPoints_
    ) external virtual {
        require(identityKey_ > 0, "Registration: identity can not be zero");

        IPassportDispatcher dispatcher_ = _getPassportDispatcher(passport_.dataType);
        address verifier_ = _getPassportVerifier(passport_.zkType);

        bytes memory challenge_ = dispatcher_.getPassportChallenge(identityKey_);
        uint256 passportKey_ = dispatcher_.getPassportKey(passport_.publicKey);

        _useSignature(passport_.signature);
        _authenticate(dispatcher_, challenge_, passport_);
        _verifyZKProof(
            verifier_,
            certificatesRoot_,
            passportKey_,
            uint256(passport_.passportHash),
            identityKey_,
            dgCommit_,
            zkPoints_
        );

        stateKeeper.addBond(
            bytes32(passportKey_),
            passport_.passportHash,
            bytes32(identityKey_),
            dgCommit_
        );
    }

    /**
     * @notice Revokes the passport <> identity bond (doesn't actually remove it, sets as "revoked")
     * @param identityKey_ the hash of the public key of an identity
     * @param passport_ the passport info
     */
    function revoke(uint256 identityKey_, Passport memory passport_) external virtual {
        require(identityKey_ > 0, "Registration: identity can not be zero");
        require(passport_.dataType != P_NO_AA, "Registration: can't revoke without AA");

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
        bytes calldata zkPoints_
    ) external virtual {
        require(identityKey_ > 0, "Registration: identity can not be zero");

        IPassportDispatcher dispatcher_ = _getPassportDispatcher(passport_.dataType);
        address verifier_ = _getPassportVerifier(passport_.zkType);

        bytes memory challenge_ = dispatcher_.getPassportChallenge(identityKey_);
        uint256 passportKey_ = dispatcher_.getPassportKey(passport_.publicKey);

        _useSignature(passport_.signature);
        _authenticate(dispatcher_, challenge_, passport_);
        _verifyZKProof(
            verifier_,
            certificatesRoot_,
            passportKey_,
            uint256(passport_.passportHash),
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
     */
    function updateDependency(MethodId methodId_, bytes calldata data_) external virtual {
        _onlyOwner();

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
        if (passportSignature_.length == 0) {
            return;
        }

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
        address verifier_,
        bytes32 certificatesRoot_,
        uint256 passportKey_,
        uint256 passportHash_,
        uint256 identityKey_,
        uint256 dgCommit_,
        bytes calldata zkPoints_
    ) internal {
        require(
            PoseidonSMT(stateKeeper.certificatesSmt()).isRootValid(certificatesRoot_),
            "Registration: invalid certificates root"
        );

        bytes32[] memory pubSignals_ = new bytes32[](_PROOF_SIGNALS_COUNT);

        pubSignals_[0] = bytes32(passportKey_); // output
        pubSignals_[1] = bytes32(passportHash_); // output
        pubSignals_[2] = bytes32(dgCommit_); // output
        pubSignals_[3] = bytes32(identityKey_); // output
        pubSignals_[4] = certificatesRoot_; // public input

        require(
            BaseUltraVerifier(verifier_).verify(zkPoints_, pubSignals_),
            InvalidProof(zkPoints_, pubSignals_)
        );
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

    function _onlyOwner() internal view {
        require(stateKeeper.isOwner(msg.sender), "Registration: not an owner");
    }

    function _authorizeUpgrade(address) internal virtual override {
        _onlyOwner();
    }

    function implementation() external view returns (address) {
        return ERC1967Utils.getImplementation();
    }
}
