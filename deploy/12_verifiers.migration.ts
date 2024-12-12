import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import {
  RegisterIdentityLight160Verifier__factory,
  RegisterIdentityLight224Verifier__factory,
  RegisterIdentityLight256Verifier__factory,
  RegisterIdentityLight384Verifier__factory,
  RegisterIdentityLight512Verifier__factory,
  RegistrationSimple__factory,
} from "@/generated-types/ethers";

import { deployProxy } from "@/deploy/helpers";
import { getConfig } from "@/deploy/config/config";

export = async (deployer: Deployer) => {
  const registration1 = await deployer.deploy(RegisterIdentityLight160Verifier__factory);
  const registration2 = await deployer.deploy(RegisterIdentityLight224Verifier__factory);
  const registration3 = await deployer.deploy(RegisterIdentityLight256Verifier__factory);
  const registration4 = await deployer.deploy(RegisterIdentityLight384Verifier__factory);
  const registration5 = await deployer.deploy(RegisterIdentityLight512Verifier__factory);

  const config = (await getConfig())!;

  // TODO: delete after mainnet deployment
  const registrationSimple = await deployProxy(deployer, RegistrationSimple__factory, "RegistrationSimple");
  await registrationSimple.__RegistrationSimple_init(config.tssSigner, config.chainName, config.stateKeeper);

  Reporter.reportContracts(
    ["RegistrationSimple", `${await registrationSimple.getAddress()}`],
    ["RegisterIdentityLight160Verifier", `${await registration1.getAddress()}`],
    ["RegisterIdentityLight224Verifier", `${await registration2.getAddress()}`],
    ["RegisterIdentityLight256Verifier", `${await registration3.getAddress()}`],
    ["RegisterIdentityLight384Verifier", `${await registration4.getAddress()}`],
    ["RegisterIdentityLight512Verifier", `${await registration5.getAddress()}`],
  );
};
