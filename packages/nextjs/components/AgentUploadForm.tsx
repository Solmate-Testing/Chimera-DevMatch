"use client";

/**
 * AgentUploadForm Component
 * 
 * Enhanced agent upload system integrating with Marketplace.sol createAgent function
 * Features: File upload, IPFS integration, API key encryption, form validation,
 * gasless transactions, and comprehensive error handling for Web3 beginners.
 * 
 * @component
 */

import React, { useState, useCallback, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAgentContract } from '../hooks/useAgentContract';
import { uploadToIPFS, type UploadProgress } from '../utils/web3Storage';
import { LoadingSpinner, ButtonLoading } from './LoadingSpinner';
import { ErrorMessage, Web3ErrorMessage } from './ErrorMessage';
import { TransactionStatus } from './TransactionStatus';
import { 
  processApiKey, 
  validateApiKey, 
  detectServiceFromKey,
  DEMO_API_PRESETS,
  type ApiKeyConfig 
} from '../utils/apiKeyGenerator';
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { cn } from '../utils/cn';

// Types
interface AgentFormData {
  name: string;
  description: string;
  tags: string[];
  apiKey: string;
  apiKeyType: 'user-provided' | 'demo-generated' | 'auto-detect';
  apiService: string;
  isPrivate: boolean;
}

interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  ipfsHash?: string;
  error?: string;
}

interface AgentUploadFormProps {
  onAgentCreated?: (agentId: string) => void;
}

// Constants
const PREDEFINED_TAGS = ['MCP', 'Trading', 'DeFi', 'LLM', 'Education', 'Analytics', 'NFT', 'DAO', 'Gaming'];
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
const ACCEPTED_FILE_TYPES = ['.zip', '.tar.gz', '.json', '.py', '.js', '.ts', '.md'];


