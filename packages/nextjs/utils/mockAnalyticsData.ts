/**
 * Mock Analytics Data for Demo Purposes
 * 
 * Provides comprehensive fake data to showcase analytics functionality
 * before real users generate actual data on the platform.
 */

export interface MockAgent {
  id: string;
  name: string;
  description: string;
  creator: string;
  totalStaked: string; // BigInt as string
  loves: number;
  rankingScore: string; // BigDecimal as string
  category: string;
  tags: string[];
  createdAt: string;
  isPrivate: boolean;
  ipfsHash: string;
}

export interface MockMarketplaceStats {
  totalAgents: number;
  totalStakedAmount: string;
  totalLoves: number;
  totalCreators: number;
  totalTransactions: number;
  averageStakeAmount: string;
}

export interface MockStakeEvent {
  id: string;
  agent: MockAgent;
  user: string;
  amount: string;
  timestamp: string;
}

export interface MockCreatorStats {
  creator: string;
  totalAgents: number;
  totalStaked: string;
  totalLoves: number;
  averageRating: number;
  monthlyRevenue: string;
}

// Generate realistic Ethereum addresses
const generateAddress = (seed: string): string => {
  const hash = seed.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}${'0'.repeat(32)}`.slice(0, 42);
};

// Mock Agents Data
export const MOCK_AGENTS: MockAgent[] = [
  {
    id: "1",
    name: "GPT-4 DeFi Oracle",
    description: "Advanced DeFi analysis and yield farming optimization using GPT-4. Analyzes liquidity pools, predicts impermanent loss, and recommends optimal farming strategies.",
    creator: generateAddress("creator1"),
    totalStaked: "15200000000000000000", // 15.2 ETH
    loves: 89,
    rankingScore: "24.1",
    category: "DeFi",
    tags: ["GPT-4", "DeFi", "Oracle", "Yield Farming"],
    createdAt: "1691472000", // Aug 8, 2023
    isPrivate: false,
    ipfsHash: "QmXKQq7QvvMGo2eVz8Z1XqJqGQ4Hj5Z8Z1XqJqGQ4Hj5Z8Z"
  },
  {
    id: "2", 
    name: "Claude Trading Assistant",
    description: "Anthropic's Claude powered trading bot with advanced reasoning capabilities. Provides market analysis, risk assessment, and automated trading strategies.",
    creator: generateAddress("creator2"),
    totalStaked: "12800000000000000000", // 12.8 ETH
    loves: 67,
    rankingScore: "19.5",
    category: "Trading",
    tags: ["Claude", "Trading", "Analysis", "Automation"],
    createdAt: "1691385600", // Aug 7, 2023
    isPrivate: false,
    ipfsHash: "QmYLRr8QvvMGo3fVz9A2XqJqHR5Ij6A9A2XqJqHR5Ij6A9A"
  },
  {
    id: "3",
    name: "HuggingFace Sentiment Analyzer", 
    description: "Real-time crypto sentiment analysis using HuggingFace transformers. Monitors social media, news, and forums to predict market movements.",
    creator: generateAddress("creator3"),
    totalStaked: "8400000000000000000", // 8.4 ETH
    loves: 45,
    rankingScore: "12.9",
    category: "Analytics",
    tags: ["HuggingFace", "Sentiment", "Analysis", "Social"],
    createdAt: "1691299200", // Aug 6, 2023
    isPrivate: false,
    ipfsHash: "QmZMSs9QvvMGo4gVzAB3XqJqIS6Jk7BAB3XqJqIS6Jk7BAB"
  },
  {
    id: "4",
    name: "MEV Protection Bot",
    description: "Advanced MEV (Maximal Extractable Value) protection using flashloan arbitrage detection and front-running prevention algorithms.",
    creator: generateAddress("creator4"),
    totalStaked: "6900000000000000000", // 6.9 ETH
    loves: 34,
    rankingScore: "10.3",
    category: "Security",
    tags: ["MEV", "Protection", "Arbitrage", "Security"],
    createdAt: "1691212800", // Aug 5, 2023
    isPrivate: true,
    ipfsHash: "QmANTt0QvvMGo5hVzBC4XqJqJT7Kl8CBC4XqJqJT7Kl8CBC"
  },
  {
    id: "5",
    name: "NFT Rarity Scanner",
    description: "AI-powered NFT rarity analysis using computer vision and metadata parsing. Identifies undervalued NFTs across major marketplaces.",
    creator: generateAddress("creator5"),
    totalStaked: "5300000000000000000", // 5.3 ETH
    loves: 28,
    rankingScore: "8.1",
    category: "NFT",
    tags: ["NFT", "Rarity", "Computer Vision", "Analysis"],
    createdAt: "1691126400", // Aug 4, 2023
    isPrivate: false,
    ipfsHash: "QmBOUu1QvvMGo6iVzCD5XqJqKU8Lm9DCD5XqJqKU8Lm9DCD"
  },
  {
    id: "6",
    name: "Governance Proposal Analyzer",
    description: "DAO governance proposal analysis using NLP. Summarizes proposals, predicts voting outcomes, and identifies potential risks.",
    creator: generateAddress("creator6"),
    totalStaked: "4700000000000000000", // 4.7 ETH
    loves: 22,
    rankingScore: "6.9",
    category: "DAO",
    tags: ["Governance", "DAO", "NLP", "Analysis"],
    createdAt: "1691040000", // Aug 3, 2023
    isPrivate: false,
    ipfsHash: "QmCPVv2QvvMGo7jVzDE6XqJqLV9Mn0EDE6XqJqLV9Mn0EDE"
  },
  {
    id: "7",
    name: "Cross-Chain Bridge Monitor",
    description: "Real-time monitoring of cross-chain bridges with risk assessment and security alerts. Tracks liquidity and detects anomalies.",
    creator: generateAddress("creator7"),
    totalStaked: "3800000000000000000", // 3.8 ETH
    loves: 19,
    rankingScore: "5.7",
    category: "Infrastructure", 
    tags: ["Cross-Chain", "Bridge", "Monitoring", "Security"],
    createdAt: "1690953600", // Aug 2, 2023
    isPrivate: false,
    ipfsHash: "QmDQWw3QvvMGo8kVzEF7XqJqMW0No1FEF7XqJqMW0No1FEF"
  },
  {
    id: "8",
    name: "Yield Farming Optimizer",
    description: "Automated yield farming strategy optimizer. Finds best APY opportunities across DeFi protocols and manages position rebalancing.",
    creator: generateAddress("creator8"),
    totalStaked: "3200000000000000000", // 3.2 ETH
    loves: 16,
    rankingScore: "4.8",
    category: "DeFi",
    tags: ["Yield Farming", "APY", "Optimization", "DeFi"],
    createdAt: "1690867200", // Aug 1, 2023
    isPrivate: false,
    ipfsHash: "QmERXx4QvvMGo9lVzFG8XqJqNX1Op2GFG8XqJqNX1Op2GFG"
  }
];

// Additional agents to reach 42 total
const generateAdditionalAgents = (): MockAgent[] => {
  const categories = ["AI Agent", "MCP", "Trading", "DeFi", "Analytics", "Security", "NFT", "DAO"];
  const additionalAgents: MockAgent[] = [];
  
  for (let i = 9; i <= 42; i++) {
    const category = categories[i % categories.length];
    const baseStake = Math.random() * 3; // 0-3 ETH
    const loves = Math.floor(Math.random() * 30) + 1;
    
    additionalAgents.push({
      id: i.toString(),
      name: `AI Agent #${i}`,
      description: `Demo ${category} agent for marketplace testing and analytics demonstration.`,
      creator: generateAddress(`creator${i}`),
      totalStaked: (baseStake * 1e18).toString(),
      loves,
      rankingScore: (baseStake + loves * 0.1).toFixed(1),
      category,
      tags: [category, "Demo", "Test"],
      createdAt: (Date.now() / 1000 - (42 - i) * 86400).toString(),
      isPrivate: Math.random() > 0.8,
      ipfsHash: `QmDemo${i.toString().padStart(2, '0')}vvMGo${i}VzDemo`
    });
  }
  
  return additionalAgents;
};

