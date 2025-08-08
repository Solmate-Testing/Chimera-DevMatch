/**
 * Agent Leaderboard Component
 * 
 * Displays top performing agents with real-time rankings from The Graph subgraph
 * Supports different leaderboard types: by stake, by loves, trending agents
 * 
 * Features:
 * - Real-time ranking updates (30-second refresh)
 * - Multiple leaderboard categories
 * - Agent performance metrics
 * - Creator information
 * - Interactive ranking visualization
 */

"use client";

import { useState } from "react";
import { useTopAgentsByStake, useAgentsByTag, useRecentActivity, formatEthAmount, formatTimestamp } from "../hooks/useSubgraphQueries";
import { Agent, Stake, AgentLove } from "../hooks/useSubgraphQueries";

type LeaderboardType = "stake" | "loves" | "trending" | "recent";

interface AgentLeaderboardProps {
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export const AgentLeaderboard: React.FC<AgentLeaderboardProps> = ({ 
  limit = 10, 
  showHeader = true, 
  compact = false 
}) => {
  const [activeTab, setActiveTab] = useState<LeaderboardType>("stake");

  // Subgraph queries
  const { data: topByStake, isLoading: stakeLoading, error: stakeError } = useTopAgentsByStake(limit);
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(limit);

  const tabs = [
    { id: "stake" as LeaderboardType, label: "💰 Top Staked", icon: "💰" },
    { id: "loves" as LeaderboardType, label: "❤️ Most Loved", icon: "❤️" },
    { id: "trending" as LeaderboardType, label: "🔥 Trending", icon: "🔥" },
    { id: "recent" as LeaderboardType, label: "⚡ Recent Activity", icon: "⚡" }
  ];

  // Get data based on active tab
  const getLeaderboardData = () => {
    switch (activeTab) {
      case "stake":
        return {
          data: topByStake?.agents || [],
          loading: stakeLoading,
          error: stakeError
        };
      case "loves":
        // Sort by loves count
        const lovesSorted = [...(topByStake?.agents || [])].sort((a, b) => 
          parseInt(b.loves) - parseInt(a.loves)
        );
        return {
          data: lovesSorted,
          loading: stakeLoading,
          error: stakeError
        };
      case "trending":
        // For trending, we'll use recent activity as a proxy
        return {
          data: recentActivity?.agents || [],
          loading: activityLoading,
          error: null
        };
      case "recent":
        return {
          data: recentActivity?.agents || [],
          loading: activityLoading,
          error: null
        };
      default:
        return { data: [], loading: false, error: null };
    }
  };

  const { data: agents, loading, error } = getLeaderboardData();

  const getRankingMetric = (agent: Agent, rank: number) => {
    switch (activeTab) {
      case "stake":
        return {
          primary: `${formatEthAmount(agent.totalStaked)} ETH`,
          secondary: `Rank Score: ${parseFloat(agent.rankingScore).toFixed(2)}`,
          color: "text-green-600"
        };
      case "loves":
        return {
          primary: `${agent.loves} ❤️`,
          secondary: `${formatEthAmount(agent.totalStaked)} ETH staked`,
          color: "text-purple-600"
        };
      case "trending":
      case "recent":
        return {
          primary: `Score: ${parseFloat(agent.rankingScore).toFixed(2)}`,
          secondary: `${agent.loves} ❤️ • ${formatEthAmount(agent.totalStaked)} ETH`,
          color: "text-blue-600"
        };
      default:
        return {
          primary: parseFloat(agent.rankingScore).toFixed(2),
          secondary: "",
          color: "text-gray-600"
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        {showHeader && (
          <h3 className="text-2xl font-bold text-gray-900 mb-6">🏆 Agent Leaderboard</h3>
        )}
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="w-20 h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        {showHeader && (
          <h3 className="text-2xl font-bold text-gray-900 mb-6">🏆 Agent Leaderboard</h3>
        )}
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Failed to load leaderboard</p>
          <p className="text-gray-500 text-sm">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {showHeader && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">🏆 Agent Leaderboard</h3>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {compact ? tab.icon : tab.label}
              </button>
            ))}\n          </div>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {agents.length > 0 ? (
          agents.slice(0, limit).map((agent, index) => {
            const rank = index + 1;
            const metric = getRankingMetric(agent, rank);
            
            // Medal for top 3
            const getMedal = (rank: number) => {
              switch (rank) {
                case 1: return "🥇";
                case 2: return "🥈"; 
                case 3: return "🥉";
                default: return `#${rank}`;
              }
            };

            return (
              <div key={agent.id} className={`p-${compact ? "4" : "6"} hover:bg-gray-50 transition-colors`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className={`${compact ? "text-lg" : "text-xl"} font-bold ${rank <= 3 ? "text-yellow-600" : "text-gray-400"} min-w-[3rem]`}>
                      {getMedal(rank)}
                    </div>
                    
                    {/* Agent Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className={`font-bold text-gray-900 ${compact ? "text-base" : "text-lg"}`}>
                          {agent.name}
                        </h4>
                        {agent.isPrivate && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            🔒 Private
                          </span>
                        )}
                      </div>
                      
                      {!compact && (
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>By {agent.creator?.slice(0, 8)}...{agent.creator?.slice(-6)}</p>
                          {agent.creatorEntity && (
                            <p className="text-xs">
                              Creator has {agent.creatorEntity.totalAgents} agents • 
                              Earned {formatEthAmount(agent.creatorEntity.totalEarned)} ETH
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="text-right">
                    <div className={`font-bold ${metric.color} ${compact ? "text-sm" : "text-lg"}`}>
                      {metric.primary}
                    </div>
                    {!compact && metric.secondary && (
                      <div className="text-xs text-gray-500 mt-1">
                        {metric.secondary}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags (non-compact mode) */}
                {!compact && agent.tags && agent.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {agent.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {agent.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{agent.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No agents found</p>
            <p className="text-sm">Be the first to create an agent!</p>
          </div>
        )}
      </div>

      {/* Footer with update time */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Updates every 30 seconds</span>
          <span>Powered by The Graph</span>
        </div>
      </div>
    </div>
  );
};

export default AgentLeaderboard;