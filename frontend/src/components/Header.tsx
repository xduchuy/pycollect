import React from 'react';
import { Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="relative z-10" data-purpose="header-section">
      <h1 className="text-white text-3xl sm:text-4xl font-semibold tracking-tight">Media Collector</h1>
      <div className="flex items-center mt-2 space-x-2 text-gray-400">
        <Sparkles className="w-4 h-4 text-[#ff5e00]" />
        <span className="text-[10px] sm:text-xs font-medium tracking-wide uppercase">Instagram • Facebook • TikTok</span>
      </div>
    </header>
  );
};
