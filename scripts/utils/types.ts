import { solidityPackedKeccak256 as keccak256 } from "ethers";

// ------------------------ CERTIFICATE ------------------------

export const C_RSA_SHA1_4096 = keccak256(["string"], ["C_RSA_SHA1_4096"]);
export const C_RSA_SHA1_2048 = keccak256(["string"], ["C_RSA_SHA1_2048"]);
export const C_RSA_SHA2_4096 = keccak256(["string"], ["C_RSA_4096"]);
export const C_RSA_SHA2_3072 = keccak256(["string"], ["C_RSA_3072"]);
export const C_RSA_SHA2_2048 = keccak256(["string"], ["C_RSA_2048"]);
export const C_RSA_SHA512_4096 = keccak256(["string"], ["C_RSA_SHA512_4096"]);
export const C_RSA_SHA2_3072_56611 = keccak256(["string"], ["C_RSA_3072_56611"]);
export const C_RSA_SHA2_2048_122125 = keccak256(["string"], ["C_RSA_2048_122125"]);

export const C_RSAPSS_SHA2_2048 = keccak256(["string"], ["C_RSAPSS_SHA2_2048"]);
export const C_RSAPSS_SHA2_4096 = keccak256(["string"], ["C_RSAPSS_SHA2_4096"]);
export const C_RSAPSS_SHA512_2048 = keccak256(["string"], ["C_RSAPSS_SHA512_2048"]);
export const C_RSAPSS_SHA512_4096 = keccak256(["string"], ["C_RSAPSS_SHA512_4096"]);
export const C_RSAPSS_SHA2_2048_3 = keccak256(["string"], ["C_RSAPSS_SHA2_2048_3"]);
export const C_RSAPSS_SHA2_3072 = keccak256(["string"], ["C_RSAPSS_SHA2_3072"]);
export const C_RSAPSS_SHA384_2048 = keccak256(["string"], ["C_RSAPSS_SHA384_2048"]);

export const C_ECDSA_SECP256R1_SHA1_256 = keccak256(["string"], ["C_ECDSA_SECP256R1_SHA1_256"]);
export const C_ECDSA_SECP256R1_SHA1_384 = keccak256(["string"], ["C_ECDSA_SECP256R1_SHA1_384"]);
export const C_ECDSA_SECP256R1_SHA1_512 = keccak256(["string"], ["C_ECDSA_SECP256R1_SHA1_512"]);
export const C_ECDSA_SECP384R1_SHA2_512 = keccak256(["string"], ["C_ECDSA_SECP384R1_SHA2_512"]);
export const C_ECDSA_SECP384R1_SHA384_512 = keccak256(["string"], ["C_ECDSA_SECP384R1_SHA384_512"]);
export const C_ECDSA_BRAINPOOLP256R1_SHA1_448 = keccak256(["string"], ["C_ECDSA_BRAINPOOLP256R1_SHA1_448"]);
export const C_ECDSA_BRAINPOOLP384R1_SHA2_512 = keccak256(["string"], ["C_ECDSA_BRAINPOOLP384R1_SHA2_512"]);
export const C_ECDSA_BRAINPOOLP384R1_SHA384_512 = keccak256(["string"], ["C_ECDSA_BRAINPOOLP384R1_SHA384_512"]);
export const C_ECDSA_BRAINPOOLP384R1_SHA384_768 = keccak256(["string"], ["C_ECDSA_BRAINPOOLP384R1_SHA384_768"]);
export const C_ECDSA_BRAINPOOLP512R1_SHA512_1024 = keccak256(["string"], ["C_ECDSA_BRAINPOOLP512R1_SHA512_1024"]);

// -------------------------- PASSPORT --------------------------

