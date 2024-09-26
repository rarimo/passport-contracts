import { Deployer } from "@solarity/hardhat-migrate";

import {
  PECDSASHA1Authenticator__factory,
  PECDSASHA1Dispatcher__factory,
  PNOAADispatcher__factory,
  PRSASHAAuthenticator__factory,
  PRSASHADispatcher__factory,
} from "@ethers-v6";

export const deployPNOAADispatcher = async (deployer: Deployer) => {
  const dispatcher = await deployer.deploy(PNOAADispatcher__factory);

  await dispatcher.__PNOAADispatcher_init();
};

export const deployPRSASHA2688Dispatcher = async (deployer: Deployer, exponent: string, hashFunc: "SHA1" | "SHA2") => {
  const authenticator = await deployer.deploy(PRSASHAAuthenticator__factory, {
    name: `PRSASHAAuthenticator ${exponent} ${hashFunc}`,
  });
  const dispatcher = await deployer.deploy(PRSASHADispatcher__factory, {
    name: `PRSASHADispatcher ${exponent} ${hashFunc}`,
  });

  await authenticator.__PRSASHAAuthenticator_init(exponent, hashFunc === "SHA1");
  await dispatcher.__PRSASHADispatcher_init(await authenticator.getAddress());
};

export const deployPECDSASHA12704Dispatcher = async (deployer: Deployer) => {
  const authenticator = await deployer.deploy(PECDSASHA1Authenticator__factory);
  const dispatcher = await deployer.deploy(PECDSASHA1Dispatcher__factory);

  await dispatcher.__PECDSASHA1Dispatcher_init(await authenticator.getAddress());
};
