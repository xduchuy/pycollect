import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ExtractionStrategy, ExtractionResult, MediaItem } from './strategyTypes';

const execAsync = promisify(exec);

export class YtDlpStrategy implements ExtractionStrategy {
  public name = 'yt-dlp';

  public async run(url: string, cookie?: string): Promise<ExtractionResult> {
    try {
      const localExe = path.resolve(__dirname, '../../../yt-dlp.exe');
      const exe = fs.existsSync(localExe) ? `"${localExe}"` : 'yt-dlp';

      // Append cookie headers if provided to bypass datacenter blocks
      const cookieOption = cookie ? `--add-header "Cookie: ${cookie}"` : '';

      // Execute command to dump meta-json
      const { stdout } = await execAsync(`${exe} ${cookieOption} --dump-json "${url}"`);
      const data = JSON.parse(stdout);

      const media: MediaItem[] = [];
      const isYoutube = data.extractor && data.extractor.toLowerCase().includes('youtube');

      if (data.entries && Array.isArray(data.entries)) {
        data.entries.forEach((entry: any, idx: number) => {
          if (isYoutube) {
            media.push(...this.mapYoutubeEntry(entry, `ytdl-${idx}`));
          } else {
            media.push(this.mapYtDlpItem(entry, `ytdl-${idx}`));
          }
        });
      } else {
        if (isYoutube) {
          media.push(...this.mapYoutubeEntry(data, 'ytdl-1'));
        } else {
          media.push(this.mapYtDlpItem(data, 'ytdl-1'));
        }
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

  private mapYoutubeEntry(data: any, fallbackId: string): MediaItem[] {
    const media: MediaItem[] = [];
    const formats = data.formats || [];
    const id = data.id || fallbackId;
    const title = data.title || 'video';

    // 1. Find best combined format (vcodec !== none and acodec !== none)
    let bestCombined = null;
    for (let i = formats.length - 1; i >= 0; i--) {
      const f = formats[i];
      if (f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none' && f.url) {
        bestCombined = f;
        break;
      }
    }

    const videoUrl = bestCombined?.url || data.url || '';
    const videoSize = bestCombined?.filesize || bestCombined?.filesize_approx || data.filesize;

    if (videoUrl) {
      media.push({
        id: `${id}-video`,
        type: 'video',
        thumbnailUrl: data.thumbnail || data.thumbnails?.[0]?.url || videoUrl,
        downloadUrl: videoUrl,
        filename: `${this.sanitizeFilename(title)}_${id}.mp4`,
        size: videoSize 
          ? Math.round((videoSize / (1024 * 1024)) * 10) / 10 
          : 12.0
      });
    }

    // 2. Find best audio format (vcodec === none and acodec !== none)
    let bestAudio = null;
    for (let i = formats.length - 1; i >= 0; i--) {
      const f = formats[i];
      if ((!f.vcodec || f.vcodec === 'none') && f.acodec && f.acodec !== 'none' && f.url && f.ext === 'm4a') {
        bestAudio = f;
        break;
      }
    }
    if (!bestAudio) {
      for (let i = formats.length - 1; i >= 0; i--) {
        const f = formats[i];
        if ((!f.vcodec || f.vcodec === 'none') && f.acodec && f.acodec !== 'none' && f.url) {
          bestAudio = f;
          break;
        }
      }
    }

    const audioUrl = bestAudio?.url || '';
    const audioSize = bestAudio?.filesize || bestAudio?.filesize_approx;

    if (audioUrl) {
      media.push({
        id: `${id}-audio`,
        type: 'video', // must be 'video' due to types, but filename ends with .m4a
        thumbnailUrl: data.thumbnail || data.thumbnails?.[0]?.url || audioUrl,
        downloadUrl: audioUrl,
        filename: `${this.sanitizeFilename(title)}_${id}_audio.m4a`,
        size: audioSize 
          ? Math.round((audioSize / (1024 * 1024)) * 10) / 10 
          : 3.5
      });
    }

    // Fallback if no video/audio was matched but we have direct URL
    if (media.length === 0 && data.url) {
      media.push({
        id: id,
        type: 'video',
        thumbnailUrl: data.thumbnail || data.thumbnails?.[0]?.url || data.url,
        downloadUrl: data.url,
        filename: `${this.sanitizeFilename(title)}_${id}.mp4`,
        size: data.filesize ? Math.round((data.filesize / (1024 * 1024)) * 10) / 10 : 12.0
      });
    }

    return media;
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

  private sanitizeFilename(str: string): string {
    const normalized = str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove combining diacritical marks
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
    return normalized.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_').substring(0, 50);
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