export const P_NO_AA = keccak256(["string"], ["P_NO_AA"]);
export const P_RSA_SHA1_2688 = keccak256(["string"], ["P_RSA_SHA1_2688"]);
export const P_RSA_SHA1_2688_3 = keccak256(["string"], ["P_RSA_SHA1_2688_3"]);
export const P_ECDSA_SHA1_2704 = keccak256(["string"], ["P_ECDSA_SHA1_2704"]);
export const P_RSA_SHA256_2688 = keccak256(["string"], ["P_RSA_SHA256_2688"]);
export const P_RSA_SHA256_2688_3 = keccak256(["string"], ["P_RSA_SHA256_2688_3"]);

// -------------------------- VERIFIER --------------------------

export const Z_PER_PASSPORT_1_256_3_5_576_248_NA = keccak256(["string"], ["Z_PER_PASSPORT_1_256_3_5_576_248_NA"]);
export const Z_PER_PASSPORT_1_256_3_6_576_248_1_2432_5_296 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_1_256_3_6_576_248_1_2432_5_296"],
);
export const Z_PER_PASSPORT_2_256_3_6_336_264_21_2448_6_2008 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_2_256_3_6_336_264_21_2448_6_2008"],
);
export const Z_PER_PASSPORT_21_256_3_7_336_264_21_3072_6_2008 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_21_256_3_7_336_264_21_3072_6_2008"],
);
export const Z_PER_PASSPORT_1_256_3_6_576_264_1_2448_3_256 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_1_256_3_6_576_264_1_2448_3_256"],
);
export const Z_PER_PASSPORT_2_256_3_6_336_248_1_2432_3_256 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_2_256_3_6_336_248_1_2432_3_256"],
);
export const Z_PER_PASSPORT_2_256_3_6_576_248_1_2432_3_256 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_2_256_3_6_576_248_1_2432_3_256"],
);
export const Z_PER_PASSPORT_11_256_3_3_576_248_1_1184_5_264 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_11_256_3_3_576_248_1_1184_5_264"],
);
export const Z_PER_PASSPORT_12_256_3_3_336_232_NA = keccak256(["string"], ["Z_PER_PASSPORT_12_256_3_3_336_232_NA"]);
export const Z_PER_PASSPORT_1_256_3_4_336_232_1_1480_5_296 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_1_256_3_4_336_232_1_1480_5_296"],
);
export const Z_PER_PASSPORT_1_256_3_4_600_248_1_1496_3_256 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_1_256_3_4_600_248_1_1496_3_256"],
);
export const Z_PER_PASSPORT_1_160_3_4_576_200_NA = keccak256(["string"], ["Z_PER_PASSPORT_1_160_3_4_576_200_NA"]);
export const Z_PER_PASSPORT_21_256_3_3_336_232_NA = keccak256(["string"], ["Z_PER_PASSPORT_21_256_3_3_336_232_NA"]);
export const Z_PER_PASSPORT_24_256_3_4_336_232_NA = keccak256(["string"], ["Z_PER_PASSPORT_24_256_3_4_336_232_NA"]);
export const Z_PER_PASSPORT_1_160_3_3_576_200_NA = keccak256(["string"], ["Z_PER_PASSPORT_1_160_3_3_576_200_NA"]);
export const Z_PER_PASSPORT_1_256_3_3_576_248_NA = keccak256(["string"], ["Z_PER_PASSPORT_1_256_3_3_576_248_NA"]);
export const Z_PER_PASSPORT_20_256_3_3_336_224_NA = keccak256(["string"], ["Z_PER_PASSPORT_20_256_3_3_336_224_NA"]);
export const Z_PER_PASSPORT_10_256_3_3_576_248_1_1184_5_264 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_10_256_3_3_576_248_1_1184_5_264"],
);
export const Z_PER_PASSPORT_11_256_3_5_576_248_1_1808_4_256 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_11_256_3_5_576_248_1_1808_4_256"],
);
export const Z_PER_PASSPORT_21_256_3_3_576_232_NA = keccak256(["string"], ["Z_PER_PASSPORT_21_256_3_3_576_232_NA"]);
export const Z_PER_PASSPORT_2_256_3_6_336_264_1_2448_3_256 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_2_256_3_6_336_264_1_2448_3_256"],
);
export const Z_PER_PASSPORT_3_160_3_3_336_200_NA = keccak256(["string"], ["Z_PER_PASSPORT_3_160_3_3_336_200_NA"]);
export const Z_PER_PASSPORT_3_160_3_4_576_216_1_1512_3_256 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_3_160_3_4_576_216_1_1512_3_256"],
);

