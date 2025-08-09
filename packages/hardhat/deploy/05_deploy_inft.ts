import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploy INFT (ERC-7857) contract using LingSiewWin/ERC-7857 extension
 */
const deployINFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("🎯 Deploying INFT (ERC-7857) from LingSiewWin/ERC-7857 extension...");

  // Get OasisTEEVerifier address
  const teeVerifier = await hre.ethers.getContract("OasisTEEVerifier", deployer);
  const verifierAddress = await teeVerifier.getAddress();

  await deploy("INFT", {
    from: deployer,
    args: [
      "Chimera AI Agents", // name
      "CAI", // symbol  
      verifierAddress // data verifier
    ],
    log: true,
    autoMine: true,
  });

  const inftContract: Contract = await hre.ethers.getContract("INFT", deployer);
  console.log("✅ INFT deployed to:", await inftContract.getAddress());
  console.log("🔗 Using data verifier:", verifierAddress);
};

export default deployINFT;

deployINFT.tags = ["INFT"];
deployINFT.dependencies = ["OasisTEEVerifier"];