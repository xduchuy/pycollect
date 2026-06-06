import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { MediaItem } from '../types';

interface PreviewModalProps {
  isOpen: boolean;
  item: MediaItem | null;
  platform: string;
  onClose: () => void;
  onDownloadSingle: (item: MediaItem) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  item,
  platform,
  onClose,
  onDownloadSingle,
}) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimate(true), 50);
    } else {
      setAnimate(false);
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark blur backdrop */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-md" 
        onClick={onClose}
      ></div>

      {/* Content wrapper */}
      <div 
        className={`relative bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl z-10 transition-all duration-300 ${
          animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="absolute top-4 right-4 z-20">
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Media Container */}
        <div className="flex-1 overflow-hidden flex items-center justify-center p-4 min-h-[350px] bg-black/40">
          {item.type === 'video' ? (
            <video 
              src={item.downloadUrl} 
              controls 
              autoPlay 
              playsInline
              muted
              className="max-w-full max-h-[65vh] rounded-2xl object-contain shadow-lg" 
            />
          ) : (
            <img 
              src={item.thumbnailUrl} 
              alt={item.id} 
              className="max-w-full max-h-[65vh] rounded-2xl object-contain" 
            />
          )}
        </div>

        {/* Info Footer */}
        <div className="p-5 border-t border-white/5 bg-black/80 flex justify-between items-center">
          <div>
            <h4 className="text-white text-sm font-medium">{platform} {item.type === 'video' ? 'Video' : 'Image'}</h4>
            <p className="text-gray-500 text-xs mt-1">{item.size.toFixed(1)} MB • Source CDN</p>
          </div>
          <button 
            type="button" 
            onClick={() => onDownloadSingle(item)}
            className="px-5 py-2.5 rounded-xl text-xs text-white font-semibold bg-gradient-to-r from-[#4facfe] to-[#00f2fe] hover:opacity-90 transition-all"
          >
            Save Single
          </button>
        </div>
      </div>
    </div>
  );
};
