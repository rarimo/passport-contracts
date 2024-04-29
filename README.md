[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Decentralized Identity Issuance

Issue your unique identity through Rarimo and ZKP.

## How it works

The general idea is to create a decentralized, permissionless protocol that will be able to issue users' on-chain identities without revealing anything about the users themselves.

Users will then use these identities as a gateway to a slew of activities like anonymous voting, participation in events that require KYC, generation of humanity proofs, etc.

The ambitious idea has a set of challenges to overcome:

- Identify the unique user being registered
- Verify that the user is not being impersonated
- Prove that the user is a human being
- Issue the user <-> identity bond
- Reveal no or minimal information about user's credentials

### Identify the user

We are anchoring to NFC-integrated passports to solve the first problem. Each passport is unique and represents a unique human. Users scan their passports through the mobile application and generate ZK proofs that verify their uniqueness.

### Verify the user is not impersonated

The second problem is solved through utilizing "active authentication (AA)" mechanism built into the NFC passports. We ask the user to sign the public key of their identity via AA and then verify this signature on-chain.

### Prove the user is a human

Upon issuance, every NFC passport is signed by an authorized entity from ICAO Master List. The list is publicly known and leveraging this information we can prove that the signature verifies to one of the members from this list. That way the "proof of human" is achieved.

### Issue decentralized identity

If all the checks succeed, we issue a `"hash of passport public key" <-> "identity public key"` bond and store it in the Sparse Merkle Tree (SMT). That enables us to prove the belonging of the identity to a certain user in the participation events.

The stunning beauty of the aforementioned proccess is that **no** vital information is revealed during the registration. We are using advanced ZK techniques and Circom-based circuits to make it work.

## How to use

We distribute the smart contracts in the following NPM package:

```bash
npm install @rarimo/passport-contracts
```

Afterwards, you will be able to use the application by calling the `Registration` entrypoint smart contract.

### Limitations

Currently only a few AA verification methods are supported:

- RSA + SHA1 with 2688 encapsulated content bits
- ECDSA + SHA1 with 1704 encapsulated content bits

## License

The smart contracts are released under the MIT License.
