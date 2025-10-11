[![npm](https://img.shields.io/npm/v/@rarimo/passport-contracts.svg)](https://www.npmjs.com/package/@rarimo/passport-contracts)
[![checks](https://github.com/rarimo/passport-contracts/actions/workflows/checks.yml/badge.svg)](https://github.com/rarimo/passport-contracts/actions/workflows/checks.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# 🛂 Decentralized Identity Issuance

Issue your unique on-chain identity through Rarimo and ZKP.

## 🧪 How it works

The general idea is to create a decentralized, permissionless protocol that will be able to issue users' on-chain identities without revealing anything about the users themselves.

Users will then use these identities as a gateway to a slew of activities like anonymous voting, socials, participation in events that require KYC, generation of humanity proofs, etc.

The ambitious idea has a set of challenges to overcome:

- Identify the unique user being registered
- Verify that the user is not being impersonated
- Prove that the user is a human being
- Issue the user <-> identity bond
- Reveal no or minimal information about user's credentials

### 1. Identify the user

We are anchoring to NFC-integrated passports to solve the first problem. Each passport is unique and represents a unique human. Users scan their passports through the mobile application and generate ZK proofs that verify their uniqueness.

### 2. Verify the user is not impersonated

The second problem is solved through utilizing "active authentication (AA)" mechanism built into the NFC passports. We ask the user to sign the public key of their identity via AA and then verify this signature on-chain.

### 3. Prove the user is a human

Upon issuance, every NFC passport is signed by an authorized (slave) entity that is in turn signed by a member of ICAO Master List. We can extract these signatures from passports and check that the master signature resolves to a member of ICAO. The extraction is a two step process:

1. Extract a slave X509 certificate and check its validity against the master signature
2. Extract a slave signature and check a passport's validity against a valid X509 certificate

### 4. Issue decentralized identity

If all the checks succeed, we issue a `"hash of passport public key" <-> "identity public key"` bond and store it in the Sparse Merkle Tree (SMT). That enables us to prove the belonging of the identity to a certain user in the participation events.

The stunning beauty of the aforementioned process is that **no** vital information is revealed during the registration. We are using advanced ZK techniques and Circom-based circuits to make it work.

## 🪛 How to use

We distribute the smart contracts in the following NPM package:

```bash
npm install @rarimo/passport-contracts
```

Afterwards, you will be able to use the application by calling the `Registration` entrypoint smart contract.

> [!NOTE]
> This is experimental, state of the art software. Behold and use at your own risk.

Here you will find a guide for the on-chain integration with the SDK, which is provided as a part of the NPM package: [Guide: Setting up on-chain user verification with ZK Passport](https://docs.rarimo.com/zk-passport/guide-on-chain-verification/)

## License

The smart contracts are released under the MIT License.
