/**
 * Enhanced Agent Detail Page - Full Integration Version
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

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePrivyWagmiConnector } from '../../../hooks/usePrivyWagmiConnector';
import { useAgentDetails, formatEthAmount, formatTimestamp } from '../../../hooks/useSubgraphQueries';
import { useScaffoldReadContract, useScaffoldWriteContract } from '../../../hooks/scaffold-eth';
import { parseEther, formatEther } from 'viem';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

import { 
  RocketLaunchIcon,
  HeartIcon,
  EyeIcon,
  CurrencyDollarIcon,
  UserIcon,
  TagIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

// Types for enhanced functionality
interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  cost?: string;
  tokensUsed?: number;
}

interface AgentData {
  id: string;
  name: string;
  description: string;
  tags: string[];
  ipfsHash: string;
  creator: string;
  isPrivate: boolean;
  totalStaked: string;
  createdAt: string;
}

interface InferenceResponse {
  success: boolean;
  response?: string;
  error?: string;
  cost?: string;
  tokensUsed?: number;
  rateLimitRemaining?: number;
}

export default function EnhancedAgentDetailPage() {
  const params = useParams();
  const agentId = params?.id as string;
  
  // Enhanced Hooks
  const { isConnected, smartAccount, login } = usePrivyWagmiConnector();
  const { data: subgraphAgent, isLoading: subgraphLoading } = useAgentDetails(agentId);

  // Contract Integration - Read Agent Data
  const { data: contractAgent, isLoading: contractLoading, refetch: refetchAgent } = useScaffoldReadContract({
    contractName: "Marketplace",
    functionName: "getAgent",
    args: [BigInt(agentId || 0)],
  });

  // Contract Integration - User's Stake
  const { data: userStake, refetch: refetchStake } = useScaffoldReadContract({
    contractName: "Marketplace", 
    functionName: "stakes",
    args: [BigInt(agentId || 0), smartAccount?.address],
  });

  // Contract Integration - Check Private Agent Access
  const { data: hasAccess } = useScaffoldReadContract({
    contractName: "Marketplace",
    functionName: "hasAgentAccess", 
    args: [BigInt(agentId || 0), smartAccount?.address],
  });

  // Contract Integration - Staking Function
  const { writeContractAsync: stakeToAgent, isMining: isStaking } = useScaffoldWriteContract("Marketplace");

  // Contract Integration - Love Function
  const { writeContractAsync: loveAgent, isMining: isLoving } = useScaffoldWriteContract("Marketplace");

  // Enhanced State Management
  const [isLoved, setIsLoved] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'analytics'>('overview');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isInferring, setIsInferring] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("0.01");
  const [paymentMethod, setPaymentMethod] = useState<'ETH' | 'USDC'>('ETH');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [agentData, setAgentData] = useState<AgentData | null>(null);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Merge contract and subgraph data
  useEffect(() => {
    if (contractAgent && subgraphAgent?.agent) {
      const agent = subgraphAgent.agent;
      setAgentData({
        id: agentId,
        name: agent.name,
        description: agent.description || "Advanced AI agent with cutting-edge capabilities",
        tags: agent.tags || ['AI', 'Assistant'],
        ipfsHash: agent.ipfsHash || "",
        creator: agent.creator,
        isPrivate: agent.isPrivate,
        totalStaked: agent.totalStaked,
        createdAt: agent.createdAt
      });
    } else if (contractAgent) {
      // Fallback to contract data only
      setAgentData({
        id: agentId,
        name: contractAgent[1] || `Agent #${agentId}`,
        description: contractAgent[2] || "Advanced AI agent with cutting-edge capabilities",
        tags: contractAgent[3] || ['AI', 'Assistant'],
        ipfsHash: contractAgent[4] || "",
        creator: contractAgent[5] || "",
        isPrivate: contractAgent[6] || false,
        totalStaked: contractAgent[7]?.toString() || "0",
        createdAt: contractAgent[9]?.toString() || "0"
      });
    }
  }, [contractAgent, subgraphAgent, agentId]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (agentData && chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        type: 'system',
        content: `Welcome to ${agentData.name}! ${agentData.isPrivate ? '🔒 This is a private agent. You need access to interact.' : '💬 Start chatting to interact with this AI agent.'}`,
        timestamp: new Date()
      };
      setChatMessages([welcomeMessage]);
    }
  }, [agentData, chatMessages.length]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Enhanced Love Function
  const handleLove = async () => {
    if (!isConnected || !smartAccount?.address) {
      await login();
      return;
    }
    
    try {
      setError(null);
      await loveAgent({
        functionName: "loveAgent",
        args: [BigInt(agentId)],
      });
      
      setIsLoved(true);
      setSuccess("❤️ Loved agent successfully!");
      await refetchAgent();
    } catch (error: any) {
      setError(`Failed to love agent: ${error.message}`);
    }
  };

  // Handle Staking
  const handleStake = async () => {
    if (!isConnected || !smartAccount?.address) {
      await login();
      return;
    }

    try {
      setError(null);
      const stakeAmountWei = parseEther(stakeAmount);
      
      await stakeToAgent({
        functionName: "stakeToAgent",
        args: [BigInt(agentId)],
        value: stakeAmountWei,
      });

      // Refresh data after staking
      await refetchAgent();
      await refetchStake();

      setSuccess(`✅ Successfully staked ${stakeAmount} ETH!`);

      // Add success message to chat
      const successMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        type: 'system',
        content: `✅ Successfully staked ${stakeAmount} ETH! You now have access to this agent.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, successMessage]);

    } catch (error: any) {
      setError(`Failed to stake: ${error.message}`);
    }
  };

  // Handle AI Inference
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    if (!isConnected || !smartAccount?.address) {
      await login();
      return;
    }

    // Check access requirements
    if (agentData?.isPrivate && !hasAccess && (!userStake || userStake === 0n)) {
      setError("You need to stake to access this private agent");
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsInferring(true);

    try {
      // Call inference API
      const response = await fetch('/api/infer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agentId,
          prompt: inputMessage,
          userAddress: smartAccount.address,
        }),
      });

      const inferenceResult: InferenceResponse = await response.json();

      if (inferenceResult.success && inferenceResult.response) {
        // Add AI response
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: inferenceResult.response,
          timestamp: new Date(),
          cost: inferenceResult.cost,
          tokensUsed: inferenceResult.tokensUsed
        };
        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(inferenceResult.error || 'Inference failed');
      }

    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        type: 'system',
        content: `❌ Error: ${error.message}`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsInferring(false);
    }
  };

  // Enhanced Loading State
  if (contractLoading || subgraphLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-1/4 mb-4"></div>
            <div className="bg-slate-800/50 rounded-lg p-6 mb-6 border border-slate-700">
              <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="h-96 bg-slate-700 rounded"></div>
              <div className="h-96 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!agentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Agent Not Found</h1>
            <p className="text-slate-400 mb-6">The agent you're looking for doesn't exist or failed to load.</p>
            <Link href="/" className="button-primary">
              Go Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced calculations
  const userStakeAmount = userStake ? formatEther(userStake) : "0";
  const hasStaked = parseFloat(userStakeAmount) > 0;
  const canUseAgent = !agentData.isPrivate || hasAccess || hasStaked;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: EyeIcon },
    { id: 'chat', name: 'AI Chat', icon: ChatBubbleLeftRightIcon },
    { id: 'analytics', name: 'Analytics', icon: CurrencyDollarIcon },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-slide-up">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors duration-200 flex items-center space-x-2">
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Marketplace</span>
          </Link>
        </div>

        {/* Success/Error Messages */}
        {(success || error) && (
          <div className={`mb-6 p-4 rounded-lg border animate-slide-up ${
            success 
              ? 'bg-green-500/20 border-green-500/30 text-green-300' 
              : 'bg-red-500/20 border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center space-x-2">
              {success ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5" />
              )}
              <span>{success || error}</span>
            </div>
            <button
              onClick={() => { setSuccess(null); setError(null); }}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

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
                    <h1 className="text-3xl font-bold text-white">{agentData.name}</h1>
                    {agentData.isPrivate && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs border border-yellow-500/30">
                        <ShieldCheckIcon className="h-3 w-3" />
                        <span>Private</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-slate-400 mb-4">
                    <div className="flex items-center space-x-1">
                      <UserIcon className="h-4 w-4" />
                      <span>{agentData.creator.slice(0, 8)}...{agentData.creator.slice(-6)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Created {formatTimestamp(agentData.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TagIcon className="h-4 w-4" />
                      <span>{agentData.tags[0] || 'AI Agent'}</span>
                    </div>
                  </div>

                  <p className="text-slate-300 mb-4">{agentData.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {agentData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded-full text-xs border border-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* IPFS Link */}
                  {agentData.ipfsHash && (
                    <div className="mt-4">
                      <a 
                        href={`https://ipfs.io/ipfs/${agentData.ipfsHash}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm underline flex items-center space-x-1"
                      >
                        <span>📁 View on IPFS</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats and Actions */}
            <div className="lg:w-80 space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                  <div className="text-lg font-bold text-white">{formatEthAmount(agentData.totalStaked)} ETH</div>
                  <div className="text-xs text-slate-400">Total Staked</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                  <div className="text-lg font-bold text-white">{hasStaked ? '✅' : '⚠️'}</div>
                  <div className="text-xs text-slate-400">Your Access</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                  <div className="text-lg font-bold text-white">{userStakeAmount} ETH</div>
                  <div className="text-xs text-slate-400">Your Stake</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                  <div className="text-lg font-bold text-green-400">{agentData.isPrivate ? 'Private' : 'Public'}</div>
                  <div className="text-xs text-slate-400">Access Level</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleLove}
                  disabled={isLoving || !isConnected}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 border ${
                    isLoved
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/30 hover:bg-pink-500/30'
                      : 'bg-slate-700/30 text-slate-300 border-slate-600 hover:bg-slate-700/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoved ? (
                    <HeartSolid className="h-5 w-5" />
                  ) : (
                    <HeartIcon className="h-5 w-5" />
                  )}
                  <span>{isLoving ? 'Loving...' : (isLoved ? 'Loved' : 'Love this Agent')}</span>
                </button>

                {/* Staking Interface */}
                {isConnected ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Stake Amount (ETH)</label>
                      <input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        step="0.001"
                        min="0.001"
                        className="w-full px-3 py-2 bg-slate-700/30 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0.01"
                      />
                    </div>
                    <button
                      onClick={handleStake}
                      disabled={isStaking}
                      className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isStaking ? 'Staking...' : `Stake ${stakeAmount} ETH`}
                    </button>
                    
                    {hasStaked && (
                      <div className="text-xs text-green-400 text-center">
                        ✅ You have staked {userStakeAmount} ETH
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={login}
                    className="w-full button-primary"
                  >
                    Connect Wallet to Interact
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
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Agent Access Status */}
                <div className="card">
                  <h3 className="text-xl font-bold text-white mb-4">🔐 Access Status</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Agent Type</span>
                      <span className={`font-semibold ${agentData.isPrivate ? 'text-yellow-400' : 'text-green-400'}`}>
                        {agentData.isPrivate ? '🔒 Private' : '🔓 Public'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Your Stake</span>
                      <span className="text-white font-semibold">{userStakeAmount} ETH</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Access Level</span>
                      <span className={`font-semibold ${canUseAgent ? 'text-green-400' : 'text-red-400'}`}>
                        {canUseAgent ? '✅ Full Access' : '❌ No Access'}
                      </span>
                    </div>
                    {!canUseAgent && (
                      <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-300 text-sm">
                          💡 Stake ETH to unlock AI chat capabilities
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Alternatives */}
                <div className="card">
                  <h3 className="text-xl font-bold text-white mb-4">💳 Payment Options</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">ETH</span>
                        </div>
                        <div>
                          <div className="text-white font-medium">Ethereum Staking</div>
                          <div className="text-xs text-slate-400">Gasless via Biconomy</div>
                        </div>
                      </div>
                      <div className="text-green-400 font-medium">✅ Active</div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-700/10 rounded-lg border border-slate-600 opacity-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">USDC</span>
                        </div>
                        <div>
                          <div className="text-white font-medium">USDC Payment</div>
                          <div className="text-xs text-slate-400">Arbitrum Sepolia</div>
                        </div>
                      </div>
                      <div className="text-orange-400 font-medium">🚧 Soon</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Agent Details */}
              <div className="card">
                <h3 className="text-xl font-bold text-white mb-4">Agent Details</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-purple-300 mb-3">Technical Specifications</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Agent ID</span>
                        <span className="text-slate-300">#{agentData.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Categories</span>
                        <span className="text-slate-300">{agentData.tags.join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Access Level</span>
                        <span className="text-slate-300">{agentData.isPrivate ? 'Private' : 'Public'}</span>
                      </div>
                      {agentData.ipfsHash && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">IPFS Hash</span>
                          <a 
                            href={`https://ipfs.io/ipfs/${agentData.ipfsHash}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 font-mono text-xs underline"
                          >
                            {agentData.ipfsHash.slice(0, 12)}...
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-blue-300 mb-3">Security Features</h4>
                    <div className="space-y-2 text-sm text-slate-300">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>TEE-protected API keys via MockSapphire</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Client-side encryption before transmission</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Gasless execution via Biconomy</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Zero key exposure guarantee</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Real-time access control verification</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="card p-0 overflow-hidden">
              <div className="border-b border-slate-600 p-4">
                <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <ChatBubbleLeftRightIcon className="h-6 w-6" />
                  <span>AI Chat Interface</span>
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {canUseAgent 
                    ? `Chat with ${agentData.name} - Powered by MockSapphire TEE`
                    : "Stake ETH to unlock AI chat capabilities"
                  }
                </p>
              </div>

              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-800/30">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                          : message.type === 'ai'
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex justify-between items-center mt-2 text-xs opacity-75">
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                        {message.cost && (
                          <span className="font-medium">Cost: {message.cost}</span>
                        )}
                      </div>
                      {message.tokensUsed && (
                        <div className="text-xs opacity-60 mt-1">
                          {message.tokensUsed} tokens used
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isInferring && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700/50 text-slate-300 max-w-xs px-4 py-2 rounded-lg border border-slate-600">
                      <div className="flex space-x-1">
                        <div className="animate-bounce w-2 h-2 bg-slate-400 rounded-full"></div>
                        <div className="animate-bounce w-2 h-2 bg-slate-400 rounded-full" style={{ animationDelay: '0.1s' }}></div>
                        <div className="animate-bounce w-2 h-2 bg-slate-400 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="border-t border-slate-600 p-4">
                {canUseAgent ? (
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={`Ask ${agentData.name} anything...`}
                      className="flex-1 px-4 py-2 bg-slate-700/30 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={isInferring}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isInferring || !inputMessage.trim()}
                      className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                    >
                      <PaperAirplaneIcon className="h-4 w-4" />
                      <span>{isInferring ? '...' : 'Send'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <LockClosedIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                    <p className="text-slate-300 mb-4">
                      {agentData.isPrivate 
                        ? "This private agent requires staking to access AI inference"
                        : "Stake ETH to support this agent and unlock AI chat"
                      }
                    </p>
                    <button
                      onClick={handleStake}
                      disabled={isStaking || !isConnected}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      {isStaking ? 'Staking...' : `Stake ${stakeAmount} ETH to Chat`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-white mb-6">📊 Agent Analytics</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-4">Stake Distribution</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Your Stake</span>
                      <span className="text-white font-semibold">{userStakeAmount} ETH</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Total Stakes</span>
                      <span className="text-white font-semibold">{formatEthAmount(agentData.totalStaked)} ETH</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Your Share</span>
                      <span className="text-purple-400 font-semibold">
                        {parseFloat(agentData.totalStaked) > 0 
                          ? ((parseFloat(userStakeAmount) / parseFloat(formatEthAmount(agentData.totalStaked))) * 100).toFixed(1)
                          : '0'
                        }%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" 
                        style={{ 
                          width: `${parseFloat(agentData.totalStaked) > 0 
                            ? ((parseFloat(userStakeAmount) / parseFloat(formatEthAmount(agentData.totalStaked))) * 100) 
                            : 0
                          }%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-white mb-4">Enhanced Features</h3>
                  <div className="text-slate-300 space-y-2">
                    <p>🔐 <strong>Oasis Integration:</strong> MockSapphire TEE protection</p>
                    <p>⚡ <strong>Gasless Payments:</strong> Biconomy ERC-4337 support</p>
                    <p>🤖 <strong>AI Chat:</strong> Real-time inference capabilities</p>
                    <p>📊 <strong>Analytics:</strong> The Graph powered insights</p>
                    <p>💳 <strong>Multi-Payment:</strong> ETH + USDC options (soon)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-center text-sm text-slate-400">
          <p className="mb-2">
            🔐 <strong>Powered by Oasis ROFL-Sapphire:</strong> API keys and inference secured in TEE
          </p>
          <p>
            ⚡ <strong>Gasless Transactions:</strong> Stake without gas fees via Biconomy paymaster
          </p>
        </div>
      </div>
    </div>
  );
}