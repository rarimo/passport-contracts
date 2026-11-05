import { ethers } from "ethers";

import { Z_NOIR_PASSPORT_1_256_1_6_960_248_NA } from "@/scripts/utils/types";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (value === undefined || value === "") {
    throw new Error(`${name} is not set`);
  }

  return value;
}

export const treeSize = 80;
export const evidenceDBMaxDepth = 80;

// Final owner of StateKeeper (and therefore of every contract that checks StateKeeper.isOwner)
export const owner = ethers.getAddress(requireEnv("GNOSIS_SAFE_ADDRESS"));

// Same ICAO CSCA master tree as Rarimo L2: StateKeeper 0x61aa5b68D811884dA4FEC2De4a7AA0464df166E1,
// set by tx 0x782f6bb3a399dc88aa498a02691712c94f0e16ec19b750bdc8ea875cbd9c7a9f (2025-07-03).
// All successful Rarimo registerCertificate proofs since then resolve to this root, including CSCA-FRANCE.
export const icaoMasterTreeMerkleRoot = "0x490355b1c9cca56d89c180780c5ea66c1766d57cf22670c7a9a07dc18b835a4f";

export const registrationName = "SecondRegistration";
export const noAaRecoveryName = "NO_AA_RECOVERY";

export const recoveryDelay = 3n * 24n * 60n * 60n; // 3 days
export const recoveryLockDuration = 30n * 24n * 60n * 60n; // 30 days
export const recoveryZkTypes = [Z_NOIR_PASSPORT_1_256_1_6_960_248_NA];
