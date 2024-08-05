// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

library RSA {
    /**
     * @notice RSA decryption algorithm via 0x05 modexp precompile
     */
    function decrypt(
        bytes memory s_,
        bytes memory e_,
        bytes memory n_
    ) internal view returns (bytes memory decipher_) {
        bytes memory input_ = abi.encodePacked(
            bytes32(s_.length),
            bytes32(e_.length),
            bytes32(n_.length),
            s_,
            e_,
            n_
        );
        uint256 inputLength_ = input_.length;

        uint256 decipherLength_ = n_.length;
        decipher_ = new bytes(decipherLength_);

        assembly {
            pop(
                staticcall(
                    sub(gas(), 2000), // gas buffer
                    5,
                    add(input_, 0x20),
                    inputLength_,
                    add(decipher_, 0x20),
                    decipherLength_
                )
            )
        }
    }
}
