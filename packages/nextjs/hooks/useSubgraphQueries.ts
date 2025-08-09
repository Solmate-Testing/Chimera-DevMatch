/**
 * The Graph Subgraph Query Hooks for Chimera DevMatch
 * 
 * Custom React hooks for querying The Graph subgraph with TypeScript types
 * and error handling for marketplace data, agent leaderboards, and analytics.
 * 
 * @author The Graph Integration Engineer
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';

// The Graph endpoint configuration
const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'http://localhost:8000/subgraphs/name/chimera-devmatch/marketplace';

// Mock data for development (when subgraph is not available)
const getMockData = (query: string): any => {
  if (query.includes('marketplaceAnalytics')) {
    return {
      data: {
        marketplaceAnalytics: [{
          totalProducts: 5,
          totalStakes: "2500000000000000000", // 2.5 ETH
          totalVolume: "5000000000000000000", // 5 ETH
          totalUsers: 12,
          avgStakeAmount: "500000000000000000", // 0.5 ETH
        }]
      }
    };
  }
  if (query.includes('products') && query.includes('orderBy')) {
    return {
      data: {
        products: [
          {
            id: "1",
            name: "GPT-4 Trading Bot",
            description: "Advanced AI trading bot using GPT-4",
            category: "AI Agent",
            creator: "0x1234567890123456789012345678901234567890",
            totalStaked: "1000000000000000000", // 1 ETH
            loves: 25,
            rankingScore: 2.5,
            createdAt: "1704067200" // 2024-01-01
          },
          {
            id: "2", 
            name: "Claude API Assistant",
            description: "Smart assistant powered by Claude API",
            category: "AI Agent",
            creator: "0x2234567890123456789012345678901234567890",
            totalStaked: "750000000000000000", // 0.75 ETH
            loves: 18,
            rankingScore: 1.8,
            createdAt: "1704153600" // 2024-01-02
          }
        ]
      }
    };
  }
  if (query.includes('creator')) {
    return {
      data: {
        creator: {
          id: "0x992fEec8ECfaA9f3b1c5086202E171a399dD79Af",
          totalAgents: "2",
          totalEarned: "1500000000000000000", // 1.5 ETH
          totalStakes: "1750000000000000000", // 1.75 ETH
          totalLoves: "43",
          agents: [
            {
              id: "1",
              name: "My Trading Bot",
              description: "Personal trading bot",
              tags: ["Trading", "AI", "DeFi"],
              totalStaked: "1000000000000000000",
              loves: "25",
              isPrivate: false,
              rankingScore: "2.5",
              createdAt: "1704067200"
            }
          ]
        }
      }
    };
  }
  if (query.includes('stakes')) {
    return {
      data: {
        stakes: [
          {
            id: "1",
            amount: "500000000000000000", // 0.5 ETH
            timestamp: "1704067200",
            product: { name: "GPT-4 Trading Bot" }
          },
          {
            id: "2",
            amount: "250000000000000000", // 0.25 ETH
            timestamp: "1704153600",
            product: { name: "Claude Assistant" }
          }
        ]
      }
    };
  }
  // Default empty response
  return { data: {} };
};

// Simple GraphQL client using fetch (alternative to graphql-request)
const graphqlRequest = async (query: string, variables?: any): Promise<any> => {
  // Check if subgraph URL is properly configured
  if (!SUBGRAPH_URL || SUBGRAPH_URL.includes('your-subgraph') || SUBGRAPH_URL.includes('localhost')) {
    console.log('🔄 Using mock data (subgraph not configured)');
    return getMockData(query);
  }

  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      console.log('⚠️ Subgraph request failed, falling back to mock data');
      return getMockData(query);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.log('⚠️ GraphQL errors, falling back to mock data:', result.errors);
      return getMockData(query);
    }

    return result;
  } catch (error) {
    console.log('⚠️ Subgraph query error, falling back to mock data:', error);
    return getMockData(query);
  }
};

// GraphQL query helper (alternative to gql tagged template)
const gql = (strings: TemplateStringsArray, ...values: any[]) => {
  return strings.reduce((result, string, i) => {
    return result + string + (values[i] || '');
  }, '');
};

// TypeScript interfaces for subgraph entities
export interface Agent {
  id: string;
  name: string;
  description: string;
  tags: string[];
  ipfsHash: string;
  creator: string;
  isPrivate: boolean;
  totalStaked: string;
  loves: string;
  rankingScore: string;
  createdAt: string;
  updatedAt: string;
  creatorEntity: Creator;
  stakes: Stake[];
  agentLoves: AgentLove[];
  accessGrants: AgentAccess[];
  dailyStats: DailyAgentStats[];
}

export interface Stake {
  id: string;
  agent: Agent;
  staker: string;
  amount: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
}

export interface AgentLove {
  id: string;
  agent: Agent;
  user: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
}

export interface AgentAccess {
  id: string;
  agent: Agent;
  user: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
}

export interface Creator {
  id: string;
  totalAgents: string;
  totalEarned: string;
  totalStakes: string;
  totalLoves: string;
  firstAgentAt: string;
  lastActivityAt: string;
  agents: Agent[];
}

export interface DailyAgentStats {
  id: string;
  agent: Agent;
  date: string;
  stakesCount: string;
  stakedAmount: string;
  lovesCount: string;
  uniqueStakers: string;
}

export interface MarketplaceStats {
  id: string;
  totalAgents: string;
  totalStakes: string;
  totalStakedAmount: string;
  totalLoves: string;
  totalCreators: string;
  totalStakers: string;
  lastUpdatedBlock: string;
  lastUpdatedTimestamp: string;
}

export interface DailyStats {
  id: string;
  date: string;
  newAgents: string;
  totalStakes: string;
  totalStakedAmount: string;
  totalLoves: string;
  uniqueStakers: string;
  uniqueCreators: string;
  avgStakeAmount: string;
}

// GraphQL queries
const TOP_AGENTS_BY_STAKE_QUERY = gql`
  query TopAgentsByStake($first: Int = 10) {
    agents(orderBy: totalStaked, orderDirection: desc, first: $first) {
      id
      name
      description
      tags
      creator
      isPrivate
      totalStaked
      loves
      rankingScore
      createdAt
      creatorEntity {
        id
        totalAgents
        totalEarned
      }
    }
  }
`;

const AGENTS_BY_TAG_QUERY = gql`
  query AgentsByTag($tag: String!, $first: Int = 20) {
    agents(
      where: { tags_contains: [$tag] }
      orderBy: rankingScore
      orderDirection: desc
      first: $first
    ) {
      id
      name
      description
      tags
      creator
      totalStaked
      loves
      rankingScore
      isPrivate
      createdAt
    }
  }
`;

const SEARCH_AGENTS_QUERY = gql`
  query SearchAgents($searchTerm: String!, $first: Int = 20) {
    agents(
      where: { name_contains_nocase: $searchTerm }
      orderBy: rankingScore
      orderDirection: desc
      first: $first
    ) {
      id
      name
      description
      tags
      creator
      totalStaked
      loves
      rankingScore
      isPrivate
      createdAt
    }
  }
`;

const AGENT_DETAILS_QUERY = gql`
  query AgentDetails($id: ID!) {
    agent(id: $id) {
      id
      name
      description
      tags
      ipfsHash
      creator
      isPrivate
      totalStaked
      loves
      rankingScore
      createdAt
      updatedAt
      creatorEntity {
        id
        totalAgents
        totalEarned
        totalStakes
        totalLoves
        firstAgentAt
        lastActivityAt
      }
      stakes(orderBy: timestamp, orderDirection: desc, first: 10) {
        id
        staker
        amount
        timestamp
        transactionHash
      }
      agentLoves(orderBy: timestamp, orderDirection: desc, first: 10) {
        id
        user
        timestamp
      }
    }
  }
`;

const ALL_AGENTS_QUERY = gql`
  query AllAgents($first: Int = 20, $skip: Int = 0) {
    agents(
      first: $first
      skip: $skip
      orderBy: rankingScore
      orderDirection: desc
    ) {
      id
      name
      description
      tags
      creator
      totalStaked
      loves
      rankingScore
      isPrivate
      createdAt
      creatorEntity {
        id
      }
    }
  }
`;

const MARKETPLACE_ANALYTICS_QUERY = gql`
  query MarketplaceAnalytics {
    marketplaceStats(id: "marketplace") {
      totalAgents
      totalStakes
      totalStakedAmount
      totalLoves
      totalCreators
      totalStakers
      lastUpdatedBlock
      lastUpdatedTimestamp
    }
    
    dailyStats(orderBy: date, orderDirection: desc, first: 30) {
      id
      date
      newAgents
      totalStakes
      totalStakedAmount
      totalLoves
      uniqueStakers
      uniqueCreators
      avgStakeAmount
    }
  }
`;

const RECENT_ACTIVITY_QUERY = gql`
  query RecentActivity($first: Int = 10) {
    stakes(orderBy: timestamp, orderDirection: desc, first: $first) {
      id
      agent {
        id
        name
        rankingScore
      }
      staker
      amount
      timestamp
      transactionHash
    }
    
    agentLoves(orderBy: timestamp, orderDirection: desc, first: $first) {
      id
      agent {
        id
        name
        rankingScore
      }
      user
      timestamp
      transactionHash
    }
    
    agents(orderBy: createdAt, orderDirection: desc, first: $first) {
      id
      name
      creator
      createdAt
      totalStaked
      loves
      rankingScore
    }
  }
`;

const CREATOR_STATS_QUERY = gql`
  query CreatorStats($creatorId: ID!) {
    creator(id: $creatorId) {
      id
      totalAgents
      totalEarned
      totalStakes
      totalLoves
      firstAgentAt
      lastActivityAt
      agents(orderBy: rankingScore, orderDirection: desc) {
        id
        name
        totalStaked
        loves
        rankingScore
        createdAt
        isPrivate
      }
    }
  }
`;

// Custom hooks for subgraph queries

/**
 * Hook to fetch top agents by stake (leaderboard)
 */
