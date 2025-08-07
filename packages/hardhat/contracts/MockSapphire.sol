// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Mock Sapphire contracts for local development
// These provide the same interface as real Sapphire contracts but without TEE functionality

contract Sapphire {
    // Mock storage for API keys (in production this would be TEE-protected)
    mapping(bytes32 => bytes) private mockStorage;
    
    // Mock rofl storage interface
    struct ROFLStorage {
        mapping(bytes32 => bytes) data;
    }
    
    ROFLStorage internal roflStorage;
    
    // Mock function to set data in rofl storage
    function _setROFLStorage(bytes32 key, bytes calldata value) internal {
        roflStorage.data[key] = value;
    }
    
    // Mock function to get data from rofl storage  
    function _getROFLStorage(bytes32 key) internal view returns (bytes memory) {
        return roflStorage.data[key];
    }
}

contract SapphireROFL {
    // Mock ROFL authorization - always returns true in local development
    function roflEnsureAuthorizedOrigin() internal pure returns (bool) {
        // In real Sapphire, this validates TEE execution environment
        // For local development, we always return true
        return true;
    }
    
    // Mock rofl storage interface
    struct ROFLStorageInterface {
        function set(bytes32 key, bytes calldata value) external;
        function get(bytes32 key) external view returns (bytes memory);
    }
    
    // Mock rofl storage instance
    ROFLStorageInterface internal roflStorage;
    
    constructor() {
        // Initialize mock storage interface
        roflStorage = ROFLStorageInterface(address(this));
    }
    
    // Mock implementation of storage set
    mapping(bytes32 => bytes) private _mockROFLStorage;
    
    function _setMockStorage(bytes32 key, bytes calldata value) external {
        _mockROFLStorage[key] = value;
    }
    
    function _getMockStorage(bytes32 key) external view returns (bytes memory) {
        return _mockROFLStorage[key];
    }
}