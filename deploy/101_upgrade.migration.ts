import { ethers } from "hardhat";
import { Deployer } from "@solarity/hardhat-migrate";

import { Registration2, StateKeeper, Registration2__factory, StateKeeper__factory } from "@ethers-v6";

async function upgradeStateKeeper(stateKeeper: StateKeeper) {
  const coder = ethers.AbiCoder.defaultAbiCoder();

  const paths = [["0x2bac2fb6827c4c4913120c31fb1ed1fafeb8501b62dac00ed7d905ce4bf95b49"]];
  const sigs = [
    "0x7ed2622590acb56e2789ce3e7cdd10eabac15f3ed5d59b61f6d32714c09ddd8359d7ae76ed37e8b672b3d8bd05585078e8ee23a2bc39e8abc8cc4e15a35650cb00",
  ];
  const data = ["0xa46e5dd900000000000000000000000053638975bc11de3029e46df193d64879eaea94eb"];
  const impl = ["0xF39681350CD61011eF1222020Aaeb02e6561B493"];

  let proof = coder.encode(["bytes32[]", "bytes"], [paths[0], ethers.toBeHex(BigInt(sigs[0]) + 27n)]);

  await stateKeeper.upgradeToAndCallWithProof(impl[0], proof, data[0]);
}

async function upgradeRegistration(registration: Registration2) {
  const coder = ethers.AbiCoder.defaultAbiCoder();

  const paths = [["0x8bbbf2a5c1d130a1bf55b0669a62567c50b596f3c6e495e34e6d2be485eaa201"]];
  const sigs = [
    "0x7ed2622590acb56e2789ce3e7cdd10eabac15f3ed5d59b61f6d32714c09ddd8359d7ae76ed37e8b672b3d8bd05585078e8ee23a2bc39e8abc8cc4e15a35650cb00",
  ];
  const impl = ["0x27525DE990Ec4786B517DA7f340FaE91506c4E6E"];

  let proof = coder.encode(["bytes32[]", "bytes"], [paths[0], ethers.toBeHex(BigInt(sigs[0]) + 27n)]);

  await registration.upgradeToWithProof(impl[0], proof);
}

export = async (deployer: Deployer) => {
  const stateKeeper = await deployer.deployed(StateKeeper__factory, "0x7d4E8Da1d10f8Db46C52414175d4003ab0Aef506");
  const registration = await deployer.deployed(Registration2__factory, "0xC0B09085Fa2ad3A8BbF96494B8d5cd10702FE20d");

  await upgradeStateKeeper(stateKeeper);
  await upgradeRegistration(registration);

  console.log("OK");
};
