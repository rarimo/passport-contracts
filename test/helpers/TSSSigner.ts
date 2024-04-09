import { ethers } from "hardhat";
import { BigNumberish, BytesLike, HDNodeWallet } from "ethers";

export class TSSSigner {
  constructor(public signer: HDNodeWallet) {}

  public changeICAOMasterTreeRoot(newRoot: string, timestamp: BigNumberish): string {
    const hash = ethers.solidityPackedKeccak256(
      ["string", "bytes32", "uint64"],
      ["Rarimo CSCA root", newRoot, timestamp],
    );

    return this.sign(hash);
  }

  public signChangeSigner(newPubKey: string): string {
    const hash = ethers.solidityPackedKeccak256(["bytes"], [newPubKey]);

    return this.sign(hash);
  }

  public sign(hash: BytesLike) {
    return ethers.Signature.from(this.signer.signingKey.sign(hash)).serialized;
  }
}
