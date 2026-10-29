import { describe, expect, it } from 'vitest';
import {
  readBoolean,
  readContext,
  readEnum,
  readString,
  ValidationError,
} from '@/src/lib/validation';

describe('readString', () => {
  it('trims and enforces maximum length', () => {
    expect(readString('  React  ', 'topic', { max: 10 })).toBe('React');
    expect(() => readString('a'.repeat(11), 'topic', { max: 10 })).toThrow(ValidationError);
  });

  it('rejects empty required fields and accepts empty optional fields', () => {
    expect(() => readString('   ', 'topic')).toThrow(ValidationError);
    expect(readString(undefined, 'description', { required: false })).toBe('');
  });
});

describe('readEnum', () => {
  it('falls back to a default for invalid values', () => {
    expect(readEnum('research', 'mode', ['ai-driven', 'research'] as const, 'ai-driven')).toBe(
      'research'
    );
    expect(readEnum('hacked', 'mode', ['ai-driven', 'research'] as const, 'ai-driven')).toBe(
      'ai-driven'
    );
  });
});

describe('readContext', () => {
  it('sanitizes and caps context strings', () => {
    const context = readContext({ title: '  Rust  ', originalTopic: 'x'.repeat(300) });
    expect(context?.title).toBe('Rust');
    expect(context?.originalTopic).toHaveLength(200);
    expect(readContext(null)).toBeUndefined();
  });
});

describe('readBoolean', () => {
  it('accepts only true or "true"', () => {
    expect(readBoolean(true)).toBe(true);
    expect(readBoolean('true')).toBe(true);
    expect(readBoolean('false')).toBe(false);
    expect(readBoolean(1)).toBe(false);
  });
});
