import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dedupeSourcesByUrl,
  filterCitableSources,
  isAllowedSourceHost,
  isAllowedSourceUrl,
  normalizeSourceUrl,
  resetSourcePolicyCache,
  verifySource,
} from '@/src/lib/sourcePolicy';

type FetchMock = ReturnType<typeof vi.fn>;

function mockFetch(response: Partial<Response> | Error): FetchMock {
  const fn = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return {
      status: 200,
      url: '',
      ...response,
    } as Response;
  });

  vi.stubGlobal('fetch', fn);
  return fn as unknown as FetchMock;
}

describe('normalizeSourceUrl', () => {
  it('keeps direct https links', () => {
    expect(normalizeSourceUrl('https://react.dev/learn')).toBe('https://react.dev/learn');
  });

  it('rejects http, javascript: and garbage', () => {
    expect(normalizeSourceUrl('http://react.dev/learn')).toBeNull();
    expect(normalizeSourceUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeSourceUrl('não é url')).toBeNull();
  });

  it('strips tracking params, hash and trailing slash', () => {
    expect(normalizeSourceUrl('https://react.dev/learn/?utm_source=x&a=1#top')).toBe(
      'https://react.dev/learn?a=1'
    );
  });
});

describe('isAllowedSourceUrl', () => {
  it('accepts allowlisted hosts and their subdomains', () => {
    expect(isAllowedSourceUrl('https://react.dev/learn')).toBe(true);
    expect(isAllowedSourceUrl('https://docs.python.org/3/')).toBe(true);
  });

  it('rejects hosts outside the allowlist even when they look valid', () => {
    expect(isAllowedSourceUrl('https://medium.com/@someone/react')).toBe(false);
    expect(isAllowedSourceUrl('https://react.dev.evil.example/learn')).toBe(false);
  });

  it('rejects local/private hosts', () => {
    expect(isAllowedSourceUrl('https://localhost/docs')).toBe(false);
    expect(isAllowedSourceUrl('http://react.dev/learn')).toBe(false);
  });
});

describe('isAllowedSourceHost', () => {
  it('matches exactly and by subdomain', () => {
    expect(isAllowedSourceHost('python.org')).toBe(true);
    expect(isAllowedSourceHost('docs.python.org')).toBe(true);
    expect(isAllowedSourceHost('notpython.org')).toBe(false);
  });
});

describe('verifySource', () => {
  beforeEach(() => resetSourcePolicyCache());
  afterEach(() => vi.unstubAllGlobals());

  it('returns ok for a successful response', async () => {
    mockFetch({ status: 200 });
    await expect(verifySource('https://react.dev/learn')).resolves.toBe('ok');
  });

  it('returns broken for 404 and 410', async () => {
    mockFetch({ status: 404 });
    await expect(verifySource('https://react.dev/missing')).resolves.toBe('broken');
  });

  it('returns unknown on timeout instead of claiming the link is valid', async () => {
    mockFetch(new Error('The operation was aborted due to timeout'));
    await expect(verifySource('https://react.dev/learn')).resolves.toBe('unknown');
  });

  it('falls back to GET when HEAD is not implemented', async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce({ status: 405, url: '' })
      .mockResolvedValueOnce({ status: 200, url: '' });

    vi.stubGlobal('fetch', fn);

    await expect(verifySource('https://react.dev/learn')).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn.mock.calls[1][1]).toMatchObject({ method: 'GET' });
  });

  it('does not even call the network for an untrusted host', async () => {
    const fn = mockFetch({ status: 200 });
    await expect(verifySource('https://medium.com/@someone/react')).resolves.toBe('broken');
    expect(fn).not.toHaveBeenCalled();
  });

  it('caches results per URL', async () => {
    const fn = mockFetch({ status: 200 });
    await verifySource('https://react.dev/learn');
    await verifySource('https://react.dev/learn');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('filterCitableSources', () => {
  beforeEach(() => resetSourcePolicyCache());
  afterEach(() => vi.unstubAllGlobals());

  it('keeps only trusted, reachable sources', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        status: url.includes('missing') ? 404 : 200,
        url: '',
      }))
    );

    const kept = await filterCitableSources([
      { url: 'https://react.dev/learn', title: 'React' },
      { url: 'https://react.dev/missing', title: 'Broken' },
      { url: 'https://medium.com/@x/react', title: 'Untrusted' },
    ]);

    expect(kept.map((source) => source.title)).toEqual(['React']);
  });
});

describe('dedupeSourcesByUrl', () => {
  it('dedupes after normalization', () => {
    const result = dedupeSourcesByUrl([
      { url: 'https://react.dev/learn' },
      { url: 'https://react.dev/learn/?utm_source=newsletter' },
      { url: 'https://react.dev/reference' },
    ]);

    expect(result).toHaveLength(2);
  });
});
