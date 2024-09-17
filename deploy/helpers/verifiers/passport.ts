import { Deployer } from "@solarity/hardhat-migrate";

import {
  PUniversal2048Verifier2__factory,
  PUniversal2048V2Verifier2__factory,
  PUniversal4096Verifier2__factory,
  PUniversalPSS2048S32E2Verifier2__factory,
  PUniversalPSS2048S32E17Verifier2__factory,
  PUniversalPSS2048S64E17Verifier2__factory,
  PInternalVerifier2__factory,
  PInternalOptVerifier2__factory,
  PMNEOptVerifier2__factory,
  PMNEOpt2Verifier2__factory,
} from "@ethers-v6";

export const deployPVerifiers = async (deployer: Deployer) => {
  await deployer.deploy(PUniversal2048Verifier2__factory);
  await deployer.deploy(PUniversal2048V2Verifier2__factory);
  await deployer.deploy(PUniversal4096Verifier2__factory);

  await deployer.deploy(PUniversalPSS2048S32E2Verifier2__factory);
  await deployer.deploy(PUniversalPSS2048S32E17Verifier2__factory);
  await deployer.deploy(PUniversalPSS2048S64E17Verifier2__factory);

  await deployer.deploy(PInternalVerifier2__factory);
  await deployer.deploy(PInternalOptVerifier2__factory);

  await deployer.deploy(PMNEOptVerifier2__factory);
  await deployer.deploy(PMNEOpt2Verifier2__factory);
};
