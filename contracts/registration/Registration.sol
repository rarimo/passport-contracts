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
        bytes memory challenge_ = new bytes(8);

        uint256 passportKey_ = PoseidonUnit5L.poseidon(
            _decomposePassportPublicKey(passportPublicKey_)
        );

        for (uint256 i = 0; i < challenge_.length; ++i) {
            challenge_[challenge_.length - i - 1] = bytes1(uint8(identityKey_ >> (8 * i)));
        }

        bytes32 sigHash_ = keccak256(passportSignature_);

        PassportInfo storage _passportInfo = _passportInfos[bytes32(passportKey_)];
        IdentityInfo storage _identityInfo = _identityInfos[bytes32(identityKey_)];

        require(!_usedSignatures[sigHash_], "Registration: signature used");
        require(
            _passportInfo.activeIdentity == bytes32(0),
            "Registration: passport already registered"
        );
        require(
            _identityInfo.activePassport == bytes32(0),
            "Registration: identity already registered"
        );
        require(
            challenge_.verifyPassport(passportSignature_, abi.encodePacked(E), passportPublicKey_),
            "Registration: invalid passport signature"
        );

        uint256[] memory pubSignals_ = new uint256[](4);

        pubSignals_[0] = passportKey_; // output
        pubSignals_[1] = group1Hash_; // output
        pubSignals_[2] = identityKey_; // output
        pubSignals_[3] = uint256(icaoMasterTreeMerkleRoot); // public input

        require(verifier.verifyProof(pubSignals_, zkPoints_), "Registration: invalid zk proof");

        _usedSignatures[sigHash_] = true;

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

    function _decomposePassportPublicKey(
        bytes memory n_
    ) private pure returns (uint256[5] memory decomposed_) {
        assembly {
            for {
                let i := 0
            } lt(i, 5) {
                i := add(i, 1)
            } {
                let someData_ := mload(add(n_, add(32, mul(i, 25))))

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
    }
}
