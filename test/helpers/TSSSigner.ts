import { ethers } from "hardhat";
import { BigNumberish, BytesLike, HDNodeWallet } from "ethers";

export class TSSSigner {
  constructor(public signer: HDNodeWallet) {}

  public signChangeSigner(newPubKey: string): string {
    const hash = ethers.solidityPackedKeccak256(["bytes"], [newPubKey]);

    return this.sign(hash);
  }

  public sign(hash: BytesLike) {
    return ethers.Signature.from(this.signer.signingKey.sign(hash)).serialized;
  }
}
