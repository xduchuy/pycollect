import React, { useState, useEffect } from 'react';
import { Clipboard, Settings } from 'lucide-react';

interface YoutubeInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export const YoutubeInput: React.FC<YoutubeInputProps> = ({ onAnalyze, isLoading }) => {
  const [url, setUrl] = useState('');
  const [checked, setChecked] = useState(false);
  const [cookie, setCookie] = useState(() => localStorage.getItem('mcollect_youtube_cookie') || '');
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

  const handleCookieChange = (val: string) => {
    setCookie(val);
    localStorage.setItem('mcollect_youtube_cookie', val.trim());
  };

  const processAnalysis = (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    const cleanUrl = trimmed.toLowerCase();

    // Basic check for youtube domains (case-insensitive)
    const isSupported = 
      cleanUrl.includes('youtube.com') || 
      cleanUrl.includes('youtu.be');

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
          placeholder="Paste YouTube Video or Shorts link..."
          className="w-full bg-black/40 border border-white/10 rounded-2xl pl-5 pr-24 py-4 text-white text-sm focus:outline-none focus:ring-1 transition-all placeholder-gray-500 focus:border-red-500 focus:ring-red-500/30"
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
            className={`p-2 rounded-xl transition-all ${showSettings ? 'text-red-500 bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            title="YouTube Cookie Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* YouTube Cookie Settings Panel */}
      {showSettings && (
        <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3 text-left">
          <div className="flex justify-between items-center">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">YouTube Configuration</h4>
            <span className="text-[9px] text-red-500 font-mono">Bypass Rate Limit / Blocks</span>
          </div>
          
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Enter your YouTube <code className="text-zinc-300 font-mono">Cookie</code> header value to fetch age-restricted, private videos, or bypass datacenter IP blocks.
          </p>
          
          <div className="space-y-1.5">
            <label className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Cookie String</label>
            <textarea
              value={cookie}
              onChange={(e) => handleCookieChange(e.target.value)}
              placeholder="visitor-id=...; SID=...; HSID=..."
              className="w-full bg-black/50 border border-white/5 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-red-500/40 font-mono placeholder-gray-600 h-16 resize-none custom-scrollbar"
            />
          </div>
          
          <p className="text-[9px] text-gray-500 italic leading-normal">
            How to get: Login on youtube.com → Open DevTools (F12) → Network → Refresh page → Click any request → Copy the 'Cookie' request header value.
          </p>
        </div>
      )}

      <div className="flex flex-col items-center gap-3 mt-2">
        {/* Toggle Button Track */}
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
