import { ExtractionStrategy, ExtractionResult, MediaItem } from './strategyTypes';

export class PlaywrightStrategy implements ExtractionStrategy {
  public name = 'Playwright';

  public async run(url: string): Promise<ExtractionResult> {
    try {
      // Dynamic require to bypass compiler check if playwright is missing from project dependencies
      const playwright = eval("require('playwright')");
      if (!playwright || !playwright.chromium) {
        throw new Error('playwright package not installed');
      }
      
      const browser = await playwright.chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
      });
      const page = await context.newPage();

      const mediaRequests: string[] = [];

      // Intercept and scan response headers (declared as any to bypass implicit any)
      page.on('response', (response: any) => {
        try {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.startsWith('image/') || contentType.startsWith('video/')) {
            mediaRequests.push(response.url());
          }
        } catch (e) {
          // ignore parsing error
        }
      });

      // Navigate to URL
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

      // Scroll slowly to trigger lazy loaded items (casted via globalThis to bypass TS DOM check)
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = (globalThis as any).document.body.scrollHeight;
            (globalThis as any).window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight || totalHeight > 1000) {
              clearInterval(timer);
              resolve();
            }
          }, 80);
        });
      });

      const title = await page.title();
      const media: MediaItem[] = [];
      const uniqueUrls = Array.from(new Set(mediaRequests)).filter(u => u.startsWith('http'));

      uniqueUrls.slice(0, 6).forEach((mediaUrl, idx) => {
        const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('video') || mediaUrl.includes('/mime/video');
        media.push({
          id: `pw-${idx}`,
          type: isVideo ? 'video' : 'image',
          thumbnailUrl: mediaUrl,
          downloadUrl: mediaUrl,
          size: isVideo ? 12.0 : 1.5
        });
      });

      await browser.close();

      if (media.length === 0) {
        throw new Error('Playwright did not intercept any image or video assets');
      }

      return { title, media };
    } catch (e: any) {
      throw new Error(`Playwright Strategy failed: ${e.message || 'playwright package is not available'}`);
    }
  }
}
