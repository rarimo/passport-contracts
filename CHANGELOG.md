# Changelog

## [0.1.2]

* Refactored `ECDSA384` signer to use `solarity` implementation
    * Added support for `brainpoolP384r1` curve
* Refactored `RSASSAPSS` signer to use `solarity` implementation
* Added new algorithms:
    1. **Certificate dispatchers**

    ```solidity
    C_ECDSA_SECP384R1_SHA384_512 = keccak256("C_ECDSA_SECP384R1_SHA384_512");
    C_ECDSA_BRAINPOOLP384R1_SHA2_512 = keccak256("C_ECDSA_BRAINPOOLP384R1_SHA2_512");
    C_ECDSA_BRAINPOOLP384R1_SHA384_512 = keccak256("C_ECDSA_BRAINPOOLP384R1_SHA384_512");
    ```

    2. **Passport verifiers**

    ```solidity
    Z_PER_PASSPORT_1_160_3_4_576_200_NA = keccak256("Z_PER_PASSPORT_1_160_3_4_576_200_NA");
    Z_PER_PASSPORT_21_256_3_3_336_232_NA = keccak256("Z_PER_PASSPORT_21_256_3_3_336_232_NA");
    Z_PER_PASSPORT_24_256_3_4_336_232_NA = keccak256("Z_PER_PASSPORT_24_256_3_4_336_232_NA");
    ```

## [0.1.1]

* A handful of new algorithms are now supported. New constants have been added:
    1. **Certificate dispatchers**

    ```solidity
    C_RSA_SHA1_4096 = keccak256("C_RSA_SHA1_4096");
    C_RSA_SHA1_2048 = keccak256("C_RSA_SHA1_2048");
    C_RSAPSS_SHA2_2048 = keccak256("C_RSAPSS_SHA2_2048");
    C_RSAPSS_SHA2_4096 = keccak256("C_RSAPSS_SHA2_4096");
    C_RSAPSS_SHA512_2048 = keccak256("C_RSAPSS_SHA512_2048");
    C_RSAPSS_SHA512_4096 = keccak256("C_RSAPSS_SHA512_4096");
    C_ECDSA_SECP384R1_SHA2_512 = keccak256("C_ECDSA_SECP384R1_SHA2_512");
    ```

    2. **Passport dispatchers**

    ```solidity
    P_RSA_SHA2_2688 = keccak256("P_RSA_SHA2_2688");
    P_RSA_SHA2_2688_3 = keccak256("P_RSA_SHA2_2688_3");
    ```

    3. **Passport verifiers**

    ```solidity
    // Per Passport
    Z_PER_PASSPORT_1_256_3_5_576_248_NA = keccak256("Z_PER_PASSPORT_1_256_3_5_576_248_NA");
    Z_PER_PASSPORT_1_256_3_6_576_248_1_2432_5_296 = keccak256("Z_PER_PASSPORT_1_256_3_6_576_248_1_2432_5_296");
    Z_PER_PASSPORT_2_256_3_6_336_264_21_2448_6_2008 = keccak256("Z_PER_PASSPORT_2_256_3_6_336_264_21_2448_6_2008");
    Z_PER_PASSPORT_21_256_3_7_336_264_21_3072_6_2008 = keccak256("Z_PER_PASSPORT_21_256_3_7_336_264_21_3072_6_2008");
    Z_PER_PASSPORT_1_256_3_6_576_264_1_2448_3_256 = keccak256("Z_PER_PASSPORT_1_256_3_6_576_264_1_2448_3_256");
    Z_PER_PASSPORT_2_256_3_6_336_248_1_2432_3_256 = keccak256("Z_PER_PASSPORT_2_256_3_6_336_248_1_2432_3_256");
    Z_PER_PASSPORT_2_256_3_6_576_248_1_2432_3_256 = keccak256("Z_PER_PASSPORT_2_256_3_6_576_248_1_2432_3_256");
    Z_PER_PASSPORT_11_256_3_3_576_248_1_1184_5_264 = keccak256("Z_PER_PASSPORT_11_256_3_3_576_248_1_1184_5_264");
    Z_PER_PASSPORT_12_256_3_3_336_232_NA = keccak256("Z_PER_PASSPORT_12_256_3_3_336_232_NA");
    Z_PER_PASSPORT_1_256_3_4_336_232_1_1480_5_296 = keccak256("Z_PER_PASSPORT_1_256_3_4_336_232_1_1480_5_296");
    Z_PER_PASSPORT_1_256_3_4_600_248_1_1496_3_256 = keccak256("Z_PER_PASSPORT_1_256_3_4_600_248_1_1496_3_256");

    // Universal
    Z_UNIVERSAL_2048_V2 = keccak256("Z_UNIVERSAL_2048_V2");
    Z_UNIVERSAL_PSS_2048_S32_E2 = keccak256("Z_UNIVERSAL_PSS_2048_S32_E2");
    Z_UNIVERSAL_PSS_2048_S32_E17 = keccak256("Z_UNIVERSAL_PSS_2048_S32_E17");
    Z_UNIVERSAL_PSS_2048_S64_E17 = keccak256("Z_UNIVERSAL_PSS_2048_S64_E17");

    // Georgia
    Z_INTERNAL_OPT = keccak256("Z_INTERNAL_OPT");

    // Montenegro
    Z_MNE_OPT = keccak256("Z_MNE_OPT");
    Z_MNE_OPT_2 = keccak256("Z_MNE_OPT_2");
    ```

