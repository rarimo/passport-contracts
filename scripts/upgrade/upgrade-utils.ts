import { ethers } from "hardhat";
import { BigNumberish } from "ethers";

import { RegistrationMethodId } from "@/test/helpers/constants";

export class TSSUpgrader {
  public chainName;
  public registrationAddress;

  constructor(chainName: string, registrationAddress: string) {
    this.chainName = chainName;
    this.registrationAddress = registrationAddress;
  }

  public getAddDependencyData(
    operationType:
      | RegistrationMethodId.AddPassportDispatcher
      | RegistrationMethodId.AddCertificateDispatcher
      | RegistrationMethodId.AddPassportVerifier,
    dispatcherType: string,
    dispatcher: string,
    nonce: BigNumberish,
  ): string {
    const encoder = new ethers.AbiCoder();
    const data = encoder.encode(["bytes32", "address"], [dispatcherType, dispatcher]);

    const dataToDisplay = this.getArbitraryData(operationType, data, nonce);

    return dataToDisplay;
  }

  public getRemoveDependencyData(
    operationType:
      | RegistrationMethodId.RemovePassportDispatcher
      | RegistrationMethodId.RemoveCertificateDispatcher
      | RegistrationMethodId.RemovePassportVerifier,
    dispatcherType: string,
    nonce: BigNumberish,
  ): string {
    const encoder = new ethers.AbiCoder();
    const data = encoder.encode(["bytes32"], [dispatcherType]);

    const dataToDisplay = this.getArbitraryData(operationType, data, nonce);

    return dataToDisplay;
  }

  getArbitraryData(methodId: number, data: string, nonce: BigNumberish): string {
    return ethers.solidityPacked(
      ["address", "uint8", "bytes", "string", "uint256"],
      [this.registrationAddress, methodId, data, this.chainName, nonce],
    );
  }
}
