/**
 * Shared parser for JSON emitted by LLMs.
 *
 * Models frequently wrap JSON in markdown fences, include reasoning before the
 * object, use `[...]` as an ellipsis or leave trailing commas. This module is
 * intentionally defensive and side-effect free so it can be unit tested.
 */

export function stripCodeFences(content: string): string {
  return content.replace(/```(?:json|javascript|js)?\s*([\s\S]*?)\s*```/gi, '$1').trim();
}

export function extractJsonCandidate(content: string): string {
  let cleaned = stripCodeFences(content);

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned
    .replace(/\[\s*\.{2,}\s*\]/g, '[]')
    .replace(/,\s*\.{2,}/g, '')
    .replace(/\.{2,}\s*,/g, '')
    .replace(/,\s*([\]}])/g, '$1')
    .trim();
}

/**
 * Parses a possibly-malformed JSON object from an LLM response.
 *
 * @throws Error with a short, user-safe message when no valid JSON is found.
 */
export function parseLooseJson<T = unknown>(content: string): T {
  if (!content || !content.trim()) {
    throw new Error('A IA retornou uma resposta vazia.');
  }

  const candidate = extractJsonCandidate(content);

  try {
    return JSON.parse(candidate) as T;
  } catch {
    // Second pass: aggressively remove ellipses and duplicated commas.
    const heavySanitized = candidate
      .replace(/\.{3,}/g, '')
      .replace(/,\s*,/g, ',')
      .replace(/\[\s*,/g, '[')
      .replace(/,\s*([\]}])/g, '$1');

    try {
      return JSON.parse(heavySanitized) as T;
    } catch {
      throw new Error('Não foi possível decodificar o JSON retornado pela IA.');
    }
  }
}
