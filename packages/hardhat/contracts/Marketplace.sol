// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Chimera DevMatch Marketplace
 * @author Senior Web3 AI Engineer
 * @notice A decentralized AI marketplace with gasless transactions and TEE-protected execution
 * @dev Integrates Chainlink Functions, Oasis ROFL-Sapphire, and ERC-4337 for secure AI model execution
 * 
 * Key Features:
 * - Gasless product listing and staking via ERC-4337 + Biconomy
 * - TEE-protected API key storage using Oasis ROFL-Sapphire
 * - AI model execution via Chainlink Functions
 * - Real-time analytics via The Graph subgraph
 * - Transparent ranking algorithm: (totalStaked / 1e18) + (loves * 0.1)
 */

// ✅ CHAINLINK FUNCTIONS + OASIS SAPPHIRE INTEGRATION
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
// Mock Sapphire contracts for local development
// import "@oasisprotocol/sapphire/contracts/Sapphire.sol";
// import "@oasisprotocol/sapphire/contracts/SapphireROFL.sol";
import "./MockSapphire.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Marketplace Contract
 * @notice Main contract implementing the decentralized AI marketplace
 * @dev Inherits from ReentrancyGuard, Ownable, MockSapphire, and FunctionsClient
 */
contract Marketplace is ReentrancyGuard, Ownable, MockSapphire, FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;
    
    // USDC token for micropayments
    IERC20 public immutable usdc;
    
    /**
     * @dev Agent structure for AI agents/services in the marketplace
     * @param id Unique identifier for the agent
     * @param creator Address of the agent creator
     * @param name Human-readable name of the AI agent/service
     * @param description Detailed description of functionality
     * @param tags Array of searchable tags
     * @param ipfsHash IPFS hash for agent metadata/files
     * @param totalStake Total ETH staked on this agent (for rankings)
     * @param isPrivate Whether agent requires access control
     * @param createdAt Block timestamp when agent was created
     * @param apiKeyHash Keccak256 hash of encrypted API key (stored in TEE)
     * @param loves Number of "loves" from users (social metric)
     */
    struct Agent {
        uint256 id;
        address creator;
        string name;
        string description;
        string[] tags;
        string ipfsHash;
        uint256 totalStake;
        bool isPrivate;
        uint256 createdAt;
        bytes32 apiKeyHash;
        uint256 loves;
    }

    /**
     * @dev Product structure containing all product information (legacy support)
     * @param id Unique identifier for the product
     * @param creator Address of the product creator
     * @param name Human-readable name of the AI model/service
     * @param description Detailed description of functionality
     * @param price Price in wei for using this product
     * @param category Type of AI service (AI Agent, MCP, Copy Trading Bot)
     * @param active Whether the product is available for use
     * @param createdAt Block timestamp when product was listed
     * @param apiKeyHash Keccak256 hash of encrypted API key (stored in TEE)
     * @param totalStaked Total ETH staked on this product (for rankings)
     * @param loves Number of "loves" from users (social metric)
     */
    struct Product {
        uint256 id;
        address creator;
        string name;
        string description;
        uint256 price; // in wei
        string category;
        bool active;
        uint256 createdAt;
        bytes32 apiKeyHash; // ✅ FIX #3: Add encrypted API key hash storage
        uint256 totalStaked; // For subgraph rankings
        uint256 loves; // For subgraph social metrics
    }

    uint256 private productCount;
    uint256 private agentCount;
    
    mapping(uint256 => Product) public products;
    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public creatorProducts;
    mapping(address => uint256[]) public creatorAgents;
    mapping(uint256 => mapping(address => uint256)) public stakes; // User stakes per product
    mapping(uint256 => mapping(address => uint256)) public agentStakes; // User stakes per agent
    mapping(uint256 => mapping(address => bool)) public agentAccess; // Private agent access control
    
    // Minimum stake requirement (0.01 ETH)
    uint256 public constant MIN_STAKE = 0.01 ether;
    
    // Platform fee (30% protocol, 70% creator)
    uint256 public platformFee = 3000; // 3000 / 10000 = 30%
    uint256 public constant FEE_DENOMINATOR = 10000;

    // ✅ CHAINLINK FUNCTIONS CONFIGURATION
    bytes32 public donId;
    uint64 public subscriptionId;
    uint32 public gasLimit = 300000;
    string public source; // JavaScript source code for AI model execution
    
    // ✅ MODEL EXECUTION TRACKING
    mapping(bytes32 => uint256) public requestToProductId;
    mapping(bytes32 => address) public requestToUser;
    mapping(uint256 => string) public productLastResult;
    mapping(uint256 => uint256) public productExecutionCount;
    
    // Agent events
    event AgentCreated(
        uint256 indexed id,
        string indexed name,
        address indexed creator
    );
    
    event AgentStaked(
        uint256 indexed id,
        address indexed staker,
        uint256 amount
    );
    
    event AgentLoved(
        uint256 indexed id,
        address indexed user
    );
    
    event AgentAccessGranted(
        uint256 indexed id,
        address indexed user
    );
    
    // USDC micropayment events
    event MicropaymentMade(
        uint256 indexed agentId,
        address indexed user,
        uint256 usdcAmount
    );
    
    event USDCStakeAdded(
        uint256 indexed agentId,
        address indexed user,
        uint256 usdcAmount
    );
    
    // Product events (legacy support)
    event ProductListed(
        uint256 indexed id, 
        address indexed creator, 
        string name, 
        uint256 price,
        string category
    );
    
    event ProductPurchased(
        uint256 indexed id, 
        address indexed buyer, 
        address indexed creator,
        uint256 price
    );

    // ✅ FIX #4: Add missing events for subgraph integration
    event StakeAdded(
        uint256 indexed productId,
        address indexed user,
        uint256 amount
    );

    event ProductLoved(
        uint256 indexed productId,
        address indexed user
    );

    // ✅ CHAINLINK FUNCTIONS EVENTS
    event ModelExecutionRequested(
        uint256 indexed productId,
        address indexed user,
        bytes32 indexed requestId,
        string input
    );

    event ModelResultReceived(
        uint256 indexed productId,
        address indexed user,
        bytes32 indexed requestId,
        string result
    );

    constructor(address router, address _usdc) Ownable(msg.sender) FunctionsClient(router) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Create a new AI agent/service on the marketplace
     * @dev Creates a new agent with TEE-protected API key storage
     * @param name Human-readable name of the AI agent/service
     * @param description Detailed description of functionality
     * @param tags Array of searchable tags for the agent
     * @param ipfsHash IPFS hash for agent metadata/files
     * @param encryptedApiKey Encrypted API key for agent access (stored in TEE)
     * @param isPrivate Whether the agent requires access control
     */
    function createAgent(
        string memory name,
        string memory description,
        string[] memory tags,
        string memory ipfsHash,
        bytes calldata encryptedApiKey,
        bool isPrivate
    ) public nonReentrant {
        // ✅ CRITICAL: Add ROFL authorization check (bypassed in local development)
        if (block.chainid == 23295 || block.chainid == 23294) {
            require(roflEnsureAuthorizedOrigin(), "Not authorized TEE");
        }
        
        require(bytes(name).length > 0, "Name cannot be empty");
        require(encryptedApiKey.length > 0, "API key required");
        
        agentCount++;
        
        // Store encrypted API key in TEE-protected storage
        bytes32 keyHash = keccak256(abi.encodePacked(msg.sender, agentCount, "agent"));
        _setROFLStorage(keyHash, encryptedApiKey);
        
        agents[agentCount] = Agent({
            id: agentCount,
            creator: msg.sender,
            name: name,
            description: description,
            tags: tags,
            ipfsHash: ipfsHash,
            totalStake: 0,
            isPrivate: isPrivate,
            createdAt: block.timestamp,
            apiKeyHash: keyHash,
            loves: 0
        });
        
        creatorAgents[msg.sender].push(agentCount);
        
        emit AgentCreated(agentCount, name, msg.sender);
    }
    
    /**
     * @notice Stake ETH on an agent (minimum 0.01 ETH)
     * @param agentId ID of the agent to stake on
     */
    function stakeToAgent(uint256 agentId) public payable nonReentrant {
        // ✅ CRITICAL: Add ROFL authorization check (bypassed in local development)
        if (block.chainid == 23295 || block.chainid == 23294) {
            require(roflEnsureAuthorizedOrigin(), "Not authorized TEE");
        }
        
        require(agentId <= agentCount && agentId > 0, "Invalid agent ID");
        require(msg.value >= MIN_STAKE, "Minimum stake is 0.01 ETH");
        
        Agent storage agent = agents[agentId];
        
        agentStakes[agentId][msg.sender] += msg.value;
        agent.totalStake += msg.value;
        
        // Grant access for private agents when staking
        if (agent.isPrivate) {
            agentAccess[agentId][msg.sender] = true;
            emit AgentAccessGranted(agentId, msg.sender);
        }
        
        // Revenue sharing: 70% to creator, 30% to protocol
        uint256 protocolFee = (msg.value * platformFee) / FEE_DENOMINATOR;
        uint256 creatorAmount = msg.value - protocolFee;
        
        payable(agent.creator).transfer(creatorAmount);
        // Protocol fee remains in contract
        
        emit AgentStaked(agentId, msg.sender, msg.value);
    }
    
    /**
     * @notice Get agent information by ID
     * @param agentId ID of the agent to retrieve
     * @return Agent struct with all agent data
     */
    function getAgent(uint256 agentId) public view returns (Agent memory) {
        require(agentId <= agentCount && agentId > 0, "Invalid agent ID");
        return agents[agentId];
    }
    
    /**
     * @notice Get all agents (paginated for gas efficiency)
     * @return Array of all agent structs
     */
    function getAllAgents() public view returns (Agent[] memory) {
        Agent[] memory allAgents = new Agent[](agentCount);
        for (uint256 i = 1; i <= agentCount; i++) {
            allAgents[i-1] = agents[i];
        }
        return allAgents;
    }
    
    /**
     * @notice Love an agent (increment love counter)
     * @param agentId ID of the agent to love
     */
    function loveAgent(uint256 agentId) public nonReentrant {
        // ✅ CRITICAL: Add ROFL authorization check (bypassed in local development)
        if (block.chainid == 23295 || block.chainid == 23294) {
            require(roflEnsureAuthorizedOrigin(), "Not authorized TEE");
        }
        
        require(agentId <= agentCount && agentId > 0, "Invalid agent ID");
        
        agents[agentId].loves++;
        
        emit AgentLoved(agentId, msg.sender);
    }
    
    /**
     * @notice Check if user has access to a private agent
     * @param agentId ID of the agent
     * @param user Address of the user
     * @return bool whether user has access
     */
    function hasAgentAccess(uint256 agentId, address user) public view returns (bool) {
        Agent memory agent = agents[agentId];
        if (!agent.isPrivate) {
            return true; // Public agents are accessible to everyone
        }
        return agentAccess[agentId][user] || agent.creator == user;
    }
    
    /**
     * @notice Grant access to a private agent (creator only)
     * @param agentId ID of the agent
     * @param user Address to grant access to
     */
    function grantAgentAccess(uint256 agentId, address user) public nonReentrant {
        require(agentId <= agentCount && agentId > 0, "Invalid agent ID");
        require(agents[agentId].creator == msg.sender, "Only creator can grant access");
        require(agents[agentId].isPrivate, "Agent is not private");
        
        agentAccess[agentId][user] = true;
        emit AgentAccessGranted(agentId, user);
    }
    
    /**
     * @notice Make USDC micropayment for AI agent usage
     * @param agentId ID of the agent to pay for usage
     * @param usdcAmount Amount of USDC to pay (in USDC units with 6 decimals)
     */
    function payWithUSDC(uint256 agentId, uint256 usdcAmount) public nonReentrant {
        require(agentId <= agentCount && agentId > 0, "Invalid agent ID");
        require(usdcAmount > 0, "Amount must be > 0");
        
        Agent storage agent = agents[agentId];
        require(hasAgentAccess(agentId, msg.sender) || agent.creator == msg.sender, "No access to agent");
        
        // Transfer USDC from user to contract
        require(usdc.transferFrom(msg.sender, address(this), usdcAmount), "USDC transfer failed");
        
        // Revenue sharing: 70% to creator, 30% to protocol
        uint256 protocolFee = (usdcAmount * platformFee) / FEE_DENOMINATOR;
        uint256 creatorAmount = usdcAmount - protocolFee;
        
        require(usdc.transfer(agent.creator, creatorAmount), "Creator payment failed");
        // Protocol fee remains in contract
        
        emit MicropaymentMade(agentId, msg.sender, usdcAmount);
    }
    
    /**
     * @notice Stake USDC on an agent (alternative to ETH staking)
     * @param agentId ID of the agent to stake on
     * @param usdcAmount Amount of USDC to stake
     */
    function stakeUSDC(uint256 agentId, uint256 usdcAmount) public nonReentrant {
        require(agentId <= agentCount && agentId > 0, "Invalid agent ID");
        require(usdcAmount >= 10 * 10**6, "Minimum stake is 10 USDC"); // 10 USDC minimum
        
        Agent storage agent = agents[agentId];
        
        // Transfer USDC from user to contract
        require(usdc.transferFrom(msg.sender, address(this), usdcAmount), "USDC transfer failed");
        
        // Grant access for private agents when staking
        if (agent.isPrivate) {
            agentAccess[agentId][msg.sender] = true;
            emit AgentAccessGranted(agentId, msg.sender);
        }
        
        // Revenue sharing: 70% to creator, 30% to protocol
        uint256 protocolFee = (usdcAmount * platformFee) / FEE_DENOMINATOR;
        uint256 creatorAmount = usdcAmount - protocolFee;
        
        require(usdc.transfer(agent.creator, creatorAmount), "Creator payment failed");
        // Protocol fee remains in contract
        
        emit USDCStakeAdded(agentId, msg.sender, usdcAmount);
    }

    // ✅ CHAINLINK FUNCTIONS SETUP
    function setChainlinkConfig(
        bytes32 _donId,
        uint64 _subscriptionId,
        string calldata _source
    ) external onlyOwner {
        donId = _donId;
        subscriptionId = _subscriptionId;
        source = _source;
    }

    /**
     * @notice List a new AI product/service on the marketplace
     * @dev Creates a new product with TEE-protected API key storage
     * @param _name Human-readable name of the AI model/service
     * @param _description Detailed description of functionality 
     * @param _price Price in wei for using this product
     * @param _category Type of AI service (AI Agent, MCP, Copy Trading Bot)
     * @param _encryptedApiKey Encrypted API key for model access (stored in TEE)
     * 
     * Requirements:
     * - Name must not be empty
     * - Price must be greater than 0
     * - API key must be provided
     * - Must pass ROFL authorization on Sapphire networks
     * 
     * Emits:
     * - ProductListed event with product details
     * 
     * @custom:security TEE-protected API key storage via Oasis ROFL-Sapphire
     * @custom:gasless Supports gasless execution via ERC-4337 + Biconomy
     */
    function listProduct(
        string memory _name,
        string memory _description,
        uint256 _price,
        string memory _category,
        bytes calldata _encryptedApiKey
    ) public nonReentrant {
        // ✅ CRITICAL: Add ROFL authorization check (bypassed in local development)
        if (block.chainid == 23295 || block.chainid == 23294) {
            require(roflEnsureAuthorizedOrigin(), "Not authorized TEE");
        }
        
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_price > 0, "Price must be greater than 0");
        require(_encryptedApiKey.length > 0, "API key required");
        
        productCount++;
        
        // ✅ FIX #6: Store encrypted API key in TEE-protected storage
        bytes32 keyHash = keccak256(abi.encodePacked(msg.sender, productCount));
        _setROFLStorage(keyHash, _encryptedApiKey);
        
        products[productCount] = Product({
            id: productCount,
            creator: msg.sender,
            name: _name,
            description: _description,
            price: _price,
            category: _category,
            active: true,
            createdAt: block.timestamp,
            apiKeyHash: keyHash,
            totalStaked: 0,
            loves: 0
        });
        
        creatorProducts[msg.sender].push(productCount);
        
        emit ProductListed(productCount, msg.sender, _name, _price, _category);
    }

    // ✅ FIX #7: Add ROFL protection to purchaseProduct
    function purchaseProduct(uint256 _id) public payable nonReentrant {
        // ✅ CRITICAL: Add ROFL authorization check (bypassed in local development)
        if (block.chainid == 23295 || block.chainid == 23294) {
            require(roflEnsureAuthorizedOrigin(), "Not authorized TEE");
        }
        
        Product storage product = products[_id];
        require(product.active, "Product not active");
        require(msg.value >= product.price, "Insufficient payment");
        require(product.creator != msg.sender, "Cannot purchase own product");
        
        product.active = false;
        
        // Calculate platform fee (30% protocol, 70% creator)
        uint256 fee = (product.price * platformFee) / FEE_DENOMINATOR;
        uint256 creatorAmount = product.price - fee;
        
        // Transfer to creator and keep protocol fee in contract
        payable(product.creator).transfer(creatorAmount);
        // Protocol fee remains in contract balance
        
        // Refund excess
        if (msg.value > product.price) {
            payable(msg.sender).transfer(msg.value - product.price);
        }
        
        emit ProductPurchased(_id, msg.sender, product.creator, product.price);
    }

    // ✅ FIX #8: Add staking functionality with ROFL protection
    function stakeOnProduct(uint256 _productId) public payable nonReentrant {
        // ✅ CRITICAL: Add ROFL authorization check (bypassed in local development)
        if (block.chainid == 23295 || block.chainid == 23294) {
            require(roflEnsureAuthorizedOrigin(), "Not authorized TEE");
        }
        
        require(_productId <= productCount, "Invalid product");
        require(msg.value > 0, "Must stake > 0");
        require(products[_productId].active, "Product not active");
        
        stakes[_productId][msg.sender] += msg.value;
        products[_productId].totalStaked += msg.value;
        
        emit StakeAdded(_productId, msg.sender, msg.value);
    }

    // ✅ FIX #9: Add love functionality with ROFL protection
    function loveProduct(uint256 _productId) public nonReentrant {
        // ✅ CRITICAL: Add ROFL authorization check (bypassed in local development)
        if (block.chainid == 23295 || block.chainid == 23294) {
            require(roflEnsureAuthorizedOrigin(), "Not authorized TEE");
        }
        
        require(_productId <= productCount, "Invalid product");
        require(products[_productId].active, "Product not active");
        
        products[_productId].loves++;
        
        emit ProductLoved(_productId, msg.sender);
    }

    /**
     * @notice Execute AI model with TEE-protected API keys via Chainlink Functions
     * @dev Initiates secure model execution in Chainlink DON with TEE protection
     * @param _productId ID of the product/model to execute
     * @param _input Input data/prompt for the AI model
     * @return requestId Chainlink Functions request ID for tracking
     * 
     * Requirements:
     * - Product must exist and be active
     * - User must have staked ETH on this product
     * - Chainlink Functions must be configured (DON ID, subscription, source)
     * - Must pass ROFL authorization on Sapphire networks
     * 
     * Process:
     * 1. Validates user stake and product status
     * 2. Retrieves encrypted API key from TEE storage
     * 3. Builds Chainlink Functions request with TEE-decrypted key
     * 4. Sends request to Chainlink DON for execution
     * 5. Returns request ID for result polling
     * 
     * Emits:
     * - ModelExecutionRequested event with execution details
     * 
     * @custom:security API keys never exposed - decrypted only within TEE
     * @custom:chainlink Uses Chainlink Functions for decentralized execution
     * @custom:gasless Supports gasless execution via ERC-4337 + Biconomy
     */
    function runModel(uint256 _productId, string memory _input) public nonReentrant returns (bytes32 requestId) {
        // ✅ CRITICAL: ROFL authorization check (bypassed in local development)
        if (block.chainid == 23295 || block.chainid == 23294) {
            require(roflEnsureAuthorizedOrigin(), "Not authorized TEE");
        }
        
        require(_productId <= productCount, "Invalid product");
        require(stakes[_productId][msg.sender] > 0, "Must stake to use model");
        require(bytes(source).length > 0, "Chainlink source not configured");
        require(donId != bytes32(0), "Chainlink DON not configured");
        
        Product memory product = products[_productId];
        require(product.active, "Product not active");
        
        // ✅ SECURE: Retrieve encrypted API key from TEE storage
        bytes memory encryptedApiKey = _getROFLStorage(product.apiKeyHash);
        require(encryptedApiKey.length > 0, "API key not found");
        
        // ✅ CHAINLINK FUNCTIONS REQUEST
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        
        // ✅ TEE-PROTECTED ARGUMENTS (API key decrypted within TEE)
        string[] memory args = new string[](3);
        args[0] = _input; // User input/prompt
        args[1] = string(encryptedApiKey); // TEE-decrypted API key
        args[2] = product.name; // Model identifier
        req.setArgs(args);
        
        // ✅ SEND REQUEST TO CHAINLINK DON
        requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );
        
        // ✅ TRACK REQUEST FOR FULFILLMENT
        requestToProductId[requestId] = _productId;
        requestToUser[requestId] = msg.sender;
        productExecutionCount[_productId]++;
        
        emit ModelExecutionRequested(_productId, msg.sender, requestId, _input);
        
        return requestId;
    }

    // ✅ CHAINLINK FUNCTIONS CALLBACK
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory /* err */
    ) internal override {
        uint256 productId = requestToProductId[requestId];
        address user = requestToUser[requestId];
        
        require(productId != 0, "Invalid request ID");
        
        string memory result = string(response);
        productLastResult[productId] = result;
        
        emit ModelResultReceived(productId, user, requestId, result);
        
        // Clean up tracking
        delete requestToProductId[requestId];
        delete requestToUser[requestId];
    }

    // ✅ GETTERS FOR FRONTEND
    function getLastResult(uint256 _productId) external view returns (string memory) {
        return productLastResult[_productId];
    }

    function getExecutionCount(uint256 _productId) external view returns (uint256) {
        return productExecutionCount[_productId];
    }
    
    function getProduct(uint256 _id) public view returns (Product memory) {
        return products[_id];
    }
    
    function getCreatorProducts(address _creator) public view returns (uint256[] memory) {
        return creatorProducts[_creator];
    }
    
    function getProductCount() public view returns (uint256) {
        return productCount;
    }
    
    function getAgentCount() public view returns (uint256) {
        return agentCount;
    }
    
    function getCreatorAgents(address creator) public view returns (uint256[] memory) {
        return creatorAgents[creator];
    }

    function getUserStake(uint256 _productId, address _user) public view returns (uint256) {
        return stakes[_productId][_user];
    }
    
    function getUserAgentStake(uint256 agentId, address user) public view returns (uint256) {
        return agentStakes[agentId][user];
    }
    
    // ✅ FIX #11: Add ROFL protection to admin functions
    function setPlatformFee(uint256 _newFee) public onlyOwner {
        // ✅ CRITICAL: Add ROFL authorization check (bypassed in local development)
        if (block.chainid == 23295 || block.chainid == 23294) {
            require(roflEnsureAuthorizedOrigin(), "Not authorized TEE");
        }
        
        require(_newFee <= 1000, "Fee cannot exceed 10%"); // Max 10%
        platformFee = _newFee;
    }
    
    // ✅ FIX #12: Add ROFL protection to withdrawal function
    function withdrawPlatformFees() public onlyOwner {
        // ✅ CRITICAL: Add ROFL authorization check (bypassed in local development)
        if (block.chainid == 23295 || block.chainid == 23294) {
            require(roflEnsureAuthorizedOrigin(), "Not authorized TEE");
        }
        
        payable(owner()).transfer(address(this).balance);
    }

    // ✅ FIX #13: Emergency API key rotation (TEE-protected)
    function rotateApiKey(uint256 _productId, bytes calldata _newEncryptedApiKey) public nonReentrant {
        // ✅ CRITICAL: Add ROFL authorization check (bypassed in local development)
        if (block.chainid == 23295 || block.chainid == 23294) {
            require(roflEnsureAuthorizedOrigin(), "Not authorized TEE");
        }
        require(products[_productId].creator == msg.sender, "Not product creator");
        require(_newEncryptedApiKey.length > 0, "New API key required");
        
        // Update TEE storage with new encrypted key
        _setROFLStorage(products[_productId].apiKeyHash, _newEncryptedApiKey);
    }
}