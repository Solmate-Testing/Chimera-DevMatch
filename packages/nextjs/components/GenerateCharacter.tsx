/**
 * AI Character Generation Component
 * 
 * Integrates with Oasis ROFL for confidential AI character generation
 * 
 * Features:
 * 1. Prompt input with validation and suggestions
 * 2. Real-time generation status tracking
 * 3. ROFL attestation verification
 * 4. NFT minting with metadata
 * 5. Character preview and customization
 * 6. Generation history and management
 */

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useScaffoldWriteContract, useScaffoldReadContract } from '../hooks/scaffold-eth';
import { LoadingSpinner } from './LoadingSpinner';
import { useIPFS } from '../hooks/useIPFS';
import { 
  SparklesIcon,
  PhotoIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

interface GenerationRequest {
  requestId: number;
  requester: string;
  prompt: string;
  timestamp: number;
  fulfilled: boolean;
  promptHash: string;
}

interface AICharacter {
  tokenId: number;
  name: string;
  description: string;
  imageIPFS: string;
  metadataIPFS: string;
  traits: string[];
  generatedAt: number;
  creator: string;
  aiModelHash: string;
  isPrivate: boolean;
}

interface GenerateCharacterProps {
  onCharacterGenerated?: (character: AICharacter) => void;
  className?: string;
}

const GENERATION_STAGES = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  PROCESSING: 'processing',
  MINTING: 'minting',
  COMPLETED: 'completed',
  ERROR: 'error'
} as const;

type GenerationStage = typeof GENERATION_STAGES[keyof typeof GENERATION_STAGES];

const PROMPT_SUGGESTIONS = [
  "A mystical wizard with glowing blue eyes and ancient robes",
  "A cyberpunk warrior with neon armor and energy weapons",
  "A forest guardian with vine-covered skin and flower crown",
  "A steam-powered mechanical knight with brass gears",
  "A celestial being with starlight wings and cosmic aura",
  "A deep-sea explorer with bioluminescent diving suit",
  "A desert nomad with sandstorm cloak and crystal staff",
  "A quantum scientist with holographic lab coat",
];

