// ✅ FIX #1: Add proper environment configuration for Oasis Sapphire
import * as dotenv from "dotenv";
dotenv.config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomicfoundation/hardhat-verify";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import { task } from "hardhat/config";
import generateTsAbis from "./scripts/generateTsAbis";

// Environment variables with fallbacks
const providerApiKey = process.env.ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";
const deployerPrivateKey =
  process.env.DEPLOYER_PRIVATE_KEY ?? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "DNXJA8RX2Q3VZ4URQIWP7Z68CJXQZSC6AW";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  defaultNetwork: "localhost",
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  networks: {
    // Local development
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
        enabled: process.env.MAINNET_FORKING_ENABLED === "true",
      },
    },
    
    // Ethereum networks
    mainnet: {
      url: "https://mainnet.rpc.buidlguidl.com",
      accounts: [deployerPrivateKey],
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    
    // Arbitrum networks
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    arbitrumSepolia: {
      url: `https://arb-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    
    // Optimism networks
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    optimismSepolia: {
      url: `https://opt-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    
    // Polygon networks
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    polygonAmoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    polygonZkEvm: {
      url: `https://polygonzkevm-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    polygonZkEvmCardona: {
      url: `https://polygonzkevm-cardona.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    
    // Other networks
    gnosis: {
      url: "https://rpc.gnosischain.com",
      accounts: [deployerPrivateKey],
    },
    chiado: {
      url: "https://rpc.chiadochain.net",
      accounts: [deployerPrivateKey],
    },
    base: {
      url: "https://mainnet.base.org",
      accounts: [deployerPrivateKey],
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [deployerPrivateKey],
    },
    scrollSepolia: {
      url: "https://sepolia-rpc.scroll.io",
      accounts: [deployerPrivateKey],
    },
    scroll: {
      url: "https://rpc.scroll.io",
      accounts: [deployerPrivateKey],
    },
    celo: {
      url: "https://forno.celo.org",
      accounts: [deployerPrivateKey],
    },
    celoAlfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: [deployerPrivateKey],
    },

    // ✅ FIX #2: ADD OASIS SAPPHIRE NETWORK CONFIGURATIONS
    sapphireTestnet: {
      url: process.env.OASIS_SAPPHIRE_RPC || "https://testnet.sapphire.oasis.dev",
      accounts: [deployerPrivateKey],
      chainId: 0x5aff, // 23295 - Sapphire Testnet chain ID
      gasPrice: 100000000000, // 100 gwei - recommended for Sapphire
    },
    sapphireMainnet: {
      url: "https://sapphire.oasis.dev",
      accounts: [deployerPrivateKey],
      chainId: 0x5afe, // 23294 - Sapphire Mainnet chain ID
      gasPrice: 100000000000, // 100 gwei - recommended for Sapphire
    },
    
    // ✅ FIX #3: ADD OASIS EMERALD NETWORKS (for comparison/fallback)
    emeraldTestnet: {
      url: "https://testnet.emerald.oasis.dev",
      accounts: [deployerPrivateKey],
      chainId: 0xa515, // 42261 - Emerald Testnet
    },
    emeraldMainnet: {
      url: "https://emerald.oasis.dev",
      accounts: [deployerPrivateKey],
      chainId: 0xa516, // 42262 - Emerald Mainnet
    },
  },
  
  // Configuration for hardhat-verify plugin
  etherscan: {
    apiKey: {
      // Standard networks
      mainnet: etherscanApiKey,
      sepolia: etherscanApiKey,
      arbitrumOne: etherscanApiKey,
      arbitrumSepolia: etherscanApiKey,
      optimisticEthereum: etherscanApiKey,
      optimisticSepolia: etherscanApiKey,
      polygon: etherscanApiKey,
      polygonAmoy: etherscanApiKey,
      // ✅ FIX #4: Add Oasis network API keys (when available)
      sapphireTestnet: "not-needed", // Oasis doesn't use etherscan
      sapphireMainnet: "not-needed", // Oasis doesn't use etherscan
      emeraldTestnet: "not-needed",
      emeraldMainnet: "not-needed",
    },
    customChains: [
      // ✅ FIX #5: Define custom Oasis Sapphire chains for verification
      {
        network: "sapphireTestnet",
        chainId: 0x5aff,
        urls: {
          apiURL: "https://testnet.explorer.sapphire.oasis.dev/api",
          browserURL: "https://testnet.explorer.sapphire.oasis.dev",
        },
      },
      {
        network: "sapphireMainnet",
        chainId: 0x5afe,
        urls: {
          apiURL: "https://explorer.sapphire.oasis.dev/api",
          browserURL: "https://explorer.sapphire.oasis.dev",
        },
      },
      {
        network: "emeraldTestnet",
        chainId: 0xa515,
        urls: {
          apiURL: "https://testnet.explorer.emerald.oasis.dev/api",
          browserURL: "https://testnet.explorer.emerald.oasis.dev",
        },
      },
      {
        network: "emeraldMainnet",
        chainId: 0xa516,
        urls: {
          apiURL: "https://explorer.emerald.oasis.dev/api",
          browserURL: "https://explorer.emerald.oasis.dev",
        },
      },
    ],
  },
  
  // Configuration for etherscan-verify from hardhat-deploy plugin
  verify: {
    etherscan: {
      apiKey: etherscanApiKey,
    },
  },
  sourcify: {
    enabled: false,
  },
};

// ✅ FIX #6: Add custom task for Sapphire deployment
task("deploy-sapphire", "Deploy contracts to Oasis Sapphire network")
  .addOptionalParam("network", "Network to deploy to", "sapphireTestnet")
  .setAction(async (taskArgs, hre) => {
    console.log(`🔐 Deploying to Oasis Sapphire ${taskArgs.network}...`);
    
    // Ensure we're connected to Sapphire network
    if (!hre.network.name.includes("sapphire")) {
      throw new Error(`❌ Not connected to Sapphire network. Current: ${hre.network.name}`);
    }
    
    console.log("✅ Connected to Sapphire TEE environment");
    console.log(`📡 Network: ${hre.network.name}`);
    console.log(`🔗 RPC: ${hre.network.config.url}`);
    console.log(`⛓️  Chain ID: ${hre.network.config.chainId}`);
    
    // Run deployment
    await hre.run("deploy", { network: taskArgs.network });
    
    console.log("🎉 Sapphire deployment completed!");
  });

// ✅ FIX #7: Add verification task for Sapphire contracts
task("verify-sapphire", "Verify contracts on Oasis Sapphire explorer")
  .addParam("contract", "Contract address to verify")
  .addOptionalParam("network", "Network to verify on", "sapphireTestnet")
  .setAction(async (taskArgs, hre) => {
    console.log(`🔍 Verifying contract on Oasis Sapphire ${taskArgs.network}...`);
    console.log(`📄 Contract: ${taskArgs.contract}`);
    
    try {
      await hre.run("verify:verify", {
        address: taskArgs.contract,
        network: taskArgs.network,
      });
      console.log("✅ Contract verification completed!");
    } catch (error) {
      console.error("❌ Verification failed:", error);
    }
  });

// Extend the original deploy task to include ABI generation
task("deploy").setAction(async (args, hre, runSuper) => {
  // Run the original deploy task
  await runSuper(args);
  
  // Force run the generateTsAbis script
  await generateTsAbis(hre);
  
  // Log deployment network info
  console.log(`📡 Deployed to network: ${hre.network.name}`);
  if (hre.network.name.includes("sapphire")) {
    console.log("🔐 TEE-protected deployment on Oasis Sapphire!");
  }
});

export default config;