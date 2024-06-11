import { ethers } from "hardhat";

export const C_RSA = ethers.solidityPackedKeccak256(["string"], ["C_RSA"]);

export const P_RSA_SHA1_2688 = ethers.solidityPackedKeccak256(["string"], ["P_RSA_SHA1_2688"]);
export const P_ECDSA_SHA1_2704 = ethers.solidityPackedKeccak256(["string"], ["P_ECDSA_SHA1_2704"]);
