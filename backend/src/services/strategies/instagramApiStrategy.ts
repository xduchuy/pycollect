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

      let title = 'Instagram Post';
      let authorName = 'Instagram Creator';

      try {
        const ogRes = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
          }
        });
        if (ogRes.ok) {
          const html = await ogRes.text();
          const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                             html.match(/<meta\s+name=["']og:title["']\s+content=["'](.*?)["']/i) ||
                             html.match(/<title>(.*?)<\/title>/i);
          if (titleMatch) {
            const rawTitle = titleMatch[1];
            const decodedTitle = rawTitle
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
            
            title = decodedTitle;

            const authorMatch = decodedTitle.match(/^([^:]+)\s+on\s+Instagram/i) || 
                                decodedTitle.match(/^Instagram\s+post\s+by\s+@?([^\s:]+)/i);
            if (authorMatch) {
              authorName = authorMatch[1].trim();
            }
          }
        }
      } catch (err) {
        console.log('[Instagram API] Failed to enrich metadata from HTML:', err);
      }

      return {
        platform: 'Instagram',
        title,
        authorName,
        authorAvatar: '',
        media
      };
    } catch (e: any) {
      throw new Error(`Instagram API Strategy failed: ${e.message}`);
    }
  }
}
