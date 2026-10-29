/**
 * Lightweight URL check for AI-suggested sources.
 *
 * We only discard URLs that definitely do not exist (404/410). Timeouts,
 * bot protection (403) and redirects are kept, because many documentation
 * sites reject automated HEAD requests.
 *
 * SSRF protection: only http(s) is allowed, redirects are not followed and
 * obvious private/loopback hosts are rejected.
 */

const BROKEN_CACHE = new Map<string, { broken: boolean; expiresAt: number }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 2500;

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /\.local$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
  /^\[?::1\]?$/,
];

export function isSafeHttpUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  const host = parsed.hostname;
  if (!host) return false;
  return !PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(host));
}

export async function isSourceDefinitelyBroken(url: string): Promise<boolean> {
  if (!isSafeHttpUrl(url)) return true;

  const cached = BROKEN_CACHE.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.broken;
  }

  let broken = false;

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'Trilha.ai link checker' },
    });

    if (response.status === 404 || response.status === 410) {
      broken = true;
    } else if (response.status === 405 || response.status === 501) {
      // Some servers do not implement HEAD; try a tiny GET.
      const getResponse = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { Range: 'bytes=0-0', 'User-Agent': 'Trilha.ai link checker' },
      });
      broken = getResponse.status === 404 || getResponse.status === 410;
    }
  } catch {
    // Network error/timeout: keep the link instead of discarding a valid source.
    broken = false;
  }

  BROKEN_CACHE.set(url, { broken, expiresAt: Date.now() + CACHE_TTL_MS });
  return broken;
}
