import hre from "hardhat";

export async function getConfig() {
  if (hre.network.name == "localhost") {
    return await import("./localhost");
  }

  if (hre.network.name == "rarimo-testnet") {
    return await import("./rarimo-testnet");
  }

  throw new Error(`Config for network ${hre.network.name} is not specified`);
}
