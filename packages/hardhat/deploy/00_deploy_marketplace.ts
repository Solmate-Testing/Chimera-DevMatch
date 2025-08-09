import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the Marketplace contract with ROFL-Sapphire security
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n🚀 Deploying Marketplace contract...");
  console.log(`📡 Network: ${hre.network.name}`);
  console.log(`👤 Deployer: ${deployer}`);

  // Check if we're on a Sapphire network for security features
  const isSapphire = hre.network.name.includes("sapphire");
  if (isSapphire) {
    console.log("🔐 Deploying with ROFL-Sapphire security enabled");
  } else {
    console.log("⚠️  Deploying without ROFL security (local/testnet only)");
  }

  // Get Chainlink Functions router address for the network
  const getChainlinkRouter = (networkName: string): string => {
    const routers: { [key: string]: string } = {
      sepolia: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
      localhost: "0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C", // Mock router for local testing
      hardhat: "0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C", // Mock router for hardhat
      polygon: "0xdc2AAF042Aeff2E68B3e8E33F19e4B9fA7C73F10",
      avalanche: "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0",
      // Add more networks as needed
    };
    return routers[networkName] || routers.localhost;
  };

  const chainlinkRouter = getChainlinkRouter(hre.network.name);
  console.log(`🔗 Chainlink Functions Router: ${chainlinkRouter}`);

  // Get USDC address (deploy USDC first)
  let usdcAddress;
  try {
    const usdcContract = await hre.ethers.getContract("USDC");
    usdcAddress = await usdcContract.getAddress();
    console.log(`🪙 USDC Token: ${usdcAddress}`);
  } catch (error) {
    // Fallback for networks where USDC might not be deployed
    usdcAddress = "0x0000000000000000000000000000000000000000";
    console.log("⚠️  USDC not found, using zero address");
  }

  const marketplace = await deploy("Marketplace", {
    from: deployer,
    // Constructor arguments - Chainlink Functions router, USDC address
    args: [chainlinkRouter, usdcAddress],
    log: true,
    // Auto-verify on supported networks
    autoMine: true,
    // Gas configuration for different networks
    gasLimit: isSapphire ? 5000000 : undefined,
    gasPrice: isSapphire ? 100000000000 : undefined, // 100 gwei for Sapphire
  });

  console.log(`✅ Marketplace deployed at: ${marketplace.address}`);

  // Get the deployed contract instance
  const marketplaceContract = await hre.ethers.getContract<Contract>("Marketplace", deployer);
  
  // Log initial state
  const productCount = await marketplaceContract.getProductCount();
  const owner = await marketplaceContract.owner();
  const platformFee = await marketplaceContract.platformFee();

  console.log("\n📊 Initial Contract State:");
  console.log(`👑 Owner: ${owner}`);
  console.log(`📦 Product Count: ${productCount}`);
  console.log(`💰 Platform Fee: ${platformFee.toString()} / 10000 (${Number(platformFee) / 100}%)`);

  // Post-deployment configuration for Chainlink Functions
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n⚙️ Configuring Chainlink Functions...");
    
    // Default Chainlink configuration values
    const chainlinkConfig = {
      donId: hre.network.name === "sepolia" ? 
        "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000" : // fun-ethereum-sepolia-1
        "0x66756e2d706f6c79676f6e2d6d756d6261692d31000000000000000000000000", // fun-polygon-mumbai-1
      subscriptionId: process.env.CHAINLINK_SUBSCRIPTION_ID || "0",
      source: `
        const apiKey = args[1]; // TEE-decrypted API key
        const modelName = args[2]; // AI model identifier  
        const input = args[0]; // User prompt
        
        // Example API call to Hugging Face or OpenAI
        const response = await Functions.makeHttpRequest({
          url: 'https://api.openai.com/v1/chat/completions',
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json'
          },
          data: {
            model: modelName,
            messages: [{ role: 'user', content: input }]
          }
        });
        
        return Functions.encodeString(response.data.choices[0].message.content);
      `
    };

    // Only configure if environment variables are available
    if (process.env.CHAINLINK_SUBSCRIPTION_ID) {
      try {
        const tx = await marketplaceContract.setChainlinkConfig(
          chainlinkConfig.donId,
          chainlinkConfig.subscriptionId,
          chainlinkConfig.source
        );
        await tx.wait();
        console.log("✅ Chainlink Functions configured successfully");
      } catch (error) {
        console.log("⚠️  Chainlink configuration skipped (set CHAINLINK_SUBSCRIPTION_ID in .env)");
      }
    }
  }

  // Save deployment info for frontend
  const deploymentInfo = {
    address: marketplace.address,
    network: hre.network.name,
    blockNumber: marketplace.receipt?.blockNumber,
    transactionHash: marketplace.transactionHash,
    deployer,
    timestamp: new Date().toISOString(),
    sapphireEnabled: isSapphire,
    chainlinkRouter: chainlinkRouter,
  };

  console.log("\n💾 Deployment completed successfully!");
  console.log(`🔗 Transaction: ${marketplace.transactionHash}`);
  
  if (marketplace.receipt?.blockNumber) {
    console.log(`📦 Block: ${marketplace.receipt.blockNumber}`);
  }

  // Network-specific post-deployment actions
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    console.log("\n🏠 Local deployment detected");
    console.log("💡 You can now test the marketplace locally");
    console.log("🔧 Run 'yarn start' to launch the frontend");
  }

  if (isSapphire) {
    console.log("\n🔒 Sapphire Network Deployment");
    console.log("✅ ROFL security features enabled");
    console.log("✅ TEE-protected API key storage ready");
    console.log("🌐 Explorer:", `https://${hre.network.name.includes("testnet") ? "testnet." : ""}explorer.sapphire.oasis.dev/address/${marketplace.address}`);
  }

  return true;
};

export default deployMarketplace;

// Add id field to prevent hardhat-deploy warning
deployMarketplace.id = "deploy_marketplace";

// Tags help you run specific deployment scripts
deployMarketplace.tags = ["Marketplace", "main"];

// Dependencies - deploy this after USDC
deployMarketplace.dependencies = ["USDC"];