"use client";

import { useState } from "react";
import { ProductForm } from "../components/Productform";
import { GaslessStaking } from "../components/GaslessStaking";
import { RealtimeRankings } from "../components/RealtimeRankings";
import { GaslessVerification } from "../components/GaslessVerification";
import { VerificationTest } from "../components/VerificationTest";
import { ModelExecution } from "../components/ModelExecution";
import { useTopAgentsByStake, useAgentsByTag, useSearchAgents, useMarketplaceAnalytics, formatEthAmount } from "../hooks/useSubgraphQueries";
import { Agent } from "../hooks/useSubgraphQueries";
import AgentLeaderboard from "../components/AgentLeaderboard";
import MarketplaceAnalytics from "../components/MarketplaceAnalytics";
import WagmiTestComponent from "../components/WagmiTestComponent";

export default function Home() {
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showSearch, setShowSearch] = useState(false);

  // Subgraph queries
  const { data: topAgentsData, isLoading: topAgentsLoading, error: topAgentsError } = useTopAgentsByStake(10);
  const { data: categoryAgentsData, isLoading: categoryLoading } = useAgentsByTag(selectedCategory === "all" ? "" : selectedCategory, 20);
  const { data: searchResults, isLoading: searchLoading } = useSearchAgents(searchTerm, 20);
  const { data: marketplaceStats, isLoading: statsLoading } = useMarketplaceAnalytics();

  // Mock product for staking demo (fallback)
  const mockProduct = {
    id: '1',
    name: 'GPT-4 Trading Bot',
    category: 'Copy Trading Bot',
    totalStaked: '5000000000000000000', // 5 ETH
    loves: 12,
    creator: '0x1234567890123456789012345678901234567890',
    price: '100000000000000000', // 0.1 ETH
    description: 'Advanced AI trading bot with GPT-4 intelligence for crypto markets'
  };

  // Categories for filtering
  const categories = [
    { value: "all", label: "All Categories", icon: "🤖" },
    { value: "MCP", label: "MCP", icon: "🔌" },
    { value: "Trading", label: "Trading", icon: "📈" },
    { value: "DeFi", label: "DeFi", icon: "🏦" },
    { value: "LLM", label: "LLM", icon: "🧠" },
    { value: "Education", label: "Education", icon: "🎓" }
  ];

  // Determine which agents to display
  const displayAgents = searchTerm.length > 2 ? searchResults?.agents : 
    (selectedCategory === "all" ? topAgentsData?.agents : categoryAgentsData?.agents);
  
  const isLoadingAgents = searchTerm.length > 2 ? searchLoading : 
    (selectedCategory === "all" ? topAgentsLoading : categoryLoading);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Wagmi Test Component - Shows in development */}
        {process.env.NODE_ENV === 'development' && (
          <WagmiTestComponent />
        )}
        {/* ✅ HEADER WITH MARKETPLACE STATS */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🤖 Chimera DevMatch
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Decentralized AI Marketplace with Gasless Transactions
          </p>
          
          {/* Navigation Links */}
          <div className="flex justify-center space-x-4 mb-8">
            <a 
              href="/marketplace"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold shadow-lg hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all"
            >
              🏪 New Marketplace View
            </a>
            <a 
              href="/dashboard"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105 transition-all"
            >
              📊 Creator Dashboard
            </a>
          </div>
          
          {/* Live Marketplace Statistics */}
          {!statsLoading && marketplaceStats?.marketplaceStats && (
            <div className="flex justify-center space-x-8 text-sm font-medium text-gray-700 mb-6">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-blue-600">
                  {marketplaceStats.marketplaceStats.totalAgents || 0}
                </span>
                <span className="text-xs text-gray-500">Agents</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-green-600">
                  {formatEthAmount(marketplaceStats.marketplaceStats.totalStakedAmount || "0")}
                </span>
                <span className="text-xs text-gray-500">ETH Staked</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-purple-600">
                  {marketplaceStats.marketplaceStats.totalLoves || 0}
                </span>
                <span className="text-xs text-gray-500">Loves</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-orange-600">
                  {marketplaceStats.marketplaceStats.totalCreators || 0}
                </span>
                <span className="text-xs text-gray-500">Creators</span>
              </div>
            </div>
          )}
          
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>🔐 Oasis ROFL-Sapphire Security</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>⚡ Gasless via Biconomy</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>📊 Real-time Analytics</span>
            </div>
          </div>
        </div>

        {/* ✅ AGENT DISCOVERY SECTION */}
        <section className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 lg:mb-0">🔍 Discover Agents</h2>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Toggle */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showSearch ? "Hide Search" : "🔍 Search Agents"}
              </button>
              
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search agents by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </div>
              </div>
            </div>
          )}

          {/* Agent Grid */}
          <div className="space-y-6">
            {/* Loading State */}
            {isLoadingAgents && (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading agents...</p>
              </div>
            )}

            {/* Error State */}
            {topAgentsError && (
              <div className="text-center py-12 text-red-600">
                <p>Error loading agents. Please try again later.</p>
              </div>
            )}

            {/* Agent Cards */}
            {displayAgents && displayAgents.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayAgents.map((agent: Agent) => (
                  <div key={agent.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900 truncate mr-2">{agent.name}</h3>
                      {agent.isPrivate && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">🔒 Private</span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {agent.description || "No description available"}
                    </p>
                    
                    {/* Tags */}
                    {agent.tags && agent.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {agent.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                        {agent.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{agent.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Stats */}
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="text-green-600 font-medium">
                          💰 {formatEthAmount(agent.totalStaked)} ETH
                        </span>
                        <span className="text-purple-600 font-medium">
                          ❤️ {agent.loves}
                        </span>
                      </div>
                      <div className="text-blue-600 font-bold">
                        🏆 {parseFloat(agent.rankingScore).toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Creator */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        By {agent.creator?.slice(0, 8)}...{agent.creator?.slice(-6)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Created {new Date(parseInt(agent.createdAt) * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Action Button */}
                    <div className="mt-4">
                      <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {displayAgents && displayAgents.length === 0 && !isLoadingAgents && (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg mb-4">No agents found</p>
                {searchTerm.length > 2 && (
                  <p className="text-gray-500 text-sm">Try searching for something else or browse by category</p>
                )}
                {selectedCategory !== "all" && (
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View All Categories
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ✅ VERIFICATION TEST */}
        <div className="mb-8">
          <VerificationTest />
        </div>

        {/* ✅ MAIN CONTENT GRID */}
        <div className="space-y-8">
          {/* ✅ GASLESS PRODUCT FORM */}
          <section>
            <ProductForm />
          </section>

          {/* ✅ TWO COLUMN LAYOUT */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* ✅ LEFT COLUMN: STAKING */}
            <section>
              <h2 className="text-2xl font-bold mb-4">💰 Gasless Staking Demo</h2>
              <GaslessStaking 
                product={mockProduct}
                userStake="0"
                onStakeSuccess={(productId, amount) => {
                  console.log(`Staked ${amount} ETH on product ${productId}`);
                }}
              />
            </section>

            {/* ✅ RIGHT COLUMN: VERIFICATION */}
            <section>
              <h2 className="text-2xl font-bold mb-4">🧪 Gasless Verification</h2>
              <GaslessVerification />
            </section>
          </div>

          {/* ✅ AI MODEL EXECUTION */}
          <section>
            <h2 className="text-2xl font-bold mb-4">🤖 Chainlink Functions AI Execution</h2>
            <ModelExecution 
              product={mockProduct}
              userStake="1000000000000000000" // 1 ETH staked
            />
          </section>

          {/* ✅ ANALYTICS AND LEADERBOARD SECTION */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* ✅ LEFT: AGENT LEADERBOARD */}
            <section>
              <AgentLeaderboard limit={10} />
            </section>

            {/* ✅ RIGHT: MARKETPLACE ANALYTICS */}
            <section>
              <MarketplaceAnalytics compact={false} />
            </section>
          </div>

          {/* ✅ FULL WIDTH: LEGACY REAL-TIME RANKINGS */}
          <section>
            <RealtimeRankings />
          </section>

          {/* ✅ FOOTER */}
          <div className="mt-16 p-6 bg-white rounded-lg shadow text-center">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                🚀 Complete Gasless Experience
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-900 mb-2">📱 Web2 Onboarding</div>
                  <div className="text-blue-700 space-y-1">
                    <div>✅ Google OAuth login</div>
                    <div>✅ Auto smart wallet creation</div>
                    <div>✅ No crypto knowledge required</div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-900 mb-2">⚡ Gasless Transactions</div>
                  <div className="text-green-700 space-y-1">
                    <div>✅ No MetaMask popups</div>
                    <div>✅ "Paid by DApp" in explorer</div>
                    <div>✅ &lt; 15 second completion</div>
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="font-medium text-purple-900 mb-2">🔒 Enterprise Security</div>
                  <div className="text-purple-700 space-y-1">
                    <div>✅ TEE-protected API keys</div>
                    <div>✅ Client-side encryption</div>
                    <div>✅ Zero key exposure</div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200 text-gray-500 text-xs">
                🔗 <strong>Powered by:</strong> Privy + Biconomy + Oasis ROFL-Sapphire + The Graph
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}