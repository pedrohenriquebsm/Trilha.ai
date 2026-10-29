import { describe, expect, it } from 'vitest';
import { parseCompactChallenge, parseCompactRoadmap } from '@/src/lib/toonParser';

describe('parseCompactRoadmap', () => {
  it('normalizes short keys and level aliases', () => {
    const result = parseCompactRoadmap({
      rt: 'React',
      lv: {
        p: [{ t: 'HTML', d: 'Base', o: 1, s: ['html'] }],
        b: [{ title: 'Componentes', description: 'JSX', order: 2 }],
        i: [],
        a: [],
        n: [],
      },
    });

    expect(result.roadmapTitle).toBe('React');
    expect(result.levels.BEGINNER[0].title).toBe('Componentes');
    expect(result.levels.BEGINNER[0].order).toBe(2);
    expect(result.levels.PREREQUISITES[0].description).toBe('Base');
  });

  it('never invents topics for empty levels (prevents fake charged roadmaps)', () => {
    const result = parseCompactRoadmap({
      roadmapTitle: 'Rust',
      levels: {
        PREREQUISITES: [],
        BEGINNER: [],
        INTERMEDIATE: [],
        ADVANCED: [],
        NEXT_STEPS: [],
      },
    });

    expect(Object.values(result.levels).flat()).toHaveLength(0);
  });

  it('deduplicates titles and caps topics per level', () => {
    const topics = Array.from({ length: 20 }, (_, index) => ({
      title: index === 0 ? 'Ownership' : `Tópico ${index}`,
    }));
    topics.push({ title: 'Ownership' });

    const result = parseCompactRoadmap({
      rt: 'Rust',
      levels: { BEGINNER: topics },
    });

    expect(result.levels.BEGINNER).toHaveLength(12);
    expect(
      result.levels.BEGINNER.filter((topic) => topic.title === 'Ownership')
    ).toHaveLength(1);
  });
});

describe('parseCompactChallenge', () => {
  it('supports a challenge with activity but no quiz', () => {
    const challenge = parseCompactChallenge({
      ac: { t: 'Prática', d: 'Implemente', r: ['Criar função'] },
    });

    expect(challenge.questions).toHaveLength(0);
    expect(challenge.activity?.title).toBe('Prática');
  });

  it('returns null activity when the model omits it', () => {
    const challenge = parseCompactChallenge({
      qs: [{ q: 'Pergunta?', o: ['A', 'B'], a: 1, e: 'Porque sim' }],
    });

    expect(challenge.activity).toBeNull();
    expect(challenge.questions[0].correctAnswer).toBe(1);
    expect(challenge.questions[0].options).toEqual(['A', 'B']);
  });

  it('clamps an out-of-range correct answer to 0', () => {
    const challenge = parseCompactChallenge({
      qs: [{ q: 'Pergunta?', o: ['A', 'B'], a: 99 }],
    });

    expect(challenge.questions[0].correctAnswer).toBe(0);
  });

  it('skips malformed questions instead of inventing options', () => {
    const challenge = parseCompactChallenge({
      qs: [
        { q: 'Sem opções?', o: [] },
        { o: ['A', 'B'], a: 0 },
        { q: 'Válida?', o: ['A', 'B'], a: 1 },
      ],
    });

    expect(challenge.questions).toHaveLength(1);
    expect(challenge.questions[0].question).toBe('Válida?');
  });

  it('drops an activity without a real title', () => {
    const challenge = parseCompactChallenge({ ac: { d: 'Sem título' } });
    expect(challenge.activity).toBeNull();
  });
});
