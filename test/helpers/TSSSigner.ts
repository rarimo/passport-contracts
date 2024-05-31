import { ethers } from "hardhat";
import { BytesLike, HDNodeWallet } from "ethers";

export class TSSSigner {
  constructor(public signer: HDNodeWallet) {}
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
}
