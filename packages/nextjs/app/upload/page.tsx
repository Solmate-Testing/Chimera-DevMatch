"use client";

/**
 * Upload Agent Page
 * 
 * Page for uploading and creating new AI agents in the marketplace
 * with Privy authentication and gasless transactions.
 */

import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { AgentUploadForm } from '../../components/AgentUploadForm';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { CloudArrowUpIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  const handleAgentCreated = (agentId: string) => {
    console.log('Agent created with ID:', agentId);
    // Redirect to agent details or dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  if (!ready) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card">
            <CloudArrowUpIcon className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">
              Upload Your AI Agent
            </h1>
            <p className="text-slate-300 mb-8">
              Connect your account to start uploading AI agents to the marketplace.
              Create your own agents, set pricing, and earn from your AI creations.
            </p>
            <button
              onClick={login}
              className="button-primary"
            >
              Login to Upload
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
              <CloudArrowUpIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Upload AI Agent
            </h1>
          </div>
          <p className="text-xl text-slate-300 mb-6">
            Create and monetize your AI agents with gasless transactions
          </p>
          
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
              <div className="text-green-400 font-semibold mb-1">✅ Gasless Creation</div>
              <div className="text-sm text-slate-400">No gas fees for listing</div>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
              <div className="text-blue-400 font-semibold mb-1">🔐 TEE Security</div>
              <div className="text-sm text-slate-400">API keys protected</div>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
              <div className="text-purple-400 font-semibold mb-1">💰 Instant Earnings</div>
              <div className="text-sm text-slate-400">70% creator revenue</div>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <AgentUploadForm onAgentCreated={handleAgentCreated} />
        </div>

        {/* Help Section */}
        <div className="mt-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
              <RocketLaunchIcon className="h-6 w-6 text-purple-400" />
              <span>Getting Started</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-purple-300 mb-3">
                  📝 Agent Requirements
                </h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>Unique agent name and clear description</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>Valid API key for your AI service</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>Appropriate category selection</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>Realistic pricing strategy</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-blue-300 mb-3">
                  🔒 Security Features
                </h3>
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>API keys encrypted client-side</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>TEE-protected storage via Oasis</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Zero key exposure guarantee</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Private agent access control</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
              <div className="text-sm text-slate-300">
                <strong className="text-purple-300">💡 Pro Tip:</strong> Start with a competitive price and 
                adjust based on market demand. Popular agents with high stakes get better visibility!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}