export const useTopAgentsByStake = (first = 10): UseQueryResult<{ agents: Agent[] }> => {
  return useQuery({
    queryKey: ['topAgentsByStake', first],
    queryFn: async () => {
      try {
        return await graphqlRequest(TOP_AGENTS_BY_STAKE_QUERY, { first });
      } catch (error) {
        console.error('Error fetching top agents:', error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds - matches subgraph update requirement
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch agents filtered by tag/category
 */
export const useAgentsByTag = (tag: string, first = 20): UseQueryResult<{ agents: Agent[] }> => {
  return useQuery({
    queryKey: ['agentsByTag', tag, first],
    queryFn: async () => {
      try {
        return await graphqlRequest(AGENTS_BY_TAG_QUERY, { tag, first });
      } catch (error) {
        console.error('Error fetching agents by tag:', error);
        throw error;
      }
    },
    enabled: !!tag,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to search agents by name
 */
export const useSearchAgents = (searchTerm: string, first = 20): UseQueryResult<{ agents: Agent[] }> => {
  return useQuery({
    queryKey: ['searchAgents', searchTerm, first],
    queryFn: async () => {
      try {
        return await graphqlRequest(SEARCH_AGENTS_QUERY, { searchTerm, first });
      } catch (error) {
        console.error('Error searching agents:', error);
        throw error;
      }
    },
    enabled: !!searchTerm && searchTerm.length > 2,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch detailed agent information
 */
export const useAgentDetails = (id: string): UseQueryResult<{ agent: Agent }> => {
  return useQuery({
    queryKey: ['agentDetails', id],
    queryFn: async () => {
      try {
        return await graphqlRequest(AGENT_DETAILS_QUERY, { id });
      } catch (error) {
        console.error('Error fetching agent details:', error);
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to fetch all agents with pagination
 */
export const useAllAgents = (first = 20, skip = 0): UseQueryResult<{ agents: Agent[] }> => {
  return useQuery({
    queryKey: ['allAgents', first, skip],
    queryFn: async () => {
      try {
        return await graphqlRequest(ALL_AGENTS_QUERY, { first, skip });
      } catch (error) {
        console.error('Error fetching all agents:', error);
        throw error;
      }
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch marketplace analytics and daily stats
 */
export const useMarketplaceAnalytics = (): UseQueryResult<{
  marketplaceStats: MarketplaceStats;
  dailyStats: DailyStats[];
}> => {
  return useQuery({
    queryKey: ['marketplaceAnalytics'],
    queryFn: async () => {
      try {
        return await graphqlRequest(MARKETPLACE_ANALYTICS_QUERY);
      } catch (error) {
        console.error('Error fetching marketplace analytics:', error);
        throw error;
      }
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to fetch recent marketplace activity
 */
export const useRecentActivity = (first = 10): UseQueryResult<{
  stakes: Stake[];
  agentLoves: AgentLove[];
  agents: Agent[];
}> => {
  return useQuery({
    queryKey: ['recentActivity', first],
    queryFn: async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 3000)
        );
        
        const queryPromise = graphqlRequest(RECENT_ACTIVITY_QUERY, { first });
        
        return await Promise.race([queryPromise, timeoutPromise]);
      } catch (error) {
        console.log('📊 Falling back to mock activity data:', error);
        // Return mock activity data
        return {
          data: {
            stakes: [
              {
                id: "stake1",
                amount: "100000000000000000", // 0.1 ETH
                user: "0x1234567890123456789012345678901234567890",
                timestamp: Math.floor(Date.now() / 1000).toString(),
                product: { name: "AI Assistant Pro" }
              },
              {
                id: "stake2", 
                amount: "200000000000000000", // 0.2 ETH
                user: "0x2234567890123456789012345678901234567890",
                timestamp: Math.floor((Date.now() - 3600000) / 1000).toString(),
                product: { name: "Trading Bot" }
              }
            ],
            agentLoves: [
              {
                id: "love1",
                user: "0x3234567890123456789012345678901234567890",
                timestamp: Math.floor((Date.now() - 1800000) / 1000).toString(),
                product: { name: "Content Creator" }
              }
            ],
            agents: []
          }
        };
      }
    },
    staleTime: 15 * 1000, // 15 seconds for real-time updates
    gcTime: 2 * 60 * 1000,
    refetchInterval: false, // Disable auto-refetch to prevent issues
    retry: false, // Don't retry on failure
  });
};

/**
 * Hook to fetch creator statistics
 */
export const useCreatorStats = (creatorId: string): UseQueryResult<{ creator: Creator }> => {
  return useQuery({
    queryKey: ['creatorStats', creatorId],
    queryFn: async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 5000)
        );
        
        const queryPromise = graphqlRequest(CREATOR_STATS_QUERY, { creatorId });
        
        return await Promise.race([queryPromise, timeoutPromise]);
      } catch (error) {
        console.log('📊 Falling back to mock creator data:', error);
        // Return mock data for development
        return {
          data: {
            creator: {
              id: creatorId,
              totalAgents: "3",
              totalStakes: "1500000000000000000", // 1.5 ETH
              totalLoves: "45",
              totalEarned: "1050000000000000000", // 1.05 ETH (70% of stakes)
              agents: [
                {
                  id: "1",
                  name: "My AI Assistant",
                  description: "A helpful AI assistant for productivity",
                  tags: ["AI", "Assistant", "Productivity"],
                  totalStaked: "800000000000000000",
                  loves: "20",
                  isPrivate: false,
                  rankingScore: "2.8",
                  createdAt: "1704067200"
                },
                {
                  id: "2",
                  name: "Trading Bot Pro",
                  description: "Advanced trading bot with ML algorithms",
                  tags: ["Trading", "Finance", "ML"],
                  totalStaked: "500000000000000000",
                  loves: "15",
                  isPrivate: false,
                  rankingScore: "2.1",
                  createdAt: "1704153600"
                },
                {
                  id: "3",
                  name: "Content Creator",
                  description: "AI-powered content generation tool",
                  tags: ["Content", "Writing", "Creative"],
                  totalStaked: "200000000000000000",
                  loves: "10",
                  isPrivate: true,
                  rankingScore: "1.2",
                  createdAt: "1704240000"
                }
              ]
            }
          }
        };
      }
    },
    enabled: !!creatorId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false, // Don't retry on failure
  });
};

/**
 * Utility function to format ETH amounts from wei
 */
export const formatEthAmount = (weiAmount: string): string => {
  try {
    const eth = parseFloat(weiAmount) / 1e18;
    return eth.toFixed(3);
  } catch {
    return '0.000';
  }
};

/**
 * Utility function to calculate ranking score manually for verification
 */
export const calculateRankingScore = (totalStaked: string, loves: string): number => {
  try {
    const stakedEth = parseFloat(totalStaked) / 1e18;
    const lovesNum = parseFloat(loves);
    return stakedEth + (lovesNum * 0.1);
  } catch {
    return 0;
  }
};

/**
 * Utility function to format timestamps
 */
export const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  } catch {
    return 'Unknown';
  }
};

/**
 * Hook for category-specific queries with predefined categories
 */
export const useCategoryAgents = (category: 'MCP' | 'Trading' | 'DeFi' | 'LLM' | 'Education') => {
  return useAgentsByTag(category);
};

// Export subgraph URL for direct queries if needed
export { SUBGRAPH_URL };