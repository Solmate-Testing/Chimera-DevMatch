const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC7857AIAgents", function () {
  let agentContract;
  let verifier;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy verifier contract
    const OasisTEEVerifier = await ethers.getContractFactory("OasisTEEVerifier");
    verifier = await OasisTEEVerifier.deploy();
    await verifier.waitForDeployment();

    // Deploy main contract
    const ERC7857AIAgents = await ethers.getContractFactory("ERC7857AIAgents");
    agentContract = await ERC7857AIAgents.deploy(await verifier.getAddress());
    await agentContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct verifier", async function () {
      expect(await agentContract.verifier()).to.equal(await verifier.getAddress());
    });

    it("Should return correct name and symbol", async function () {
      expect(await agentContract.name()).to.equal("ERC7857 AI Agents");
      expect(await agentContract.symbol()).to.equal("AI7857");
    });
  });

  describe("Minting", function () {
    it("Should mint an agent with valid proof", async function () {
      const dataHashes = [ethers.keccak256(ethers.toUtf8Bytes("test-data"))];
      const proof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "bytes", "bytes32"],
        [dataHashes, ethers.toUtf8Bytes("test-attestation"), ethers.keccak256(ethers.toUtf8Bytes("nonce"))]
      );

      const proofs = [proof];
      const descriptions = ["AI Trading Bot"];

      await expect(agentContract.connect(user1).mint(proofs, descriptions))
        .to.emit(agentContract, "Minted")
        .withArgs(0, user1.address, dataHashes, descriptions);

      expect(await agentContract.ownerOf(0)).to.equal(user1.address);
      expect((await agentContract.dataDescriptionsOf(0))[0]).to.equal("AI Trading Bot");
    });

    it("Should fail with mismatched arrays", async function () {
      const proofs = [ethers.toUtf8Bytes("proof1")];
      const descriptions = ["desc1", "desc2"];

      await expect(agentContract.connect(user1).mint(proofs, descriptions))
        .to.be.revertedWith("Mismatched arrays");
    });
  });

  describe("Transfer", function () {
    let tokenId;

    beforeEach(async function () {
      // First mint an agent
      const dataHashes = [ethers.keccak256(ethers.toUtf8Bytes("test-data"))];
      const mintProof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "bytes", "bytes32"],
        [dataHashes, ethers.toUtf8Bytes("mint-attestation"), ethers.keccak256(ethers.toUtf8Bytes("mint-nonce"))]
      );

      await agentContract.connect(user1).mint([mintProof], ["AI Agent"]);
      tokenId = 0;
    });

    it("Should transfer agent with valid proof", async function () {
      const oldHashes = [ethers.keccak256(ethers.toUtf8Bytes("test-data"))];
      const newHashes = [ethers.keccak256(ethers.toUtf8Bytes("new-data"))];

      const transferProof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "bytes32[]", "bytes", "bytes", "bytes", "bytes32"],
        [
          oldHashes,
          newHashes,
          ethers.toUtf8Bytes("pubkey"),
          ethers.toUtf8Bytes("sealedkey"),
          ethers.toUtf8Bytes("transfer-attestation"),
          ethers.keccak256(ethers.toUtf8Bytes("transfer-nonce"))
        ]
      );

      await expect(agentContract.connect(user1).transfer(user2.address, tokenId, [transferProof]))
        .to.emit(agentContract, "Transferred")
        .withArgs(tokenId, user1.address, user2.address);

      expect(await agentContract.ownerOf(tokenId)).to.equal(user2.address);
    });

    it("Should fail when not owner", async function () {
      const transferProof = ethers.toUtf8Bytes("proof");

      await expect(agentContract.connect(user2).transfer(user2.address, tokenId, [transferProof]))
        .to.be.revertedWith("Not token owner");
    });
  });

  describe("Authorization", function () {
    let tokenId;

    beforeEach(async function () {
      // First mint an agent
      const dataHashes = [ethers.keccak256(ethers.toUtf8Bytes("test-data"))];
      const mintProof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "bytes", "bytes32"],
        [dataHashes, ethers.toUtf8Bytes("mint-attestation"), ethers.keccak256(ethers.toUtf8Bytes("mint-nonce"))]
      );

      await agentContract.connect(user1).mint([mintProof], ["AI Agent"]);
      tokenId = 0;
    });

    it("Should authorize user", async function () {
      await expect(agentContract.connect(user1).authorizeUsage(tokenId, user2.address))
        .to.emit(agentContract, "AuthorizedUsage")
        .withArgs(tokenId, user2.address);

      const authorizedUsers = await agentContract.authorizedUsersOf(tokenId);
      expect(authorizedUsers).to.include(user2.address);
    });

    it("Should fail when not owner", async function () {
      await expect(agentContract.connect(user2).authorizeUsage(tokenId, user2.address))
        .to.be.revertedWith("Not token owner");
    });
  });
});