export const ALL_MOCK_AGENTS = [...MOCK_AGENTS, ...generateAdditionalAgents()];

// Mock Marketplace Statistics
export const MOCK_MARKETPLACE_STATS: MockMarketplaceStats = {
  totalAgents: 42,
  totalStakedAmount: ALL_MOCK_AGENTS.reduce((sum, agent) => 
    sum + parseFloat(agent.totalStaked), 0
  ).toString(),
  totalLoves: ALL_MOCK_AGENTS.reduce((sum, agent) => sum + agent.loves, 0),
  totalCreators: new Set(ALL_MOCK_AGENTS.map(agent => agent.creator)).size,
  totalTransactions: 156,
  averageStakeAmount: "2840000000000000000" // 2.84 ETH average
};

// Mock Recent Stakes
export const MOCK_RECENT_STAKES: MockStakeEvent[] = [
  {
    id: "stake1",
    agent: MOCK_AGENTS[0],
    user: generateAddress("user1"),
    amount: "1000000000000000000", // 1 ETH
    timestamp: (Date.now() / 1000 - 3600).toString() // 1 hour ago
  },
  {
    id: "stake2", 
    agent: MOCK_AGENTS[1],
    user: generateAddress("user2"),
    amount: "500000000000000000", // 0.5 ETH
    timestamp: (Date.now() / 1000 - 7200).toString() // 2 hours ago
  },
  {
    id: "stake3",
    agent: MOCK_AGENTS[2],
    user: generateAddress("user3"),
    amount: "2000000000000000000", // 2 ETH
    timestamp: (Date.now() / 1000 - 10800).toString() // 3 hours ago
  }
];

