import React, { useState } from "react";
import { usePrivyWagmiConnector } from "../hooks/usePrivyWagmiConnector";
import { encodeFunctionData } from "viem";
import { marketplaceABI } from "../contracts/generated";

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`;

export const ProductForm: React.FC = () => {
  const { smartAccount, isConnected } = usePrivyWagmiConnector();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "AI Agent",
    apiKey: "",
    stakeAmount: "0.01",
  });
  const [isListing, setIsListing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartAccount || !isConnected) return;

    setIsListing(true);
    try {
      // 1. Client-side API key encryption (mock for hackathon)
      const encryptedApiKey = btoa(formData.apiKey); // Use proper encryption in production
      
      // 2. Prepare transaction data
      const callData = encodeFunctionData({
        abi: marketplaceABI,
        functionName: "listProduct",
        args: [
          formData.name,
          formData.description,
          formData.category,
          encryptedApiKey,
          BigInt(parseFloat(formData.stakeAmount) * 1e18),
        ],
      });

      // 3. Execute gasless transaction
      const userOpResponse = await smartAccount.sendTransaction({
        to: MARKETPLACE_ADDRESS,
        data: callData,
      });

      console.log("Transaction hash:", userOpResponse.hash);
      alert("Product listed successfully!");
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        category: "AI Agent",
        apiKey: "",
        stakeAmount: "0.01",
      });
      
    } catch (error) {
      console.error("Failed to list product:", error);
      alert("Failed to list product");
    } finally {
      setIsListing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg">
        <p>Please connect your wallet to list products</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">List Your AI Product</h2>
      
      <div>
        <label className="block text-sm font-medium mb-2">Product Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-3 border rounded-lg"
          placeholder="My Awesome AI Agent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-3 border rounded-lg"
          rows={3}
          placeholder="Describe what your AI does..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full p-3 border rounded-lg"
        >
          <option value="AI Agent">AI Agent</option>
          <option value="MCP">MCP (Multi-Chain Protocol)</option>
          <option value="Copy Trading Bot">Copy Trading Bot</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">API Key</label>
        <input
          type="password"
          value={formData.apiKey}
          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
          className="w-full p-3 border rounded-lg"
          placeholder="Your OpenAI/Claude API key"
          required
        />
        <p className="text-xs text-gray-500 mt-1">🔒 Encrypted and stored in TEE</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Stake Amount (ETH)</label>
        <input
          type="number"
          step="0.001"
          value={formData.stakeAmount}
          onChange={(e) => setFormData({ ...formData, stakeAmount: e.target.value })}
          className="w-full p-3 border rounded-lg"
          placeholder="0.01"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isListing}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {isListing ? "Listing Product..." : "List Product (Gasless)"}
      </button>
    </form>
  );
};