// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDataVerifier.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC7857AIAgents
 * @notice Implementation of ERC-7857 AI Agents NFT with private metadata
 * @dev AI agent NFTs with TEE-protected metadata for secure agent ownership and transfer
 * @custom:security Uses TEE verification for all critical operations
 * @custom:erc Implements ERC-7857 standard for AI agents with private metadata
 */
contract ERC7857AIAgents is ReentrancyGuard, Ownable {
    
    // The TEE verifier used for all proof validations
    IDataVerifier public immutable verifier;
    
    /**
     * @dev Structure representing an AI Agent NFT
     * @param dataHashes Array of hashes representing agent's private data
     * @param dataDescriptions Human-readable descriptions of the data
     * @param owner Current owner of the agent
     * @param authorizedUsers Array of users authorized to use the agent
     * @param createdAt Timestamp when agent was created
     * @param isPublic Whether agent data is public or private
     * @param category Type of AI agent (AI Agent, MCP, Copy Trading Bot)
     * @param name Human-readable name of the agent
     * @param totalStaked Total ETH staked on this agent (for marketplace integration)
     * @param loves Number of "loves" from users (social metric)
     */
    struct AIAgentData {
        bytes32[] dataHashes;
        string[] dataDescriptions;
        address owner;
        address[] authorizedUsers;
        uint256 createdAt;
        bool isPublic;
        string category;
        string name;
        uint256 totalStaked;
        uint256 loves;
    }
    
    // Token ID counter
    uint256 private _tokenIdCounter = 1;
    
    // Mapping from token ID to agent data
    mapping(uint256 => AIAgentData) private _agents;
    
    // Mapping from token ID to user authorization status
    mapping(uint256 => mapping(address => bool)) private _authorizations;
    
    // Mapping from owner to list of owned tokens
    mapping(address => uint256[]) private _ownerTokens;
    
    // ERC-7857 Events
    event Minted(
        uint256 indexed tokenId,
        address indexed creator,
        bytes32[] dataHashes,
        string[] dataDescriptions
    );
    
    event Updated(
        uint256 indexed tokenId,
        bytes32[] oldDataHashes,
        bytes32[] newDataHashes
    );
    
    event Transferred(
        uint256 tokenId,
        address indexed from,
        address indexed to
    );
    
    event Cloned(
        uint256 indexed tokenId,
        uint256 indexed newTokenId,
        address from,
        address to
    );
    
    event AuthorizedUsage(
        uint256 indexed tokenId,
        address indexed user
    );
    
    event PublishedSealedKey(
        address indexed to,
        uint256 indexed tokenId,
        bytes sealedKey
    );
    
    // Marketplace integration events
    event AgentStaked(
        uint256 indexed tokenId,
        address indexed staker,
        uint256 amount
    );
    
    event AgentLoved(
        uint256 indexed tokenId,
        address indexed user
    );
    
    constructor(IDataVerifier _verifier) Ownable(msg.sender) {
        require(address(_verifier) != address(0), "Invalid verifier");
        verifier = _verifier;
    }
    
    // ✅ ERC-7857 METADATA INTERFACE
    
    /**
     * @notice Get the collection name
     * @return string The name of the NFT collection
     */
    function name() external pure returns (string memory) {
        return "Chimera AI Agents";
    }
    
    /**
     * @notice Get the collection symbol
     * @return string The symbol of the NFT collection
     */
    function symbol() external pure returns (string memory) {
        return "CAI";
    }
    
    /**
     * @notice Get the metadata URI for a specific token
     * @param tokenId The token identifier
     * @return string The metadata URI
     */
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return string(abi.encodePacked(
            "https://api.chimera-devmatch.com/agents/metadata/",
            _toString(tokenId)
        ));
    }
    
    /**
     * @notice Update agent data with new ownership proofs
     * @param tokenId The token to update
     * @param proofs Array of ownership proofs for new data
     */
    function update(
        uint256 tokenId,
        bytes[] calldata proofs
    ) external nonReentrant {
        require(_exists(tokenId), "Token does not exist");
        require(_agents[tokenId].owner == msg.sender, "Not token owner");
        require(proofs.length > 0, "No proofs provided");
        
        bytes32[] memory oldDataHashes = _agents[tokenId].dataHashes;
        bytes32[] memory newDataHashes = new bytes32[](proofs.length);
        
        // Verify all ownership proofs
        for (uint256 i = 0; i < proofs.length; i++) {
            IDataVerifier.OwnershipProofOutput memory output = 
                verifier.verifyOwnership(proofs[i]);
            require(output.isValid, "Invalid ownership proof");
            require(output.dataHashes.length == 1, "Expected single hash per proof");
            newDataHashes[i] = output.dataHashes[0];
        }
        
        // Update agent data
        _agents[tokenId].dataHashes = newDataHashes;
        
        emit Updated(tokenId, oldDataHashes, newDataHashes);
    }
    
    /**
     * @notice Get the data hashes of a token
     * @param tokenId The token identifier
     * @return bytes32[] The current data hashes of the token
     */
    function dataHashesOf(uint256 tokenId) public view returns (bytes32[] memory) {
        require(_exists(tokenId), "Token does not exist");
        return _agents[tokenId].dataHashes;
    }
    
    /**
     * @notice Get the data descriptions of a token
     * @param tokenId The token identifier
     * @return string[] The current data descriptions of the token
     */
    function dataDescriptionsOf(uint256 tokenId) public view returns (string[] memory) {
        require(_exists(tokenId), "Token does not exist");
        return _agents[tokenId].dataDescriptions;
    }
    
    // ✅ ERC-7857 MAIN NFT INTERFACE
    
    /**
     * @notice Get the verifier interface that this NFT uses
     * @return IDataVerifier The address of the verifier contract
     */
    function getVerifier() external view returns (IDataVerifier) {
        return verifier;
    }
    
    /**
     * @notice Mint new AI Agent NFT with data ownership proofs
     * @param proofs Array of ownership proofs for the agent data
     * @param descriptions Human-readable descriptions of the data
     * @param agentName Name of the AI agent
     * @param category Category of the agent (AI Agent, MCP, Copy Trading Bot)
     * @param isPublic Whether the agent data is public
     * @return tokenId The ID of the newly minted token
     */
    function mint(
        bytes[] calldata proofs,
        string[] calldata descriptions,
        string calldata agentName,
        string calldata category,
        bool isPublic
    ) external payable nonReentrant returns (uint256 tokenId) {
        require(proofs.length > 0, "No proofs provided");
        require(proofs.length == descriptions.length, "Mismatched arrays");
        require(bytes(agentName).length > 0, "Agent name required");
        
        bytes32[] memory dataHashes = new bytes32[](proofs.length);
        
        // Verify all ownership proofs
        for (uint256 i = 0; i < proofs.length; i++) {
            IDataVerifier.OwnershipProofOutput memory output = 
                verifier.verifyOwnership(proofs[i]);
            require(output.isValid, "Invalid ownership proof");
            require(output.dataHashes.length == 1, "Expected single hash per proof");
            dataHashes[i] = output.dataHashes[0];
        }
        
        tokenId = _tokenIdCounter++;
        
        _agents[tokenId] = AIAgentData({
            dataHashes: dataHashes,
            dataDescriptions: descriptions,
            owner: msg.sender,
            authorizedUsers: new address[](0),
            createdAt: block.timestamp,
            isPublic: isPublic,
            category: category,
            name: agentName,
            totalStaked: 0,
            loves: 0
        });
        
        _ownerTokens[msg.sender].push(tokenId);
        
        emit Minted(tokenId, msg.sender, dataHashes, descriptions);
    }
    
    /**
     * @notice Transfer full agent data ownership to another address
     * @param to Address to transfer agent to
     * @param tokenId The token to transfer
     * @param proofs Proofs of data availability for recipient
     */
    function transfer(
        address to,
        uint256 tokenId,
        bytes[] calldata proofs
    ) external nonReentrant {
        require(_exists(tokenId), "Token does not exist");
        require(_agents[tokenId].owner == msg.sender, "Not token owner");
        require(to != address(0), "Invalid recipient");
        require(to != msg.sender, "Cannot transfer to self");
        
        AIAgentData storage agent = _agents[tokenId];
        require(proofs.length == agent.dataHashes.length, "Mismatched proofs");
        
        bytes32[] memory newDataHashes = new bytes32[](proofs.length);
        
        // Verify all transfer validity proofs
        for (uint256 i = 0; i < proofs.length; i++) {
            IDataVerifier.TransferValidityProofOutput memory output = 
                verifier.verifyTransferValidity(proofs[i]);
            require(output.isValid, "Invalid transfer proof");
            require(
                output.oldDataHashes.length == 1 &&
                output.oldDataHashes[0] == agent.dataHashes[i], 
                "Hash mismatch"
            );
            require(output.newDataHashes.length == 1, "Expected single new hash");
            
            newDataHashes[i] = output.newDataHashes[0];
            
            // Publish sealed key for recipient
            emit PublishedSealedKey(to, tokenId, output.sealedKey);
        }
        
        // Update ownership
        _removeTokenFromOwner(msg.sender, tokenId);
        _ownerTokens[to].push(tokenId);
        
        // Update agent data
        emit Updated(tokenId, agent.dataHashes, newDataHashes);
        agent.dataHashes = newDataHashes;
        agent.owner = to;
        agent.authorizedUsers = new address[](0); // Clear authorizations
        
        emit Transferred(tokenId, msg.sender, to);
    }
    
    /**
     * @notice Clone agent data to a new token (data only, not ownership)
     * @param to Address to clone agent data to
     * @param tokenId The token to clone data from
     * @param proofs Proofs of data availability for recipient
     * @return newTokenId The ID of the newly cloned token
     */
    function clone(
        address to,
        uint256 tokenId,
        bytes[] calldata proofs
    ) external payable nonReentrant returns (uint256 newTokenId) {
        require(_exists(tokenId), "Token does not exist");
        require(_agents[tokenId].owner == msg.sender, "Not token owner");
        require(to != address(0), "Invalid recipient");
        
        AIAgentData storage sourceAgent = _agents[tokenId];
        require(proofs.length == sourceAgent.dataHashes.length, "Mismatched proofs");
        
        bytes32[] memory newDataHashes = new bytes32[](proofs.length);
        
        // Verify all transfer validity proofs
        for (uint256 i = 0; i < proofs.length; i++) {
            IDataVerifier.TransferValidityProofOutput memory output = 
                verifier.verifyTransferValidity(proofs[i]);
            require(output.isValid, "Invalid clone proof");
            require(
                output.oldDataHashes.length == 1 &&
                output.oldDataHashes[0] == sourceAgent.dataHashes[i], 
                "Hash mismatch"
            );
            require(output.newDataHashes.length == 1, "Expected single new hash");
            
            newDataHashes[i] = output.newDataHashes[0];
            
            emit PublishedSealedKey(to, tokenId, output.sealedKey);
        }
        
        newTokenId = _tokenIdCounter++;
        
        _agents[newTokenId] = AIAgentData({
            dataHashes: newDataHashes,
            dataDescriptions: sourceAgent.dataDescriptions,
            owner: to,
            authorizedUsers: new address[](0),
            createdAt: block.timestamp,
            isPublic: sourceAgent.isPublic,
            category: sourceAgent.category,
            name: string(abi.encodePacked(sourceAgent.name, " (Clone)")),
            totalStaked: 0,
            loves: 0
        });
        
        _ownerTokens[to].push(newTokenId);
        
        emit Cloned(tokenId, newTokenId, msg.sender, to);
    }
    
    /**
     * @notice Transfer public agent (no proofs needed)
     * @param to Address to transfer agent to
     * @param tokenId The token to transfer
     */
    function transferPublic(
        address to,
        uint256 tokenId
    ) external nonReentrant {
        require(_exists(tokenId), "Token does not exist");
        require(_agents[tokenId].owner == msg.sender, "Not token owner");
        require(_agents[tokenId].isPublic, "Agent is not public");
        require(to != address(0), "Invalid recipient");
        require(to != msg.sender, "Cannot transfer to self");
        
        // Update ownership
        _removeTokenFromOwner(msg.sender, tokenId);
        _ownerTokens[to].push(tokenId);
        
        _agents[tokenId].owner = to;
        _agents[tokenId].authorizedUsers = new address[](0); // Clear authorizations
        
        emit Transferred(tokenId, msg.sender, to);
    }
    
    /**
     * @notice Clone public agent (no proofs needed)
     * @param to Address to clone agent data to
     * @param tokenId The token to clone data from
     * @return newTokenId The ID of the newly cloned token
     */
    function clonePublic(
        address to,
        uint256 tokenId
    ) external payable nonReentrant returns (uint256 newTokenId) {
        require(_exists(tokenId), "Token does not exist");
        require(_agents[tokenId].isPublic, "Agent is not public");
        require(to != address(0), "Invalid recipient");
        
        AIAgentData storage sourceAgent = _agents[tokenId];
        newTokenId = _tokenIdCounter++;
        
        _agents[newTokenId] = AIAgentData({
            dataHashes: sourceAgent.dataHashes,
            dataDescriptions: sourceAgent.dataDescriptions,
            owner: to,
            authorizedUsers: new address[](0),
            createdAt: block.timestamp,
            isPublic: true,
            category: sourceAgent.category,
            name: string(abi.encodePacked(sourceAgent.name, " (Public Clone)")),
            totalStaked: 0,
            loves: 0
        });
        
        _ownerTokens[to].push(newTokenId);
        
        emit Cloned(tokenId, newTokenId, msg.sender, to);
    }
    
    /**
     * @notice Authorize a user to use the agent
     * @param tokenId The token to authorize usage for
     * @param user The user to authorize
     */
    function authorizeUsage(
        uint256 tokenId,
        address user
    ) external nonReentrant {
        require(_exists(tokenId), "Token does not exist");
        require(_agents[tokenId].owner == msg.sender, "Not token owner");
        require(user != address(0), "Invalid user");
        require(!_authorizations[tokenId][user], "Already authorized");
        
        _authorizations[tokenId][user] = true;
        _agents[tokenId].authorizedUsers.push(user);
        
        emit AuthorizedUsage(tokenId, user);
    }
    
    /**
     * @notice Get token owner
     * @param tokenId The token identifier
     * @return address The current owner of the token
     */
    function ownerOf(uint256 tokenId) external view returns (address) {
        require(_exists(tokenId), "Token does not exist");
        return _agents[tokenId].owner;
    }
    
    /**
     * @notice Get the authorized users of a token
     * @param tokenId The token identifier
     * @return address[] The current authorized users of the token
     */
    function authorizedUsersOf(uint256 tokenId) external view returns (address[] memory) {
        require(_exists(tokenId), "Token does not exist");
        return _agents[tokenId].authorizedUsers;
    }
    
    // ✅ MARKETPLACE INTEGRATION
    
    /**
     * @notice Stake ETH on an agent (marketplace integration)
     * @param tokenId The agent token to stake on
     */
    function stakeOnAgent(uint256 tokenId) external payable nonReentrant {
        require(_exists(tokenId), "Token does not exist");
        require(msg.value > 0, "Must stake > 0");
        
        _agents[tokenId].totalStaked += msg.value;
        
        // Revenue sharing with agent owner (70% to creator, 30% to platform)
        uint256 platformFee = (msg.value * 3000) / 10000; // 30%
        uint256 creatorAmount = msg.value - platformFee;
        
        address agentOwner = _agents[tokenId].owner;
        payable(agentOwner).transfer(creatorAmount);
        // Platform fee remains in contract
        
        emit AgentStaked(tokenId, msg.sender, msg.value);
    }
    
    /**
     * @notice Love an agent (increment love counter)
     * @param tokenId The agent token to love
     */
    function loveAgent(uint256 tokenId) external nonReentrant {
        require(_exists(tokenId), "Token does not exist");
        
        _agents[tokenId].loves++;
        
        emit AgentLoved(tokenId, msg.sender);
    }
    
    /**
     * @notice Get agent information for marketplace
     * @param tokenId The agent token ID
     * @return AIAgentData Complete agent data structure
     */
    function getAgentData(uint256 tokenId) external view returns (AIAgentData memory) {
        require(_exists(tokenId), "Token does not exist");
        return _agents[tokenId];
    }
    
    /**
     * @notice Get all agents owned by an address
     * @param owner The owner address
     * @return uint256[] Array of token IDs owned by the address
     */
    function getOwnerTokens(address owner) external view returns (uint256[] memory) {
        return _ownerTokens[owner];
    }
    
    /**
     * @notice Get total supply of tokens
     * @return uint256 Total number of minted tokens
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    // ✅ INTERNAL HELPER FUNCTIONS
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId < _tokenIdCounter && _agents[tokenId].owner != address(0);
    }
    
    function _removeTokenFromOwner(address owner, uint256 tokenId) internal {
        uint256[] storage tokens = _ownerTokens[owner];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
}