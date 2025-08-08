/**
 * AI Inference API Route
 * 
 * REST endpoint for AI agent inference with MockSapphire access control
 * Integrates with existing Marketplace.sol and MockSapphire.sol contracts
 * 
 * Features:
 * - POST /api/infer endpoint with { agentId, prompt, userAddress }
 * - Verify access using MockSapphire.sol for private agents
 * - Mock AI responses with realistic patterns
 * - Rate limiting based on stake amount
 * - Integration with existing access control
 * - Cost calculation based on token usage
 * 
 * Target: Oasis Network (MockSapphire) + Ethereum Foundation
 * Focus: AI accessibility through micro-payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, createWalletClient, parseAbi } from 'viem';
import { sepolia } from 'viem/chains';

// Types
interface InferenceRequest {
  agentId: string;
  prompt: string;
  userAddress: string;
}

interface InferenceResponse {
  success: boolean;
  response?: string;
  error?: string;
  cost?: string;
  tokensUsed?: number;
  rateLimitRemaining?: number;
}

// Configuration
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_CONTRACT_ADDRESS as `0x${string}` || '0x1234567890123456789012345678901234567890';
const MOCK_SAPPHIRE_ADDRESS = process.env.MOCK_SAPPHIRE_CONTRACT_ADDRESS as `0x${string}` || '0x1234567890123456789012345678901234567890';

// Simplified ABIs for the functions we need
const MARKETPLACE_ABI = parseAbi([
  'function getAgent(uint256 agentId) external view returns (uint256, string, string, string[], string, address, bool, uint256, uint256, uint256)',
  'function stakes(uint256 agentId, address user) external view returns (uint256)',
  'function hasAgentAccess(uint256 agentId, address user) external view returns (bool)',
]);

const MOCK_SAPPHIRE_ABI = parseAbi([
  'function roflEnsureAuthorizedOrigin() external view returns (bool)',
  'function mockEncrypt(bytes calldata data) external pure returns (bytes)',
  'function mockDecrypt(bytes calldata encryptedData) external pure returns (bytes)',
]);

// Rate limiting in-memory store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Create Viem client
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`),
});

// Rate limiting logic
function checkRateLimit(userAddress: string, stakeAmount: bigint): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = userAddress.toLowerCase();
  const current = rateLimitStore.get(key);

  // Reset if hour has passed
  if (!current || now > current.resetTime) {
    const baseLimit = 10; // 10 requests per hour for non-stakers
    const stakeBonus = Math.floor(Number(stakeAmount) / 1e18 * 100); // 100 extra requests per ETH staked
    const limit = baseLimit + stakeBonus;
    
    rateLimitStore.set(key, { count: 1, resetTime: now + 60 * 60 * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }

  // Check if over limit
  const baseLimit = 10;
  const stakeBonus = Math.floor(Number(stakeAmount) / 1e18 * 100);
  const limit = baseLimit + stakeBonus;

  if (current.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Increment counter
  rateLimitStore.set(key, { count: current.count + 1, resetTime: current.resetTime });
  return { allowed: true, remaining: limit - current.count - 1 };
}

// Mock AI response generation
function generateMockAIResponse(agentId: string, prompt: string): { response: string; tokensUsed: number } {
  const prompts = prompt.toLowerCase();
  const baseTokens = Math.ceil(prompt.length / 4); // Rough token estimation
  const responseTokens = Math.floor(Math.random() * 200) + 50; // 50-250 tokens
  const totalTokens = baseTokens + responseTokens;

  // Different response patterns based on keywords
  let response: string;

  if (prompts.includes('trading') || prompts.includes('market') || prompts.includes('price')) {
    const trends = ['bullish', 'bearish', 'sideways', 'volatile'];
    const trend = trends[Math.floor(Math.random() * trends.length)];
    response = `AI Agent ${agentId} Analysis: Based on current market indicators, I'm seeing ${trend} patterns. My recommendation is to monitor key support/resistance levels. Market sentiment appears ${trend === 'bullish' ? 'optimistic' : trend === 'bearish' ? 'cautious' : 'mixed'}. Risk management is crucial in these conditions.`;
  } else if (prompts.includes('code') || prompts.includes('program') || prompts.includes('function')) {
    response = `AI Agent ${agentId} Code Assistant: I can help you with that! Here's my analysis: The approach you're considering would work well. Consider using proper error handling and following best practices. Would you like me to provide a specific implementation or explain any particular concept in more detail?`;
  } else if (prompts.includes('explain') || prompts.includes('how') || prompts.includes('what')) {
    response = `AI Agent ${agentId} Explanation: Great question! Let me break this down for you step by step. The key concepts to understand are interconnected, and I'll help you see the bigger picture. This relates to several important principles that affect the outcome significantly.`;
  } else if (prompts.includes('help') || prompts.includes('assist') || prompts.includes('support')) {
    response = `AI Agent ${agentId} Assistant: I'm here to help! Based on your request, I can provide detailed guidance and support. My capabilities include analysis, recommendations, and step-by-step assistance. What specific aspect would you like me to focus on first?`;
  } else {
    // Generic responses
    const responses = [
      `AI Agent ${agentId} Response: Interesting perspective! I've analyzed your input using advanced reasoning patterns. Based on my training, I'd suggest considering multiple angles to this question. The optimal approach depends on your specific context and goals.`,
      `AI Agent ${agentId} Analysis: Thank you for that query! My processing indicates several relevant factors worth considering. I recommend a systematic approach that balances efficiency with thoroughness. Would you like me to elaborate on any specific aspect?`,
      `AI Agent ${agentId} Insight: Great question! I've processed your input through my knowledge networks. The solution involves understanding the underlying principles and applying them contextually. I can provide more detailed guidance if you specify your requirements.`,
      `AI Agent ${agentId} Recommendation: Based on my analysis, I see several viable approaches. The best path forward depends on your priorities and constraints. I can help you evaluate the trade-offs and make an informed decision.`
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
  }

  return { response, tokensUsed: totalTokens };
}

// Calculate cost based on token usage
function calculateCost(tokensUsed: number): string {
  // Cost: $0.002 per 1K tokens (similar to GPT-4 pricing)
  const costUSD = (tokensUsed / 1000) * 0.002;
  const costETH = costUSD / 2000; // Assume ETH = $2000 for demo
  return `${costETH.toFixed(8)} ETH (~$${costUSD.toFixed(4)})`;
}

// Main API handler
export async function POST(request: NextRequest): Promise<NextResponse<InferenceResponse>> {
  try {
    // Parse request body
    const body: InferenceRequest = await request.json();
    const { agentId, prompt, userAddress } = body;

    // Validation
    if (!agentId || !prompt || !userAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: agentId, prompt, userAddress'
      }, { status: 400 });
    }

    if (!prompt.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Prompt cannot be empty'
      }, { status: 400 });
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user address format'
      }, { status: 400 });
    }

    console.log(`🤖 Inference request: Agent ${agentId} from ${userAddress}`);

    // Get agent data from contract
    let agentData;
    try {
      agentData = await publicClient.readContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'getAgent',
        args: [BigInt(agentId)],
      });
    } catch (error) {
      console.error('Failed to fetch agent data:', error);
      return NextResponse.json({
        success: false,
        error: 'Agent not found or contract unavailable'
      }, { status: 404 });
    }

    const [, , , , , , isPrivate] = agentData;

    // Get user's stake amount
    let stakeAmount = 0n;
    try {
      stakeAmount = await publicClient.readContract({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: 'stakes',
        args: [BigInt(agentId), userAddress as `0x${string}`],
      }) as bigint;
    } catch (error) {
      console.warn('Failed to fetch stake amount:', error);
    }

    // Check access for private agents
    if (isPrivate) {
      let hasAccess = false;
      
      // Check if user has staked (basic access control)
      if (stakeAmount > 0n) {
        hasAccess = true;
      } else {
        // Check contract-level access
        try {
          hasAccess = await publicClient.readContract({
            address: MARKETPLACE_ADDRESS,
            abi: MARKETPLACE_ABI,
            functionName: 'hasAgentAccess',
            args: [BigInt(agentId), userAddress as `0x${string}`],
          }) as boolean;
        } catch (error) {
          console.warn('Failed to check agent access:', error);
        }
      }

      if (!hasAccess) {
        return NextResponse.json({
          success: false,
          error: 'Access denied. Please stake ETH to access this private agent.'
        }, { status: 403 });
      }
    }

    // Rate limiting
    const rateLimit = checkRateLimit(userAddress, stakeAmount);
    if (!rateLimit.allowed) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Stake more ETH to increase your limit or wait for reset.',
        rateLimitRemaining: 0
      }, { status: 429 });
    }

    // MockSapphire TEE simulation (for demonstration)
    try {
      // In a real implementation, this would verify TEE execution
      const mockTEEResponse = await publicClient.readContract({
        address: MOCK_SAPPHIRE_ADDRESS,
        abi: MOCK_SAPPHIRE_ABI,
        functionName: 'roflEnsureAuthorizedOrigin',
        args: [],
      });
      
      console.log('🔐 MockSapphire TEE check:', mockTEEResponse);
    } catch (error) {
      console.warn('MockSapphire check failed (using fallback):', error);
    }

    // Generate AI response
    const { response, tokensUsed } = generateMockAIResponse(agentId, prompt);
    const cost = calculateCost(tokensUsed);

    console.log(`✅ Generated response: ${tokensUsed} tokens, cost: ${cost}`);

    return NextResponse.json({
      success: true,
      response,
      cost,
      tokensUsed,
      rateLimitRemaining: rateLimit.remaining
    });

  } catch (error) {
    console.error('Inference API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during inference'
    }, { status: 500 });
  }
}

// Handle GET requests (API documentation)
export async function GET(): Promise<NextResponse> {
  const docs = {
    name: 'Chimera DevMatch AI Inference API',
    description: 'AI agent inference with MockSapphire TEE security and stake-based access control',
    version: '1.0.0',
    endpoints: {
      'POST /api/infer': {
        description: 'Execute AI inference on an agent',
        body: {
          agentId: 'string - The agent ID to query',
          prompt: 'string - The user prompt/query',
          userAddress: 'string - User\'s Ethereum address'
        },
        responses: {
          200: 'Successful inference with AI response',
          400: 'Invalid request parameters',
          403: 'Access denied (need to stake for private agents)',
          429: 'Rate limit exceeded',
          500: 'Server error'
        }
      }
    },
    features: [
      'MockSapphire TEE protection simulation',
      'Stake-based access control',
      'Dynamic rate limiting based on stake amount',
      'Cost calculation and token usage tracking',
      'Private agent access verification'
    ],
    security: {
      'Access Control': 'Private agents require staking or explicit access grants',
      'Rate Limiting': '10 requests/hour base + 100/ETH staked',
      'TEE Protection': 'MockSapphire ROFL simulation for API key security'
    }
  };

  return NextResponse.json(docs, { status: 200 });
}