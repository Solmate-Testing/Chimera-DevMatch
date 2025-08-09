"use client";

/**
 * Layout Component with Responsive Header and Navigation
 * 
 * Features:
 * - Privy authentication with Google/Email login
 * - Responsive navigation menu with mobile support
 * - Wallet connection status with Sepolia ETH balance
 * - Dark theme support with TailwindCSS
 * - Loading states and error handling
 * 
 * @component
 */

import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WalletConnection } from './WalletConnection';
import { LoadingSpinner } from './LoadingSpinner';
import { CollapsibleSidebar } from './CollapsibleSidebar';
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { login, logout, ready, authenticated, user } = usePrivy();
  const router = useRouter();

  const handleLogin = () => {
    login();
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
      {/* Minimal Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                {/* Cute Chimera Logo */}
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
                    <span className="text-xl">🦄</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-xl font-bold text-gray-800 tracking-tight">
                  Chimera
                </span>
              </Link>
            </div>

            {/* Right Side: Auth & Wallet */}
            <div className="flex items-center space-x-4">
              {authenticated ? (
                <>
                  <WalletConnection />
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center shadow-lg">
                      <span className="text-sm font-medium text-white">
                        {user?.google?.name?.charAt(0) || user?.email?.address?.charAt(0) || '?'}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="bg-white hover:bg-gray-50 text-gray-800 px-6 py-2.5 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg border border-gray-200 hover:shadow-gray-300/50"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>

          {/* Mobile Auth */}
          {!authenticated && (
            <div className="md:hidden mt-4 pb-3">
              <button
                onClick={handleLogin}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-full font-medium transition-all duration-200 border border-gray-200 shadow-lg"
              >
                Connect Wallet
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* Collapsible Sidebar */}
      <CollapsibleSidebar />

      {/* Main Content */}
      <main className="flex-1 transition-all duration-300">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="bg-slate-800/90 backdrop-blur-sm border-t border-slate-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-slate-400">
            <div>
              Built with ❤️ using Scaffold-ETH 2 | Secured by Oasis | Powered by The Graph
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};