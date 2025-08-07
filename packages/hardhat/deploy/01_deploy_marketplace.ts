import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Mock addresses for hackathon - replace with real ones
  const FUNCTIONS_ROUTER = "0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C"; // Sepolia
  const PAYMENT_TOKEN = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // Original comment ETH,I replace with Sepholia link token address

  const marketplace = await deploy("Marketplace", {
    from: deployer,
    args: [FUNCTIONS_ROUTER, PAYMENT_TOKEN],
    log: true,
    autoMine: true,
  });

  console.log(`Marketplace deployed to: ${marketplace.address}`);
};

export default deployMarketplace;
deployMarketplace.tags = ["Marketplace"];
