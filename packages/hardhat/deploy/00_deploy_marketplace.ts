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

  const marketplace = await deploy("Marketplace", {
    from: deployer,
    // Constructor arguments
    args: [],
    log: true,
    // Auto-verify on supported networks
    autoMine: true,
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

  // Save deployment info for frontend
  const deploymentInfo = {
    address: marketplace.address,
    network: hre.network.name,
    blockNumber: marketplace.receipt?.blockNumber,
    transactionHash: marketplace.transactionHash,
    deployer,
    timestamp: new Date().toISOString(),
    sapphireEnabled: isSapphire,
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

// Tags help you run specific deployment scripts
deployMarketplace.tags = ["Marketplace", "main"];

// Dependencies - deploy this after any prerequisite contracts
deployMarketplace.dependencies = [];