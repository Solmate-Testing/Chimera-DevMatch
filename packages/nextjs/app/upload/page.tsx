"use client";

/**
 * Upload Agent Page
 * 
 * Page for uploading and creating new AI agents in the marketplace
 * with Privy authentication and gasless transactions.
 */

import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { AgentUploadForm } from '../../components/AgentUploadForm';
import { IPFSUpload } from '../../components/IPFSUpload';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { CloudArrowUpIcon, RocketLaunchIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { IPFSFile } from '../../hooks/useIPFS';

export default function UploadPage() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<IPFSFile[]>([]);
  const [activeTab, setActiveTab] = useState<'agent' | 'files'>('agent');
  const [showGettingStarted, setShowGettingStarted] = useState(false);

  const handleAgentCreated = (agentId: string) => {
    console.log('Agent created with ID:', agentId);
    // Redirect to agent details or dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  const handleFileUploaded = (file: IPFSFile) => {
    setUploadedFiles(prev => [file, ...prev.slice(0, 9)]); // Keep last 10 files
    console.log('File uploaded to IPFS:', file.cid);
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
            <h1 className="text-4xl font-bold text-gray-800">
              Upload AI Agent
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-6">
            Create and monetize your AI agents with gasless transactions
          </p>
          
          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="text-green-600 font-semibold mb-1">✅ Gasless Creation</div>
              <div className="text-sm text-gray-500">No gas fees for listing</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="text-blue-600 font-semibold mb-1">🔐 TEE Security</div>
              <div className="text-sm text-gray-500">API keys protected</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="text-purple-600 font-semibold mb-1">💰 Instant Earnings</div>
              <div className="text-sm text-gray-500">70% creator revenue</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="animate-slide-up mb-8" style={{ animationDelay: '0.1s' }}>
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl p-1 border border-gray-200 shadow-lg">
              <button
                onClick={() => setActiveTab('agent')}
                className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'agent'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <CloudArrowUpIcon className="w-5 h-5 inline mr-2" />
                Create AI Agent
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'files'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <DocumentIcon className="w-5 h-5 inline mr-2" />
                Upload Files
              </button>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {activeTab === 'agent' ? (
            <AgentUploadForm 
              onAgentCreated={handleAgentCreated} 
              uploadedFiles={uploadedFiles}
            />
          ) : (
            <IPFSUpload 
              onFileUploaded={handleFileUploaded}
              className="max-w-4xl mx-auto"
            />
          )}
        </div>

        {/* Help Section */}
        <div className="mt-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="card">
            <button
              onClick={() => setShowGettingStarted(!showGettingStarted)}
              className="w-full flex items-center justify-between text-left mb-4 hover:text-purple-300 transition-colors"
            >
              <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                <RocketLaunchIcon className="h-6 w-6 text-purple-500" />
                <span>Getting Started</span>
              </h2>
              <span className="text-gray-500 text-sm">
                {showGettingStarted ? 'Hide' : 'Show'} details
              </span>
            </button>
            
            {showGettingStarted && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-purple-600 mb-3">
                    📝 Requirements
                  </h3>
                  <ul className="space-y-2 text-gray-600 text-sm">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>Unique name & description</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>File upload (max 5GB)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>Category selection</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-blue-600 mb-3">
                    🔒 Security
                  </h3>
                  <ul className="space-y-2 text-gray-600 text-sm">
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Keys encrypted client-side</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>TEE-protected storage</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Zero key exposure</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border border-purple-200">
              <div className="text-sm text-gray-700">
                <strong className="text-purple-600">💡 Pro Tip:</strong> Higher stakes = better marketplace visibility!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}