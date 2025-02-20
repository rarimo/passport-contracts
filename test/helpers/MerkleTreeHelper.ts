import { ethers } from "hardhat";

import { MerkleTree } from "merkletreejs";

export class MerkleTreeHelper {
  public tree: MerkleTree;

  constructor() {
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

  public getRoot(): string {
    return "0x" + this.tree.getRoot().toString("hex");
  }
}
