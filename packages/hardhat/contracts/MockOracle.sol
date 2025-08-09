// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC7857DataVerifier.sol";

/**
 * @title MockOracle
 * @dev Mock implementation of TEE verification for testing purposes
 */
contract MockOracle is IERC7857DataVerifier {
    mapping(bytes32 => bool) private _usedNonces;

    event MockProofVerified(bytes32 indexed proofHash, bool isValid);

    /**
     * @dev Verifies ownership of data - mock implementation
     */
    function verifyOwnership(bytes calldata proof) external override returns (OwnershipProofOutput memory) {
        require(proof.length > 0, "Invalid proof");
        
        // Simple mock: decode basic proof structure
        (bytes32[] memory dataHashes, bytes32 nonce) = abi.decode(proof, (bytes32[], bytes32));
        
        require(!_usedNonces[nonce], "Nonce already used");
        require(dataHashes.length > 0, "No data hashes provided");
        
        _usedNonces[nonce] = true;
        
        emit MockProofVerified(keccak256(proof), true);
        
        return OwnershipProofOutput({
            dataHashes: dataHashes,
            isValid: true
        });
    }

    /**
     * @dev Verifies validity of a transfer - mock implementation
     */
    function verifyTransferValidity(bytes calldata proof) external override returns (TransferValidityProofOutput memory) {
        require(proof.length > 0, "Invalid proof");
        
        // Simple mock: decode transfer proof structure
        (
            bytes32[] memory oldDataHashes,
            bytes32[] memory newDataHashes,
            bytes memory pubKey,
            bytes memory sealedKey,
            bytes32 nonce
        ) = abi.decode(proof, (bytes32[], bytes32[], bytes, bytes, bytes32));
        
        require(!_usedNonces[nonce], "Nonce already used");
        require(oldDataHashes.length > 0, "No old data hashes provided");
        require(newDataHashes.length > 0, "No new data hashes provided");
        
        _usedNonces[nonce] = true;
        
        emit MockProofVerified(keccak256(proof), true);
        
        return TransferValidityProofOutput({
            oldDataHashes: oldDataHashes,
            newDataHashes: newDataHashes,
            pubKey: pubKey,
            sealedKey: sealedKey,
            isValid: true
        });
    }
}