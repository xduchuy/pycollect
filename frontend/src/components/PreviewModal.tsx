import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';
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

  // Custom Video Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const item = mediaList[currentIndex] || null;

  // Sync index state when modal opens or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setTimeout(() => setAnimate(true), 50);
    } else {
      setAnimate(false);
    }
  }, [isOpen, initialIndex]);

  // Reset player states when active item changes or modal closes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsMuted(true);
    setPlaybackRate(1);
    setShowSpeedMenu(false);
  }, [currentIndex, isOpen]);

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

  // Dismiss speed menu on outside click
  useEffect(() => {
    if (!showSpeedMenu) return;
    const handleOutsideClick = () => {
      setShowSpeedMenu(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showSpeedMenu]);

  if (!isOpen || !item) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1));
  };

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => console.warn(err));
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    videoRef.current.muted = nextMute;
    setIsMuted(nextMute);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = parseFloat(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changeSpeed = (e: React.MouseEvent, rate: number) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
              (() => {
                const isAudio = item.filename.endsWith('.m4a') || item.filename.endsWith('.mp3') || item.id.endsWith('-audio');
                return (
                  <div className="relative group/player max-w-full max-h-[65vh] rounded-2xl overflow-hidden shadow-lg flex items-center justify-center bg-black w-full aspect-video border border-white/5">
                    <video 
                      ref={videoRef}
                      src={item.downloadUrl} 
                      autoPlay 
                      playsInline
                      muted={isMuted}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onTimeUpdate={() => {
                        if (videoRef.current) {
                          setCurrentTime(videoRef.current.currentTime);
                        }
                      }}
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
                          setDuration(videoRef.current.duration);
                        }
                      }}
                      onClick={() => togglePlay()}
                      className={`max-w-full max-h-[65vh] object-contain cursor-pointer ${isAudio ? 'hidden' : ''}`} 
                    />

                    {isAudio && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-6 text-center select-none" onClick={() => togglePlay()}>
                        {/* Blurred background thumbnail */}
                        <img src={item.thumbnailUrl} alt="bg" className="absolute inset-0 w-full h-full object-cover blur-md opacity-20 pointer-events-none" />
                        
                        {/* Music Icon & info */}
                        <div className="relative z-10 flex flex-col items-center space-y-3">
                          <div className={`p-5 rounded-full bg-red-500/10 border border-red-500/25 text-red-500 shadow-lg ${isPlaying ? 'animate-pulse' : ''}`}>
                            <Music className="w-10 h-10" />
                          </div>
                          <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">Audio Track</span>
                        </div>
                      </div>
                    )}

                    {/* Big Center Overlay Play/Pause Button */}
                    <div 
                      onClick={() => togglePlay()}
                      className={`absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer transition-all duration-300 ${
                        isPlaying ? 'opacity-0 pointer-events-none scale-110' : 'opacity-100 scale-100'
                      }`}
                    >
                      <div className="p-4 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 hover:scale-105 transition-all shadow-xl">
                        <Play className="w-8 h-8 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Custom Neumorphic Bottom Control Bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col space-y-2 opacity-100 md:opacity-0 md:group-hover/player:opacity-100 transition-opacity duration-300 z-20">
                      {/* Progress scrub bar */}
                      <div className="flex items-center space-x-2">
                        <input 
                          type="range" 
                          min={0} 
                          max={duration || 100} 
                          step={0.1}
                          value={currentTime} 
                          onChange={handleSeek} 
                          className="w-full accent-red-500 h-1 rounded-lg bg-white/20 appearance-none cursor-pointer focus:outline-none transition-all" 
                        />
                      </div>

                      {/* Controls Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {/* Play/Pause control */}
                          <button 
                            type="button" 
                            onClick={() => togglePlay()} 
                            className="text-white hover:text-red-500 transition-colors p-1"
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4 fill-white" />
                            ) : (
                              <Play className="w-4 h-4 fill-white animate-pulse" />
                            )}
                          </button>

                          {/* Sound Control */}
                          <button 
                            type="button" 
                            onClick={toggleMute} 
                            className="text-white hover:text-red-500 transition-colors p-1"
                          >
                            {isMuted ? (
                              <VolumeX className="w-4 h-4" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </button>

                          {/* Time display */}
                          <span className="text-[10px] text-gray-300 font-mono select-none">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>

                        {/* Speed selector popup */}
                        <div className="relative">
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowSpeedMenu(!showSpeedMenu);
                            }} 
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-md text-[9px] text-gray-300 font-bold uppercase tracking-wider transition-all"
                          >
                            {playbackRate}x
                          </button>

                          {showSpeedMenu && (
                            <div className="absolute bottom-full right-0 mb-1 bg-zinc-950 border border-white/10 rounded-xl overflow-hidden py-1 w-16 shadow-2xl flex flex-col z-30">
                              {([0.5, 1.0, 1.5, 2.0] as const).map((rate) => (
                                <button
                                  key={rate}
                                  type="button"
                                  onClick={(e) => changeSpeed(e, rate)}
                                  className={`py-1 text-[9px] font-bold text-center hover:bg-white/5 transition-colors ${
                                    playbackRate === rate ? 'text-red-500' : 'text-gray-400'
                                  }`}
                                >
                                  {rate}x
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
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
            {(() => {
              const isAudio = item.filename.endsWith('.m4a') || item.filename.endsWith('.mp3') || item.id.endsWith('-audio');
              return (
                <h4 className="text-white text-xs font-semibold uppercase tracking-wider">
                  {platform} {isAudio ? 'AUDIO' : item.type}
                </h4>
              );
            })()}
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
