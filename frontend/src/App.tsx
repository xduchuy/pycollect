import React, { useState } from 'react';
import { Search, Clock, Youtube, CheckSquare, Instagram } from 'lucide-react';
import { Header } from './components/Header';
import { UrlInput } from './components/UrlInput';
import { YoutubeInput } from './components/YoutubeInput';
import { MediaGallery } from './components/MediaGallery';
import { StatsCards } from './components/StatsCards';
import { PreviewModal } from './components/PreviewModal';
import { DownloadProgressModal } from './components/DownloadProgressModal';
import { Toast } from './components/Toast';
import type { AnalysisResult, MediaItem } from './types';

export const App: React.FC = () => {
  // Application view/data states
  const [activeTab, setActiveTab] = useState<'social' | 'youtube'>('social');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal / Feedback states
  const [previewList, setPreviewList] = useState<MediaItem[]>([]);
  const [previewInitialIndex, setPreviewInitialIndex] = useState<number>(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreviewOpen = (_item: MediaItem, index: number, currentList: MediaItem[]) => {
    setPreviewList(currentList);
    setPreviewInitialIndex(index);
    setIsPreviewOpen(true);
  };
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [downloadSubstatus, setDownloadSubstatus] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

  // CORE ACTIONS
  const handleAnalyze = async (url: string) => {
    setAnalyzedUrl(url);
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);
    setSelectedIds(new Set());

    const base = import.meta.env.DEV ? '' : '/_/backend';
    try {
      const cookie = localStorage.getItem('mcollect_instagram_cookie') || '';
      const response = await fetch(`${base}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, cookie }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze link');
      }

      const data: AnalysisResult = await response.json();

      // Map static/api relative URLs to use backend service prefix in production
      const mapUrl = (urlStr: string) => {
        if (urlStr.startsWith('/api/') || urlStr.startsWith('/static/')) {
          return `${base}${urlStr}`;
        }
        return urlStr;
      };

      const mappedMedia = data.media.map(m => ({
        ...m,
        thumbnailUrl: mapUrl(m.thumbnailUrl),
        downloadUrl: mapUrl(m.downloadUrl),
      }));

      const mappedData = {
        ...data,
        media: mappedMedia,
      };

      setResult(mappedData);
      
      // Default to select all media
      setSelectedIds(new Set(mappedMedia.map(m => m.id)));
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during link analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for shared URL search parameter on component mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('url');
    if (sharedUrl) {
      handleAnalyze(sharedUrl);
      // Clean query parameter from browser location address to prevent re-analyzing on page refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleBack = () => {
    setResult(null);
    setSelectedIds(new Set());
    setErrorMessage(null);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };



  // MULTI / SINGLE DOWNLOAD PIPELINE
  const handleDownload = async () => {
    if (!result || selectedIds.size === 0) return;

    const selectedItems = result.media.filter(m => selectedIds.has(m.id));
    
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStatus('Downloading...');
    setDownloadSubstatus('Connecting to download server...');
    setDownloadSuccess(false);

    const base = import.meta.env.DEV ? '' : '/_/backend';
    try {
      // Send download request to backend
      const response = await fetch(`${base}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: selectedItems }),
      });

      if (!response.ok) {
        throw new Error('Could not package media files.');
      }

      // Parallel simulated UI progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 4;
        if (progress > 95) {
          clearInterval(interval);
        } else {
          setDownloadProgress(progress);
          if (progress < 25) {
            setDownloadSubstatus('Extracting server file handles...');
          } else if (progress < 60) {
            setDownloadSubstatus(`Compressing media payload (${selectedItems.length} files)...`);
          } else if (progress < 90) {
            setDownloadSubstatus('Assembling archive streams...');
          } else {
            setDownloadSubstatus('Saving package archive...');
          }
        }
      }, 80);

      const blob = await response.blob();
      clearInterval(interval);
      setDownloadProgress(100);
      setDownloadStatus('Success!');
      setDownloadSubstatus(`Successfully saved ${selectedItems.length} files to downloads.`);
      setDownloadSuccess(true);

      // Trigger client file save
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', selectedItems.length === 1 ? selectedItems[0].filename : 'media_collector_package.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setToastMessage(
        selectedItems.length === 1 
          ? 'Media file saved successfully!' 
          : 'ZIP package saved successfully!'
      );
      setToastOpen(true);
    } catch (err: any) {
      console.error(err);
      setDownloadStatus('Download Failed');
      setDownloadSubstatus(err.message || 'Server encountered an error while zipping files.');
    }
  };

  const handleDownloadSingle = async (item: MediaItem) => {
    setIsPreviewOpen(false);
    
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStatus('Downloading...');
    setDownloadSubstatus(`Fetching ${item.type.toLowerCase()}...`);
    setDownloadSuccess(false);

    const base = import.meta.env.DEV ? '' : '/_/backend';
    try {
      const response = await fetch(`${base}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [item] }),
      });

      if (!response.ok) throw new Error('File download failed');

      // Short simulated progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress > 90) clearInterval(interval);
        else setDownloadProgress(progress);
      }, 50);

      const blob = await response.blob();
      clearInterval(interval);
      setDownloadProgress(100);
      setDownloadStatus('Success!');
      setDownloadSubstatus(`Saved ${item.filename}`);
      setDownloadSuccess(true);

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', item.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setToastMessage('Media file saved successfully!');
      setToastOpen(true);
    } catch (err: any) {
      console.error(err);
      setDownloadStatus('Download Failed');
      setDownloadSubstatus('Failed to download file.');
    }
  };

  // DYNAMIC COUNTERS & ESTIMATES

  const selectedCount = selectedIds.size;
  const platform = result ? result.platform : null;
  const estimatedSize = result 
    ? result.media.reduce((acc, curr) => selectedIds.has(curr.id) ? acc + curr.size : acc, 0)
    : 0;

  return (
    <div className="flex items-center justify-center min-h-screen p-0 sm:p-4 w-full">
      
      {/* Main Screen Frame: full-screen on mobile, rounded card on desktop */}
      <main className="w-full min-h-screen sm:min-h-0 sm:max-w-md bg-darkBg rounded-none sm:rounded-[40px] overflow-hidden shadow-2xl relative border-none sm:border sm:border-white/[0.03]" data-purpose="dashboard-mobile-screen">
        
        {/* Navigation header row */}
        <nav className="bg-[#1c1c1c] py-4 px-6 flex justify-between items-center border-b border-white/[0.03]" data-purpose="top-nav">
          <div className="flex items-center space-x-6 text-gray-400 mx-auto">
            <Search className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
            <Clock className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
            <div 
              className={`p-1.5 rounded-lg border transition-all ${
                activeTab === 'social'
                  ? 'bg-black/40 border-white/[0.05] text-white'
                  : 'border-transparent text-gray-400 hover:text-white cursor-pointer'
              }`}
              onClick={() => { setActiveTab('social'); handleBack(); }}
              title="Social Downloader"
            >
              <Instagram className="w-5 h-5" />
            </div>
            <div 
              className={`p-1.5 rounded-lg border transition-all ${
                activeTab === 'youtube'
                  ? 'bg-black/40 border-white/[0.05] text-white'
                  : 'border-transparent text-gray-400 hover:text-white cursor-pointer'
              }`}
              onClick={() => { setActiveTab('youtube'); handleBack(); }}
              title="YouTube Downloader"
            >
              <Youtube className="w-5 h-5" />
            </div>
            <CheckSquare className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
          </div>
        </nav>

        {/* Content canvas container */}
        <div className="p-5 sm:p-8 space-y-6 sm:space-y-8 relative overflow-hidden">
          
          {/* Glowing Ambient Backdrop Element */}
          <div className={`absolute -top-10 left-10 w-32 h-32 pointer-events-none ${activeTab === 'youtube' ? 'glow-youtube' : 'glow-sun'}`} data-purpose="decorative-glow"></div>

          {/* Header Title Component */}
          <Header />

          {/* Dynamic Center Hero Card */}
          <section className="mt-4 z-10 relative">
            <div className="relative overflow-hidden flex flex-col justify-center transition-all duration-300">
              
              {!result && (
                activeTab === 'youtube' ? (
                  <YoutubeInput onAnalyze={handleAnalyze} isLoading={isLoading} />
                ) : (
                  <UrlInput onAnalyze={handleAnalyze} isLoading={isLoading} />
                )
              )}

              {!isLoading && result && (
                <MediaGallery
                  result={result}
                  analyzedUrl={analyzedUrl}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onPreview={handlePreviewOpen}
                  onBack={handleBack}
                />
              )}

              {/* Error Notification Block */}
              {errorMessage && (
                <div className="text-center py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <p className="text-red-400 text-xs font-semibold">{errorMessage}</p>
                  <button 
                    onClick={() => setErrorMessage(null)} 
                    className="text-gray-400 hover:text-white text-[10px] mt-2 underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

            </div>
          </section>

          {/* Metrics Statistics Grid */}
          <StatsCards
            size={estimatedSize}
          />

          {/* Bottom Controls Area */}
          <section className="space-y-3 pt-2 pb-2" data-purpose="bottom-actions">
            <button
              type="button"
              onClick={handleDownload}
              disabled={selectedCount === 0 || isLoading}
              className={`w-full flex items-center justify-between download-btn transition-all outline-none ${
                selectedCount > 0 && !isDownloading ? 'ready' : ''
              } ${isDownloading ? 'downloading' : ''}`}
            >
              <div className="flex items-center space-x-3">
                <div className="download-led"></div>
                <span className="text-white text-xs font-semibold tracking-widest uppercase select-none">
                  {isDownloading ? 'Downloading Package...' : 'Download Package'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-gray-500 font-mono">
                  {selectedCount} files ({estimatedSize.toFixed(1)} MB)
                </span>
                {/* Subtle handle detail line matching the toggle slider */}
                <div className="w-[3px] h-3 bg-zinc-700/80 rounded-[1px] ml-1"></div>
              </div>
            </button>
            
            {/* Removed Select All / Clear Selection grid */}
          </section>

          {/* Small Privacy Note */}
          <p className="text-[10px] text-gray-600 text-center tracking-wide mt-2">
            Only download content you have permission to save.
          </p>

        </div>
      </main>

      {/* Media Detail Preview Modal */}
      <PreviewModal
        isOpen={isPreviewOpen}
        mediaList={previewList}
        initialIndex={previewInitialIndex}
        platform={platform || ''}
        onClose={() => setIsPreviewOpen(false)}
        onDownloadSingle={handleDownloadSingle}
      />

      {/* ZIP Downloader Progress Overlay */}
      <DownloadProgressModal
        isOpen={isDownloading}
        progress={downloadProgress}
        status={downloadStatus}
        substatus={downloadSubstatus}
        isSuccess={downloadSuccess}
        onClose={() => setIsDownloading(false)}
      />

      {/* Success Notification Banner */}
      <Toast
        message={toastMessage}
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
      />

    </div>
  );
};
