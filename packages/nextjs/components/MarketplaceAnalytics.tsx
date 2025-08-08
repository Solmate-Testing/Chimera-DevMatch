/**
 * Marketplace Analytics Component
 * 
 * Real-time analytics dashboard showing marketplace metrics from The Graph subgraph
 * Displays key performance indicators, growth trends, and market insights
 * 
 * Features:
 * - Live marketplace statistics
 * - Daily growth charts
 * - Creator and agent insights
 * - Recent activity feed
 * - Performance trending data
 */

"use client";

import { useState } from "react";
import { useMarketplaceAnalytics, useRecentActivity, formatEthAmount, formatTimestamp } from "../hooks/useSubgraphQueries";
import { MarketplaceStats, DailyStats, Agent, Stake, AgentLove } from "../hooks/useSubgraphQueries";

interface MarketplaceAnalyticsProps {
  showCharts?: boolean;
  compact?: boolean;
}

export const MarketplaceAnalytics: React.FC<MarketplaceAnalyticsProps> = ({ 
  showCharts = true, 
  compact = false 
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "activity">("overview");

  // Subgraph queries
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useMarketplaceAnalytics();
  const { data: activityData, isLoading: activityLoading } = useRecentActivity(20);

  if (analyticsLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (analyticsError || !analyticsData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Failed to load analytics</p>
          <p className="text-gray-500 text-sm">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const { marketplaceStats, dailyStats } = analyticsData;

  // Calculate growth rates
  const getGrowthRate = (current: string, previous: string) => {
    const curr = parseFloat(current) || 0;
    const prev = parseFloat(previous) || 0;
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  // Get recent daily stats for trends
  const recentDays = dailyStats?.slice(0, 7) || [];
  const todayStats = recentDays[0];
  const yesterdayStats = recentDays[1];

  const stats = [
    {
      label: "Total Agents",
      value: marketplaceStats?.totalAgents || "0",
      change: getGrowthRate(
        todayStats?.newAgents || "0",
        yesterdayStats?.newAgents || "0"
      ),
      icon: "🤖",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      label: "Total Staked",
      value: `${formatEthAmount(marketplaceStats?.totalStakedAmount || "0")} ETH`,
      change: getGrowthRate(
        todayStats?.totalStakedAmount || "0",
        yesterdayStats?.totalStakedAmount || "0"
      ),
      icon: "💰",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      label: "Total Loves",
      value: marketplaceStats?.totalLoves || "0",
      change: getGrowthRate(
        todayStats?.totalLoves || "0",
        yesterdayStats?.totalLoves || "0"
      ),
      icon: "❤️",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      label: "Active Creators",
      value: marketplaceStats?.totalCreators || "0",
      change: getGrowthRate(
        todayStats?.uniqueCreators || "0",
        yesterdayStats?.uniqueCreators || "0"
      ),
      icon: "👥",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const tabs = [
    { id: "overview" as const, label: "📊 Overview", icon: "📊" },
    { id: "trends" as const, label: "📈 Trends", icon: "📈" },
    { id: "activity" as const, label: "⚡ Activity", icon: "⚡" }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-bold text-gray-900">📊 Marketplace Analytics</h3>
          <div className="text-sm text-gray-500">
            Last updated: {formatTimestamp(marketplaceStats?.lastUpdatedTimestamp || "0")}
          </div>
        </div>

        {/* Tab Navigation */}
        {!compact && (
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className={`${stat.bgColor} rounded-lg p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{stat.icon}</span>
                    {stat.change !== 0 && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        stat.change > 0 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {stat.change > 0 ? "+" : ""}{stat.change.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Average Stake</h4>
                <div className="text-xl font-bold text-blue-600">
                  {todayStats?.avgStakeAmount ? formatEthAmount(todayStats.avgStakeAmount) : "0"} ETH
                </div>
                <p className="text-sm text-gray-600">Per transaction today</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Total Stakes</h4>
                <div className="text-xl font-bold text-green-600">
                  {marketplaceStats?.totalStakes || "0"}
                </div>
                <p className="text-sm text-gray-600">Lifetime transactions</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Active Stakers</h4>
                <div className="text-xl font-bold text-purple-600">
                  {todayStats?.uniqueStakers || "0"}
                </div>
                <p className="text-sm text-gray-600">Unique users today</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "trends" && (
          <div className="space-y-6">
            {/* Daily Trends */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">7-Day Trends</h4>
              <div className="space-y-4">
                {recentDays.slice(0, 7).map((day, index) => (
                  <div key={day.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(day.date).toLocaleDateString()}
                      </div>
                      {index === 0 && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-blue-600">
                        🤖 {day.newAgents} agents
                      </div>
                      <div className="text-green-600">
                        💰 {formatEthAmount(day.totalStakedAmount)} ETH
                      </div>
                      <div className="text-purple-600">
                        ❤️ {day.totalLoves} loves
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <h5 className="font-semibold text-gray-900 mb-3">Growth Rate</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">New Agents</span>
                    <span className="text-sm font-medium text-blue-600">
                      +{getGrowthRate(todayStats?.newAgents || "0", yesterdayStats?.newAgents || "0").toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Staking Volume</span>
                    <span className="text-sm font-medium text-green-600">
                      +{getGrowthRate(todayStats?.totalStakedAmount || "0", yesterdayStats?.totalStakedAmount || "0").toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">User Activity</span>
                    <span className="text-sm font-medium text-purple-600">
                      +{getGrowthRate(todayStats?.uniqueStakers || "0", yesterdayStats?.uniqueStakers || "0").toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                <h5 className="font-semibold text-gray-900 mb-3">Market Health</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Agents per Creator</span>
                    <span className="text-sm font-medium text-blue-600">
                      {((parseFloat(marketplaceStats?.totalAgents || "0")) / (parseFloat(marketplaceStats?.totalCreators || "1"))).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Love Ratio</span>
                    <span className="text-sm font-medium text-purple-600">
                      {((parseFloat(marketplaceStats?.totalLoves || "0")) / (parseFloat(marketplaceStats?.totalAgents || "1"))).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Stake per Agent</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatEthAmount(((parseFloat(marketplaceStats?.totalStakedAmount || "0")) / (parseFloat(marketplaceStats?.totalAgents || "1"))).toString())} ETH
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-6">
            {/* Recent Activity */}
            {activityLoading ? (
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Recent Activity</h4>
                <div className="space-y-3">
                  {/* Recent Stakes */}
                  {activityData?.stakes?.slice(0, 5).map((stake: Stake) => (
                    <div key={stake.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-green-600 font-bold">💰</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Stake on {stake.agent?.name || `Agent #${stake.agent}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            By {stake.staker.slice(0, 8)}...{stake.staker.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">
                          {formatEthAmount(stake.amount)} ETH
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTimestamp(stake.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Recent Loves */}
                  {activityData?.agentLoves?.slice(0, 5).map((love: AgentLove) => (
                    <div key={love.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-purple-600 font-bold">❤️</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Loved {love.agent?.name || `Agent #${love.agent}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            By {love.user.slice(0, 8)}...{love.user.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {formatTimestamp(love.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* New Agents */}
                  {activityData?.agents?.slice(0, 3).map((agent: Agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-blue-600 font-bold">🤖</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            New Agent: {agent.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            By {agent.creator.slice(0, 8)}...{agent.creator.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">
                          Score: {parseFloat(agent.rankingScore).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTimestamp(agent.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceAnalytics;