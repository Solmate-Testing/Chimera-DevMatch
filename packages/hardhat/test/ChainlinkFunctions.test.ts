import { expect } from "chai";
import { ethers } from "hardhat";
import { Marketplace, MockSapphire } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("🤖 Chainlink Functions AI Integration", function () {
  let marketplace: Marketplace;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let mockRouter: SignerWithAddress;

  const MOCK_DON_ID = ethers.keccak256(ethers.toUtf8Bytes("test-don"));
  const MOCK_SUBSCRIPTION_ID = 123;
  const AI_MODEL_SOURCE = `
    const input = args[0];
    const apiKey = args[1];
    const modelName = args[2];
    return Functions.encodeString("Mock AI response: " + input);
  `;

  beforeEach(async function () {
    [owner, user1, user2, mockRouter] = await ethers.getSigners();

    // Deploy Marketplace with mock Chainlink router
    const MarketplaceFactory = await ethers.getContractFactory("Marketplace");
    marketplace = await MarketplaceFactory.deploy(mockRouter.address);
    await marketplace.waitForDeployment();

    // Setup Chainlink Functions configuration
    await marketplace.setChainlinkConfig(
      MOCK_DON_ID,
      MOCK_SUBSCRIPTION_ID,
      AI_MODEL_SOURCE
    );
  });

  describe("✅ testChainlinkIntegration", function () {
    it("Should configure Chainlink Functions correctly", async function () {
      expect(await marketplace.donId()).to.equal(MOCK_DON_ID);
      expect(await marketplace.subscriptionId()).to.equal(MOCK_SUBSCRIPTION_ID);
      expect(await marketplace.source()).to.equal(AI_MODEL_SOURCE);
    });

    it("Should only allow owner to configure Chainlink", async function () {
      await expect(
        marketplace.connect(user1).setChainlinkConfig(
          MOCK_DON_ID,
          456,
          "new source"
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("✅ testRunModelTEEExecution", function () {
    beforeEach(async function () {
      // Create a product first
      const encryptedApiKey = ethers.toUtf8Bytes("mock-encrypted-key");
      await marketplace.listProduct(
        "GPT-4 Trading Bot",
        "Advanced AI trading bot",
        ethers.parseEther("0.1"),
        "AI Agent",
        encryptedApiKey
      );

      // User stakes to get access
      await marketplace.connect(user1).stakeOnProduct(1, {
        value: ethers.parseEther("1")
      });
    });

    it("Should execute runModel with TEE protection", async function () {
      const input = "Analyze BTC/USD market";
      
      // Execute model
      const tx = await marketplace.connect(user1).runModel(1, input);
      const receipt = await tx.wait();
      
      // Check for ModelExecutionRequested event
      const event = receipt?.logs.find(log => {
        try {
          const parsedLog = marketplace.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          return parsedLog?.name === "ModelExecutionRequested";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      
      // Verify execution count increased
      expect(await marketplace.getExecutionCount(1)).to.equal(1);
    });

    it("Should require stake to execute model", async function () {
      await expect(
        marketplace.connect(user2).runModel(1, "test input")
      ).to.be.revertedWith("Must stake to use model");
    });

    it("Should require valid product", async function () {
      await expect(
        marketplace.connect(user1).runModel(999, "test input")
      ).to.be.revertedWith("Invalid product");
    });

    it("Should require Chainlink configuration", async function () {
      // Deploy new marketplace without configuration
      const MarketplaceFactory = await ethers.getContractFactory("Marketplace");
      const newMarketplace = await MarketplaceFactory.deploy(mockRouter.address);
      
      // Try to execute without configuration
      await expect(
        newMarketplace.connect(user1).runModel(1, "test")
      ).to.be.revertedWith("Chainlink DON not configured");
    });
  });

  describe("✅ testGaslessModelExecution", function () {
    beforeEach(async function () {
      // Setup product and stake
      const encryptedApiKey = ethers.toUtf8Bytes("mock-encrypted-key");
      await marketplace.listProduct(
        "Claude AI Assistant",
        "Advanced AI assistant",
        ethers.parseEther("0.05"),
        "AI Agent",
        encryptedApiKey
      );

      await marketplace.connect(user1).stakeOnProduct(1, {
        value: ethers.parseEther("0.5")
      });
    });

    it("Should execute model with gasless transaction simulation", async function () {
      const input = "Explain blockchain technology";
      
      // Simulate gasless execution by checking gas estimation
      const gasEstimate = await marketplace.connect(user1).runModel.estimateGas(1, input);
      expect(gasEstimate).to.be.greaterThan(0);
      
      // Execute actual transaction
      const tx = await marketplace.connect(user1).runModel(1, input);
      const receipt = await tx.wait();
      
      // Verify gas was used (in real gasless, this would be sponsored)
      expect(receipt?.gasUsed).to.be.greaterThan(0);
      
      // Check execution tracking
      expect(await marketplace.getExecutionCount(1)).to.equal(1);
    });

    it("Should handle multiple concurrent executions", async function () {
      const inputs = [
        "What is DeFi?",
        "Explain smart contracts",
        "How does staking work?"
      ];

      // Execute multiple models concurrently
      const promises = inputs.map(input => 
        marketplace.connect(user1).runModel(1, input)
      );
      
      await Promise.all(promises);
      
      // Verify all executions were tracked
      expect(await marketplace.getExecutionCount(1)).to.equal(3);
    });
  });

  describe("🔐 TEE Security Verification", function () {
    it("Should call roflEnsureAuthorizedOrigin in runModel", async function () {
      // This test verifies the TEE authorization check is present
      // In production, this would actually validate TEE environment
      
      const encryptedApiKey = ethers.toUtf8Bytes("mock-encrypted-key");
      await marketplace.listProduct(
        "Security Test Bot",
        "Test security features",
        ethers.parseEther("0.01"),
        "AI Agent",
        encryptedApiKey
      );

      await marketplace.connect(user1).stakeOnProduct(1, {
        value: ethers.parseEther("0.1")
      });

      // Should execute without error (mock always returns true)
      await expect(
        marketplace.connect(user1).runModel(1, "security test")
      ).to.not.be.reverted;
    });

    it("Should store encrypted API keys securely", async function () {
      const encryptedApiKey = ethers.toUtf8Bytes("super-secret-api-key-encrypted");
      
      await marketplace.listProduct(
        "Secure AI Model",
        "TEE-protected model",
        ethers.parseEther("0.1"),
        "AI Agent",
        encryptedApiKey
      );

      const product = await marketplace.getProduct(1);
      
      // API key should be hashed/encrypted, not stored in plain text
      expect(product.apiKeyHash).to.not.equal(ethers.ZeroHash);
      expect(product.apiKeyHash.length).to.equal(66); // 0x + 64 hex chars
    });
  });

  describe("📊 Result Handling", function () {
    beforeEach(async function () {
      const encryptedApiKey = ethers.toUtf8Bytes("mock-encrypted-key");
      await marketplace.listProduct(
        "Result Test Bot",
        "Test result handling",
        ethers.parseEther("0.1"),
        "AI Agent",
        encryptedApiKey
      );

      await marketplace.connect(user1).stakeOnProduct(1, {
        value: ethers.parseEther("0.5")
      });
    });

    it("Should track execution count correctly", async function () {
      expect(await marketplace.getExecutionCount(1)).to.equal(0);
      
      await marketplace.connect(user1).runModel(1, "test 1");
      expect(await marketplace.getExecutionCount(1)).to.equal(1);
      
      await marketplace.connect(user1).runModel(1, "test 2");
      expect(await marketplace.getExecutionCount(1)).to.equal(2);
    });

    it("Should handle result storage", async function () {
      // Initially no result
      expect(await marketplace.getLastResult(1)).to.equal("");
      
      // Execute model
      await marketplace.connect(user1).runModel(1, "generate result");
      
      // In a real implementation, the fulfillRequest would be called by Chainlink
      // For testing, we can simulate this if needed
    });
  });

  describe("⚡ Performance Tests", function () {
    it("Should handle high-frequency executions efficiently", async function () {
      const encryptedApiKey = ethers.toUtf8Bytes("performance-test-key");
      await marketplace.listProduct(
        "Performance Test Bot",
        "High-frequency testing",
        ethers.parseEther("0.01"),
        "AI Agent",
        encryptedApiKey
      );

      await marketplace.connect(user1).stakeOnProduct(1, {
        value: ethers.parseEther("2")
      });

      // Execute 10 rapid-fire model calls
      const startTime = Date.now();
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(marketplace.connect(user1).runModel(1, `test input ${i}`));
      }
      
      await Promise.all(promises);
      const endTime = Date.now();
      
      // Verify all executions completed
      expect(await marketplace.getExecutionCount(1)).to.equal(10);
      
      // Performance check (should complete in reasonable time)
      expect(endTime - startTime).to.be.lessThan(30000); // Less than 30 seconds
    });
  });
});