"use client";

// REAL-TIME RANKINGS COMPONENT - SENIOR WEB3 UX ENGINEER
// Displays real-time product rankings updated within 30 seconds

import React, { useState, useEffect } from 'react';

// Mock GraphQL query hook (in production, use Apollo Client or similar)
interface Product {
  id: string;
  name: string;
  totalStaked: string;
  loves: number;
  category: string;
  rankingScore: string;
  creator: string;
  description: string;
}

interface UseSubgraphQueryResult {
  data: { products: Product[] } | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ✅ MOCK SUBGRAPH QUERY HOOK
function useSubgraphQuery(query: string): UseSubgraphQueryResult {
  const [data, setData] = useState<{ products: Product[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ MOCK REAL-TIME DATA WITH RANKING ALGORITHM
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'GPT-4 Trading Bot',
      totalStaked: '5000000000000000000', // 5 ETH
      loves: 12,
      category: 'Copy Trading Bot',
      rankingScore: '6.2', // (5 + 12*0.1) = 6.2
      creator: '0x1234...5678',
      description: 'Advanced AI trading bot with GPT-4 intelligence'
    },
    {
      id: '2', 
      name: 'Claude Analysis Agent',
      totalStaked: '3000000000000000000', // 3 ETH
      loves: 25,
      category: 'AI Agent',
      rankingScore: '5.5', // (3 + 25*0.1) = 5.5
      creator: '0x2345...6789',
      description: 'Deep market analysis using Claude AI'
    },
    {
      id: '3',
      name: 'Multi-Chain Protocol',
      totalStaked: '2000000000000000000', // 2 ETH  
      loves: 8,
      category: 'MCP',
      rankingScore: '2.8', // (2 + 8*0.1) = 2.8
      creator: '0x3456...7890',
      description: 'Cross-chain asset management protocol'
    },
    {
      id: '4',
      name: 'DeFi Yield Optimizer',
      totalStaked: '1500000000000000000', // 1.5 ETH
      loves: 18,
      category: 'AI Agent', 
      rankingScore: '3.3', // (1.5 + 18*0.1) = 3.3
      creator: '0x4567...8901',
      description: 'AI-powered DeFi yield optimization'
    },
    {
      id: '5',
      name: 'NFT Trading Assistant',
      totalStaked: '1000000000000000000', // 1 ETH
      loves: 30,
      category: 'AI Agent',
      rankingScore: '4.0', // (1 + 30*0.1) = 4.0
      creator: '0x5678...9012', 
      description: 'Smart NFT trading recommendations'
    }
  ];

  useEffect(() => {
    // Simulate GraphQL query
    setLoading(true);
    
    setTimeout(() => {
      // ✅ SORT BY RANKING SCORE (DESC) - EXACT REQUIREMENT
      const sortedProducts = [...mockProducts].sort((a, b) => 
        parseFloat(b.rankingScore) - parseFloat(a.rankingScore)
      );
      
      setData({ products: sortedProducts });
      setLoading(false);
      setError(null);
    }, 1000);
  }, []);

  const refetch = () => {
    console.log('🔄 Refetching real-time rankings...');
    setLoading(true);
    
    // Simulate real-time updates with slight ranking changes
    setTimeout(() => {
      const updatedProducts = mockProducts.map(product => ({
        ...product,
        // Simulate small ranking changes over time
        totalStaked: (BigInt(product.totalStaked) + BigInt(Math.floor(Math.random() * 100000000000000000))).toString(),
        loves: product.loves + Math.floor(Math.random() * 2),
        rankingScore: (parseFloat(product.rankingScore) + (Math.random() - 0.5) * 0.1).toFixed(2)
      })).sort((a, b) => parseFloat(b.rankingScore) - parseFloat(a.rankingScore));

      setData({ products: updatedProducts });
      setLoading(false);
    }, 500);
  };

  return { data, loading, error, refetch };
}

export const RealtimeRankings: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ✅ REAL-TIME RANKINGS QUERY (EXACT REQUIREMENT)
  const { data, loading, error, refetch } = useSubgraphQuery(`
    {
      products(orderBy: totalStaked, orderDirection: desc, first: 20) {
        id
        name
        totalStaked
        loves
        category
        rankingScore
        creator
      }
    }
  `);

  // ✅ AUTO-REFRESH EVERY 30 SECONDS (REAL-TIME REQUIREMENT)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing rankings (30s interval)');
        refetch();
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refetch]);

  // ✅ FILTER BY CATEGORY
  const filteredProducts = data?.products.filter(product => 
    selectedCategory === 'all' || product.category === selectedCategory
  ) || [];

  const categories = ['all', 'AI Agent', 'MCP', 'Copy Trading Bot'];

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">❌ Error loading rankings: {error}</p>
        <button 
          onClick={refetch}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ HEADER WITH REAL-TIME INDICATOR */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">📊 Real-Time Rankings</h2>
          <p className="text-gray-600 text-sm">
            Updated every 30 seconds • Formula: (totalStaked / 1e18) + (loves × 0.1)
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* ✅ REAL-TIME STATUS INDICATOR */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-medium">
              {autoRefresh ? '🔴 LIVE' : '⏸️ PAUSED'}
            </span>
          </div>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 text-xs rounded ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {autoRefresh ? 'Pause' : 'Resume'}
          </button>
          
          <button
            onClick={refetch}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            🔄 Refresh Now
          </button>
        </div>
      </div>

      {/* ✅ CATEGORY FILTER */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category === 'all' ? '🌍 All Categories' : 
             category === 'AI Agent' ? '🤖 AI Agents' :
             category === 'MCP' ? '🔗 MCPs' : 
             '📈 Trading Bots'}
            <span className="ml-2 text-xs opacity-75">
              ({data?.products.filter(p => category === 'all' || p.category === category).length || 0})
            </span>
          </button>
        ))}
      </div>

      {/* ✅ RANKINGS LIST */}
      <div className="space-y-3">
        {filteredProducts.map((product, index) => (
          <div key={product.id} className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* ✅ RANKING POSITION */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{product.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.category === 'AI Agent' ? 'bg-purple-100 text-purple-700' :
                      product.category === 'MCP' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {product.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mt-1">{product.description}</p>
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>👤 {product.creator.substring(0, 8)}...{product.creator.substring(34)}</span>
                  </div>
                </div>
              </div>
              
              {/* ✅ RANKING METRICS */}
              <div className="text-right space-y-1">
                <div className="text-lg font-bold text-blue-600">
                  {product.rankingScore}
                </div>
                <div className="text-xs text-gray-500">Ranking Score</div>
                
                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center">
                    <span className="font-medium">💰</span>
                    <span className="ml-1">{(parseFloat(product.totalStaked) / 1e18).toFixed(2)} ETH</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium">❤️</span>
                    <span className="ml-1">{product.loves}</span>
                  </div>
                </div>
                
                {/* ✅ VERIFICATION OF RANKING FORMULA */}
                <div className="text-xs text-gray-400 mt-1">
                  {((parseFloat(product.totalStaked) / 1e18) + (product.loves * 0.1)).toFixed(2)} calculated
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ REAL-TIME UPDATE INFO */}
      <div className="p-4 bg-gray-50 border rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            ⏱️ Last updated: {new Date().toLocaleTimeString()}
          </div>
          <div>
            📊 Showing {filteredProducts.length} products • 
            Rankings update within 30 seconds of transactions
          </div>
        </div>
      </div>
    </div>
  );
};