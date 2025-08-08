// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Mock Sapphire contracts for local development
// These provide the same interface as real Sapphire contracts but without TEE functionality

contract MockSapphire {
    // Mock storage for API keys (in production this would be TEE-protected)
    mapping(bytes32 => bytes) private _mockROFLStorage;
    
    // Mock ROFL authorization - always returns true in local development
    function roflEnsureAuthorizedOrigin() internal pure returns (bool) {
        // In real Sapphire, this validates TEE execution environment
        // For local development, we always return true
        return true;
    }
    
    // Mock rofl storage interface
    struct ROFLStorageInterface {
        mapping(bytes32 => bytes) data;
    }
    
    ROFLStorageInterface internal roflStorage;
    
    // Mock implementation for setting storage
    function _setROFLStorage(bytes32 key, bytes calldata value) internal {
        _mockROFLStorage[key] = value;
    }
    
    // Mock implementation for getting storage  
    function _getROFLStorage(bytes32 key) internal view returns (bytes memory) {
        return _mockROFLStorage[key];
    }
}