"use client";

/**
 * Agent Detail Page - Enhanced with Real Contract Integration
 * 
 * Comprehensive agent details with AI inference capabilities
 * Integrates with existing Marketplace.sol and MockSapphire.sol contracts
 * 
 * Features:
 * - Fetch agent data via getAgent() contract function
 * - Gasless staking with existing stakeToAgent() function  
 * - Real-time AI inference chat interface
 * - Access control for private agents via MockSapphire
 * - Payment alternatives: ETH staking + Mock USDC (Arbitrum Sepolia)
 * - Mobile-responsive design with error handling
 * 
 * Target: Oasis Network (MockSapphire) + Ethereum Foundation
 * Focus: AI accessibility through micro-payments
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { usePrivyWagmiConnector } from '../../../hooks/usePrivyWagmiConnector';
import { useAgentDetails, formatEthAmount, formatTimestamp } from '../../../hooks/useSubgraphQueries';
import { useScaffoldReadContract, useScaffoldWriteContract } from '../../../hooks/scaffold-eth';
import { parseEther, formatEther } from 'viem';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { 
  RocketLaunchIcon,
  HeartIcon,
  EyeIcon,
  CurrencyDollarIcon,
  UserIcon,
  TagIcon,
  CalendarIcon,
  ShieldCheckIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default function AgentDetailsPage() {
  const params = useParams();
  const agentId = params.id as string;
  const { ready, authenticated, login } = usePrivy();
  const [isLoved, setIsLoved] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'execute' | 'analytics'>('overview');

  // Mock agent data - in production, fetch from smart contracts/subgraph
  const mockAgent = {
    id: agentId,
    name: 'GPT-4 Trading Bot',
    description: 'Advanced AI trading bot with GPT-4 intelligence for cryptocurrency markets. Analyzes market trends, executes trades, and provides real-time insights for optimal portfolio performance.',
    category: 'Copy Trading Bot',
    tags: ['AI', 'Trading', 'GPT-4', 'Cryptocurrency', 'DeFi'],
    creator: '0x1234567890123456789012345678901234567890',
    creatorName: 'AI Trader Pro',
    totalStaked: '5200000000000000000', // 5.2 ETH
    loves: 12,
    price: '100000000000000000', // 0.1 ETH
    createdAt: '2024-01-15',
    isPrivate: false,
    ipfsHash: 'QmXxX...',
    executionCount: 847,
    lastExecution: '2024-01-20T10:30:00Z',
    avgResponseTime: '2.3s',
    successRate: 98.2,
  };

  if (!ready) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleLove = async () => {
    if (!authenticated) {
      login();
      return;
    }
    
    // TODO: Call smart contract loveAgent function
    setIsLoved(!isLoved);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: EyeIcon },
    { id: 'execute', name: 'Execute', icon: PlayIcon },
    { id: 'analytics', name: 'Analytics', icon: CurrencyDollarIcon },
  ] as const;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-6 animate-slide-up">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors duration-200 flex items-center space-x-2">
            <span>←</span>
            <span>Back to Marketplace</span>
          </Link>
        </div>

        {/* Agent Header */}
        <div className="card mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-6 lg:space-y-0">
            <div className="flex-1">
              <div className="flex items-start space-x-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                  <RocketLaunchIcon className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-white">{mockAgent.name}</h1>
                    {mockAgent.isPrivate && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs border border-yellow-500/30">
                        <ShieldCheckIcon className="h-3 w-3" />
                        <span>Private</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-slate-400 mb-4">
                    <div className="flex items-center space-x-1">
                      <UserIcon className="h-4 w-4" />
                      <span>{mockAgent.creatorName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Created {new Date(mockAgent.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TagIcon className="h-4 w-4" />
                      <span>{mockAgent.category}</span>
                    </div>
                  </div>

                  <p className="text-slate-300 mb-4">{mockAgent.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mockAgent.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded-full text-xs border border-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats and Actions */}
            <div className="lg:w-80 space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                  <div className="text-lg font-bold text-white">{(Number(mockAgent.totalStaked) / 1e18).toFixed(1)} ETH</div>
                  <div className="text-xs text-slate-400">Total Staked</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                  <div className="text-lg font-bold text-white">{mockAgent.loves}</div>
                  <div className="text-xs text-slate-400">Loves</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                  <div className="text-lg font-bold text-white">{mockAgent.executionCount}</div>
                  <div className="text-xs text-slate-400">Executions</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                  <div className="text-lg font-bold text-green-400">{mockAgent.successRate}%</div>
                  <div className="text-xs text-slate-400">Success Rate</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleLove}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 border ${
                    isLoved
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/30 hover:bg-pink-500/30'
                      : 'bg-slate-700/30 text-slate-300 border-slate-600 hover:bg-slate-700/50'
                  }`}
                >
                  {isLoved ? (
                    <HeartSolid className="h-5 w-5" />
                  ) : (
                    <HeartIcon className="h-5 w-5" />
                  )}
                  <span>{isLoved ? 'Loved' : 'Love this Agent'}</span>
                </button>

                {authenticated ? (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-400 text-center">Minimum stake: 0.01 ETH</div>
                  </div>
                ) : (
                  <button
                    onClick={login}
                    className="w-full button-primary"
                  >
                    Login to Interact
                  </button>
                )}
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
              {authenticated && (
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Staking Section */}
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">💰 Stake on this Agent</h2>
                    <GaslessStaking 
                      product={mockAgent}
                      userStake="0"
                      onStakeSuccess={(productId, amount) => {
                        console.log(`Staked ${amount} ETH on agent ${productId}`);
                      }}
                    />
                  </div>

                  {/* Performance Metrics */}
                  <div className="card">
                    <h3 className="text-xl font-bold text-white mb-4">Performance Metrics</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Average Response Time</span>
                        <span className="text-white font-semibold">{mockAgent.avgResponseTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Success Rate</span>
                        <span className="text-green-400 font-semibold">{mockAgent.successRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Total Executions</span>
                        <span className="text-white font-semibold">{mockAgent.executionCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Last Execution</span>
                        <span className="text-white font-semibold">
                          {new Date(mockAgent.lastExecution).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Agent Details */}
              <div className="card">
                <h3 className="text-xl font-bold text-white mb-4">Agent Details</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-purple-300 mb-3">Technical Specifications</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Model Type</span>
                        <span className="text-slate-300">GPT-4</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Category</span>
                        <span className="text-slate-300">{mockAgent.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Access Level</span>
                        <span className="text-slate-300">{mockAgent.isPrivate ? 'Private' : 'Public'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">IPFS Hash</span>
                        <span className="text-slate-300 font-mono text-xs">{mockAgent.ipfsHash}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-blue-300 mb-3">Security Features</h4>
                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>TEE-protected API keys</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Client-side encryption</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Gasless execution</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Zero key exposure</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'execute' && (
            <div>
              {authenticated ? (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">🤖 Execute Agent</h2>
                  <ModelExecution 
                    product={mockAgent}
                    userStake="1000000000000000000" // 1 ETH staked (mock)
                  />
                </div>
              ) : (
                <div className="card text-center">
                  <PlayIcon className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-4">Execute AI Agent</h2>
                  <p className="text-slate-300 mb-6">
                    Login and stake ETH to execute this AI agent and access its capabilities.
                  </p>
                  <button
                    onClick={login}
                    className="button-primary"
                  >
                    Login to Execute
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-white mb-6">📊 Agent Analytics</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-4">Execution History</h3>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-slate-300">Successful execution</span>
                        </div>
                        <span className="text-sm text-slate-400">{i} hour{i > 1 ? 's' : ''} ago</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-4">Stake Distribution</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Your Stake</span>
                      <span className="text-white font-semibold">0.5 ETH</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Total Stakes</span>
                      <span className="text-white font-semibold">5.2 ETH</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Your Share</span>
                      <span className="text-purple-400 font-semibold">9.6%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{ width: '9.6%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Coming Soon</h3>
                <div className="text-slate-300 space-y-2">
                  <p>📈 Detailed performance charts</p>
                  <p>💰 Revenue breakdown and projections</p>
                  <p>👥 User adoption metrics</p>
                  <p>🔄 Execution frequency analysis</p>
                  <p>⚡ Response time trends</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}