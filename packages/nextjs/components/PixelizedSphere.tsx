"use client";

import React, { useState, useEffect, useRef } from "react";

interface PixelizedSphereProps {
  onShatter: (role: 'creator' | 'user') => void;
}

export const PixelizedSphere: React.FC<PixelizedSphereProps> = ({ onShatter }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isShattered, setIsShattered] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'creator' | 'user' | null>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for eye movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate relative position for eye movement
        const maxMovement = 20;
        const relativeX = ((e.clientX - centerX) / (rect.width / 2)) * maxMovement;
        const relativeY = ((e.clientY - centerY) / (rect.height / 2)) * maxMovement;
        
        setMousePos({
          x: Math.max(-maxMovement, Math.min(maxMovement, relativeX)),
          y: Math.max(-maxMovement, Math.min(maxMovement, relativeY))
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000 + Math.random() * 2000); // Random blink every 3-5 seconds

    return () => clearInterval(blinkInterval);
  }, []);

  // Handle role selection and shatter animation
  const handleRoleClick = (role: 'creator' | 'user', event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedRole(role);
    setIsShattered(true);
    
    // Delay navigation to show shatter animation
    setTimeout(() => {
      onShatter(role);
    }, 800);
  };

  // Generate LEGO pieces for shatter effect
  const generateLegoPixels = () => {
    const pixels = [];
    const colors = [
      'bg-yellow-400', 'bg-yellow-500', 'bg-yellow-600', 'bg-amber-400',
      'bg-amber-500', 'bg-orange-400', 'bg-orange-500', 'bg-yellow-300'
    ];

    for (let i = 0; i < 64; i++) {
      const row = Math.floor(i / 8);
      const col = i % 8;
      const delay = Math.random() * 500;
      const xOffset = (Math.random() - 0.5) * 800;
      const yOffset = (Math.random() - 0.5) * 600;
      const rotation = Math.random() * 720;
      
      pixels.push(
        <div
          key={i}
          className={`absolute w-8 h-8 ${colors[i % colors.length]} rounded-sm shadow-lg transform transition-all duration-1000 ease-out ${
            isShattered 
              ? `translate-x-[${xOffset}px] translate-y-[${yOffset}px] rotate-[${rotation}deg] opacity-0 scale-50`
              : 'translate-x-0 translate-y-0 rotate-0 opacity-100 scale-100'
          }`}
          style={{
            left: `${col * 32 + 16}px`,
            top: `${row * 32 + 16}px`,
            transitionDelay: `${delay}ms`,
            transform: isShattered 
              ? `translate(${xOffset}px, ${yOffset}px) rotate(${rotation}deg) scale(0.5)`
              : 'translate(0, 0) rotate(0) scale(1)'
          }}
        >
          {/* LEGO stud on top */}
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white/20 rounded-full"></div>
        </div>
      );
    }
    return pixels;
  };

  return (
    <div ref={containerRef} className="relative flex items-center justify-center">
      {/* Main Sphere Container */}
      <div
        ref={sphereRef}
        className={`relative w-96 h-96 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 shadow-2xl transform transition-all duration-500 ${
          isShattered ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 1))',
          boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Pixelated overlay effect */}
        <div className="absolute inset-0 rounded-full opacity-20 bg-gradient-to-br from-transparent to-black"></div>
        
        {/* Eyes Container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex space-x-16">
            {/* Left Eye */}
            <div className="relative">
              <div 
                className={`w-16 h-16 bg-white rounded-full shadow-inner transition-all duration-200 ${
                  isBlinking ? 'h-2' : 'h-16'
                }`}
              >
                {!isBlinking && (
                  <div
                    className="absolute w-10 h-10 bg-black rounded-full transition-transform duration-100 ease-out"
                    style={{
                      transform: `translate(${3 + mousePos.x * 0.15}px, ${3 + mousePos.y * 0.15}px)`,
                    }}
                  >
                    {/* Pupil highlight */}
                    <div className="absolute top-2 left-2 w-3 h-3 bg-white rounded-full opacity-80"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Eye */}
            <div className="relative">
              <div 
                className={`w-16 h-16 bg-white rounded-full shadow-inner transition-all duration-200 ${
                  isBlinking ? 'h-2' : 'h-16'
                }`}
              >
                {!isBlinking && (
                  <div
                    className="absolute w-10 h-10 bg-black rounded-full transition-transform duration-100 ease-out"
                    style={{
                      transform: `translate(${3 + mousePos.x * 0.15}px, ${3 + mousePos.y * 0.15}px)`,
                    }}
                  >
                    {/* Pupil highlight */}
                    <div className="absolute top-2 left-2 w-3 h-3 bg-white rounded-full opacity-80"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Smiling mouth - Black filled */}
        <div className="absolute inset-0 flex items-end justify-center pb-24">
          <div className="w-20 h-10 bg-black rounded-full opacity-90"></div>
        </div>

        {/* Glowing aura */}
        <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-yellow-400/30 to-yellow-500/30 blur-xl animate-pulse"></div>
      </div>

      {/* LEGO Pixels for Shatter Effect */}
      {isShattered && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64">
            {generateLegoPixels()}
          </div>
        </div>
      )}

      {/* Role Selection Invisible Buttons Overlay */}
      {!isShattered && (
        <>
          {/* Creator Area (Left side) */}
          <button
            onClick={(e) => handleRoleClick('creator', e)}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 w-48 h-96 opacity-0 hover:opacity-10 bg-blue-500 rounded-l-full transition-opacity duration-300"
            aria-label="Choose Creator Role"
          />
          
          {/* User Area (Right side) */}
          <button
            onClick={(e) => handleRoleClick('user', e)}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 w-48 h-96 opacity-0 hover:opacity-10 bg-purple-500 rounded-r-full transition-opacity duration-300"
            aria-label="Choose User Role"
          />
        </>
      )}
    </div>
  );
};