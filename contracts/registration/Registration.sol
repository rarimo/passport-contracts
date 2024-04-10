// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {PoseidonUnit1L, PoseidonUnit2L, PoseidonUnit3L} from "@iden3/contracts/lib/Poseidon.sol";

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {VerifierHelper} from "@solarity/solidity-lib/libs/zkp/snarkjs/VerifierHelper.sol";

import {TSSSigner} from "./TSSSigner.sol";
import {IPassportDispatcher} from "../interfaces/dispatchers/IPassportDispatcher.sol";
import {PoseidonSMT} from "../utils/PoseidonSMT.sol";

contract Registration is OwnableUpgradeable, PoseidonSMT, TSSSigner {
    string public constant ICAO_PREFIX = "Rarimo CSCA root";
    bytes32 public constant REVOKED = keccak256("REVOKED");

    struct Passport {
        bytes32 dataType;
        bytes signature;
        bytes publicKey;
    }

    struct PassportInfo {
        bytes32 activeIdentity;
        uint64 identityReissueCounter;
    }

    struct IdentityInfo {
        bytes32 activePassport;
        uint64 issueTimestamp;
    }

    bytes32 public icaoMasterTreeMerkleRoot;

    mapping(bytes32 => IPassportDispatcher) public passportDispatchers;

    mapping(bytes32 => PassportInfo) internal _passportInfos;
    mapping(bytes32 => IdentityInfo) internal _identityInfos;

    mapping(bytes32 => bool) internal _usedSignatures;

    event Registered(bytes32 passportKey, bytes32 identityKey);
    event Revoked(bytes32 passportKey, bytes32 identityKey);
    event ReissuedIdentity(bytes32 passportKey, bytes32 identityKey);

    function __Registration_init(
        uint256 treeHeight_,
        address signer_,
        bytes32 icaoMasterTreeMerkleRoot_
    ) external initializer {
        __Ownable_init();
        __PoseidonSMT_init(treeHeight_);
        __TSSSigner_init(signer_);

        icaoMasterTreeMerkleRoot = icaoMasterTreeMerkleRoot_;
    }

    function register(
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
        _verifyZKProof(dispatcher_, passportKey_, identityKey_, dgCommit_, zkPoints_);

        _passportInfo.activeIdentity = bytes32(identityKey_);

        _identityInfo.activePassport = bytes32(passportKey_);
        _identityInfo.issueTimestamp = uint64(block.timestamp);

        uint256 index_ = PoseidonUnit2L.poseidon([passportKey_, identityKey_]);
        uint256 value_ = PoseidonUnit3L.poseidon(
            [dgCommit_, _passportInfo.identityReissueCounter, uint64(block.timestamp)]
        );

        _add(bytes32(index_), bytes32(value_));

        emit Registered(bytes32(passportKey_), bytes32(identityKey_));
    }

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

        _update(bytes32(index_), bytes32(value_));

        emit Revoked(bytes32(passportKey_), bytes32(identityKey_));
    }

    function reissueIdentity(
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
        _verifyZKProof(dispatcher_, passportKey_, identityKey_, dgCommit_, zkPoints_);

        _passportInfo.activeIdentity = bytes32(identityKey_);
        ++_passportInfo.identityReissueCounter;

        _identityInfo.activePassport = bytes32(passportKey_);
        _identityInfo.issueTimestamp = uint64(block.timestamp);

        uint256 index_ = PoseidonUnit2L.poseidon([passportKey_, identityKey_]);
        uint256 value_ = PoseidonUnit3L.poseidon(
            [dgCommit_, _passportInfo.identityReissueCounter, uint64(block.timestamp)]
        );

        _add(bytes32(index_), bytes32(value_));

        emit ReissuedIdentity(bytes32(passportKey_), bytes32(identityKey_));
    }

    function changeICAOMasterTreeRoot(
        bytes32 newRoot_,
        uint64 timestamp,
        bytes memory proof_
    ) external {
        bytes32 leaf_ = keccak256(abi.encodePacked(ICAO_PREFIX, newRoot_, timestamp));

        _useNonce(timestamp);
        _checkMerkleSignature(leaf_, proof_);

        icaoMasterTreeMerkleRoot = newRoot_;
    }

    function changeSigner(bytes memory newSignerPubKey_, bytes memory signature_) external {
        _checkSignature(keccak256(newSignerPubKey_), signature_);

        signer = _convertPubKeyToAddress(newSignerPubKey_);
    }

    function addDispatcher(bytes32 dispatcherType_, address dispatcher_) external onlyOwner {
        require(
            address(passportDispatchers[dispatcherType_]) == address(0),
            "Registration: dispatcher already exists"
        );

        passportDispatchers[dispatcherType_] = IPassportDispatcher(dispatcher_);
    }

    function removeDispatcher(bytes32 dispatcherType_) external onlyOwner {
        delete passportDispatchers[dispatcherType_];
    }

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
        uint256 passportKey_,
        uint256 identityKey_,
        uint256 dgCommit_,
        VerifierHelper.ProofPoints memory zkPoints_
    ) internal view {
        uint256[] memory pubSignals_ = new uint256[](4);

        pubSignals_[0] = passportKey_; // output
        pubSignals_[1] = dgCommit_; // output
        pubSignals_[2] = identityKey_; // output
        pubSignals_[3] = uint256(icaoMasterTreeMerkleRoot); // public input

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
