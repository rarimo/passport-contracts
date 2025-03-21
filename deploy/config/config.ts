import hre from "hardhat";

export async function getConfig() {
  if (hre.network.name == "localhost" || hre.network.name == "hardhat") {
    return await import("./localhost");
  }

  if (hre.network.name == "rarimo-testnet") {
    return await import("./rarimo-testnet");
  }

  if (hre.network.name == "rarimo-mainnet") {
    return await import("./rarimo-mainnet");
  }

  if (hre.network.name == "rarimo-l2-testnet") {
    return await import("./rarimo-l2-testnet");
  }

  if (hre.network.name == "rarimo-dev") {
    return await import("./rarimo-dev");
  }

  throw new Error(`Config for network ${hre.network.name} is not specified`);
}
