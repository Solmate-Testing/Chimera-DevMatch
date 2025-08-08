"use client";

/**
 * ErrorMessage Component
 * 
 * Reusable error message component with retry functionality
 * and consistent styling for error states throughout the app.
 * 
 * @component
 */

import React from 'react';
import { 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { cn } from '../utils/cn';

interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  compact?: boolean;
}

const variantStyles = {
  error: {
    container: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    icon: 'text-red-400',
    button: 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300',
    IconComponent: XCircleIcon,
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    icon: 'text-yellow-400',
    button: 'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300',
    IconComponent: ExclamationTriangleIcon,
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
    icon: 'text-blue-400',
    button: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
    IconComponent: InformationCircleIcon,
  },
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  variant = 'error',
  onRetry,
  retryLabel = 'Try Again',
  className,
  compact = false,
}) => {
  const styles = variantStyles[variant];
  const IconComponent = styles.IconComponent;

  if (compact) {
    return (
      <div className={cn(
        'flex items-center space-x-2 p-2 rounded-md border',
        styles.container,
        className
      )}>
        <IconComponent className={cn('h-4 w-4 flex-shrink-0', styles.icon)} />
        <span className="text-sm flex-1">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className={cn(
              'text-xs underline hover:no-underline transition-colors duration-200',
              styles.button
            )}
          >
            {retryLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-lg border p-4',
      styles.container,
      className
    )}>
      <div className="flex items-start space-x-3">
        <IconComponent className={cn('h-5 w-5 flex-shrink-0 mt-0.5', styles.icon)} />
        <div className="flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm">
            {message}
          </p>
          {onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className={cn(
                  'inline-flex items-center space-x-2 text-sm font-medium underline hover:no-underline transition-colors duration-200',
                  styles.button
                )}
              >
                <ArrowPathIcon className="h-4 w-4" />
                <span>{retryLabel}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Error boundary fallback component
 */
export const ErrorFallback: React.FC<{
  error: Error;
  resetError: () => void;
}> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <ErrorMessage
          title="Something went wrong"
          message={error.message || 'An unexpected error occurred. Please try again.'}
          onRetry={resetError}
          retryLabel="Reload Page"
        />
      </div>
    </div>
  );
};

/**
 * Web3 specific error messages
 */
export const Web3ErrorMessage: React.FC<{
  error: any;
  onRetry?: () => void;
  className?: string;
}> = ({ error, onRetry, className }) => {
  // Parse common Web3 error messages
  const getErrorMessage = (error: any): { title: string; message: string; variant: 'error' | 'warning' | 'info' } => {
    const errorString = error?.message || error?.toString() || 'Unknown error';
    
    if (errorString.includes('user rejected')) {
      return {
        title: 'Transaction Cancelled',
        message: 'You cancelled the transaction. No changes were made.',
        variant: 'warning'
      };
    }
    
    if (errorString.includes('insufficient funds')) {
      return {
        title: 'Insufficient Funds',
        message: 'You don\'t have enough ETH to complete this transaction.',
        variant: 'error'
      };
    }
    
    if (errorString.includes('network') || errorString.includes('connection')) {
      return {
        title: 'Network Error',
        message: 'There was a problem connecting to the network. Please check your connection and try again.',
        variant: 'error'
      };
    }
    
    if (errorString.includes('gas')) {
      return {
        title: 'Gas Error',
        message: 'There was an issue with gas estimation. Please try again.',
        variant: 'error'
      };
    }
    
    return {
      title: 'Transaction Failed',
      message: errorString.length > 100 ? errorString.substring(0, 100) + '...' : errorString,
      variant: 'error'
    };
  };

  const { title, message, variant } = getErrorMessage(error);

  return (
    <ErrorMessage
      title={title}
      message={message}
      variant={variant}
      onRetry={onRetry}
      className={className}
    />
  );
};