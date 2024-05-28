# Changelog

## [Unreleased]

* Made the `PoseidonSMT` and `Registration` contracts upgradable via TSS.
  * Added `UUPSSignableUpgradeable` from the `@rarimo/evm-bridge-contracts` package to the `Registration` and `PoseidonSMT` contracts to support upgradability via TSS.
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






