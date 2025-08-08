"use client";

import { ProductForm } from "../components/Productform";
import { GaslessStaking } from "../components/GaslessStaking";
import { RealtimeRankings } from "../components/RealtimeRankings";
import { GaslessVerification } from "../components/GaslessVerification";
import { VerificationTest } from "../components/VerificationTest";
import { ModelExecution } from "../components/ModelExecution";

export default function Home() {
  // Mock product for staking demo
  const mockProduct = {
    id: '1',
    name: 'GPT-4 Trading Bot',
    category: 'Copy Trading Bot',
    totalStaked: '5000000000000000000', // 5 ETH
    loves: 12,
    creator: '0x1234567890123456789012345678901234567890',
    price: '100000000000000000', // 0.1 ETH
    description: 'Advanced AI trading bot with GPT-4 intelligence for crypto markets'
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* ✅ HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🤖 Chimera DevMatch
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Decentralized AI Marketplace with Gasless Transactions
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>🔐 Oasis ROFL-Sapphire Security</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>⚡ Gasless via Biconomy</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>📊 Real-time Analytics</span>
            </div>
          </div>
        </div>

        {/* ✅ VERIFICATION TEST */}
        <div className="mb-8">
          <VerificationTest />
        </div>

        {/* ✅ MAIN CONTENT GRID */}
        <div className="space-y-8">
          {/* ✅ GASLESS PRODUCT FORM */}
          <section>
            <ProductForm />
          </section>

          {/* ✅ TWO COLUMN LAYOUT */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* ✅ LEFT COLUMN: STAKING */}
            <section>
              <h2 className="text-2xl font-bold mb-4">💰 Gasless Staking Demo</h2>
              <GaslessStaking 
                product={mockProduct}
                userStake="0"
                onStakeSuccess={(productId, amount) => {
                  console.log(`Staked ${amount} ETH on product ${productId}`);
                }}
              />
            </section>

            {/* ✅ RIGHT COLUMN: VERIFICATION */}
            <section>
              <h2 className="text-2xl font-bold mb-4">🧪 Gasless Verification</h2>
              <GaslessVerification />
            </section>
          </div>

          {/* ✅ AI MODEL EXECUTION */}
          <section>
            <h2 className="text-2xl font-bold mb-4">🤖 Chainlink Functions AI Execution</h2>
            <ModelExecution 
              product={mockProduct}
              userStake="1000000000000000000" // 1 ETH staked
            />
          </section>

          {/* ✅ FULL WIDTH: REAL-TIME RANKINGS */}
          <section>
            <RealtimeRankings />
          </section>

          {/* ✅ FOOTER */}
          <div className="mt-16 p-6 bg-white rounded-lg shadow text-center">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                🚀 Complete Gasless Experience
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-900 mb-2">📱 Web2 Onboarding</div>
                  <div className="text-blue-700 space-y-1">
                    <div>✅ Google OAuth login</div>
                    <div>✅ Auto smart wallet creation</div>
                    <div>✅ No crypto knowledge required</div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-900 mb-2">⚡ Gasless Transactions</div>
                  <div className="text-green-700 space-y-1">
                    <div>✅ No MetaMask popups</div>
                    <div>✅ "Paid by DApp" in explorer</div>
                    <div>✅ &lt; 15 second completion</div>
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="font-medium text-purple-900 mb-2">🔒 Enterprise Security</div>
                  <div className="text-purple-700 space-y-1">
                    <div>✅ TEE-protected API keys</div>
                    <div>✅ Client-side encryption</div>
                    <div>✅ Zero key exposure</div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200 text-gray-500 text-xs">
                🔗 <strong>Powered by:</strong> Privy + Biconomy + Oasis ROFL-Sapphire + The Graph
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}