export const Z_PER_PASSPORT_11_256_3_3_576_240_1_864_5_264 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_11_256_3_3_576_240_1_864_5_264"],
);
export const Z_PER_PASSPORT_11_256_3_5_576_248_1_1808_5_296 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_11_256_3_5_576_248_1_1808_5_296"],
);
export const Z_PER_PASSPORT_21_256_3_4_576_232_NA = keccak256(["string"], ["Z_PER_PASSPORT_21_256_3_4_576_232_NA"]);
export const Z_PER_PASSPORT_1_256_3_6_336_248_1_2744_4_256 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_1_256_3_6_336_248_1_2744_4_256"],
);
export const Z_PER_PASSPORT_1_256_3_6_336_560_1_2744_4_256 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_1_256_3_6_336_560_1_2744_4_256"],
);
export const Z_PER_PASSPORT_4_160_3_3_336_216_1_1296_3_256 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_4_160_3_3_336_216_1_1296_3_256"],
);
export const Z_PER_PASSPORT_11_256_3_3_336_248_NA = keccak256(["string"], ["Z_PER_PASSPORT_11_256_3_3_336_248_NA"]);
export const Z_PER_PASSPORT_14_256_3_4_336_64_1_1480_5_296 = keccak256(
  ["string"],
  ["Z_PER_PASSPORT_14_256_3_4_336_64_1_1480_5_296"],
);
export const Z_PER_PASSPORT_15_512_3_3_336_248_NA = keccak256(["string"], ["Z_PER_PASSPORT_15_512_3_3_336_248_NA"]);
export const Z_PER_PASSPORT_20_160_3_3_736_200_NA = keccak256(["string"], ["Z_PER_PASSPORT_20_160_3_3_736_200_NA"]);
export const Z_PER_PASSPORT_20_256_3_5_336_72_NA = keccak256(["string"], ["Z_PER_PASSPORT_20_256_3_5_336_72_NA"]);
export const Z_PER_PASSPORT_21_256_3_5_576_232_NA = keccak256(["string"], ["Z_PER_PASSPORT_21_256_3_5_576_232_NA"]);

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

export const Z_NOIR_PASSPORT_1_256_3_4_600_248_1_1496_3_256 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_1_256_3_4_600_248_1_1496_3_256"],
);
export const Z_NOIR_PASSPORT_1_256_3_5_336_248_1_2120_4_256 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_1_256_3_5_336_248_1_2120_4_256"],
);
export const Z_NOIR_PASSPORT_10_256_3_3_576_248_1_1184_5_264 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_10_256_3_3_576_248_1_1184_5_264"],
);
export const Z_NOIR_PASSPORT_11_256_3_4_336_232_1_1480_4_256 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_11_256_3_4_336_232_1_1480_4_256"],
);
export const Z_NOIR_PASSPORT_14_256_3_3_576_240_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_14_256_3_3_576_240_NA"]);
export const Z_NOIR_PASSPORT_14_256_3_4_576_248_1_1496_3_256 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_14_256_3_4_576_248_1_1496_3_256"],
);
export const Z_NOIR_PASSPORT_2_256_3_4_336_232_1_1480_4_256 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_2_256_3_4_336_232_1_1480_4_256"],
);
export const Z_NOIR_PASSPORT_2_256_3_4_336_248_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_2_256_3_4_336_248_NA"]);
export const Z_NOIR_PASSPORT_2_256_3_6_336_248_1_2432_3_256 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_2_256_3_6_336_248_1_2432_3_256"],
);
export const Z_NOIR_PASSPORT_2_256_3_6_576_248_1_2432_3_256 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_2_256_3_6_576_248_1_2432_3_256"],
);
export const Z_NOIR_PASSPORT_20_160_3_2_576_184_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_20_160_3_2_576_184_NA"]);
export const Z_NOIR_PASSPORT_20_256_3_3_336_224_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_20_256_3_3_336_224_NA"]);
export const Z_NOIR_PASSPORT_21_256_3_3_576_232_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_21_256_3_3_576_232_NA"]);
export const Z_NOIR_PASSPORT_3_512_3_3_336_264_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_3_512_3_3_336_264_NA"]);
export const Z_NOIR_PASSPORT_2_256_3_6_336_264_21_2448_6_2008 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_2_256_3_6_336_264_21_2448_6_2008"],
);
export const Z_NOIR_PASSPORT_21_256_3_4_576_232_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_21_256_3_4_576_232_NA"]);

