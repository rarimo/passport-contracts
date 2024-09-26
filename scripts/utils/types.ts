import { solidityPackedKeccak256 as keccak256 } from "ethers";

// ------------------------ CERTIFICATE ------------------------

export const C_RSA_SHA1_4096 = keccak256(["string"], ["C_RSA_SHA1_4096"]);
export const C_RSA_SHA1_2048 = keccak256(["string"], ["C_RSA_SHA1_2048"]);
export const C_RSA_SHA2_4096 = keccak256(["string"], ["C_RSA_4096"]);
export const C_RSA_SHA2_2048 = keccak256(["string"], ["C_RSA_2048"]);

export const C_RSAPSS_SHA2_2048 = keccak256(["string"], ["C_RSAPSS_SHA2_2048"]);
export const C_RSAPSS_SHA2_4096 = keccak256(["string"], ["C_RSAPSS_SHA2_4096"]);
export const C_RSAPSS_SHA512_2048 = keccak256(["string"], ["C_RSAPSS_SHA512_2048"]);
export const C_RSAPSS_SHA512_4096 = keccak256(["string"], ["C_RSAPSS_SHA512_4096"]);

// -------------------------- PASSPORT --------------------------

export const P_NO_AA = keccak256(["string"], ["P_NO_AA"]);
export const P_RSA_SHA1_2688 = keccak256(["string"], ["P_RSA_SHA1_2688"]);
export const P_RSA_SHA1_2688_3 = keccak256(["string"], ["P_RSA_SHA1_2688_3"]);
export const P_RSA_SHA2_2688 = keccak256(["string"], ["P_RSA_SHA2_2688"]);
export const P_RSA_SHA2_2688_3 = keccak256(["string"], ["P_RSA_SHA2_2688_3"]);
export const P_ECDSA_SHA1_2704 = keccak256(["string"], ["P_ECDSA_SHA1_2704"]);

// -------------------------- VERIFIER --------------------------

export const Z_UNIVERSAL_4096 = keccak256(["string"], ["Z_UNIVERSAL_4096"]);
export const Z_UNIVERSAL_2048 = keccak256(["string"], ["Z_UNIVERSAL_2048"]);
export const Z_UNIVERSAL_2048_V2 = keccak256(["string"], ["Z_UNIVERSAL_2048_V2"]);

export const Z_UNIVERSAL_PSS_2048_S32_E2 = keccak256(["string"], ["Z_UNIVERSAL_PSS_2048_S32_E2"]);
export const Z_UNIVERSAL_PSS_2048_S32_E17 = keccak256(["string"], ["Z_UNIVERSAL_PSS_2048_S32_E17"]);
export const Z_UNIVERSAL_PSS_2048_S64_E17 = keccak256(["string"], ["Z_UNIVERSAL_PSS_2048_S64_E17"]);

export const Z_INTERNAL = keccak256(["string"], ["Z_INTERNAL"]);
export const Z_INTERNAL_OPT = keccak256(["string"], ["Z_INTERNAL_OPT"]);
export const Z_MNE_OPT = keccak256(["string"], ["Z_MNE_OPT"]);
export const Z_MNE_OPT_2 = keccak256(["string"], ["Z_MNE_OPT_2"]);
