/**
 * Creator Tier Dashboard Component
 * 
 * Displays creator tier status, benefits, and marketplace analytics
 * 
 * Features:
 * 1. Current tier display with progress tracking
 * 2. Fee savings calculator
 * 3. Tier benefits comparison
 * 4. Earnings and royalty tracking
 * 5. Agent creation incentives
 * 6. Tier upgrade roadmap
 */

import React, { useState, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useScaffoldReadContract } from '../hooks/scaffold-eth';
import { LoadingSpinner } from './LoadingSpinner';
import { 
  TrophyIcon,
  StarIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  GiftIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface CreatorStats {
  totalAgentsCreated: bigint;
  totalSales: bigint;
  totalVolume: bigint;
  totalRoyaltiesEarned: bigint;
  currentTier: number;
  lastTierUpdate: bigint;
}

interface TierConfig {
  id: number;
  name: string;
  minAgents: number;
  maxAgents: number | null;
  platformFee: number;
  color: string;
  gradient: string;
  icon: React.ReactNode;
  benefits: string[];
}

const TIER_CONFIGS: TierConfig[] = [
  {
    id: 0,
    name: 'Starter Creator',
    minAgents: 0,
    maxAgents: 4,
    platformFee: 5,
    color: 'text-slate-400',
    gradient: 'from-slate-500 to-slate-600',
    icon: <StarIcon className="w-6 h-6" />,
    benefits: [
      '5% platform fee (you keep 95%)',
      'Basic creator tools',
      'Community support',
      'Standard listing features'
    ]
  },
  {
    id: 1,
    name: 'Active Creator',
    minAgents: 5,
    maxAgents: 9,
    platformFee: 4,
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-cyan-500',
    icon: <ChartBarIcon className="w-6 h-6" />,
    benefits: [
      '4% platform fee (you keep 96%)',
      'Enhanced analytics dashboard',
      'Priority customer support',
      'Featured listing opportunities',
      'Advanced pricing tools'
    ]
  },
  {
    id: 2,
    name: 'Pro Creator',
    minAgents: 10,
    maxAgents: null,
    platformFee: 3,
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-pink-500',
    icon: <TrophyIcon className="w-6 h-6" />,
    benefits: [
      '3% platform fee (you keep 97%)',
      'VIP customer support',
      'Custom creator profile page',
      'Early access to new features',
      'Dedicated account manager',
      'Marketing collaboration opportunities'
    ]
  }
];

export const CreatorTierDashboard: React.FC = () => {
  const { ready, authenticated, user } = usePrivy();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'tiers' | 'earnings'>('overview');

  // Fetch creator stats
  const { data: creatorStats, isLoading: statsLoading } = useScaffoldReadContract({
    contractName: 'EnhancedMarketplace',
    functionName: 'getCreatorStats',
    args: user?.wallet?.address ? [user.wallet.address] : undefined,
  });

  const { data: creatorFee } = useScaffoldReadContract({
    contractName: 'EnhancedMarketplace',
    functionName: 'getCreatorFee',
    args: user?.wallet?.address ? [user.wallet.address] : undefined,
  });

  // Calculate tier progress and benefits
  const tierData = useMemo(() => {
    if (!creatorStats) return null;

    const stats = creatorStats as CreatorStats;
    const agentCount = Number(stats.totalAgentsCreated);
    const currentTierConfig = TIER_CONFIGS[Number(stats.currentTier)];
    const nextTier = TIER_CONFIGS[Number(stats.currentTier) + 1];

    let progress = 0;
    let agentsNeeded = 0;

    if (nextTier) {
      const progressInCurrentTier = agentCount - currentTierConfig.minAgents;
      const tierRange = nextTier.minAgents - currentTierConfig.minAgents;
      progress = (progressInCurrentTier / tierRange) * 100;
      agentsNeeded = nextTier.minAgents - agentCount;
    } else {
      progress = 100; // Max tier reached
    }

    return {
      stats,
      agentCount,
      currentTier: currentTierConfig,
      nextTier,
      progress: Math.max(0, Math.min(100, progress)),
      agentsNeeded: Math.max(0, agentsNeeded),
      platformFeeRate: creatorFee ? Number(creatorFee) / 100 : currentTierConfig.platformFee
    };
  }, [creatorStats, creatorFee]);

  // Calculate potential savings
  const calculateSavings = (saleAmount: number) => {
    if (!tierData) return { current: 0, savings: 0 };

    const currentFee = (saleAmount * tierData.platformFeeRate) / 100;
    const tier1Fee = (saleAmount * 5) / 100;
    
    return {
      current: currentFee,
      savings: tier1Fee - currentFee
    };
  };

  const formatETH = (wei: bigint | number): string => {
    const value = typeof wei === 'bigint' ? Number(wei) / 1e18 : wei / 1e18;
    return value.toFixed(4);
  };

  if (!ready || !authenticated) {
    return (
      <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50 text-center">
        <ShieldCheckIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
        <p className="text-slate-400">Connect to view your creator tier and earnings</p>
      </div>
    );
  }

  if (statsLoading || !tierData) {
    return (
      <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="lg" />
          <span className="text-white ml-4">Loading creator data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-slate-800/60 rounded-2xl p-1 border border-slate-700/50">
          {[
            { id: 'overview', label: 'Overview', icon: <ChartBarIcon className="w-5 h-5" /> },
            { id: 'tiers', label: 'Tier System', icon: <TrophyIcon className="w-5 h-5" /> },
            { id: 'earnings', label: 'Earnings', icon: <CurrencyDollarIcon className="w-5 h-5" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Current Tier Card */}
          <div className={`bg-gradient-to-br ${tierData.currentTier.gradient}/20 backdrop-blur-sm rounded-3xl p-8 border border-${tierData.currentTier.color}/20`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 bg-gradient-to-br ${tierData.currentTier.gradient} rounded-2xl`}>
                  {tierData.currentTier.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{tierData.currentTier.name}</h2>
                  <p className={`${tierData.currentTier.color} font-medium`}>
                    {tierData.platformFeeRate}% platform fee • You keep {100 - tierData.platformFeeRate}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{tierData.agentCount}</div>
                <div className="text-slate-400 text-sm">AI Agents Created</div>
              </div>
            </div>

            {/* Progress to Next Tier */}
            {tierData.nextTier && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Progress to {tierData.nextTier.name}</span>
                  <span className="text-slate-400 text-sm">
                    {tierData.agentsNeeded} more agents needed
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full bg-gradient-to-r ${tierData.nextTier.gradient} transition-all duration-500`}
                    style={{ width: `${tierData.progress}%` }}
                  />
                </div>
                <div className="text-center">
                  <span className="text-slate-300 text-sm">
                    {Math.round(tierData.progress)}% complete
                  </span>
                </div>
              </div>
            )}

            {tierData.currentTier.id === 2 && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-purple-400">
                  <TrophyIcon className="w-5 h-5" />
                  <span className="font-medium">Maximum tier reached!</span>
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CurrencyDollarIcon className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-slate-400 text-sm">Total Sales</span>
              </div>
              <div className="text-2xl font-bold text-white">{Number(tierData.stats.totalSales)}</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <ChartBarIcon className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-slate-400 text-sm">Volume</span>
              </div>
              <div className="text-2xl font-bold text-white">{formatETH(tierData.stats.totalVolume)} ETH</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <GiftIcon className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-slate-400 text-sm">Royalties</span>
              </div>
              <div className="text-2xl font-bold text-white">{formatETH(tierData.stats.totalRoyaltiesEarned)} ETH</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <FireIcon className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-slate-400 text-sm">Fee Rate</span>
              </div>
              <div className="text-2xl font-bold text-white">{tierData.platformFeeRate}%</div>
            </div>
          </div>

          {/* Fee Savings Calculator */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <LightBulbIcon className="w-6 h-6 text-yellow-400" />
              <span>Your Tier Benefits</span>
            </h3>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-white mb-4">Fee Savings per Sale</h4>
                <div className="space-y-3">
                  {[0.1, 1, 5, 10].map((amount) => {
                    const savings = calculateSavings(amount);
                    return (
                      <div key={amount} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-slate-300">{amount} ETH sale</span>
                        <div className="text-right">
                          <div className="text-white font-medium">
                            {(savings.current).toFixed(4)} ETH fee
                          </div>
                          {savings.savings > 0 && (
                            <div className="text-green-400 text-sm">
                              Save {(savings.savings).toFixed(4)} ETH
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-4">Current Tier Benefits</h4>
                <div className="space-y-2">
                  {tierData.currentTier.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-slate-300 text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tier System Tab */}
      {selectedTab === 'tiers' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Creator Tier System</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Create more AI agents to unlock lower platform fees and exclusive benefits
            </p>
          </div>

          <div className="grid gap-6">
            {TIER_CONFIGS.map((tier, index) => {
              const isCurrentTier = tier.id === tierData.currentTier.id;
              const isUnlocked = tier.id <= tierData.currentTier.id;
              
              return (
                <div
                  key={tier.id}
                  className={`relative bg-gradient-to-br backdrop-blur-sm rounded-3xl p-8 border transition-all duration-300 ${
                    isCurrentTier
                      ? `${tier.gradient}/20 border-purple-500/50 ring-2 ring-purple-500/30`
                      : isUnlocked
                      ? `from-slate-800/60 to-slate-900/60 border-slate-700/50`
                      : `from-slate-800/30 to-slate-900/30 border-slate-700/30 opacity-60`
                  }`}
                >
                  {isCurrentTier && (
                    <div className="absolute -top-3 left-8">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
                        <StarIcon className="w-4 h-4" />
                        <span>Current Tier</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 bg-gradient-to-br ${tier.gradient} rounded-2xl`}>
                        {tier.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                        <p className="text-slate-400">
                          {tier.minAgents}{tier.maxAgents ? `-${tier.maxAgents}` : '+'} agents required
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{tier.platformFee}%</div>
                      <div className="text-slate-400 text-sm">platform fee</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-white mb-3">Benefits</h4>
                      <div className="space-y-2">
                        {tier.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              isUnlocked ? 'bg-green-400' : 'bg-slate-500'
                            }`}></div>
                            <span className={`text-sm ${
                              isUnlocked ? 'text-slate-300' : 'text-slate-500'
                            }`}>
                              {benefit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-3">Fee Structure</h4>
                      <div className="space-y-2">
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Platform takes:</span>
                            <span className="text-red-400 font-medium">{tier.platformFee}%</span>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-slate-400">You keep:</span>
                            <span className="text-green-400 font-medium">{100 - tier.platformFee}%</span>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Royalties (secondary):</span>
                            <span className="text-blue-400 font-medium">2.5%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Earnings Tab */}
      {selectedTab === 'earnings' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Earnings Overview</h2>
            <p className="text-slate-400">Track your marketplace performance and tier benefits</p>
          </div>

          {/* Earnings Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <CurrencyDollarIcon className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Total Earnings</h3>
                  <p className="text-green-400 text-sm">From sales</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {formatETH(tierData.stats.totalVolume * BigInt(100 - tierData.platformFeeRate) / BigInt(100))} ETH
              </div>
              <div className="text-green-400 text-sm">
                After {tierData.platformFeeRate}% platform fee
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <GiftIcon className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Royalties</h3>
                  <p className="text-purple-400 text-sm">From secondary sales</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {formatETH(tierData.stats.totalRoyaltiesEarned)} ETH
              </div>
              <div className="text-purple-400 text-sm">
                2.5% on secondary sales
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <ArrowUpIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Potential Savings</h3>
                  <p className="text-blue-400 text-sm">vs Tier 1 rates</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {formatETH(tierData.stats.totalVolume * BigInt(5 - tierData.platformFeeRate) / BigInt(100))} ETH
              </div>
              <div className="text-blue-400 text-sm">
                Saved through tier benefits
              </div>
            </div>
          </div>

          {/* Tier Progress Incentive */}
          {tierData.nextTier && (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Upgrade to {tierData.nextTier.name}</h3>
                <p className="text-slate-400">Create {tierData.agentsNeeded} more agents to unlock better rates</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-white mb-4">Current Benefits</h4>
                  <div className="space-y-2">
                    {tierData.currentTier.benefits.slice(0, 3).map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-slate-300 text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-4">Next Tier Benefits</h4>
                  <div className="space-y-2">
                    {tierData.nextTier.benefits.slice(0, 3).map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        <span className="text-slate-300 text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <div className="text-2xl font-bold text-white mb-2">
                  Potential Additional Earnings
                </div>
                <p className="text-slate-400 mb-4">
                  If you had {tierData.nextTier.name} rates on your current volume
                </p>
                <div className="text-3xl font-bold text-purple-400">
                  +{formatETH(tierData.stats.totalVolume * BigInt(tierData.platformFeeRate - tierData.nextTier.platformFee) / BigInt(100))} ETH
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};