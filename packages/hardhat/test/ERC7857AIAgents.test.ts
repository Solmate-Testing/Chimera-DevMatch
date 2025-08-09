import { expect } from "chai";
import { ethers } from "hardhat";
import { OasisTEEVerifier, ERC7857AIAgents } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("ERC7857AIAgents", function () {
  let teeVerifier: OasisTEEVerifier;
  let aiAgents: ERC7857AIAgents;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, creator, user1, user2] = await ethers.getSigners();

    // Deploy TEE Verifier
    const TEEVerifierFactory = await ethers.getContractFactory("OasisTEEVerifier");
    teeVerifier = await TEEVerifierFactory.deploy();
    await teeVerifier.waitForDeployment();

    // Deploy ERC7857 AI Agents
    const AIAgentsFactory = await ethers.getContractFactory("ERC7857AIAgents");
    aiAgents = await AIAgentsFactory.deploy(await teeVerifier.getAddress());
    await aiAgents.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct verifier", async function () {
      expect(await aiAgents.getVerifier()).to.equal(await teeVerifier.getAddress());
    });

    it("Should set the correct name and symbol", async function () {
      expect(await aiAgents.name()).to.equal("Chimera AI Agents");
      expect(await aiAgents.symbol()).to.equal("CAI");
    });

    it("Should start with zero total supply", async function () {
      expect(await aiAgents.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    let mockOwnershipProof: string;

    beforeEach(async function () {
      // Create mock ownership proof
      const dataHashes = [ethers.keccak256(ethers.toUtf8Bytes("test-agent-data"))];
      const attestation = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "bytes32"],
        [ethers.keccak256(ethers.toUtf8Bytes("mock-signature")), ethers.randomBytes(32)]
      );
      const nonce = ethers.keccak256(ethers.randomBytes(32));
      const timestamp = Math.floor(Date.now() / 1000);

      mockOwnershipProof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "bytes", "bytes32", "uint256"],
        [dataHashes, attestation, nonce, timestamp]
      );

      // Add trusted TEE key for testing
      const testKeyHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address"], [creator.address]));
      await teeVerifier.addTrustedTEEKey(testKeyHash);
    });

    it("Should mint AI agent with valid proof", async function () {
      const proofs = [mockOwnershipProof];
      const descriptions = ["AI Trading Bot Data"];
      const agentName = "SuperTrader AI";
      const category = "AI Agent";

      await expect(
        aiAgents.connect(creator).mint(proofs, descriptions, agentName, category, false)
      ).to.emit(aiAgents, "Minted");

      expect(await aiAgents.totalSupply()).to.equal(1);
      expect(await aiAgents.ownerOf(1)).to.equal(creator.address);

      const agentData = await aiAgents.getAgentData(1);
      expect(agentData.name).to.equal(agentName);
      expect(agentData.category).to.equal(category);
      expect(agentData.owner).to.equal(creator.address);
      expect(agentData.isPublic).to.equal(false);
    });

    it("Should reject minting with empty proofs", async function () {
      await expect(
        aiAgents.connect(creator).mint([], [], "Test Agent", "AI Agent", false)
      ).to.be.revertedWith("No proofs provided");
    });

    it("Should reject minting with mismatched arrays", async function () {
      const proofs = [mockOwnershipProof];
      const descriptions = ["Description 1", "Description 2"]; // Mismatch

      await expect(
        aiAgents.connect(creator).mint(proofs, descriptions, "Test Agent", "AI Agent", false)
      ).to.be.revertedWith("Mismatched arrays");
    });
  });

  describe("Transfer", function () {
    let tokenId: number;
    let mockTransferProof: string;

    beforeEach(async function () {
      // Mint an agent first
      const dataHashes = [ethers.keccak256(ethers.toUtf8Bytes("test-agent-data"))];
      const attestation = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "bytes32"],
        [ethers.keccak256(ethers.toUtf8Bytes("mock-signature")), ethers.randomBytes(32)]
      );
      const nonce = ethers.keccak256(ethers.randomBytes(32));
      const timestamp = Math.floor(Date.now() / 1000);

      const mockOwnershipProof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "bytes", "bytes32", "uint256"],
        [dataHashes, attestation, nonce, timestamp]
      );

      const testKeyHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address"], [creator.address]));
      await teeVerifier.addTrustedTEEKey(testKeyHash);

      await aiAgents.connect(creator).mint(
        [mockOwnershipProof],
        ["AI Trading Bot Data"],
        "SuperTrader AI",
        "AI Agent",
        false
      );
      tokenId = 1;

      // Create mock transfer proof
      const oldDataHashes = dataHashes;
      const newDataHashes = [ethers.keccak256(ethers.toUtf8Bytes("re-encrypted-agent-data"))];
      const pubKey = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]);
      const sealedKey = ethers.keccak256(ethers.toUtf8Bytes("sealed-key-for-user1"));
      const transferAttestation = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "bytes32"],
        [ethers.keccak256(ethers.toUtf8Bytes("transfer-signature")), ethers.randomBytes(32)]
      );
      const transferNonce = ethers.keccak256(ethers.randomBytes(32));
      const transferTimestamp = Math.floor(Date.now() / 1000);

      mockTransferProof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "bytes32[]", "bytes", "bytes", "bytes", "bytes32", "uint256"],
        [oldDataHashes, newDataHashes, pubKey, sealedKey, transferAttestation, transferNonce, transferTimestamp]
      );
    });

    it("Should transfer agent with valid proof", async function () {
      await expect(
        aiAgents.connect(creator).transfer(user1.address, tokenId, [mockTransferProof])
      ).to.emit(aiAgents, "Transferred")
        .withArgs(tokenId, creator.address, user1.address);

      expect(await aiAgents.ownerOf(tokenId)).to.equal(user1.address);
    });

    it("Should reject transfer by non-owner", async function () {
      await expect(
        aiAgents.connect(user2).transfer(user1.address, tokenId, [mockTransferProof])
      ).to.be.revertedWith("Not token owner");
    });

    it("Should reject transfer to zero address", async function () {
      await expect(
        aiAgents.connect(creator).transfer(ethers.ZeroAddress, tokenId, [mockTransferProof])
      ).to.be.revertedWith("Invalid recipient");
    });
  });

  describe("Cloning", function () {
    let tokenId: number;
    let mockTransferProof: string;

    beforeEach(async function () {
      // Setup similar to transfer test
      const dataHashes = [ethers.keccak256(ethers.toUtf8Bytes("test-agent-data"))];
      const attestation = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "bytes32"],
        [ethers.keccak256(ethers.toUtf8Bytes("mock-signature")), ethers.randomBytes(32)]
      );
      const nonce = ethers.keccak256(ethers.randomBytes(32));
      const timestamp = Math.floor(Date.now() / 1000);

      const mockOwnershipProof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "bytes", "bytes32", "uint256"],
        [dataHashes, attestation, nonce, timestamp]
      );

      const testKeyHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address"], [creator.address]));
      await teeVerifier.addTrustedTEEKey(testKeyHash);

      await aiAgents.connect(creator).mint(
        [mockOwnershipProof],
        ["AI Trading Bot Data"],
        "SuperTrader AI",
        "AI Agent",
        false
      );
      tokenId = 1;

      // Mock transfer proof for cloning
      const oldDataHashes = dataHashes;
      const newDataHashes = [ethers.keccak256(ethers.toUtf8Bytes("cloned-agent-data"))];
      const pubKey = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user1.address]);
      const sealedKey = ethers.keccak256(ethers.toUtf8Bytes("sealed-key-for-clone"));
      const transferAttestation = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "bytes32"],
        [ethers.keccak256(ethers.toUtf8Bytes("clone-signature")), ethers.randomBytes(32)]
      );
      const transferNonce = ethers.keccak256(ethers.randomBytes(32));
      const transferTimestamp = Math.floor(Date.now() / 1000);

      mockTransferProof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "bytes32[]", "bytes", "bytes", "bytes", "bytes32", "uint256"],
        [oldDataHashes, newDataHashes, pubKey, sealedKey, transferAttestation, transferNonce, transferTimestamp]
      );
    });

    it("Should clone agent with valid proof", async function () {
      await expect(
        aiAgents.connect(creator).clone(user1.address, tokenId, [mockTransferProof])
      ).to.emit(aiAgents, "Cloned")
        .withArgs(tokenId, 2, creator.address, user1.address);

      // Original owner unchanged
      expect(await aiAgents.ownerOf(tokenId)).to.equal(creator.address);
      // New cloned token owned by user1
      expect(await aiAgents.ownerOf(2)).to.equal(user1.address);
      expect(await aiAgents.totalSupply()).to.equal(2);
    });
  });

  describe("Public Operations", function () {
    let publicTokenId: number;

    beforeEach(async function () {
      // Mint public agent
      const dataHashes = [ethers.keccak256(ethers.toUtf8Bytes("public-agent-data"))];
      const attestation = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "bytes32"],
        [ethers.keccak256(ethers.toUtf8Bytes("mock-signature")), ethers.randomBytes(32)]
      );
      const nonce = ethers.keccak256(ethers.randomBytes(32));
      const timestamp = Math.floor(Date.now() / 1000);

      const mockOwnershipProof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "bytes", "bytes32", "uint256"],
        [dataHashes, attestation, nonce, timestamp]
      );

      const testKeyHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address"], [creator.address]));
      await teeVerifier.addTrustedTEEKey(testKeyHash);

      await aiAgents.connect(creator).mint(
        [mockOwnershipProof],
        ["Public AI Data"],
        "Public AI",
        "AI Agent",
        true // isPublic = true
      );
      publicTokenId = 1;
    });

    it("Should transfer public agent without proofs", async function () {
      await expect(
        aiAgents.connect(creator).transferPublic(user1.address, publicTokenId)
      ).to.emit(aiAgents, "Transferred")
        .withArgs(publicTokenId, creator.address, user1.address);

      expect(await aiAgents.ownerOf(publicTokenId)).to.equal(user1.address);
    });

    it("Should clone public agent without proofs", async function () {
      await expect(
        aiAgents.connect(creator).clonePublic(user1.address, publicTokenId)
      ).to.emit(aiAgents, "Cloned")
        .withArgs(publicTokenId, 2, creator.address, user1.address);

      expect(await aiAgents.ownerOf(2)).to.equal(user1.address);
    });
  });

  describe("Marketplace Integration", function () {
    let tokenId: number;

    beforeEach(async function () {
      // Mint agent for marketplace testing
      const dataHashes = [ethers.keccak256(ethers.toUtf8Bytes("marketplace-agent"))];
      const attestation = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "bytes32"],
        [ethers.keccak256(ethers.toUtf8Bytes("mock-signature")), ethers.randomBytes(32)]
      );
      const nonce = ethers.keccak256(ethers.randomBytes(32));
      const timestamp = Math.floor(Date.now() / 1000);

      const mockOwnershipProof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "bytes", "bytes32", "uint256"],
        [dataHashes, attestation, nonce, timestamp]
      );

      const testKeyHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address"], [creator.address]));
      await teeVerifier.addTrustedTEEKey(testKeyHash);

      await aiAgents.connect(creator).mint(
        [mockOwnershipProof],
        ["Marketplace AI Data"],
        "Marketplace AI",
        "AI Agent",
        false
      );
      tokenId = 1;
    });

    it("Should allow staking on agent", async function () {
      const stakeAmount = ethers.parseEther("0.1");
      
      await expect(
        aiAgents.connect(user1).stakeOnAgent(tokenId, { value: stakeAmount })
      ).to.emit(aiAgents, "AgentStaked")
        .withArgs(tokenId, user1.address, stakeAmount);

      const agentData = await aiAgents.getAgentData(tokenId);
      expect(agentData.totalStaked).to.equal(stakeAmount);
    });

    it("Should allow loving agent", async function () {
      await expect(
        aiAgents.connect(user1).loveAgent(tokenId)
      ).to.emit(aiAgents, "AgentLoved")
        .withArgs(tokenId, user1.address);

      const agentData = await aiAgents.getAgentData(tokenId);
      expect(agentData.loves).to.equal(1);
    });

    it("Should track owner tokens", async function () {
      const ownerTokens = await aiAgents.getOwnerTokens(creator.address);
      expect(ownerTokens.length).to.equal(1);
      expect(ownerTokens[0]).to.equal(tokenId);
    });
  });

  describe("Authorization", function () {
    let tokenId: number;

    beforeEach(async function () {
      // Mint private agent
      const dataHashes = [ethers.keccak256(ethers.toUtf8Bytes("private-agent"))];
      const attestation = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "bytes32"],
        [ethers.keccak256(ethers.toUtf8Bytes("mock-signature")), ethers.randomBytes(32)]
      );
      const nonce = ethers.keccak256(ethers.randomBytes(32));
      const timestamp = Math.floor(Date.now() / 1000);

      const mockOwnershipProof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "bytes", "bytes32", "uint256"],
        [dataHashes, attestation, nonce, timestamp]
      );

      const testKeyHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address"], [creator.address]));
      await teeVerifier.addTrustedTEEKey(testKeyHash);

      await aiAgents.connect(creator).mint(
        [mockOwnershipProof],
        ["Private AI Data"],
        "Private AI",
        "AI Agent",
        false // private
      );
      tokenId = 1;
    });

    it("Should authorize user for agent usage", async function () {
      await expect(
        aiAgents.connect(creator).authorizeUsage(tokenId, user1.address)
      ).to.emit(aiAgents, "AuthorizedUsage")
        .withArgs(tokenId, user1.address);

      const authorizedUsers = await aiAgents.authorizedUsersOf(tokenId);
      expect(authorizedUsers.length).to.equal(1);
      expect(authorizedUsers[0]).to.equal(user1.address);
    });

    it("Should reject authorization by non-owner", async function () {
      await expect(
        aiAgents.connect(user1).authorizeUsage(tokenId, user2.address)
      ).to.be.revertedWith("Not token owner");
    });
  });
});