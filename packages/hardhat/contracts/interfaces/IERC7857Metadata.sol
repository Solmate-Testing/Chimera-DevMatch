// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC7857Metadata
 * @dev Interface for ERC-7857 metadata management
 */
interface IERC7857Metadata {
    function metadataHash(uint256 tokenId) external view returns (bytes32);
    function updateMetadata(uint256 tokenId, string memory newMetadataURI, bytes32 newMetadataHash, bytes memory updateProof) external;
}