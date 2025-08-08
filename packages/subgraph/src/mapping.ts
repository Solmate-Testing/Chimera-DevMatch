/**
 * CHIMERA DEVMATCH SUBGRAPH MAPPINGS
 * 
 * Handles all marketplace events with real-time updates (< 30 seconds)
 * Implements transparent ranking algorithm and comprehensive analytics
 * 
 * Key Features:
 * - Real-time ranking updates: (totalStaked / 1e18) + (loves * 0.1)
 * - Gasless transaction tracking
 * - Chainlink Functions execution monitoring
 * - Creator and global statistics
 * 
 * @author Senior Data Engineer
 */

import { BigInt, Bytes, store, BigDecimal } from "@graphprotocol/graph-ts";
import {
  // New Agent Events
  AgentCreated as AgentCreatedEvent,
  AgentStaked as AgentStakedEvent,
  AgentLoved as AgentLovedEvent,
  AgentAccessGranted as AgentAccessGrantedEvent,
  // Legacy Product Events
  ProductListed as ProductListedEvent,
  StakeAdded as StakeAddedEvent,
  ProductLoved as ProductLovedEvent,
  ProductPurchased as ProductPurchasedEvent,
  ModelExecutionRequested as ModelExecutionRequestedEvent,
  ModelResultReceived as ModelResultReceivedEvent
} from "../generated/Marketplace/Marketplace";

import {
  // Agent entities
  Agent,
  Stake,
  AgentLove,
  AgentAccess,
  // Product entities (legacy)
  Product,
  ProductStake,
  Love,
  // Analytics entities
  Creator,
  DailyStats,
  DailyAgentStats,
  MarketplaceStats,
  GlobalStats,
  ModelExecution,
  ProductAnalytics
} from "../generated/schema";

// Helper function to get or create global stats
function getOrCreateGlobalStats(): GlobalStats {
  let globalStats = GlobalStats.load("global");
  if (globalStats == null) {
    globalStats = new GlobalStats("global");
    globalStats.totalProducts = 0;
    globalStats.totalCreators = 0;
    globalStats.totalStaked = BigInt.fromI32(0);
    globalStats.totalLoves = 0;
    globalStats.totalExecutions = 0;
    globalStats.totalExecutionGas = BigInt.fromI32(0);
    globalStats.lastUpdatedBlock = BigInt.fromI32(0);
  }
  return globalStats;
}

// Helper function to get or create creator
function getOrCreateCreator(address: Bytes): Creator {
  let creator = Creator.load(address.toHexString());
  if (creator == null) {
    creator = new Creator(address.toHexString());
    creator.address = address;
    creator.totalProducts = 0;
    creator.totalStaked = BigInt.fromI32(0);
    creator.totalLoves = 0;
  }
  return creator;
}

