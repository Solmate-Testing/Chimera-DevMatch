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
const providerApiKey = process.env.ALCHEMY_API_KEY || "alchemy_api_key";
const deployerPrivateKey =
  process.env.DEPLOYER_PRIVATE_KEY ?? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "etherscan_api_key";

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
    // ========================================
    // 🏠 LOCAL DEVELOPMENT NETWORKS
    // ========================================
    hardhat: {
      // Forking disabled by default for faster local development
      // Uncomment below if you need mainnet forking for testing
      // forking: {
      //   url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
      //   enabled: process.env.MAINNET_FORKING_ENABLED === "true",
      // },
    },
    
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [deployerPrivateKey],
    },

    // ========================================
    // 🧪 TESTNET NETWORKS (ACTIVE)
    // ========================================
    
    // Ethereum Testnets
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
      gasPrice: 20000000000, // 20 gwei
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
      gasPrice: 20000000000, // 20 gwei
    },
    
    // Arbitrum Testnets
    arbitrumSepolia: {
      url: `https://arb-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
      gasPrice: 100000000, // 0.1 gwei
    },
    arbitrumGoerli: {
      url: `https://arb-goerli.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
      gasPrice: 100000000, // 0.1 gwei
    },
    
    // Optimism Testnets
    optimismSepolia: {
      url: `https://opt-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
      gasPrice: 1000000, // 0.001 gwei
    },
    optimismGoerli: {
      url: `https://opt-goerli.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
      gasPrice: 1000000, // 0.001 gwei
    },
    
    // Polygon Testnets
    polygonAmoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
      gasPrice: 30000000000, // 30 gwei
    },
    polygonMumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
      gasPrice: 30000000000, // 30 gwei
    },
    polygonZkEvmCardona: {
      url: `https://polygonzkevm-cardona.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
      gasPrice: 1000000000, // 1 gwei
    },
    
    // Base Testnets
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [deployerPrivateKey],
      gasPrice: 1000000000, // 1 gwei
    },
    baseGoerli: {
      url: "https://goerli.base.org",
      accounts: [deployerPrivateKey],
      gasPrice: 1000000000, // 1 gwei
    },
    
    // Other Testnets
    scrollSepolia: {
      url: "https://sepolia-rpc.scroll.io",
      accounts: [deployerPrivateKey],
      gasPrice: 1000000000, // 1 gwei
    },
    chiado: {
      url: "https://rpc.chiadochain.net", // Gnosis testnet
      accounts: [deployerPrivateKey],
      gasPrice: 1000000000, // 1 gwei
    },
    celoAlfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: [deployerPrivateKey],
      gasPrice: 1000000000, // 1 gwei
    },

    // Oasis Sapphire Testnet (TEE blockchain)
    sapphireTestnet: {
      url: process.env.OASIS_SAPPHIRE_RPC || "https://testnet.sapphire.oasis.dev",
      accounts: [deployerPrivateKey],
      chainId: 0x5aff, // 23295 - Sapphire Testnet chain ID
      gasPrice: 100000000000, // 100 gwei - recommended for Sapphire
    },
    
    // Oasis Emerald Testnet
    emeraldTestnet: {
      url: "https://testnet.emerald.oasis.dev",
      accounts: [deployerPrivateKey],
      chainId: 0xa515, // 42261 - Emerald Testnet
      gasPrice: 100000000000, // 100 gwei
    },

    // ========================================
    // 🚀 MAINNET NETWORKS (COMMENTED OUT FOR SAFETY)
    // ⚠️ WARNING: Uncomment only when ready for production deployment
    // ⚠️ WARNING: Ensure you have real tokens before deploying to mainnet
    // ========================================
    
    // // Ethereum Mainnet
    // mainnet: {
    //   url: "https://mainnet.rpc.buidlguidl.com",
    //   accounts: [deployerPrivateKey],
    //   gasPrice: 20000000000, // 20 gwei (adjust based on network conditions)
    // },
    
    // // Arbitrum Mainnet
    // arbitrum: {
    //   url: `https://arb-mainnet.g.alchemy.com/v2/${providerApiKey}`,
    //   accounts: [deployerPrivateKey],
    //   gasPrice: 100000000, // 0.1 gwei
    // },
    
    // // Optimism Mainnet
    // optimism: {
    //   url: `https://opt-mainnet.g.alchemy.com/v2/${providerApiKey}`,
    //   accounts: [deployerPrivateKey],
    //   gasPrice: 1000000, // 0.001 gwei
    // },
    
    // // Polygon Mainnet
    // polygon: {
    //   url: `https://polygon-mainnet.g.alchemy.com/v2/${providerApiKey}`,
    //   accounts: [deployerPrivateKey],
    //   gasPrice: 30000000000, // 30 gwei
    // },
    
    // // Polygon zkEVM Mainnet
    // polygonZkEvm: {
    //   url: `https://polygonzkevm-mainnet.g.alchemy.com/v2/${providerApiKey}`,
    //   accounts: [deployerPrivateKey],
    //   gasPrice: 1000000000, // 1 gwei
    // },
    
    // // Base Mainnet
    // base: {
    //   url: "https://mainnet.base.org",
    //   accounts: [deployerPrivateKey],
    //   gasPrice: 1000000000, // 1 gwei
    // },
    
    // // Scroll Mainnet
    // scroll: {
    //   url: "https://rpc.scroll.io",
    //   accounts: [deployerPrivateKey],
    //   gasPrice: 1000000000, // 1 gwei
    // },
    
    // // Gnosis Mainnet
    // gnosis: {
    //   url: "https://rpc.gnosischain.com",
    //   accounts: [deployerPrivateKey],
    //   gasPrice: 1000000000, // 1 gwei
    // },
    
    // // Celo Mainnet
    // celo: {
    //   url: "https://forno.celo.org",
    //   accounts: [deployerPrivateKey],
    //   gasPrice: 1000000000, // 1 gwei
    // },
    
    // // Oasis Sapphire Mainnet (TEE blockchain)
    // sapphireMainnet: {
    //   url: "https://sapphire.oasis.dev",
    //   accounts: [deployerPrivateKey],
    //   chainId: 0x5afe, // 23294 - Sapphire Mainnet chain ID
    //   gasPrice: 100000000000, // 100 gwei - recommended for Sapphire
    // },
    
    // // Oasis Emerald Mainnet
    // emeraldMainnet: {
    //   url: "https://emerald.oasis.dev",
    //   accounts: [deployerPrivateKey],
    //   chainId: 0xa516, // 42262 - Emerald Mainnet
    //   gasPrice: 100000000000, // 100 gwei
    // },
  },
  
  // Configuration for hardhat-verify plugin
  etherscan: {
    apiKey: {
      // ========================================
      // 🧪 TESTNET API KEYS (ACTIVE)
      // ========================================
      
      // Ethereum Testnets
      sepolia: etherscanApiKey,
      goerli: etherscanApiKey,
      
      // Arbitrum Testnets
      arbitrumSepolia: etherscanApiKey,
      arbitrumGoerli: etherscanApiKey,
      
      // Optimism Testnets
      optimisticSepolia: etherscanApiKey,
      optimisticGoerli: etherscanApiKey,
      
      // Polygon Testnets
      polygonAmoy: etherscanApiKey,
      polygonMumbai: etherscanApiKey,
      
      // Base Testnets
      baseSepolia: etherscanApiKey,
      baseGoerli: etherscanApiKey,
      
      // Oasis Networks (don't use etherscan-style verification)
      sapphireTestnet: "not-needed", // Uses Oasis explorer
      emeraldTestnet: "not-needed", // Uses Oasis explorer
      
      // ========================================
      // 🚀 MAINNET API KEYS (COMMENTED OUT FOR SAFETY)
      // ========================================
      
      // // Ethereum Mainnet
      // mainnet: etherscanApiKey,
      
      // // Arbitrum Mainnet
      // arbitrumOne: etherscanApiKey,
      
      // // Optimism Mainnet
      // optimisticEthereum: etherscanApiKey,
      
      // // Polygon Mainnet
      // polygon: etherscanApiKey,
      
      // // Base Mainnet
      // base: etherscanApiKey,
      
      // // Oasis Mainnet
      // sapphireMainnet: "not-needed",
      // emeraldMainnet: "not-needed",
    },
    customChains: [
      // ========================================
      // 🧪 TESTNET CUSTOM CHAINS (ACTIVE)
      // ========================================
      
      // Oasis Sapphire Testnet
      {
        network: "sapphireTestnet",
        chainId: 0x5aff, // 23295
        urls: {
          apiURL: "https://testnet.explorer.sapphire.oasis.dev/api",
          browserURL: "https://testnet.explorer.sapphire.oasis.dev",
        },
      },
      
      // Oasis Emerald Testnet
      {
        network: "emeraldTestnet",
        chainId: 0xa515, // 42261
        urls: {
          apiURL: "https://testnet.explorer.emerald.oasis.dev/api",
          browserURL: "https://testnet.explorer.emerald.oasis.dev",
        },
      },
      
      // ========================================
      // 🚀 MAINNET CUSTOM CHAINS (COMMENTED OUT FOR SAFETY)
      // ========================================
      
      // // Oasis Sapphire Mainnet
      // {
      //   network: "sapphireMainnet",
      //   chainId: 0x5afe, // 23294
      //   urls: {
      //     apiURL: "https://explorer.sapphire.oasis.dev/api",
      //     browserURL: "https://explorer.sapphire.oasis.dev",
      //   },
      // },
      
      // // Oasis Emerald Mainnet
      // {
      //   network: "emeraldMainnet",
      //   chainId: 0xa516, // 42262
      //   urls: {
      //     apiURL: "https://explorer.emerald.oasis.dev/api",
      //     browserURL: "https://explorer.emerald.oasis.dev",
      //   },
      // },
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

// ✅ Custom task for Sapphire testnet deployment
task("deploy-sapphire", "Deploy contracts to Oasis Sapphire TESTNET")
  .addOptionalParam("targetNetwork", "Network to deploy to", "sapphireTestnet")
  .setAction(async (taskArgs, hre) => {
    // Safety check - only allow testnet
    if (taskArgs.targetNetwork === "sapphireMainnet") {
      console.log("🚫 MAINNET DEPLOYMENT BLOCKED FOR SAFETY");
      console.log("⚠️  To deploy to mainnet, uncomment mainnet configurations in hardhat.config.ts");
      console.log("⚠️  and ensure you have real tokens!");
      return;
    }
    
    console.log(`🔐 Deploying to Oasis Sapphire ${taskArgs.targetNetwork}...`);
    
    // Ensure we're connected to Sapphire network
    if (!hre.network.name.includes("sapphire")) {
      throw new Error(`❌ Not connected to Sapphire network. Current: ${hre.network.name}`);
    }
    
    if (hre.network.name.includes("testnet")) {
      console.log("✅ Connected to Sapphire TESTNET - Safe to deploy!");
    }
    
    console.log("✅ Connected to Sapphire TEE environment");
    console.log(`📡 Network: ${hre.network.name}`);
    console.log(`🔗 RPC: ${hre.network.config.url}`);
    console.log(`⛓️  Chain ID: ${hre.network.config.chainId}`);
    
    // Run deployment
    await hre.run("deploy", { targetNetwork: taskArgs.targetNetwork });
    
    console.log("🎉 Sapphire testnet deployment completed!");
  });

// ✅ FIX #7: Add verification task for Sapphire contracts
task("verify-sapphire", "Verify contracts on Oasis Sapphire explorer")
  .addParam("contract", "Contract address to verify")
  .addOptionalParam("targetNetwork", "Network to verify on", "sapphireTestnet")
  .setAction(async (taskArgs, hre) => {
    console.log(`🔍 Verifying contract on Oasis Sapphire ${taskArgs.targetNetwork}...`);
    console.log(`📄 Contract: ${taskArgs.contract}`);
    
    try {
      await hre.run("verify:verify", {
        address: taskArgs.contract,
        targetNetwork: taskArgs.targetNetwork,
      });
      console.log("✅ Contract verification completed!");
    } catch (error) {
      console.error("❌ Verification failed:", error);
    }
  });

// Add safety check to main deploy task
task("deploy").setAction(async (args, hre, runSuper) => {
  // Safety check for mainnet deployment
  const mainnetNetworks = ["mainnet", "arbitrum", "optimism", "polygon", "base", "scroll", "gnosis", "celo", "sapphireMainnet", "emeraldMainnet"];
  const isMainnet = mainnetNetworks.some(net => hre.network.name.includes(net) && !hre.network.name.includes("testnet") && !hre.network.name.includes("goerli") && !hre.network.name.includes("sepolia"));
  
  if (isMainnet) {
    console.log("🚫 MAINNET DEPLOYMENT DETECTED!");
    console.log("⚠️  This appears to be a mainnet network. Deployment blocked for safety.");
    console.log("⚠️  If you want to deploy to mainnet:");
    console.log("   1. Uncomment mainnet configurations in hardhat.config.ts");
    console.log("   2. Ensure you have real tokens for deployment");
    console.log("   3. Double-check all contract code");
    console.log("   4. Remove this safety check");
    return;
  }

  // Display network info
  console.log(`\n🚀 Deploying to: ${hre.network.name.toUpperCase()}`);
  if (hre.network.name.includes("testnet") || hre.network.name.includes("sepolia") || hre.network.name.includes("goerli") || hre.network.name === "localhost") {
    console.log("✅ TESTNET DEPLOYMENT - Safe to proceed!");
  }
  
  // Run the original deploy task
  await runSuper(args);
  
  // Force run the generateTsAbis script
  await generateTsAbis(hre);
  
  // Log deployment network info
  console.log(`📡 Successfully deployed to: ${hre.network.name}`);
  if (hre.network.name.includes("sapphire")) {
    console.log("🔐 TEE-protected deployment on Oasis Sapphire!");
  }
  
  // Show explorer links for verification
  showExplorerLinks(hre.network.name);
});

// Helper function to show explorer links
function showExplorerLinks(networkName: string) {
  const explorers: { [key: string]: string } = {
    sepolia: "https://sepolia.etherscan.io",
    goerli: "https://goerli.etherscan.io",
    arbitrumSepolia: "https://sepolia.arbiscan.io",
    arbitrumGoerli: "https://goerli.arbiscan.io",
    optimismSepolia: "https://sepolia-optimism.etherscan.io",
    optimismGoerli: "https://goerli-optimism.etherscan.io",
    polygonAmoy: "https://amoy.polygonscan.com",
    polygonMumbai: "https://mumbai.polygonscan.com",
    baseSepolia: "https://sepolia.basescan.org",
    baseGoerli: "https://goerli.basescan.org",
    sapphireTestnet: "https://testnet.explorer.sapphire.oasis.dev",
    emeraldTestnet: "https://testnet.explorer.emerald.oasis.dev",
  };
  
  const explorer = explorers[networkName];
  if (explorer) {
    console.log(`🌐 Explorer: ${explorer}`);
  }
}

// New task to list available testnet networks
task("list-networks", "List all available testnet networks")
  .setAction(async () => {
    console.log("\n🧪 AVAILABLE TESTNET NETWORKS:");
    console.log("================================");
    
    console.log("\n🏠 Local Development:");
    console.log("  • localhost       - Local Hardhat node");
    console.log("  • hardhat         - Hardhat Network");
    
    console.log("\n⚡ Ethereum Testnets:");
    console.log("  • sepolia         - Ethereum Sepolia Testnet");
    console.log("  • goerli          - Ethereum Goerli Testnet");
    
    console.log("\n🔵 Layer 2 Testnets:");
    console.log("  • arbitrumSepolia - Arbitrum Sepolia Testnet");
    console.log("  • arbitrumGoerli  - Arbitrum Goerli Testnet");
    console.log("  • optimismSepolia - Optimism Sepolia Testnet");
    console.log("  • optimismGoerli  - Optimism Goerli Testnet");
    console.log("  • baseSepolia     - Base Sepolia Testnet");
    console.log("  • baseGoerli      - Base Goerli Testnet");
    console.log("  • scrollSepolia   - Scroll Sepolia Testnet");
    
    console.log("\n🟣 Polygon Testnets:");
    console.log("  • polygonAmoy     - Polygon Amoy Testnet");
    console.log("  • polygonMumbai   - Polygon Mumbai Testnet");
    console.log("  • polygonZkEvmCardona - Polygon zkEVM Cardona Testnet");
    
    console.log("\n🔐 Oasis Testnets (TEE):");
    console.log("  • sapphireTestnet - Oasis Sapphire Testnet (TEE blockchain)");
    console.log("  • emeraldTestnet  - Oasis Emerald Testnet");
    
    console.log("\n🌐 Other Testnets:");
    console.log("  • chiado          - Gnosis Chiado Testnet");
    console.log("  • celoAlfajores   - Celo Alfajores Testnet");
    
    console.log("\n💡 Usage Examples:");
    console.log("  yarn deploy --network sepolia");
    console.log("  yarn deploy --network sapphireTestnet");
    console.log("  yarn deploy-sapphire --target-network sapphireTestnet");
    
    console.log("\n⚠️  MAINNET NETWORKS ARE COMMENTED OUT FOR SAFETY");
    console.log("   To deploy to mainnet, modify hardhat.config.ts");
  });

export default config;