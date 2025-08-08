"use client";

/**
 * LoadingSpinner Component
 * 
 * Reusable loading spinner with multiple sizes and variants
 * for consistent loading states throughout the application.
 * 
 * @component
 */

import React from 'react';
import { cn } from '../utils/cn';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  className?: string;
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const variantClasses = {
  default: 'text-slate-400',
  primary: 'text-blue-500',
  secondary: 'text-purple-500',
  accent: 'text-green-500',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
}) => {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Full-screen loading overlay
 */
export const LoadingOverlay: React.FC<{
  message?: string;
  className?: string;
}> = ({ 
  message = 'Loading...', 
  className 
}) => {
  return (
    <div
      className={cn(
        'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50',
        className
      )}
    >
      <div className="bg-slate-800 rounded-lg p-6 flex flex-col items-center space-y-4 border border-slate-700">
        <LoadingSpinner size="lg" variant="primary" />
        <p className="text-slate-300 text-sm">{message}</p>
      </div>
    </div>
  );
};

/**
 * Inline loading state with message
 */
export const LoadingState: React.FC<{
  message?: string;
  size?: LoadingSpinnerProps['size'];
  className?: string;
}> = ({ 
  message = 'Loading...', 
  size = 'md',
  className 
}) => {
  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <LoadingSpinner size={size} variant="primary" />
      <span className="text-slate-400 text-sm">{message}</span>
    </div>
  );
};

/**
 * Button loading state
 */
export const ButtonLoading: React.FC<{
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}> = ({ 
  children, 
  loading = false, 
  disabled = false,
  className,
  onClick 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'relative flex items-center justify-center space-x-2 transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" variant="primary" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};