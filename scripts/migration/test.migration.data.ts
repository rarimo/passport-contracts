import {
  processRegistration,
  processRegistration2,
  processSimpleRegistration,
} from "@/scripts/migration/process-transactions";
import {
  CertificateDataWithBlockNumber,
  RegistrationData_R1,
  RegistrationData_R2,
  RegistrationData_R3,
} from "@/scripts/migration/dto";

function sum(data: Record<string, { count: number; blockNumbers: number[] }>): number {
  return Object.values(data).reduce((acc, val) => acc + val.count, 0);
}

async function test() {
  let simpleRegistrationData = await processSimpleRegistration();
  let registrationData = await processRegistration();
  let registrationData2 = await processRegistration2();

  console.log(simpleRegistrationData.allData, sum(simpleRegistrationData.allData));
  console.log(registrationData.allData, sum(registrationData.allData));
  console.log(registrationData2.allData, sum(registrationData2.allData));

  printStats(
    simpleRegistrationData.users,
    { users: registrationData.users, certificates: registrationData.certificates },
    { users: registrationData2.users, certificates: registrationData2.certificates },
  );
}

function printStats(
  simpleRegistrationData: RegistrationData_R3[],
  registrationData: {
    users: Record<string, RegistrationData_R1>;
    certificates: CertificateDataWithBlockNumber[];
  },
  registrationData2: {
    users: Record<string, RegistrationData_R2>;
    certificates: CertificateDataWithBlockNumber[];
  },
) {
  console.log(`Simple registration: ${simpleRegistrationData.length}`);
  console.log(`Registration 1 -- Users: ${Object.keys(registrationData.users).length}`);
  console.log(`Registration 2 -- Users: ${Object.keys(registrationData2.users).length}`);

  console.log(`Registration 1 -- Certificates: ${registrationData.certificates.length}`);
  console.log(`Registration 2 -- Certificates: ${registrationData2.certificates.length}`);

  console.log(
    `Total users: ${Object.keys(registrationData.users).length + Object.keys(registrationData2.users).length + simpleRegistrationData.length}`,
  );
  console.log(`Total certificates: ${registrationData.certificates.length + registrationData2.certificates.length}`);
}

test().then();
