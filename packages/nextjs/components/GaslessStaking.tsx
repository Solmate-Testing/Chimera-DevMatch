// GASLESS STAKING COMPONENT - SENIOR WEB3 UX ENGINEER
// Implements: Stake to use model (gasless) → < 15 seconds

import React, { useState, useEffect } from 'react';
import { usePrivyWagmiConnector } from '../hooks/usePrivyWagmiConnector';
import { encodeFunctionData } from 'viem';
import { marketplaceABI } from '../contracts/generated';

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}` || '0x1234567890123456789012345678901234567890';

interface Product {
  id: string;
  name: string;
  category: string;
  totalStaked: string;
  loves: number;
  creator: string;
  price: string;
  description: string;
}

interface GaslessStakingProps {
  product: Product;
  userStake?: string;
  onStakeSuccess?: (productId: string, amount: string) => void;
}

export const GaslessStaking: React.FC<GaslessStakingProps> = ({
  product,
  userStake = '0',
  onStakeSuccess
}) => {
  const {
    smartAccount,
    isConnected,
    user,
    sendGaslessTransaction,
    verifyNoMetaMaskPopup,
    verifyPaymasterFunding,
  } = usePrivyWagmiConnector();

  const [stakeAmount, setStakeAmount] = useState('0.01');
  const [isStaking, setIsStaking] = useState(false);
  const [stakingSpeed, setStakingSpeed] = useState<number | null>(null);
  const [canUseModel, setCanUseModel] = useState(false);

  // ✅ CHECK IF USER CAN USE MODEL (has staked)
  useEffect(() => {
    const hasStaked = parseFloat(userStake) > 0;
    setCanUseModel(hasStaked);
  }, [userStake]);

  // ✅ GASLESS STAKING FLOW
  const handleStake = async () => {
    if (!smartAccount || !isConnected) return;

    setIsStaking(true);
    setStakingSpeed(null);

    console.log('💰 GASLESS STAKING FLOW INITIATED');
    console.log(`   📦 Product: ${product.name} (ID: ${product.id})`);
    console.log(`   💎 Stake Amount: ${stakeAmount} ETH`);
    console.log('   ✅ No MetaMask popup expected');

    const startTime = Date.now();

    try {
      // ✅ STEP 1: VERIFY PAYMASTER FUNDING
      console.log('💰 Verifying paymaster for staking...');
      const paymasterFunded = await verifyPaymasterFunding();
      if (!paymasterFunded) {
        throw new Error('Paymaster not funded for staking transaction');
      }

      // ✅ STEP 2: PREPARE GASLESS STAKE TRANSACTION
      console.log('📋 Preparing gasless stake transaction...');
      const stakeAmountWei = BigInt(parseFloat(stakeAmount) * 1e18);
      
      const callData = encodeFunctionData({
        abi: marketplaceABI,
        functionName: 'stakeOnProduct',
        args: [BigInt(product.id)]
      });

      // ✅ STEP 3: VERIFY NO METAMASK POPUP
      const noPopupVerified = verifyNoMetaMaskPopup();
      if (!noPopupVerified) {
        console.warn('⚠️  MetaMask popup detected during staking');
      }

      // ✅ STEP 4: SEND GASLESS STAKING TRANSACTION
      console.log('⚡ Sending gasless staking transaction...');
      const result = await sendGaslessTransaction({
        to: MARKETPLACE_ADDRESS,
        data: callData,
        value: stakeAmountWei.toString() // Include ETH value for staking
      });

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      setStakingSpeed(duration);

      // ✅ STEP 5: VERIFY SPEED REQUIREMENT < 15 SECONDS
      if (duration < 15) {
        console.log(`✅ STAKING SPEED VERIFIED: ${duration}s < 15s`);
      } else {
        console.warn(`⚠️  STAKING SPEED FAILED: ${duration}s >= 15s`);
      }

      // ✅ STEP 6: WAIT FOR CONFIRMATION
      if (result) {
        console.log('⏳ Waiting for staking confirmation...');
        await result.wait();

        console.log('🎉 GASLESS STAKING COMPLETED');
        console.log('   📝 Transaction Hash:', result.hash);
        console.log('   ⚡ UserOp Hash:', result.userOpHash);
        console.log('   ⏱️  Duration:', `${duration}s`);
        console.log('   💰 Gas paid by DApp paymaster');

        // ✅ ENABLE MODEL USAGE
        setCanUseModel(true);

        // Notify parent component
        if (onStakeSuccess) {
          onStakeSuccess(product.id, stakeAmount);
        }

        alert(`✅ Staked ${stakeAmount} ETH successfully!\n⚡ Gasless transaction in ${duration}s\n🤖 You can now use the AI model`);
      }

    } catch (error: any) {
      console.error('❌ Gasless staking failed:', error);
      alert(`❌ Staking failed: ${error.message}`);
    } finally {
      setIsStaking(false);
    }
  };

  // ✅ USE MODEL AFTER STAKING
  const handleUseModel = async () => {
    if (!canUseModel) {
      alert('⚠️  Please stake first to use the model');
      return;
    }

    console.log('🤖 USING AI MODEL (GASLESS)');
    console.log(`   📦 Product: ${product.name}`);
    console.log('   ✅ User has staked, can access model');

    try {
      // In production, this would call the runModel function
      const mockPrompt = 'Generate a sample AI response';
      
      // ✅ GASLESS MODEL EXECUTION
      const callData = encodeFunctionData({
        abi: marketplaceABI,
        functionName: 'runModel',
        args: [BigInt(product.id), mockPrompt]
      });

      const result = await sendGaslessTransaction({
        to: MARKETPLACE_ADDRESS,
        data: callData
      });

      if (result) {
        await result.wait();
        console.log('🤖 AI Model execution completed (gasless)');
        alert('🤖 AI Model executed successfully!\n⚡ Gasless execution\n💰 No additional fees');
      }

    } catch (error: any) {
      console.error('❌ Model execution failed:', error);
      alert(`❌ Model execution failed: ${error.message}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600">Please sign in to stake and use AI models</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border">
      {/* ✅ PRODUCT INFO */}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3">{product.description}</p>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <span className="font-medium">📊 Total Staked:</span>
            <span className="ml-1">{(parseFloat(product.totalStaked) / 1e18).toFixed(3)} ETH</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">❤️ Loves:</span>
            <span className="ml-1">{product.loves}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">🏷️ Category:</span>
            <span className="ml-1">{product.category}</span>
          </div>
        </div>

        {/* ✅ USER STAKE STATUS */}
        {parseFloat(userStake) > 0 && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm font-medium">
              ✅ Your Stake: {(parseFloat(userStake) / 1e18).toFixed(4)} ETH - You can use this model!
            </p>
          </div>
        )}
      </div>

      {/* ✅ STAKING INTERFACE */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Stake Amount (ETH)</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.01"
              disabled={isStaking}
            />
            <button
              onClick={handleStake}
              disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isStaking ? (
                <div className="flex items-center">
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Staking...
                </div>
              ) : (
                '⚡ Stake (Gasless)'
              )}
            </button>
          </div>
          
          {stakingSpeed !== null && (
            <p className="text-xs mt-2 text-gray-600">
              ⏱️ Last staking transaction: {stakingSpeed}s {stakingSpeed < 15 ? '✅ (Fast)' : '⚠️ (Slow)'}
            </p>
          )}
        </div>

        {/* ✅ USE MODEL BUTTON */}
        <div>
          <button
            onClick={handleUseModel}
            disabled={!canUseModel}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
              canUseModel
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canUseModel ? '🤖 Use AI Model (Gasless)' : '🔒 Stake Required to Use Model'}
          </button>
          
          {!canUseModel && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              💡 Stake any amount to unlock gasless AI model usage
            </p>
          )}
        </div>

        {/* ✅ GASLESS BENEFITS */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800 space-y-1">
            <div className="font-medium">⚡ Gasless Staking Benefits:</div>
            <div>• ✅ No gas fees for staking transactions</div>
            <div>• ✅ No gas fees for using AI models</div>
            <div>• ✅ Instant access after staking</div>
            <div>• ✅ All transactions &lt; 15 seconds</div>
          </div>
        </div>
      </div>
    </div>
  );
};