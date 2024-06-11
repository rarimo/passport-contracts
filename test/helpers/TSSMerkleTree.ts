import { ethers } from "hardhat";
import { BigNumberish, HDNodeWallet } from "ethers";

import { MerkleTree } from "merkletreejs";

import { TSSSigner } from "./TSSSigner";

import { TSSOperation } from "@/test/helpers/types";
import { TSSUpgradeableId, StateKeeperMethodId, RegistrationMethodId } from "@/test/helpers/constants";

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

  public getProof(leaf: string, addLeaf: boolean = true, anotherSigner: HDNodeWallet | undefined = undefined): string {
    if (addLeaf) {
      this.addLeaf(leaf);
    }

    const root = this.getRoot();
    const path = this.getPath(leaf);

    const signature = this.tssSigner.sign(root, anotherSigner);

    return ethers.AbiCoder.defaultAbiCoder().encode(["bytes32[]", "bytes"], [path, signature]);
  }

  public getRoot(): string {
    return "0x" + this.tree.getRoot().toString("hex");
  }

  public addDispatcherOperation(
    operationType: RegistrationMethodId.AddPassportDispatcher | RegistrationMethodId.AddCertificateDispatcher,
    dispatcherType: string,
    dispatcher: string,
    chaneName: string,
    nonce: BigNumberish,
    contractAddress: string,
    anotherSigner: HDNodeWallet | undefined = undefined,
  ): TSSOperation {
    const encoder = new ethers.AbiCoder();
    const data = encoder.encode(["bytes32", "address"], [dispatcherType, dispatcher]);

    const hash = this.getArbitraryDataSignHash(operationType, data, chaneName, nonce, contractAddress);

    return {
      data,
      proof: this.getProof(hash, true, anotherSigner),
    };
  }

  public removeDispatcherOperation(
    operationType: RegistrationMethodId.RemovePassportDispatcher | RegistrationMethodId.RemoveCertificateDispatcher,
    dispatcherType: string,
    chaneName: string,
    nonce: BigNumberish,
    contractAddress: string,
    anotherSigner: HDNodeWallet | undefined = undefined,
  ): TSSOperation {
    const encoder = new ethers.AbiCoder();
    const data = encoder.encode(["bytes32"], [dispatcherType]);

    const hash = this.getArbitraryDataSignHash(operationType, data, chaneName, nonce, contractAddress);

    return {
      data,
      proof: this.getProof(hash, true, anotherSigner),
    };
  }

  public addRegistrationsOperation(
    registrations: string[],
    chaneName: string,
    nonce: BigNumberish,
    contractAddress: string,
    anotherSigner: HDNodeWallet | undefined = undefined,
  ): TSSOperation {
    const encoder = new ethers.AbiCoder();
    const data = encoder.encode(["address[]"], [registrations]);

    const hash = this.getArbitraryDataSignHash(
      StateKeeperMethodId.AddRegistrations,
      data,
      chaneName,
      nonce,
      contractAddress,
    );

    return {
      data,
      proof: this.getProof(hash, true, anotherSigner),
    };
  }

  public removeRegistrationsOperation(
    registrations: string[],
    chaneName: string,
    nonce: BigNumberish,
    contractAddress: string,
    anotherSigner: HDNodeWallet | undefined = undefined,
  ): TSSOperation {
    const encoder = new ethers.AbiCoder();
    const data = encoder.encode(["address[]"], [registrations]);

    const hash = this.getArbitraryDataSignHash(
      StateKeeperMethodId.RemoveRegistrations,
      data,
      chaneName,
      nonce,
      contractAddress,
    );

    return {
      data,
      proof: this.getProof(hash, true, anotherSigner),
    };
  }

  public authorizeUpgradeOperation(
    newImplementation: string,
    chaneName: string,
    nonce: BigNumberish,
    contractAddress: string,
    anotherSigner: HDNodeWallet | undefined = undefined,
  ): string {
    const hash = ethers.solidityPackedKeccak256(
      ["address", "uint8", "address", "string", "uint256"],
      [contractAddress, TSSUpgradeableId.MAGIC_ID, newImplementation, chaneName, nonce],
    );

    return this.getProof(hash, true, anotherSigner);
  }

  public getArbitraryDataSignHash(
    methodId: number,
    data: string,
    chaneName: string,
    nonce: BigNumberish,
    contractAddress: string,
  ): string {
    return ethers.solidityPackedKeccak256(
      ["address", "uint8", "bytes", "string", "uint256"],
      [contractAddress, methodId, data, chaneName, nonce],
    );
  }
}