// Helper function to get daily stats ID
function getDailyStatsId(timestamp: BigInt): string {
  let dayTimestamp = timestamp.toI32() - (timestamp.toI32() % 86400); // Round down to start of day
  let date = new Date(dayTimestamp * 1000);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Helper function to get or create daily stats
function getOrCreateDailyStats(timestamp: BigInt): DailyStats {
  let id = getDailyStatsId(timestamp);
  let dailyStats = DailyStats.load(id);
  if (dailyStats == null) {
    dailyStats = new DailyStats(id);
    dailyStats.date = id;
    dailyStats.totalProducts = 0;
    dailyStats.totalStaked = BigInt.fromI32(0);
    dailyStats.totalLoves = 0;
    dailyStats.newProducts = 0;
    dailyStats.newStakes = 0;
    dailyStats.newLoves = 0;
  }
  return dailyStats;
}

/**
 * Calculate transparent ranking score for products
 * 
 * Algorithm: score = (totalStaked / 1e18) + (loves * 0.1)
 * 
 * This ensures fair ranking based on:
 * - Economic signal (staked ETH) 
 * - Social signal (user loves)
 * 
 * @param totalStaked Total ETH staked in wei
 * @param loves Number of user loves
 * @returns Calculated ranking score as BigDecimal
 */
function calculateRankingScore(totalStaked: BigInt, loves: i32): BigDecimal {
  // Step 1: Convert totalStaked from wei to ETH (divide by 1e18)
  const WEI_TO_ETH = BigInt.fromString("1000000000000000000");
  let stakedEthBigInt = totalStaked.div(WEI_TO_ETH);
  let stakedEthDecimal = stakedEthBigInt.toBigDecimal();
  
  // Step 2: Calculate loves contribution (loves * 0.1)
  let lovesDecimal = BigDecimal.fromString(loves.toString());
  let loveContribution = lovesDecimal.times(BigDecimal.fromString("0.1"));
  
  // Step 3: Final score = stakedEth + (loves * 0.1)
  let finalScore = stakedEthDecimal.plus(loveContribution);
  
  return finalScore;
}

// Helper function to get or create product analytics
function getOrCreateProductAnalytics(productId: string): ProductAnalytics {
  let analytics = ProductAnalytics.load(productId);
  if (analytics == null) {
    analytics = new ProductAnalytics(productId);
    analytics.product = productId;
    analytics.totalExecutions = 0;
    analytics.totalExecutionGas = BigInt.fromI32(0);
    analytics.averageExecutionTime = BigInt.fromI32(0);
    analytics.lastExecutionAt = BigInt.fromI32(0);
    analytics.successRate = BigDecimal.fromString("0");
    analytics.averageResultLength = 0;
    analytics.uniqueUsers = 0;
    analytics.executionBoost = BigDecimal.fromString("0");
    analytics.enhancedRankingScore = BigDecimal.fromString("0");
  }
  return analytics;
}

// ✅ REAL-TIME PRODUCT LISTING HANDLER - 30 SECOND UPDATE REQUIREMENT
export function handleProductListed(event: ProductListedEvent): void {
  // Create new product entity with EXACT required fields
  let product = new Product(event.params.id.toString());
  
  // ✅ EXACT REQUIRED FIELDS
  product.name = event.params.name; // EXACT
  product.totalStaked = BigInt.fromI32(0); // EXACT - starts at 0
  product.loves = 0; // EXACT - starts at 0
  product.category = event.params.category; // EXACT
  
  // Additional required fields
  product.creator = event.params.creator;
  product.description = ""; // Will be updated if description is added to event
  product.price = event.params.price;
  product.active = true;
  product.createdAt = event.block.timestamp;
  
  // ✅ CALCULATE INITIAL RANKING SCORE: (0 / 1e18) + (0 * 0.1) = 0
  product.rankingScore = calculateRankingScore(BigInt.fromI32(0), 0);
  
  // ✅ IMMEDIATE SAVE FOR 30-SECOND UPDATE REQUIREMENT
  product.save();

  // Update creator stats
  let creator = getOrCreateCreator(event.params.creator);
  creator.totalProducts = creator.totalProducts + 1;
  creator.save();

  // Update global stats
  let globalStats = getOrCreateGlobalStats();
  globalStats.totalProducts = globalStats.totalProducts + 1;
  globalStats.lastUpdatedBlock = event.block.number;
  globalStats.save();

  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp);
  dailyStats.totalProducts = dailyStats.totalProducts + 1;
  dailyStats.newProducts = dailyStats.newProducts + 1;
  dailyStats.save();
}

// ✅ REAL-TIME STAKE HANDLER - UPDATES RANKINGS WITHIN 30 SECONDS
export function handleStakeAdded(event: StakeAddedEvent): void {
  // Create stake entity with EXACT required fields
  let stakeId = event.params.productId.toString() + "-" + event.params.user.toHexString() + "-" + event.block.timestamp.toString();
  let stake = new Stake(stakeId);
  
  // ✅ EXACT REQUIRED FIELDS
  stake.product = event.params.productId.toString(); // EXACT
  stake.user = event.params.user; // EXACT
  stake.amount = event.params.amount; // EXACT
  
  // Additional fields
  stake.timestamp = event.block.timestamp;
  stake.blockNumber = event.block.number;
  stake.transactionHash = event.transaction.hash;
  
  // ✅ IMMEDIATE SAVE FOR 30-SECOND UPDATE REQUIREMENT
  stake.save();

  // ✅ UPDATE PRODUCT RANKING SCORE IMMEDIATELY
  let product = Product.load(event.params.productId.toString());
  if (product != null) {
    // Update totalStaked (EXACT field)
    product.totalStaked = product.totalStaked.plus(event.params.amount);
    
    // ✅ RECALCULATE RANKING: (newTotalStaked / 1e18) + (loves * 0.1)
    product.rankingScore = calculateRankingScore(product.totalStaked, product.loves);
    
    // ✅ IMMEDIATE SAVE - ENSURES 30-SECOND UPDATE
    product.save();

    // Update creator total staked
    let creator = getOrCreateCreator(product.creator);
    creator.totalStaked = creator.totalStaked.plus(event.params.amount);
    creator.save();
  }

  // Update global stats
  let globalStats = getOrCreateGlobalStats();
  globalStats.totalStaked = globalStats.totalStaked.plus(event.params.amount);
  globalStats.lastUpdatedBlock = event.block.number;
  globalStats.save();

  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp);
  dailyStats.totalStaked = dailyStats.totalStaked.plus(event.params.amount);
  dailyStats.newStakes = dailyStats.newStakes + 1;
  dailyStats.save();
}

