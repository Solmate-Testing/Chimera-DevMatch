"use client";

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useScaffoldReadContract } from '../../hooks/scaffold-eth/useScaffoldReadContract';
import { useEnhancedTransactions } from '../../hooks/useEnhancedTransactions';
import { formatEther } from 'viem';
import { generateCreatorProfile, type CreatorProfile } from '../../utils/avatarGenerator';
import { useMockData, ALL_MOCK_AGENTS } from '../../utils/mockAnalyticsData';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  HeartIcon,
  CurrencyDollarIcon,
  UserIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface Agent {
  id: bigint;
  creator: string;
  name: string;
  description: string;
  tags: string[];
  ipfsHash: string;
  totalStake: bigint;
  isPrivate: boolean;
  createdAt: bigint;
  apiKeyHash: string;
  loves: bigint;
}

interface CreatorShowcase {
  agent: Agent;
  profile: CreatorProfile;
}

const MarketplacePage = () => {
  const { ready, authenticated, login, user } = usePrivy();
  const [viewMode, setViewMode] = useState<'Creator' | 'Collector'>('Collector');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<CreatorShowcase | null>(null);
  const [recentAgents, setRecentAgents] = useState<CreatorShowcase[]>([]);
  const [featuredAgents, setFeaturedAgents] = useState<CreatorShowcase[]>([]);

  // Mock data for demo
  const mockData = useMockData();

  // Read agents from contract
  const { data: agentCount } = useScaffoldReadContract({
    contractName: 'Marketplace',
    functionName: 'getAgentCount',
  });

  const { data: allAgents } = useScaffoldReadContract({
    contractName: 'Marketplace',
    functionName: 'getAllAgents',
  });

  // Check if we have real contract data
  const hasContractData = allAgents && Array.isArray(allAgents) && allAgents.length > 0;

  const enhancedTx = useEnhancedTransactions();

  useEffect(() => {
    let showcases: CreatorShowcase[] = [];
    
    if (hasContractData) {
      // Use real contract data
      showcases = (allAgents as Agent[]).map(agent => ({
        agent,
        profile: generateCreatorProfile(
          {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            tags: agent.tags,
          },
          agent.totalStake,
          1
        ),
      }));
    } else {
      // Use mock data for demo
      showcases = ALL_MOCK_AGENTS.slice(0, 12).map((mockAgent, index) => {
        const agent: Agent = {
          id: BigInt(mockAgent.id),
          creator: mockAgent.creator,
          name: mockAgent.name,
          description: mockAgent.description,
          tags: mockAgent.tags,
          ipfsHash: mockAgent.ipfsHash,
          totalStake: BigInt(Math.floor(parseFloat(mockAgent.totalStaked))),
          isPrivate: mockAgent.isPrivate,
          createdAt: BigInt(Math.floor(mockAgent.createdAt)),
          apiKeyHash: `hash${index}`,
          loves: BigInt(Math.floor(mockAgent.loves))
        };
        
        return {
          agent,
          profile: generateCreatorProfile(
            {
              id: agent.id,
              name: agent.name,
              description: agent.description,
              tags: agent.tags,
            },
            agent.totalStake,
            1
          ),
        };
      });
    }
    
    setRecentAgents(showcases);
    setFeaturedAgents(showcases.slice(0, 6));
    if (!selectedAgent && showcases.length > 0) {
      setSelectedAgent(showcases[0]);
    }
  }, [allAgents, hasContractData, selectedAgent]);

  const handleStakeAccess = async (agentId: bigint) => {
    try {
      await enhancedTx.stakeToAgent(agentId, BigInt(10000000000000000), {
        onProgress: (stage) => console.log('🎯 Stake progress:', stage),
        onSuccess: (receipt) => {
          console.log('✅ Stake successful:', receipt);
          // Refresh the page data
          window.location.reload();
        },
        onError: (error) => {
          console.error('❌ Stake failed:', error);
          alert(`Staking failed: ${error.message}`);
        }
      });
    } catch (error: any) {
      console.error('❌ Staking failed:', error);
      alert(`Staking failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleLoveAgent = async (agentId: bigint) => {
    try {
      await enhancedTx.loveAgent(agentId, {
        onProgress: (stage) => console.log('💖 Love progress:', stage),
        onSuccess: (receipt) => {
          console.log('✅ Love successful:', receipt);
          
          // Update UI optimistically
          setRecentAgents(prevAgents => 
            prevAgents.map(showcase => 
              showcase.agent.id === agentId 
                ? { ...showcase, agent: { ...showcase.agent, loves: showcase.agent.loves + BigInt(1) }}
                : showcase
            )
          );
          
          // Update selected agent if it's the same one
          if (selectedAgent?.agent.id === agentId) {
            setSelectedAgent(prev => prev ? {
              ...prev,
              agent: { ...prev.agent, loves: prev.agent.loves + BigInt(1) }
            } : null);
          }
        },
        onError: (error) => {
          console.error('❌ Love failed:', error);
          alert(`Love failed: ${error.message}`);
        }
      });
    } catch (error: any) {
      console.error('❌ Love failed:', error);
      alert(`Love failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleTransferAgent = async (agentId: bigint) => {
    if (!authenticated || !user?.wallet?.address) {
      alert('Please connect your wallet first');
      return;
    }

    const toAddress = prompt('Enter recipient address:');
    if (!toAddress || toAddress.length !== 42 || !toAddress.startsWith('0x')) {
      alert('Please enter a valid Ethereum address');
      return;
    }

    try {
      // This would call a transfer function on the smart contract
      console.log(`Transferring agent ${agentId} to ${toAddress}`);
      
      // Example implementation - you'd need to add this to your contract
      // const result = await transferAgent({
      //   functionName: 'transferAgent',
      //   args: [agentId, toAddress],
      // });
      
      alert('Transfer functionality coming soon! This would transfer the agent to: ' + toAddress);
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Transfer failed: ' + error?.message);
    }
  };

  const filteredAgents = recentAgents.filter(showcase => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    return (
      showcase.agent.name.toLowerCase().includes(query) ||
      showcase.agent.description.toLowerCase().includes(query) ||
      showcase.agent.tags.some(tag => tag.toLowerCase().includes(query)) ||
      showcase.profile.name.toLowerCase().includes(query) ||
      showcase.profile.specialization.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-white relative">
      {/* Top Navigation Bar */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo with Creator/Collector Toggle */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setViewMode('Creator')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    viewMode === 'Creator'
                      ? 'bg-white text-gray-800 shadow-lg'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Creator
                </button>
                <button
                  onClick={() => setViewMode('Collector')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    viewMode === 'Collector'
                      ? 'bg-white text-gray-800 shadow-lg'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Collector
                </button>
              </div>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search NFT's, Collections"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 shadow-sm"
                />
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Right: Add NFT Button */}
            <div className="flex items-center">
              <Link href="/upload">
                <button className="bg-purple-500 text-white p-3 rounded-full shadow-lg hover:bg-purple-600 transform hover:scale-105 transition-all duration-200">
                  <PlusIcon className="h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Recent Collections */}
          <div className="lg:col-span-3 space-y-8">
            {/* Recent Collections Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Collections</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAgents.slice(0, 6).map((showcase) => (
                  <div
                    key={showcase.agent.id.toString()}
                    onClick={() => {
                      // Navigate to full-screen agent page
                      window.location.href = `/agent/${showcase.agent.id}`;
                    }}
                    className="group bg-white rounded-2xl p-6 border border-gray-200 cursor-pointer hover:border-gray-300 hover:shadow-lg transition-all duration-300 shadow-sm"
                  >
                    {/* Agent Main Image */}
                    <div className="mb-4">
                      <img
                        src={showcase.profile.avatar.url}
                        alt={showcase.profile.name}
                        className="w-full h-48 rounded-xl object-cover object-top bg-gray-100"
                      />
                    </div>
                    
                    {/* Creator Info */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-800 font-medium text-sm">
                            {showcase.profile.name}
                          </span>
                          {showcase.profile.verified && (
                            <ShieldCheckIcon className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div className="text-gray-500 text-xs">{showcase.profile.specialization}</div>
                      </div>
                    </div>

                    {/* Agent Title */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{showcase.agent.name}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{showcase.agent.description}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center">
                        <div className="text-gray-800 font-semibold text-sm">{showcase.profile.stats.activeUsers}</div>
                        <div className="text-gray-500 text-xs">Items</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-800 font-semibold text-sm">{Math.floor(Number(showcase.agent.loves) / 10)}</div>
                        <div className="text-gray-500 text-xs">Owners</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-800 font-semibold text-sm">{showcase.agent.loves.toString()}</div>
                        <div className="text-gray-500 text-xs">Likes</div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center justify-between">
                        <div className="text-gray-600 text-sm">
                          {showcase.profile.specialization}
                        </div>
                        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                          <CurrencyDollarIcon className="w-4 h-4" />
                          <span>{mockData.formatEthAmount(showcase.agent.totalStake.toString())} ETH</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* History Section */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-6">Transaction History</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-4 text-slate-400 text-sm font-medium border-b border-slate-700/50 pb-3">
                  <div>Event</div>
                  <div>From/To</div>
                  <div>Amount</div>
                  <div>Value</div>
                  <div>Date</div>
                </div>
                {[
                  { event: 'Stake', fromTo: 'User → Agent #1', amount: '0.01 ETH', value: '$25.30', date: '2 hours ago' },
                  { event: 'Love', fromTo: 'User → Agent #5', amount: '-', value: '-', date: '5 hours ago' },
                  { event: 'Stake', fromTo: 'User → Agent #3', amount: '0.02 ETH', value: '$50.60', date: '1 day ago' },
                ].map((tx, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 text-white text-sm py-3 border-b border-slate-700/30 hover:bg-slate-700/20 rounded-lg transition-colors duration-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                        {tx.event === 'Stake' ? <CurrencyDollarIcon className="w-4 h-4 text-white" /> : <HeartIcon className="w-4 h-4 text-white" />}
                      </div>
                      <span>{tx.event}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>{tx.fromTo}</span>
                    </div>
                    <div>{tx.amount}</div>
                    <div>{tx.value}</div>
                    <div className="text-slate-400">{tx.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Featured NFT Detail */}
          {selectedAgent && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 sticky top-32 h-fit shadow-lg">
              {/* NFT Owner Info */}
              <div className="flex items-center space-x-3 mb-6">
                <img
                  src={selectedAgent.profile.avatar.url}
                  alt={selectedAgent.profile.name}
                  className="w-12 h-12 rounded-full ring-2 ring-gray-200 object-cover object-top"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-800 font-semibold">
                      {selectedAgent.profile.name}
                    </span>
                    {selectedAgent.profile.verified && (
                      <ShieldCheckIcon className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div className="text-gray-500 text-sm">@{selectedAgent.profile.handle}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mb-6">
                <button 
                  onClick={() => handleStakeAccess(selectedAgent.agent.id)}
                  disabled={enhancedTx.transactionState.isLoading || enhancedTx.transactionState.isPending || !ready}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-green-500/25 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {enhancedTx.transactionState.isLoading ? 'Preparing...' : 
                   enhancedTx.transactionState.isPending ? 'Confirming...' : 'Buy'}
                </button>
                <button 
                  onClick={() => handleTransferAgent(selectedAgent.agent.id)}
                  disabled={enhancedTx.transactionState.isLoading || enhancedTx.transactionState.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Transfer
                </button>
              </div>

              {/* Large NFT Preview */}
              <div 
                className="rounded-3xl h-80 mb-6 flex items-center justify-center relative overflow-hidden group"
                style={{
                  background: `linear-gradient(135deg, ${selectedAgent.profile.colorTheme.primary}50, ${selectedAgent.profile.colorTheme.secondary}50)`,
                }}
              >
                <img
                  src={selectedAgent.profile.avatar.url}
                  alt={selectedAgent.agent.name}
                  className="w-32 h-32 rounded-3xl shadow-2xl group-hover:scale-110 transition-transform duration-300 object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                
                {/* Floating stats */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                  <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
                    <HeartIcon className="w-4 h-4 inline mr-1" />
                    {selectedAgent.agent.loves.toString()}
                  </div>
                  <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
                    <UserIcon className="w-4 h-4 inline mr-1" />
                    {selectedAgent.profile.stats.activeUsers}
                  </div>
                </div>
              </div>

              {/* NFT Name and ID */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{selectedAgent.agent.name}</h3>
                <div className="text-slate-400 text-sm mb-3">#{selectedAgent.agent.id.toString()}</div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {selectedAgent.agent.description}
                </p>
              </div>

              {/* Stats in Rounded Badges */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full px-4 py-2 border border-blue-500/30">
                  <div className="text-white font-semibold text-sm">{selectedAgent.profile.stats.activeUsers}</div>
                  <div className="text-slate-400 text-xs">Followers</div>
                </div>
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full px-4 py-2 border border-yellow-500/30 flex items-center space-x-1">
                  <CurrencyDollarIcon className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-semibold text-sm">{mockData.formatEthAmount(selectedAgent.agent.totalStake.toString())} ETH</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedAgent.agent.tags.map((tag, index) => (
                  <span key={index} className="bg-slate-700/50 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-600/50">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Love Button */}
              <button 
                onClick={() => handleLoveAgent(selectedAgent.agent.id)}
                disabled={enhancedTx.transactionState.isLoading || enhancedTx.transactionState.isPending}
                className="w-full py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-pink-500/20 to-red-500/20 hover:from-pink-500/30 hover:to-red-500/30 disabled:from-gray-500/10 disabled:to-gray-500/10 text-white border border-pink-500/30 hover:border-pink-500/50 disabled:border-gray-500/30 flex items-center justify-center space-x-2 disabled:cursor-not-allowed disabled:transform-none"
              >
                <HeartIcon className="w-5 h-5" />
                <span>
                  {enhancedTx.transactionState.isLoading ? 'Preparing...' :
                   enhancedTx.transactionState.isPending ? 'Adding...' :
                   `Add to Favorites (${selectedAgent.agent.loves.toString()})`}
                </span>
              </button>
            </div>
          )}
          
        </div>

        {/* Transaction Status Notifications */}
        {enhancedTx.transactionState.error && (
          <div className="fixed bottom-6 right-6 bg-red-500/90 backdrop-blur-sm text-white p-4 rounded-2xl shadow-lg border border-red-400/50 max-w-md">
            <div className="flex items-center space-x-2 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span className="font-semibold">Transaction Failed</span>
            </div>
            <p className="text-sm">{enhancedTx.transactionState.error}</p>
            <button
              onClick={enhancedTx.clearError}
              className="mt-2 text-xs underline opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {enhancedTx.transactionState.isConfirmed && (
          <div className="fixed bottom-6 right-6 bg-green-500/90 backdrop-blur-sm text-white p-4 rounded-2xl shadow-lg border border-green-400/50 max-w-md">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="font-semibold">Transaction Successful!</span>
            </div>
            {enhancedTx.transactionState.txHash && (
              <p className="text-sm">
                Hash: {enhancedTx.transactionState.txHash.slice(0, 10)}...
              </p>
            )}
            <button
              onClick={enhancedTx.reset}
              className="mt-2 text-xs underline opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;