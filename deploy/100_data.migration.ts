import { AddressLike, ethers } from "ethers";

import { Deployer } from "@solarity/hardhat-migrate";

import {
  RegisterIdentityLight160Verifier__factory,
  RegisterIdentityLight224Verifier__factory,
  RegisterIdentityLight256Verifier__factory,
  RegisterIdentityLight384Verifier__factory,
  RegisterIdentityLight512Verifier__factory,
  Registration2Mock__factory,
  RegistrationSimple,
  RegistrationSimple__factory,
  StateKeeperMock__factory,
} from "@ethers-v6";

import {
  processRegistration,
  processRegistration2,
  processSimpleRegistration,
} from "@/scripts/migration/process-transactions";
import {
  CertificateData,
  CertificateDataWithBlockNumber,
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

  const simpleRegistrationData: RegistrationData_R3[] = await processSimpleRegistration();
  const registrationData: {
    users: Record<string, RegistrationData_R1>;
    certificates: CertificateDataWithBlockNumber[];
  } = await processRegistration();
  const registrationData2: {
    users: Record<string, RegistrationData_R2>;
    certificates: CertificateDataWithBlockNumber[];
  } = await processRegistration2();

  const stateKeeper = await deployer.deployed(StateKeeperMock__factory, "StateKeeper Proxy");
  const registration2 = await deployer.deployed(Registration2Mock__factory, "Registration2 Proxy");

  const allCertificates: CertificateData[] = registrationData.certificates
    .concat(registrationData2.certificates)
    .sort((a, b) => a.blockNumber - b.blockNumber)
    .map((certificate) => certificate.data);

  const registration2Address = await registration2.getAddress();
  for (const certificate of allCertificates) {
    await stateKeeper.mockAddCertificate(certificate.certificate_, registration2Address);
  }

  for (const user of Object.values(registrationData2.users)) {
    await registration2.register(
      user.certificatesRoot_,
      user.identityKey_,
      user.dgCommit_,
      user.passport_,
      user.zkPoints_,
    );
  }

  for (const user of Object.values(registrationData.users)) {
    await registration2.registerDep(user.certificatesRoot_, user.identityKey_, user.dgCommit_, {
      dataType: user.passport_.dataType,
      zkType: user.passport_.zkType,
      signature: user.passport_.signature,
      publicKey: user.passport_.publicKey,
      passportHash: ethers.ZeroHash,
    });
  }

  const registrationSimple = await deployer.deployed(RegistrationSimple__factory, "RegistrationSimple Proxy");

  for (const data of simpleRegistrationData) {
    const verifier = await getCorrectVerifier(deployer, data.passport_.verifier);
    data.passport_.verifier = await verifier.getAddress();

    const signature = await getSimpleSignature(signer as any, data.passport_, registrationSimple);

    await registrationSimple.registerSimple(data.identityKey_, data.passport_, signature, data.zkPoints_);
  }
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
