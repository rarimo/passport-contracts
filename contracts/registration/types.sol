// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

// ------------------------ CERTIFICATE ------------------------

bytes32 constant C_RSA_SHA1_4096 = keccak256("C_RSA_SHA1_4096");
bytes32 constant C_RSA_SHA1_2048 = keccak256("C_RSA_SHA1_2048");
bytes32 constant C_RSA_SHA2_4096 = keccak256("C_RSA_4096");
bytes32 constant C_RSA_SHA2_2048 = keccak256("C_RSA_2048");

bytes32 constant C_RSAPSS_SHA2_2048 = keccak256("C_RSAPSS_SHA2_2048");
bytes32 constant C_RSAPSS_SHA2_4096 = keccak256("C_RSAPSS_SHA2_4096");
bytes32 constant C_RSAPSS_SHA512_2048 = keccak256("C_RSAPSS_SHA512_2048");
bytes32 constant C_RSAPSS_SHA512_4096 = keccak256("C_RSAPSS_SHA512_4096");

// -------------------------- PASSPORT --------------------------

bytes32 constant P_NO_AA = keccak256("P_NO_AA");
bytes32 constant P_RSA_SHA1_2688 = keccak256("P_RSA_SHA1_2688");
bytes32 constant P_RSA_SHA1_2688_3 = keccak256("P_RSA_SHA1_2688_3");
bytes32 constant P_ECDSA_SHA1_2704 = keccak256("P_ECDSA_SHA1_2704");

// -------------------------- VERIFIER --------------------------

bytes32 constant Z_UNIVERSAL_4096 = keccak256("Z_UNIVERSAL_4096");
bytes32 constant Z_UNIVERSAL_2048 = keccak256("Z_UNIVERSAL_2048");
bytes32 constant Z_UNIVERSAL_2048_V2 = keccak256("Z_UNIVERSAL_2048_V2");
bytes32 constant Z_UNIVERSAL_2048_V3 = keccak256("Z_UNIVERSAL_2048_V3");

bytes32 constant Z_UNIVERSAL_PSS_2048_S32_E2 = keccak256("Z_UNIVERSAL_PSS_2048_S32_E2");
bytes32 constant Z_UNIVERSAL_PSS_2048_S32_E17 = keccak256("Z_UNIVERSAL_PSS_2048_S32_E17");
bytes32 constant Z_UNIVERSAL_PSS_2048_S64_E17 = keccak256("Z_UNIVERSAL_PSS_2048_S64_E17");

bytes32 constant Z_UKR_ECDSA_BRAINPOOL_256 = keccak256("Z_UKR_ECDSA_BRAINPOOL_256");

bytes32 constant Z_INTERNAL = keccak256("Z_INTERNAL");
bytes32 constant Z_INTERNAL_OPT = keccak256("Z_INTERNAL_OPT");

bytes32 constant Z_MNE_OPT = keccak256("Z_MNE_OPT");
bytes32 constant Z_MNE_OPT_2 = keccak256("Z_MNE_OPT_2");
