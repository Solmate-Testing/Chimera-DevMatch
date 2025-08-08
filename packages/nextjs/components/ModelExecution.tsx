"use client";

/**
 * ModelExecution Component
 * 
 * Implements TEE-protected AI model execution via Chainlink Functions with gasless transactions.
 * Features secure API key management and real-time result polling.
 * 
 * Key Features:
 * - TEE-protected API key handling via Oasis ROFL-Sapphire
 * - Chainlink Functions for decentralized AI model execution
 * - Gasless transactions via ERC-4337 + Biconomy Paymaster
 * - Real-time result polling and display
 * - Mock result generation for demo purposes
 * 
 * Security:
 * - API keys never exposed - decrypted only within TEE
 * - All transactions are gasless for users
 * - Chainlink DON provides decentralized execution
 * 
 * @component
 * @example
 * ```tsx
 * <ModelExecution 
 *   product={product}
 *   userStake="1000000000000000000" // 1 ETH in wei
 * />
 * ```
 * 
 * @author Senior AI/Blockchain Engineer
 */

import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import { usePrivyWagmiConnector } from '../hooks/usePrivyWagmiConnector';
import { encodeFunctionData } from 'viem';
import { marketplaceABI } from '../contracts/generated';

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}` || '0x1234567890123456789012345678901234567890';

/**
 * Product interface for AI model information
 */
interface Product {
  /** Unique product identifier from smart contract */
  id: string;
  /** Human-readable name of the AI model/service */
  name: string;
  /** Product category: AI Agent, MCP, Copy Trading Bot */
  category: string;
  /** Address of the product creator */
  creator: string;
  /** Detailed description of functionality */
  description: string;
}

/**
 * Props for the ModelExecution component
 */
interface ModelExecutionProps {
  /** Product information for model execution */
  product: Product;
  /** User's current stake amount in wei (required for access) */
  userStake: string;
}

/**
 * ModelExecution component for executing AI models via Chainlink Functions
 * 
 * @param props - The component props containing product and user stake info
 * @returns JSX element for AI model execution interface
 */
export const ModelExecution: FC<ModelExecutionProps> = ({ product, userStake }) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [executionCount, setExecutionCount] = useState(0);
  
  const { sendGaslessTransaction, isConnected } = usePrivyWagmiConnector();
  
  const canUseModel = parseFloat(userStake) > 0;

  /**
   * Effect to poll for model execution results after request is submitted
   * Simulates real-time result fetching from Chainlink DON
   */
  useEffect(() => {
    if (requestId && !result) {
      const pollInterval = setInterval(async () => {
        try {
          // In production, query the contract for result
          // For demo, simulate result after delay
          setTimeout(() => {
            setResult(generateMockResult());
            setLoading(false);
            clearInterval(pollInterval);
          }, 5000);
        } catch (error) {
          console.error('Error polling for result:', error);
        }
      }, 2000);
      
      return () => clearInterval(pollInterval);
    }
  }, [requestId, result]);

  /**
   * Generates mock AI model results for demo purposes
   * In production, this would be actual AI model outputs from Chainlink Functions
   * 
   * @returns Formatted mock result string based on product type
   */
  const generateMockResult = (): string => {
    const responses = {
      "GPT-4 Trading Bot": `📈 Trading Analysis for: "${input}"
      
Market Signal: BUY
Confidence: 87%

Technical Analysis:
- RSI: 42 (neutral)  
- MACD: Bullish crossover
- Support: $42,150
- Resistance: $45,200

Recommendation: Long position with 2% risk
Entry: $43,500
Stop Loss: $42,000
Take Profit: $46,000

🔐 Secured by Oasis TEE
⚡ Gasless execution via Biconomy`,

      "Claude AI Assistant": `🧠 AI Response to: "${input}"

Analysis: Your query involves complex reasoning. Here's my assessment:

Key Points:
1. Smart contract integration enables trustless AI execution
2. TEE protection ensures API key security  
3. Gasless transactions improve user experience

📊 Confidence Score: 94%
⚡ Processing Time: 2.3s
🔐 TEE-protected execution`,

      default: `🤖 AI Response to: "${input}"

Processing your request using ${product.name}...

