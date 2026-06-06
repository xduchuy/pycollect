import { ExtractionStrategy, ExtractionResult, MediaItem } from './strategyTypes';

export class OpenGraphStrategy implements ExtractionStrategy {
  public name = 'OpenGraphMeta';

  public async run(url: string): Promise<ExtractionResult> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
        }
      });

      if (!response.ok) {
        throw new Error(`Fetch error: Status ${response.status}`);
      }

      const html = await response.text();

      // Simple regex parsers to capture metadata values without heavy parser dependencies
      const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                         html.match(/<meta\s+name=["']og:title["']\s+content=["'](.*?)["']/i);
      const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
                         html.match(/<meta\s+name=["']og:image["']\s+content=["'](.*?)["']/i);
      const videoMatch = html.match(/<meta\s+property=["']og:video["']\s+content=["'](.*?)["']/i) ||
                         html.match(/<meta\s+name=["']og:video["']\s+content=["'](.*?)["']/i);

      const title = titleMatch ? this.decodeHtmlEntities(titleMatch[1]) : 'Extracted Post Details';
      const media: MediaItem[] = [];

      if (imageMatch) {
        media.push({
          type: 'image',
          thumbnailUrl: imageMatch[1],
          downloadUrl: imageMatch[1],
          size: 1.8
        });
      }

      if (videoMatch) {
        media.push({
          type: 'video',
          thumbnailUrl: imageMatch ? imageMatch[1] : '',
          downloadUrl: videoMatch[1],
          size: 14.5
        });
      }

      if (media.length === 0) {
        throw new Error('No OpenGraph media tags found in HTML');
      }

      return { title, media };
    } catch (e: any) {
      throw new Error(`OpenGraph Strategy failed: ${e.message}`);
    }
  }

  // Helper: Decode simple HTML entities
  private decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
}
