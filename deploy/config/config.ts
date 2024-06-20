import hre from "hardhat";

export async function getConfig() {
  if (hre.network.name == "localhost") {
    return await import("./localhost");
  }

  if (hre.network.name == "rarimo-testnet") {
    return await import("./rarimo-testnet");
  }

  if (hre.network.name == "rarimo-mainnet") {
    return await import("./rarimo-mainnet");
  }

  throw new Error(`Config for network ${hre.network.name} is not specified`);
}
