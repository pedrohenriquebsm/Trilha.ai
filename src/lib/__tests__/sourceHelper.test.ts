import { describe, expect, it } from 'vitest';
import { getOptimizedTopicSources, sanitizeSourceUrl } from '@/src/lib/sourceHelper';

describe('getOptimizedTopicSources', () => {
  it('does not match Python just because the topic mentions "dados"', () => {
    const sources = getOptimizedTopicSources('Banco de dados relacional');
    const urls = sources.map((source) => source.url);

    expect(urls.some((url) => url.includes('python.org'))).toBe(false);
    expect(urls.some((url) => url.includes('postgresql.org'))).toBe(true);
  });

  it('matches Rust with a real official source', () => {
    const sources = getOptimizedTopicSources('Rust e ownership');
    expect(sources.some((source) => source.url === 'https://doc.rust-lang.org/book/')).toBe(true);
  });

  it('does not match Java for JavaScript', () => {
    const sources = getOptimizedTopicSources('JavaScript moderno');
    expect(sources.some((source) => source.url.includes('oracle.com/en/java'))).toBe(false);
    expect(sources.some((source) => source.url.includes('developer.mozilla.org'))).toBe(true);
  });

  it('prioriza o tópico em vez do título da trilha', () => {
    const sources = getOptimizedTopicSources(
      'CSS Grid e Flexbox',
      undefined,
      { title: 'React do zero', originalTopic: 'React' }
    );
    expect(sources.some((source) => source.url.includes('developer.mozilla.org'))).toBe(true);
    expect(sources.some((source) => source.url.includes('react.dev'))).toBe(false);
  });

  it('returns honest generic portals for unknown topics', () => {
    const sources = getOptimizedTopicSources('Introdução ao violão');
    expect(sources).toHaveLength(4);
    expect(sources[0].url).toBe('https://roadmap.sh/');
    expect(sources.every((source) => source.url.startsWith('https://'))).toBe(true);
  });
});

describe('sanitizeSourceUrl', () => {
  it('keeps direct http(s) links', () => {
    expect(sanitizeSourceUrl('https://react.dev/learn', 'React')).toBe('https://react.dev/learn');
  });

  it('rejects javascript: URLs and search links', () => {
    expect(sanitizeSourceUrl('javascript:alert(1)', 'React')).not.toContain('javascript:');
    expect(sanitizeSourceUrl('https://www.google.com/search?q=react', 'React')).not.toContain(
      'google.com/search'
    );
  });
});
