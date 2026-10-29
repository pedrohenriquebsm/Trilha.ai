/**
 * Source policy for AI-suggested references ("cite-or-drop").
 *
 * The model may only add a reference when:
 *   1. the URL is https,
 *   2. the host is in the curated allowlist below,
 *   3. the URL responds successfully.
 *
 * Everything else is dropped. The curated catalog in `sourceHelper.ts` is the
 * source of truth and fills the gaps, so a dropped reference never results in a
 * fabricated replacement.
 */

import { isSafeHttpUrl } from './urlVerifier';

/**
 * Domains we trust for technical study material. Subdomains are allowed
 * (e.g. `docs.python.org` matches `python.org`).
 */
export const ALLOWED_SOURCE_HOSTS: readonly string[] = [
  'developer.mozilla.org',
  'react.dev',
  'nextjs.org',
  'nodejs.org',
  'typescriptlang.org',
  'python.org',
  'postgresql.org',
  'dev.mysql.com',
  'mongodb.com',
  'redis.io',
  'docker.com',
  'kubernetes.io',
  'go.dev',
  'rust-lang.org',
  'learn.microsoft.com',
  'docs.aws.amazon.com',
  'cloud.google.com',
  'freecodecamp.org',
  'web.dev',
  'roadmap.sh',
  'w3.org',
  'ietf.org',
  'rfc-editor.org',
  'git-scm.com',
  'nginx.org',
  'grafana.com',
  'elastic.co',
  'spring.io',
  'djangoproject.com',
  'laravel.com',
  'php.net',
  'ruby-lang.org',
  'kotlinlang.org',
  'swift.org',
  'docs.oracle.com',
];

export type SourceStatus = 'ok' | 'broken' | 'unknown';

const VERIFY_CACHE = new Map<string, { status: SourceStatus; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 3000;

const TRACKING_PARAM = /^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|ref$)/i;

/**
 * Normalizes a URL for comparison and validation.
 * Returns `null` when the URL is not a usable https URL.
 */
export function normalizeSourceUrl(raw: string): string | null {
  if (typeof raw !== 'string') return null;

  const value = raw.trim();
  if (!value) return null;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:') return null;
  if (!parsed.hostname) return null;

  parsed.hostname = parsed.hostname.toLowerCase();
  parsed.hash = '';

  for (const key of Array.from(parsed.searchParams.keys())) {
    if (TRACKING_PARAM.test(key)) parsed.searchParams.delete(key);
  }

  parsed.pathname = parsed.pathname.replace(/\/{2,}/g, '/');
  if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  }

  return parsed.toString();
}

export function isAllowedSourceHost(host: string): boolean {
  const normalized = host.toLowerCase();
  return ALLOWED_SOURCE_HOSTS.some(
    (allowed) => normalized === allowed || normalized.endsWith(`.${allowed}`)
  );
}

/** True when the URL is https, safe (no SSRF) and on the trusted allowlist. */
export function isAllowedSourceUrl(raw: string): boolean {
  const normalized = normalizeSourceUrl(raw);
  if (!normalized || !isSafeHttpUrl(normalized)) return false;

  try {
    return isAllowedSourceHost(new URL(normalized).hostname);
  } catch {
    return false;
  }
}

function classify(response: Response): SourceStatus {
  const status = response.status;

  if (status === 404 || status === 410) return 'broken';

  if (status >= 200 && status < 400) {
    // Redirects are followed; make sure the final host is still trusted.
    if (response.url) {
      try {
        if (!isAllowedSourceHost(new URL(response.url).hostname)) return 'broken';
      } catch {
        // Non-parseable final URL: fall through and accept the response.
      }
    }
    return 'ok';
  }

  // 403/429/5xx: the site exists but refused us. Do not claim it is valid
  // (cite-or-drop), but do not cache it as definitely broken either.
  return 'unknown';
}

async function probeWithGet(url: string, timeoutMs: number): Promise<SourceStatus> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Range: 'bytes=0-0',
        'User-Agent': 'Trilha.ai source verifier',
      },
    });
    return classify(response);
  } catch {
    return 'unknown';
  }
}

async function probe(url: string, timeoutMs: number): Promise<SourceStatus> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'Trilha.ai source verifier' },
    });

    if (response.status === 405 || response.status === 501) {
      return probeWithGet(url, timeoutMs);
    }

    return classify(response);
  } catch {
    return 'unknown';
  }
}

/**
 * Verifies that a source is reachable. Never throws.
 * Results are cached for 24h per URL.
 */
export async function verifySource(
  raw: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<SourceStatus> {
  const url = normalizeSourceUrl(raw);
  if (!url || !isAllowedSourceUrl(url)) return 'broken';

  const cached = VERIFY_CACHE.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.status;
  }

  const status = await probe(url, timeoutMs);
  VERIFY_CACHE.set(url, { status, expiresAt: Date.now() + CACHE_TTL_MS });
  return status;
}

/** A source is citable only when it is trusted *and* verified. */
export async function isSourceCitable(raw: string): Promise<boolean> {
  return (await verifySource(raw)) === 'ok';
}

/** cite-or-drop: removes every source that is not trusted and reachable. */
export async function filterCitableSources<T extends { url: string }>(
  sources: readonly T[]
): Promise<T[]> {
  const checked = await Promise.all(
    sources.map(async (source) => ({ source, citable: await isSourceCitable(source.url) }))
  );

  return checked.filter((item) => item.citable).map((item) => item.source);
}

/**
 * Removes duplicate URLs after normalization (keeps the first occurrence).
 */
export function dedupeSourcesByUrl<T extends { url: string }>(sources: readonly T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const source of sources) {
    const key = normalizeSourceUrl(source.url) || source.url;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(source);
  }

  return result;
}

/**
 * Kill switch for cite-or-drop. Enabled by default; set `STRICT_SOURCES="0"`
 * to fall back to the legacy "only discard 404/410" behavior.
 */
export function strictSourcesEnabled(): boolean {
  const flag = (process.env.STRICT_SOURCES || '').trim().toLowerCase();
  return flag !== '0' && flag !== 'false' && flag !== 'off';
}

/** Test helper: clears the verification cache between test cases. */
export function resetSourcePolicyCache(): void {
  VERIFY_CACHE.clear();
}
