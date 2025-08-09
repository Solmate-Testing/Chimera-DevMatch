"use client";

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useScaffoldReadContract } from '../../hooks/scaffold-eth/useScaffoldReadContract';
import { formatEther } from 'viem';
import { useMockData, ALL_MOCK_AGENTS } from '../../utils/mockAnalyticsData';
import Link from 'next/link';
import { 
  PlusIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  HeartIcon,
  EyeIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const CreatorDashboard = () => {
  const { ready, authenticated, user } = usePrivy();
  const mockData = useMockData();
  
  // Get creator's agents (mock data for demo)
  const [creatorAgents, setCreatorAgents] = useState(ALL_MOCK_AGENTS.slice(0, 6));
  const [analytics, setAnalytics] = useState({
    totalEarnings: '15.7 ETH',
    totalLoves: 289,
    totalViews: 1547,
    totalAgents: 6,
    monthlyGrowth: '+23%'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Creator Dashboard</h1>
            <p className="text-gray-600">Manage your AI agents and track performance</p>
          </div>
          <Link href="/upload">
            <button className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2">
              <PlusIcon className="w-5 h-5" />
              <span>Add New Agent</span>
            </button>
          </Link>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{analytics.totalEarnings}</div>
                <div className="text-gray-600 text-sm">Total Earnings</div>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-green-600 text-sm">
              <ArrowTrendingUpIcon className="w-4 h-4" />
              <span>{analytics.monthlyGrowth} this month</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{analytics.totalAgents}</div>
                <div className="text-gray-600 text-sm">Active Agents</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center">
                <HeartIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{analytics.totalLoves}</div>
                <div className="text-gray-600 text-sm">Total Loves</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center">
                <EyeIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{analytics.totalViews}</div>
                <div className="text-gray-600 text-sm">Total Views</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">Verified</div>
                <div className="text-gray-600 text-sm">Creator Status</div>
              </div>
            </div>
          </div>
        </div>

        {/* Creator's Agents */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Your AI Agents</h2>
            <Link href="/marketplace" className="text-gray-600 hover:text-gray-800 text-sm font-medium">
              View in Marketplace →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatorAgents.map((agent) => (
              <div
                key={agent.id}
                className="group bg-white rounded-3xl p-6 border border-gray-200 hover:border-gray-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-lg"
              >
                {/* Agent Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-2xl">
                      🤖
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{agent.name}</h3>
                      <div className="text-gray-600 text-sm">ID: #{agent.id}</div>
                    </div>
                  </div>
                  {agent.isPrivate && (
                    <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium border border-yellow-500/30">
                      Private
                    </div>
                  )}
                </div>

                {/* Agent Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-gray-800 font-semibold">{mockData.formatEthAmount(agent.totalStaked)} ETH</div>
                    <div className="text-gray-600 text-xs">Staked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-800 font-semibold">{agent.loves}</div>
                    <div className="text-gray-600 text-xs">Loves</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-800 font-semibold">{parseFloat(agent.rankingScore).toFixed(1)}</div>
                    <div className="text-gray-600 text-xs">Score</div>
                  </div>
                </div>

                {/* Agent Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {agent.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {agent.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full border border-gray-200">
                      {tag}
                    </span>
                  ))}
                  {agent.tags.length > 3 && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full border border-gray-200">
                      +{agent.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-xl font-medium transition-all duration-200 border border-gray-200 hover:border-gray-300">
                    Edit
                  </button>
                  <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-xl font-medium transition-all duration-200 border border-gray-200 hover:border-gray-300">
                    Insights
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/upload">
              <div className="group cursor-pointer bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl p-6 transition-all duration-200 transform hover:scale-105 shadow-sm">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <PlusIcon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">Create New Agent</h4>
                </div>
                <p className="text-gray-600 text-sm">Upload and deploy a new AI agent to the marketplace</p>
              </div>
            </Link>

            <Link href="/marketplace">
              <div className="group cursor-pointer bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl p-6 transition-all duration-200 transform hover:scale-105 shadow-sm">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <ChartBarIcon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">View Marketplace</h4>
                </div>
                <p className="text-gray-600 text-sm">Browse and discover other AI agents in the marketplace</p>
              </div>
            </Link>

            <div className="group cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-2xl p-6 transition-all duration-200 transform hover:scale-105">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center">
                  <HeartIcon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800">Analytics Dashboard</h4>
              </div>
              <p className="text-gray-600 text-sm">View detailed analytics and performance metrics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;