"use client";

/**
 * Dashboard Page
 * 
 * User dashboard showing their agents, earnings, and marketplace analytics
 * with Privy authentication integration.
 */

import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { RealtimeRankings } from '../../components/RealtimeRankings';
import { LoadingSpinner, LoadingState } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  RocketLaunchIcon,
  EyeIcon,
  HeartIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function DashboardPage() {
  const { ready, authenticated, login, user } = usePrivy();
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'analytics'>('overview');

  // Mock data - in production, fetch from smart contracts/subgraph
  const mockStats = {
    totalAgents: 3,
    totalEarnings: '2.45',
    totalStakes: '12.8',
    totalLoves: 24,
  };

  const mockAgents = [
    {
      id: 1,
      name: 'GPT-4 Trading Bot',
      category: 'Copy Trading Bot',
      stakes: '5.2',
      loves: 12,
      earnings: '1.56',
      status: 'active',
    },
    {
      id: 2,
      name: 'Market Analysis Agent',
      category: 'AI Agent',
      stakes: '4.8',
      loves: 8,
      earnings: '0.67',
      status: 'active',
    },
    {
      id: 3,
      name: 'DeFi Yield Optimizer',
      category: 'MCP',
      stakes: '2.8',
      loves: 4,
      earnings: '0.22',
      status: 'private',
    },
  ];

  if (!ready) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card">
            <ChartBarIcon className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">
              Your Dashboard
            </h1>
            <p className="text-slate-300 mb-8">
              Connect your account to view your agents, earnings, and marketplace analytics.
            </p>
            <button
              onClick={login}
              className="button-primary"
            >
              Login to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'agents', name: 'My Agents', icon: RocketLaunchIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
  ] as const;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Dashboard
            </h1>
            <p className="text-slate-300">
              Welcome back, {user?.google?.name || user?.email?.address?.split('@')[0] || 'Creator'}!
            </p>
          </div>
          <Link href="/upload">
            <button className="button-primary flex items-center space-x-2">
              <PlusIcon className="h-4 w-4" />
              <span>Create Agent</span>
            </button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <RocketLaunchIcon className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{mockStats.totalAgents}</div>
                <div className="text-xs text-slate-400">Total Agents</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CurrencyDollarIcon className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{mockStats.totalEarnings} ETH</div>
                <div className="text-xs text-slate-400">Total Earnings</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <EyeIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{mockStats.totalStakes} ETH</div>
                <div className="text-xs text-slate-400">Total Stakes</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-pink-500/20 rounded-lg">
                <HeartIcon className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{mockStats.totalLoves}</div>
                <div className="text-xs text-slate-400">Total Loves</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Recent Activity */}
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-slate-300">New stake on GPT-4 Trading Bot</span>
                    </div>
                    <span className="text-sm text-slate-400">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-slate-300">Agent execution completed</span>
                    </div>
                    <span className="text-sm text-slate-400">5 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-slate-300">New agent created: DeFi Yield Optimizer</span>
                    </div>
                    <span className="text-sm text-slate-400">1 day ago</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link href="/upload">
                      <button className="w-full text-left p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-600 transition-colors duration-200">
                        <div className="flex items-center space-x-3">
                          <PlusIcon className="h-5 w-5 text-purple-400" />
                          <span className="text-slate-300">Create New Agent</span>
                        </div>
                      </button>
                    </Link>
                    <button className="w-full text-left p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-600 transition-colors duration-200">
                      <div className="flex items-center space-x-3">
                        <CurrencyDollarIcon className="h-5 w-5 text-green-400" />
                        <span className="text-slate-300">Withdraw Earnings</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Tips</h3>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <span className="text-blue-300">💡 Optimize your agent descriptions for better visibility</span>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <span className="text-green-300">🎯 Competitive pricing increases stake volume</span>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <span className="text-purple-300">🚀 Regular updates keep agents relevant</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">My Agents</h2>
                <Link href="/upload">
                  <button className="button-primary flex items-center space-x-2">
                    <PlusIcon className="h-4 w-4" />
                    <span>New Agent</span>
                  </button>
                </Link>
              </div>

              <div className="grid gap-6">
                {mockAgents.map((agent) => (
                  <div key={agent.id} className="card">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            agent.status === 'active' 
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          }`}>
                            {agent.status}
                          </span>
                        </div>
                        <p className="text-slate-400 mb-4">{agent.category}</p>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-lg font-bold text-white">{agent.stakes} ETH</div>
                            <div className="text-xs text-slate-400">Total Stakes</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-white">{agent.loves}</div>
                            <div className="text-xs text-slate-400">Loves</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-400">{agent.earnings} ETH</div>
                            <div className="text-xs text-slate-400">Earnings</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <Link href={`/agent/${agent.id}`}>
                          <button className="button-secondary text-sm">View Details</button>
                        </Link>
                        <button className="text-sm text-slate-400 hover:text-white transition-colors duration-200">
                          Edit Agent
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-white mb-6">Marketplace Analytics</h2>
              <RealtimeRankings />
              
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Coming Soon</h3>
                <div className="text-slate-300 space-y-2">
                  <p>📊 Detailed agent performance metrics</p>
                  <p>📈 Revenue analytics and trends</p>
                  <p>👥 User engagement insights</p>
                  <p>🎯 Market opportunity analysis</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}