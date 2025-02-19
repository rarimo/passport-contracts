// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {DynamicSet} from "@solarity/solidity-lib/libs/data-structures/DynamicSet.sol";

import {StateKeeper} from "../../state/StateKeeper.sol";

import {ICertificateDispatcher} from "../../interfaces/dispatchers/ICertificateDispatcher.sol";
import {Registration2} from "../../registration/Registration2.sol";

contract StateKeeperMock is StateKeeper {
    using DynamicSet for DynamicSet.StringSet;

    struct Certificate {
        bytes32 dataType;
        bytes signedAttributes;
        uint256 keyOffset;
        uint256 expirationOffset;
    }

    function mockAddCertificate(Certificate memory certificate_, address registration2_) external {
        ICertificateDispatcher dispatcher_ = _getCertificateDispatcher(
            certificate_.dataType,
            registration2_
        );

        bytes memory certificatePubKey_ = dispatcher_.getCertificatePublicKey(
            certificate_.signedAttributes,
            certificate_.keyOffset
        );
        bytes32 certificateKey_ = bytes32(dispatcher_.getCertificateKey(certificatePubKey_));
        uint256 expirationTimestamp_ = dispatcher_.getCertificateExpirationTimestamp(
            certificate_.signedAttributes,
            certificate_.expirationOffset
        );

        _certificateInfos[certificateKey_].expirationTimestamp = uint64(expirationTimestamp_);

        certificatesSmt.add(certificateKey_, certificateKey_);

        emit CertificateAdded(certificateKey_, expirationTimestamp_);
    }

    function _getCertificateDispatcher(
        bytes32 icaoType_,
        address registration2_
    ) internal view returns (ICertificateDispatcher dispatcher_) {
        dispatcher_ = ICertificateDispatcher(
            Registration2(registration2_).certificateDispatchers(icaoType_)
        );

        require(
            address(dispatcher_) != address(0),
            "Registration: certificate dispatcher does not exist"
        );
    }

    function mockAddRegistrations(string[] memory keys_, address[] memory values_) external {
        for (uint256 i = 0; i < keys_.length; i++) {
            require(_registrationKeys.add(keys_[i]), "StateKeeperMock: duplicate registration");
            _registrations[keys_[i]] = values_[i];
            _registrationExists[values_[i]] = true;
        }
    }

    function mockChangeICAOMasterTreeRoot(bytes32 newRoot_) external {
        icaoMasterTreeMerkleRoot = newRoot_;
    }

    function mockPassportData(bytes32 passportKey_, bytes32 mockIdentityKey_) external {
        _passportInfos[passportKey_].activeIdentity = mockIdentityKey_;
    }

    function mockIdentityData(bytes32 identityKey_, bytes32 mockPassportKey_) external {
        _identityInfos[identityKey_].activePassport = mockPassportKey_;
    }

    function _authorizeUpgrade(address) internal pure virtual override {}
}
