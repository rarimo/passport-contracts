import { ethers } from "hardhat";

export const C_RSA_4096 = ethers.solidityPackedKeccak256(["string"], ["C_RSA_4096"]);
export const C_RSA_2048 = ethers.solidityPackedKeccak256(["string"], ["C_RSA_2048"]);
export const C_RSAPSS_SHA2_4096 = ethers.solidityPackedKeccak256(["string"], ["C_RSAPSS_SHA2_4096"]);
export const C_RSAPSS_SHA512_4096 = ethers.solidityPackedKeccak256(["string"], ["C_RSAPSS_SHA512_4096"]);

export const P_NO_AA = ethers.solidityPackedKeccak256(["string"], ["P_NO_AA"]);
export const P_RSA_SHA1_2688 = ethers.solidityPackedKeccak256(["string"], ["P_RSA_SHA1_2688"]);
export const P_RSA_SHA1_2688_3 = ethers.solidityPackedKeccak256(["string"], ["P_RSA_SHA1_2688_3"]);
export const P_ECDSA_SHA1_2704 = ethers.solidityPackedKeccak256(["string"], ["P_ECDSA_SHA1_2704"]);

export const Z_UNIVERSAL_4096 = ethers.solidityPackedKeccak256(["string"], ["Z_UNIVERSAL_4096"]);
export const Z_UNIVERSAL_2048 = ethers.solidityPackedKeccak256(["string"], ["Z_UNIVERSAL_2048"]);
export const Z_INTERNAL = ethers.solidityPackedKeccak256(["string"], ["Z_INTERNAL"]);