// Mock Creator Statistics
export const MOCK_CREATOR_STATS: MockCreatorStats[] = [
  {
    creator: generateAddress("creator1"),
    totalAgents: 3,
    totalStaked: "25600000000000000000", // 25.6 ETH
    totalLoves: 156,
    averageRating: 4.8,
    monthlyRevenue: "8500000000000000000" // 8.5 ETH
  },
  {
    creator: generateAddress("creator2"),
    totalAgents: 2,
    totalStaked: "18900000000000000000", // 18.9 ETH
    totalLoves: 89,
    averageRating: 4.6,
    monthlyRevenue: "6300000000000000000" // 6.3 ETH
  }
];

// Mock Time Series Data for Charts
export const MOCK_DAILY_STAKES = [
  { date: '2023-08-01', amount: '12.5' },
  { date: '2023-08-02', amount: '18.7' },
  { date: '2023-08-03', amount: '15.2' },
  { date: '2023-08-04', amount: '22.1' },
  { date: '2023-08-05', amount: '19.8' },
  { date: '2023-08-06', amount: '28.4' },
  { date: '2023-08-07', amount: '35.6' },
  { date: '2023-08-08', amount: '42.3' }
];

export const MOCK_CATEGORY_DISTRIBUTION = [
  { category: 'DeFi', count: 12, percentage: 28.6 },
  { category: 'Trading', count: 8, percentage: 19.0 },
  { category: 'Analytics', count: 7, percentage: 16.7 },
  { category: 'AI Agent', count: 6, percentage: 14.3 },
  { category: 'Security', count: 4, percentage: 9.5 },
  { category: 'NFT', count: 3, percentage: 7.1 },
  { category: 'DAO', count: 2, percentage: 4.8 }
];

// Utility functions for formatting
export const formatEthAmount = (wei: string): string => {
  const eth = parseFloat(wei) / 1e18;
  if (eth < 0.01) return eth.toFixed(4);
  if (eth < 1) return eth.toFixed(3);
  if (eth < 10) return eth.toFixed(2);
  return eth.toFixed(1);
};

export const formatShortAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getRelativeTime = (timestamp: string): string => {
  const now = Date.now() / 1000;
  const diff = now - parseFloat(timestamp);
  
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// Hook for getting mock data based on environment
export const useMockData = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    agents: isDevelopment ? ALL_MOCK_AGENTS : [],
    marketplaceStats: isDevelopment ? MOCK_MARKETPLACE_STATS : null,
    recentStakes: isDevelopment ? MOCK_RECENT_STAKES : [],
    creatorStats: isDevelopment ? MOCK_CREATOR_STATS : [],
    dailyStakes: isDevelopment ? MOCK_DAILY_STAKES : [],
    categoryDistribution: isDevelopment ? MOCK_CATEGORY_DISTRIBUTION : [],
    formatEthAmount,
    formatShortAddress,
    getRelativeTime
  };
};