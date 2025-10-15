// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ERC1967Utils} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

import {SetHelper} from "@solarity/solidity-lib/libs/arrays/SetHelper.sol";
import {Groth16VerifierHelper} from "@solarity/solidity-lib/libs/zkp/Groth16VerifierHelper.sol";

import {INoirVerifier} from "../interfaces/verifiers/INoirVerifier.sol";

import {StateKeeper} from "../state/StateKeeper.sol";

contract RegistrationSimple is Initializable, UUPSUpgradeable {
    using ECDSA for bytes32;
    using Groth16VerifierHelper for address;
    using SetHelper for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    string public constant REGISTRATION_SIMPLE_PREFIX = "Registration simple prefix";

    uint256 internal constant _PROOF_SIGNALS_COUNT = 3;

    enum MethodId {
        None,
        UpdateSignerList
    }

    enum OperationId {
        None,
        AddSigner,
        RemoveSigner
    }

    struct Passport {
        uint256 dgCommit;
        bytes32 dg1Hash;
        bytes32 publicKey;
        bytes32 passportHash;
        address verifier;
    }

    StateKeeper public stateKeeper;

    EnumerableSet.AddressSet private _signers;

    event SignersListUpdated(address[] signers, uint8[] actions);

    constructor() {
        _disableInitializers();
    }

    function __RegistrationSimple_init(
        address stateKeeper_,
        address[] calldata signers_
    ) external initializer {
        stateKeeper = StateKeeper(stateKeeper_);

        _signers.add(signers_);
    }

    function registerSimple(
        uint256 identityKey_,
        Passport memory passport_,
        bytes memory signature_,
        Groth16VerifierHelper.ProofPoints memory zkPoints_
    ) external {
        require(identityKey_ > 0, "RegistrationSimple: identity can not be zero");

        bytes32 signedData_ = _buildSignedData(passport_);
        address dataSigner_ = ECDSA.recover(
            MessageHashUtils.toEthSignedMessageHash(signedData_),
            signature_
        );

        _requireSigner(dataSigner_);

        stateKeeper.useSignature(keccak256(signature_));

        _verifyZKProof(
            passport_.verifier,
            uint256(passport_.dg1Hash),
            passport_.dgCommit,
            identityKey_,
            zkPoints_
        );

        stateKeeper.addBond(
            passport_.publicKey,
            passport_.passportHash,
            bytes32(identityKey_),
            passport_.dgCommit
        );
    }

    function registerSimpleViaNoir(
        uint256 identityKey_,
        Passport memory passport_,
        bytes memory signature_,
        bytes memory zkPoints_
    ) external virtual {
        require(identityKey_ > 0, "RegistrationSimple: identity can not be zero");

        bytes32 signedData_ = _buildSignedData(passport_);
        address dataSigner_ = ECDSA.recover(
            MessageHashUtils.toEthSignedMessageHash(signedData_),
            signature_
        );

        _requireSigner(dataSigner_);

        stateKeeper.useSignature(keccak256(signature_));

        _verifyNoirZKProof(
            passport_.verifier,
            passport_.dg1Hash,
            bytes32(passport_.dgCommit),
            bytes32(identityKey_),
            zkPoints_
        );

        stateKeeper.addBond(
            passport_.publicKey,
            passport_.passportHash,
            bytes32(identityKey_),
            passport_.dgCommit
        );
    }

    function updateSignerList(bytes calldata data_) external {
        _onlyOwner();

        (address[] memory signers_, uint8[] memory actions_) = abi.decode(
            data_,
            (address[], uint8[])
        );

        require(signers_.length == actions_.length, "RegistrationSimple: invalid input length");

        for (uint256 i = 0; i < signers_.length; i++) {
            if (OperationId(actions_[i]) == OperationId.AddSigner) {
                _signers.add(signers_[i]);
            } else if (OperationId(actions_[i]) == OperationId.RemoveSigner) {
                _signers.remove(signers_[i]);
            } else {
                revert("RegistrationSimple: invalid operationId");
            }
        }

        emit SignersListUpdated(signers_, actions_);
    }

    function getSigners() external view returns (address[] memory) {
        return _signers.values();
    }

    function _buildSignedData(Passport memory passport_) internal view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    REGISTRATION_SIMPLE_PREFIX,
                    address(this),
                    passport_.passportHash,
                    // Inside the DG1 commitment, we have the identity key; therefore,
                    // if the identity is to be reissued, the key will also change,
                    // as well as the backend signature.
                    // The DG1 commitment is bound to the DG1 hash via a ZKP.
                    passport_.dgCommit,
                    passport_.publicKey,
                    passport_.verifier
                )
            );
    }

    function _verifyZKProof(
        address verifier_,
        uint256 dg1Hash_,
        uint256 dg1Commitment_,
        uint256 pkIdentityHash_,
        Groth16VerifierHelper.ProofPoints memory zkPoints_
    ) internal view {
        uint256[] memory pubSignals_ = new uint256[](_PROOF_SIGNALS_COUNT);

        pubSignals_[0] = dg1Hash_; // output
        pubSignals_[1] = dg1Commitment_; // output
        pubSignals_[2] = pkIdentityHash_; // output

        require(
            verifier_.verifyProof(zkPoints_, pubSignals_),
            "RegistrationSimple: invalid zk proof"
        );
    }

    function _verifyNoirZKProof(
        address verifier_,
        bytes32 dg1Hash_,
        bytes32 dg1Commitment_,
        bytes32 pkIdentityHash_,
        bytes memory zkPoints_
    ) internal view {
        bytes32[] memory pubSignals_ = new bytes32[](_PROOF_SIGNALS_COUNT);

        pubSignals_[0] = dg1Commitment_; // output
        pubSignals_[1] = dg1Hash_; // output
        pubSignals_[2] = pkIdentityHash_; // output

        require(
            INoirVerifier(verifier_).verify(zkPoints_, pubSignals_),
            "RegistrationSimple: invalid noir zk proof"
        );
    }

    function _requireSigner(address account_) private view {
        require(_signers.contains(account_), "RegistrationSimple: caller is not a signer");
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
