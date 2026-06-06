import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ExtractionStrategy, ExtractionResult, MediaItem } from './strategyTypes';

const execAsync = promisify(exec);

export class GalleryDlStrategy implements ExtractionStrategy {
  public name = 'gallery-dl';

  public async run(url: string): Promise<ExtractionResult> {
    try {
      const localExe = path.resolve(__dirname, '../../../gallery-dl.exe');
      const exe = fs.existsSync(localExe) ? `"${localExe}"` : 'gallery-dl';

      const { stdout } = await execAsync(`${exe} --dump-json "${url}"`);
      
      const media: MediaItem[] = [];
      const lines = stdout.split('\n').filter(line => line.trim().startsWith('['));

      lines.forEach((line, index) => {
        try {
          const parsed = JSON.parse(line);
          if (Array.isArray(parsed) && parsed.length >= 3) {
            // Typical gallery-dl line format: [index_code, url_string, metadata_dict]
            const mediaUrl = parsed[1];
            if (mediaUrl && (mediaUrl.startsWith('http') || mediaUrl.startsWith('https'))) {
              media.push({
                id: `gdl-${index}`,
                type: 'image', // gallery-dl primarily targets images
                thumbnailUrl: mediaUrl,
                downloadUrl: mediaUrl,
                size: 1.8
              });
            }
          }
        } catch (err) {
          // Skip line errors
        }
      });

      if (media.length === 0) {
        throw new Error('No media urls extracted');
      }

      return {
        platform: 'Instagram',
        title: 'gallery-dl Post Extractor',
        media
      };
    } catch (e: any) {
      throw new Error(`gallery-dl Strategy failed: ${e.message}`);
    }
  }
}
