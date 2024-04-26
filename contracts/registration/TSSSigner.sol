// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

abstract contract TSSSigner {
    using ECDSA for bytes32;
    using MerkleProof for bytes32[];

    uint256 public constant P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;

    address public signer;

    mapping(uint256 => bool) internal _nonces;

    function __TSSSigner_init(address signer_) internal {
        signer = signer_;
    }

    function _useNonce(uint256 nonce_) internal {
        require(!_nonces[nonce_], "TSSSigner: nonce used");

        _nonces[nonce_] = true;
    }

    function _checkSignature(bytes32 signHash_, bytes memory signature_) internal view {
        address signer_ = signHash_.recover(signature_);

        require(signer == signer_, "TSSSigner: invalid signature");
    }

    function _checkMerkleSignature(bytes32 merkleLeaf_, bytes memory proof_) internal view {
        (bytes32[] memory merklePath_, bytes memory signature_) = abi.decode(
            proof_,
            (bytes32[], bytes)
        );

        bytes32 merkleRoot_ = merklePath_.processProof(merkleLeaf_);

        _checkSignature(merkleRoot_, signature_);
    }

    function _convertPubKeyToAddress(bytes memory pubKey_) internal pure returns (address) {
        require(pubKey_.length == 64, "TSSSigner: wrong pubKey length");

        (uint256 x_, uint256 y_) = abi.decode(pubKey_, (uint256, uint256));

        // @dev y^2 = x^3 + 7, x != 0, y != 0 (mod P)
        require(x_ != 0 && y_ != 0 && x_ != P && y_ != P, "TSSSigner: zero pubKey");
        require(
            mulmod(y_, y_, P) == addmod(mulmod(mulmod(x_, x_, P), x_, P), 7, P),
            "TSSSigner: pubKey not on the curve"
        );

        return address(uint160(uint256(keccak256(pubKey_))));
    }

    uint256[48] private _gap;
}
