import "@nomicfoundation/hardhat-verify";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";

import "@solarity/hardhat-migrate";
import "@solarity/hardhat-gobind";
import "@solarity/hardhat-markup";
import "@solarity/hardhat-zkit";

import "@typechain/hardhat";

import "hardhat-contract-sizer";
import "hardhat-gas-reporter";

import "solidity-coverage";

import "tsconfig-paths/register";

import { HardhatUserConfig } from "hardhat/config";

import * as dotenv from "dotenv";
dotenv.config();

function privateKey() {
  return process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [];
}

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      initialDate: "2004-01-01",
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      gasMultiplier: 1.2,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: privateKey(),
      gasMultiplier: 1.2,
    },
    "q-testnet": {
      url: "https://rpc.qtestnet.org/",
      accounts: privateKey(),
    },
    ethereum: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: privateKey(),
      gasMultiplier: 1.2,
    },
    polygon: {
      url: `https://matic-mainnet.chainstacklabs.com`,
      accounts: privateKey(),
      gasMultiplier: 1.2,
    },
    "rarimo-l2": {
      url: "https://l2.rarimo.com",
      gasMultiplier: 1.2,
    },
    "rarimo-l2-testnet": {
      url: "https://l2.testnet.rarimo.com",
      gasMultiplier: 1.2,
    },
    "rarimo-dev": {
      url: "http://34.134.193.127:8545",
      gasMultiplier: 1.2,
    },
    "rarimo-beta": {
      url: "https://rpc.evm.mainnet.rarimo.com",
      gasPrice: 0,
      gasMultiplier: 1.2,
    },
  },
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "london",
    },
  },
  etherscan: {
    apiKey: {
      "rarimo-l2": "abc",
      "rarimo-l2-testnet": "abc",
      "rarimo-beta": "abc",
    },
    customChains: [
      {
        network: "rarimo-beta",
        chainId: 201411,
        urls: {
          apiURL: "https://api.evmscan.rarimo.com/api",
          browserURL: "https://evmscan.rarimo.com",
        },
      },
      {
        network: "rarimo-l2",
        chainId: 7368,
        urls: {
          apiURL: "https://evmscan.l2.rarimo.com/api",
          browserURL: "https://newscan.l2.rarimo.com/",
        },
      },
      {
        network: "rarimo-l2-testnet",
        chainId: 7369,
        urls: {
          apiURL: "https://scan.testnet.rarimo.com/api",
          browserURL: "https://scan.testnet.rarimo.com",
        },
      },
    ],
  },
  migrate: {
    paths: {
      pathToMigrations: "./deploy/",
    },
  },
  mocha: {
    timeout: 1000000,
  },
  contractSizer: {
    alphaSort: false,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: false,
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 50,
    enabled: false,
    reportPureAndViewMethods: true,
    coinmarketcap: `${process.env.COINMARKETCAP_KEY}`,
  },
  typechain: {
    outDir: "generated-types/ethers",
    target: "ethers-v6",
  },
};

export default config;
