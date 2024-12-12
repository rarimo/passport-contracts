import { Poseidon } from "@iden3/js-crypto";

export type DG1Fields = {
  citizenship: string; // 3 chars
  name: string; // 31 chars
  nameResidual: string; // 8 chars
  documentNumber: string; // 9 chars
  nationality: string; // 3 chars
  birthDate: string; // 6 chars (i.g., YYMMDD)
  sex: string; // 1 char ('M'/'F'/'O')
  expirationDate: string; // 6 chars (i.g., YYMMDD)
};

/**
 * Encodes an ASCII string into bits (MSB-first) and writes it into the dg1 array at the given offset.
 * @param dg1 - The dg1 bit array (modified in place).
 * @param str - ASCII string to encode.
 * @param offset - Starting bit offset in the dg1 array.
 */
export function writeASCIIString(dg1: bigint[], str: string, offset: number) {
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    // Write 8 bits, MSB first
    for (let b = 0; b < 8; b++) {
      // Extract bit (7-b)th bit from charCode
      const bit = (charCode >> (7 - b)) & 1;
      dg1[offset + i * 8 + b] = BigInt(bit);
    }
  }
}

/**
 * Ensures that a string is the correct length, padding or throwing an error if necessary.
 * @param str - The original string.
 * @param requiredLength - The required length in characters.
 * @param padChar - The character to pad with if str is shorter than requiredLength.
 */
export function ensureLength(str: string, requiredLength: number, padChar = "\0") {
  if (str.length === requiredLength) return str;
  if (str.length < requiredLength) {
    return str.padEnd(requiredLength, padChar);
  }
  throw new Error(`String too long. Required length: ${requiredLength}, got: ${str.length}`);
}

/**
 * Creates a valid dg1 array of 744 bits from the given fields.
 * All fields must match the required lengths. If shorter, they are padded.
 * Date: 6 chars => 48 bits
 */
export function createDG1Data(fields: DG1Fields): bigint[] {
  const dg1 = Array<bigint>(1024).fill(0n);

  // Ensure lengths
  fields.citizenship = ensureLength(fields.citizenship, 3, "0");
  fields.name = ensureLength(fields.name, 31, " ");
  fields.nameResidual = ensureLength(fields.nameResidual, 8, " ");
  fields.documentNumber = ensureLength(fields.documentNumber, 9, "0");
  fields.nationality = ensureLength(fields.nationality, 3, "0");
  fields.birthDate = ensureLength(fields.birthDate, 6, "0");
  fields.sex = ensureLength(fields.sex, 1, "X");
  fields.expirationDate = ensureLength(fields.expirationDate, 6, "0");

  // Offsets and sizes in bits
  const CITIZENSHIP_FIELD_SHIFT = 56;
  const CITIZENSHIP_FIELD_SIZE = 24;

  const NAME_FIELD_SHIFT = 80;
  const NAME_FIELD_SIZE = 248; // 31 * 8

  const NAME_FIELD_RESIDUAL_SHIFT = NAME_FIELD_SHIFT + NAME_FIELD_SIZE; // 80 + 248 = 328
  const NAME_FIELD_RESIDUAL_SIZE = 64; // 8 * 8

  const DOCUMENT_NUMBER_SHIFT = 392;
  const DOCUMENT_NUMBER_SIZE = 72; // 9 * 8

  const NATIONALITY_FIELD_SHIFT = 472;
  const NATIONALITY_FIELD_SIZE = 24; // 3 * 8

  const BIRTH_DATE_SHIFT = 496;
  const BIRTH_DATE_SIZE = 48; // 6 * 8

  const SEX_POSITION = 69; // As given
  const SEX_FIELD_SHIFT = SEX_POSITION * 8; // 552
  const SEX_FIELD_SIZE = 8; // 1 * 8

  const EXPIRATION_DATE_SHIFT = 560;
  const EXPIRATION_DATE_SIZE = 48; // 6 * 8

  // Write fields
  writeASCIIString(dg1, fields.citizenship, CITIZENSHIP_FIELD_SHIFT);
  writeASCIIString(dg1, fields.name, NAME_FIELD_SHIFT);
  writeASCIIString(dg1, fields.nameResidual, NAME_FIELD_RESIDUAL_SHIFT);
  writeASCIIString(dg1, fields.documentNumber, DOCUMENT_NUMBER_SHIFT);
  writeASCIIString(dg1, fields.nationality, NATIONALITY_FIELD_SHIFT);
  writeASCIIString(dg1, fields.birthDate, BIRTH_DATE_SHIFT);
  writeASCIIString(dg1, fields.sex, SEX_FIELD_SHIFT);
  writeASCIIString(dg1, fields.expirationDate, EXPIRATION_DATE_SHIFT);

  return dg1;
}

const CHUNK_SIZE = 186;
export function getDG1Commitment(dg1: bigint[], skIdentity: bigint): bigint {
  const chunks: bigint[] = Array(4).fill(0);

  for (let i = 0; i < 4; i++) {
    chunks[i] = BigInt(
      "0b" +
        dg1
          .slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
          .reverse()
          .join(""),
    );
  }

  return Poseidon.hash([...chunks, Poseidon.hash([skIdentity])]);
}
