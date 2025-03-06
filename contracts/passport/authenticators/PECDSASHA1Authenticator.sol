// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {SHA1} from "../../utils/SHA1.sol";

import {ECDSA256} from "@solarity/solidity-lib/libs/crypto/ECDSA256.sol";

/**
 * @notice Forked from https://github.com/tdrerup/elliptic-curve-solidity/blob/master/contracts/curves/EllipticCurve.sol
 */
contract PECDSASHA1Authenticator {
    using ECDSA256 for *;
    using SHA1 for bytes;

    ECDSA256.Parameters private _brainpoolP256r1CurveParams =
        ECDSA256.Parameters({
            a: 0x7D5A0975FC2C3057EEF67530417AFFE7FB8055C126DC5C6CE94A4B44F330B5D9,
            b: 0x26DC5C6CE94A4B44F330B5D9BBD77CBF958416295CF7E1CE6BCCDC18FF8C07B6,
            gx: 0x8BD2AEB9CB7E57CB2C4B482FFC81B7AFB9DE27E1E3BD23C23A4453BD9ACE3262,
            gy: 0x547EF835C3DAC4FD97F8461A14611DC9C27745132DED8E545C1D54C72F046997,
            p: 0xA9FB57DBA1EEA9BC3E660A909D838D726E3BF623D52620282013481D1F6E5377,
            n: 0xA9FB57DBA1EEA9BC3E660A909D838D718C397AA3B561A6F7901E0E82974856A7,
            lowSmax: 0x54fdabedd0f754de1f3305484ec1c6b9371dfb11ea9310141009a40e8fb729bb
        });

    /**
     * @notice Checks active authentication of a passport. ECDSA active authentication is an ECDSA signature of
     * raw SHA1 hash of challenge bytes. Usually brainpool256r1 elliptic curve is used.
     */
    function authenticate(
        bytes memory challenge,
        uint256 r,
        uint256 s,
        uint256 x,
        uint256 y
    ) external view returns (bool) {
        uint256 message_ = uint256(uint160(challenge.sha1()));

        bytes memory signature_ = abi.encodePacked(r, s);
        bytes memory pubKey_ = abi.encodePacked(x, y);

        return _brainpoolP256r1CurveParams.verify(bytes32(message_), signature_, pubKey_);
    }
}
