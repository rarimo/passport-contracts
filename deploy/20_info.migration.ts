import { Deployer, Reporter } from "@solarity/hardhat-migrate";

import {
  PoseidonSMT__factory,
  RegisterIdentityLight160Verifier__factory,
  RegisterIdentityLight224Verifier__factory,
  RegisterIdentityLight256Verifier__factory,
  RegisterIdentityLight384Verifier__factory,
  RegisterIdentityLight512Verifier__factory,
  Registration2Mock__factory,
  RegistrationSimple__factory,
  StateKeeperMock__factory,
} from "@ethers-v6";

export = async (deployer: Deployer) => {
  const registrationSmt = await deployer.deployed(PoseidonSMT__factory, "RegistrationSMT");
  const certificatesSmt = await deployer.deployed(PoseidonSMT__factory, "CertificatesSMT");

  const stateKeeper = await deployer.deployed(StateKeeperMock__factory, "StateKeeper Proxy");
  const registration = await deployer.deployed(Registration2Mock__factory, "Registration2 Proxy");
  const registrationSimple = await deployer.deployed(RegistrationSimple__factory, "RegistrationSimple Proxy");

  const identityLight160Verifier = await deployer.deployed(RegisterIdentityLight160Verifier__factory);
  const identityLight224Verifier = await deployer.deployed(RegisterIdentityLight224Verifier__factory);
  const identityLight256Verifier = await deployer.deployed(RegisterIdentityLight256Verifier__factory);
  const identityLight384Verifier = await deployer.deployed(RegisterIdentityLight384Verifier__factory);
  const identityLight512Verifier = await deployer.deployed(RegisterIdentityLight512Verifier__factory);

  Reporter.reportContracts(
    ["StateKeeper", `${await stateKeeper.getAddress()}`],
    ["RegistrationSMT", `${await registrationSmt.getAddress()}`],
    ["CertificatesSMT", `${await certificatesSmt.getAddress()}`],
    ["Registration2", `${await registration.getAddress()}`],
    ["RegistrationSimple", `${await registrationSimple.getAddress()}`],
    ["RegisterIdentityLight160Verifier", `${await identityLight160Verifier.getAddress()}`],
    ["RegisterIdentityLight224Verifier", `${await identityLight224Verifier.getAddress()}`],
    ["RegisterIdentityLight256Verifier", `${await identityLight256Verifier.getAddress()}`],
    ["RegisterIdentityLight384Verifier", `${await identityLight384Verifier.getAddress()}`],
    ["RegisterIdentityLight512Verifier", `${await identityLight512Verifier.getAddress()}`],
  );
};
