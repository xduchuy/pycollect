import { ExtractionStrategy, ExtractionResult, MediaItem } from './strategyTypes';

export class InstagramEmbedStrategy implements ExtractionStrategy {
  public name = 'InstagramEmbedAPI';

  public async run(url: string): Promise<ExtractionResult> {
    try {
      const cleanUrl = url.replace(/\/$/, ''); // Remove trailing slash
      const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(cleanUrl)}`;
      console.log(`[Instagram Embed API] Querying: ${oembedUrl}`);

      const response = await fetch(oembedUrl);
      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }

      const data = (await response.json()) as any;
      const media: MediaItem[] = [];

      if (data.thumbnail_url) {
        // High resolution thumbnail CDN url acts as the downloadable image
        media.push({
          id: 'ig-embed-img',
          type: 'image',
          thumbnailUrl: data.thumbnail_url,
          downloadUrl: data.thumbnail_url,
          size: 2.2,
          filename: `instagram_${data.author_name || 'post'}.png`
        });
      }

      if (media.length === 0) {
        throw new Error('oEmbed returned no media thumbnail asset link');
      }

      return {
        platform: 'Instagram',
        title: data.title || `Instagram post by @${data.author_name || 'creator'}`,
        authorName: data.author_name || 'Instagram Creator',
        authorAvatar: '',
        media
      };
    } catch (e: any) {
      throw new Error(`Instagram oEmbed Strategy failed: ${e.message}`);
    }
  }
}
