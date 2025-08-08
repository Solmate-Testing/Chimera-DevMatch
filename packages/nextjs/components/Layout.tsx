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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Upload Agent', href: '/upload', icon: CloudArrowUpIcon },
    { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  ];

  const handleLogin = () => {
    login();
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                  <RocketLaunchIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  Chimera DevMatch
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors duration-200"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Desktop Auth & Wallet */}
            <div className="hidden md:flex items-center space-x-4">
              {authenticated ? (
                <>
                  <WalletConnection />
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user?.google?.name?.charAt(0) || user?.email?.address?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="text-sm text-slate-300">
                        {user?.google?.name || user?.email?.address?.split('@')[0] || 'User'}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                >
                  Login with Google/Email
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="text-slate-300 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-700 pt-4 pb-3">
              <div className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
              
              <div className="border-t border-slate-700 mt-3 pt-3">
                {authenticated ? (
                  <div className="space-y-3">
                    <div className="px-3">
                      <WalletConnection />
                    </div>
                    <div className="flex items-center px-3 py-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-white">
                          {user?.google?.name?.charAt(0) || user?.email?.address?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          {user?.google?.name || user?.email?.address?.split('@')[0] || 'User'}
                        </div>
                        <button
                          onClick={handleLogout}
                          className="text-xs text-slate-400 hover:text-white transition-colors duration-200"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-3">
                    <button
                      onClick={handleLogin}
                      className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    >
                      Login with Google/Email
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer with Hackathon Track Badges */}
      <footer className="bg-slate-800/90 backdrop-blur-sm border-t border-slate-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Ethereum Foundation Track */}
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">Ξ</span>
                </div>
                <h3 className="text-sm font-semibold text-blue-300">Ethereum Foundation Track</h3>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div>✅ ERC-4337 Gasless Transactions</div>
                <div>✅ The Graph Subgraph Analytics</div>
                <div>✅ Web3 Beginner Onboarding</div>
              </div>
            </div>

            {/* Oasis Network Track */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">⚡</span>
                </div>
                <h3 className="text-sm font-semibold text-purple-300">Oasis Network Track</h3>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div>✅ ROFL-Sapphire TEE Security</div>
                <div>✅ Encrypted API Key Storage</div>
                <div>✅ Private Agent Access Control</div>
              </div>
            </div>

            {/* Additional Features */}
            <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg p-4 border border-green-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">🚀</span>
                </div>
                <h3 className="text-sm font-semibold text-green-300">Hackathon Features</h3>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div>✅ Privy Google OAuth Integration</div>
                <div>✅ Chainlink Functions AI Execution</div>
                <div>✅ Real-time Rankings & Analytics</div>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 border-t border-slate-700 pt-4">
            <div className="mb-2">
              🔗 <strong>Powered by:</strong> Privy • Biconomy • Oasis ROFL-Sapphire • The Graph • Chainlink Functions
            </div>
            <div>
              Built for Web3 Hackathon - Decentralized AI Marketplace with Gasless UX
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};