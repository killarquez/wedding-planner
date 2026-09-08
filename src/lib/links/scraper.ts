/**
 * URL Metadata Scraper
 * Extracts OpenGraph metadata (title, image, description, site name) for inspiration links.
 */

export interface ScrapedMetadata {
  url: string;
  title: string;
  description: string;
  image_url: string | null;
  site_name: string;
}

export async function scrapeUrlMetadata(targetUrl: string): Promise<ScrapedMetadata> {
  let normalizedUrl = targetUrl.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  let hostname = '';
  try {
    hostname = new URL(normalizedUrl).hostname.replace(/^www\./, '');
  } catch (e) {
    hostname = 'link';
  }

  const defaultResult: ScrapedMetadata = {
    url: normalizedUrl,
    title: `${hostname} idea`,
    description: '',
    image_url: null,
    site_name: hostname
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (compatible; WeddingLinkBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8'
      }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return defaultResult;
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.startsWith('image/')) {
      return {
        url: normalizedUrl,
        title: `Image from ${hostname}`,
        description: 'Direct image link',
        image_url: normalizedUrl,
        site_name: hostname
      };
    }

    const html = await res.text();

    // Helper regex extractors
    const extractMeta = (properties: string[]): string => {
      for (const prop of properties) {
        // property="..." content="..."
        const regex1 = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
        const match1 = html.match(regex1);
        if (match1 && match1[1]) return decodeHtmlEntities(match1[1].trim());

        // content="..." property="..."
        const regex2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i');
        const match2 = html.match(regex2);
        if (match2 && match2[1]) return decodeHtmlEntities(match2[1].trim());
      }
      return '';
    };

    const extractTitle = (): string => {
      const ogTitle = extractMeta(['og:title', 'twitter:title']);
      if (ogTitle) return ogTitle;
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) return decodeHtmlEntities(titleMatch[1].trim());
      return `${hostname} inspiration`;
    };

    const extractDescription = (): string => {
      return extractMeta(['og:description', 'twitter:description', 'description']);
    };

    const extractImage = (): string | null => {
      const img = extractMeta(['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']);
      if (!img) return null;
      if (img.startsWith('http://') || img.startsWith('https://')) return img;
      try {
        return new URL(img, normalizedUrl).toString();
      } catch (e) {
        return null;
      }
    };

    const extractSiteName = (): string => {
      const site = extractMeta(['og:site_name', 'application-name']);
      if (site) return site;
      return hostname.charAt(0).toUpperCase() + hostname.slice(1);
    };

    const title = extractTitle();
    const description = extractDescription();
    const imageUrl = extractImage();
    const siteName = extractSiteName();

    return {
      url: normalizedUrl,
      title: title || `${siteName} idea`,
      description: description || '',
      image_url: imageUrl,
      site_name: siteName
    };
  } catch (error) {
    return defaultResult;
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
}
