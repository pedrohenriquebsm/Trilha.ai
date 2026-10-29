import { describe, expect, it } from 'vitest';
import {
  CURRICULUM_LEVELS,
  parseCurriculumToon,
} from '@/src/lib/curriculumParser';

const TOPICS_PER_LEVEL = 8;
const LEVEL_ROWS = 8;

function buildRow(level: number, index: number): string {
  return `${level}|Tópico ${level}-${index}|Descrição curta do tópico|valor${level}-${index} sql`;
}

function buildPayload(options: { levels?: number[]; headerCount?: number; title?: string } = {}) {
  const levels = options.levels ?? CURRICULUM_LEVELS.map(() => TOPICS_PER_LEVEL);
  const rows: string[] = [];

  levels.forEach((count, level) => {
    for (let index = 0; index < count; index += 1) {
      rows.push(buildRow(level, index));
    }
  });

  const headerCount = options.headerCount ?? rows.length;
  const title = options.title ?? 'Banco de Dados: do Básico à Arquitetura';

  return ['```toon', `title: ${title}`, `topics[${headerCount}]{lv|t|d|s}:`, ...rows, '```'].join(
    '\n'
  );
}

describe('parseCurriculumToon', () => {
  it('parses 40 topics across the five levels', () => {
    const result = parseCurriculumToon(buildPayload(), 'Banco de dados');

    expect(result.totalTopics).toBe(40);
    expect(result.roadmapTitle).toBe('Banco de Dados: do Básico à Arquitetura');
    expect(result.levels.PREREQUISITES).toHaveLength(8);
    expect(result.levels.NEXT_STEPS).toHaveLength(8);
    expect(result.levels.BEGINNER[0].order).toBe(1);
    expect(result.levels.BEGINNER[0].searchTerms.length).toBeGreaterThan(0);
  });

  it('ignores preamble text and reads only the fenced block', () => {
    const payload = `Claro! Aqui está a grade:\n\n${buildPayload()}\n\nEspero ter ajudado.`;

    const result = parseCurriculumToon(payload, 'Banco de dados');
    expect(result.totalTopics).toBe(40);
  });

  it('drops malformed rows (wrong field count) and keeps the rest', () => {
    const payload = [
      '```toon',
      'title: Rust',
      'topics[40]{lv|t|d|s}:',
      ...CURRICULUM_LEVELS.flatMap((_, level) =>
        Array.from({ length: LEVEL_ROWS }, (_, index) => buildRow(level, index))
      ),
      '0|Linha quebrada|com|pipe|extra',
      '```',
    ].join('\n');

    const result = parseCurriculumToon(payload, 'Rust');
    expect(result.totalTopics).toBe(40);
    expect(
      Object.values(result.levels)
        .flat()
        .some((topic) => topic.title.includes('Linha quebrada'))
    ).toBe(false);
  });

  it('drops rows with an invalid level', () => {
    const payload = [
      '```toon',
      'title: Go',
      'topics[41]{lv|t|d|s}:',
      ...CURRICULUM_LEVELS.flatMap((_, level) =>
        Array.from({ length: LEVEL_ROWS }, (_, index) => buildRow(level, index))
      ),
      '9|Nível inexistente|não deve entrar|go',
      '```',
    ].join('\n');

    const result = parseCurriculumToon(payload, 'Go');
    expect(result.totalTopics).toBe(40);
  });

  it('throws when a level has fewer than the minimum topics', () => {
    const payload = buildPayload({ levels: [8, 8, 8, 8, 3] });

    expect(() => parseCurriculumToon(payload, 'Rust')).toThrow(/NEXT_STEPS/);
  });

  it('deduplicates titles ignoring case and accents', () => {
    const payload = [
      '```toon',
      'title: React',
      'topics[41]{lv|t|d|s}:',
      ...CURRICULUM_LEVELS.flatMap((_, level) =>
        Array.from({ length: LEVEL_ROWS }, (_, index) =>
          level === 1 && index === 1
            ? `1|Introdução a Hooks|Repetido|react` // same as index 0 below
            : buildRow(level, index)
        )
      ),
      '1|Introdução a Hooks|Duplicado|react',
      '```',
    ].join('\n');

    const result = parseCurriculumToon(payload, 'React');
    const beginnerTitles = result.levels.BEGINNER.map((topic) => topic.title.toLowerCase());
    const duplicates = beginnerTitles.filter((title) => title === 'introdução a hooks');

    expect(duplicates).toHaveLength(1);
    expect(result.totalTopics).toBe(40);
  });

  it('drops generic "full stack" drift when the topic is something else', () => {
    const payload = [
      '```toon',
      'title: Full Stack Developer',
      'topics[40]{lv|t|d|s}:',
      ...CURRICULUM_LEVELS.flatMap((_, level) =>
        Array.from({ length: LEVEL_ROWS }, (_, index) =>
          level === 2 && index === 0
            ? '2|Desenvolvedor Web Full Stack|Vira carreira|fullstack'
            : buildRow(level, index)
        )
      ),
      '```',
    ].join('\n');

    const result = parseCurriculumToon(payload, 'PostgreSQL');

    expect(result.totalTopics).toBe(39);
    expect(
      Object.values(result.levels)
        .flat()
        .some((topic) => /full stack/i.test(topic.title))
    ).toBe(false);
  });

  it('keeps "full stack" when the user actually asked for it', () => {
    const payload = buildPayload();
    const result = parseCurriculumToon(
      payload.replace('Tópico 0-0', 'Desenvolvedor Full Stack'),
      'Full stack'
    );

    expect(result.levels.PREREQUISITES[0].title).toBe('Desenvolvedor Full Stack');
  });

  it('extracts the title from the header and falls back to the topic', () => {
    const withoutTitle = buildPayload().replace(/^title: .*$/m, '');
    expect(parseCurriculumToon(withoutTitle, 'Docker').roadmapTitle).toBe('Docker');
  });

  it('accepts the default TOON comma form and a reordered header', () => {
    const rows = CURRICULUM_LEVELS.flatMap((_, level) =>
      Array.from(
        { length: LEVEL_ROWS },
        (_, index) => `${level},Tópico ${level}-${index},Descrição curta,termo${level} termo${index}`
      )
    );

    const payload = [
      '```toon',
      'title: Go',
      'topics[40]{lv,t,d,s}:',
      ...rows,
      '```',
    ].join('\n');

    const result = parseCurriculumToon(payload, 'Go');
    expect(result.totalTopics).toBe(40);
    expect(result.levels.ADVANCED[0].searchTerms).toEqual(['termo3', 'termo0']);
  });

  it('throws on empty output instead of returning an empty roadmap', () => {
    expect(() => parseCurriculumToon('', 'Rust')).toThrow();
    expect(() => parseCurriculumToon('```toon\n```', 'Rust')).toThrow();
  });
});
