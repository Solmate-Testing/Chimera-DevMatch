import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys ERC-7857 AI Agents system with TEE verification
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployERC7857: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;

  log("----------------------------------------------------");
  log("🤖 Deploying ERC-7857 AI Agents system...");

  // Deploy TEE Verifier first
  const teeVerifier = await deploy("OasisTEEVerifier", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  log(`✅ OasisTEEVerifier deployed at: ${teeVerifier.address}`);

  // Deploy ERC-7857 AI Agents contract
  const aiAgents = await deploy("ERC7857AIAgents", {
    from: deployer,
    args: [teeVerifier.address],
    log: true,
    autoMine: true,
  });

  log(`✅ ERC7857AIAgents deployed at: ${aiAgents.address}`);

  // Get deployed contracts for verification
  const teeVerifierContract = await hre.ethers.getContract("OasisTEEVerifier", deployer);
  const aiAgentsContract = await hre.ethers.getContract("ERC7857AIAgents", deployer);

  log("----------------------------------------------------");
  log("🔍 Verifying ERC-7857 deployment...");

  try {
    // Verify TEE verifier is working
    const verifierAddress = await aiAgentsContract.getVerifier();
    log(`✅ Verifier address: ${verifierAddress}`);
    log(`✅ Expected address: ${teeVerifier.address}`);
    
    if (verifierAddress.toLowerCase() !== teeVerifier.address.toLowerCase()) {
      throw new Error(`Verifier address mismatch! Got ${verifierAddress}, expected ${teeVerifier.address}`);
    }

    // Verify contract metadata
    const name = await aiAgentsContract.name();
    const symbol = await aiAgentsContract.symbol();
    log(`✅ Collection: ${name} (${symbol})`);

    // Verify total supply starts at 0
    const totalSupply = await aiAgentsContract.totalSupply();
    log(`✅ Initial supply: ${totalSupply}`);

    log("✅ ERC-7857 system deployed and verified successfully!");

  } catch (error) {
    log(`❌ Verification failed: ${error}`);
    throw error;
  }

  log("----------------------------------------------------");
  log("📋 ERC-7857 Integration Guide:");
  log("");
  log("1. Mint AI Agent NFT:");
  log("   - Generate TEE ownership proofs for agent data");
  log("   - Call aiAgents.mint(proofs, descriptions, name, category, isPublic)");
  log("");
  log("2. Transfer Agent:");
  log("   - Generate TEE transfer validity proofs");
  log("   - Call aiAgents.transfer(to, tokenId, proofs)");
  log("");
  log("3. Marketplace Integration:");
  log("   - Stake: aiAgents.stakeOnAgent(tokenId) with ETH");
  log("   - Love: aiAgents.loveAgent(tokenId)");
  log("   - Query: aiAgents.getAgentData(tokenId)");
  log("");
  log("🔐 Security Notes:");
  log("- All critical operations require TEE verification");
  log("- Private agent data protected through TEE encryption");
  log("- Proof verification prevents unauthorized operations");
  log("----------------------------------------------------");
};

export default deployERC7857;

// Add id field to prevent hardhat-deploy warning
deployERC7857.id = "deploy_erc7857";

// Tags are useful if you have multiple deploy files and only want to run one of them.
deployERC7857.tags = ["ERC7857AIAgents", "OasisTEEVerifier"];