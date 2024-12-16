import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import {
  RegisterIdentityLight160Verifier__factory,
  RegisterIdentityLight224Verifier__factory,
  RegisterIdentityLight256Verifier__factory,
  RegisterIdentityLight384Verifier__factory,
  RegisterIdentityLight512Verifier__factory,
} from "@/generated-types/ethers";

export = async (deployer: Deployer) => {
  const identityLight160Verifier = await deployer.deploy(RegisterIdentityLight160Verifier__factory);
  const identityLight224Verifier = await deployer.deploy(RegisterIdentityLight224Verifier__factory);
  const identityLight256Verifier = await deployer.deploy(RegisterIdentityLight256Verifier__factory);
  const identityLight384Verifier = await deployer.deploy(RegisterIdentityLight384Verifier__factory);
  const identityLight512Verifier = await deployer.deploy(RegisterIdentityLight512Verifier__factory);

  Reporter.reportContracts(
    ["RegisterIdentityLight160Verifier", `${await identityLight160Verifier.getAddress()}`],
    ["RegisterIdentityLight224Verifier", `${await identityLight224Verifier.getAddress()}`],
    ["RegisterIdentityLight256Verifier", `${await identityLight256Verifier.getAddress()}`],
    ["RegisterIdentityLight384Verifier", `${await identityLight384Verifier.getAddress()}`],
    ["RegisterIdentityLight512Verifier", `${await identityLight512Verifier.getAddress()}`],
  );
};
