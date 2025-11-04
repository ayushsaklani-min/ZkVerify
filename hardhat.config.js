/**
 * zkVerify — Moca Buildathon 2025 | Auditable Zero-Knowledge Verification Layer
 * 
 * Hardhat configuration for contract compilation, testing, and deployment.
 * Supports Moca Chain Testnet and localhost networks.
 */

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const deployerKey = process.env.DEPLOYER_PRIVATE_KEY ? process.env.DEPLOYER_PRIVATE_KEY.replace(/\s+/g, "") : undefined;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    moca: {
      url: process.env.RPC_URL || "https://testnet-rpc.mocachain.org",
      chainId: 222888,
      accounts: deployerKey ? [`0x${deployerKey}`] : [],
      gasPrice: 20000000000, // 20 gwei
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
