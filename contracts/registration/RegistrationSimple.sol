// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {ICertificateDispatcher} from "../interfaces/dispatchers/ICertificateDispatcher.sol";

import {IPassportDispatcher} from "../interfaces/dispatchers/IPassportDispatcher.sol";

import {MultiOwnable} from "@solarity/solidity-lib/access/MultiOwnable.sol";

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {PoseidonSMT} from "../state/PoseidonSMT.sol";

import {StateKeeper} from "../state/StateKeeper.sol";
import {TSSUpgradeable} from "../state/TSSUpgradeable.sol";
import {VerifierHelper} from "@solarity/solidity-lib/libs/zkp/snarkjs/VerifierHelper.sol";

contract RegistrationSimple is Initializable, MultiOwnable, TSSUpgradeable {
    using ECDSA for bytes32;
    using MerkleProof for bytes32[];
    using VerifierHelper for address;

    string public constant REGISTRATION_SIMPLE_PREFIX = "Registration simple prefix";

    uint256 internal constant _PROOF_SIGNALS_COUNT = 3;

    struct Passport {
        uint256 dgCommit;
        bytes32 dg1Hash;
        bytes32 publicKey;
        bytes32 passportHash;
        address verifier;
    }

    StateKeeper public stateKeeper;

    constructor() {
        _disableInitializers();
    }

    function __RegistrationSimple_init(
        address tssSigner_,
        string calldata chainName_,
        address stateKeeper_
    ) external initializer {
        __MultiOwnable_init();
        __TSSSigner_init(tssSigner_, chainName_);

        stateKeeper = StateKeeper(stateKeeper_);
    }

    function registerSimple(
        uint256 identityKey_,
        Passport memory passport_,
        bytes memory signature_,
        VerifierHelper.ProofPoints memory zkPoints_
    ) external virtual {
        require(identityKey_ > 0, "Registration: identity can not be zero");

        bytes32 signedData_ = _buildSignedData(passport_);
        address dataSigner_ = ECDSA.recover(signedData_.toEthSignedMessageHash(), signature_);

        require(isOwner(dataSigner_), "Registration: invalid signature");

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

    function _buildSignedData(Passport memory passport_) internal view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    REGISTRATION_SIMPLE_PREFIX,
                    address(this),
                    passport_.passportHash,
                    passport_.dg1Hash,
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
        VerifierHelper.ProofPoints memory zkPoints_
    ) internal view {
        uint256[] memory pubSignals_ = new uint256[](_PROOF_SIGNALS_COUNT);

        pubSignals_[0] = dg1Hash_; // output
        pubSignals_[1] = dg1Commitment_; // output
        pubSignals_[2] = pkIdentityHash_; // output

        require(verifier_.verifyProof(pubSignals_, zkPoints_), "Registration: invalid zk proof");
    }
}
