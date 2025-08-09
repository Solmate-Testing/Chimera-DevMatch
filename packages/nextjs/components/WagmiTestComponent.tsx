"use client";

import React from 'react';
import { useAccount, useChainId } from 'wagmi';

/**
 * Simple component to test if Wagmi provider is working
 * Shows connection status and network info
 */
export const WagmiTestComponent = () => {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();

  return (
    <div className="bg-green-900/20 border-l-4 border-green-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">
            ✅ Wagmi Provider Working
          </h3>
          <div className="mt-2 text-sm text-green-700">
            <p><strong>Connection Status:</strong> {isConnected ? 'Connected' : 'Disconnected'}</p>
            <p><strong>Chain ID:</strong> {chainId || 'Not detected'}</p>
            {address && <p><strong>Address:</strong> {address}</p>}
            <p className="text-xs mt-2">This confirms that scaffold-eth hooks will work properly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WagmiTestComponent;