✅ Successfully processed
🔐 API key protected by Oasis TEE
⚡ Gasless transaction execution
⛓️ Chainlink DON verification

Timestamp: ${new Date().toISOString()}`
    };

    return responses[product.name as keyof typeof responses] || responses.default;
  };

  /**
   * Handles AI model execution via gasless Chainlink Functions transaction
   * 
   * Process:
   * 1. Validates user has staked (access control)
   * 2. Prepares gasless transaction data
   * 3. Sends transaction via Biconomy Paymaster
   * 4. Initiates result polling
   * 
   * @async
   */
  const handleExecuteModel = async (): Promise<void> => {
    if (!canUseModel) {
      alert('⚠️ Please stake ETH first to use this AI model');
      return;
    }

    if (!input.trim()) {
      alert('Please enter your input/prompt');
      return;
    }

    try {
      setLoading(true);
      setResult('');
      
      console.log('🤖 EXECUTING AI MODEL (CHAINLINK FUNCTIONS)');
      console.log(`   📦 Product: ${product.name}`);
      console.log(`   📝 Input: ${input}`);
      console.log('   🔐 TEE Protection: Enabled');
      console.log('   ⚡ Gasless: Enabled');

      // ✅ PREPARE GASLESS CHAINLINK FUNCTIONS CALL
      const callData = encodeFunctionData({
        abi: marketplaceABI,
        functionName: 'runModel',
        args: [BigInt(product.id), input]
      });

      // ✅ SEND GASLESS TRANSACTION
      const txResult = await sendGaslessTransaction({
        to: MARKETPLACE_ADDRESS,
        data: callData
      });

      if (txResult) {
        // ✅ SIMULATE REQUEST ID (in production, extract from logs)
        const mockRequestId = `0x${Math.random().toString(16).substring(2, 18)}`;
        setRequestId(mockRequestId);
        setExecutionCount(prev => prev + 1);
        
        console.log('✅ Model execution request sent');
        console.log(`📋 Request ID: ${mockRequestId}`);
        console.log('⏳ Waiting for Chainlink DON response...');
        
        // Result will be set by polling useEffect
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error) {
      console.error('Model execution failed:', error);
      setLoading(false);
      alert('❌ Model execution failed. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">
          🤖 AI Model: {product.name}
        </h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${canUseModel ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{canUseModel ? 'Access Granted' : 'Stake Required'}</span>
          </div>
          <div>Executions: {executionCount}</div>
        </div>
      </div>

      {/* ✅ INPUT SECTION */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Input / Prompt:
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder={`Enter your prompt for ${product.name}...`}
          disabled={!canUseModel || loading}
        />
      </div>

      {/* ✅ EXECUTION BUTTON */}
      <button
        onClick={handleExecuteModel}
        disabled={!canUseModel || loading || !input.trim()}
        className={`w-full py-3 px-4 rounded-lg font-medium ${
          canUseModel && !loading
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
            🔄 Executing via Chainlink DON...
          </span>
        ) : (
          '🚀 Execute Model (Gasless)'
        )}
      </button>

      {/* ✅ LOADING STATE */}
      {loading && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-700">
            <div className="animate-pulse">⚡</div>
            <span className="text-sm">
              Processing via Chainlink Functions... Request ID: {requestId}
            </span>
          </div>
          <div className="text-xs text-blue-600 mt-2">
            🔐 API keys secured by Oasis TEE • ⛽ Gas sponsored by Paymaster
          </div>
        </div>
      )}

      {/* ✅ RESULT SECTION */}
      {result && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-3 flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            AI Model Result
          </h4>
          <div className="bg-gray-50 border rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-800">
              {result}
            </pre>
          </div>
          <div className="text-xs text-gray-500 mt-2 flex items-center space-x-4">
            <span>🔗 Request ID: {requestId}</span>
            <span>⚡ Gasless Execution</span>
            <span>🔐 TEE-Protected</span>
          </div>
        </div>
      )}

      {/* ✅ SECURITY FEATURES */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
        <h5 className="font-semibold text-sm mb-2">🛡️ Security Features</h5>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            API Key TEE Protection
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Chainlink DON Verification
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Gasless Execution
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Result Immutability
          </div>
        </div>
      </div>
    </div>
  );
}