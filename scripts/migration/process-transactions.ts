import { ethers } from "ethers";

import assert from "node:assert";

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

export async function processSimpleRegistration(): Promise<{
  users: RegistrationData_R3[];
  allData: Record<string, { count: number; blockNumbers: number[] }>;
}> {
  const registrationInterface = RegistrationSimple__factory.createInterface();

  let txData = await getRegistrationTransactionInfos(REGISTRATION_SIMPLE_ADDRESS);

  txData.sort((a, b) => a.blockNumber - b.blockNumber);

  let users: RegistrationData_R3[] = [];
  let allData: Record<string, { count: number; blockNumbers: number[] }> = {};

  txData.forEach((tx) => {
    try {
      let data = parseResultR3(registrationInterface.decodeFunctionData("registerSimple", tx.data));

      users.push(data);

      if (!allData["registerSimple"]) {
        allData["registerSimple"] = { count: 0, blockNumbers: [] };
      }

      allData["registerSimple"].count++;
      allData["registerSimple"].blockNumbers.push(tx.blockNumber);
    } catch {
      tryParseUpdateSignerList(registrationInterface, tx.data);

      const selector = tx.data.slice(2, 10);

      if (!allData[selector]) {
        allData[selector] = { count: 0, blockNumbers: [] };
      }

      allData[selector].count++;
      allData[selector].blockNumbers.push(tx.blockNumber);
    }
  });

  return { users, allData };
}

function tryParseUpdateSignerList(registrationInterface: RegistrationSimpleInterface, data: string) {
  try {
    console.log("Update signer list data: ", registrationInterface.decodeFunctionData("updateSignerList", data));
  } catch {}
}

export async function processRegistration(): Promise<{
  users: Record<string, RegistrationData_R1>;
  certificates: CertificateDataWithBlockNumber[];
  allData: Record<string, { count: number; blockNumbers: number[] }>;
}> {
  const registrationInterface = Registration__factory.createInterface();

  let txData = await getRegistrationTransactionInfos(REGISTRATION_ADDRESS);

  txData.sort((a, b) => a.blockNumber - b.blockNumber);

  let users: Record<string, RegistrationData_R1> = {};
  let certificates: CertificateDataWithBlockNumber[] = [];
  let allData: Record<string, { count: number; blockNumbers: number[] }> = {};

  for (const tx of txData) {
    try {
      let data: RegistrationData_R1 = parseResultR1(registrationInterface.decodeFunctionData("register", tx.data));

      users[ethers.hexlify(data.passport_.publicKey)] = data;

      if (!allData["register"]) {
        allData["register"] = { count: 0, blockNumbers: [] };
      }

      allData["register"].count++;
      allData["register"].blockNumbers.push(tx.blockNumber);

      continue;
    } catch {}

    try {
      registrationInterface.decodeFunctionData("revoke", tx.data);

      if (!allData["revoke"]) {
        allData["revoke"] = { count: 0, blockNumbers: [] };
      }

      allData["revoke"].count++;
      allData["revoke"].blockNumbers.push(tx.blockNumber);

      continue;
    } catch {}

    try {
      let data = parseResultR1(registrationInterface.decodeFunctionData("reissueIdentity", tx.data));

      assert(users[ethers.hexlify(data.passport_.publicKey)], "User not found");

      users[ethers.hexlify(data.passport_.publicKey)] = data;

      if (!allData["reissueIdentity"]) {
        allData["reissueIdentity"] = { count: 0, blockNumbers: [] };
      }

      allData["reissueIdentity"].count++;
      allData["reissueIdentity"].blockNumbers.push(tx.blockNumber);

      continue;
    } catch {}

    try {
      registrationInterface.decodeFunctionData("revokeCertificate", tx.data);

      console.log(`Found certificate revocation: ${tx.blockNumber}`);

      if (!allData["revokeCertificate"]) {
        allData["revokeCertificate"] = { count: 0, blockNumbers: [] };
      }

      allData["revokeCertificate"].count++;
      allData["revokeCertificate"].blockNumbers.push(tx.blockNumber);

      continue;
    } catch {}

    try {
      let data = parseCertificate(registrationInterface.decodeFunctionData("registerCertificate", tx.data));

      certificates.push({ data, blockNumber: tx.blockNumber });

      if (!allData["registerCertificate"]) {
        allData["registerCertificate"] = { count: 0, blockNumbers: [] };
      }

      allData["registerCertificate"].count++;
      allData["registerCertificate"].blockNumbers.push(tx.blockNumber);
    } catch {
      const selector = tx.data.slice(2, 10);

      if (selector === "f4e78604") {
        if (!allData["updateDep"]) {
          allData["updateDep"] = { count: 0, blockNumbers: [] };
        }

        allData["updateDep"].count++;
        allData["updateDep"].blockNumbers.push(tx.blockNumber);

        continue;
      }

      // upgradeToWithProof
      if (selector === "628543ab") {
        if (!allData["upgradeToWithProof"]) {
          allData["upgradeToWithProof"] = { count: 0, blockNumbers: [] };
        }

        allData["upgradeToWithProof"].count++;
        allData["upgradeToWithProof"].blockNumbers.push(tx.blockNumber);

        continue;
      }

      // upgradeTo
      if (selector === "3659cfe6") {
        if (!allData["upgradeTo"]) {
          allData["upgradeTo"] = { count: 0, blockNumbers: [] };
        }

        allData["upgradeTo"].count++;
        allData["upgradeTo"].blockNumbers.push(tx.blockNumber);

        continue;
      }

      if (!allData[selector]) {
        allData[selector] = { count: 0, blockNumbers: [] };
      }

      allData[selector].count++;
      allData[selector].blockNumbers.push(tx.blockNumber);
    }
  }

  return { users, certificates, allData };
}

