import { VerifierHelper } from "@/generated-types/ethers/contracts/dispatchers/RSASHA1Dispatcher";

export enum RegistrationMethodId {
  None,
  AuthorizeUpgrade,
  ChangeICAOMasterTreeRoot,
  AddDispatcher,
  RemoveDispatcher,
}

export enum PoseidonSMTMethodId {
  None,
  AuthorizeUpgrade,
  AddRegistrations,
  RemoveRegistrations,
}

export const RegistrationProof: VerifierHelper.ProofPointsStruct = {
  a: [
    "0x2a728d4803ccf692b21a78aa9be826b81f42c0d8311599f8ec9b6fcd0c1f2a3f",
    "0x24bc6919f1a375b50e6d6b72a71fbefe19a4a1cd9bb9f0ad0ebc0af233febdb7",
  ],
  b: [
    [
      "0x06e1b948da4bbfc8f757b83b008979e9841d02e1ff232f931421e9bed62230f3",
      "0x2ca7f410f4e5413436c7cee348e4d0daaf0d132601b6778afc609399753445a6",
    ],
    [
      "0x0b89d3b7f8b4969857aa35ae680eaf495efc86067564408c6c8700d83809ec1d",
      "0x0a1913c73669ae6c35f0a11cb9020c8ac6c5feeff4e20326b981770b92653ca4",
    ],
  ],
  c: [
    "0x0d06369eb8bae114b3a29cd0db63be4bb05a28ab13a2f2bbefe346c3d8d035f7",
    "0x12ed78908fcd153b2cf488fc03165b489b5fa1513c7d90ea762a97b6d0ebcd40",
  ],
};

export const RegistrationPublicSignalsRSA = [
  "0x1deda1aa6315b4867b9ba3aeb02ad6e295dc9932e3f9a50b54838fea11fa8640",
  "0x123a73c2b276ad3343a7fca44540bd96f3275880430fe566508d4cb32335b543",
  "0x2eb51868e5d4e48bf5914690a435f8c2126e2febdfddbe9fd5622e7b16a01157",
  "0x21c2b3d4d39e659d2fbde0be6f2975c854f8b654cc2c9978988f85c2d2ff790a",
];

export const RegistrationSignatureRSA =
  "0x51C0916300AA61A140EC9656D471A8DB8244C1094DC23DD9A4D150B6487D6ECA4E9386D58BB9ED5434563C1272E839D1BE00D5E86B56DE28C5D3C623413D189DC942DB6F06DAA8BCC9C46B6723237BD68E3139E09C4C432EF0E66DAC4AD1E2F303B54C35718A2B4355B42C9FD414AC22F0DF9DBF20042F227955D573695BC3B0";
