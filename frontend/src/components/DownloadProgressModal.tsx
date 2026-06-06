import React, { useEffect, useState } from 'react';

interface DownloadProgressModalProps {
  isOpen: boolean;
  progress: number;
  status: string;
  substatus: string;
  isSuccess: boolean;
  onClose: () => void;
}

const FolderIconXP: React.FC = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 6C2 4.89543 2.89543 4 4 4H12L15 8H28C29.1046 8 30 8.89543 30 10V26C30 27.1046 29.1046 28 28 28H4C2.89543 28 2 27.1046 2 26V6Z" fill="#FFE066" stroke="#DCA810" strokeWidth="1.5" />
    <path d="M2 11H30V26C30 27.1046 29.1046 28 28 28H4C2.89543 28 2 27.1046 2 26V11Z" fill="#FAD02C" stroke="#DCA810" strokeWidth="1.5" />
  </svg>
);

const PCIconXP: React.FC = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="26" height="18" rx="2" fill="#D8D8D0" stroke="#808080" strokeWidth="1.5" />
    <rect x="5" y="6" width="22" height="14" fill="#000080" />
    <polygon points="12,22 20,22 22,28 10,28" fill="#B0B0A8" stroke="#808080" strokeWidth="1.5" />
    <rect x="8" y="27" width="16" height="2" fill="#808080" />
  </svg>
);

const DownloadCompleteIconXP: React.FC = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 10C4 8.89543 4.89543 8 6 8H16L20 12H42C43.1046 12 44 12.8954 44 14V38C44 39.1046 43.1046 40 42 40H6C4.89543 40 4 39.1046 4 38V10Z" fill="#FFE066" stroke="#DCA810" strokeWidth="1.5" />
    <path d="M4 16H44V38C44 39.1046 43.1046 40 42 40H6C4.89543 40 4 39.1046 4 38V16Z" fill="#FAD02C" stroke="#DCA810" strokeWidth="1.5" />
    <rect x="22" y="4" width="18" height="22" rx="2" fill="#FFFFFF" stroke="#003c9b" strokeWidth="1.5" />
    <path d="M26 15L30 19L36 11" stroke="#30b030" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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

  const totalBlocks = 24;
  const filledBlocks = Math.floor((progress / 100) * totalBlocks);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={isSuccess ? onClose : undefined}></div>

      {/* Windows XP Window Frame */}
      <div 
        className={`relative xp-window max-w-sm w-full z-10 transition-all duration-200 ${
          animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Titlebar */}
        <div className="xp-titlebar">
          <div className="xp-title">
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="1" fill="#FFFFFF" stroke="#0054e3" />
              <line x1="4" y1="5" x2="12" y2="5" stroke="#0054e3" strokeWidth="1.5" />
              <line x1="4" y1="8" x2="9" y2="8" stroke="#0054e3" strokeWidth="1.5" />
            </svg>
            <span>{isSuccess ? 'Download Complete' : 'Copying...'}</span>
          </div>
          <button type="button" onClick={onClose} className="xp-close-btn">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="xp-body flex flex-col">
          {!isSuccess ? (
            <>
              {/* Animation Panel */}
              <div className="xp-animation-box">
                <FolderIconXP />
                
                {/* 3 flying sheets of paper */}
                <div className="xp-paper xp-paper-1"></div>
                <div className="xp-paper xp-paper-2"></div>
                <div className="xp-paper xp-paper-3"></div>

                <PCIconXP />
              </div>

              {/* Status information */}
              <div className="space-y-1 mb-4 text-[11px] font-medium text-gray-800">
                <p className="truncate text-black font-semibold">{status}</p>
                <p className="truncate text-gray-600">{substatus}</p>
              </div>

              {/* Segmented Progress Bar */}
              <div className="xp-progress-container">
                {Array.from({ length: filledBlocks }).map((_, idx) => (
                  <div key={idx} className="xp-progress-block" />
                ))}
              </div>

              {/* Speed & Estimate info */}
              <div className="flex justify-between text-[10px] text-gray-600 border-t border-gray-300 pt-2 mt-1">
                <span>Estimated time: {progress < 100 ? `${Math.ceil((100 - progress) * 0.1)} sec` : 'Done'}</span>
                <span>Speed: 3.4 MB/s</span>
              </div>

              {/* Action row */}
              <div className="flex justify-end mt-4">
                <button type="button" onClick={onClose} className="xp-btn">
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success layout */}
              <div className="flex items-start space-x-4 mb-4 pt-2">
                <DownloadCompleteIconXP />
                <div className="flex-1 space-y-1 text-[11px] text-gray-800">
                  <h5 className="text-black font-bold text-xs">Download Complete</h5>
                  <p className="text-gray-700">Mcollect has successfully saved the files to your computer.</p>
                  <p className="font-mono text-gray-500 mt-1 truncate">{substatus}</p>
                </div>
              </div>

              {/* Action row */}
              <div className="flex justify-end space-x-2 border-t border-gray-300 pt-3">
                <button type="button" onClick={onClose} className="xp-btn">
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
