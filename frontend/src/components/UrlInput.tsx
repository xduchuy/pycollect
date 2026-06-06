import React, { useState } from 'react';

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onAnalyze, isLoading }) => {
  const [url, setUrl] = useState('');
  const [shouldShake, setShouldShake] = useState(false);

  // Helper: Detect platform brand
  const getBrandedInputBorder = () => {
    const cleanUrl = url.toLowerCase();
    if (cleanUrl.includes('instagram.com')) return 'focus:border-pink-500 focus:ring-pink-500/30';
    if (cleanUrl.includes('tiktok.com')) return 'focus:border-cyan-400 focus:ring-cyan-400/30';
    if (cleanUrl.includes('facebook.com')) return 'focus:border-blue-500 focus:ring-blue-500/30';
    return 'focus:border-[#00f2fe] focus:ring-[#00f2fe]/30';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    const cleanUrl = trimmed.toLowerCase();

    // Basic check for supported domains (case-insensitive)
    const isSupported = 
      cleanUrl.includes('instagram.com') || 
      cleanUrl.includes('tiktok.com') || 
      cleanUrl.includes('facebook.com') ||
      cleanUrl.includes('fb.watch') ||
      cleanUrl.includes('fb.com');

    if (!trimmed || !isSupported) {
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
      return;
    }

    onAnalyze(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className={`${shouldShake ? 'shake-input' : ''}`}>
      <div className="flex space-x-2 w-full">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          placeholder="Paste Instagram, Facebook, or TikTok link..."
          className={`flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 transition-all placeholder-gray-500 ${getBrandedInputBorder()}`}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 rounded-lg text-white font-semibold bg-gradient-to-r from-[#4facfe] via-[#00f2fe] to-[#f9d423] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center shadow-md shadow-[#00f2fe]/10 disabled:opacity-40 whitespace-nowrap text-sm"
        >
          {isLoading ? '...' : 'Analyze'}
        </button>
      </div>
    </form>
  );
};
