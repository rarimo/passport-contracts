import { ethers } from "hardhat";

export const RSA_SHA1_2688 = ethers.solidityPackedKeccak256(["string"], ["RSA_SHA1_2688"]);
export const ECDSA_SHA1_2704 = ethers.solidityPackedKeccak256(["string"], ["ECDSA_SHA1_2704"]);
