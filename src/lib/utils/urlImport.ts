/**
 * SSRF-Safe Public Event URL Ingestion Utility
 */

export interface SafeUrlResult {
  isValid: boolean;
  error?: string;
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  htmlContent?: string;
}

const FORBIDDEN_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254', // AWS/GCP/Azure instance metadata
  'metadata.google.internal',
];

export function isSafePublicUrl(urlString: string): { isSafe: boolean; error?: string } {
  try {
    const parsed = new URL(urlString);

    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isSafe: false, error: 'Only http and https protocols are supported' };
    }

    const host = parsed.hostname.toLowerCase();

    // Check blacklist
    if (FORBIDDEN_HOSTS.includes(host)) {
      return { isSafe: false, error: 'Access to private or localhost addresses is prohibited' };
    }

    // Check private RFC 1918 IPv4 ranges
    if (
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return { isSafe: false, error: 'Internal network addresses are restricted' };
    }

    return { isSafe: true };
  } catch {
    return { isSafe: false, error: 'Invalid URL format' };
  }
}

/**
 * Fetches public event page and extracts metadata with SSRF safeguards
 */
export async function fetchEventUrlMetadata(urlString: string): Promise<SafeUrlResult> {
  const check = isSafePublicUrl(urlString);
  if (!check.isSafe) {
    return { isValid: false, error: check.error };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(urlString, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NearVibeEventBot/1.0 (+https://nearvibe.local)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return { isValid: false, error: `Remote server responded with status ${res.status}` };
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return { isValid: false, error: 'Destination URL is not an HTML webpage' };
    }

    // Limit read size to 512KB to prevent memory exhaustion
    const text = await res.text();
    const truncated = text.slice(0, 512 * 1024);

    // Extract OpenGraph tags
    const titleMatch =
      truncated.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      truncated.match(/<title>([^<]+)<\/title>/i);

    const descMatch =
      truncated.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
      truncated.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);

    const imageMatch =
      truncated.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);

    return {
      isValid: true,
      url: urlString,
      title: titleMatch ? titleMatch[1].trim() : undefined,
      description: descMatch ? descMatch[1].trim() : undefined,
      image: imageMatch ? imageMatch[1].trim() : undefined,
      htmlContent: truncated.replace(/<[^>]+>/g, ' ').slice(0, 3000), // Clean text excerpt
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { isValid: false, error: 'Request timed out while connecting to event URL' };
    }
    return { isValid: false, error: err.message || 'Failed to reach the public event URL' };
  }
}

export function validateSafeUrl(urlString: string): { safe: boolean; reason?: string } {
  const result = isSafePublicUrl(urlString);
  return {
    safe: result.isSafe,
    reason: result.error,
  };
}

export async function fetchPublicEventPage(urlString: string): Promise<{ success: boolean; title?: string; text?: string; error?: string }> {
  const res = await fetchEventUrlMetadata(urlString);
  if (!res.isValid) {
    return { success: false, error: res.error };
  }
  return {
    success: true,
    title: res.title,
    text: `${res.title || ''}\n${res.description || ''}\n${res.htmlContent || ''}`,
  };
}
