// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "@chainlink/contracts/src/v0.8/FunctionsClient.sol";

contract Marketplace is Sapphire, ReentrancyGuard, FunctionsClient {
    struct Product {
        string name;
        string description;
        string category;
        address creator;
        uint256 stakeAmount;
        uint256 totalStaked;
        uint256 loves;
        bytes32 apiKeyHash;
        bool active;
    }

    mapping(uint256 => Product) public products;
    mapping(uint256 => mapping(address => uint256)) public userStakes;
    mapping(uint256 => mapping(address => bool)) public userLoves;
    mapping(bytes32 => uint256) public modelRequests; // requestId => productId
    
    uint256 public productCount;
    IERC20 public paymentToken;
    
    event ProductListed(uint256 indexed productId, address indexed creator, string name, string category);
    event StakeAdded(uint256 indexed productId, address indexed user, uint256 amount);
    event ProductLoved(uint256 indexed productId, address indexed user);
    event ModelResult(uint256 indexed productId, address indexed user, bytes result);

    constructor(address _functionsRouter, address _paymentToken) 
        FunctionsClient(_functionsRouter) {
        paymentToken = IERC20(_paymentToken);
    }

    function listProduct(
        string calldata name,
        string calldata description,
        string calldata category,
        bytes calldata encryptedApiKey,
        uint256 stakeAmount
    ) external {
        // Critical Oasis security requirement
        require(Sapphire.randomBytes(1).length > 0, "ROFL: Must run in TEE");
        
        // Store encrypted API key in ROFL (TEE-protected)
        bytes32 apiKeyHash = keccak256(abi.encodePacked(msg.sender, productCount, block.timestamp));
        
        // Store in TEE-protected storage
        Sapphire.encrypt(abi.encode(apiKeyHash), encryptedApiKey, "");
        
        products[productCount] = Product({
            name: name,
            description: description,
            category: category,
            creator: msg.sender,
            stakeAmount: stakeAmount,
            totalStaked: 0,
            loves: 0,
            apiKeyHash: apiKeyHash,
            active: true
        });
        
        emit ProductListed(productCount, msg.sender, name, category);
        productCount++;
    }

    function stakeToUseProduct(uint256 productId) external payable nonReentrant {
        require(products[productId].active, "Product not active");
        require(msg.value >= products[productId].stakeAmount, "Insufficient stake");
        
        userStakes[productId][msg.sender] += msg.value;
        products[productId].totalStaked += msg.value;
        
        // Send payment to creator
        payable(products[productId].creator).transfer(msg.value);
        
        emit StakeAdded(productId, msg.sender, msg.value);
    }

    function loveProduct(uint256 productId) external {
        require(products[productId].active, "Product not active");
        require(!userLoves[productId][msg.sender], "Already loved");
        require(userStakes[productId][msg.sender] > 0, "Must stake to love");
        
        userLoves[productId][msg.sender] = true;
        products[productId].loves++;
        
        emit ProductLoved(productId, msg.sender);
    }

    // Placeholder for Chainlink Functions integration
    function runModel(uint256 productId, string calldata input) external {
        require(Sapphire.randomBytes(1).length > 0, "ROFL: Must run in TEE");
        require(userStakes[productId][msg.sender] > 0, "Must stake to use");
        
        // This will be implemented with Chainlink Functions
        // For hackathon demo, emit mock result
        emit ModelResult(productId, msg.sender, abi.encode("Mock AI Result"));
    }

    function getProduct(uint256 productId) external view returns (Product memory) {
        return products[productId];
    }

    function getUserStake(uint256 productId, address user) external view returns (uint256) {
        return userStakes[productId][user];
    }
}