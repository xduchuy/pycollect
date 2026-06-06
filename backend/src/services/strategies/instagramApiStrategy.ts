import { ExtractionStrategy, ExtractionResult, MediaItem } from './strategyTypes';

export class InstagramApiStrategy implements ExtractionStrategy {
  public name = 'InstagramAPI';

  public async run(url: string): Promise<ExtractionResult> {
    try {
      console.log(`[Instagram API] Attempting download for: ${url}`);
      // Use require to bypass type check for non-TS module
      const { instagramDownload } = require('@mrnima/instagram-downloader');
      const data = await instagramDownload(url);

      if (!data || data.status !== true || !data.result || !Array.isArray(data.result)) {
        throw new Error(data?.message || 'API returned failed status');
      }

      const media: MediaItem[] = data.result.map((item: any, idx: number) => {
        const type = item.type === 'video' ? 'video' : 'image';
        return {
          id: `ig-api-${idx + 1}`,
          type,
          thumbnailUrl: item.link,
          downloadUrl: item.link,
          size: type === 'video' ? 12.0 : 1.5,
          filename: `instagram_api_${idx + 1}.${type === 'video' ? 'mp4' : 'png'}`
        };
      });

      if (media.length === 0) {
        throw new Error('No media items found in Instagram API response');
      }

      return {
        platform: 'Instagram',
        title: `Instagram Post`,
        authorName: 'Instagram Creator',
        authorAvatar: '',
        media
      };
    } catch (e: any) {
      throw new Error(`Instagram API Strategy failed: ${e.message}`);
    }
  }
}
