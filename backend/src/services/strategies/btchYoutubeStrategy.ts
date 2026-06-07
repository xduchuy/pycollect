import { ExtractionStrategy, ExtractionResult, MediaItem } from './strategyTypes';
const btch = require('btch-downloader');

export class BtchYoutubeStrategy implements ExtractionStrategy {
  public name = 'btch-youtube';

  public async run(url: string): Promise<ExtractionResult> {
    try {
      console.log(`[BTCH-YOUTUBE] Scraper triggered for URL: ${url}`);
      
      const data = await btch.youtube(url);
      
      if (!data || !data.status) {
        throw new Error('API returned unsuccessful status');
      }

      const media: MediaItem[] = [];
      const id = this.extractVideoId(url) || 'youtube';

      // 1. Add Video Format (.mp4)
      if (data.mp4) {
        media.push({
          id: `${id}-video`,
          type: 'video',
          thumbnailUrl: data.thumbnail || '',
          downloadUrl: data.mp4,
          filename: `${this.sanitizeFilename(data.title || 'video')}_${id}.mp4`,
          size: 12.0 // default estimate
        });
      }

      // 2. Add Audio Format (.mp3)
      if (data.mp3) {
        media.push({
          id: `${id}-audio`,
          type: 'video', // Must be 'video' due to client-side Type constraints, but filename ends with .mp3
          thumbnailUrl: data.thumbnail || '',
          downloadUrl: data.mp3,
          filename: `${this.sanitizeFilename(data.title || 'audio')}_${id}_audio.mp3`,
          size: 3.5 // default estimate
        });
      }

      if (media.length === 0) {
        throw new Error('No media links found in BTCH response');
      }

      return {
        platform: 'YouTube',
        title: data.title || 'YouTube Media',
        authorName: data.author || 'YouTube Creator',
        media
      };
    } catch (e: any) {
      throw new Error(`BTCH YouTube Strategy failed: ${e.message}`);
    }
  }

  private extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    // Shorts format fallback
    const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) {
      return shortsMatch[1];
    }
    return null;
  }

  private sanitizeFilename(str: string): string {
    const normalized = str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove combining diacritical marks
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
    return normalized.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_').substring(0, 50);
  }
}