// Mock API key encryption
const mockEncryptApiKey = async (apiKey: string): Promise<`0x${string}`> => {
  // Simulate client-side encryption
  await new Promise(resolve => setTimeout(resolve, 500));
  const encrypted = `mock-encrypted-${apiKey.substring(0, 8)}...${apiKey.substring(-4)}`;
  const encryptedBytes = new TextEncoder().encode(encrypted);
  return `0x${Array.from(encryptedBytes).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
};

export const AgentUploadForm: React.FC<AgentUploadFormProps> = ({ onAgentCreated }) => {
  const { ready, authenticated, login, user } = usePrivy();
  
  // Form state
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    description: '',
    tags: [],
    apiKey: '',
    apiKeyType: 'demo-generated',
    apiService: 'openai',
    isPrivate: false,
  });
  
  // UI state
  const [showApiKey, setShowApiKey] = useState(false);
  const [fileUpload, setFileUpload] = useState<FileUpload | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'upload' | 'encrypt' | 'contract' | 'success'>('form');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contract hooks
  const { 
    createAgent, 
    transactionStatus, 
    formatError, 
    resetStatus,
    isLoading: isContractLoading 
  } = useAgentContract();
  
  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Agent name is required';
    } else if (formData.name.length < 3) {
      errors.name = 'Agent name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      errors.name = 'Agent name must be less than 50 characters';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }
    
    if (formData.tags.length === 0) {
      errors.tags = 'At least one tag is required';
    } else if (formData.tags.length > 10) {
      errors.tags = 'Maximum 10 tags allowed';
    }
    
    if (formData.apiKeyType === 'user-provided') {
      if (!formData.apiKey.trim()) {
        errors.apiKey = 'API key is required when using user-provided option';
      } else if (!validateApiKey(formData.apiKey, formData.apiService)) {
        errors.apiKey = 'Invalid API key format for selected service';
      }
    }
    
    if (!fileUpload || fileUpload.status !== 'completed') {
      errors.file = 'File upload is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, fileUpload]);

  // File upload handler
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setValidationErrors({ file: 'File size must be less than 5GB' });
      return;
    }

    // Validate file type
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!ACCEPTED_FILE_TYPES.some(type => extension.includes(type.replace('.', '')))) {
      setValidationErrors({ 
        file: `File type not supported. Accepted types: ${ACCEPTED_FILE_TYPES.join(', ')}` 
      });
      return;
    }

    // Start upload
    const upload: FileUpload = {
      file,
      progress: 0,
      status: 'uploading',
    };
    
    setFileUpload(upload);
    setValidationErrors({ ...validationErrors, file: undefined });

    try {
      const result = await uploadToIPFS(file, {
        onProgress: (progress: UploadProgress) => {
          setFileUpload(prev => prev ? { 
            ...prev, 
            progress: progress.percentage 
          } : null);
        },
      });

      setFileUpload(prev => prev ? {
        ...prev,
        status: 'completed',
        ipfsHash: result.cid,
        progress: 100
      } : null);

    } catch (error: any) {
      setFileUpload(prev => prev ? {
        ...prev,
        status: 'error',
        error: error.message
      } : null);
    }
  }, [validationErrors]);

  // Tag management
  const addTag = useCallback((tag: string) => {
    if (!formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  }, [formData.tags]);

  const removeTag = useCallback((tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  }, []);

  const addCustomTag = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const input = event.target as HTMLInputElement;
      const tag = input.value.trim();
      if (tag && !formData.tags.includes(tag)) {
        addTag(tag);
        input.value = '';
      }
    }
  }, [addTag, formData.tags]);

  // Form submission
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!authenticated) {
      login();
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Step 1: Process and encrypt API key
      setStep('encrypt');
      console.log('🔐 Processing API key...');
      
      // Generate or validate API key based on type
      const processedApiKey = await processApiKey({
        type: formData.apiKeyType === 'auto-detect' ? 'user-provided' : formData.apiKeyType,
        service: formData.apiService as any,
        userKey: formData.apiKey || undefined
      }, formData.name, user?.wallet?.address || 'unknown');
      
      console.log('✅ API key processed:', detectServiceFromKey(processedApiKey));
      
      // Encrypt the processed key
      const encryptedApiKey = await mockEncryptApiKey(processedApiKey);
      
      // Clear plaintext API key from state immediately
      setFormData(prev => ({ ...prev, apiKey: '' }));

      // Step 2: Prepare contract call
      setStep('contract');
      console.log('📝 Creating agent on blockchain...');
      
      const txHash = await createAgent({
        name: formData.name,
        description: formData.description,
        tags: formData.tags,
        ipfsHash: fileUpload!.ipfsHash!,
        encryptedApiKey,
        isPrivate: formData.isPrivate,
      });

      console.log('✅ Agent created successfully:', txHash);

      // Step 3: Success
      setStep('success');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        tags: [],
        apiKey: '',
        apiKeyType: 'demo-generated',
        apiService: 'openai',
        isPrivate: false,
      });
      setFileUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Callback
      if (onAgentCreated && txHash) {
        onAgentCreated(txHash);
      }

    } catch (error: any) {
      console.error('❌ Agent creation failed:', error);
      setStep('form');
      // Clear API key for security even on error
      setFormData(prev => ({ ...prev, apiKey: '' }));
    } finally {
      setIsSubmitting(false);
    }
  }, [authenticated, login, validateForm, formData, fileUpload, createAgent, onAgentCreated]);

  // Loading state
  if (!ready) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Authentication required
  if (!authenticated) {
    return (
      <div className="card text-center max-w-md mx-auto">
        <CloudArrowUpIcon className="h-16 w-16 text-purple-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">
          Upload Your AI Agent
        </h2>
        <p className="text-slate-300 mb-6">
          Connect your account to start uploading AI agents to the marketplace.
        </p>
        <button onClick={login} className="button-primary">
          Login to Upload
        </button>
      </div>
    );
  }

  // Success state
  if (step === 'success') {
    return (
      <div className="card text-center max-w-md mx-auto">
        <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">
          Agent Created Successfully! 🎉
        </h2>
        <p className="text-slate-300 mb-6">
          Your AI agent has been uploaded to the marketplace and is now available for users to stake and interact with.
        </p>
        <div className="flex space-x-3">
          <button 
            onClick={() => setStep('form')} 
            className="button-secondary"
          >
            Create Another
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard'} 
            className="button-primary"
          >
            View Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Steps */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Create AI Agent</h2>
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <ShieldCheckIcon className="h-4 w-4" />
            <span>TEE Protected</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-xs">
          <div className={cn(
            'flex items-center space-x-2',
            step === 'form' ? 'text-purple-400' : 'text-slate-400'
          )}>
            <div className={cn(
              'w-2 h-2 rounded-full',
              step === 'form' ? 'bg-purple-400' : 'bg-slate-600'
            )} />
            <span>Form</span>
          </div>
          <div className={cn(
            'flex items-center space-x-2',
            step === 'encrypt' ? 'text-purple-400' : 'text-slate-400'
          )}>
            <div className={cn(
              'w-2 h-2 rounded-full',
              step === 'encrypt' ? 'bg-purple-400' : 'bg-slate-600'
            )} />
            <span>Encrypt</span>
          </div>
          <div className={cn(
            'flex items-center space-x-2',
            step === 'contract' ? 'text-purple-400' : 'text-slate-400'
          )}>
            <div className={cn(
              'w-2 h-2 rounded-full',
              step === 'contract' ? 'bg-purple-400' : 'bg-slate-600'
            )} />
            <span>Blockchain</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Agent Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={cn(
                  'input w-full',
                  validationErrors.name && 'border-red-500 focus:ring-red-500'
                )}
                placeholder="My Awesome AI Agent"
                disabled={isSubmitting}
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-400">{validationErrors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className={cn(
                  'input w-full resize-none',
                  validationErrors.description && 'border-red-500 focus:ring-red-500'
                )}
                placeholder="Describe what your AI agent does, its capabilities, and use cases..."
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center mt-1">
                {validationErrors.description && (
                  <p className="text-sm text-red-400">{validationErrors.description}</p>
                )}
                <p className="text-xs text-slate-400 ml-auto">
                  {formData.description.length}/500
                </p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tags * (Select or type custom tags)
              </label>
              
              {/* Predefined Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {PREDEFINED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    disabled={formData.tags.includes(tag) || isSubmitting}
                    className={cn(
                      'px-3 py-1 text-sm rounded-full border transition-colors duration-200',
                      formData.tags.includes(tag)
                        ? 'bg-purple-500 text-white border-purple-500 cursor-not-allowed'
                        : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Custom Tag Input */}
              <input
                type="text"
                placeholder="Type custom tag and press Enter"
                onKeyDown={addCustomTag}
                className="input w-full"
                disabled={isSubmitting || formData.tags.length >= 10}
              />

              {/* Selected Tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center space-x-1 px-3 py-1 bg-purple-500 text-white text-sm rounded-full"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        disabled={isSubmitting}
                        className="hover:text-purple-200"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {validationErrors.tags && (
                <p className="mt-1 text-sm text-red-400">{validationErrors.tags}</p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Agent Files * (Max 5GB)
              </label>
              
              <div className="space-y-4">
                {!fileUpload ? (
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-slate-500 transition-colors duration-200">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".zip,.tar.gz,.json,.py,.js,.ts,.md"
                      disabled={isSubmitting}
                    />
                    <CloudArrowUpIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-300 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-slate-400 mb-4">
                      Accepted: {ACCEPTED_FILE_TYPES.join(', ')} (Max 5GB)
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="button-secondary"
                      disabled={isSubmitting}
                    >
                      Select File
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center space-x-3 mb-3">
                      <DocumentIcon className="h-5 w-5 text-slate-400" />
                      <div className="flex-1">
                        <p className="text-slate-300 text-sm font-medium">
                          {fileUpload.file.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      {fileUpload.status === 'completed' && (
                        <CheckCircleIcon className="h-5 w-5 text-green-400" />
                      )}
                    </div>

                    {/* Progress Bar */}
                    {fileUpload.status === 'uploading' && (
                      <div className="mb-3">
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-200"
                            style={{ width: `${fileUpload.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Uploading... {fileUpload.progress.toFixed(0)}%
                        </p>
                      </div>
                    )}

                    {/* IPFS Hash */}
                    {fileUpload.status === 'completed' && fileUpload.ipfsHash && (
                      <div className="mb-3">
                        <p className="text-xs text-slate-400">IPFS Hash:</p>
                        <p className="text-xs font-mono text-green-400">
                          {fileUpload.ipfsHash}
                        </p>
                      </div>
                    )}

                    {/* Error */}
                    {fileUpload.status === 'error' && (
                      <div className="mb-3">
                        <p className="text-sm text-red-400">{fileUpload.error}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setFileUpload(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="text-sm text-slate-400 hover:text-white underline"
                      disabled={isSubmitting}
                    >
                      Remove File
                    </button>
                  </div>
                )}
              </div>
              
              {validationErrors.file && (
                <p className="mt-1 text-sm text-red-400">{validationErrors.file}</p>
              )}
            </div>

            {/* API Key Configuration */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                API Key Configuration * (TEE Protected)
              </label>
              
              {/* API Key Type Selection */}
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-3">
                  {/* Demo Generated Option */}
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="apiKeyType"
                      value="demo-generated"
                      checked={formData.apiKeyType === 'demo-generated'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        apiKeyType: e.target.value as any,
                        apiKey: '' // Clear existing key
                      }))}
                      className="mt-1"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-200">
                        🎯 Auto-Generate Demo Key (Recommended)
                      </div>
                      <div className="text-xs text-slate-400">
                        Perfect for hackathon demo - generates realistic API keys automatically
                      </div>
                    </div>
                  </label>

                  {/* User Provided Option */}
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="apiKeyType"
                      value="user-provided"
                      checked={formData.apiKeyType === 'user-provided'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        apiKeyType: e.target.value as any 
                      }))}
                      className="mt-1"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-200">
                        🔑 Provide Your Own API Key
                      </div>
                      <div className="text-xs text-slate-400">
                        Use real API keys for production agents (OpenAI, Anthropic, etc.)
                      </div>
                    </div>
                  </label>
                </div>

                {/* Service Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    AI Service Provider
                  </label>
                  <select
                    value={formData.apiService}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiService: e.target.value }))}
                    className="input w-full text-sm"
                    disabled={isSubmitting}
                  >
                    <option value="openai">🤖 OpenAI (GPT-4, GPT-3.5)</option>
                    <option value="anthropic">🧠 Anthropic (Claude)</option>
                    <option value="huggingface">🤗 Hugging Face (Open Models)</option>
                    <option value="replicate">🔄 Replicate (Various Models)</option>
                    <option value="custom">⚙️ Custom API</option>
                  </select>
                </div>

                {/* API Key Input - Only show for user-provided */}
                {formData.apiKeyType === 'user-provided' && (
                  <div>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={formData.apiKey}
                        onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                        className={cn(
                          'input w-full pr-10',
                          validationErrors.apiKey && 'border-red-500 focus:ring-red-500'
                        )}
                        placeholder={`Enter your ${formData.apiService} API key...`}
                        disabled={isSubmitting}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                      >
                        {showApiKey ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Demo Preview - Show for demo-generated */}
                {formData.apiKeyType === 'demo-generated' && (
                  <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                    <div className="text-xs text-slate-400 mb-2">Demo Key Preview:</div>
                    <div className="font-mono text-xs text-green-400">
                      {formData.apiService === 'openai' && 'sk-demo_1a2b3c4d5e6f7g8h9i0j...'}
                      {formData.apiService === 'anthropic' && 'sk-ant-demo_1a2b3c4d5e6f7g8h9i0j...'}
                      {formData.apiService === 'huggingface' && 'hf_demo1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p'}
                      {formData.apiService === 'replicate' && 'r8_demo1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8'}
                      {formData.apiService === 'custom' && 'ck_demo_1a2b3c4d5e6f7g8h9i0j1k2l3m4n'}
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      ✨ Will be generated automatically based on your agent name and creator address
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-2 space-y-1 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-3 w-3 text-green-400" />
                  <span>Encrypted client-side before transmission</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-3 w-3 text-green-400" />
                  <span>Stored in TEE-protected environment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-3 w-3 text-green-400" />
                  <span>Never exposed outside secure execution</span>
                </div>
              </div>
              
              {validationErrors.apiKey && (
                <p className="mt-1 text-sm text-red-400">{validationErrors.apiKey}</p>
              )}
            </div>

            {/* Privacy Toggle */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-300">
                  Agent Privacy
                </label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
                  disabled={isSubmitting}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
                    formData.isPrivate ? 'bg-purple-500' : 'bg-slate-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
                      formData.isPrivate ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {formData.isPrivate 
                  ? 'Private agents require access approval and minimum stake to use' 
                  : 'Public agents are accessible to all users who stake'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Status */}
        {transactionStatus.status !== 'idle' && (
          <TransactionStatus
            status={transactionStatus.status}
            hash={transactionStatus.hash}
            error={transactionStatus.error}
            onRetry={handleSubmit}
            onReset={() => {
              resetStatus();
              setStep('form');
            }}
            className="mb-6"
          />
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-center pt-6">
          <ButtonLoading
            loading={isSubmitting || isContractLoading}
            disabled={isSubmitting || isContractLoading || !authenticated || transactionStatus.status === 'pending'}
            className={cn(
              'button-primary w-full max-w-md flex items-center justify-center space-x-2 text-lg py-4',
              (isSubmitting || isContractLoading) && 'cursor-not-allowed opacity-50'
            )}
          >
            {isSubmitting || isContractLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>
                  {step === 'encrypt' && 'Encrypting API Key...'}
                  {step === 'contract' && 'Creating Agent on Blockchain...'}
                  {step === 'upload' && 'Uploading to IPFS...'}
                  {transactionStatus.status === 'pending' && 'Transaction Pending...'}
                </span>
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="h-5 w-5" />
                <span>Create Agent (Gasless)</span>
              </>
            )}
          </ButtonLoading>
        </div>

        {/* Information Panel */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-6 border border-purple-500/20">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-slate-300">
              <div><strong className="text-purple-300">Revenue Model:</strong></div>
              <ul className="space-y-1 ml-4">
                <li>• Users stake ETH (minimum 0.01) to access your agent</li>
                <li>• You earn 70% of all stakes immediately</li>
                <li>• 30% goes to protocol development</li>
                <li>• Higher stakes = better marketplace visibility</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};