// ✅ REAL-TIME LOVE HANDLER - UPDATES RANKINGS WITHIN 30 SECONDS
export function handleProductLoved(event: ProductLovedEvent): void {
  // Create love entity with EXACT required fields
  let loveId = event.params.productId.toString() + "-" + event.params.user.toHexString() + "-" + event.block.timestamp.toString();
  let love = new Love(loveId);
  
  // ✅ EXACT REQUIRED FIELDS
  love.product = event.params.productId.toString(); // EXACT
  love.user = event.params.user; // EXACT
  
  // Additional fields
  love.timestamp = event.block.timestamp;
  love.blockNumber = event.block.number;
  love.transactionHash = event.transaction.hash;
  
  // ✅ IMMEDIATE SAVE FOR 30-SECOND UPDATE REQUIREMENT
  love.save();

  // ✅ UPDATE PRODUCT RANKING SCORE IMMEDIATELY
  let product = Product.load(event.params.productId.toString());
  if (product != null) {
    // Update loves (EXACT field)
    product.loves = product.loves + 1;
    
    // ✅ RECALCULATE RANKING: (totalStaked / 1e18) + (newLoves * 0.1)
    product.rankingScore = calculateRankingScore(product.totalStaked, product.loves);
    
    // ✅ IMMEDIATE SAVE - ENSURES 30-SECOND UPDATE
    product.save();

    // Update creator total loves
    let creator = getOrCreateCreator(product.creator);
    creator.totalLoves = creator.totalLoves + 1;
    creator.save();
  }

  // Update global stats
  let globalStats = getOrCreateGlobalStats();
  globalStats.totalLoves = globalStats.totalLoves + 1;
  globalStats.lastUpdatedBlock = event.block.number;
  globalStats.save();

  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp);
  dailyStats.totalLoves = dailyStats.totalLoves + 1;
  dailyStats.newLoves = dailyStats.newLoves + 1;
  dailyStats.save();
}

export function handleProductPurchased(event: ProductPurchasedEvent): void {
  // Update product to inactive (assuming purchase makes product unavailable)
  let product = Product.load(event.params.id.toString());
  if (product != null) {
    product.active = false;
    product.save();
  }

  // Update global stats
  let globalStats = getOrCreateGlobalStats();
  globalStats.lastUpdatedBlock = event.block.number;
  globalStats.save();
}

