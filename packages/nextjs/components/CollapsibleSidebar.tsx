"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  CubeIcon,
  ShoppingBagIcon,
  UserIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

export const CollapsibleSidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "Marketplace", href: "/marketplace", icon: ShoppingBagIcon },
    { name: "Creator", href: "/creator-dashboard", icon: ChartBarIcon },
    { name: "Upload", href: "/upload", icon: CloudArrowUpIcon },
    { name: "Mint NFT", href: "/mint-nft", icon: CubeIcon },
    { name: "Profile", href: "/profile", icon: UserIcon },
    { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
    { name: "Help", href: "/help", icon: QuestionMarkCircleIcon },
  ];

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-16 h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 z-40 transform transition-all duration-300 ease-in-out shadow-lg ${
          isExpanded ? "w-64 translate-x-0" : "w-16 -translate-x-12"
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Sidebar Content */}
        <div className="flex flex-col h-full pt-4">
          <nav className="flex-1 px-2 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gray-100 text-gray-800 border border-gray-300"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <item.icon
                    className={`h-6 w-6 flex-shrink-0 transition-colors duration-200 ${
                      isActive ? "text-gray-800" : "text-gray-500 group-hover:text-gray-800"
                    }`}
                  />
                  <span
                    className={`ml-3 transition-all duration-300 ${
                      isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                    }`}
                  >
                    {item.name}
                  </span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-800 rounded-r-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center shadow-sm">
                <span className="text-xl">🦄</span>
              </div>
              <div
                className={`transition-all duration-300 ${
                  isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                }`}
              >
                <div className="text-sm font-medium text-gray-800">Chimera AI</div>
                <div className="text-xs text-gray-600">v1.0.0</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Trigger Area */}
      <div
        className="fixed left-0 top-16 w-4 h-full z-50 cursor-pointer"
        onMouseEnter={() => setIsExpanded(true)}
      >
        {/* Visual indicator */}
        <div className={`h-full w-1 bg-gray-300 transition-all duration-300 ${
          isExpanded ? "opacity-0" : "opacity-100"
        }`}></div>
      </div>
    </>
  );
};