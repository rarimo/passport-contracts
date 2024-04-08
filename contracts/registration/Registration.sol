// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {PoseidonUnit1L, PoseidonUnit2L, PoseidonUnit3L, PoseidonUnit5L} from "@iden3/contracts/lib/Poseidon.sol";

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import {VerifierHelper} from "@solarity/solidity-lib/libs/zkp/snarkjs/VerifierHelper.sol";

import {PoseidonSMT} from "../utils/PoseidonSMT.sol";
import {RSAVerifier} from "../utils/RSAVerifier.sol";
import {Date2Time} from "../utils/Date2Time.sol";

contract Registration is PoseidonSMT, Initializable {
    using VerifierHelper for address;
    using RSAVerifier for bytes;

    uint256 public constant E = 65537;
    bytes32 public constant REVOKED = keccak256("REVOKED");

    struct PassportInfo {
        bytes32 activeIdentity;
        uint64 identityReissueCounter;
    }

    struct IdentityInfo {
        bytes32 activePassport;
        uint64 issueTimestamp;
    }

    address public verifier;
    bytes32 public icaoMasterTreeMerkleRoot;

    mapping(bytes32 => PassportInfo) internal _passportInfos;
    mapping(bytes32 => IdentityInfo) internal _identityInfos;

    mapping(bytes32 => bool) internal _usedSignatures;

    event Registered(bytes32 passportKey, bytes32 identityKey);
    event Revoked(bytes32 passportKey, bytes32 identityKey);
    event ReissuedIdentity(bytes32 passportKey, bytes32 identityKey);

    function __Registration_init(
        uint256 treeHeight_,
        address verifier_,
        bytes32 icaoMasterTreeMerkleRoot_
    ) external initializer {
        __PoseidonSMT_init(treeHeight_);

        verifier = verifier_;
        icaoMasterTreeMerkleRoot = icaoMasterTreeMerkleRoot_;
    }

    function register(
        uint256 identityKey_,
        uint256 group1Hash_,
        bytes memory passportSignature_,
        bytes memory passportPublicKey_,
        VerifierHelper.ProofPoints memory zkPoints_
    ) external {
        bytes memory challenge_ = _getChallenge(identityKey_);
        uint256 passportKey_ = _getPassportKey(passportPublicKey_);

        PassportInfo storage _passportInfo = _passportInfos[bytes32(passportKey_)];
        IdentityInfo storage _identityInfo = _identityInfos[bytes32(identityKey_)];

        require(
            _passportInfo.activeIdentity == bytes32(0),
            "Registration: passport already registered"
        );
        require(
            _identityInfo.activePassport == bytes32(0),
            "Registration: identity already registered"
        );

        _useSignature(passportSignature_);
        _verifyPassportAA(challenge_, passportSignature_, passportPublicKey_);
        _verifyZKProof(passportKey_, identityKey_, group1Hash_, zkPoints_);

        _passportInfo.activeIdentity = bytes32(identityKey_);

        _identityInfo.activePassport = bytes32(passportKey_);
        _identityInfo.issueTimestamp = uint64(block.timestamp);

        uint256 index_ = PoseidonUnit2L.poseidon([passportKey_, identityKey_]);
        uint256 value_ = PoseidonUnit3L.poseidon(
            [group1Hash_, _passportInfo.identityReissueCounter, uint64(block.timestamp)]
        );

        _add(bytes32(index_), bytes32(value_));

        emit Registered(bytes32(passportKey_), bytes32(identityKey_));
    }

    function revoke(
        uint256 identityKey_,
        bytes memory passportSignature_,
        bytes memory passportPublicKey_
    ) external {
        bytes memory challenge_ = _getChallenge(identityKey_);
        uint256 passportKey_ = _getPassportKey(passportPublicKey_);

        PassportInfo storage _passportInfo = _passportInfos[bytes32(passportKey_)];
        IdentityInfo storage _identityInfo = _identityInfos[bytes32(identityKey_)];

        require(
            _passportInfo.activeIdentity == bytes32(identityKey_),
            "Registration: passport already revoked"
        );
        require(
            _identityInfo.activePassport == bytes32(passportKey_),
            "Registration: identity already revoked"
        );

        _useSignature(passportSignature_);
        _verifyPassportAA(challenge_, passportSignature_, passportPublicKey_);

        _passportInfo.activeIdentity = REVOKED;
        _identityInfo.activePassport = REVOKED;

        uint256 index_ = PoseidonUnit2L.poseidon([passportKey_, identityKey_]);
        uint256 value_ = PoseidonUnit1L.poseidon([uint256(REVOKED)]);

        _update(bytes32(index_), bytes32(value_));

        emit Revoked(bytes32(passportKey_), bytes32(identityKey_));
    }

    function reissueIdentity(
        uint256 identityKey_,
        uint256 group1Hash_,
        bytes memory passportSignature_,
        bytes memory passportPublicKey_,
        VerifierHelper.ProofPoints memory zkPoints_
    ) external {
        bytes memory challenge_ = _getChallenge(identityKey_);
        uint256 passportKey_ = _getPassportKey(passportPublicKey_);

        PassportInfo storage _passportInfo = _passportInfos[bytes32(passportKey_)];
        IdentityInfo storage _identityInfo = _identityInfos[bytes32(identityKey_)];

        require(_passportInfo.activeIdentity == REVOKED, "Registration: passport is not revoked");
        require(
            _identityInfo.activePassport == bytes32(0),
            "Registration: identity already registered"
        );

        _useSignature(passportSignature_);
        _verifyPassportAA(challenge_, passportSignature_, passportPublicKey_);
        _verifyZKProof(passportKey_, identityKey_, group1Hash_, zkPoints_);

        _passportInfo.activeIdentity = bytes32(identityKey_);
        ++_passportInfo.identityReissueCounter;

        _identityInfo.activePassport = bytes32(passportKey_);
        _identityInfo.issueTimestamp = uint64(block.timestamp);

        uint256 index_ = PoseidonUnit2L.poseidon([passportKey_, identityKey_]);
        uint256 value_ = PoseidonUnit3L.poseidon(
            [group1Hash_, _passportInfo.identityReissueCounter, uint64(block.timestamp)]
        );

        _add(bytes32(index_), bytes32(value_));

        emit ReissuedIdentity(bytes32(passportKey_), bytes32(identityKey_));
    }

    function getPassportInfo(
        bytes memory passportPublicKey_
    )
        external
        view
        returns (PassportInfo memory passportInfo_, IdentityInfo memory identityInfo_)
    {
        uint256 passportKey_ = _getPassportKey(passportPublicKey_);

        passportInfo_ = _passportInfos[bytes32(passportKey_)];

        if (passportInfo_.activeIdentity != REVOKED) {
            identityInfo_ = _identityInfos[passportInfo_.activeIdentity];
        }
    }

    function _useSignature(bytes memory passportSignature_) private {
        bytes32 sigHash_ = keccak256(passportSignature_);

        require(!_usedSignatures[sigHash_], "Registration: signature used");

        _usedSignatures[sigHash_] = true;
    }

    function _verifyPassportAA(
        bytes memory challenge_,
        bytes memory passportSignature_,
        bytes memory passportPublicKey_
    ) private view {
        require(
            challenge_.verifyPassport(passportSignature_, abi.encodePacked(E), passportPublicKey_),
            "Registration: invalid passport signature"
        );
    }

    function _verifyZKProof(
        uint256 passportKey_,
        uint256 identityKey_,
        uint256 group1Hash_,
        VerifierHelper.ProofPoints memory zkPoints_
    ) private view {
        uint256[] memory pubSignals_ = new uint256[](4);

        pubSignals_[0] = passportKey_; // output
        pubSignals_[1] = group1Hash_; // output
        pubSignals_[2] = identityKey_; // output
        pubSignals_[3] = uint256(icaoMasterTreeMerkleRoot); // public input

        require(verifier.verifyProof(pubSignals_, zkPoints_), "Registration: invalid zk proof");
    }

    function _getChallenge(uint256 identityKey_) private pure returns (bytes memory challenge_) {
        challenge_ = new bytes(8);

        for (uint256 i = 0; i < challenge_.length; ++i) {
            challenge_[challenge_.length - i - 1] = bytes1(uint8(identityKey_ >> (8 * i)));
        }
    }

    function _getPassportKey(bytes memory passportPublicKey_) private pure returns (uint256) {
        uint256[5] memory decomposed_;

        assembly {
            for {
                let i := 0
            } lt(i, 5) {
                i := add(i, 1)
            } {
                let someData_ := mload(add(passportPublicKey_, add(32, mul(i, 25))))

                switch i
                case 4 {
                    someData_ := shr(32, someData_)
                }
                default {
                    someData_ := shr(56, someData_)
                }

                mstore(add(decomposed_, mul(i, 32)), someData_)
            }
        }

        return PoseidonUnit5L.poseidon(decomposed_);
    }
}
