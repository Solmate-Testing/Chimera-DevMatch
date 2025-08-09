"use client";

/**
 * Test component to verify pixelized creator avatars are working
 * This can be temporarily added to any page to test the avatar system
 */

import React from 'react';
import { generateCreatorProfile } from '../utils/avatarGenerator';

const testAgents = [
  { id: "1", name: "AI Tech Bot", description: "Advanced AI technology assistant for coding", tags: ["AI", "Tech", "Coding"] },
  { id: "2", name: "Crypto Trader", description: "Professional trading bot for cryptocurrency markets", tags: ["Trading", "Finance", "Crypto"] },
  { id: "3", name: "Creative Designer", description: "Artistic AI for creative design and content", tags: ["Creative", "Art", "Design"] },
  { id: "4", name: "Data Analyst", description: "Data research and analytics specialist", tags: ["Data", "Analytics", "Research"] },
  { id: "5", name: "Gaming Bot", description: "Entertainment and gaming assistance", tags: ["Gaming", "Entertainment", "Fun"] },
  { id: "6", name: "General Assistant", description: "Versatile AI helper for various tasks", tags: ["Assistant", "General"] },
];

export const CreatorAvatarTest: React.FC = () => {
  const profiles = testAgents.map(agent => generateCreatorProfile(agent, BigInt(1000000000000000000)));

  return (
    <div className="p-8 bg-slate-900">
      <h2 className="text-2xl font-bold text-white mb-6">Creator Avatar Test</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {profiles.map((profile, index) => (
          <div key={profile.id} className="bg-slate-800 rounded-lg p-4 text-center">
            <img
              src={profile.avatar.url}
              alt={profile.name}
              className="w-20 h-20 rounded-full mx-auto mb-2 object-cover"
              onError={(e) => {
                console.error(`Failed to load image: ${profile.avatar.url}`);
                (e.target as HTMLImageElement).src = '/creators/creator1.png'; // Fallback
              }}
            />
            <h3 className="text-white text-sm font-medium">{profile.name}</h3>
            <p className="text-slate-400 text-xs mt-1">{profile.avatar.style}</p>
            <p className="text-slate-500 text-xs">Image: creator{index + 1}.png</p>
          </div>
        ))}
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-bold text-white mb-4">Individual Creator Images</h3>
        <div className="grid grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(num => (
            <div key={num} className="bg-slate-800 rounded-lg p-4 text-center">
              <img
                src={`/creators/creator${num}.png`}
                alt={`Creator ${num}`}
                className="w-20 h-20 rounded-full mx-auto mb-2 object-cover"
                onError={() => console.error(`Failed to load creator${num}.png`)}
              />
              <p className="text-white text-sm">Creator {num}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreatorAvatarTest;