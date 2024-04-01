// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {PoseidonUnit1L, PoseidonUnit2L, PoseidonUnit5L} from "@iden3/contracts/lib/Poseidon.sol";

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import {VerifierHelper} from "@solarity/solidity-lib/libs/zkp/snarkjs/VerifierHelper.sol";

import {PoseidonSMT} from "../utils/PoseidonSMT.sol";
import {RSAVerifier} from "../utils/RSAVerifier.sol";
import {Date2Time} from "../utils/Date2Time.sol";

contract Registration is PoseidonSMT, Initializable {
    using VerifierHelper for address;
    using RSAVerifier for bytes;

    uint256 public constant E = 65537;

    address public verifier;
    bytes32 public icaoMasterTreeMerkleRoot;

    mapping(bytes32 => bytes32) public hashedRSAKeyToInternalKey;
    mapping(bytes32 => bytes32) public internalKeyToHashedRSAKey;

    mapping(bytes32 => bool) internal _usedSignatures;

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
        bytes32 userInternalPublicKeyX_,
        bytes32 userInternalPublicKeyY_,
        bytes memory s_,
        bytes memory n_,
        VerifierHelper.ProofPoints memory zkPoints_,
        uint256 group1Hash_
    ) external {
        bytes memory challenge_ = new bytes(8);

        uint256 hashedInternalKey_ = PoseidonUnit2L.poseidon(
            [uint256(userInternalPublicKeyX_), uint256(userInternalPublicKeyY_)]
        );
        uint256 hashedRSAKey_ = PoseidonUnit5L.poseidon(_decomposeRSAKey(n_));

        for (uint256 i = 0; i < challenge_.length; ++i) {
            challenge_[i] = bytes1(uint8(hashedInternalKey_ >> (8 * i)));
        }

        bytes32 sigHash_ = keccak256(s_);

        require(!_usedSignatures[sigHash_], "Registration: signature used");
        require(
            hashedRSAKeyToInternalKey[bytes32(hashedRSAKey_)] == bytes32(0),
            "Registration: passport already registered"
        );
        require(
            internalKeyToHashedRSAKey[bytes32(hashedInternalKey_)] == bytes32(0),
            "Registration: identity already registered"
        );
        require(
            challenge_.verifyPassport(s_, abi.encodePacked(E), n_),
            "Registration: invalid passport signature"
        );

        uint256[] memory pubSignals_ = new uint256[](4);

        pubSignals_[0] = hashedRSAKey_; // output
        pubSignals_[1] = group1Hash_; // output
        pubSignals_[2] = uint256(icaoMasterTreeMerkleRoot); // public input
        pubSignals_[3] = hashedInternalKey_; // public input

        require(verifier.verifyProof(pubSignals_, zkPoints_), "Registration: invalid zk proof");

        uint256 index_ = PoseidonUnit2L.poseidon([hashedRSAKey_, hashedInternalKey_]);

        _usedSignatures[sigHash_] = true;

        hashedRSAKeyToInternalKey[bytes32(hashedRSAKey_)] = bytes32(hashedInternalKey_);
        internalKeyToHashedRSAKey[bytes32(hashedInternalKey_)] = bytes32(hashedRSAKey_);

        _add(bytes32(index_), bytes32(PoseidonUnit2L.poseidon([index_, group1Hash_])));
    }

    function _decomposeRSAKey(
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
