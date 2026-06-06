import { URL } from 'url';

// Helper: Resolve hostnames to support platforms
export function detectPlatform(url: string): 'instagram' | 'facebook' | 'tiktok' | 'unknown' {
  try {
    const cleanUrl = url.toLowerCase().trim();
    const formattedUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
    const parsed = new URL(formattedUrl);
    const host = parsed.hostname;

    if (host.includes('instagram.com')) {
      return 'instagram';
    }
    if (
      host.includes('facebook.com') || 
      host.includes('fb.watch') || 
      host.includes('fb.com')
    ) {
      return 'facebook';
    }
    if (host.includes('tiktok.com')) {
      return 'tiktok';
    }

    return 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

// Helper: Normalize URL and strip tracking parameters
export function normalizeURL(url: string, platform: string): string {
  try {
    const cleanUrl = url.trim();
    const formattedUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
    const parsed = new URL(formattedUrl);

    // List of tracking query parameters to strip
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'igsh', 't'];
    trackingParams.forEach(param => parsed.searchParams.delete(param));

    let normalized = parsed.origin + parsed.pathname;

    if (platform === 'instagram') {
      const pathParts = parsed.pathname.split('/').filter(Boolean); // e.g. ["p", "C8R5p9KyW-o"]
      if (pathParts.length >= 2 && ['p', 'reel', 'tv'].includes(pathParts[0])) {
        normalized = `${parsed.origin}/${pathParts[0]}/${pathParts[1]}/`;
      }
    } else if (platform === 'facebook') {
      // Rebuild URL and ensure tracking search parameters are gone
      const newUrl = new URL(parsed.toString());
      trackingParams.forEach(param => newUrl.searchParams.delete(param));
      normalized = newUrl.toString();
    } else if (platform === 'tiktok') {
      // Standardize vm.tiktok sharing and user videos
      normalized = parsed.origin + parsed.pathname;
    }

    return normalized;
  } catch (e) {
    return url;
  }
}
