// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC7857
 * @dev Interface for ERC-7857 Intelligent Non-Fungible Tokens (INFTs)
 */
interface IERC7857 {
    /**
     * @dev Emitted when a new INFT is minted
     */
    event INFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string encryptedMetadataURI,
        bytes32 metadataHash
    );

    /**
     * @dev Emitted when INFT metadata is updated
     */
    event INFTUpdated(
        uint256 indexed tokenId,
        string oldMetadataURI,
        string newMetadataURI,
        bytes32 newMetadataHash
    );

    /**
     * @dev Emitted when an INFT is transferred
     */
    event INFTTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        bytes transferProof
    );

    /**
     * @dev Emitted when an INFT is cloned
     */
    event INFTCloned(
        uint256 indexed originalTokenId,
        uint256 indexed newTokenId,
        address indexed cloner
    );

    /**
     * @dev Emitted when usage is authorized for an INFT
     */
    event UsageAuthorized(
        uint256 indexed tokenId,
        address indexed authorizedUser,
        uint256 expiryTime
    );

    /**
     * @dev Mints a new INFT with encrypted metadata
     * @param to Address to mint the INFT to
     * @param encryptedMetadataURI URI pointing to encrypted metadata
     * @param metadataHash Hash of the metadata for verification
     * @return tokenId The ID of the newly minted INFT
     */
    function mint(
        address to,
        string memory encryptedMetadataURI,
        bytes32 metadataHash
    ) external returns (uint256 tokenId);

    /**
     * @dev Transfers an INFT with ownership proof
     * @param from Current owner address
     * @param to New owner address
     * @param tokenId ID of the INFT to transfer
     * @param transferProof Proof of valid transfer (TEE verified)
     */
    function safeTransferFromWithProof(
        address from,
        address to,
        uint256 tokenId,
        bytes memory transferProof
    ) external;

    /**
     * @dev Clones an INFT to create a new instance
     * @param tokenId ID of the INFT to clone
     * @param to Address to assign the cloned INFT to
     * @return newTokenId The ID of the cloned INFT
     */
    function clone(
        uint256 tokenId,
        address to
    ) external returns (uint256 newTokenId);

    /**
     * @dev Authorizes a user to access INFT data
     * @param tokenId ID of the INFT
     * @param user Address to authorize
     * @param duration Duration of authorization in seconds
     */
    function authorizeUsage(
        uint256 tokenId,
        address user,
        uint256 duration
    ) external;

    /**
     * @dev Checks if a user is authorized to use an INFT
     * @param tokenId ID of the INFT
     * @param user Address to check
     * @return bool True if authorized, false otherwise
     */
    function isAuthorized(
        uint256 tokenId,
        address user
    ) external view returns (bool);

    // Note: ownerOf and tokenURI are inherited from ERC721

    /**
     * @dev Returns the metadata hash for an INFT
     * @param tokenId ID of the INFT
     * @return bytes32 Metadata hash
     */
    function metadataHash(uint256 tokenId) external view returns (bytes32);
}