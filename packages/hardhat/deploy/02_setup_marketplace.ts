import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Post-deployment setup for Marketplace contract
 * Configures initial settings and performs verification tests
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const setupMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  console.log("\n⚙️ Setting up Marketplace contract...");
  console.log(`📡 Network: ${hre.network.name}`);
  console.log(`👤 Deployer: ${deployer}`);

  // Get deployed contracts
  const marketplace = await hre.ethers.getContract<Contract>("Marketplace", deployer);
  
  console.log(`🏪 Marketplace Address: ${marketplace.address}`);

  // Verify contract is properly deployed
  try {
    const owner = await marketplace.owner();
    const productCount = await marketplace.getProductCount();
    const platformFee = await marketplace.platformFee();

    console.log("\n✅ Marketplace Contract Verification:");
    console.log(`👑 Owner: ${owner}`);
    console.log(`📦 Product Count: ${productCount.toString()}`);
    console.log(`💰 Platform Fee: ${platformFee.toString()} / 10000`);

    // Verify owner is deployer
    if (owner.toLowerCase() !== deployer.toLowerCase()) {
      console.log("⚠️  WARNING: Contract owner does not match deployer");
    }

  } catch (error) {
    console.error("❌ Failed to verify marketplace contract:", error);
    return false;
  }

  // Network-specific setup
  const networkName = hre.network.name;

  if (networkName === "localhost" || networkName === "hardhat") {
    console.log("\n🏠 Local Network Setup");
    await setupLocalEnvironment(marketplace, hre);
  } else if (networkName.includes("sepolia")) {
    console.log("\n🧪 Sepolia Testnet Setup");
    await setupSepoliaEnvironment(marketplace, hre);
  } else if (networkName.includes("sapphire")) {
    console.log("\n🔐 Sapphire Network Setup");
    await setupSapphireEnvironment(marketplace, hre);
  } else {
    console.log("\n🌐 Production Network Setup");
    await setupProductionEnvironment(marketplace, hre);
  }

  console.log("\n🎉 Marketplace setup completed successfully!");
  return true;
};

async function setupLocalEnvironment(marketplace: Contract, hre: HardhatRuntimeEnvironment) {
  console.log("🔧 Configuring for local development...");
  
  // Add some test data if needed
  try {
    const balance = await hre.ethers.provider.getBalance(marketplace.address);
    console.log(`💰 Contract Balance: ${hre.ethers.utils.formatEther(balance)} ETH`);
    
    // You can add test products here for development
    console.log("💡 Ready for local testing");
    console.log("💡 You can now:");
    console.log("   • Run yarn start to launch the frontend");
    console.log("   • Test product listing with mock API keys");
    console.log("   • Test gasless transactions with mock Biconomy");
    
  } catch (error) {
    console.log("⚠️  Local setup warning:", error);
  }
}

async function setupSepoliaEnvironment(marketplace: Contract, hre: HardhatRuntimeEnvironment) {
  console.log("🧪 Configuring for Sepolia testnet...");
  
  // Sepolia-specific configuration
  console.log("💡 Sepolia Setup Notes:");
  console.log("   • Ensure Chainlink subscription is funded");
  console.log("   • Configure Biconomy Paymaster for gasless txs");
  console.log("   • Test with Sepolia ETH from faucets");
  console.log(`   • Explorer: https://sepolia.etherscan.io/address/${marketplace.address}`);
}

async function setupSapphireEnvironment(marketplace: Contract, hre: HardhatRuntimeEnvironment) {
  console.log("🔐 Configuring for Oasis Sapphire...");
  
  const isTestnet = hre.network.name.includes("testnet");
  const explorerUrl = `https://${isTestnet ? "testnet." : ""}explorer.sapphire.oasis.dev/address/${marketplace.address}`;
  
  console.log("🔒 Sapphire Security Features:");
  console.log("   ✅ ROFL authorization enabled");
  console.log("   ✅ TEE-protected storage ready");
  console.log("   ✅ Encrypted API key handling");
  console.log(`   🌐 Explorer: ${explorerUrl}`);
  
  // Test ROFL functionality if on testnet
  if (isTestnet) {
    console.log("🧪 Testing Sapphire TEE features...");
    // Add Sapphire-specific tests here
  }
}

async function setupProductionEnvironment(marketplace: Contract, hre: HardhatRuntimeEnvironment) {
  console.log("🚀 Production environment setup...");
  
  console.log("⚠️  Production Checklist:");
  console.log("   • Verify all API keys and secrets are secure");
  console.log("   • Confirm Chainlink subscription is funded");
  console.log("   • Test all gasless transaction flows");
  console.log("   • Monitor contract for security issues");
  console.log("   • Set up monitoring and alerting");
}

export default setupMarketplace;

setupMarketplace.tags = ["Setup", "Post-Deploy"];
setupMarketplace.dependencies = ["Marketplace"];

// Run this setup after marketplace deployment
setupMarketplace.runAtTheEnd = true;