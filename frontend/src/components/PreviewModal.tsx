import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { MediaItem } from '../types';

interface PreviewModalProps {
  isOpen: boolean;
  mediaList: MediaItem[];
  initialIndex: number;
  platform: string;
  onClose: () => void;
  onDownloadSingle: (item: MediaItem) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  mediaList,
  initialIndex,
  platform,
  onClose,
  onDownloadSingle,
}) => {
  const [animate, setAnimate] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Sync index state when modal opens or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setTimeout(() => setAnimate(true), 50);
    } else {
      setAnimate(false);
    }
  }, [isOpen, initialIndex]);

  // Keyboard Navigation Support (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    if (!isOpen || mediaList.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, mediaList, onClose]);

  if (!isOpen || mediaList.length === 0) return null;

  const item = mediaList[currentIndex];
  if (!item) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1));
  };

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
        {/* Top Control Bar: index counter & close button */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
          <div className="px-3 py-1 rounded-full bg-black/60 text-white text-[10px] tracking-wider font-bold select-none border border-white/5">
            {currentIndex + 1} / {mediaList.length}
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors border border-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Media Container with Carousel controls (Feature 2) */}
        <div className="flex-1 overflow-hidden flex items-center justify-center p-4 min-h-[350px] bg-black/40 relative group">
          {/* Left Arrow */}
          {mediaList.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 z-20 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 hover:scale-105 active:scale-95 transition-all opacity-80 md:opacity-0 md:group-hover:opacity-100 border border-white/5"
              title="Previous item"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Media Player element */}
          <div key={item.id} className="w-full h-full flex items-center justify-center transition-all duration-300 select-none">
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

          {/* Right Arrow */}
          {mediaList.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 z-20 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 hover:scale-105 active:scale-95 transition-all opacity-80 md:opacity-0 md:group-hover:opacity-100 border border-white/5"
              title="Next item"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Info Footer */}
        <div className="p-5 border-t border-white/5 bg-black/80 flex justify-between items-center">
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider">{platform} {item.type}</h4>
            <p className="text-gray-500 text-[10px] mt-1 font-mono">{item.size.toFixed(1)} MB • {item.filename}</p>
          </div>
          <button 
            type="button" 
            onClick={() => onDownloadSingle(item)}
            className="px-5 py-2.5 rounded-xl text-xs text-white font-bold bg-gradient-to-r from-[#00f2fe] to-[#4facfe] hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Save Single
          </button>
        </div>
      </div>
    </div>
  );
};