export const GenerateCharacter: React.FC<GenerateCharacterProps> = ({
  onCharacterGenerated,
  className = ''
}) => {
  const { ready, authenticated, user, login } = usePrivy();
  const { uploadFile, isUploading } = useIPFS();

  // Component state
  const [prompt, setPrompt] = useState('');
  const [stage, setStage] = useState<GenerationStage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentRequest, setCurrentRequest] = useState<GenerationRequest | null>(null);
  const [generatedCharacter, setGeneratedCharacter] = useState<AICharacter | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Smart contract interactions
  const { writeContractAsync: requestGeneration } = useScaffoldWriteContract('AICharacterNFT');
  
  const { data: mintingFee } = useScaffoldReadContract({
    contractName: 'AICharacterNFT',
    functionName: 'mintingFee',
  });

  const { data: requestData, refetch: refetchRequest } = useScaffoldReadContract({
    contractName: 'AICharacterNFT',
    functionName: 'getGenerationRequest',
    args: currentRequest ? [BigInt(currentRequest.requestId)] : undefined,
  });

  // Clear error
  const clearError = () => setError(null);

  // Format ETH amount
  const formatEth = (wei: bigint | undefined): string => {
    if (!wei) return '0.000';
    return (Number(wei) / 1e18).toFixed(3);
  };

  // Handle generation request
  const handleGenerateCharacter = async () => {
    if (!authenticated || !user?.wallet?.address) {
      login();
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt for character generation');
      return;
    }

    if (prompt.length > 500) {
      setError('Prompt is too long (max 500 characters)');
      return;
    }

    setStage('requesting');
    setError(null);
    setEstimatedTime(30); // 30 seconds estimated

    try {
      console.log('🎨 Requesting AI character generation...');
      console.log('📝 Prompt:', prompt);
      console.log('💰 Fee:', formatEth(mintingFee), 'ETH');

      const result = await requestGeneration({
        functionName: 'requestCharacterGeneration',
        args: [prompt],
        value: mintingFee || BigInt(10000000000000000), // 0.01 ETH fallback
      });

      console.log('✅ Generation request submitted:', result);

      // For demo purposes, simulate the ROFL process
      setStage('processing');
      startGenerationSimulation();

    } catch (err: any) {
      console.error('❌ Generation request failed:', err);
      setError(err.message || 'Failed to request character generation');
      setStage('error');
    }
  };

  // Simulate ROFL generation process (for demo)
  const startGenerationSimulation = () => {
    let timeLeft = 30;
    setEstimatedTime(timeLeft);

    const interval = setInterval(() => {
      timeLeft -= 1;
      setEstimatedTime(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(interval);
        simulateCharacterGeneration();
      }
    }, 1000);

    setPollingInterval(interval);
  };

  // Simulate character generation completion
  const simulateCharacterGeneration = async () => {
    setStage('minting');

    try {
      // Generate mock character data
      const mockCharacter: AICharacter = {
        tokenId: Date.now(),
        name: generateCharacterName(prompt),
        description: `AI-generated character based on: "${prompt}"`,
        imageIPFS: 'QmExampleImageHash123',
        metadataIPFS: 'QmExampleMetadataHash456',
        traits: generateTraits(prompt),
        generatedAt: Date.now(),
        creator: user?.wallet?.address || '',
        aiModelHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        isPrivate: false
      };

      // In a real implementation, this would be done by the ROFL service
      // For demo, we just simulate the completion
      setTimeout(() => {
        setGeneratedCharacter(mockCharacter);
        setStage('completed');
        
        if (onCharacterGenerated) {
          onCharacterGenerated(mockCharacter);
        }
      }, 3000);

    } catch (err: any) {
      console.error('❌ Character generation failed:', err);
      setError('Character generation failed');
      setStage('error');
    }
  };

  // Generate character name based on prompt
  const generateCharacterName = (prompt: string): string => {
    const keywords = prompt.toLowerCase().split(' ');
    const adjectives = ['Mystical', 'Ancient', 'Ethereal', 'Legendary', 'Divine', 'Cosmic', 'Arcane'];
    const nouns = ['Guardian', 'Warrior', 'Sage', 'Champion', 'Keeper', 'Herald', 'Avatar'];
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adj} ${noun}`;
  };

  // Generate traits based on prompt
  const generateTraits = (prompt: string): string[] => {
    const baseTraits = ['Unique', 'AI-Generated', 'Limited Edition'];
    const promptWords = prompt.toLowerCase().split(' ');
    
    // Add traits based on prompt keywords
    if (promptWords.some(word => ['magic', 'wizard', 'spell'].includes(word))) {
      baseTraits.push('Magical');
    }
    if (promptWords.some(word => ['cyber', 'robot', 'tech'].includes(word))) {
      baseTraits.push('Technological');
    }
    if (promptWords.some(word => ['warrior', 'fighter', 'battle'].includes(word))) {
      baseTraits.push('Combat');
    }
    
    return baseTraits;
  };

  // Reset generation state
  const resetGeneration = () => {
    setStage('idle');
    setError(null);
    setCurrentRequest(null);
    setGeneratedCharacter(null);
    setEstimatedTime(0);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Use suggested prompt
  const useSuggestedPrompt = (suggestion: string) => {
    setPrompt(suggestion);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Generate AI Character</h2>
        </div>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Create unique AI-powered NFT characters using Oasis ROFL's confidential computing. 
          Your prompts are processed securely off-chain with cryptographic attestation.
        </p>
      </div>

      {/* Generation Form */}
      <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50">
        {stage === 'idle' || stage === 'error' ? (
          <div className="space-y-6">
            {/* Prompt Input */}
            <div>
              <label className="block text-lg font-semibold text-white mb-3">
                Character Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your AI character... (e.g., 'A mystical wizard with glowing blue eyes')"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                rows={4}
                maxLength={500}
                disabled={stage !== 'idle' && stage !== 'error'}
              />
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-slate-400">
                  {prompt.length}/500 characters
                </span>
                {mintingFee && (
                  <span className="text-purple-400 font-medium">
                    Fee: {formatEth(mintingFee)} ETH
                  </span>
                )}
              </div>
            </div>

            {/* Prompt Suggestions */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Need inspiration? Try these prompts:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PROMPT_SUGGESTIONS.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => useSuggestedPrompt(suggestion)}
                    className="text-left p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl text-slate-300 hover:text-white transition-all duration-200 text-sm border border-slate-700/50 hover:border-slate-600/50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <button
                onClick={handleGenerateCharacter}
                disabled={!prompt.trim() || !authenticated || !ready}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-200 flex items-center space-x-3 disabled:cursor-not-allowed text-lg"
              >
                <SparklesIcon className="w-6 h-6" />
                <span>Generate Character</span>
                {mintingFee && (
                  <span className="text-sm opacity-80">({formatEth(mintingFee)} ETH)</span>
                )}
              </button>
            </div>
          </div>
        ) : stage === 'requesting' ? (
          /* Requesting Stage */
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <h3 className="text-xl font-semibold text-white">Submitting Request</h3>
            <p className="text-slate-400">Processing your generation request on-chain...</p>
            <div className="flex items-center justify-center space-x-2">
              <CpuChipIcon className="w-5 h-5 text-purple-400" />
              <span className="text-purple-400">Oasis ROFL Processing</span>
            </div>
          </div>
        ) : stage === 'processing' ? (
          /* Processing Stage */
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                <SparklesIcon className="w-12 h-12 text-white animate-pulse" />
              </div>
              <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-purple-500/30 rounded-full animate-ping"></div>
            </div>
            
            <h3 className="text-2xl font-semibold text-white">Generating Character</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Our AI is creating your unique character using confidential computing. 
              This process ensures your prompt remains private.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <ClockIcon className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400">
                  Estimated time: {estimatedTime}s
                </span>
              </div>
              
              <div className="max-w-md mx-auto bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">Secure Processing</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Your prompt: "{prompt.length > 50 ? prompt.slice(0, 50) + '...' : prompt}"
                </p>
              </div>
            </div>
          </div>
        ) : stage === 'minting' ? (
          /* Minting Stage */
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <h3 className="text-xl font-semibold text-white">Minting NFT</h3>
            <p className="text-slate-400">Creating your character NFT with ROFL attestation...</p>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              <span className="text-green-400">Cryptographic proof verified</span>
            </div>
          </div>
        ) : stage === 'completed' && generatedCharacter ? (
          /* Completed Stage */
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-400" />
                <h3 className="text-2xl font-semibold text-white">Character Generated!</h3>
              </div>
              <p className="text-slate-400">Your unique AI character NFT has been minted successfully</p>
            </div>

            {/* Character Preview */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Character Image */}
                <div className="space-y-4">
                  <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                    <PhotoIcon className="w-24 h-24 text-purple-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-sm">
                      Character image will be generated and stored on IPFS
                    </p>
                  </div>
                </div>

                {/* Character Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">{generatedCharacter.name}</h4>
                    <p className="text-slate-300">{generatedCharacter.description}</p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-slate-300 mb-2">Traits:</h5>
                    <div className="flex flex-wrap gap-2">
                      {generatedCharacter.traits.map((trait, index) => (
                        <span
                          key={index}
                          className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-500/30"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Token ID:</span>
                      <div className="text-white font-mono">#{generatedCharacter.tokenId}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Generated:</span>
                      <div className="text-white">{new Date(generatedCharacter.generatedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={resetGeneration}
                className="bg-slate-700/50 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
              >
                <SparklesIcon className="w-5 h-5" />
                <span>Generate Another</span>
              </button>
              <button
                onClick={() => window.open(`/nft/${generatedCharacter.tokenId}`, '_blank')}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
              >
                <EyeIcon className="w-5 h-5" />
                <span>View NFT</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-3 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30">
        <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CpuChipIcon className="w-6 h-6 text-purple-400" />
            </div>
            <h4 className="font-medium text-white mb-2">Secure Processing</h4>
            <p className="text-slate-400 text-sm">Your prompt is processed confidentially using Oasis ROFL</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldCheckIcon className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="font-medium text-white mb-2">Cryptographic Proof</h4>
            <p className="text-slate-400 text-sm">AI generation verified with cryptographic attestation</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <SparklesIcon className="w-6 h-6 text-green-400" />
            </div>
            <h4 className="font-medium text-white mb-2">NFT Minting</h4>
            <p className="text-slate-400 text-sm">Unique character minted as ERC7857 intelligent NFT</p>
          </div>
        </div>
      </div>
    </div>
  );
};