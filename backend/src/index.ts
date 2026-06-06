import express from 'express';
import cors from 'cors';
import path from 'path';
import archiver from 'archiver';
import fs from 'fs';
import { Readable } from 'stream';
import { ExtractorService, detectPlatform, normalizeURL } from './services/extractorService';
import { cache } from './utils/cache';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Rewrite Vercel multi-project routePrefix if present
app.use((req, _res, next) => {
  if (req.url.startsWith('/_/backend')) {
    req.url = req.url.replace('/_/backend', '');
  }
  next();
});

// Serve the mock PNG files from the local static directory
const staticPath = path.join(__dirname, '../static');
app.use('/static', express.static(staticPath));

// Endpoint: Analyze URL
app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // 1. Detect platform
    const platform = detectPlatform(url);
    if (platform === 'unknown') {
      return res.status(400).json({ error: 'Only Instagram, Facebook, and TikTok links are supported.' });
    }

    // 2. Normalize URL (stripping tracking variables)
    const normalizedUrl = normalizeURL(url, platform);

    // 3. Create cache MD5 key hash
    const cacheKey = ExtractorService.createHash(normalizedUrl);

    // 4. Check cache hit
    if (cache.exists(cacheKey) && cache.notExpired(cacheKey)) {
      console.log(`[CACHE] Cache hit for key: ${cacheKey}`);
      const cachedResult = cache.get(cacheKey);
      return res.json(cachedResult);
    }

    console.log(`[CACHE] Cache miss for key: ${cacheKey}. Scraping URL: ${normalizedUrl}`);

    // 5. Extract with multi-strategy fallbacks
    const result = await ExtractorService.extractWithFallback(normalizedUrl, platform);

    // 6. Cache the successful extraction for 30 minutes
    cache.set(cacheKey, result, 1800);

    return res.json(result);
  } catch (error: any) {
    console.error('Analyze error:', error.message);
    return res.status(400).json({ error: error.message || 'Failed to analyze link' });
  }
});

// Endpoint: Proxy to stream remote assets and prevent CORS/Hotlinking errors
app.get('/api/proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL query parameter is required' });
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    if (targetUrl.includes('tiktok.com') || targetUrl.includes('tikwm.com')) {
      headers['Referer'] = 'https://www.tiktok.com/';
    } else if (targetUrl.includes('instagram.com') || targetUrl.includes('cdninstagram.com')) {
      headers['Referer'] = 'https://www.instagram.com/';
    }

    // Forward the Range header from the client request to the target server
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const response = await fetch(targetUrl, { headers });
    if (!response.ok && response.status !== 206) {
      return res.status(response.status).json({ error: `Proxy failed to load remote asset. Status: ${response.status}` });
    }

    // Forward crucial headers back to the client for streaming support
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    const contentRange = response.headers.get('content-range');
    if (contentRange) {
      res.setHeader('Content-Range', contentRange);
    }

    const acceptRanges = response.headers.get('accept-ranges');
    if (acceptRanges) {
      res.setHeader('Accept-Ranges', acceptRanges);
    } else {
      res.setHeader('Accept-Ranges', 'bytes');
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Send the matching status (e.g. 206 Partial Content or 200 OK)
    res.status(response.status);

    // Convert web response stream to Node stream and pipe it back to the user
    if (response.body) {
      const nodeStream = Readable.from(response.body as any);
      nodeStream.pipe(res);
    } else {
      res.status(500).json({ error: 'Remote response body is empty' });
    }
  } catch (err: any) {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// Endpoint: Download Media (single file stream or ZIP package compression)
app.post('/api/download', async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No media items specified for download' });
    }

    // Normalize downloadUrl by stripping Vercel service route prefix if present
    const normalizedItems = items.map((item: any) => {
      let downloadUrl = item.downloadUrl || '';
      if (downloadUrl.startsWith('/_/backend')) {
        downloadUrl = downloadUrl.replace('/_/backend', '');
      }
      return { ...item, downloadUrl };
    });

    // Case 1: Single file download
    if (normalizedItems.length === 1) {
      const item = normalizedItems[0];
      
      // If it's a local static file
      if (item.downloadUrl.startsWith('/static')) {
        const filePath = path.join(staticPath, item.filename);
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: 'Source media file not found' });
        }
        res.setHeader('Content-Disposition', `attachment; filename="${item.filename}"`);
        res.setHeader('Content-Type', 'image/png');
        return fs.createReadStream(filePath).pipe(res);
      }

      // If it's a remote URL, fetch and stream it back directly
      let actualUrl = item.downloadUrl;
      if (actualUrl.startsWith('/api/proxy')) {
        const urlParam = new URL(actualUrl, `http://localhost:${PORT}`).searchParams.get('url');
        if (urlParam) actualUrl = urlParam;
      }

      const fileResponse = await fetch(actualUrl);
      if (!fileResponse.ok) {
        return res.status(fileResponse.status).json({ error: 'Failed to download file from CDN' });
      }

      const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
      res.setHeader('Content-Disposition', `attachment; filename="${item.filename}"`);
      res.setHeader('Content-Type', contentType);

      if (fileResponse.body) {
        return Readable.from(fileResponse.body as any).pipe(res);
      } else {
        return res.status(500).json({ error: 'File body stream is empty' });
      }
    }

    // Case 2: ZIP Multi-file package zipping
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="mcollect_package.zip"');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    for (const item of normalizedItems) {
      if (item.downloadUrl.startsWith('/static')) {
        const filePath = path.join(staticPath, item.filename);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: item.filename });
        }
      } else {
        // Fetch remote URL and append stream to archive
        let actualUrl = item.downloadUrl;
        if (actualUrl.startsWith('/api/proxy')) {
          const urlParam = new URL(actualUrl, `http://localhost:${PORT}`).searchParams.get('url');
          if (urlParam) actualUrl = urlParam;
        }

        try {
          const fileResponse = await fetch(actualUrl);
          if (fileResponse.ok && fileResponse.body) {
            const fileStream = Readable.from(fileResponse.body as any);
            archive.append(fileStream, { name: item.filename });
          }
        } catch (err) {
          console.warn(`Failed to package remote URL ${actualUrl}:`, err);
        }
      }
    }

    await archive.finalize();
  } catch (error: any) {
    console.error('Download error:', error.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to package files for download' });
    }
  }
});

// Start Server if not running as a Vercel serverless function
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Mcollect Express server running on port ${PORT}`);
    console.log(`Serving static files from: ${staticPath}`);
  });
}

export default app;
