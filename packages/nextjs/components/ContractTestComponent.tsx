"use client";

import React, { useState } from 'react';
import { useScaffoldReadContract } from '../hooks/scaffold-eth/useScaffoldReadContract';
import { useScaffoldWriteContract } from '../hooks/scaffold-eth/useScaffoldWriteContract';
import { useAgentContract } from '../hooks/useAgentContract';

/**
 * Test component to verify all contract interactions work
 */
export const ContractTestComponent = () => {
  const [testResults, setTestResults] = useState<Record<string, 'pass' | 'fail' | 'pending'>>({});

  // Test scaffold-eth read hooks
  const { data: agentCount, error: readError } = useScaffoldReadContract({
    contractName: 'Marketplace',
    functionName: 'getAgentCount',
  });

  // Test scaffold-eth write hooks
  const { writeContractAsync: stakeToAgent } = useScaffoldWriteContract('Marketplace');
  const { writeContractAsync: loveAgent } = useScaffoldWriteContract('Marketplace');

  // Test custom agent contract hook
  const { 
    createAgent, 
    transactionStatus, 
    isLoading: isContractLoading,
    formatError
  } = useAgentContract();

  const runTests = async () => {
    console.log('🧪 Running contract interaction tests...');

    // Test 1: Read contract data
    try {
      if (typeof agentCount !== 'undefined') {
        setTestResults(prev => ({ ...prev, 'read-contract': 'pass' }));
        console.log('✅ Contract read test passed:', agentCount?.toString());
      } else if (readError) {
        setTestResults(prev => ({ ...prev, 'read-contract': 'fail' }));
        console.log('❌ Contract read test failed:', readError);
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, 'read-contract': 'fail' }));
      console.log('❌ Contract read test error:', error);
    }

    // Test 2: Write contract hooks initialization
    try {
      if (typeof stakeToAgent === 'function' && typeof loveAgent === 'function') {
        setTestResults(prev => ({ ...prev, 'write-hooks': 'pass' }));
        console.log('✅ Write hooks test passed');
      } else {
        setTestResults(prev => ({ ...prev, 'write-hooks': 'fail' }));
        console.log('❌ Write hooks test failed');
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, 'write-hooks': 'fail' }));
      console.log('❌ Write hooks test error:', error);
    }

    // Test 3: Custom agent contract hook
    try {
      if (typeof createAgent === 'function' && typeof formatError === 'function') {
        setTestResults(prev => ({ ...prev, 'agent-contract': 'pass' }));
        console.log('✅ Agent contract hook test passed');
      } else {
        setTestResults(prev => ({ ...prev, 'agent-contract': 'fail' }));
        console.log('❌ Agent contract hook test failed');
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, 'agent-contract': 'fail' }));
      console.log('❌ Agent contract hook test error:', error);
    }

    // Test 4: Transaction status
    try {
      if (transactionStatus && typeof transactionStatus.status === 'string') {
        setTestResults(prev => ({ ...prev, 'transaction-status': 'pass' }));
        console.log('✅ Transaction status test passed:', transactionStatus.status);
      } else {
        setTestResults(prev => ({ ...prev, 'transaction-status': 'fail' }));
        console.log('❌ Transaction status test failed');
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, 'transaction-status': 'fail' }));
      console.log('❌ Transaction status test error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (testResults[status]) {
      case 'pass': return 'text-green-600';
      case 'fail': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-blue-800 mb-4">🧪 Contract Integration Tests</h3>
      
      <button 
        onClick={runTests}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Run Contract Tests
      </button>

      <div className="space-y-2 text-sm">
        <div className={`flex justify-between ${getStatusColor('read-contract')}`}>
          <span>📖 Read Contract (Agent Count)</span>
          <span>{testResults['read-contract'] || 'pending'} {agentCount !== undefined ? `(${agentCount?.toString()})` : ''}</span>
        </div>
        
        <div className={`flex justify-between ${getStatusColor('write-hooks')}`}>
          <span>✍️ Write Contract Hooks</span>
          <span>{testResults['write-hooks'] || 'pending'}</span>
        </div>
        
        <div className={`flex justify-between ${getStatusColor('agent-contract')}`}>
          <span>🤖 Agent Contract Hook</span>
          <span>{testResults['agent-contract'] || 'pending'}</span>
        </div>
        
        <div className={`flex justify-between ${getStatusColor('transaction-status')}`}>
          <span>📊 Transaction Status</span>
          <span>{testResults['transaction-status'] || 'pending'} ({transactionStatus?.status || 'idle'})</span>
        </div>
      </div>

      {readError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
          <strong>Read Error:</strong> {readError.toString()}
        </div>
      )}

      {isContractLoading && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-700 text-sm">
          Contract operation in progress...
        </div>
      )}
    </div>
  );
};

export default ContractTestComponent;