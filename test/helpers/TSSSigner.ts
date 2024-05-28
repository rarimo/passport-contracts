import { ethers } from "hardhat";
import { BigNumberish, BytesLike, HDNodeWallet } from "ethers";

import { TSSOperation } from "@/test/helpers/types";
import { RegistrationMethodId } from "@/test/helpers/constants";

export class TSSSigner {
  constructor(public signer: HDNodeWallet) {}

  public signAddDispatcherOperation(
    dispatcherType: string,
    dispatcher: string,
    chaneName: string,
    nonce: BigNumberish,
    contractAddress: string,
    anotherSigner: HDNodeWallet | undefined = undefined,
  ): TSSOperation {
    const encoder = new ethers.AbiCoder();
    const data = encoder.encode(["bytes32", "address"], [dispatcherType, dispatcher]);

    const hash = this.getArbitraryDataSignHash(
      RegistrationMethodId.AddDispatcher,
      data,
      chaneName,
      nonce,
      contractAddress,
    );

    return {
      data,
      signature: this.sign(hash, anotherSigner),
    };
  }

  public signRemoveDispatcherOperation(
    dispatcherType: string,
    chaneName: string,
    nonce: BigNumberish,
    contractAddress: string,
    anotherSigner: HDNodeWallet | undefined = undefined,
  ): TSSOperation {
    const encoder = new ethers.AbiCoder();
    const data = encoder.encode(["bytes32"], [dispatcherType]);

    const hash = this.getArbitraryDataSignHash(
      RegistrationMethodId.AddDispatcher,
      data,
      chaneName,
      nonce,
      contractAddress,
    );

    return {
      data,
      signature: this.sign(hash, anotherSigner),
    };
  }

  public signChangeSigner(newPubKey: string): string {
    const hash = ethers.solidityPackedKeccak256(["bytes"], [newPubKey]);

    return this.sign(hash);
  }

  public sign(hash: BytesLike, anotherSigner: HDNodeWallet | undefined = undefined) {
    if (anotherSigner) {
      return ethers.Signature.from(anotherSigner.signingKey.sign(hash)).serialized;
    }

    return ethers.Signature.from(this.signer.signingKey.sign(hash)).serialized;
  }

  private getArbitraryDataSignHash(
    methodId: number,
    data: string,
    chaneName: string,
    nonce: BigNumberish,
    contractAddress: string,
  ): string {
    return ethers.solidityPackedKeccak256(
      ["uint8", "bytes", "string", "uint256", "address"],
      [methodId, data, chaneName, nonce, contractAddress],
    );
  }
}
