import { Deployer } from "@solarity/hardhat-migrate";

import {
  PInternalVerifier2__factory,
  PUniversal2048Verifier2__factory,
  PUniversal4096Verifier2__factory,
} from "@ethers-v6";

export const deployPVerifiers = async (deployer: Deployer) => {
  await deployer.deploy(PUniversal2048Verifier2__factory);
  await deployer.deploy(PUniversal4096Verifier2__factory);
  await deployer.deploy(PInternalVerifier2__factory);
};
