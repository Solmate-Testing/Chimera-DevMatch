/**
 * API Key Generation for Chimera DevMatch
 * 
 * Supports multiple key generation strategies for different agent types:
 * 1. User-provided keys (for real AI services)
 * 2. Auto-generated demo keys (for hackathon demo)
 * 3. RANDAO-based secure random keys (for production)
 */

import { keccak256, encodePacked, toHex } from 'viem';

export type ApiKeyType = 'user-provided' | 'demo-generated' | 'randao-secure';

export interface ApiKeyConfig {
  type: ApiKeyType;
  service?: 'openai' | 'anthropic' | 'huggingface' | 'replicate' | 'custom';
  userKey?: string;
}

/**
 * Generate demo API keys for hackathon purposes
 * These look realistic but are for demonstration only
 */
export const generateDemoApiKey = (
  agentName: string, 
  creator: string, 
  service: string = 'openai'
): string => {
  const seed = `${agentName}-${creator}-${Date.now()}`;
  const hash = keccak256(encodePacked(['string'], [seed]));
  
  // Format like real API keys
  const prefixes = {
    openai: 'sk-',
    anthropic: 'sk-ant-',
    huggingface: 'hf_',
    replicate: 'r8_',
    custom: 'ck_'
  };
  
  const prefix = prefixes[service as keyof typeof prefixes] || 'demo_';
  const keyBody = hash.slice(2, 50); // Use first 48 chars of hash
  
  return `${prefix}${keyBody}`;
};

/**
 * Generate secure random API keys using on-chain randomness
 * This would integrate with RANDAO or VRF for true randomness
 */
export const generateSecureApiKey = async (
  agentId: bigint,
  blockNumber: bigint,
  service: string = 'custom'
): Promise<string> => {
  // In production, this would call RANDAO or Chainlink VRF
  // For now, simulate with crypto.getRandomValues
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  
  const randomHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  const prefixes = {
    openai: 'sk-',
    anthropic: 'sk-ant-',
    huggingface: 'hf_',
    replicate: 'r8_',
    custom: 'rnd_'
  };
  
  const prefix = prefixes[service as keyof typeof prefixes] || 'sec_';
  return `${prefix}${randomHex.slice(0, 48)}`;
};

/**
 * Validate API key format
 */
export const validateApiKey = (key: string, service?: string): boolean => {
  if (!key || key.length < 10) return false;
  
  const patterns = {
    openai: /^sk-[A-Za-z0-9]{48,}$/,
    anthropic: /^sk-ant-[A-Za-z0-9-_]{95,}$/,
    huggingface: /^hf_[A-Za-z0-9]{37}$/,
    replicate: /^r8_[A-Za-z0-9]{40}$/,
    demo: /^demo_[A-Za-z0-9]{40,}$/,
    custom: /^[a-zA-Z0-9_-]{10,}$/
  };
  
  if (service && patterns[service as keyof typeof patterns]) {
    return patterns[service as keyof typeof patterns].test(key);
  }
  
  // General validation - at least 10 chars, alphanumeric with common prefixes
  return /^(sk-|sk-ant-|hf_|r8_|demo_|ck_|rnd_|sec_)[A-Za-z0-9_-]{10,}$/.test(key);
};

/**
 * Get service type from API key prefix
 */
export const detectServiceFromKey = (key: string): string => {
  if (key.startsWith('sk-ant-')) return 'anthropic';
  if (key.startsWith('sk-')) return 'openai';
  if (key.startsWith('hf_')) return 'huggingface';
  if (key.startsWith('r8_')) return 'replicate';
  if (key.startsWith('demo_')) return 'demo';
  if (key.startsWith('rnd_') || key.startsWith('sec_')) return 'secure';
  return 'custom';
};

/**
 * Main API key processing function
 * Handles all key generation strategies
 */
export const processApiKey = async (
  config: ApiKeyConfig,
  agentName: string,
  creator: string,
  agentId?: bigint
): Promise<string> => {
  switch (config.type) {
    case 'user-provided':
      if (!config.userKey) {
        throw new Error('User-provided key is required');
      }
      if (!validateApiKey(config.userKey, config.service)) {
        throw new Error('Invalid API key format');
      }
      return config.userKey;
      
    case 'demo-generated':
      return generateDemoApiKey(agentName, creator, config.service);
      
    case 'randao-secure':
      if (!agentId) {
        throw new Error('Agent ID required for secure key generation');
      }
      return generateSecureApiKey(agentId, BigInt(Date.now()), config.service);
      
    default:
      throw new Error('Invalid API key type');
  }
};

/**
 * Demo presets for common AI services
 */
export const DEMO_API_PRESETS = {
  'GPT-4 Assistant': {
    service: 'openai' as const,
    description: 'OpenAI GPT-4 API for advanced language tasks',
    exampleKey: 'sk-abc123...xyz789'
  },
  'Claude Assistant': {
    service: 'anthropic' as const,
    description: 'Anthropic Claude API for reasoning and analysis',
    exampleKey: 'sk-ant-api03-abc123...xyz789'
  },
  'Hugging Face Model': {
    service: 'huggingface' as const,
    description: 'Hugging Face API for open-source models',
    exampleKey: 'hf_abc123xyz789...'
  },
  'Custom Trading Bot': {
    service: 'custom' as const,
    description: 'Custom API for proprietary trading algorithms',
    exampleKey: 'ck_custom123...'
  }
} as const;