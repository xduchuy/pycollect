import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface DownloadProgressModalProps {
  isOpen: boolean;
  progress: number;
  status: string;
  substatus: string;
  isSuccess: boolean;
  onClose: () => void;
}

export const DownloadProgressModal: React.FC<DownloadProgressModalProps> = ({
  isOpen,
  progress,
  status,
  substatus,
  isSuccess,
  onClose,
}) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimate(true), 50);
    } else {
      setAnimate(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate SVG circle progress offset
  // Radius is 34, so circumference is 2 * PI * r = 2 * 3.14159 * 34 = 213.6
  const circumference = 213.6;
  const strokeDashoffset = circumference - (circumference * progress) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md"></div>

      {/* Content card */}
      <div 
        className={`relative bg-zinc-950 border border-white/10 rounded-3xl p-6 max-w-xs w-full flex flex-col items-center justify-center text-center shadow-2xl z-10 transition-all duration-300 ${
          animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* SVG Circular Progress */}
        <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
          <svg className="absolute transform -rotate-90 w-20 h-20">
            {/* Background circle track */}
            <circle 
              cx="40" 
              cy="40" 
              r="34" 
              stroke="rgba(255,255,255,0.05)" 
              strokeWidth="6" 
              fill="transparent" 
            />
            {/* Foreground animated progress bar */}
            <circle 
              cx="40" 
              cy="40" 
              r="34" 
              stroke="url(#progress-modal-gradient)" 
              strokeWidth="6" 
              fill="transparent" 
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-200"
            />
            
            <defs>
              <linearGradient id="progress-modal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4facfe" />
                <stop offset="40%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#f9d423" />
              </linearGradient>
            </defs>
          </svg>
          
          <span className={`text-white text-base font-bold transition-opacity ${isSuccess ? 'opacity-0' : 'opacity-100'}`}>
            {progress}%
          </span>
          
          {isSuccess && (
            <div className="absolute inset-0 flex items-center justify-center text-green-400">
              <Check className="w-6 h-6 animate-pulse" />
            </div>
          )}
        </div>

        <h4 className="text-white text-sm font-semibold">{status}</h4>
        <p className="text-gray-500 text-xs mt-1 min-h-[16px]">{substatus}</p>

        {isSuccess && (
          <div className="flex flex-col items-center mt-4 w-full">
            <button 
              type="button"
              onClick={onClose} 
              className="w-full py-2.5 rounded-xl text-xs text-white font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
