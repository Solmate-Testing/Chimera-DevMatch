"use client";

/**
 * TransactionStatus Component
 * 
 * Display transaction status with beginner-friendly messages
 * and appropriate actions for different states.
 * 
 * @component
 */

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { cn } from '../utils/cn';

export interface TransactionStatusProps {
  status: 'idle' | 'preparing' | 'pending' | 'success' | 'error';
  hash?: string;
  error?: {
    message: string;
    code?: string;
    reason?: string;
  };
  onRetry?: () => void;
  onReset?: () => void;
  className?: string;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  hash,
  error,
  onRetry,
  onReset,
  className,
}) => {
  const getExplorerUrl = (hash: string) => {
    // Use appropriate explorer based on network
    return `https://sepolia.etherscan.io/tx/${hash}`;
  };

  if (status === 'idle') {
    return null;
  }

  return (
    <div className={cn('rounded-lg p-4 border', className)}>
      {status === 'preparing' && (
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="sm" variant="primary" />
          <div>
            <div className="text-sm font-medium text-slate-300">
              Preparing Transaction
            </div>
            <div className="text-xs text-slate-400">
              Encrypting data and preparing gasless transaction...
            </div>
          </div>
        </div>
      )}

      {status === 'pending' && (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <LoadingSpinner size="sm" variant="primary" />
            <div>
              <div className="text-sm font-medium text-slate-300">
                Transaction Pending
              </div>
              <div className="text-xs text-slate-400">
                Your gasless transaction is being processed...
              </div>
            </div>
          </div>
          
          {hash && (
            <div className="flex items-center space-x-2 text-xs">
              <ClockIcon className="h-3 w-3 text-slate-400" />
              <span className="text-slate-400">Transaction Hash:</span>
              <button
                onClick={() => window.open(getExplorerUrl(hash), '_blank')}
                className="text-blue-400 hover:text-blue-300 underline flex items-center space-x-1"
              >
                <span className="font-mono">{hash.slice(0, 10)}...{hash.slice(-8)}</span>
                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
              </button>
            </div>
          )}
          
          <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
            <div className="flex items-start space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs text-blue-300 space-y-1">
                <div><strong>What's happening:</strong></div>
                <div>• Your transaction is gasless - no fees for you!</div>
                <div>• The DApp paymaster is covering gas costs</div>
                <div>• Should complete in under 15 seconds</div>
                <div>• No need to approve in MetaMask</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-green-300">
                Transaction Successful! 🎉
              </div>
              <div className="text-xs text-slate-400">
                Your agent has been created and is now live on the marketplace
              </div>
            </div>
          </div>
          
          {hash && (
            <div className="flex items-center space-x-2 text-xs">
              <CheckCircleIcon className="h-3 w-3 text-green-400" />
              <span className="text-slate-400">View on Explorer:</span>
              <button
                onClick={() => window.open(getExplorerUrl(hash), '_blank')}
                className="text-green-400 hover:text-green-300 underline flex items-center space-x-1"
              >
                <span className="font-mono">{hash.slice(0, 10)}...{hash.slice(-8)}</span>
                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
              </button>
            </div>
          )}
          
          <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
            <div className="text-xs text-green-300 space-y-1">
              <div>✅ <strong>Agent created successfully</strong></div>
              <div>✅ No gas fees paid by you</div>
              <div>✅ API key encrypted and stored securely</div>
              <div>✅ Ready to earn from user stakes</div>
            </div>
          </div>
          
          {onReset && (
            <button
              onClick={onReset}
              className="button-secondary text-sm"
            >
              Create Another Agent
            </button>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-red-300">
                Transaction Failed
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {error?.message || 'Something went wrong with the transaction'}
              </div>
            </div>
          </div>
          
          {hash && (
            <div className="flex items-center space-x-2 text-xs">
              <ExclamationTriangleIcon className="h-3 w-3 text-red-400" />
              <span className="text-slate-400">Failed Transaction:</span>
              <button
                onClick={() => window.open(getExplorerUrl(hash), '_blank')}
                className="text-red-400 hover:text-red-300 underline flex items-center space-x-1"
              >
                <span className="font-mono">{hash.slice(0, 10)}...{hash.slice(-8)}</span>
                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
              </button>
            </div>
          )}
          
          <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
            <div className="text-xs text-red-300 space-y-2">
              <div><strong>Common Solutions:</strong></div>
              <ul className="space-y-1 ml-3">
                <li>• Check your internet connection</li>
                <li>• Ensure all form fields are valid</li>
                <li>• Wait a moment and try again</li>
                <li>• Make sure you're connected to the correct network</li>
              </ul>
            </div>
          </div>
          
          <div className="flex space-x-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="button-secondary text-sm"
              >
                Try Again
              </button>
            )}
            {onReset && (
              <button
                onClick={onReset}
                className="text-sm text-slate-400 hover:text-white underline"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};