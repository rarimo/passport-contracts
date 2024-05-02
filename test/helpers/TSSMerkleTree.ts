import { ethers } from "hardhat";

import { MerkleTree } from "merkletreejs";

import { TSSSigner } from "./TSSSigner";

export class TSSMerkleTree {
  public tree: MerkleTree;

  constructor(public tssSigner: TSSSigner) {
    const leaves = Array.from({ length: 10 }, () => ethers.randomBytes(32));

    this.tree = new MerkleTree(
      leaves,
      (e: Buffer) => {
        const hash = ethers.solidityPackedKeccak256(["bytes"], [e]);

        return Buffer.from(hash.slice(2), "hex");
      },
      { sortPairs: true },
    );
  }

  public addLeaf(leaf: string) {
    this.tree.addLeaf(Buffer.from(leaf.slice(2), "hex"));
  }

  public getPath(leaf: string): Array<string> {
    return this.tree.getProof(leaf).map((el) => "0x" + el.data.toString("hex"));
  }

  public getRawProof(leaf: string, addLeaf: boolean = true): string[] {
    if (addLeaf) {
      this.addLeaf(leaf);
    }

    return this.getPath(leaf);
  }

  public getProof(leaf: string, addLeaf: boolean = true): string {
    if (addLeaf) {
      this.addLeaf(leaf);
    }

    const root = this.getRoot();
    const path = this.getPath(leaf);

    const signature = this.tssSigner.sign(root);

    return ethers.AbiCoder.defaultAbiCoder().encode(["bytes32[]", "bytes"], [path, signature]);
  }

  public getRoot(): string {
    return "0x" + this.tree.getRoot().toString("hex");
  }
}
