"use client";

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useScaffoldReadContract } from '../../hooks/scaffold-eth/useScaffoldReadContract';
import { useScaffoldWriteContract } from '../../hooks/scaffold-eth/useScaffoldWriteContract';
import { WalletIcon } from '@heroicons/react/24/outline';
import { formatEther } from 'viem';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import { WalletConnection } from '../../components/WalletConnection';
import { generateCreatorProfile, type CreatorProfile } from '../../utils/avatarGenerator';
import MarketplaceTestSuite from '../../components/MarketplaceTestSuite';
import { useMockData, ALL_MOCK_AGENTS } from '../../utils/mockAnalyticsData';

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
  const [viewMode, setViewMode] = useState<'creator' | 'user'>('user');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<CreatorShowcase | null>(null);
  const [recentAgents, setRecentAgents] = useState<CreatorShowcase[]>([]);
  const [isStaking, setIsStaking] = useState(false);
  const [isLoving, setIsLoving] = useState(false);

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

  const { writeContractAsync: stakeToAgent } = useScaffoldWriteContract('Marketplace');
  const { writeContractAsync: loveAgent } = useScaffoldWriteContract('Marketplace');

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
      showcases = ALL_MOCK_AGENTS.slice(0, 8).map((mockAgent, index) => {
        const agent: Agent = {
          id: BigInt(mockAgent.id),
          creator: mockAgent.creator,
          name: mockAgent.name,
          description: mockAgent.description,
          tags: mockAgent.tags,
          ipfsHash: mockAgent.ipfsHash,
          totalStake: BigInt(mockAgent.totalStaked),
          isPrivate: mockAgent.isPrivate,
          createdAt: BigInt(mockAgent.createdAt),
          apiKeyHash: `hash${index}`,
          loves: BigInt(mockAgent.loves)
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
    if (!selectedAgent && showcases.length > 0) {
      setSelectedAgent(showcases[0]);
    }
  }, [allAgents, hasContractData, selectedAgent]);

  const handleStakeAccess = async (agentId: bigint) => {
    // Check authentication first
    if (!ready) {
      console.log('⏳ Privy not ready yet');
      return;
    }
    
    if (!authenticated) {
      console.log('🔐 User not authenticated, prompting login');
      login();
      return;
    }

    if (!user?.wallet?.address) {
      console.log('💳 No wallet connected');
      alert('Please connect your wallet to stake');
      return;
    }
    
    console.log('🚀 Starting stake transaction for agent:', agentId.toString());
    console.log('👤 User address:', user.wallet.address);
    setIsStaking(true);
    
    try {
      // Log the transaction details
      console.log('📊 Stake Details:', {
        agentId: agentId.toString(),
        amount: '0.01 ETH',
        functionName: 'stakeToAgent',
        userAddress: user.wallet.address
      });
      
      const result = await stakeToAgent({
        functionName: 'stakeToAgent',
        args: [agentId],
        value: BigInt(10000000000000000), // 0.01 ETH minimum stake
      });
      
      console.log('✅ Stake transaction successful:', result);
      
      // Refresh agents after successful stake
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Staking failed:', error);
      alert(`Staking failed: ${error?.message || 'Unknown error'}. Please check console for details.`);
    } finally {
      setIsStaking(false);
    }
  };

  const handleLoveAgent = async (agentId: bigint) => {
    // Check authentication first
    if (!ready) {
      console.log('⏳ Privy not ready yet');
      return;
    }
    
    if (!authenticated) {
      console.log('🔐 User not authenticated, prompting login');
      login();
      return;
    }

    if (!user?.wallet?.address) {
      console.log('💳 No wallet connected');
      alert('Please connect your wallet to love an agent');
      return;
    }
    
    console.log('💖 Starting love transaction for agent:', agentId.toString());
    console.log('👤 User address:', user.wallet.address);
    setIsLoving(true);
    
    try {
      console.log('📊 Love Details:', {
        agentId: agentId.toString(),
        functionName: 'loveAgent',
        userAddress: user.wallet.address
      });
      
      const result = await loveAgent({
        functionName: 'loveAgent',
        args: [agentId],
      });
      
      console.log('✅ Love transaction successful:', result);
      
      // Refresh agents after successful love
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Love failed:', error);
      alert(`Love failed: ${error?.message || 'Unknown error'}. Please check console for details.`);
    } finally {
      setIsLoving(false);
    }
  };

  const filteredAgents = recentAgents.filter(showcase =>
    showcase.agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    showcase.agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    showcase.agent.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex">
      {/* Sidebar */}
      <MarketplaceSidebar 
        userAddress={user?.wallet?.address || "Not connected"}
        isCreator={viewMode === 'creator'} 
      />
      
      {/* Main Content */}
      <div className="flex-1 ml-64">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl font-bold text-white">
                Chimera DevMatch
              </div>
            </div>

            {/* Toggle */}
            <div className="flex items-center bg-white/20 rounded-full p-1">
              <button
                onClick={() => {
                  console.log('👨‍💼 Switched to Creator mode');
                  setViewMode('creator');
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  viewMode === 'creator' 
                    ? 'bg-white text-purple-900 shadow-lg' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Creator
              </button>
              <button
                onClick={() => {
                  console.log('👤 Switched to User mode');
                  setViewMode('user');
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  viewMode === 'user' 
                    ? 'bg-white text-purple-900 shadow-lg' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                User
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search AI Agents, MCPs, Copy Bots"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log('🔍 Search query changed:', value);
                    setSearchQuery(value);
                  }}
                  className="w-full pl-4 pr-10 py-2 bg-white/20 border border-white/30 rounded-full text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Wallet & Publish Section */}
            <div className="flex items-center space-x-4">
              {/* Wallet Connection */}
              <WalletConnection />
              
              {/* Publish Button */}
              <button 
                onClick={() => {
                  console.log('🔥 Publish Agent button clicked - navigating to upload page');
                  window.location.href = '/upload';
                }}
                className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg transform hover:scale-105 transition-all"
              >
                Publish Agent
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet Connection Notice */}
        {ready && !authenticated && (
          <div className="flex justify-center mb-6">
            <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg px-6 py-4 text-purple-200 backdrop-blur-md">
              <div className="flex items-center space-x-3">
                <WalletIcon className="h-5 w-5 text-purple-300" />
                <div>
                  <div className="font-semibold">Connect your wallet to stake and interact with AI agents</div>
                  <div className="text-sm text-purple-300 mt-1">
                    Click "Connect Wallet" above to get started with staking and earning from AI agents
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Demo Data Indicator */}
        {!hasContractData && (
          <div className="flex justify-center mb-6">
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg px-6 py-3 text-blue-200 text-sm backdrop-blur-md">
              📊 <strong>Demo Mode:</strong> Showcasing marketplace with mock agent data - Try the upload page to create real agents!
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent AI Agents */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-6">
                Recent AI Agents ({filteredAgents.length})
              </h2>
              
              <div className="flex overflow-x-auto space-x-4 pb-4">
                {filteredAgents.map((showcase) => (
                  <div
                    key={showcase.agent.id.toString()}
                    onClick={() => {
                      console.log('🎯 Selected agent:', {
                        id: showcase.agent.id.toString(),
                        name: showcase.agent.name,
                        creator: showcase.agent.creator
                      });
                      setSelectedAgent(showcase);
                    }}
                    className="flex-none w-80 bg-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/20 transition-all transform hover:scale-105 border border-white/10"
                  >
                    {/* Creator Info */}
                    <div className="flex items-center space-x-3 mb-3">
                      <img 
                        src={showcase.profile.avatar.url} 
                        alt={showcase.profile.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium text-sm">
                            {showcase.profile.name}
                          </span>
                          {showcase.profile.verified && (
                            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="text-white/60 text-xs">{showcase.profile.specialization}</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                      <div className="text-center">
                        <div className="text-white font-semibold">{showcase.profile.stats.activeUsers}</div>
                        <div className="text-white/70">Active Users</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-semibold">{showcase.profile.stats.successRate}%</div>
                        <div className="text-white/70">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-semibold">{showcase.profile.stats.responseTime}</div>
                        <div className="text-white/70">Response Time</div>
                      </div>
                    </div>

                    {/* Preview Image with Color Theme */}
                    <div 
                      className="rounded-lg h-32 mb-3 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${showcase.profile.colorTheme.primary}20, ${showcase.profile.colorTheme.secondary}20)`
                      }}
                    >
                      <img 
                        src={showcase.profile.avatar.url} 
                        alt={showcase.agent.name}
                        className="w-16 h-16 rounded-lg"
                      />
                    </div>

                    {/* Price and Privacy */}
                    <div className="flex items-center justify-between">
                      <div className="text-white font-semibold">
                        {showcase.profile.stats.monthlyFee} CHM
                      </div>
                      {showcase.agent.isPrivate && (
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    {/* Agent Name */}
                    <div className="mt-2 text-white font-medium">{showcase.agent.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* History Section */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex space-x-6 mb-6">
                <button className="text-white border-b-2 border-white pb-2 font-medium">All Activity</button>
                <button className="text-white/70 hover:text-white pb-2">Subscriptions</button>
                <button className="text-white/70 hover:text-white pb-2">Agent Runs</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-white/70 text-sm">
                      <th className="text-left pb-3">Event</th>
                      <th className="text-left pb-3">From/To</th>
                      <th className="text-left pb-3">Runs</th>
                      <th className="text-left pb-3">Value</th>
                      <th className="text-left pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="text-white text-sm">
                    <tr className="border-t border-white/10">
                      <td className="py-3">Subscribe</td>
                      <td className="py-3">Creator → User</td>
                      <td className="py-3">-</td>
                      <td className="py-3">0.05 CHM</td>
                      <td className="py-3">2 hours ago</td>
                    </tr>
                    <tr className="border-t border-white/10">
                      <td className="py-3">Run</td>
                      <td className="py-3">User → Agent</td>
                      <td className="py-3">15</td>
                      <td className="py-3">0.01 CHM</td>
                      <td className="py-3">5 hours ago</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Agent Detail */}
          {selectedAgent && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              {/* Developer Info */}
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src={selectedAgent.profile.avatar.url} 
                  alt={selectedAgent.profile.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-semibold">
                      {selectedAgent.profile.name}
                    </span>
                    {selectedAgent.profile.verified && (
                      <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="text-white/70 text-sm">@{selectedAgent.profile.handle}</div>
                  <div className="text-white/60 text-xs">{selectedAgent.profile.specialization}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mb-6">
                <button 
                  onClick={() => {
                    console.log('🚀 Navigating to agent:', selectedAgent.agent.id.toString());
                    window.location.href = `/agent/${selectedAgent.agent.id}`;
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>Run Agent</span>
                </button>
                <button 
                  onClick={() => handleStakeAccess(selectedAgent.agent.id)}
                  disabled={isStaking || !ready}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                    isStaking || !ready
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : !authenticated
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                  } text-white`}
                >
                  {!ready ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Loading...</span>
                    </>
                  ) : isStaking ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Staking...</span>
                    </>
                  ) : !authenticated ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 8A8 8 0 11.314 3.314l1.414 1.414A6 6 0 1016 16a6.01 6.01 0 01-1.938-2H16a2 2 0 110-4H9a1 1 0 000 2h7z" clipRule="evenodd" />
                      </svg>
                      <span>Connect to Stake</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span>Stake Access (0.01 ETH)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Large Preview with Color Theme */}
              <div 
                className="rounded-xl h-48 mb-6 flex items-center justify-center relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${selectedAgent.profile.colorTheme.primary}30, ${selectedAgent.profile.colorTheme.secondary}30)`
                }}
              >
                <img 
                  src={selectedAgent.profile.avatar.url} 
                  alt={selectedAgent.agent.name}
                  className="w-24 h-24 rounded-xl relative z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20"></div>
              </div>

              {/* Agent Info */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">{selectedAgent.agent.name}</h3>
                <p className="text-white/70 text-sm mb-3">{selectedAgent.agent.description}</p>
                <div className="text-white/50 text-xs">ID: #{selectedAgent.agent.id.toString()}</div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-white font-semibold">{selectedAgent.profile.stats.activeUsers}</div>
                  <div className="text-white/70 text-sm">Active Users</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-white font-semibold">{selectedAgent.profile.stats.monthlyFee} CHM</div>
                  <div className="text-white/70 text-sm">Monthly Fee</div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedAgent.agent.tags.map((tag, index) => (
                  <span key={index} className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Favorite Button */}
              <button 
                onClick={() => handleLoveAgent(selectedAgent.agent.id)}
                disabled={isLoving}
                className={`w-full py-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                  isLoving 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {isLoving ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Loving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <span>Add to Favorites ({selectedAgent.agent.loves.toString()})</span>
                  </>
                )}
              </button>
            </div>
          )}
          
          {/* Test Suite - Only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8">
              <MarketplaceTestSuite />
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default MarketplacePage;