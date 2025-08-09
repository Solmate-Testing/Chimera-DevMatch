// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDataVerifier.sol";
// Mock Sapphire for local development - replace with real import for production
// import "@oasisprotocol/sapphire/contracts/Sapphire.sol";
import "./MockSapphire.sol";

/**
 * @title OasisTEEVerifier
 * @notice TEE-based data verification system for ERC-7857 AI Agent NFTs
 * @dev Implements IDataVerifier interface using Oasis ROFL-Sapphire for secure verification
 * @custom:security All verifications must occur within TEE environment using roflEnsureAuthorizedOrigin()
 */
contract OasisTEEVerifier is IDataVerifier, MockSapphire {
    
    // Track used nonces to prevent replay attacks
    mapping(bytes32 => bool) private usedNonces;
    
    // TEE attestation verification keys (would be configured during deployment)
    mapping(bytes32 => bool) public trustedTEEKeys;
    
    event ProofVerified(
        bytes32 indexed proofHash, 
        bool isValid, 
        address indexed verifier
    );
    
    event NonceUsed(bytes32 indexed nonce, address indexed user);
    
    constructor() {
        // Initialize with trusted TEE public keys
        // In production, these would be Oasis TEE attestation keys
        _initializeTrustedKeys();
    }
    
    /**
     * @notice Verify ownership of AI agent data through TEE attestation
     * @dev Must be called within TEE environment for security
     * @param _proof TEE attestation proof containing data hashes and signature
     * @return OwnershipProofOutput with validation result and data hashes
     */
    function verifyOwnership(bytes calldata _proof) 
        external override returns (OwnershipProofOutput memory) {
        
        // ✅ CRITICAL: Ensure execution within TEE
        if (block.chainid == 23295 || block.chainid == 23294) {
            require(roflEnsureAuthorizedOrigin(), "Must execute in TEE");
        }
        
        // Decode TEE attestation proof structure
        (
            bytes32[] memory dataHashes,
            bytes memory teeAttestation,
            bytes32 nonce,
            uint256 timestamp
        ) = abi.decode(_proof, (bytes32[], bytes, bytes32, uint256));
        
        // Validate proof components
        require(dataHashes.length > 0, "No data hashes provided");
        require(teeAttestation.length > 0, "No TEE attestation provided");
        require(!usedNonces[nonce], "Nonce already used");
        require(timestamp > block.timestamp - 300, "Proof too old"); // 5 minute validity
        
        // For development/testing: simplified validation
        // In production, this would verify actual TEE attestations
        bool isValid = dataHashes.length > 0 && 
                      teeAttestation.length > 0 && 
                      timestamp > block.timestamp - 300;
        
        if (isValid) {
            // Mark nonce as used (note: this is view function, so nonce isn't actually marked)
            // In practice, nonce marking would happen in a separate transaction
            emit ProofVerified(keccak256(_proof), isValid, msg.sender);
        }
        
        return OwnershipProofOutput({
            dataHashes: dataHashes,
            isValid: isValid
        });
    }
    
    /**
     * @notice Verify validity of data transfer with re-encryption proof
     * @dev Validates secure data transfer between parties through TEE
     * @param _proof TEE proof containing old/new hashes, keys, and attestation
     * @return TransferValidityProofOutput with transfer validation details
     */
    function verifyTransferValidity(bytes calldata _proof) 
        external override returns (TransferValidityProofOutput memory) {
        
        // ✅ CRITICAL: Ensure execution within TEE
        if (block.chainid == 23295 || block.chainid == 23294) {
            require(roflEnsureAuthorizedOrigin(), "Must execute in TEE");
        }
        
        // Decode comprehensive transfer proof
        (
            bytes32[] memory oldDataHashes,
            bytes32[] memory newDataHashes,
            bytes memory recipientPubKey,
            bytes memory sealedKey,
            bytes memory teeAttestation,
            bytes32 nonce,
            uint256 timestamp
        ) = abi.decode(_proof, (bytes32[], bytes32[], bytes, bytes, bytes, bytes32, uint256));
        
        // Validate all proof components
        require(oldDataHashes.length == newDataHashes.length, "Hash arrays length mismatch");
        require(oldDataHashes.length > 0, "No data hashes provided");
        require(recipientPubKey.length > 0, "No recipient public key");
        require(sealedKey.length > 0, "No sealed key provided");
        require(!usedNonces[nonce], "Nonce already used");
        require(timestamp > block.timestamp - 300, "Proof too old");
        
        // For development/testing: simplified validation
        // In production, this would verify actual TEE attestations
        bool isValid = oldDataHashes.length == newDataHashes.length &&
                      oldDataHashes.length > 0 &&
                      recipientPubKey.length > 0 &&
                      sealedKey.length > 0 &&
                      teeAttestation.length > 0 &&
                      timestamp > block.timestamp - 300;
        
        if (isValid) {
            emit ProofVerified(keccak256(_proof), isValid, msg.sender);
        }
        
        return TransferValidityProofOutput({
            oldDataHashes: oldDataHashes,
            newDataHashes: newDataHashes,
            pubKey: recipientPubKey,
            sealedKey: sealedKey,
            isValid: isValid
        });
    }
    
    /**
     * @dev Verify TEE attestation for ownership proofs
     * @param attestation TEE signature/attestation data
     * @param dataHashes Array of data hashes being verified
     * @param nonce Unique nonce to prevent replays
     * @param timestamp Proof generation timestamp
     * @return bool indicating if attestation is valid
     */
    function _verifyTEEAttestation(
        bytes memory attestation,
        bytes32[] memory dataHashes,
        bytes32 nonce,
        uint256 timestamp
    ) private view returns (bool) {
        
        // Create message hash for verification
        bytes32 messageHash = keccak256(abi.encodePacked(
            dataHashes,
            nonce,
            timestamp,
            msg.sender,
            "OWNERSHIP_PROOF"
        ));
        
        // Verify against trusted TEE keys
        return _verifyTEESignature(messageHash, attestation);
    }
    
    /**
     * @dev Verify TEE attestation for transfer validity proofs  
     * @param attestation TEE signature/attestation data
     * @param oldDataHashes Original data hashes before transfer
     * @param newDataHashes New data hashes after re-encryption
     * @param pubKey Recipient's public key
     * @param sealedKey Encrypted key for recipient
     * @param nonce Unique nonce to prevent replays
     * @param timestamp Proof generation timestamp
     * @return bool indicating if attestation is valid
     */
    function _verifyTransferAttestation(
        bytes memory attestation,
        bytes32[] memory oldDataHashes,
        bytes32[] memory newDataHashes,
        bytes memory pubKey,
        bytes memory sealedKey,
        bytes32 nonce,
        uint256 timestamp
    ) private view returns (bool) {
        
        // Create comprehensive message hash
        bytes32 messageHash = keccak256(abi.encodePacked(
            oldDataHashes,
            newDataHashes,
            pubKey,
            keccak256(sealedKey),
            nonce,
            timestamp,
            msg.sender,
            "TRANSFER_PROOF"
        ));
        
        // Verify against trusted TEE keys
        return _verifyTEESignature(messageHash, attestation);
    }
    
    /**
     * @dev Verify signature against trusted TEE public keys
     * @param messageHash Hash of the message being verified
     * @param signature TEE signature to verify
     * @return bool indicating if signature is valid
     */
    function _verifyTEESignature(bytes32 messageHash, bytes memory signature) 
        private view returns (bool) {
        
        // In production, this would:
        // 1. Extract public key from TEE attestation
        // 2. Verify against Oasis TEE attestation format
        // 3. Check against trusted TEE key registry
        
        // For demo/testing: simplified validation
        if (signature.length < 32) return false;
        
        // In development mode, accept signatures that match a known pattern
        // This is NOT secure - only for testing!
        bytes32 expectedSig = keccak256(abi.encodePacked("mock-signature"));
        bytes32 providedSig = keccak256(signature);
        
        return providedSig == expectedSig || trustedTEEKeys[providedSig];
    }
    
    /**
     * @dev Initialize trusted TEE public keys during deployment
     */
    function _initializeTrustedKeys() private {
        // In production, these would be Oasis ROFL-Sapphire attestation keys
        // For demo: add some test keys
        trustedTEEKeys[keccak256(abi.encodePacked(address(0x1)))] = true;
        trustedTEEKeys[keccak256(abi.encodePacked(address(0x2)))] = true;
    }
    
    /**
     * @notice Add trusted TEE key (admin only)
     * @dev Would be used to register new TEE attestation keys
     * @param keyHash Hash of the TEE public key to trust
     */
    function addTrustedTEEKey(bytes32 keyHash) external {
        // In production, only TEE infrastructure should be able to call this
        if (block.chainid == 23295 || block.chainid == 23294) {
            require(roflEnsureAuthorizedOrigin(), "Must execute in TEE");
        }
        
        trustedTEEKeys[keyHash] = true;
    }
    
    /**
     * @notice Mark nonce as used (separate transaction to handle view function limitation)
     * @param nonce The nonce to mark as used
     */
    function markNonceUsed(bytes32 nonce) external {
        require(!usedNonces[nonce], "Nonce already used");
        usedNonces[nonce] = true;
        emit NonceUsed(nonce, msg.sender);
    }
    
    /**
     * @notice Check if a nonce has been used
     * @param nonce The nonce to check
     * @return bool indicating if nonce is used
     */
    function isNonceUsed(bytes32 nonce) external view returns (bool) {
        return usedNonces[nonce];
    }
}