import { AddressLike, ethers } from "ethers";

import { Deployer } from "@solarity/hardhat-migrate";

import {
  RegisterIdentityLight160Verifier__factory,
  RegisterIdentityLight224Verifier__factory,
  RegisterIdentityLight256Verifier__factory,
  RegisterIdentityLight384Verifier__factory,
  RegisterIdentityLight512Verifier__factory,
  Registration2__factory,
  RegistrationSimple,
  RegistrationSimple__factory,
  StateKeeper__factory,
} from "@ethers-v6";

import {
  processRegistration,
  processRegistration2,
  processSimpleRegistration,
} from "@/scripts/migration/process-transactions";
import {
  CertificateData,
  RegistrationData_R1,
  RegistrationData_R2,
  RegistrationData_R3,
} from "@/scripts/migration/dto";

async function getCorrectVerifier(deployer: Deployer, address: AddressLike) {
  if ("0x753a8678c85d5fb70A97CFaE37c84CE2fD67EDE8" === address) {
    return await deployer.deployed(RegisterIdentityLight160Verifier__factory);
  }

  if ("0x703cEA18c544c8b465Cd74db2C941C3Ea806261D" === address) {
    return await deployer.deployed(RegisterIdentityLight224Verifier__factory);
  }

  if ("0x9F02a040c35A683f2468411a2f1a1C9Fe3D439Db" === address) {
    return await deployer.deployed(RegisterIdentityLight256Verifier__factory);
  }

  if ("0x95115030A11561348f6e49eC08C26E0D8358D602" === address) {
    return await deployer.deployed(RegisterIdentityLight384Verifier__factory);
  }

  if ("0xAd5524a3977A854442CB9d6ef12881Ca2613d758" === address) {
    return await deployer.deployed(RegisterIdentityLight512Verifier__factory);
  }

  throw new Error("Unknown verifier address");
}

export = async (deployer: Deployer) => {
  const signer = await deployer.getSigner();

  // const simpleRegistrationData: RegistrationData_R3[] = await processSimpleRegistration();
  // const registrationData: { users: Record<string, RegistrationData_R1>; certificates: CertificateData[] } =
  //   await processRegistration();
  const registrationData2: { users: Record<string, RegistrationData_R2>; certificates: CertificateData[] } =
    await processRegistration2();

  const registration2 = await deployer.deployed(Registration2__factory, "Registration2");

  for (const certificate of registrationData2.certificates) {
    console.log("Registering certificate", certificate.certificate_);
    await registration2.registerCertificate(
      certificate.certificate_,
      certificate.icaoMember_,
      certificate.icaoMerkleProof_,
    );
  }

  // const simpleRegistration = await deployer.deployed(
  //   RegistrationSimple__factory,
  //   "RegistrationSimple",
  // );
  //
  // for (const data of simpleRegistrationData) {
  //   const verifier = await getCorrectVerifier(deployer, data.passport_.verifier);
  //   data.passport_.verifier = await verifier.getAddress();
  //
  //   const signature = await getSimpleSignature(signer as any, data.passport_, simpleRegistration);
  //
  //   await simpleRegistration.registerSimple(data.identityKey_, data.passport_, signature, data.zkPoints_);
  // }
};

async function getSimpleSignature(
  signer: any,
  passportData: RegistrationSimple.PassportStruct,
  registrationSimple: RegistrationSimple,
) {
  const message = ethers.solidityPackedKeccak256(
    ["string", "address", "bytes32", "bytes32", "bytes32", "address"],
    [
      await registrationSimple.REGISTRATION_SIMPLE_PREFIX(),
      await registrationSimple.getAddress(),
      passportData.passportHash,
      ethers.toBeHex(passportData.dgCommit),
      passportData.publicKey,
      passportData.verifier,
    ],
  );

  return signer.provider?.send("eth_sign", [await signer.getAddress(), message]);
}
