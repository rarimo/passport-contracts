import { Registration2__factory, Registration__factory, RegistrationSimple__factory } from "@ethers-v6";

import {
  REGISTRATION_2_ADDRESS,
  REGISTRATION_ADDRESS,
  REGISTRATION_SIMPLE_ADDRESS,
} from "@/scripts/migration/constants";
import { getRegistrationTransactionInfos } from "@/scripts/migration/explorer";

import { RegistrationSimpleInterface } from "@/generated-types/ethers/contracts/registration/RegistrationSimple";
import {
  CertificateDataWithBlockNumber,
  parseCertificate,
  parseResultR1,
  parseResultR2,
  parseResultR3,
  RegistrationData_R1,
  RegistrationData_R2,
  RegistrationData_R3,
} from "@/scripts/migration/dto";
import assert from "node:assert";
import { ethers } from "ethers";

export async function processSimpleRegistration(): Promise<RegistrationData_R3[]> {
  const registrationInterface = RegistrationSimple__factory.createInterface();

  let txData = await getRegistrationTransactionInfos(REGISTRATION_SIMPLE_ADDRESS);

  txData.sort((a, b) => a.blockNumber - b.blockNumber);

  let users: RegistrationData_R3[] = [];

  txData.forEach((tx) => {
    try {
      let data = parseResultR3(registrationInterface.decodeFunctionData("registerSimple", tx.data));

      users.push(data);
    } catch {
      tryParseUpdateSignerList(registrationInterface, tx.data);
    }
  });

  return users;
}

function tryParseUpdateSignerList(registrationInterface: RegistrationSimpleInterface, data: string) {
  try {
    console.log("Update signer list data: ", registrationInterface.decodeFunctionData("updateSignerList", data));
  } catch {}
}

export async function processRegistration(): Promise<{
  users: Record<string, RegistrationData_R1>;
  certificates: CertificateDataWithBlockNumber[];
}> {
  const registrationInterface = Registration__factory.createInterface();

  let txData = await getRegistrationTransactionInfos(REGISTRATION_ADDRESS);

  txData.sort((a, b) => a.blockNumber - b.blockNumber);

  let users: Record<string, RegistrationData_R1> = {};
  let certificates: CertificateDataWithBlockNumber[] = [];

  txData.forEach((tx) => {
    try {
      let data: RegistrationData_R1 = parseResultR1(registrationInterface.decodeFunctionData("register", tx.data));

      users[ethers.hexlify(data.passport_.publicKey)] = data;
    } catch {}

    try {
      let data = parseResultR1(registrationInterface.decodeFunctionData("reissueIdentity", tx.data));

      assert(users[ethers.hexlify(data.passport_.publicKey)], "User not found");

      users[ethers.hexlify(data.passport_.publicKey)] = data;
    } catch {}

    try {
      registrationInterface.decodeFunctionData("revokeCertificate", tx.data);

      console.log(`Found certificate revocation: ${tx.blockNumber}`);
    } catch {}

    try {
      let data = parseCertificate(registrationInterface.decodeFunctionData("registerCertificate", tx.data));

      certificates.push({ data, blockNumber: tx.blockNumber });
    } catch {}
  });

  return { users, certificates };
}

export async function processRegistration2(): Promise<{
  users: Record<string, RegistrationData_R2>;
  certificates: CertificateDataWithBlockNumber[];
}> {
  const registrationInterface = Registration2__factory.createInterface();

  let txData = await getRegistrationTransactionInfos(REGISTRATION_2_ADDRESS);

  txData.sort((a, b) => a.blockNumber - b.blockNumber);

  let users: Record<string, RegistrationData_R2> = {};
  let certificates: CertificateDataWithBlockNumber[] = [];

  txData.forEach((tx) => {
    try {
      let data: RegistrationData_R2 = parseResultR2(registrationInterface.decodeFunctionData("register", tx.data));

      users[data.passport_.passportHash] = data;
    } catch (e) {}

    try {
      let data: RegistrationData_R2 = parseResultR2(
        registrationInterface.decodeFunctionData("reissueIdentity", tx.data),
      );

      assert(users[data.passport_.passportHash], "User not found");

      users[data.passport_.passportHash] = data;
    } catch {}

    try {
      registrationInterface.decodeFunctionData("revokeCertificate", tx.data);

      console.log(`Found certificate revocation: ${tx.blockNumber}`);
    } catch {}

    try {
      let data = parseCertificate(registrationInterface.decodeFunctionData("registerCertificate", tx.data));

      certificates.push({ data, blockNumber: tx.blockNumber });
    } catch {}
  });

  return { users, certificates };
}
