import crypto from 'crypto';
import { detectPlatform, normalizeURL } from '../utils/normalizer';
import type { ExtractionStrategy, ExtractionResult } from './strategies/strategyTypes';
import { OpenGraphStrategy } from './strategies/ogStrategy';
import { YtDlpStrategy } from './strategies/ytDlpStrategy';
import { GalleryDlStrategy } from './strategies/galleryDlStrategy';
import { PlaywrightStrategy } from './strategies/playwrightStrategy';
import { InstagramEmbedStrategy } from './strategies/instagramEmbedStrategy';
import { TiktokApiStrategy } from './strategies/tiktokApiStrategy';
import { InstagramApiStrategy } from './strategies/instagramApiStrategy';
import { BtchYoutubeStrategy } from './strategies/btchYoutubeStrategy';

export class ExtractorService {
  
  // Helper: Create MD5 hash of string URL
  public static createHash(url: string): string {
    return crypto.createHash('md5').update(url).digest('hex');
  }

  // Helper: Resolve strategy queue based on platform type
  private static getStrategies(platform: string): ExtractionStrategy[] {
    const og = new OpenGraphStrategy();
    const ytdl = new YtDlpStrategy();
    const gdl = new GalleryDlStrategy();
    const pw = new PlaywrightStrategy();
    const ttApi = new TiktokApiStrategy();
    const igEmbed = new InstagramEmbedStrategy();
    const igApi = new InstagramApiStrategy();
    const btchYt = new BtchYoutubeStrategy();

    switch (platform) {
      case 'instagram':
        return [igApi, igEmbed, og, gdl, ytdl, pw];
      case 'facebook':
        return [og, ytdl, pw];
      case 'tiktok':
        return [ttApi, og, ytdl, pw];
      case 'youtube':
        return [btchYt, ytdl];
      default:
        return [];
    }
  }

  // Core: Runs strategy execution waterfall
  public static async extractWithFallback(url: string, platform: string, cookie?: string): Promise<ExtractionResult> {
    const strategies = this.getStrategies(platform);
    const errors: string[] = [];

    for (const strategy of strategies) {
      try {
        console.log(`[PIPELINE] Attempting strategy "${strategy.name}" for platform "${platform}"`);
        const result = await strategy.run(url, cookie);
        
        if (this.isValidMediaResult(result)) {
          console.log(`[PIPELINE] Strategy "${strategy.name}" succeeded!`);
          return this.sanitizeMediaResult(result, platform);
        }
      } catch (err: any) {
        console.warn(`[PIPELINE] Strategy "${strategy.name}" failed:`, err.message);
        errors.push(`${strategy.name}: ${err.message}`);
        // Small wait delay before trying next strategy
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    throw new Error(`All extraction strategies failed. Details: [${errors.join(' | ')}]`);
  }

  // Validator: Ensure extraction payload has active media items
  private static isValidMediaResult(result: ExtractionResult | null): boolean {
    if (!result) return false;
    if (!result.media || !Array.isArray(result.media)) return false;
    if (result.media.length === 0) return false;

    // Filter out items that do not have download url or supported type
    result.media = result.media.filter(item => {
      if (!item.downloadUrl) return false;
      if (!['image', 'video'].includes(item.type)) return false;
      return true;
    });

    return result.media.length > 0;
  }

  // Sanitizer: Formats ids, estimates sizes, configures static file names, proxies external URLs
  private static sanitizeMediaResult(result: ExtractionResult, platform: string): ExtractionResult {
    const cleanMedia = result.media.map((item, index) => {
      const id = item.id || `${platform}-media-${index + 1}`;
      const type = item.type;
      
      const thumb = item.thumbnailUrl || item.downloadUrl;
      const download = item.downloadUrl;

      // Make a clean local filename suggestion
      let filename = item.filename;
      if (!filename) {
        const extension = type === 'video' ? 'mp4' : 'png';
        filename = `${platform.toLowerCase()}_${id}.${extension}`;
      }

      // If URLs point to external domains, route them via /api/proxy to resolve CORS
      const proxiedThumbnailUrl = thumb.startsWith('http') && !thumb.startsWith('/static')
        ? `/api/proxy?url=${encodeURIComponent(thumb)}`
        : thumb;

      const proxiedDownloadUrl = download.startsWith('http') && !download.startsWith('/static')
        ? `/api/proxy?url=${encodeURIComponent(download)}`
        : download;

      return {
        id,
        type,
        thumbnailUrl: proxiedThumbnailUrl,
        downloadUrl: proxiedDownloadUrl,
        size: item.size || (type === 'video' ? 12.0 : 1.5),
        filename,
        selected: false
      };
    });

    // Remove duplicates based on downloadUrl
    const seenUrls = new Set<string>();
    const deduplicatedMedia = cleanMedia.filter(item => {
      if (seenUrls.has(item.downloadUrl)) return false;
      seenUrls.add(item.downloadUrl);
      return true;
    });

    const platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);

    const proxiedAvatarUrl = result.authorAvatar && result.authorAvatar.startsWith('http') && !result.authorAvatar.startsWith('/static')
      ? `/api/proxy?url=${encodeURIComponent(result.authorAvatar)}`
      : result.authorAvatar;

    return {
      platform: platformLabel,
      title: result.title || 'Parsed Post Details',
      media: deduplicatedMedia,
      authorName: result.authorName,
      authorAvatar: proxiedAvatarUrl,
      likeCount: result.likeCount,
      commentCount: result.commentCount
    };
  }
}
export { detectPlatform, normalizeURL };