export async function processRegistration2(): Promise<{
  users: Record<string, RegistrationData_R2>;
  certificates: CertificateDataWithBlockNumber[];
  allData: Record<string, { count: number; blockNumbers: number[] }>;
}> {
  const registrationInterface = Registration2__factory.createInterface();

  let txData = await getRegistrationTransactionInfos(REGISTRATION_2_ADDRESS);

  txData.sort((a, b) => a.blockNumber - b.blockNumber);

  let users: Record<string, RegistrationData_R2> = {};
  let certificates: CertificateDataWithBlockNumber[] = [];
  let allData: Record<string, { count: number; blockNumbers: number[] }> = {};

  for (const tx of txData) {
    try {
      let data: RegistrationData_R2 = parseResultR2(registrationInterface.decodeFunctionData("register", tx.data));

      if (users[String(data.passport_.passportHash)]) {
        console.log("User already exists", tx.blockNumber);
      }

      users[String(data.passport_.passportHash)] = data;

      if (!allData["register"]) {
        allData["register"] = { count: 0, blockNumbers: [] };
      }

      allData["register"].count++;
      allData["register"].blockNumbers.push(tx.blockNumber);

      continue;
    } catch (e) {}

    try {
      registrationInterface.decodeFunctionData("revoke", tx.data);

      if (!allData["revoke"]) {
        allData["revoke"] = { count: 0, blockNumbers: [] };
      }

      allData["revoke"].count++;
      allData["revoke"].blockNumbers.push(tx.blockNumber);

      continue;
    } catch {}

    try {
      registrationInterface.decodeFunctionData("revokeCertificate", tx.data);

      console.log(`Found certificate revocation: ${tx.blockNumber}`);

      if (!allData["revokeCertificate"]) {
        allData["revokeCertificate"] = { count: 0, blockNumbers: [] };
      }

      allData["revokeCertificate"].count++;
      allData["revokeCertificate"].blockNumbers.push(tx.blockNumber);

      continue;
    } catch {}

    try {
      let data = parseCertificate(registrationInterface.decodeFunctionData("registerCertificate", tx.data));

      certificates.push({ data, blockNumber: tx.blockNumber });

      if (!allData["registerCertificate"]) {
        allData["registerCertificate"] = { count: 0, blockNumbers: [] };
      }

      allData["registerCertificate"].count++;
      allData["registerCertificate"].blockNumbers.push(tx.blockNumber);

      continue;
    } catch {}

    try {
      let data: RegistrationData_R2 = parseResultR2(
        registrationInterface.decodeFunctionData("reissueIdentity", tx.data),
      );

      users[data.passport_.passportHash] = data;

      if (!allData["reissueIdentity"]) {
        allData["reissueIdentity"] = { count: 0, blockNumbers: [] };
      }

      allData["reissueIdentity"].count++;
      allData["reissueIdentity"].blockNumbers.push(tx.blockNumber);
    } catch {
      const selector = tx.data.slice(2, 10);

      if (selector === "f4e78604") {
        if (!allData["updateDep"]) {
          allData["updateDep"] = { count: 0, blockNumbers: [] };
        }

        allData["updateDep"].count++;
        allData["updateDep"].blockNumbers.push(tx.blockNumber);

        continue;
      }

      // upgradeToWithProof
      if (selector === "628543ab") {
        if (!allData["upgradeToWithProof"]) {
          allData["upgradeToWithProof"] = { count: 0, blockNumbers: [] };
        }

        allData["upgradeToWithProof"].count++;
        allData["upgradeToWithProof"].blockNumbers.push(tx.blockNumber);

        continue;
      }

      // upgradeTo
      if (selector === "3659cfe6") {
        if (!allData["upgradeTo"]) {
          allData["upgradeTo"] = { count: 0, blockNumbers: [] };
        }

        allData["upgradeTo"].count++;
        allData["upgradeTo"].blockNumbers.push(tx.blockNumber);

        continue;
      }

      if (!allData[selector]) {
        allData[selector] = { count: 0, blockNumbers: [] };
      }

      allData[selector].count++;
      allData[selector].blockNumbers.push(tx.blockNumber);
    }
  }

  return { users, certificates, allData };
}
