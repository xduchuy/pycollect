import { ExtractionStrategy, ExtractionResult, MediaItem } from './strategyTypes';

export class TiktokApiStrategy implements ExtractionStrategy {
  public name = 'TikTokPublicAPI';

  public async run(url: string): Promise<ExtractionResult> {
    try {
      const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
      console.log(`[TikTok API] Fetching details from: ${apiUrl}`);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }

      const res = (await response.json()) as any;
      if (res.code !== 0 || !res.data) {
        throw new Error(res.msg || 'API returned invalid status code');
      }

      const data = res.data;
      const media: MediaItem[] = [];

      // Case 1: TikTok slideshow/photo post
      if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        data.images.forEach((imgUrl: string, idx: number) => {
          media.push({
            id: `tt-api-img-${idx + 1}`,
            type: 'image',
            thumbnailUrl: imgUrl,
            downloadUrl: imgUrl,
            size: 1.8,
            filename: `tiktok_${data.id}_img_${idx + 1}.png`
          });
        });
      } else if (data.play) {
        // Case 2: TikTok video post (use HD format if available)
        const videoUrl = data.hdplay || data.play;
        media.push({
          id: 'tt-api-vid',
          type: 'video',
          thumbnailUrl: data.cover || '',
          downloadUrl: videoUrl,
          size: data.hdplay ? 18.0 : 12.0,
          filename: `tiktok_${data.id}.mp4`
        });
      }

      if (media.length === 0) {
        throw new Error('No media links found in TikTok response');
      }

      return {
        platform: 'TikTok',
        title: data.title || 'TikTok Video Post',
        authorName: data.author?.nickname || data.author?.unique_id || 'TikTok Creator',
        authorAvatar: data.author?.avatar || '',
        likeCount: data.digg_count || 0,
        commentCount: data.comment_count || 0,
        media
      };
    } catch (e: any) {
      throw new Error(`TikTok API Strategy failed: ${e.message}`);
    }
  }
}
