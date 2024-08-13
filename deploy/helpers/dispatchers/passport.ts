import { Deployer } from "@solarity/hardhat-migrate";

import {
  PECDSASHA1Authenticator__factory,
  PECDSASHA1Dispatcher__factory,
  PNOAADispatcher__factory,
  PRSASHA1Authenticator__factory,
  PRSASHA1Dispatcher__factory,
} from "@ethers-v6";

export const deployPNOAADispatcher = async (deployer: Deployer) => {
  const dispatcher = await deployer.deploy(PNOAADispatcher__factory);

  await dispatcher.__PNOAADispatcher_init();
};

export const deployPRSASHA12688Dispatcher = async (deployer: Deployer, exponent: string) => {
  const authenticator = await deployer.deploy(PRSASHA1Authenticator__factory, {
    name: `PRSASHA1Authenticator ${exponent}`,
  });
  const dispatcher = await deployer.deploy(PRSASHA1Dispatcher__factory, {
    name: `PRSASHA1Dispatcher ${exponent}`,
  });

  await authenticator.__PRSASHA1Authenticator_init(exponent);
  await dispatcher.__PRSASHA1Dispatcher_init(await authenticator.getAddress());
};

export const deployPECDSASHA12704Dispatcher = async (deployer: Deployer) => {
  const authenticator = await deployer.deploy(PECDSASHA1Authenticator__factory);
  const dispatcher = await deployer.deploy(PECDSASHA1Dispatcher__factory);

  await dispatcher.__PECDSASHA1Dispatcher_init(await authenticator.getAddress());
};
