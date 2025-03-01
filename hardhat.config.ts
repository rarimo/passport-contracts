import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
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
      accounts: privateKey(),
      gasMultiplier: 1.2,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: privateKey(),
      gasMultiplier: 1.2,
    },
    "rarimo-testnet": {
      url: "https://rpc.evm.node2.mainnet-beta.rarimo.com",
      accounts: privateKey(),
      gasPrice: 0,
      gasMultiplier: 1.2,
    },
    "rarimo-mainnet": {
      url: "https://rpc.evm.mainnet.rarimo.com",
      accounts: privateKey(),
      gasPrice: 0,
      gasMultiplier: 1.2,
    },
    "q-testnet": {
      url: "https://rpc.qtestnet.org/",
      accounts: privateKey(),
    },
    chapel: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: privateKey(),
      gasMultiplier: 1.2,
      timeout: 60000,
    },
    fuji: {
      url: `https://avalanche-fuji.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: privateKey(),
      gasMultiplier: 1.2,
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      accounts: privateKey(),
      gasMultiplier: 1.2,
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
    avalanche: {
      url: `https://api.avax.network/ext/bc/C/rpc`,
      accounts: privateKey(),
      gasMultiplier: 1.2,
      timeout: 60000,
    },
    "rarimo-l2": {
      url: "https://l2.rarimo.com",
      accounts: privateKey(),
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
      "rarimo-testnet": "abc",
      "rarimo-mainnet": "abc",
      "q-testnet": "abc",
      sepolia: `${process.env.ETHERSCAN_KEY}`,
      mainnet: `${process.env.ETHERSCAN_KEY}`,
      bscTestnet: `${process.env.BSCSCAN_KEY}`,
      bsc: `${process.env.BSCSCAN_KEY}`,
      polygon: `${process.env.POLYGONSCAN_KEY}`,
      avalancheFujiTestnet: `${process.env.AVALANCHE_KEY}`,
      avalanche: `${process.env.AVALANCHE_KEY}`,
      "rarimo-l2": `abc`,
    },
    customChains: [
      {
        network: "rarimo-l2",
        chainId: 7368,
        urls: {
          apiURL: "https://evmscan.l2.rarimo.com/api",
          browserURL: "https://newscan.l2.rarimo.com/",
        },
      },
      {
        network: "rarimo-testnet",
        chainId: 42,
        urls: {
          apiURL: "https://evmscan.mainnet-beta.rarimo.com/api",
          browserURL: "https://newevmscan.mainnet-beta.rarimo.com",
        },
      },
      {
        network: "rarimo-mainnet",
        chainId: 201411,
        urls: {
          apiURL: "https://api.evmscan.rarimo.com/api",
          browserURL: "https://evmscan.rarimo.com",
        },
      },
      {
        network: "q-testnet",
        chainId: 35443,
        urls: {
          apiURL: "https://explorer.qtestnet.org/api",
          browserURL: "https://explorer.qtestnet.org",
        },
      },
    ],
  },
  migrate: {
    pathToMigrations: "./deploy/",
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
