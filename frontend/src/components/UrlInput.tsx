import React, { useState, useEffect } from 'react';
import { Clipboard } from 'lucide-react';

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onAnalyze, isLoading }) => {
  const [url, setUrl] = useState('');
  const [checked, setChecked] = useState(false);

  // Reset checked state when loading completes
  useEffect(() => {
    if (!isLoading) {
      setChecked(false);
    }
  }, [isLoading]);

  // Helper: Detect platform brand
  const getBrandedInputBorder = () => {
    const cleanUrl = url.toLowerCase();
    if (cleanUrl.includes('instagram.com')) return 'focus:border-pink-500 focus:ring-pink-500/30';
    if (cleanUrl.includes('tiktok.com')) return 'focus:border-cyan-400 focus:ring-cyan-400/30';
    if (cleanUrl.includes('facebook.com')) return 'focus:border-blue-500 focus:ring-blue-500/30';
    return 'focus:border-[#00f2fe] focus:ring-[#00f2fe]/30';
  };

  const processAnalysis = (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    const cleanUrl = trimmed.toLowerCase();

    // Basic check for supported domains (case-insensitive)
    const isSupported = 
      cleanUrl.includes('instagram.com') || 
      cleanUrl.includes('tiktok.com') || 
      cleanUrl.includes('facebook.com') ||
      cleanUrl.includes('fb.watch') ||
      cleanUrl.includes('fb.com');

    if (!trimmed || !isSupported) {
      // Empty or invalid URL: Do absolutely nothing
      return;
    }

    // Valid URL: slide ON and turn light ON immediately
    setChecked(true);

    // Start the analysis immediately in parallel with the slide animation
    onAnalyze(trimmed);
  };

  const handleToggleClick = () => {
    if (isLoading) return;
    processAnalysis(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    processAnalysis(url);
  };

  const handleClipboardPaste = async () => {
    if (isLoading) return;
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        alert('Clipboard access is only supported over secure connections (HTTPS) or localhost. Please paste your link manually.');
        return;
      }
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        processAnalysis(text);
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
      alert('Unable to read clipboard. Please make sure paste permissions are granted or paste your link manually.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-6 w-full">
      <div className="relative w-full">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          placeholder="Paste Instagram, Facebook, or TikTok link..."
          className={`w-full bg-black/40 border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-white text-sm focus:outline-none focus:ring-1 transition-all placeholder-gray-500 ${getBrandedInputBorder()}`}
        />
        
        {/* Paste Clipboard Button */}
        {!isLoading && (
          <button
            type="button"
            onClick={handleClipboardPaste}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            title="Paste from clipboard"
          >
            <Clipboard className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 mt-2">
        {/* Toggle Button Track styled as a clickable button to avoid iOS label double-click bugs */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleToggleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggleClick();
            }
          }}
          className={`toggle-track w-[220px] h-[110px] flex items-center p-2 outline-none select-none ${(checked || isLoading) ? 'checked' : ''} ${isLoading ? 'pointer-events-none opacity-90' : 'cursor-pointer'}`}
          data-purpose="toggle-ui"
        >
          {/* Glowing status light */}
          <div aria-hidden="true" className={`indicator-light ${isLoading ? 'loading' : ''}`}></div>
          {/* Moving Handle */}
          <div className="toggle-handle w-[100px] h-[94px] ml-1 flex items-center justify-end pr-4" data-purpose="toggle-slider">
            {/* The vertical slot/line detail found on the original image */}
            <div className="handle-detail"></div>
          </div>
        </div>
        
        {/* Optional Label Text */}
        <p className="text-zinc-500 font-medium tracking-widest text-[10px] uppercase select-none mt-1">
          {isLoading ? 'Analyzing System...' : 'Swipe to Analyze'}
        </p>
      </div>
    </form>
  );
};
