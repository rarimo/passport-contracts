import { ethers } from "hardhat";

import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import {
  PUKRECDSABrainpool256Verifier2__factory,
  PUniversal2048V3Verifier2__factory,
  Registration2Mock__factory,
} from "@ethers-v6";

import {
  C_RSA_SHA1_2048,
  C_RSA_SHA2_2048,
  C_RSA_SHA1_4096,
  C_RSA_SHA2_4096,
  C_RSAPSS_SHA2_2048,
  C_RSAPSS_SHA2_4096,
  C_RSAPSS_SHA512_2048,
  C_RSAPSS_SHA512_4096,
  P_ECDSA_SHA1_2704,
  P_NO_AA,
  P_RSA_SHA1_2688,
  P_RSA_SHA1_2688_3,
  P_RSA_SHA2_2688,
  P_RSA_SHA2_2688_3,
  Z_UNIVERSAL_2048,
  Z_UNIVERSAL_2048_V2,
  Z_UNIVERSAL_2048_V3,
  Z_UNIVERSAL_4096,
  Z_UNIVERSAL_PSS_2048_S32_E2,
  Z_UNIVERSAL_PSS_2048_S32_E17,
  Z_UNIVERSAL_PSS_2048_S64_E17,
  Z_UKR_ECDSA_BRAINPOOL_256,
  Z_INTERNAL,
  Z_INTERNAL_OPT,
  Z_MNE_OPT,
  Z_MNE_OPT_2,
} from "@/scripts/utils/types";

import { getConfig } from "./config/config";

export = async (deployer: Deployer) => {
  const registration = await deployer.deployed(
    Registration2Mock__factory,
    "0x1b0F076c8800c457CE734BA85aC8569284DD640A",
  );

  const v1 = await deployer.deploy(PUniversal2048V3Verifier2__factory);
  const v2 = await deployer.deploy(PUKRECDSABrainpool256Verifier2__factory);

  const coder = ethers.AbiCoder.defaultAbiCoder();

  let data = coder.encode(["bytes32", "address"], [Z_UNIVERSAL_2048_V3, await v1.getAddress()]);

  await registration.updateDependency(5, data, "0x");

  data = coder.encode(["bytes32", "address"], [Z_UKR_ECDSA_BRAINPOOL_256, await v2.getAddress()]);

  await registration.updateDependency(5, data, "0x");
};
