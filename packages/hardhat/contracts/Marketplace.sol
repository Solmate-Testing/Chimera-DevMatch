// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ✅ CORRECTED IMPORT PATHS
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";  // security -> utils
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract Marketplace is ReentrancyGuard, Ownable {
    struct Product {
        uint256 id;
        address creator;
        string name;
        string description;
        uint256 price; // in wei
        string category;
        bool active;
        uint256 createdAt;
    }

    uint256 private productCount;
    mapping(uint256 => Product) public products;
    mapping(address => uint256[]) public creatorProducts;
    
    // Platform fee (2.5%)
    uint256 public platformFee = 250; // 250 / 10000 = 2.5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
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

    constructor() Ownable(msg.sender) {}

    function listProduct(
        string memory _name,
        string memory _description,
        uint256 _price,
        string memory _category
    ) public nonReentrant {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_price > 0, "Price must be greater than 0");
        
        productCount++;
        products[productCount] = Product({
            id: productCount,
            creator: msg.sender,
            name: _name,
            description: _description,
            price: _price,
            category: _category,
            active: true,
            createdAt: block.timestamp
        });
        
        creatorProducts[msg.sender].push(productCount);
        
        emit ProductListed(productCount, msg.sender, _name, _price, _category);
    }

    function purchaseProduct(uint256 _id) public payable nonReentrant {
        Product storage product = products[_id];
        require(product.active, "Product not active");
        require(msg.value >= product.price, "Insufficient payment");
        require(product.creator != msg.sender, "Cannot purchase own product");
        
        product.active = false;
        
        // Calculate platform fee
        uint256 fee = (product.price * platformFee) / FEE_DENOMINATOR;
        uint256 creatorAmount = product.price - fee;
        
        // Transfer to creator and platform
        payable(product.creator).transfer(creatorAmount);
        payable(owner()).transfer(fee);
        
        // Refund excess
        if (msg.value > product.price) {
            payable(msg.sender).transfer(msg.value - product.price);
        }
        
        emit ProductPurchased(_id, msg.sender, product.creator, product.price);
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
    
    // Owner functions
    function setPlatformFee(uint256 _newFee) public onlyOwner {
        require(_newFee <= 1000, "Fee cannot exceed 10%"); // Max 10%
        platformFee = _newFee;
    }
    
    function withdrawPlatformFees() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}