export const Z_NOIR_PASSPORT_1_256_3_4_576_232_1_1480_3_256 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_1_256_3_4_576_232_1_1480_3_256"],
);
export const Z_NOIR_PASSPORT_1_256_3_5_576_248_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_1_256_3_5_576_248_NA"]);
export const Z_NOIR_PASSPORT_1_256_3_6_576_264_1_2448_3_256 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_1_256_3_6_576_264_1_2448_3_256"],
);
export const Z_NOIR_PASSPORT_3_256_3_4_600_248_1_1496_3_256 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_3_256_3_4_600_248_1_1496_3_256"],
);
export const Z_NOIR_PASSPORT_6_160_3_3_336_216_1_1080_3_256 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_6_160_3_3_336_216_1_1080_3_256"],
);
export const Z_NOIR_PASSPORT_11_256_3_3_576_248_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_11_256_3_3_576_248_NA"]);
export const Z_NOIR_PASSPORT_11_256_3_5_576_248_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_11_256_3_5_576_248_NA"]);
export const Z_NOIR_PASSPORT_14_256_3_4_336_232_1_1480_5_296 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_14_256_3_4_336_232_1_1480_5_296"],
);
export const Z_NOIR_PASSPORT_20_160_3_3_576_200_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_20_160_3_3_576_200_NA"]);
export const Z_NOIR_PASSPORT_20_256_3_5_336_248_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_20_256_3_5_336_248_NA"]);
export const Z_NOIR_PASSPORT_23_160_3_3_576_200_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_23_160_3_3_576_200_NA"]);
export const Z_NOIR_PASSPORT_24_256_3_4_336_248_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_24_256_3_4_336_248_NA"]);

export const Z_NOIR_PASSPORT_11_256_3_5_576_248_1_1808_4_256 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_11_256_3_5_576_248_1_1808_4_256"],
);
export const Z_NOIR_PASSPORT_11_256_3_5_576_264_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_11_256_3_5_576_264_NA"]);
export const Z_NOIR_PASSPORT_11_256_3_5_584_264_1_2136_4_256 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_11_256_3_5_584_264_1_2136_4_256"],
);
export const Z_NOIR_PASSPORT_1_256_3_4_336_232_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_1_256_3_4_336_232_NA"]);
export const Z_NOIR_PASSPORT_2_256_3_4_336_248_22_1496_7_2408 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_2_256_3_4_336_248_22_1496_7_2408"],
);
export const Z_NOIR_PASSPORT_25_384_3_3_336_232_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_25_384_3_3_336_232_NA"]);
export const Z_NOIR_PASSPORT_25_384_3_4_336_264_1_2904_2_256 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_25_384_3_4_336_264_1_2904_2_256"],
);
export const Z_NOIR_PASSPORT_26_512_3_3_336_248_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_26_512_3_3_336_248_NA"]);
export const Z_NOIR_PASSPORT_26_512_3_3_336_264_1_1968_2_256 = keccak256(
  ["string"],
  ["Z_NOIR_PASSPORT_26_512_3_3_336_264_1_1968_2_256"],
);
export const Z_NOIR_PASSPORT_27_512_3_4_336_248_NA = keccak256(["string"], ["Z_NOIR_PASSPORT_27_512_3_4_336_248_NA"]);
