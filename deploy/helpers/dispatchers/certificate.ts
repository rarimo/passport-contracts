import { Deployer } from "@solarity/hardhat-migrate";

import { CRSAPSSSigner__factory, CRSADispatcher__factory, CRSASigner__factory } from "@ethers-v6";

export const deployCRSADispatcher = async (
  deployer: Deployer,
  hashFunc: "SHA1" | "SHA2",
  exponent: string,
  keyLength: string,
  keyPrefix: string,
) => {
  const signer = await deployRSASigner(deployer, hashFunc, exponent, keyLength);

  const dispatcher = await deployer.deploy(CRSADispatcher__factory, {
    name: `CRSADispatcher ${hashFunc} ${keyLength}`,
  });

  await dispatcher.__CRSADispatcher_init(await signer.getAddress(), keyLength, keyPrefix);
};

export const deployCRSAPSSDispatcher = async (
  deployer: Deployer,
  hashFunc: "SHA2" | "SHA512",
  exponent: string,
  keyLength: string,
  keyPrefix: string,
) => {
  const signer = await deployRSAPSSSigner(deployer, hashFunc, exponent, keyLength);

  const dispatcher = await deployer.deploy(CRSADispatcher__factory, {
    name: `CRSAPSSDispatcher ${hashFunc} ${keyLength}`,
  });

  await dispatcher.__CRSADispatcher_init(await signer.getAddress(), keyLength, keyPrefix);
};

const deployRSASigner = async (deployer: Deployer, hashfunc: string, exponent: string, keyLength: string) => {
  const signer = await deployer.deploy(CRSASigner__factory, {
    name: `CRSASigner ${hashfunc} ${exponent} ${keyLength}`,
  });

  await signer.__CRSASigner_init(exponent, hashfunc === "SHA1");

  return signer;
};

const deployRSAPSSSigner = async (deployer: Deployer, hashfunc: string, exponent: string, keyLength: string) => {
  const signer = await deployer.deploy(CRSAPSSSigner__factory, {
    name: `CRSAPSSSigner ${hashfunc} ${exponent} ${keyLength}`,
  });

  await signer.__CRSAPSSSigner_init(exponent, hashfunc === "SHA2");

  return signer;
};
