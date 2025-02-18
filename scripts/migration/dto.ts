import { RegistrationSimple } from "@ethers-v6";

export type Passport_R1 = {
  dataType: string;
  zkType: string;
  signature: string;
  publicKey: string;
};

export type Passport_R2 = {
  dataType: string;
  zkType: string;
  signature: string;
  publicKey: string;
  passportHash: string;
};

export type ProofPoints = {
  a: [bigint, bigint];
  b: [[bigint, bigint], [bigint, bigint]];
  c: [bigint, bigint];
};

export type RegistrationData_R1 = {
  certificatesRoot_: string;
  identityKey_: bigint;
  dgCommit_: bigint;
  passport_: Passport_R1;
  zkPoints_: ProofPoints;
};

export type RegistrationData_R2 = {
  certificatesRoot_: string;
  identityKey_: bigint;
  dgCommit_: bigint;
  passport_: Passport_R2;
  zkPoints_: ProofPoints;
};

export type RegistrationData_R3 = {
  identityKey_: bigint;
  passport_: RegistrationSimple.PassportStruct;
  signature_: string;
  zkPoints_: ProofPoints;
};

export function parseResultR1(result: any[]): RegistrationData_R1 {
  const [certificatesRoot_, identityKey_, dgCommit_, passportArr, zkPointsArr] = result;

  const passport_: Passport_R1 = {
    dataType: passportArr[0],
    zkType: passportArr[1],
    signature: passportArr[2],
    publicKey: passportArr[3],
  };

  const zkPoints_: ProofPoints = {
    a: [zkPointsArr[0][0], zkPointsArr[0][1]],
    b: [
      [zkPointsArr[1][0][0], zkPointsArr[1][0][1]],
      [zkPointsArr[1][1][0], zkPointsArr[1][1][1]],
    ],
    c: [zkPointsArr[2][0], zkPointsArr[2][1]],
  };

  return {
    certificatesRoot_,
    identityKey_,
    dgCommit_,
    passport_,
    zkPoints_,
  };
}

export function parseResultR2(result: any[]): RegistrationData_R2 {
  const [certificatesRoot_, identityKey_, dgCommit_, passportArr, zkPointsArr] = result;

  const passport_: Passport_R2 = {
    dataType: passportArr[0],
    zkType: passportArr[1],
    signature: passportArr[2],
    publicKey: passportArr[3],
    passportHash: passportArr[4],
  };

  const zkPoints_: ProofPoints = {
    a: [zkPointsArr[0][0], zkPointsArr[0][1]],
    b: [
      [zkPointsArr[1][0][0], zkPointsArr[1][0][1]],
      [zkPointsArr[1][1][0], zkPointsArr[1][1][1]],
    ],
    c: [zkPointsArr[2][0], zkPointsArr[2][1]],
  };

  return {
    certificatesRoot_,
    identityKey_,
    dgCommit_,
    passport_,
    zkPoints_,
  };
}

export function parseResultR3(result: any[]): RegistrationData_R3 {
  const [identityKey_, passportArr, signature_, zkPointsArr] = result;

  const passport_: RegistrationSimple.PassportStruct = {
    dgCommit: passportArr[0],
    dg1Hash: passportArr[1],
    publicKey: passportArr[2],
    passportHash: passportArr[3],
    verifier: passportArr[4],
  };

  const zkPoints_: ProofPoints = {
    a: [zkPointsArr[0][0], zkPointsArr[0][1]],
    b: [
      [zkPointsArr[1][0][0], zkPointsArr[1][0][1]],
      [zkPointsArr[1][1][0], zkPointsArr[1][1][1]],
    ],
    c: [zkPointsArr[2][0], zkPointsArr[2][1]],
  };

  return {
    identityKey_,
    passport_,
    signature_,
    zkPoints_,
  };
}

export type Certificate = {
  dataType: string;
  signedAttributes: string;
  keyOffset: bigint;
  expirationOffset: bigint;
};

export type ICAOMember = {
  signature: string;
  publicKey: string;
};

export type CertificateData = {
  certificate_: Certificate;
  icaoMember_: ICAOMember;
  icaoMerkleProof_: string[];
};

export function parseCertificate(result: any[]): CertificateData {
  const [certificateArr, icaoMemberArr, icaoMerkleProofArr] = result;

  const certificate_: Certificate = {
    dataType: certificateArr[0],
    signedAttributes: certificateArr[1],
    keyOffset: certificateArr[2],
    expirationOffset: certificateArr[3],
  };

  const icaoMember_: ICAOMember = {
    signature: icaoMemberArr[0],
    publicKey: icaoMemberArr[1],
  };

  const icaoMerkleProof_: string[] = icaoMerkleProofArr.map((x: any) => x);

  return {
    certificate_,
    icaoMember_,
    icaoMerkleProof_,
  };
}