## [0.1.0]

* Changed `StateKeeper` interface to always accept passport public keys together with passport hashes. Previously if a passport didn't have AA, a passport public key would be treated as a passport hash. Now these are separate variables where a passport public key may be zero.
    * Preserved backward-compatibility in terms of which "identity bond" identifiers to use:
        - **Passport public key** if it is provided.
        - **Passport hash** in every other case.
    * Now a passport can't be registered with both the public key and the hash.
* Added the second registration contract `Registration2` which works with the updated circuits. Updated circuits utilize five public inputs and always output a passport hash.
    * The `Passport` struct has changed, hence chenging `register()`, `revoke()`, and `reissueIdentity()` methods signatures.
* Updated `PRSASHA1Authenticator` contract to accept an RSA exponent as an initialization parameter to support the wider range of passports.
* New constants have been added:
    1. **Passport dispatchers**

    ```solidity
    P_RSA_SHA1_2688_3 = keccak256("P_RSA_SHA1_2688_3");
    ```

    2. **Passport verifiers**

    ```solidity
    Z_INTERNAL = keccak256("Z_INTERNAL");
    ```
* Updated migration scripts.
* Fixed and added some tests.

## [Unreleased 2.0]

* Added `StateKeeper` contract that acts as a singleton state instance that registrations interact with.
    * `StateKeeper` integrates with `PoseidonSMT` contracts and manages the way how "certificates" and "identity bonds" are assembled.
    * The contract centralized the "passport <> identity" bond storage. `getPassportInfo()` method has been moved there.
    * New `getCertificateInfo()` and `usedSignatures()` methods have been added.
    * It is now possible to have multiple independent registrations that verify users' passports. The registrations can be added to the `StateKeeper` via `updateRegistrationSet()` method that requires Rarimo TSS. The ability to add new registrations opens the doors for the support of new passports at the extremisis.
    * New methods `getRegistrations()`, `getRegistrationByKey()`, and `isRegistration()` have been implemented. Each registration can be associated with a `string` key with the meaning of that key delegated to the front end (mobile app).
* Refactored `Registration` contract in order to be forward compatible as possible. The contract now has 3 types of dispatchers:
    1. **Passport dispatchers**. The same ones as before, though the constants have changed.

    ```solidity
    P_NO_AA = keccak256("P_NO_AA")
    P_RSA_SHA1_2688 = keccak256("P_RSA_SHA1_2688")
    P_ECDSA_SHA1_2704 = keccak256("P_ECDSA_SHA1_2704")
    ```

    2. **Certificate dispatchers**. The new ones.

    ```solidity
    C_RSA_4096 = keccak256("C_RSA_4096")
    C_RSA_2048 = keccak256("C_RSA_2048")
    ```

    3. **Passport verifiers**. The new ones.

    ```solidity
    Z_UNIVERSAL_4096 = keccak256("Z_UNIVERSAL_4096")
    Z_UNIVERSAL_2048 = keccak256("Z_UNIVERSAL_2048")
    ```

    Check [types file](scripts/utils/types.ts) for more information.
    
    Every category of dispatchers is completely independent from the other, which contributes to high flexibility and linear dependencies complexity growth. The front end now has to deduce the correct dispatcher type not for one category, but for three.

    * `updateDispatcher()` method has been renamed to `updateDependency()` to broaden its meaning.
    * Added `zkType` variable to `Passport` struct to resolve the correct passport verifier.
    * Changed the interface of `registerCertificate()` method. Packed up variables in structs.
    * Moved all the events from `Registration` to `StateKeeper` and renamed them.
    * Moved `icaoMasterTreeMerkleRoot` and its update logic from `Registration` to `StateKeeper`.
* Refactored upgradeability mechanics and encapsulated them in a new `TSSUpgradeable` abstract smart contract.
* Integrated with the newest circuits that support passport without active authentication and have 5 public inputs (instead of 4).
* Fixed all the tests except ZK.
* Fixed migration scripts. Added config resolution based on deployment chain.
* Updated natspec.

## [Unreleased]

* Made the `PoseidonSMT` and `Registration` contracts upgradable via TSS.
    * Copied `UUPSSignableUpgradeable`  from the `@rarimo/evm-bridge-contracts` package to the `Registration` and `PoseidonSMT` contracts to support upgradability via TSS.
    * Modified `UUPSSignableUpgradeable` to work with encoded (signature + MTP), not just signature
    * Rewrote tests and deployment scripts to deploy `ERC1967Proxy` before initializing the `Registration` and `PoseidonSMT` contracts.
    * Added the `_disableInitializers()` function in the constructors of the `Registration` and `PoseidonSMT` contracts.
* Added the ability for the `PoseidonSMT` contract to handle multiple registrations.
    * Restricted adding or removing registrations to the TSS.
* Replaced `OwnableUpgradeable` functionality in the registration contract with the functionality of TSS, so dispatchers can be added or removed only via signatures.
* Added the ability to set `methodId` as the first key of the `_nonces` and `_usedNonces` fields to separate them for different methods within the contract.
* Added a `nonces` mapping in the `TSSSigner` contract to have the functionality of getting them for calling specific methods within the contract, for example, for implementation upgrades via TSS.
* Added the ability to set `chainName` in the `TSSSigner` contract.
    * The `chainName` field is used to add support for contract upgradability and other actions via TSS.
    * It was also added due to current conventions in the existing system.
* Cleaned up tests.
