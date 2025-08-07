import React, { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { usePrivyWagmiConnector } from "../hooks/usePrivyWagmiConnector";
import { Heart, TrendingUp, Users } from "lucide-react";

const GET_PRODUCTS = gql`
  query GetProducts($category: String) {
    products(
      where: { category_contains: $category }
      orderBy: totalStaked
      orderDirection: desc
    ) {
      id
      name
      description
      category
      creator
      totalStaked
      loves
      createdAt
    }
  }
`;

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  creator: string;
  totalStaked: string;
  loves: number;
  createdAt: string;
}

const calculateRankingScore = (product: Product) => {
  const baseScore = Number(product.totalStaked) / 1e18;
  const socialBoost = product.loves * 0.1;
  const timeDecay = Math.exp(-(Date.now() - Number(product.createdAt) * 1000) / (7 * 24 * 60 * 60 * 1000));
  return (baseScore + socialBoost) * timeDecay;
};

export const Marketplace: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { smartAccount, isConnected } = usePrivyWagmiConnector();
  
  const { loading, error, data } = useQuery(GET_PRODUCTS, {
    variables: { category: selectedCategory },
    pollInterval: 30000, // Update every 30 seconds
  });

  const handleStake = async (productId: string, stakeAmount: string) => {
    if (!smartAccount || !isConnected) return;
    
    try {
      // Implementation for staking
      console.log(`Staking ${stakeAmount} ETH on product ${productId}`);
      // Add actual staking logic here
    } catch (error) {
      console.error("Staking failed:", error);
    }
  };

  const categories = ["All", "AI Agent", "MCP", "Copy Trading Bot"];

  if (loading) return <div className="p-6">Loading products...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">AI Marketplace</h1>
        <p className="text-gray-600">Discover and use AI agents, MCPs, and trading bots</p>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category === "All" ? "" : category)}
              className={`px-4 py-2 rounded-lg ${
                selectedCategory === (category === "All" ? "" : category)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.products.map((product: Product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{product.name}</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {product.category}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{product.description}</p>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  <TrendingUp size={16} className="text-green-600" />
                  <span className="text-sm">
                    {(Number(product.totalStaked) / 1e18).toFixed(3)} ETH
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Heart size={16} className="text-red-600" />
                  <span className="text-sm">{product.loves}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Users size={16} className="text-blue-600" />
                  <span className="text-sm">
                    Score: {calculateRankingScore(product).toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStake(product.id, "0.01")}
                  disabled={!isConnected}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Use (0.01 ETH)
                </button>
                
                <button className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300">
                  <Heart size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(!data?.products || data.products.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found in this category</p>
        </div>
      )}
    </div>
  );
};