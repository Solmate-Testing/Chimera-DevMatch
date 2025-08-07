import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const CONTRACTS_DIR = path.join(__dirname, "../contracts");
const GENERATED_DIR = path.join(__dirname, "../../nextjs/contracts/generated");

function generateTsAbis(hre?: HardhatRuntimeEnvironment) {
  try {
    // Ensure the generated directory exists
    if (!fs.existsSync(GENERATED_DIR)) {
      fs.mkdirSync(GENERATED_DIR, { recursive: true });
    }

    // Get all compiled contract artifacts
    const artifactsDir = path.join(__dirname, "../artifacts/contracts");
    
    if (!fs.existsSync(artifactsDir)) {
      console.log("No contract artifacts found. Please compile contracts first.");
      return;
    }

    const contracts: any = {};
    
    // Read contract artifacts and generate TypeScript exports
    function processDirectory(dir: string, relativePath = "") {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.includes(".sol")) {
          processDirectory(fullPath, path.join(relativePath, item));
        } else if (item.endsWith(".json") && !item.includes(".dbg.json")) {
          const contractName = item.replace(".json", "");
          const artifactPath = fullPath;
          
          try {
            const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
            contracts[contractName] = {
              abi: artifact.abi,
              bytecode: artifact.bytecode,
              contractName,
            };
          } catch (error) {
            console.warn(`Warning: Could not process ${artifactPath}`);
          }
        }
      }
    }
    
    processDirectory(artifactsDir);

    // Generate index.ts with all contracts
    let indexContent = "// Auto-generated file. Do not edit.\n\n";
    
    for (const [contractName, contract] of Object.entries(contracts)) {
      const abiExport = `export const ${contractName.toLowerCase()}ABI = ${JSON.stringify(
        (contract as any).abi,
        null,
        2
      )} as const;\n\n`;
      
      indexContent += abiExport;
    }

    // Add convenience exports
    indexContent += "// Contract ABIs\n";
    indexContent += "export const contractsData = {\n";
    for (const contractName of Object.keys(contracts)) {
      indexContent += `  ${contractName}: {\n`;
      indexContent += `    abi: ${contractName.toLowerCase()}ABI,\n`;
      indexContent += `  },\n`;
    }
    indexContent += "} as const;\n\n";

    // Write the generated file
    fs.writeFileSync(path.join(GENERATED_DIR, "index.ts"), indexContent);
    
    console.log(`✅ Generated TypeScript ABIs for ${Object.keys(contracts).length} contracts`);
    console.log(`📁 Generated files in: ${GENERATED_DIR}`);
    
  } catch (error) {
    console.error("Error generating TypeScript ABIs:", error);
    throw error;
  }
}

export default generateTsAbis;

// Allow direct execution
if (require.main === module) {
  generateTsAbis();
}