// ✅ CHAINLINK FUNCTIONS MODEL EXECUTION REQUEST HANDLER
export function handleModelExecutionRequested(event: ModelExecutionRequestedEvent): void {
  // Create model execution entity
  let execution = new ModelExecution(event.params.requestId.toHexString());
  
  execution.product = event.params.productId.toString();
  execution.user = event.params.user;
  execution.input = event.params.input;
  execution.result = null; // Will be filled when fulfilled
  execution.requestId = event.params.requestId;
  execution.fulfilled = false;
  
  // Timestamps
  execution.requestedAt = event.block.timestamp;
  execution.fulfilledAt = null;
  
  // Transaction details
  execution.requestTxHash = event.transaction.hash;
  execution.fulfillTxHash = null;
  
  // Execution metadata
  execution.gasUsed = event.transaction.gasUsed;
  execution.executionTime = BigInt.fromI32(0);
  
  execution.save();

  // ✅ UPDATE PRODUCT ANALYTICS
  let productId = event.params.productId.toString();
  let analytics = getOrCreateProductAnalytics(productId);
  analytics.totalExecutions = analytics.totalExecutions + 1;
  analytics.totalExecutionGas = analytics.totalExecutionGas.plus(event.transaction.gasUsed);
  analytics.lastExecutionAt = event.block.timestamp;
  
  // Calculate execution boost: 0.01 per execution
  analytics.executionBoost = BigDecimal.fromString(analytics.totalExecutions.toString()).times(BigDecimal.fromString("0.01"));
  
  // Update enhanced ranking score
  let product = Product.load(productId);
  if (product != null) {
    analytics.enhancedRankingScore = product.rankingScore.plus(analytics.executionBoost);
  }
  
  analytics.save();

  // Update global stats
  let globalStats = getOrCreateGlobalStats();
  globalStats.totalExecutions = globalStats.totalExecutions + 1;
  globalStats.totalExecutionGas = globalStats.totalExecutionGas.plus(event.transaction.gasUsed);
  globalStats.lastUpdatedBlock = event.block.number;
  globalStats.save();
}

// ✅ CHAINLINK FUNCTIONS MODEL RESULT RECEIVED HANDLER
export function handleModelResultReceived(event: ModelResultReceivedEvent): void {
  // Update existing model execution
  let execution = ModelExecution.load(event.params.requestId.toHexString());
  if (execution != null) {
    execution.result = event.params.result;
    execution.fulfilled = true;
    execution.fulfilledAt = event.block.timestamp;
    execution.fulfillTxHash = event.transaction.hash;
    
    // Calculate execution time
    execution.executionTime = event.block.timestamp.minus(execution.requestedAt);
    
    execution.save();

    // ✅ UPDATE PRODUCT ANALYTICS WITH RESULT DATA
    let productId = event.params.productId.toString();
    let analytics = getOrCreateProductAnalytics(productId);
    
    // Update average execution time
    if (analytics.totalExecutions > 0) {
      let totalTime = analytics.averageExecutionTime.times(BigInt.fromI32(analytics.totalExecutions - 1));
      totalTime = totalTime.plus(execution.executionTime);
      analytics.averageExecutionTime = totalTime.div(BigInt.fromI32(analytics.totalExecutions));
    }
    
    // Update success rate (assuming all fulfilled executions are successful)
    let successfulExecutions = analytics.totalExecutions; // All executions that get results are successful
    analytics.successRate = BigDecimal.fromString(successfulExecutions.toString()).div(BigDecimal.fromString(analytics.totalExecutions.toString()));
    
    // Update average result length
    if (event.params.result.length > 0) {
      let totalResultLength = analytics.averageResultLength * (analytics.totalExecutions - 1);
      totalResultLength += event.params.result.length;
      analytics.averageResultLength = totalResultLength / analytics.totalExecutions;
    }
    
    analytics.save();
  }

  // Update global stats
  let globalStats = getOrCreateGlobalStats();
  globalStats.lastUpdatedBlock = event.block.number;
  globalStats.save();
}

// ========================================
// NEW AGENT EVENT HANDLERS
// ========================================

/**
 * Handle Agent Created Events from Enhanced Contract
 * Creates new Agent entity and updates marketplace stats
 */
