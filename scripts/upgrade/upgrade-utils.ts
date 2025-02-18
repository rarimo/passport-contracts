import { ethers } from "hardhat";
import { BigNumberish } from "ethers";

import { RegistrationMethodId } from "@/test/helpers/constants";

export class TSSUpgrader {
  private MAGIC_ID = 255;

  public chainName;
  public stateKeeperAddress;
  public registrationAddress;

  constructor(chainName: string, stateKeeperAddress: string, registrationAddress: string) {
    this.chainName = chainName;
    this.stateKeeperAddress = stateKeeperAddress;
    this.registrationAddress = registrationAddress;
  }

  public getStateKeeperUpgradeData(impl: string, nonce: BigNumberish): string {
    return this.getArbitraryData(this.stateKeeperAddress, this.MAGIC_ID, impl, nonce);
  }

  public getRegistrationUpgradeData(impl: string, nonce: BigNumberish): string {
    return this.getArbitraryData(this.registrationAddress, this.MAGIC_ID, impl, nonce);
  }

  public getRegistrationAddDependencyData(
    operationType:
      | RegistrationMethodId.AddPassportDispatcher
      | RegistrationMethodId.AddCertificateDispatcher
      | RegistrationMethodId.AddPassportVerifier,
    dispatcherType: string,
    dispatcher: string,
    nonce: BigNumberish,
  ): Record<string, string> {
    const encoder = new ethers.AbiCoder();
    const data = encoder.encode(["bytes32", "address"], [dispatcherType, dispatcher]);

    const dataToDisplay = this.getArbitraryData(this.registrationAddress, operationType, data, nonce);

    return { dataToDisplay, data };
  }

  public getRegistrationRemoveDependencyData(
    operationType:
      | RegistrationMethodId.RemovePassportDispatcher
      | RegistrationMethodId.RemoveCertificateDispatcher
      | RegistrationMethodId.RemovePassportVerifier,
    dispatcherType: string,
    nonce: BigNumberish,
  ): Record<string, string> {
    const encoder = new ethers.AbiCoder();
    const data = encoder.encode(["bytes32"], [dispatcherType]);

    const dataToDisplay = this.getArbitraryData(this.registrationAddress, operationType, data, nonce);

    return { dataToDisplay, data };
  }

  getArbitraryData(contract: string, methodId: number, data: string, nonce: BigNumberish): string {
    if (methodId == this.MAGIC_ID) {
      return ethers.solidityPacked(
        ["address", "uint8", "address", "string", "uint256"],
        [contract, this.MAGIC_ID, data, this.chainName, nonce],
      );
    }

    return ethers.solidityPacked(
      ["address", "uint8", "bytes", "string", "uint256"],
      [contract, methodId, data, this.chainName, nonce],
    );
  }
}
