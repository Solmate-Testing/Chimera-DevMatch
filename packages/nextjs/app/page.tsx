"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PixelizedSphere } from "../components/PixelizedSphere";

export default function Home() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleRoleSelection = (role: 'creator' | 'user') => {
    if (role === 'creator') {
      router.push('/creator-dashboard');
    } else {
      router.push('/marketplace');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white overflow-hidden">
      {/* Central Content Area */}
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
        {/* Pixelized Sphere with Eye Tracking */}
        <div className="relative mb-16">
          <PixelizedSphere onShatter={(role) => handleRoleSelection(role)} />
        </div>

        {/* Role Selection Buttons */}
        <div className="flex items-center space-x-12 mb-8">
          <button
            onClick={() => handleRoleSelection('creator')}
            className="group relative px-8 py-4 bg-white text-gray-800 rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-gray-300/50 transform hover:scale-105 transition-all duration-300 border border-gray-200"
            onMouseEnter={() => setSelectedRole('creator')}
            onMouseLeave={() => setSelectedRole(null)}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🎨</span>
              <span>I'm a Creator</span>
            </div>
            <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </button>

          <button
            onClick={() => handleRoleSelection('user')}
            className="group relative px-8 py-4 bg-white text-gray-800 rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-gray-300/50 transform hover:scale-105 transition-all duration-300 border border-gray-200"
            onMouseEnter={() => setSelectedRole('user')}
            onMouseLeave={() => setSelectedRole(null)}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">👤</span>
              <span>I'm a User</span>
            </div>
            <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-slate-400 text-center max-w-2xl text-lg leading-relaxed">
          Where every creator represents a pixel that builds our AI-powered world.
          <br />
          <span className="text-slate-500 text-sm">Choose your path and let's build together.</span>
        </p>
      </div>
    </main>
  );
}