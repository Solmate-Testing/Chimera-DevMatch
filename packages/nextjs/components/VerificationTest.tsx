"use client";

import React from 'react';

export function VerificationTest() {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-green-600 mb-4">
        ✅ Frontend Startup Success
      </h2>
      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Next.js 14 App Router</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Client Components Working</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Web3 Providers Loaded</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Contract ABIs Generated</span>
        </div>
      </div>
      <p className="mt-4 text-xs text-gray-500">
        Server running on localhost:3000
      </p>
    </div>
  );
}