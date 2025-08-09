// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Enhanced Marketplace with Tiered Fee System
 * @author Senior Web3 AI Engineer
 * @notice Advanced marketplace with dynamic fee structure based on creator activity
 * @dev Implements tiered commission rates, royalties, and comprehensive trading features
 * 
 * Fee Structure:
 * - Tier 1 (New Creators, 0-4 agents): 5% platform fee
 * - Tier 2 (Active Creators, 5-9 agents): 4% platform fee  
 * - Tier 3 (Pro Creators, 10+ agents): 3% platform fee
 * - Creators always receive 95-97% depending on tier
 * - Royalties: 2.5% to original creator on secondary sales
 */

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./MockSapphire.sol";

contract EnhancedMarketplace is Ownable, ReentrancyGuard, MockSapphire, IERC721Receiver {
    using Address for address payable;

    // Creator tier structure
    enum CreatorTier {
        TIER1, // 0-4 agents: 5% fee
        TIER2, // 5-9 agents: 4% fee  
        TIER3  // 10+ agents: 3% fee
    }

    // Fee configuration
    struct FeeConfig {
        uint256 tier1Fee; // 500 = 5%
        uint256 tier2Fee; // 400 = 4%
        uint256 tier3Fee; // 300 = 3%
        uint256 royaltyFee; // 250 = 2.5%
        uint256 denominator; // 10000 = 100%
    }

    // Listing structure
    struct Listing {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address seller;
        address originalCreator;
        uint256 price;
        bool active;
        uint256 listedAt;
        uint256 expiresAt;
        bool isAuction;
        uint256 highestBid;
        address highestBidder;
        uint256 auctionEndTime;
    }

    // Offer structure
    struct Offer {
        uint256 offerId;
        uint256 listingId;
        address offerer;
        uint256 amount;
        uint256 expiresAt;
        bool active;
    }

    // Creator stats for tier calculation
    struct CreatorStats {
        uint256 totalAgentsCreated;
        uint256 totalSales;
        uint256 totalVolume;
        uint256 totalRoyaltiesEarned;
        CreatorTier currentTier;
        uint256 lastTierUpdate;
    }

    // State variables
    FeeConfig public feeConfig;
    uint256 private _listingIdCounter;
    uint256 private _offerIdCounter;
    
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Offer) public offers;
    mapping(address => CreatorStats) public creatorStats;
    mapping(address => uint256[]) public creatorListings;
    mapping(address => uint256[]) public userOffers;
    mapping(bytes32 => bool) private _listingExists; // nftContract + tokenId hash
    
    // Treasury and revenue tracking
    address public treasury;
    mapping(address => uint256) public creatorEarnings;
    mapping(address => uint256) public platformEarnings;
    uint256 public totalPlatformFees;
    uint256 public totalRoyaltiesPaid;

    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price,
        bool isAuction
    );

    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    
    event NFTPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price,
        uint256 platformFee,
        uint256 royalty
    );

    event OfferMade(
        uint256 indexed offerId,
        uint256 indexed listingId,
        address indexed offerer,
        uint256 amount
    );

    event OfferAccepted(
        uint256 indexed offerId,
        uint256 indexed listingId,
        address indexed offerer,
        uint256 amount
    );

    event CreatorTierUpdated(
        address indexed creator,
        CreatorTier oldTier,
        CreatorTier newTier,
        uint256 agentCount
    );

    event AuctionBid(
        uint256 indexed listingId,
        address indexed bidder,
        uint256 bidAmount,
        uint256 auctionEndTime
    );

    event AuctionEnded(
        uint256 indexed listingId,
        address indexed winner,
        uint256 winningBid
    );

    constructor(address _treasury) Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
        
        // Initialize fee configuration
        feeConfig = FeeConfig({
            tier1Fee: 500,  // 5%
            tier2Fee: 400,  // 4%
            tier3Fee: 300,  // 3%
            royaltyFee: 250, // 2.5%
            denominator: 10000 // 100%
        });
    }

    /**
     * @notice List an NFT for sale with automatic tier-based fee calculation
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to list
     * @param price Listing price in wei
     * @param originalCreator Original creator address for royalties
     * @param duration Listing duration in seconds (0 for indefinite)
     * @param isAuction Whether this is an auction listing
     * @return listingId The created listing ID
     */
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        address originalCreator,
        uint256 duration,
        bool isAuction
    ) external nonReentrant returns (uint256 listingId) {
        require(nftContract != address(0), "Invalid NFT contract");
        require(price > 0, "Price must be greater than 0");
        require(originalCreator != address(0), "Invalid original creator");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not the token owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) || 
            nft.getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );

        bytes32 listingKey = keccak256(abi.encodePacked(nftContract, tokenId));
        require(!_listingExists[listingKey], "Token already listed");

        _listingIdCounter++;
        listingId = _listingIdCounter;
        
        uint256 expiresAt = duration > 0 ? block.timestamp + duration : 0;
        uint256 auctionEndTime = isAuction && duration > 0 ? block.timestamp + duration : 0;

        listings[listingId] = Listing({
            listingId: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            originalCreator: originalCreator,
            price: price,
            active: true,
            listedAt: block.timestamp,
            expiresAt: expiresAt,
            isAuction: isAuction,
            highestBid: 0,
            highestBidder: address(0),
            auctionEndTime: auctionEndTime
        });

        _listingExists[listingKey] = true;
        creatorListings[msg.sender].push(listingId);

        // Update creator stats
        if (originalCreator == msg.sender) {
            _updateCreatorStats(msg.sender, true, 0, 0);
        }

        emit ListingCreated(listingId, nftContract, tokenId, msg.sender, price, isAuction);
        return listingId;
    }

    /**
     * @notice Purchase an NFT with automatic fee calculation based on seller's tier
     * @param listingId The listing ID to purchase
     */
    function buyNFT(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(!listing.isAuction, "Cannot directly buy auction item");
        require(listing.expiresAt == 0 || block.timestamp <= listing.expiresAt, "Listing expired");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");
        require(msg.value >= listing.price, "Insufficient payment");

        // Calculate fees based on seller's tier
        CreatorTier sellerTier = getCreatorTier(listing.seller);
        uint256 platformFee = _calculatePlatformFee(listing.price, sellerTier);
        uint256 royalty = 0;
        
        // Calculate royalty if this is a secondary sale
        if (listing.seller != listing.originalCreator) {
            royalty = (listing.price * feeConfig.royaltyFee) / feeConfig.denominator;
        }

        uint256 sellerAmount = listing.price - platformFee - royalty;

        // Execute transfers
        _executeSale(listingId, msg.sender, sellerAmount, platformFee, royalty);

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).sendValue(msg.value - listing.price);
        }

        emit NFTPurchased(listingId, msg.sender, listing.seller, listing.price, platformFee, royalty);
    }

    /**
     * @notice Place a bid on an auction
     * @param listingId The auction listing ID
     */
    function placeBid(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.isAuction, "Not an auction");
        require(block.timestamp <= listing.auctionEndTime, "Auction ended");
        require(msg.sender != listing.seller, "Cannot bid on your own auction");
        require(msg.value > listing.highestBid, "Bid too low");
        require(msg.value >= listing.price, "Bid below reserve price");

        // Refund previous highest bidder
        if (listing.highestBidder != address(0)) {
            payable(listing.highestBidder).sendValue(listing.highestBid);
        }

        listing.highestBid = msg.value;
        listing.highestBidder = msg.sender;

        // Extend auction if bid is placed in last 10 minutes
        if (listing.auctionEndTime - block.timestamp < 600) {
            listing.auctionEndTime = block.timestamp + 600; // Extend by 10 minutes
        }

        emit AuctionBid(listingId, msg.sender, msg.value, listing.auctionEndTime);
    }

    /**
     * @notice End an auction and execute sale to highest bidder
     * @param listingId The auction listing ID
     */
    function endAuction(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.isAuction, "Not an auction");
        require(block.timestamp > listing.auctionEndTime, "Auction still active");
        require(listing.highestBidder != address(0), "No bids received");

        // Calculate fees
        CreatorTier sellerTier = getCreatorTier(listing.seller);
        uint256 platformFee = _calculatePlatformFee(listing.highestBid, sellerTier);
        uint256 royalty = 0;
        
        if (listing.seller != listing.originalCreator) {
            royalty = (listing.highestBid * feeConfig.royaltyFee) / feeConfig.denominator;
        }

        uint256 sellerAmount = listing.highestBid - platformFee - royalty;

        // Execute sale to highest bidder
        _executeSale(listingId, listing.highestBidder, sellerAmount, platformFee, royalty);

        emit AuctionEnded(listingId, listing.highestBidder, listing.highestBid);
    }

    /**
     * @notice Make an offer on a listed NFT
     * @param listingId The listing ID
     * @param duration Offer duration in seconds
     */
    function makeOffer(uint256 listingId, uint256 duration) external payable nonReentrant {
        require(listings[listingId].active, "Listing not active");
        require(msg.value > 0, "Offer amount must be greater than 0");
        require(duration > 0 && duration <= 30 days, "Invalid duration");
        require(msg.sender != listings[listingId].seller, "Cannot make offer on your own NFT");

        _offerIdCounter++;
        uint256 offerId = _offerIdCounter;

        offers[offerId] = Offer({
            offerId: offerId,
            listingId: listingId,
            offerer: msg.sender,
            amount: msg.value,
            expiresAt: block.timestamp + duration,
            active: true
        });

        userOffers[msg.sender].push(offerId);

        emit OfferMade(offerId, listingId, msg.sender, msg.value);
    }

    /**
     * @notice Accept an offer on your listing
     * @param offerId The offer ID to accept
     */
    function acceptOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.active, "Offer not active");
        require(block.timestamp <= offer.expiresAt, "Offer expired");
        
        Listing storage listing = listings[offer.listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");

        // Calculate fees
        CreatorTier sellerTier = getCreatorTier(listing.seller);
        uint256 platformFee = _calculatePlatformFee(offer.amount, sellerTier);
        uint256 royalty = 0;
        
        if (listing.seller != listing.originalCreator) {
            royalty = (offer.amount * feeConfig.royaltyFee) / feeConfig.denominator;
        }

        uint256 sellerAmount = offer.amount - platformFee - royalty;

        // Deactivate offer
        offer.active = false;

        // Execute sale with offer amount
        _executeSaleWithOffer(offer.listingId, offer.offerer, sellerAmount, platformFee, royalty);

        emit OfferAccepted(offerId, offer.listingId, offer.offerer, offer.amount);
    }

    /**
     * @notice Cancel a listing (seller only)
     * @param listingId The listing ID to cancel
     */
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");

        // Refund highest bidder if auction
        if (listing.isAuction && listing.highestBidder != address(0)) {
            payable(listing.highestBidder).sendValue(listing.highestBid);
        }

        listing.active = false;
        bytes32 listingKey = keccak256(abi.encodePacked(listing.nftContract, listing.tokenId));
        _listingExists[listingKey] = false;

        emit ListingCancelled(listingId, msg.sender);
    }

    /**
     * @notice Get the current tier for a creator based on their agent count
     * @param creator The creator address
     * @return tier The current creator tier
     */
    function getCreatorTier(address creator) public view returns (CreatorTier tier) {
        uint256 agentCount = creatorStats[creator].totalAgentsCreated;
        
        if (agentCount >= 10) {
            return CreatorTier.TIER3; // 3% fee
        } else if (agentCount >= 5) {
            return CreatorTier.TIER2; // 4% fee
        } else {
            return CreatorTier.TIER1; // 5% fee
        }
    }

    /**
     * @notice Get the platform fee for a creator's tier
     * @param creator The creator address
     * @return feePercentage The fee percentage in basis points
     */
    function getCreatorFee(address creator) external view returns (uint256 feePercentage) {
        CreatorTier tier = getCreatorTier(creator);
        
        if (tier == CreatorTier.TIER3) {
            return feeConfig.tier3Fee;
        } else if (tier == CreatorTier.TIER2) {
            return feeConfig.tier2Fee;
        } else {
            return feeConfig.tier1Fee;
        }
    }

    // Internal functions

    function _calculatePlatformFee(uint256 amount, CreatorTier tier) internal view returns (uint256) {
        uint256 feeRate;
        
        if (tier == CreatorTier.TIER3) {
            feeRate = feeConfig.tier3Fee;
        } else if (tier == CreatorTier.TIER2) {
            feeRate = feeConfig.tier2Fee;
        } else {
            feeRate = feeConfig.tier1Fee;
        }
        
        return (amount * feeRate) / feeConfig.denominator;
    }

    function _executeSale(
        uint256 listingId,
        address buyer,
        uint256 sellerAmount,
        uint256 platformFee,
        uint256 royalty
    ) internal {
        Listing storage listing = listings[listingId];
        
        // Transfer NFT
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            buyer,
            listing.tokenId
        );

        // Transfer payments
        payable(listing.seller).sendValue(sellerAmount);
        
        if (royalty > 0) {
            payable(listing.originalCreator).sendValue(royalty);
            creatorStats[listing.originalCreator].totalRoyaltiesEarned += royalty;
            totalRoyaltiesPaid += royalty;
        }
        
        payable(treasury).sendValue(platformFee);
        
        // Update stats
        _updateCreatorStats(listing.seller, false, 1, listing.price);
        creatorEarnings[listing.seller] += sellerAmount;
        platformEarnings[treasury] += platformFee;
        totalPlatformFees += platformFee;

        // Deactivate listing
        listing.active = false;
        bytes32 listingKey = keccak256(abi.encodePacked(listing.nftContract, listing.tokenId));
        _listingExists[listingKey] = false;
    }

    function _executeSaleWithOffer(
        uint256 listingId,
        address buyer,
        uint256 sellerAmount,
        uint256 platformFee,
        uint256 royalty
    ) internal {
        // Same as _executeSale but uses pre-escrowed offer amount
        _executeSale(listingId, buyer, sellerAmount, platformFee, royalty);
    }

    function _updateCreatorStats(
        address creator,
        bool isNewAgent,
        uint256 salesIncrease,
        uint256 volumeIncrease
    ) internal {
        CreatorStats storage stats = creatorStats[creator];
        CreatorTier oldTier = stats.currentTier;
        
        if (isNewAgent) {
            stats.totalAgentsCreated++;
        }
        
        stats.totalSales += salesIncrease;
        stats.totalVolume += volumeIncrease;
        
        // Update tier if needed
        CreatorTier newTier = getCreatorTier(creator);
        if (newTier != oldTier) {
            stats.currentTier = newTier;
            stats.lastTierUpdate = block.timestamp;
            
            emit CreatorTierUpdated(creator, oldTier, newTier, stats.totalAgentsCreated);
        }
    }

    // View functions
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    function getOffer(uint256 offerId) external view returns (Offer memory) {
        return offers[offerId];
    }

    function getCreatorStats(address creator) external view returns (CreatorStats memory) {
        return creatorStats[creator];
    }

    function getUserOffers(address user) external view returns (uint256[] memory) {
        return userOffers[user];
    }

    function getCreatorListings(address creator) external view returns (uint256[] memory) {
        return creatorListings[creator];
    }

    // Admin functions
    function updateFeeConfig(
        uint256 tier1Fee,
        uint256 tier2Fee,
        uint256 tier3Fee,
        uint256 royaltyFee
    ) external onlyOwner {
        require(tier1Fee <= 1000, "Tier 1 fee too high"); // Max 10%
        require(tier2Fee <= 1000, "Tier 2 fee too high");
        require(tier3Fee <= 1000, "Tier 3 fee too high");
        require(royaltyFee <= 1000, "Royalty fee too high");
        require(tier1Fee >= tier2Fee && tier2Fee >= tier3Fee, "Invalid tier ordering");
        
        feeConfig.tier1Fee = tier1Fee;
        feeConfig.tier2Fee = tier2Fee;
        feeConfig.tier3Fee = tier3Fee;
        feeConfig.royaltyFee = royaltyFee;
    }

    function updateTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
    }

    function withdrawPlatformFees() external onlyOwner {
        payable(treasury).sendValue(address(this).balance);
    }

    // ERC721 Receiver
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}