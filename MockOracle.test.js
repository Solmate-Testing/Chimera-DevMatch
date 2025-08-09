const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MockOracle Contract", function () {
  let mockOracle, owner, user1, user2;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    const MockOracle = await ethers.getContractFactory("MockOracle");
    mockOracle = await MockOracle.deploy();
    await mockOracle.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await mockOracle.getAddress()).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Basic Proof Verification", function () {
    it("Should verify non-empty proof", async function () {
      const proof = ethers.toUtf8Bytes("test proof");
      expect(await mockOracle.verifyProof(proof)).to.be.true;
    });

    it("Should fail with empty proof", async function () {
      await expect(mockOracle.verifyProof("0x"))
        .to.be.revertedWith("Proof cannot be empty");
    });
  });

  describe("Ownership Verification", function () {
    it("Should verify ownership with valid proof", async function () {
      const dataHashes = [ethers.keccak256(ethers.toUtf8Bytes("test data"))];
      const nonce = ethers.keccak256(ethers.toUtf8Bytes("test nonce"));
      
      const proof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "address", "bytes32"],
        [dataHashes, user1.address, nonce]
      );

      const result = await mockOracle.verifyOwnership(proof);
      
      expect(result.dataHashes).to.deep.equal(dataHashes);
      expect(result.owner).to.equal(user1.address);
      expect(result.isValid).to.be.true;
    });

    it("Should fail with empty proof", async function () {
      await expect(mockOracle.verifyOwnership("0x"))
        .to.be.revertedWith("Invalid proof");
    });

    it("Should fail with empty data hashes", async function () {
      const dataHashes = [];
      const nonce = ethers.keccak256(ethers.toUtf8Bytes("test nonce"));
      
      const proof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "address", "bytes32"],
        [dataHashes, user1.address, nonce]
      );

      await expect(mockOracle.verifyOwnership(proof))
        .to.be.revertedWith("No data hashes provided");
    });

    it("Should fail with invalid owner address", async function () {
      const dataHashes = [ethers.keccak256(ethers.toUtf8Bytes("test data"))];
      const nonce = ethers.keccak256(ethers.toUtf8Bytes("test nonce"));
      
      const proof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "address", "bytes32"],
        [dataHashes, ethers.ZeroAddress, nonce]
      );

      await expect(mockOracle.verifyOwnership(proof))
        .to.be.revertedWith("Invalid owner address");
    });
  });

  describe("Transfer Validity Verification", function () {
    it("Should verify transfer validity with valid proof", async function () {
      const oldDataHashes = [ethers.keccak256(ethers.toUtf8Bytes("old data"))];
      const newDataHashes = [ethers.keccak256(ethers.toUtf8Bytes("new data"))];
      const pubKey = ethers.toUtf8Bytes("public key");
      const sealedKey = ethers.toUtf8Bytes("sealed key");
      const nonce = ethers.keccak256(ethers.toUtf8Bytes("test nonce"));
      
      const proof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "bytes32[]", "address", "address", "bytes", "bytes", "bytes32"],
        [oldDataHashes, newDataHashes, user1.address, user2.address, pubKey, sealedKey, nonce]
      );

      const result = await mockOracle.verifyTransferValidity(proof);
      
      expect(result.oldDataHashes).to.deep.equal(oldDataHashes);
      expect(result.newDataHashes).to.deep.equal(newDataHashes);
      expect(result.from).to.equal(user1.address);
      expect(result.to).to.equal(user2.address);
      expect(result.pubKey).to.equal(ethers.hexlify(pubKey));
      expect(result.sealedKey).to.equal(ethers.hexlify(sealedKey));
      expect(result.isValid).to.be.true;
    });

    it("Should fail with empty proof", async function () {
      await expect(mockOracle.verifyTransferValidity("0x"))
        .to.be.revertedWith("Invalid proof");
    });

    it("Should fail with empty old data hashes", async function () {
      const oldDataHashes = [];
      const newDataHashes = [ethers.keccak256(ethers.toUtf8Bytes("new data"))];
      const pubKey = ethers.toUtf8Bytes("public key");
      const sealedKey = ethers.toUtf8Bytes("sealed key");
      const nonce = ethers.keccak256(ethers.toUtf8Bytes("test nonce"));
      
      const proof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32[]", "bytes32[]", "address", "address", "bytes", "bytes", "bytes32"],
        [oldDataHashes, newDataHashes, user1.address, user2.address, pubKey, sealedKey, nonce]
      );

      await expect(mockOracle.verifyTransferValidity(proof))
        .to.be.revertedWith("No old data hashes");
    });
  });

  describe("Data Integrity Verification", function () {
    it("Should verify data integrity when proof exists", async function () {
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test data"));
      const signature = ethers.toUtf8Bytes("signature");
      
      // First store the integrity proof
      await mockOracle.storeIntegrityProof(dataHash, signature, user1.address);
      
      const proof = ethers.toUtf8Bytes("integrity proof");
      const result = await mockOracle.verifyDataIntegrity(dataHash, proof);
      
      expect(result).to.be.true;
    });

    it("Should fail with invalid data hash", async function () {
      const proof = ethers.toUtf8Bytes("integrity proof");
      
      await expect(mockOracle.verifyDataIntegrity(ethers.ZeroHash, proof))
        .to.be.revertedWith("Invalid data hash");
    });

    it("Should fail with empty proof", async function () {
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test data"));
      
      await expect(mockOracle.verifyDataIntegrity(dataHash, "0x"))
        .to.be.revertedWith("Invalid proof");
    });
  });

  describe("Proof Generation", function () {
    it("Should generate ownership proof", async function () {
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test data"));
      
      const proof = await mockOracle.generateOwnershipProof(dataHash, user1.address);
      
      expect(proof).to.not.equal("0x");
      expect(proof.length).to.be.greaterThan(0);
    });

    it("Should generate transfer proof", async function () {
      const oldDataHash = ethers.keccak256(ethers.toUtf8Bytes("old data"));
      const newDataHash = ethers.keccak256(ethers.toUtf8Bytes("new data"));
      
      const proof = await mockOracle.createTransferProof(
        oldDataHash,
        newDataHash,
        user1.address,
        user2.address
      );
      
      expect(proof).to.not.equal("0x");
      expect(proof.length).to.be.greaterThan(0);
    });

    it("Should fail generating ownership proof with invalid data hash", async function () {
      await expect(mockOracle.generateOwnershipProof(ethers.ZeroHash, user1.address))
        .to.be.revertedWith("Invalid data hash");
    });

    it("Should fail generating ownership proof with invalid owner", async function () {
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test data"));
      
      await expect(mockOracle.generateOwnershipProof(dataHash, ethers.ZeroAddress))
        .to.be.revertedWith("Invalid owner address");
    });
  });

  describe("TEE Attestation", function () {
    it("Should validate TEE attestation", async function () {
      const attestation = ethers.toUtf8Bytes("test attestation");
      
      const result = await mockOracle.validateTEEAttestation(attestation);
      expect(result).to.be.true;
    });

    it("Should fail with invalid attestation", async function () {
      await expect(mockOracle.validateTEEAttestation("0x"))
        .to.be.revertedWith("Invalid attestation");
    });
  });

  describe("Nonce Management", function () {
    it("Should track nonce usage", async function () {
      const nonce = ethers.keccak256(ethers.toUtf8Bytes("test nonce"));
      
      expect(await mockOracle.isNonceUsed(nonce)).to.be.false;
      
      await mockOracle.markNonceUsed(nonce);
      
      expect(await mockOracle.isNonceUsed(nonce)).to.be.true;
    });
  });
});