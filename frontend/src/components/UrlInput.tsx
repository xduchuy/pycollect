import React, { useState, useEffect } from 'react';
import { Clipboard, Settings } from 'lucide-react';

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onAnalyze, isLoading }) => {
  const [url, setUrl] = useState('');
  const [checked, setChecked] = useState(false);
  const [cookie, setCookie] = useState(() => localStorage.getItem('mcollect_instagram_cookie') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [hasClipboard, setHasClipboard] = useState(false);

  // Detect clipboard API availability on mount
  useEffect(() => {
    setHasClipboard(!!(navigator.clipboard && navigator.clipboard.readText));
  }, []);

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

  const handleCookieChange = (val: string) => {
    setCookie(val);
    localStorage.setItem('mcollect_instagram_cookie', val.trim());
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
          className={`w-full bg-black/40 border border-white/10 rounded-2xl pl-5 pr-24 py-4 text-white text-sm focus:outline-none focus:ring-1 transition-all placeholder-gray-500 ${getBrandedInputBorder()}`}
        />
        
        {/* Paste & Settings Buttons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {!isLoading && hasClipboard && (
            <button
              type="button"
              onClick={handleClipboardPaste}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              title="Paste from clipboard"
            >
              <Clipboard className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl transition-all ${showSettings ? 'text-[#ff5e00] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            title="Instagram Cookie Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Instagram Cookie Settings Panel */}
      {showSettings && (
        <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3 text-left">
          <div className="flex justify-between items-center">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">Instagram Configuration</h4>
            <span className="text-[9px] text-[#ff5e00] font-mono">Bypass Login Wall</span>
          </div>
          
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Enter your Instagram <code className="text-zinc-300 font-mono">sessionid</code> cookie to fetch public posts without getting blocked.
          </p>
          
          <div className="space-y-1.5">
            <label className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">sessionid Cookie Value</label>
            <input
              type="text"
              value={cookie}
              onChange={(e) => handleCookieChange(e.target.value)}
              placeholder="sessionid=123456%3Aabc... (or just the value)"
              className="w-full bg-black/50 border border-white/5 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#ff5e00]/40 font-mono placeholder-gray-600"
            />
          </div>
          
          <p className="text-[9px] text-gray-500 italic leading-normal">
            How to get: Login on instagram.com → Open DevTools (F12) → Application/Storage → Cookies → Copy the value of 'sessionid'.
          </p>
        </div>
      )}

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
