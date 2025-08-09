"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useScaffoldReadContract, useScaffoldWriteContract } from '../../../hooks/scaffold-eth';
import { generateCreatorProfile } from '../../../utils/avatarGenerator';
import { useMockData, ALL_MOCK_AGENTS } from '../../../utils/mockAnalyticsData';
import { 
  ArrowLeftIcon,
  HeartIcon,
  UserIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ShareIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
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

interface AgentDetailClientProps {
  params: {
    id: string;
  };
}

export default function AgentDetailClient({ params }: AgentDetailClientProps) {
  const router = useRouter();
  const { ready, authenticated, login, user } = usePrivy();
  const mockData = useMockData();
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isStaking, setIsStaking] = useState(false);
  const [isLoving, setIsLoving] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'api'>('overview');
  const [chatMessages, setChatMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { writeContractAsync: stakeToAgent } = useScaffoldWriteContract('Marketplace');
  const { writeContractAsync: loveAgent } = useScaffoldWriteContract('Marketplace');

  useEffect(() => {
    if (params.id) {
      // Find the agent from mock data
      const mockAgent = ALL_MOCK_AGENTS.find(a => a.id === params.id);
      if (mockAgent) {
        const agentData: Agent = {
          id: BigInt(mockAgent.id),
          creator: mockAgent.creator,
          name: mockAgent.name,
          description: mockAgent.description,
          tags: mockAgent.tags,
          ipfsHash: mockAgent.ipfsHash,
          totalStake: BigInt(Math.floor(parseFloat(mockAgent.totalStaked))),
          isPrivate: mockAgent.isPrivate,
          createdAt: BigInt(Math.floor(mockAgent.createdAt)),
          apiKeyHash: `hash${mockAgent.id}`,
          loves: BigInt(Math.floor(mockAgent.loves))
        };
        
        setAgent(agentData);
        setProfile(generateCreatorProfile(
          {
            id: agentData.id,
            name: agentData.name,
            description: agentData.description,
            tags: agentData.tags,
          },
          agentData.totalStake,
          1
        ));
      }
    }
  }, [params.id]);

  const handleStakeAccess = async () => {
    if (!agent) return;

    if (!ready || !authenticated || !user?.wallet?.address) {
      alert('Please connect your wallet first');
      login();
      return;
    }

    setIsStaking(true);
    try {
      const result = await stakeToAgent({
        functionName: 'stakeToAgent',
        args: [agent.id],
        value: BigInt(10000000000000000), // 0.01 ETH
      });
      
      console.log('✅ Stake transaction successful:', result);
      
      // Update local state
      setAgent(prev => prev ? {
        ...prev,
        totalStake: prev.totalStake + BigInt(10000000000000000)
      } : null);
      
      // Grant access after successful stake
      setHasAccess(true);
      saveStakeStatus();
      
      // Show success message and redirect to chat
      alert('✅ Successfully staked! You now have access to this AI agent.');
      setActiveTab('chat');
      
    } catch (error) {
      console.error('❌ Staking failed:', error);
      alert(`Staking failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsStaking(false);
    }
  };

  const handleLoveAgent = async () => {
    if (!agent) return;

    if (!ready || !authenticated || !user?.wallet?.address) {
      alert('Please connect your wallet first');
      login();
      return;
    }

    setIsLoving(true);
    try {
      const result = await loveAgent({
        functionName: 'loveAgent',
        args: [agent.id],
      });
      
      console.log('✅ Love transaction successful:', result);
      
      // Update local state
      setAgent(prev => prev ? {
        ...prev,
        loves: prev.loves + BigInt(1)
      } : null);
      
    } catch (error) {
      console.error('❌ Love failed:', error);
      alert(`Love failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating || !hasAccess) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsGenerating(true);

    try {
      // Simulate AI agent response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `Hello! I'm ${agent?.name}. ${getAgentResponse(userMessage.content, agent?.tags || [])}`,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getAgentResponse = (userInput: string, tags: string[]): string => {
    const input = userInput.toLowerCase();
    
    if (tags.includes('Trading') || tags.includes('DeFi')) {
      if (input.includes('price') || input.includes('trade')) {
        return "Based on current market analysis, I recommend reviewing the recent trends. Remember to always do your own research and never invest more than you can afford to lose.";
      }
      return "I'm specialized in trading and DeFi analysis. I can help you with market insights, portfolio optimization, and risk assessment. What would you like to know?";
    }
    
    if (tags.includes('Assistant') || tags.includes('Productivity')) {
      return "I'm here to help boost your productivity! I can assist with task management, scheduling, content creation, and general assistance. How can I help you today?";
    }
    
    if (tags.includes('Analysis') || tags.includes('Data')) {
      return "I specialize in data analysis and insights. I can help you process information, generate reports, and find patterns in your data. What would you like me to analyze?";
    }
    
    return "I'm ready to assist you! As an AI agent, I can help with various tasks related to my specialization. Feel free to ask me anything!";
  };

  // Check if user has access (simulate checking if they've staked)
  useEffect(() => {
    // In a real implementation, this would check the blockchain
    // For now, simulate that user has access if they're authenticated
    if (authenticated && user?.wallet?.address) {
      // Simulate: check if user has staked this agent
      const hasStaked = localStorage.getItem(`staked-${params.id}-${user.wallet.address}`);
      setHasAccess(!!hasStaked);
    }
  }, [authenticated, user, params.id]);

  // Save stake status to localStorage (simulate blockchain check)
  const saveStakeStatus = () => {
    if (user?.wallet?.address) {
      localStorage.setItem(`staked-${params.id}-${user.wallet.address}`, 'true');
    }
  };

  if (!agent || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading agent details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
      {/* Header */}
      <div className="sticky top-16 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back to Marketplace</span>
              </button>
              
              {/* Tabs */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'overview'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  disabled={!hasAccess}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
                    activeTab === 'chat' && hasAccess
                      ? 'bg-white text-gray-800 shadow-sm'
                      : hasAccess
                      ? 'text-gray-600 hover:text-gray-800'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  <span>Chat</span>
                  {hasAccess && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {hasAccess && (
                <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Access Granted</span>
                </div>
              )}
              <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:text-gray-800 hover:bg-gray-200 transition-colors duration-200">
                <ShareIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Agent Preview */}
          <div className="space-y-8">
            {/* Main Preview */}
            <div 
              className="aspect-square rounded-3xl flex items-center justify-center relative overflow-hidden group shadow-lg bg-white border border-gray-200"
              style={{
                background: `linear-gradient(135deg, ${profile.colorTheme.primary}20, ${profile.colorTheme.secondary}20)`,
              }}
            >
              <img
                src={profile.avatar.url}
                alt={agent.name}
                className="w-64 h-64 rounded-3xl shadow-2xl group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              
              {/* Floating stats */}
              <div className="absolute bottom-6 left-6 right-6 flex justify-between">
                <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                  <HeartIcon className="w-5 h-5 inline mr-2" />
                  {agent.loves.toString()} loves
                </div>
                <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                  <EyeIcon className="w-5 h-5 inline mr-2" />
                  {profile.stats.activeUsers} views
                </div>
              </div>
            </div>

            {/* Additional Images/Info */}
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center"
                >
                  <span className="text-4xl">{i === 1 ? '🤖' : i === 2 ? '⚡' : '🎯'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Agent Info */}
          <div className="space-y-8">
            {/* Creator Info */}
            <div className="flex items-center space-x-4">
              <img
                src={profile.avatar.url}
                alt={profile.name}
                className="w-24 h-16 rounded-xl ring-4 ring-gray-200 object-cover object-top"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xl font-semibold text-gray-800">
                    {profile.name}
                  </span>
                  {profile.verified && (
                    <ShieldCheckIcon className="w-6 h-6 text-blue-400" />
                  )}
                </div>
                <div className="text-gray-600">@{profile.handle}</div>
                <div className="text-gray-500 text-sm">{profile.specialization}</div>
              </div>
            </div>

            {/* Agent Title */}
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4">{agent.name}</h1>
              <div className="text-gray-600 text-lg mb-2">#{agent.id.toString()}</div>
              {agent.isPrivate && (
                <div className="inline-flex items-center space-x-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-medium border border-yellow-500/30">
                  <span>🔒 Private Agent</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Description</h3>
              <p className="text-gray-700 leading-relaxed">{agent.description}</p>
            </div>

            {/* Stats */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-4 border border-blue-500/30">
                  <div className="text-2xl font-bold text-gray-800 mb-1">{profile.stats.activeUsers}</div>
                  <div className="text-gray-600 text-sm">Active Users</div>
                </div>
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-4 border border-green-500/30">
                  <div className="text-2xl font-bold text-gray-800 mb-1">{profile.stats.successRate}%</div>
                  <div className="text-gray-600 text-sm">Success Rate</div>
                </div>
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-4 border border-yellow-500/30 flex items-center space-x-2">
                  <CurrencyDollarIcon className="w-6 h-6 text-yellow-400" />
                  <div>
                    <div className="text-xl font-bold text-gray-800">{mockData.formatEthAmount(agent.totalStake.toString())} ETH</div>
                    <div className="text-gray-600 text-sm">Total Staked</div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-pink-500/20 to-red-500/20 rounded-2xl p-4 border border-pink-500/30">
                  <div className="text-2xl font-bold text-gray-800 mb-1">{agent.loves.toString()}</div>
                  <div className="text-gray-600 text-sm">Loves Received</div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {agent.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full border border-gray-200 text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button 
                  onClick={handleStakeAccess}
                  disabled={isStaking || !ready}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
                >
                  {isStaking ? 'Staking...' : 'Stake 0.01 ETH'}
                </button>
              </div>
              
              <button 
                onClick={handleLoveAgent}
                disabled={isLoving}
                className="w-full py-4 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 hover:border-gray-300 flex items-center justify-center space-x-2"
              >
                <HeartIcon className="w-6 h-6" />
                <span>{isLoving ? 'Adding to Favorites...' : `Add to Favorites (${agent.loves.toString()})`}</span>
              </button>
            </div>
          </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto">
            {!hasAccess ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg text-center">
                <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Required</h2>
                <p className="text-gray-600 mb-6">
                  You need to stake this agent to access the chat interface and interact with it.
                </p>
                <button
                  onClick={() => setActiveTab('overview')}
                  className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  Go to Overview to Stake
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                {/* Chat Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-4">
                    <img
                      src={profile?.avatar.url}
                      alt={agent?.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-800">{agent?.name}</h3>
                      <p className="text-sm text-gray-600">AI Agent • Online</p>
                    </div>
                    <div className="ml-auto flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-gray-500">Ready to help</span>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="h-96 overflow-y-auto p-6 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Start a conversation</h3>
                      <p className="text-gray-600">Ask {agent?.name} anything related to {agent?.tags.join(', ')}</p>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              message.role === 'user'
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p>{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.role === 'user' ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isGenerating && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-2xl">
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                              </div>
                              <span className="text-sm">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Chat Input */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder={`Message ${agent?.name}...`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      disabled={isGenerating}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isGenerating}
                      className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}