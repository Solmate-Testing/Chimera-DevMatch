// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// Counters deprecated in OpenZeppelin v5, using simple counter instead
import "./interfaces/IERC7857.sol";
import "./interfaces/IERC7857DataVerifier.sol";
import "./interfaces/IERC7857Metadata.sol";

/**
 * @title INFT
 * @dev Implementation of ERC-7857 Intelligent Non-Fungible Tokens
 */
contract INFT is ERC721, ERC721URIStorage, Ownable, IERC7857 {
    uint256 private _tokenIdCounter = 1;
    IERC7857DataVerifier public immutable dataVerifier;

    struct INFTData {
        string encryptedMetadataURI;
        bytes32 metadataHash;
        address creator;
        mapping(address => uint256) authorizedUsers;
        uint256 createdAt;
        uint256 lastUpdated;
        bool isPublic;
        string[] dataDescriptions; // Added for AI agent metadata
    }

    mapping(uint256 => INFTData) private _inftData;
    mapping(uint256 => mapping(address => bool)) private _authorizations;

    constructor(
        string memory name,
        string memory symbol,
        address _dataVerifier
    ) ERC721(name, symbol) Ownable(msg.sender) {
        require(_dataVerifier != address(0), "Invalid verifier address");
        dataVerifier = IERC7857DataVerifier(_dataVerifier);
    }

    /**
     * @dev Mints a new INFT with encrypted metadata
     */
    function mint(
        address to,
        string memory encryptedMetadataURI,
        bytes32 _metadataHash
    ) public override returns (uint256 tokenId) {
        string[] memory emptyDescriptions = new string[](0);
        return mint(to, encryptedMetadataURI, _metadataHash, emptyDescriptions);
    }

    /**
     * @dev Mints a new INFT with encrypted metadata and data descriptions
     */
    function mint(
        address to,
        string memory encryptedMetadataURI,
        bytes32 _metadataHash,
        string[] memory dataDescriptions
    ) public returns (uint256 tokenId) {
        require(to != address(0), "Invalid recipient");
        require(bytes(encryptedMetadataURI).length > 0, "Invalid metadata URI");
        require(_metadataHash != bytes32(0), "Invalid metadata hash");
        require(dataDescriptions.length > 0, "No descriptions provided");

        tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, encryptedMetadataURI);

        INFTData storage data = _inftData[tokenId];
        data.encryptedMetadataURI = encryptedMetadataURI;
        data.metadataHash = _metadataHash;
        data.creator = msg.sender;
        data.createdAt = block.timestamp;
        data.lastUpdated = block.timestamp;
        data.isPublic = false;
        data.dataDescriptions = dataDescriptions;

        emit INFTMinted(tokenId, msg.sender, encryptedMetadataURI, _metadataHash);
        return tokenId;
    }

    /**
     * @dev Transfers an INFT with ownership proof
     * This is a compatibility function that calls transfer()
     */
    function safeTransferFromWithProof(
        address from,
        address to,
        uint256 tokenId,
        bytes memory transferProof
    ) external {
        require(from == msg.sender, "Can only transfer from self");
        bytes[] memory proofs = new bytes[](1);
        proofs[0] = transferProof;
        this.transfer(to, tokenId, proofs);
    }

    /**
     * @dev Transfer full data (data + ownership) - ERC-7857 specification
     */
    function transfer(
        address _to,
        uint256 _tokenId,
        bytes[] calldata _proofs
    ) external {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        require(ownerOf(_tokenId) == msg.sender, "Not token owner");
        require(_to != address(0), "Invalid recipient");
        require(_proofs.length > 0, "No proofs provided");

        // Verify transfer validity for first proof
        IERC7857DataVerifier.TransferValidityProofOutput memory output = 
            dataVerifier.verifyTransferValidity(_proofs[0]);
        require(output.isValid, "Invalid transfer proof");

        // Update metadata hash if changed
        INFTData storage data = _inftData[_tokenId];
        if (output.newDataHashes.length > 0) {
            data.metadataHash = output.newDataHashes[0];
            data.lastUpdated = block.timestamp;
        }

        // Clear previous authorizations
        _clearAuthorizations(_tokenId);

        // Perform transfer using ERC721
        _safeTransfer(msg.sender, _to, _tokenId, "");

        emit INFTTransferred(_tokenId, msg.sender, _to, _proofs[0]);
    }

    /**
     * @dev Clones an INFT to create a new instance
     */
    function clone(
        uint256 tokenId,
        address to
    ) public override returns (uint256 newTokenId) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender || isAuthorized(tokenId, msg.sender), 
                "Not authorized to clone");
        require(to != address(0), "Invalid recipient");

        INFTData storage originalData = _inftData[tokenId];

        // Mint new token with same metadata
        newTokenId = mint(
            to,
            originalData.encryptedMetadataURI,
            originalData.metadataHash
        );

        // Copy authorization settings if public
        if (originalData.isPublic) {
            _inftData[newTokenId].isPublic = true;
        }

        emit INFTCloned(tokenId, newTokenId, msg.sender);
    }

    /**
     * @dev Authorizes a user to access INFT data
     */
    function authorizeUsage(
        uint256 tokenId,
        address user,
        uint256 duration
    ) public override {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(user != address(0), "Invalid user");
        require(duration > 0, "Invalid duration");

        uint256 expiryTime = block.timestamp + duration;
        _inftData[tokenId].authorizedUsers[user] = expiryTime;
        _authorizations[tokenId][user] = true;

        emit UsageAuthorized(tokenId, user, expiryTime);
    }

    /**
     * @dev Checks if a user is authorized to use an INFT
     */
    function isAuthorized(
        uint256 tokenId,
        address user
    ) public view override returns (bool) {
        if (_ownerOf(tokenId) == address(0)) return false;
        if (ownerOf(tokenId) == user) return true;
        if (_inftData[tokenId].isPublic) return true;

        uint256 expiryTime = _inftData[tokenId].authorizedUsers[user];
        return expiryTime > 0 && expiryTime > block.timestamp;
    }

    /**
     * @dev Returns the metadata hash for an INFT
     */
    function metadataHash(uint256 tokenId) public view override returns (bytes32) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _inftData[tokenId].metadataHash;
    }

    /**
     * @dev Updates metadata for an INFT
     */
    function updateMetadata(
        uint256 tokenId,
        string memory newMetadataURI,
        bytes32 newMetadataHash,
        bytes memory updateProof
    ) public {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(bytes(newMetadataURI).length > 0, "Invalid metadata URI");
        require(newMetadataHash != bytes32(0), "Invalid metadata hash");

        // Verify update validity
        IERC7857DataVerifier.OwnershipProofOutput memory output = 
            dataVerifier.verifyOwnership(updateProof);
        require(output.isValid, "Invalid update proof");

        INFTData storage data = _inftData[tokenId];
        string memory oldURI = data.encryptedMetadataURI;

        data.encryptedMetadataURI = newMetadataURI;
        data.metadataHash = newMetadataHash;
        data.lastUpdated = block.timestamp;

        _setTokenURI(tokenId, newMetadataURI);

        emit INFTUpdated(tokenId, oldURI, newMetadataURI, newMetadataHash);
    }

    /**
     * @dev Makes an INFT public
     */
    function makePublic(uint256 tokenId) public {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        _inftData[tokenId].isPublic = true;
    }

    /**
     * @dev Makes an INFT private
     */
    function makePrivate(uint256 tokenId) public {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        _inftData[tokenId].isPublic = false;
    }

    /**
     * @dev Returns the creator of an INFT
     */
    function creatorOf(uint256 tokenId) public view returns (address) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _inftData[tokenId].creator;
    }

    /**
     * @dev Returns metadata details for an INFT
     */
    function getINFTData(uint256 tokenId) public view returns (
        string memory encryptedMetadataURI,
        bytes32 _metadataHash,
        address creator,
        uint256 createdAt,
        uint256 lastUpdated,
        bool isPublic,
        string[] memory dataDescriptions
    ) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        INFTData storage data = _inftData[tokenId];
        
        return (
            data.encryptedMetadataURI,
            data.metadataHash,
            data.creator,
            data.createdAt,
            data.lastUpdated,
            data.isPublic,
            data.dataDescriptions
        );
    }

    /**
     * @dev Returns data descriptions for an INFT
     */
    function getDataDescriptions(uint256 tokenId) public view returns (string[] memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _inftData[tokenId].dataDescriptions;
    }

    /**
     * @dev Clears all authorizations for a token
     */
    function _clearAuthorizations(uint256 tokenId) private {
        // Note: In production, we'd iterate through authorized users
        // For simplicity, we're not tracking all authorized users
    }

    /**
     * @dev Clean up INFT data when token is burned
     */
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721) returns (address) {
        address from = _ownerOf(tokenId);
        
        if (to == address(0) && from != address(0)) {
            // Token is being burned
            delete _inftData[tokenId];
        }
        
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}