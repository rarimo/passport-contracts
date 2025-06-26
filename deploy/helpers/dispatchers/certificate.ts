import { Deployer } from "@solarity/hardhat-migrate";

import {
  CECDSA256Signer__factory,
  CECDSA384Signer,
  CECDSA384Signer__factory,
  CECDSA512Signer,
  CECDSA512Signer__factory,
  CECDSADispatcher__factory,
  CRSADispatcher__factory,
  CRSAPSSSigner__factory,
  CRSASigner__factory,
} from "@ethers-v6";

export const deployCRSADispatcher = async (
  deployer: Deployer,
  hashFunc: "SHA1" | "SHA2" | "SHA512",
  exponent: string,
  keyLength: string,
  keyPrefix: string,
) => {
  const signer = await deployRSASigner(deployer, hashFunc, exponent, keyLength);

  const dispatcher = await deployer.deploy(CRSADispatcher__factory, {
    name: `CRSADispatcher ${hashFunc} ${keyLength} ${exponent}`,
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
    name: `CRSAPSSDispatcher ${hashFunc} ${exponent} ${keyLength} ${keyPrefix}`,
  });

  await dispatcher.__CRSADispatcher_init(await signer.getAddress(), keyLength, keyPrefix);
};

export const deployCECDSADispatcher = async (
  deployer: Deployer,
  curve: "SECP256" | "SECP384" | "brainpoolP384r1" | "brainpoolP512r1",
  hashFunc: "SHA1" | "SHA2" | "SHA384" | "SHA512",
  keyLength: "64" | "96" | "128",
  keyPrefix: string,
) => {
  let signer: CECDSA384Signer | CECDSA512Signer;

  if (curve == "brainpoolP512r1") {
    signer = await deployECDSA512Signer(deployer, keyLength);
  } else if (curve == "SECP256") {
    signer = await deployECDSA256Signer(deployer, keyLength);
  } else {
    signer = await deployECDSA384Signer(deployer, curve, hashFunc, keyLength);
  }

  const dispatcher = await deployer.deploy(CECDSADispatcher__factory, {
    name: `CECDSADispatcher ${curve} ${hashFunc} ${keyLength}`,
  });

  await dispatcher.__CECDSADispatcher_init(await signer.getAddress(), keyLength, keyPrefix);
};

const deployRSASigner = async (deployer: Deployer, hashfunc: string, exponent: string, keyLength: string) => {
  const signer = await deployer.deploy(CRSASigner__factory, {
    name: `CRSASigner ${hashfunc} ${exponent} ${keyLength}`,
  });

  let hf;

  if (hashfunc === "SHA1") {
    hf = 0;
  } else if (hashfunc === "SHA2") {
    hf = 1;
  } else {
    hf = 2;
  }

  await signer.__CRSASigner_init(exponent, hf);

  return signer;
};

const deployRSAPSSSigner = async (deployer: Deployer, hashfunc: string, exponent: string, keyLength: string) => {
  try {
    const result = await deployer.deployed(
      CRSAPSSSigner__factory,
      `CRSAPSSSigner ${hashfunc} ${exponent} ${keyLength}`,
    );
    return result;
  } catch {}

  const signer = await deployer.deploy(CRSAPSSSigner__factory, {
    name: `CRSAPSSSigner ${hashfunc} ${exponent} ${keyLength}`,
  });

  let hf;

  if (hashfunc === "SHA2") {
    hf = 0;
  } else {
    hf = 1;
  }

  await signer.__CRSAPSSSigner_init(exponent, hf);

  return signer;
};

const deployECDSA384Signer = async (deployer: Deployer, curve: string, hashfunc: string, keyLength: string) => {
  const signer = await deployer.deploy(CECDSA384Signer__factory, {
    name: `CESDCA384Signer ${curve} ${hashfunc} ${keyLength}`,
  });

  let hf;
  let curv;

  if (curve === "SECP384") {
    curv = 0;
  } else {
    curv = 1;
  }

  if (hashfunc === "SHA2") {
    hf = 0;
  } else {
    hf = 1;
  }

  await signer.__CECDSA384Signer_init(curv, hf);

  return signer;
};

const deployECDSA256Signer = async (deployer: Deployer, keyLength: string) => {
  const signer = await deployer.deploy(CECDSA256Signer__factory, {
    name: `CESDCA256Signer ${keyLength}`,
  });

  return signer;
};

const deployECDSA512Signer = async (deployer: Deployer, keyLength: string) => {
  const signer = await deployer.deploy(CECDSA512Signer__factory, {
    name: `CESDCA512Signer ${keyLength}`,
  });

  return signer;
};
