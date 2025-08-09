"use client";

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useMockData, ALL_MOCK_AGENTS } from '../../utils/mockAnalyticsData';
import Link from 'next/link';
import { 
  PlusIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  HeartIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { ready, authenticated, user } = usePrivy();
  const mockData = useMockData();
  
  // Filter agents by current user (mock implementation)
  const [userAgents, setUserAgents] = useState(
    ALL_MOCK_AGENTS.filter(agent => 
      // Mock filter - in real app, filter by user.wallet.address
      agent.creator === user?.wallet?.address || 
      Math.random() > 0.7 // Mock some agents as "owned" by user
    ).slice(0, 4)
  );

  const [stats, setStats] = useState({
    totalAgents: userAgents.length,
    totalEarnings: userAgents.reduce((sum, agent) => sum + parseFloat(agent.totalStaked), 0),
    totalLoves: userAgents.reduce((sum, agent) => sum + agent.loves, 0),
    avgScore: userAgents.reduce((sum, agent) => sum + parseFloat(agent.rankingScore), 0) / userAgents.length || 0
  });

  useEffect(() => {
    // Recalculate stats when userAgents changes
    setStats({
      totalAgents: userAgents.length,
      totalEarnings: userAgents.reduce((sum, agent) => sum + parseFloat(agent.totalStaked), 0),
      totalLoves: userAgents.reduce((sum, agent) => sum + agent.loves, 0),
      avgScore: userAgents.reduce((sum, agent) => sum + parseFloat(agent.rankingScore), 0) / userAgents.length || 0
    });
  }, [userAgents]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Please connect your wallet to view your profile</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-3xl">
                {user?.google?.name?.charAt(0) || user?.email?.address?.charAt(0) || '👤'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {user?.google?.name || user?.email?.address?.split('@')[0] || 'Creator'}
                </h1>
                <div className="text-slate-400">{user?.wallet?.address ? `${user.wallet.address.slice(0, 8)}...${user.wallet.address.slice(-6)}` : 'Not connected'}</div>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm">Active Creator</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-200 flex items-center space-x-2">
              <PencilIcon className="w-5 h-5" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{stats.totalAgents}</div>
              <div className="text-slate-400 text-sm">AI Agents</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">{mockData.formatEthAmount(stats.totalEarnings.toString())} ETH</div>
              <div className="text-slate-400 text-sm">Total Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400 mb-1">{stats.totalLoves}</div>
              <div className="text-slate-400 text-sm">Total Loves</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">{stats.avgScore.toFixed(1)}</div>
              <div className="text-slate-400 text-sm">Avg Score</div>
            </div>
          </div>
        </div>

        {/* Your AI Agents */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Your AI Agents</h2>
            <Link href="/upload">
              <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-green-500/25 transform hover:scale-105 transition-all duration-200 flex items-center space-x-2">
                <PlusIcon className="w-5 h-5" />
                <span>Create New Agent</span>
              </button>
            </Link>
          </div>

          {userAgents.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl p-12 border border-slate-700/50 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-white mb-2">No AI Agents Yet</h3>
              <p className="text-slate-400 mb-6">Create your first AI agent to start earning from the marketplace</p>
              <Link href="/upload">
                <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-200">
                  Create Your First Agent
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-purple-500/25"
                >
                  {/* Agent Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-2xl">
                        🤖
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                        <div className="text-slate-400 text-sm">ID: #{agent.id}</div>
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
                      <div className="text-white font-semibold">{mockData.formatEthAmount(agent.totalStaked)} ETH</div>
                      <div className="text-slate-400 text-xs">Staked</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-semibold">{agent.loves}</div>
                      <div className="text-slate-400 text-xs">Loves</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-semibold">{parseFloat(agent.rankingScore).toFixed(1)}</div>
                      <div className="text-slate-400 text-xs">Score</div>
                    </div>
                  </div>

                  {/* Agent Description */}
                  <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                    {agent.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {agent.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="bg-slate-700/50 text-slate-300 text-xs px-2 py-1 rounded-full border border-slate-600/50">
                        {tag}
                      </span>
                    ))}
                    {agent.tags.length > 3 && (
                      <span className="bg-slate-700/50 text-slate-400 text-xs px-2 py-1 rounded-full border border-slate-600/50">
                        +{agent.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Link href={`/agent/${agent.id}`} className="flex-1">
                      <button className="w-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 border border-blue-500/30 hover:border-blue-500/50">
                        View
                      </button>
                    </Link>
                    <button className="flex-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 border border-green-500/30 hover:border-green-500/50">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}