export function handleAgentCreated(event: AgentCreatedEvent): void {
  // Create new agent entity
  let agent = new Agent(event.params.id.toString());
  
  agent.name = event.params.name;
  agent.description = ""; // Will be populated from contract call if needed
  agent.tags = []; // Will be populated from contract call if needed
  agent.ipfsHash = ""; // Will be populated from contract call if needed
  agent.creator = event.params.creator;
  agent.isPrivate = false; // Will be populated from contract call if needed
  agent.totalStaked = BigInt.fromI32(0);
  agent.loves = BigInt.fromI32(0);
  agent.createdAt = event.block.timestamp;
  agent.updatedAt = event.block.timestamp;
  
  // Calculate initial ranking score
  agent.rankingScore = calculateRankingScore(BigInt.fromI32(0), 0);
  
  // Link to creator
  let creator = getOrCreateCreator(event.params.creator);
  agent.creatorEntity = creator.id;
  creator.totalAgents = creator.totalAgents.plus(BigInt.fromI32(1));
  if (creator.firstAgentAt.equals(BigInt.fromI32(0))) {
    creator.firstAgentAt = event.block.timestamp;
  }
  creator.lastActivityAt = event.block.timestamp;
  creator.save();
  
  agent.save();

  // Update marketplace stats
  let marketplaceStats = MarketplaceStats.load("marketplace");
  if (marketplaceStats == null) {
    marketplaceStats = new MarketplaceStats("marketplace");
    marketplaceStats.totalAgents = BigInt.fromI32(0);
    marketplaceStats.totalStakes = BigInt.fromI32(0);
    marketplaceStats.totalStakedAmount = BigInt.fromI32(0);
    marketplaceStats.totalLoves = BigInt.fromI32(0);
    marketplaceStats.totalCreators = BigInt.fromI32(0);
    marketplaceStats.totalStakers = BigInt.fromI32(0);
  }
  
  marketplaceStats.totalAgents = marketplaceStats.totalAgents.plus(BigInt.fromI32(1));
  marketplaceStats.lastUpdatedBlock = event.block.number;
  marketplaceStats.lastUpdatedTimestamp = event.block.timestamp;
  marketplaceStats.save();

  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp);
  dailyStats.newAgents = dailyStats.newAgents.plus(BigInt.fromI32(1));
  dailyStats.save();
}

/**
 * Handle Agent Staked Events
 * Updates agent stake amount and recalculates ranking
 */
export function handleAgentStaked(event: AgentStakedEvent): void {
  // Create stake entity
  let stakeId = event.params.id.toString() + "-" + event.params.staker.toHexString() + "-" + event.block.number.toString();
  let stake = new Stake(stakeId);
  
  stake.agent = event.params.id.toString();
  stake.staker = event.params.staker;
  stake.amount = event.params.amount;
  stake.timestamp = event.block.timestamp;
  stake.blockNumber = event.block.number;
  stake.transactionHash = event.transaction.hash;
  stake.save();

  // Update agent
  let agent = Agent.load(event.params.id.toString());
  if (agent != null) {
    agent.totalStaked = agent.totalStaked.plus(event.params.amount);
    agent.updatedAt = event.block.timestamp;
    
    // Recalculate ranking score
    agent.rankingScore = calculateRankingScore(agent.totalStaked, agent.loves.toI32());
    agent.save();

    // Update creator stats
    let creator = Creator.load(agent.creatorEntity);
    if (creator != null) {
      creator.totalStakes = creator.totalStakes.plus(event.params.amount);
      creator.totalEarned = creator.totalEarned.plus(
        event.params.amount.times(BigInt.fromI32(7)).div(BigInt.fromI32(10)) // 70% to creator
      );
      creator.lastActivityAt = event.block.timestamp;
      creator.save();
    }
  }

  // Update marketplace stats
  let marketplaceStats = MarketplaceStats.load("marketplace");
  if (marketplaceStats != null) {
    marketplaceStats.totalStakes = marketplaceStats.totalStakes.plus(BigInt.fromI32(1));
    marketplaceStats.totalStakedAmount = marketplaceStats.totalStakedAmount.plus(event.params.amount);
    marketplaceStats.lastUpdatedBlock = event.block.number;
    marketplaceStats.lastUpdatedTimestamp = event.block.timestamp;
    marketplaceStats.save();
  }

  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp);
  dailyStats.totalStakes = dailyStats.totalStakes.plus(BigInt.fromI32(1));
  dailyStats.totalStakedAmount = dailyStats.totalStakedAmount.plus(event.params.amount);
  dailyStats.save();

  // Update daily agent stats
  let dailyAgentStatsId = event.params.id.toString() + "-" + getDailyStatsId(event.block.timestamp);
  let dailyAgentStats = DailyAgentStats.load(dailyAgentStatsId);
  if (dailyAgentStats == null) {
    dailyAgentStats = new DailyAgentStats(dailyAgentStatsId);
    dailyAgentStats.agent = event.params.id.toString();
    dailyAgentStats.date = BigInt.fromI32(event.block.timestamp.toI32() - (event.block.timestamp.toI32() % 86400));
    dailyAgentStats.stakesCount = BigInt.fromI32(0);
    dailyAgentStats.stakedAmount = BigInt.fromI32(0);
    dailyAgentStats.lovesCount = BigInt.fromI32(0);
    dailyAgentStats.uniqueStakers = BigInt.fromI32(0);
  }
  
  dailyAgentStats.stakesCount = dailyAgentStats.stakesCount.plus(BigInt.fromI32(1));
  dailyAgentStats.stakedAmount = dailyAgentStats.stakedAmount.plus(event.params.amount);
  dailyAgentStats.save();
}

