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
  price?: number | null;
  currency?: string | null;
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
    site_name: hostname,
    price: null,
    currency: null
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
        site_name: hostname,
        price: null,
        currency: null
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

    const extractPrice = (): { price: number | null; currency: string | null } => {
      // 1. Check e-commerce meta tags
      const metaPriceStr = extractMeta([
        'product:price:amount',
        'og:price:amount',
        'product:pretax_price:amount',
        'price',
        'twitter:data1'
      ]);
      const currency = extractMeta(['product:price:currency', 'og:price:currency']) || 'USD';

      if (metaPriceStr) {
        const cleaned = parseFloat(metaPriceStr.replace(/[^0-9.]/g, ''));
        if (!isNaN(cleaned) && cleaned > 0) {
          return { price: cleaned, currency };
        }
      }

      // 2. Check JSON-LD structured schemas
      const jsonLdMatches = html.match(/<script type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (jsonLdMatches) {
        for (const block of jsonLdMatches) {
          try {
            const rawContent = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
            const parsed = JSON.parse(rawContent);
            const checkItem = (item: any): number | null => {
              if (!item) return null;
              if (item.offers) {
                if (Array.isArray(item.offers) && item.offers[0]?.price) {
                  const val = parseFloat(String(item.offers[0].price).replace(/[^0-9.]/g, ''));
                  if (!isNaN(val) && val > 0) return val;
                } else if (item.offers.price) {
                  const val = parseFloat(String(item.offers.price).replace(/[^0-9.]/g, ''));
                  if (!isNaN(val) && val > 0) return val;
                } else if (item.offers.lowPrice) {
                  const val = parseFloat(String(item.offers.lowPrice).replace(/[^0-9.]/g, ''));
                  if (!isNaN(val) && val > 0) return val;
                }
              }
              return null;
            };

            let foundVal = checkItem(parsed);
            if (foundVal) return { price: foundVal, currency };

            if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
              for (const node of parsed['@graph']) {
                foundVal = checkItem(node);
                if (foundVal) return { price: foundVal, currency };
              }
            }
          } catch (e) {
            // Ignore invalid JSON-LD blocks
          }
        }
      }

      // 3. Fallback: Microdata itemprop="price"
      const itempropMatch = html.match(/itemprop=["']price["'][^>]*content=["']([^"']+)["']/i) ||
                            html.match(/content=["']([^"']+)["'][^>]*itemprop=["']price["']/i);
      if (itempropMatch && itempropMatch[1]) {
        const val = parseFloat(itempropMatch[1].replace(/[^0-9.]/g, ''));
        if (!isNaN(val) && val > 0) return { price: val, currency };
      }

      return { price: null, currency: null };
    };

    const title = extractTitle();
    const description = extractDescription();
    const imageUrl = extractImage();
    const siteName = extractSiteName();
    const { price, currency } = extractPrice();

    return {
      url: normalizedUrl,
      title: title || `${siteName} idea`,
      description: description || '',
      image_url: imageUrl,
      site_name: siteName,
      price: price || null,
      currency: currency || null
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
