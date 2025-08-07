import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Marketplace", function () {
  let marketplace: Contract;
  let owner: HardhatEthersSigner;
  let creator: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;

  const mockEncryptedApiKey = ethers.utils.toUtf8Bytes("encrypted-api-key-mock");

  beforeEach(async function () {
    [owner, creator, buyer] = await ethers.getSigners();

    const MarketplaceFactory = await ethers.getContractFactory("Marketplace");
    marketplace = await MarketplaceFactory.deploy();
    await marketplace.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it("Should start with zero products", async function () {
      expect(await marketplace.getProductCount()).to.equal(0);
    });

    it("Should have correct initial platform fee", async function () {
      expect(await marketplace.platformFee()).to.equal(250); // 2.5%
    });
  });

  describe("Product Listing", function () {
    it("Should list a product successfully (mock ROFL)", async function () {
      // Note: In local testing, ROFL functions are mocked/bypassed
      const productName = "Test AI Agent";
      const description = "A test AI agent for local development";
      const price = ethers.utils.parseEther("0.1");
      const category = "AI Agent";

      // This test assumes ROFL is mocked for local development
      await expect(
        marketplace.connect(creator).listProduct(
          productName,
          description,
          price,
          category,
          mockEncryptedApiKey
        )
      ).to.emit(marketplace, "ProductListed")
        .withArgs(1, creator.address, productName, price, category);

      const product = await marketplace.getProduct(1);
      expect(product.name).to.equal(productName);
      expect(product.creator).to.equal(creator.address);
      expect(product.price).to.equal(price);
      expect(product.active).to.be.true;
    });

    it("Should increment product count", async function () {
      await marketplace.connect(creator).listProduct(
        "Test Product",
        "Description",
        ethers.utils.parseEther("0.1"),
        "AI Agent",
        mockEncryptedApiKey
      );

      expect(await marketplace.getProductCount()).to.equal(1);
    });

    it("Should fail with empty name", async function () {
      await expect(
        marketplace.connect(creator).listProduct(
          "",
          "Description",
          ethers.utils.parseEther("0.1"),
          "AI Agent",
          mockEncryptedApiKey
        )
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should fail with zero price", async function () {
      await expect(
        marketplace.connect(creator).listProduct(
          "Test Product",
          "Description",
          0,
          "AI Agent",
          mockEncryptedApiKey
        )
      ).to.be.revertedWith("Price must be greater than 0");
    });
  });

  describe("Staking", function () {
    beforeEach(async function () {
      await marketplace.connect(creator).listProduct(
        "Test Product",
        "Description", 
        ethers.utils.parseEther("0.1"),
        "AI Agent",
        mockEncryptedApiKey
      );
    });

    it("Should allow staking on products", async function () {
      const stakeAmount = ethers.utils.parseEther("0.05");

      await expect(
        marketplace.connect(buyer).stakeOnProduct(1, { value: stakeAmount })
      ).to.emit(marketplace, "StakeAdded")
        .withArgs(1, buyer.address, stakeAmount);

      const userStake = await marketplace.getUserStake(1, buyer.address);
      expect(userStake).to.equal(stakeAmount);

      const product = await marketplace.getProduct(1);
      expect(product.totalStaked).to.equal(stakeAmount);
    });

    it("Should fail staking with zero value", async function () {
      await expect(
        marketplace.connect(buyer).stakeOnProduct(1, { value: 0 })
      ).to.be.revertedWith("Must stake > 0");
    });

    it("Should accumulate multiple stakes", async function () {
      const stakeAmount = ethers.utils.parseEther("0.01");

      await marketplace.connect(buyer).stakeOnProduct(1, { value: stakeAmount });
      await marketplace.connect(buyer).stakeOnProduct(1, { value: stakeAmount });

      const userStake = await marketplace.getUserStake(1, buyer.address);
      expect(userStake).to.equal(stakeAmount.mul(2));
    });
  });

  describe("Product Interaction", function () {
    beforeEach(async function () {
      await marketplace.connect(creator).listProduct(
        "Test Product",
        "Description",
        ethers.utils.parseEther("0.1"),
        "AI Agent", 
        mockEncryptedApiKey
      );
    });

    it("Should allow loving products", async function () {
      await expect(
        marketplace.connect(buyer).loveProduct(1)
      ).to.emit(marketplace, "ProductLoved")
        .withArgs(1, buyer.address);

      const product = await marketplace.getProduct(1);
      expect(product.loves).to.equal(1);
    });

    it("Should increment love count multiple times", async function () {
      await marketplace.connect(buyer).loveProduct(1);
      await marketplace.connect(creator).loveProduct(1);

      const product = await marketplace.getProduct(1);
      expect(product.loves).to.equal(2);
    });
  });

  describe("Platform Administration", function () {
    it("Should allow owner to set platform fee", async function () {
      const newFee = 500; // 5%

      await marketplace.connect(owner).setPlatformFee(newFee);
      expect(await marketplace.platformFee()).to.equal(newFee);
    });

    it("Should reject platform fee above 10%", async function () {
      const invalidFee = 1001; // 10.01%

      await expect(
        marketplace.connect(owner).setPlatformFee(invalidFee)
      ).to.be.revertedWith("Fee cannot exceed 10%");
    });

    it("Should reject non-owner fee changes", async function () {
      await expect(
        marketplace.connect(creator).setPlatformFee(500)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Contract Integration", function () {
    it("Should handle creator product tracking", async function () {
      await marketplace.connect(creator).listProduct(
        "Product 1",
        "Description 1",
        ethers.utils.parseEther("0.1"),
        "AI Agent",
        mockEncryptedApiKey
      );

      await marketplace.connect(creator).listProduct(
        "Product 2", 
        "Description 2",
        ethers.utils.parseEther("0.2"),
        "MCP",
        mockEncryptedApiKey
      );

      const creatorProducts = await marketplace.getCreatorProducts(creator.address);
      expect(creatorProducts.length).to.equal(2);
      expect(creatorProducts[0]).to.equal(1);
      expect(creatorProducts[1]).to.equal(2);
    });
  });

  // Mock ROFL functionality for local testing
  describe("Local Development Mocking", function () {
    it("Should explain ROFL mocking in local environment", async function () {
      // In a real Sapphire environment, roflEnsureAuthorizedOrigin() would validate TEE execution
      // For local development, this function should return true or be bypassed
      console.log("🏠 Local Development Note:");
      console.log("   - ROFL functions are mocked for local testing");
      console.log("   - Real TEE validation only works on Oasis Sapphire networks");
      console.log("   - API key storage is simulated locally");
    });
  });
});