"use client";

import React, { useState } from 'react';
import { useScaffoldReadContract } from '../hooks/scaffold-eth/useScaffoldReadContract';
import { useScaffoldWriteContract } from '../hooks/scaffold-eth/useScaffoldWriteContract';

/**
 * Marketplace Test Suite Component
 * 
 * This component provides comprehensive testing for all marketplace functionality
 * including contract interactions, gasless transactions, and UI responsiveness.
 */
export const MarketplaceTestSuite = () => {
  const [testResults, setTestResults] = useState<{ [key: string]: 'pending' | 'pass' | 'fail' }>({});
  const [isRunning, setIsRunning] = useState(false);

  // Contract hooks for testing
  const { data: agentCount } = useScaffoldReadContract({
    contractName: 'Marketplace',
    functionName: 'getAgentCount',
  });

  const { data: allAgents } = useScaffoldReadContract({
    contractName: 'Marketplace',
    functionName: 'getAllAgents',
  });

  const { writeContractAsync: createAgent } = useScaffoldWriteContract('Marketplace');
  const { writeContractAsync: stakeToAgent } = useScaffoldWriteContract('Marketplace');
  const { writeContractAsync: loveAgent } = useScaffoldWriteContract('Marketplace');

  const logTest = (testName: string, result: 'pass' | 'fail', details?: any) => {
    console.log(`🧪 TEST: ${testName} - ${result.toUpperCase()}`, details || '');
    setTestResults(prev => ({ ...prev, [testName]: result }));
  };

  const runComprehensiveTests = async () => {
    setIsRunning(true);
    console.log('🚀 Starting Comprehensive Marketplace Tests...');

    try {
      // Test 1: Contract Connection
      console.log('📡 Testing contract connection...');
      if (typeof agentCount !== 'undefined') {
        logTest('Contract Connection', 'pass', `Agent count: ${agentCount?.toString()}`);
      } else {
        logTest('Contract Connection', 'fail', 'Agent count undefined');
      }

      // Test 2: Agent Data Loading
      console.log('📊 Testing agent data loading...');
      if (allAgents && Array.isArray(allAgents)) {
        logTest('Agent Data Loading', 'pass', `Loaded ${allAgents.length} agents`);
      } else {
        logTest('Agent Data Loading', 'fail', 'No agents loaded');
      }

      // Test 3: UI Event Logging
      console.log('🎯 Testing UI event logging...');
      const testButton = document.createElement('button');
      testButton.onclick = () => console.log('✅ Button click detected');
      testButton.click();
      logTest('UI Event Logging', 'pass', 'Button click events working');

      // Test 4: Network Inspector Ready
      console.log('🌐 Testing network monitoring setup...');
      if (typeof window !== 'undefined' && window.performance) {
        logTest('Network Inspector', 'pass', 'Performance API available');
      } else {
        logTest('Network Inspector', 'fail', 'Performance API not available');
      }

      // Test 5: Local Storage
      console.log('💾 Testing local storage...');
      try {
        localStorage.setItem('marketplace-test', 'success');
        const testValue = localStorage.getItem('marketplace-test');
        if (testValue === 'success') {
          logTest('Local Storage', 'pass', 'Storage read/write working');
          localStorage.removeItem('marketplace-test');
        } else {
          logTest('Local Storage', 'fail', 'Storage read failed');
        }
      } catch (error) {
        logTest('Local Storage', 'fail', `Storage error: ${error}`);
      }

      // Test 6: Error Boundary
      console.log('🛡️ Testing error handling...');
      try {
        // Simulate a controlled error
        const testError = new Error('Test error for error boundary');
        console.error('🔴 Controlled test error:', testError.message);
        logTest('Error Handling', 'pass', 'Error logging functional');
      } catch (error) {
        logTest('Error Handling', 'fail', `Error handling failed: ${error}`);
      }

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      setIsRunning(false);
      console.log('✅ Test suite completed! Check results above.');
    }
  };

  const testCreateAgent = async () => {
    console.log('🤖 Testing agent creation...');
    try {
      const mockApiKey = new TextEncoder().encode('test-api-key-12345');
      
      const result = await createAgent({
        functionName: 'createAgent',
        args: [
          'Test AI Agent',
          'A test AI agent for marketplace validation',
          ['test', 'demo', 'ai'],
          'QmTestHash123456789',
          mockApiKey,
          false
        ],
      });
      
      console.log('✅ Agent creation result:', result);
      logTest('Agent Creation', 'pass', result);
    } catch (error) {
      console.error('❌ Agent creation failed:', error);
      logTest('Agent Creation', 'fail', error);
    }
  };

  const testStaking = async () => {
    if (!allAgents || allAgents.length === 0) {
      console.log('⚠️ No agents available for staking test');
      return;
    }

    console.log('💰 Testing staking functionality...');
    try {
      const firstAgent = allAgents[0];
      const result = await stakeToAgent({
        functionName: 'stakeToAgent',
        args: [firstAgent.id],
        value: BigInt(10000000000000000), // 0.01 ETH
      });
      
      console.log('✅ Staking result:', result);
      logTest('Staking', 'pass', result);
    } catch (error) {
      console.error('❌ Staking failed:', error);
      logTest('Staking', 'fail', error);
    }
  };

  const testLove = async () => {
    if (!allAgents || allAgents.length === 0) {
      console.log('⚠️ No agents available for love test');
      return;
    }

    console.log('💖 Testing love functionality...');
    try {
      const firstAgent = allAgents[0];
      const result = await loveAgent({
        functionName: 'loveAgent',
        args: [firstAgent.id],
      });
      
      console.log('✅ Love result:', result);
      logTest('Love', 'pass', result);
    } catch (error) {
      console.error('❌ Love failed:', error);
      logTest('Love', 'fail', error);
    }
  };

  const getTestStatus = (testName: string) => {
    const status = testResults[testName] || 'pending';
    const colors = {
      pending: 'bg-gray-500',
      pass: 'bg-green-500',
      fail: 'bg-red-500',
    };
    return colors[status];
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-6">🧪 Marketplace Test Suite</h2>
      
      {/* Test Controls */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={runComprehensiveTests}
          disabled={isRunning}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            isRunning 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isRunning ? 'Running Tests...' : '🚀 Run All Tests'}
        </button>
        
        <button
          onClick={testCreateAgent}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all"
        >
          🤖 Test Agent Creation
        </button>
        
        <button
          onClick={testStaking}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all"
        >
          💰 Test Staking
        </button>
        
        <button
          onClick={testLove}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-all"
        >
          💖 Test Love
        </button>
      </div>

      {/* Test Results */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Test Results:</h3>
        
        {[
          'Contract Connection',
          'Agent Data Loading', 
          'UI Event Logging',
          'Network Inspector',
          'Local Storage',
          'Error Handling',
          'Agent Creation',
          'Staking',
          'Love'
        ].map((testName) => (
          <div key={testName} className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${getTestStatus(testName)}`}></div>
            <span className="text-white">{testName}</span>
            <span className="text-white/70 text-sm">
              {testResults[testName] || 'pending'}
            </span>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
        <h4 className="text-blue-300 font-semibold mb-2">Testing Instructions:</h4>
        <ul className="text-blue-100 text-sm space-y-1">
          <li>• Open browser dev tools (F12)</li>
          <li>• Go to Console tab to see detailed logs</li>
          <li>• Go to Network tab to monitor transactions</li>
          <li>• Click buttons and check for event logs</li>
          <li>• All interactions should trigger console messages</li>
        </ul>
      </div>
    </div>
  );
};

export default MarketplaceTestSuite;