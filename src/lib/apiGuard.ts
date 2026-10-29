import { NextResponse } from 'next/server';
import { ApiError } from './apiError';
import { ValidationError } from './validation';
import { assertCreditsAvailable, verifyFirebaseIdToken, type AuthenticatedUser } from './serverAuth';

const MAX_BODY_BYTES = 32 * 1024;

interface GuardOptions {
  /** Requires the user to have at least 1 credit (creation endpoints). */
  requireCredits?: boolean;
  /** Maximum AI requests per user per minute. Defaults to 30. */
  rateLimitPerMinute?: number;
}

export interface GuardResult {
  user: AuthenticatedUser;
  body: Record<string, unknown>;
}

async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) {
    throw new ApiError(413, 'Requisição muito grande.');
  }

  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) {
    throw new ApiError(413, 'Requisição muito grande.');
  }

  if (!text.trim()) {
    throw new ValidationError('O corpo da requisição é obrigatório.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ValidationError('O corpo da requisição deve ser um JSON válido.');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ValidationError('O corpo da requisição deve ser um objeto JSON.');
  }

  return parsed as Record<string, unknown>;
}

// In-memory rate limiter. AI Studio runs a single app instance, so this is
// enough to stop accidental loops and basic abuse without external services.
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
let rateOperations = 0;

function enforceRateLimit(uid: string, limit: number): void {
  const now = Date.now();
  const key = `ai:${uid}`;
  let bucket = rateBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + 60_000 };
    rateBuckets.set(key, bucket);
  }

  bucket.count += 1;
  rateOperations += 1;

  if (rateOperations % 500 === 0) {
    for (const [bucketKey, value] of rateBuckets) {
      if (value.resetAt <= now) rateBuckets.delete(bucketKey);
    }
  }

  if (bucket.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw new ApiError(429, 'Muitas requisições de IA em pouco tempo. Aguarde um instante.', {
      'Retry-After': String(retryAfter),
    });
  }
}

/**
 * Authenticates the request, applies rate limiting/validation gates and
 * returns the parsed JSON body.
 */
export async function guardApiRequest(
  req: Request,
  { requireCredits = false, rateLimitPerMinute = 30 }: GuardOptions = {}
): Promise<GuardResult> {
  const authorization = req.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) {
    throw new ApiError(401, 'Entre na sua conta para usar os recursos de IA.');
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    throw new ApiError(401, 'Entre na sua conta para usar os recursos de IA.');
  }

  const user = await verifyFirebaseIdToken(token);
  enforceRateLimit(user.uid, rateLimitPerMinute);

  if (requireCredits) {
    await assertCreditsAvailable(user.uid, token);
  }

  const body = await readJsonBody(req);

  return { user, body };
}

/**
 * Converts known errors into safe JSON responses and hides internal details.
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  if (error instanceof ApiError) {
    if (error.status >= 500) {
      console.error(`[${context}]`, error.message);
    }
    return NextResponse.json(
      { error: error.message },
      { status: error.status, headers: error.headers }
    );
  }

  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('429') || lower.includes('rate limit') || lower.includes('quota')) {
    return NextResponse.json(
      { error: 'Limite temporário de uso da IA atingido. Aguarde alguns segundos e tente novamente.' },
      { status: 429 }
    );
  }

  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('aborted')) {
    return NextResponse.json(
      { error: 'A IA demorou demais para responder. Tente novamente com um tema mais específico.' },
      { status: 504 }
    );
  }

  console.error(`[${context}]`, error);
  return NextResponse.json(
    { error: 'Erro interno ao processar a solicitação de IA. Tente novamente.' },
    { status: 500 }
  );
}
