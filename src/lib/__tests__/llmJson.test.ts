import { describe, expect, it } from 'vitest';
import { extractJsonCandidate, parseLooseJson } from '@/src/lib/llmJson';

describe('parseLooseJson', () => {
  it('parses JSON inside markdown fences with surrounding reasoning', () => {
    const content = `Vou montar a trilha.
\`\`\`json
{"rt":"React","levels":{"BEGINNER":[{"title":"JSX"}]}}
\`\`\`
Pronto.`;

    const parsed = parseLooseJson<{ rt: string }>(content);
    expect(parsed.rt).toBe('React');
  });

  it('removes trailing commas and ellipsis placeholders', () => {
    const content = '{"a":[1,2,], "b":[...], "c":"ok",}';
    const parsed = parseLooseJson<{ a: number[]; b: unknown[]; c: string }>(content);

    expect(parsed.a).toEqual([1, 2]);
    expect(parsed.b).toEqual([]);
    expect(parsed.c).toBe('ok');
  });

  it('throws a user-safe error for empty or invalid content', () => {
    expect(() => parseLooseJson('')).toThrow('A IA retornou uma resposta vazia.');
    expect(() => parseLooseJson('sem json aqui')).toThrow(
      'Não foi possível decodificar o JSON retornado pela IA.'
    );
  });
});

describe('extractJsonCandidate', () => {
  it('cuts text before the first brace and after the last brace', () => {
    expect(extractJsonCandidate('texto {"a":1} resto')).toBe('{"a":1}');
  });
});
