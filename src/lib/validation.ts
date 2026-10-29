/**
 * Input validation helpers shared by the AI Route Handlers.
 * No external dependency: keeps the AI Studio runtime light.
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

interface StringOptions {
  min?: number;
  max?: number;
  required?: boolean;
}

export function readString(
  value: unknown,
  field: string,
  { min = 1, max = 200, required = true }: StringOptions = {}
): string {
  if (value === undefined || value === null || value === '') {
    if (!required) return '';
    throw new ValidationError(`O campo '${field}' é obrigatório.`);
  }

  if (typeof value !== 'string') {
    throw new ValidationError(`O campo '${field}' deve ser um texto.`);
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    if (!required) return '';
    throw new ValidationError(`O campo '${field}' é obrigatório.`);
  }

  if (trimmed.length < min) {
    throw new ValidationError(`O campo '${field}' deve ter pelo menos ${min} caractere(s).`);
  }

  if (trimmed.length > max) {
    throw new ValidationError(`O campo '${field}' deve ter no máximo ${max} caracteres.`);
  }

  return trimmed;
}

export function readEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  fallback: T
): T {
  if (typeof value !== 'string') return fallback;
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readBoolean(value: unknown): boolean {
  return value === true || value === 'true';
}

export function readContext(value: unknown): { title: string; originalTopic: string } | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const ctx = value as Record<string, unknown>;
  const title = typeof ctx.title === 'string' ? ctx.title.trim().slice(0, 200) : '';
  const originalTopic =
    typeof ctx.originalTopic === 'string' ? ctx.originalTopic.trim().slice(0, 200) : '';

  if (!title && !originalTopic) return undefined;
  return { title, originalTopic };
}
