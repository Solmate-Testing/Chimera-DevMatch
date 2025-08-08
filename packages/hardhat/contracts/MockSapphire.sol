// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Mock Sapphire contracts for local development
// These provide the same interface as real Sapphire contracts but without TEE functionality

contract MockSapphire {
    // Mock storage for API keys (in production this would be TEE-protected)
    mapping(bytes32 => bytes) private _mockROFLStorage;
    mapping(bytes32 => bool) private _keyExists;
    mapping(address => bool) private _authorizedOrigins;
    
    // Events for testing and debugging
    event ROFLStorageSet(bytes32 indexed key, uint256 dataLength);
    event ROFLStorageAccessed(bytes32 indexed key, address accessor);
    event ROFLAuthorizationCheck(address origin, bool authorized);
    event APIKeyEncrypted(bytes32 indexed keyHash);
    event APIKeyDecrypted(bytes32 indexed keyHash, address accessor);
    
    // Mock encryption/decryption for testing
    function mockEncrypt(bytes memory data) internal pure returns (bytes memory) {
        // Simple XOR encryption for testing (NOT secure, only for development)
        bytes memory encrypted = new bytes(data.length);
        for (uint i = 0; i < data.length; i++) {
            encrypted[i] = bytes1(uint8(data[i]) ^ 0xAA);
        }
        return encrypted;
    }
    
    function mockDecrypt(bytes memory encryptedData) internal pure returns (bytes memory) {
        // Simple XOR decryption for testing (NOT secure, only for development)
        bytes memory decrypted = new bytes(encryptedData.length);
        for (uint i = 0; i < encryptedData.length; i++) {
            decrypted[i] = bytes1(uint8(encryptedData[i]) ^ 0xAA);
        }
        return decrypted;
    }
    
    // Mock ROFL authorization - configurable for testing
    function roflEnsureAuthorizedOrigin() internal returns (bool) {
        // In real Sapphire, this validates TEE execution environment
        // For local development, we simulate authorization checks
        bool authorized = _authorizedOrigins[msg.sender] || _authorizedOrigins[tx.origin] || true;
        emit ROFLAuthorizationCheck(msg.sender, authorized);
        return authorized;
    }
    
    // Mock rofl storage interface
    struct ROFLStorageInterface {
        mapping(bytes32 => bytes) data;
    }
    
    ROFLStorageInterface internal roflStorage;
    
    // Enhanced mock implementation for setting storage with encryption
    function _setROFLStorage(bytes32 key, bytes calldata value) internal {
        require(value.length > 0, "Empty data not allowed");
        
        // Mock encryption of the API key
        bytes memory encryptedValue = mockEncrypt(value);
        _mockROFLStorage[key] = encryptedValue;
        _keyExists[key] = true;
        
        emit ROFLStorageSet(key, value.length);
        emit APIKeyEncrypted(key);
    }
    
    // Enhanced mock implementation for getting storage with decryption
    function _getROFLStorage(bytes32 key) internal returns (bytes memory) {
        require(_keyExists[key], "Key does not exist in TEE storage");
        
        bytes memory encryptedData = _mockROFLStorage[key];
        bytes memory decryptedData = mockDecrypt(encryptedData);
        
        emit ROFLStorageAccessed(key, msg.sender);
        emit APIKeyDecrypted(key, msg.sender);
        
        return decryptedData;
    }
    
    // Mock function to simulate private agent access verification
    function _verifyAgentAccess(
        uint256 agentId,
        address user,
        bool isPrivate
    ) internal pure returns (bool) {
        if (!isPrivate) {
            return true; // Public agents are always accessible
        }
        
        // In real implementation, this would check TEE-protected access lists
        // For mock, we simulate the check
        return agentId > 0 && user != address(0);
    }
    
    // Mock function to add authorized origins (for testing)
    function _addAuthorizedOrigin(address origin) internal {
        _authorizedOrigins[origin] = true;
    }
    
    // Mock function to remove authorized origins (for testing)
    function _removeAuthorizedOrigin(address origin) internal {
        _authorizedOrigins[origin] = false;
    }
    
    // Mock function to check if a key exists in storage
    function _keyExistsInStorage(bytes32 key) internal view returns (bool) {
        return _keyExists[key];
    }
    
    // Mock function to get storage size (for testing)
    function _getStorageSize(bytes32 key) internal view returns (uint256) {
        if (!_keyExists[key]) return 0;
        return _mockROFLStorage[key].length;
    }
    
    // Mock function to clear storage (for testing)
    function _clearROFLStorage(bytes32 key) internal {
        delete _mockROFLStorage[key];
        delete _keyExists[key];
    }
    
    // Mock function to simulate TEE environment check
    function _isInTEE() internal pure returns (bool) {
        // In real Sapphire, this would check if running in TEE
        // For mock, we always return true in development
        return true;
    }
}