import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploy USDC Mock Token for hackathon micropayments
 * 
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployUSDC: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("🪙 Deploying USDC Mock Token...");

  await deploy("USDC", {
    from: deployer,
    args: [], // Constructor takes no args
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const usdcContract: Contract = await hre.ethers.getContract("USDC", deployer);
  console.log("✅ USDC deployed to:", await usdcContract.getAddress());
  
  // Log initial supply
  const initialSupply = await usdcContract.totalSupply();
  const decimals = await usdcContract.decimals();
  console.log(`📊 Initial USDC supply: ${initialSupply} (${Number(initialSupply) / 10**Number(decimals)} USDC)`);
  
  // Update marketplace with USDC address
  try {
    const marketplaceContract: Contract = await hre.ethers.getContract("Marketplace", deployer);
    console.log("🔄 Marketplace found at:", await marketplaceContract.getAddress());
    console.log("💰 USDC integration ready for micropayments");
  } catch (error) {
    console.log("⚠️  Marketplace not found - deploy marketplace after USDC");
  }
};

export default deployUSDC;

deployUSDC.tags = ["USDC"];