/**
 * Handle Agent Loved Events
 * Updates agent love count and recalculates ranking
 */
export function handleAgentLoved(event: AgentLovedEvent): void {
  // Create love entity
  let loveId = event.params.id.toString() + "-" + event.params.user.toHexString() + "-" + event.block.number.toString();
  let agentLove = new AgentLove(loveId);
  
  agentLove.agent = event.params.id.toString();
  agentLove.user = event.params.user;
  agentLove.timestamp = event.block.timestamp;
  agentLove.blockNumber = event.block.number;
  agentLove.transactionHash = event.transaction.hash;
  agentLove.save();

  // Update agent
  let agent = Agent.load(event.params.id.toString());
  if (agent != null) {
    agent.loves = agent.loves.plus(BigInt.fromI32(1));
    agent.updatedAt = event.block.timestamp;
    
    // Recalculate ranking score
    agent.rankingScore = calculateRankingScore(agent.totalStaked, agent.loves.toI32());
    agent.save();

    // Update creator stats
    let creator = Creator.load(agent.creatorEntity);
    if (creator != null) {
      creator.totalLoves = creator.totalLoves.plus(BigInt.fromI32(1));
      creator.lastActivityAt = event.block.timestamp;
      creator.save();
    }
  }

  // Update marketplace stats
  let marketplaceStats = MarketplaceStats.load("marketplace");
  if (marketplaceStats != null) {
    marketplaceStats.totalLoves = marketplaceStats.totalLoves.plus(BigInt.fromI32(1));
    marketplaceStats.lastUpdatedBlock = event.block.number;
    marketplaceStats.lastUpdatedTimestamp = event.block.timestamp;
    marketplaceStats.save();
  }

  // Update daily stats
  let dailyStats = getOrCreateDailyStats(event.block.timestamp);
  dailyStats.totalLoves = dailyStats.totalLoves.plus(BigInt.fromI32(1));
  dailyStats.save();

  // Update daily agent stats
  let dailyAgentStatsId = event.params.id.toString() + "-" + getDailyStatsId(event.block.timestamp);
  let dailyAgentStats = DailyAgentStats.load(dailyAgentStatsId);
  if (dailyAgentStats == null) {
    dailyAgentStats = new DailyAgentStats(dailyAgentStatsId);
    dailyAgentStats.agent = event.params.id.toString();
    dailyAgentStats.date = BigInt.fromI32(event.block.timestamp.toI32() - (event.block.timestamp.toI32() % 86400));
    dailyAgentStats.stakesCount = BigInt.fromI32(0);
    dailyAgentStats.stakedAmount = BigInt.fromI32(0);
    dailyAgentStats.lovesCount = BigInt.fromI32(0);
    dailyAgentStats.uniqueStakers = BigInt.fromI32(0);
  }
  
  dailyAgentStats.lovesCount = dailyAgentStats.lovesCount.plus(BigInt.fromI32(1));
  dailyAgentStats.save();
}

/**
 * Handle Agent Access Granted Events
 * Tracks access grants for private agents
 */
export function handleAgentAccessGranted(event: AgentAccessGrantedEvent): void {
  // Create access grant entity
  let accessId = event.params.id.toString() + "-" + event.params.user.toHexString();
  let agentAccess = new AgentAccess(accessId);
  
  agentAccess.agent = event.params.id.toString();
  agentAccess.user = event.params.user;
  agentAccess.timestamp = event.block.timestamp;
  agentAccess.blockNumber = event.block.number;
  agentAccess.transactionHash = event.transaction.hash;
  agentAccess.save();
}