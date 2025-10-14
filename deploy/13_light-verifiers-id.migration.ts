import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import {
  RegisterIdentityLightID160Verifier__factory,
  RegisterIdentityLightID224Verifier__factory,
  RegisterIdentityLightID256Verifier__factory,
  RegisterIdentityLightID384Verifier__factory,
  RegisterIdentityLightID512Verifier__factory,
} from "@/generated-types/ethers";

export = async (deployer: Deployer) => {
  const identityLight160Verifier = await deployer.deploy(RegisterIdentityLightID160Verifier__factory);
  const identityLight224Verifier = await deployer.deploy(RegisterIdentityLightID224Verifier__factory);
  const identityLight256Verifier = await deployer.deploy(RegisterIdentityLightID256Verifier__factory);
  const identityLight384Verifier = await deployer.deploy(RegisterIdentityLightID384Verifier__factory);
  const identityLight512Verifier = await deployer.deploy(RegisterIdentityLightID512Verifier__factory);

  Reporter.reportContracts(
    ["RegisterIdentityLightID160Verifier", `${await identityLight160Verifier.getAddress()}`],
    ["RegisterIdentityLightID224Verifier", `${await identityLight224Verifier.getAddress()}`],
    ["RegisterIdentityLightID256Verifier", `${await identityLight256Verifier.getAddress()}`],
    ["RegisterIdentityLightID384Verifier", `${await identityLight384Verifier.getAddress()}`],
    ["RegisterIdentityLightID512Verifier", `${await identityLight512Verifier.getAddress()}`],
  );
};
