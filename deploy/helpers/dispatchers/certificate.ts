import { Deployer } from "@solarity/hardhat-migrate";

import { BaseContract } from "ethers";

import { CRSAPSSSigner__factory, CRSADispatcher__factory, CRSASHA2Signer__factory } from "@ethers-v6";

export const deployCRSADispatcher = async (
  deployer: Deployer,
  exponent: string,
  keyLength: string,
  keyPrefix: string,
) => {
  const signer = await deployer.deploy(CRSASHA2Signer__factory, { name: `CRSASHA2Signer ${exponent} ${keyLength}` });

  await signer.__CRSASHA2Signer_init(exponent);

  await deployCDispatcher(deployer, signer, keyLength, keyPrefix, "CRSADispatcher");
};

export const deployCRSAPSSDispatcher = async (
  deployer: Deployer,
  exponent: string,
  keyLength: string,
  keyPrefix: string,
) => {
  const signerSha2 = await deployRSAPSSSigner(deployer, exponent, keyLength, true);
  const signerSha512 = await deployRSAPSSSigner(deployer, exponent, keyLength, false);

  await deployCDispatcher(deployer, signerSha2, keyLength, keyPrefix, "CRSAPSSDispatcher SHA2");
  await deployCDispatcher(deployer, signerSha512, keyLength, keyPrefix, "CRSAPSSDispatcher SHA512");
};

const deployCDispatcher = async (
  deployer: Deployer,
  signer: BaseContract,
  keyLength: string,
  keyPrefix: string,
  name: string,
) => {
  const dispatcher = await deployer.deploy(CRSADispatcher__factory, { name: `${name} ${keyLength}` });

  await dispatcher.__CRSADispatcher_init(await signer.getAddress(), keyLength, keyPrefix);
};

const deployRSAPSSSigner = async (deployer: Deployer, exponent: string, keyLength: string, isSha2: boolean) => {
  const signer = await deployer.deploy(CRSAPSSSigner__factory, {
    name: `CRSAPSSSigner ${isSha2 ? "SHA2" : "SHA512"} ${exponent} ${keyLength}`,
  });

  await signer.__CRSAPSSSigner_init(exponent, isSha2);

  return signer;
};
