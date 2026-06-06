import React, { useState } from 'react';
import { ArrowLeft, Check, Play, Image, Heart, MessageCircle, ArrowUpDown } from 'lucide-react';
import type { AnalysisResult, MediaItem } from '../types';

interface MediaGalleryProps {
  result: AnalysisResult;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onPreview: (item: MediaItem, index: number, currentList: MediaItem[]) => void;
  onBack: () => void;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  result,
  selectedIds,
  onToggleSelect,
  onPreview,
  onBack,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'size-asc' | 'size-desc'>('default');

  const { platform, title, media, authorName, authorAvatar, likeCount, commentCount } = result;

  // Helper: Format counts (e.g., 12450 -> 12.4K)
  const formatCount = (num?: number) => {
    if (num === undefined || num === null) return null;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Helper: Get badge color matching platform
  const getPlatformColors = () => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return {
          text: 'text-pink-400',
          bg: 'bg-pink-400/10',
          border: 'border-pink-400/20',
          glow: 'shadow-pink-500/20',
        };
      case 'tiktok':
        return {
          text: 'text-cyan-400',
          bg: 'bg-cyan-400/10',
          border: 'border-cyan-400/20',
          glow: 'shadow-cyan-500/20',
        };
      case 'facebook':
        return {
          text: 'text-blue-400',
          bg: 'bg-blue-400/10',
          border: 'border-blue-400/20',
          glow: 'shadow-blue-500/20',
        };
      default:
        return {
          text: 'text-gray-400',
          bg: 'bg-gray-400/10',
          border: 'border-gray-400/20',
          glow: 'shadow-gray-500/20',
        };
    }
  };

  const colors = getPlatformColors();

  // Filter and Sort Logic
  const filteredMedia = media.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const sortedMedia = [...filteredMedia].sort((a, b) => {
    if (sortBy === 'size-asc') return a.size - b.size;
    if (sortBy === 'size-desc') return b.size - a.size;
    return 0; // Default detection order
  });

  return (
    <div className="space-y-4 text-left">
      {/* Back Button and Title Row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h3 className="text-white text-sm font-semibold">Media Inspector</h3>
        </div>
        <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${colors.text} ${colors.bg} ${colors.border}`}>
          {platform}
        </span>
      </div>

      {/* Social Post Metadata Card (Feature 3) */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
        <div className="flex items-center space-x-3">
          {/* Creator Avatar */}
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorName || 'Avatar'}
              className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-sm"
              onError={(e) => {
                // Fail-safe default avatar
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-300">
              {(authorName || platform).charAt(0).toUpperCase()}
            </div>
          )}

          {/* Creator Details */}
          <div className="flex-1 min-w-0">
            <h4 className="text-white text-xs font-semibold truncate">
              {authorName ? `@${authorName}` : 'Social Creator'}
            </h4>
            <div className="flex items-center space-x-3 mt-0.5 text-[10px] text-gray-400 font-medium">
              {likeCount !== undefined && (
                <span className="flex items-center space-x-1">
                  <Heart className="w-3.5 h-3.5 text-red-500/80 fill-red-500/20" />
                  <span>{formatCount(likeCount)}</span>
                </span>
              )}
              {commentCount !== undefined && (
                <span className="flex items-center space-x-1">
                  <MessageCircle className="w-3.5 h-3.5 text-blue-400/80 fill-blue-400/20" />
                  <span>{formatCount(commentCount)}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Caption/Title text */}
        {title && (
          <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 select-text font-normal">
            {title}
          </p>
        )}
      </div>

      {/* Filter and Sort Toolbar (Feature 4) */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center bg-white/[0.01] border border-white/[0.03] p-2 rounded-xl">
        {/* Media Type Filter */}
        <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
          {(['all', 'image', 'video'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                filterType === type
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {type}s
            </button>
          ))}
        </div>

        {/* Size Sort Dropdown */}
        <div className="flex items-center bg-black/40 rounded-lg border border-white/5 px-2 py-0.5 gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent border-none text-[10px] text-gray-400 focus:outline-none cursor-pointer py-1 font-bold uppercase tracking-wider focus:ring-0 focus:text-white"
          >
            <option value="default" className="bg-zinc-900 text-gray-300">Sort: Default</option>
            <option value="size-asc" className="bg-zinc-900 text-gray-300">Size: Low → High</option>
            <option value="size-desc" className="bg-zinc-900 text-gray-300">Size: High → Low</option>
          </select>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
        {sortedMedia.map((item, index) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <div
              key={item.id}
              onClick={() => onPreview(item, index, sortedMedia)}
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
