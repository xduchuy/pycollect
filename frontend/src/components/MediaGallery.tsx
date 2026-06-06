import React from 'react';
import { ArrowLeft, Check, Play, Image } from 'lucide-react';
import type { MediaItem } from '../types';

interface MediaGalleryProps {
  platform: string;
  media: MediaItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onPreview: (item: MediaItem) => void;
  onBack: () => void;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  platform,
  media,
  selectedIds,
  onToggleSelect,
  onPreview,
  onBack,
}) => {
  // Helper: Get badge color matching platform
  const getBadgeClass = () => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
      case 'tiktok':
        return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'facebook':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h3 className="text-white text-sm font-medium">Detected Media</h3>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${getBadgeClass()}`}>
          {platform}
        </span>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
        {media.map((item) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <div
              key={item.id}
              onClick={() => onPreview(item)}
              className={`relative group rounded-xl overflow-hidden aspect-video bg-black/40 border cursor-pointer transition-all duration-300 select-none ${
                isSelected ? 'border-[#00f2fe] media-item-selected' : 'border-white/5'
              }`}
            >
              {/* Checkbox indicator overlay */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(item.id);
                }}
                className={`absolute top-2 right-2 z-10 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  isSelected 
                    ? 'border-[#00f2fe] bg-[#00f2fe]/20 text-[#00f2fe]' 
                    : 'border-white/20 bg-black/50 text-transparent hover:border-white/50'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3px]" />
              </div>

              {/* Thumbnail Image */}
              <img
                src={item.thumbnailUrl}
                alt={platform}
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
              />

              {/* Media Type Badge */}
              <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[8px] tracking-wider font-bold text-white flex items-center space-x-1">
                {item.type === 'video' ? (
                  <Play className="w-2.5 h-2.5" />
                ) : (
                  <Image className="w-2.5 h-2.5" />
                )}
                <span>{item.type.toUpperCase()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
