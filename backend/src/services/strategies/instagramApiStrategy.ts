import cheerio from 'cheerio';
import { ExtractionStrategy, ExtractionResult, MediaItem } from './strategyTypes';

export class InstagramApiStrategy implements ExtractionStrategy {
  public name = 'InstagramAPI';

  public async run(url: string, cookie?: string): Promise<ExtractionResult> {
    if (!cookie) {
      throw new Error('Instagram requires a session cookie to bypass login walls. Please configure it in settings.');
    }

    try {
      console.log(`[Instagram API] Running with user session cookie...`);
      const formattedCookie = cookie.includes('sessionid=') ? cookie : `sessionid=${cookie}`;

      // 1. Fetch post page using the session cookie
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': formattedCookie,
        'Sec-Fetch-Mode': 'navigate',
        'Connection': 'keep-alive'
      };

      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`Instagram page fetch failed with status ${response.status}`);
      }

      const html = await response.text();

      // 2. Extract media ID and App ID
      const appIdMatch = html.match(/"X-IG-App-ID":"([\d]+)"/);
      const appId = appIdMatch ? appIdMatch[1] : '936619743392459'; // fallback standard web app id

      // Extract media ID
      const mediaIdMatch = html.match(/instagram:\/\/media\?id=(\d+)|["' ]media_id["' ]:["' ](\d+)["' ]/);
      let mediaId: string | null = null;
      if (mediaIdMatch) {
        mediaId = mediaIdMatch[1] || mediaIdMatch[2];
      }
      
      // Secondary match for media ID (e.g. inside script tags)
      if (!mediaId) {
        const pkMatch = html.match(/"pk":"(\d+)"/);
        if (pkMatch) mediaId = pkMatch[1];
      }

      if (!mediaId) {
        // Fallback: search in script application/json
        const $ = cheerio.load(html);
        $('script[type="application/json"]').each((_i, elem) => {
          const jsonText = $(elem).html();
          if (!jsonText) return;
          const pkMatch = jsonText.match(/"pk":"(\d+)"/);
          if (pkMatch) {
            mediaId = pkMatch[1];
            return false;
          }
        });
      }

      if (!mediaId) {
        throw new Error('Could not extract media ID from Instagram page.');
      }

      console.log(`[Instagram API] Extracted Media ID: ${mediaId} | App ID: ${appId}`);

      // 3. Query the Instagram Media Info endpoint
      const infoUrl = `https://i.instagram.com/api/v1/media/${mediaId}/info/`;
      const infoHeaders = {
        'Accept': '*/*',
        'X-IG-App-ID': appId,
        'Cookie': formattedCookie,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
      };

      const infoResponse = await fetch(infoUrl, { headers: infoHeaders });
      if (!infoResponse.ok) {
        throw new Error(`Media Info API returned HTTP ${infoResponse.status}. Your cookie might be expired.`);
      }

      const infoJson = (await infoResponse.json()) as any;
      if (!infoJson.items || !infoJson.items[0]) {
        throw new Error('Media Info API returned empty items list.');
      }

      const item = infoJson.items[0];

      // 4. Map media items
      const media: MediaItem[] = [];

      const mapMediaItem = (mediaObj: any, index: number): MediaItem => {
        const isVideo = !!mediaObj.video_versions && mediaObj.video_versions.length > 0;
        let downloadUrl = '';
        let thumbnailUrl = '';

        if (isVideo) {
          // Select highest resolution video
          const sortedVideos = mediaObj.video_versions.sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
          downloadUrl = sortedVideos[0].url;
          thumbnailUrl = mediaObj.image_versions2?.candidates?.[0]?.url || downloadUrl;
        } else {
          // Select highest resolution image
          downloadUrl = mediaObj.image_versions2?.candidates?.[0]?.url || '';
          thumbnailUrl = downloadUrl;
        }

        const type = isVideo ? 'video' : 'image';
        return {
          id: `ig-api-${index + 1}`,
          type,
          thumbnailUrl,
          downloadUrl,
          size: isVideo ? 12.0 : 1.5,
          filename: `instagram_${item.code || mediaId}_${index + 1}.${isVideo ? 'mp4' : 'png'}`
        };
      };

      if (item.carousel_media && Array.isArray(item.carousel_media)) {
        item.carousel_media.forEach((carouselItem: any, idx: number) => {
          media.push(mapMediaItem(carouselItem, idx));
        });
      } else {
        media.push(mapMediaItem(item, 0));
      }

      if (media.length === 0) {
        throw new Error('No image or video links extracted from post JSON.');
      }

      // Metadata enrichment
      const title = item.caption?.text || `Instagram post by @${item.user?.username || 'creator'}`;
      const authorName = item.user?.username || 'Instagram Creator';
      const authorAvatar = item.user?.profile_pic_url || '';
      const likeCount = item.like_count || 0;
      const commentCount = item.comment_count || 0;

      return {
        platform: 'Instagram',
        title,
        authorName,
        authorAvatar,
        likeCount,
        commentCount,
        media
      };

    } catch (e: any) {
      throw new Error(`Instagram API Strategy failed: ${e.message}`);
    }
  }
}
