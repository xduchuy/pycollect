import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ExtractionStrategy, ExtractionResult, MediaItem } from './strategyTypes';

const execAsync = promisify(exec);

export class YtDlpStrategy implements ExtractionStrategy {
  public name = 'yt-dlp';

  public async run(url: string): Promise<ExtractionResult> {
    try {
      const localExe = path.resolve(__dirname, '../../../yt-dlp.exe');
      const exe = fs.existsSync(localExe) ? `"${localExe}"` : 'yt-dlp';

      // Execute command to dump meta-json
      const { stdout } = await execAsync(`${exe} --dump-json "${url}"`);
      const data = JSON.parse(stdout);

      const media: MediaItem[] = [];

      if (data.entries && Array.isArray(data.entries)) {
        data.entries.forEach((entry: any, idx: number) => {
          media.push(this.mapYtDlpItem(entry, `ytdl-${idx}`));
        });
      } else {
        media.push(this.mapYtDlpItem(data, 'ytdl-1'));
      }

      return {
        platform: data.extractor ? this.capitalize(data.extractor) : 'yt-dlp',
        title: data.title || data.description || 'yt-dlp Extracted Media',
        media
      };
    } catch (e: any) {
      throw new Error(`yt-dlp Strategy failed: ${e.message}`);
    }
  }

  private mapYtDlpItem(item: any, fallbackId: string): MediaItem {
    // Check if the item behaves as video stream
    const isVideo = (item.vcodec && item.vcodec !== 'none') || 
                    item.ext === 'mp4' || 
                    item.protocol === 'm3u8_native' ||
                    item.formats?.some((f: any) => f.vcodec !== 'none');

    let downloadUrl = item.url || '';
    if (!downloadUrl && item.formats && Array.isArray(item.formats)) {
      // Traverse formats backwards to choose the highest resolution/quality format url
      for (let i = item.formats.length - 1; i >= 0; i--) {
        if (item.formats[i]?.url) {
          downloadUrl = item.formats[i].url;
          break;
        }
      }
    }

    return {
      id: item.id || fallbackId,
      type: isVideo ? 'video' : 'image',
      thumbnailUrl: item.thumbnail || item.thumbnails?.[0]?.url || downloadUrl,
      downloadUrl: downloadUrl,
      size: item.filesize 
        ? Math.round((item.filesize / (1024 * 1024)) * 10) / 10 
        : (isVideo ? 12.0 : 1.5) // Fallback default sizes
    };
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
