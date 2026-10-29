import { decodeProtectedHeader, importX509, jwtVerify } from 'jose';
import firebaseConfig from '../../firebase-applet-config.json';
import { ApiError } from './apiError';

const PROJECT_ID = firebaseConfig.projectId;
const DATABASE_ID = firebaseConfig.firestoreDatabaseId;

const SECURETOKEN_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

interface CertCache {
  certs: Record<string, string>;
  expiresAt: number;
}

let certCache: CertCache | null = null;
const keyCache = new Map<string, Awaited<ReturnType<typeof importX509>>>();

async function getSecureTokenCerts(): Promise<Record<string, string>> {
  if (certCache && certCache.expiresAt > Date.now()) {
    return certCache.certs;
  }

  let response: Response;
  try {
    response = await fetch(SECURETOKEN_CERTS_URL, {
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(503, 'Não foi possível validar sua sessão agora. Tente novamente.');
  }

  if (!response.ok) {
    throw new ApiError(503, 'Não foi possível validar sua sessão agora. Tente novamente.');
  }

  const certs = (await response.json()) as Record<string, string>;
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = /max-age=(\d+)/i.exec(cacheControl);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;

  certCache = {
    certs,
    expiresAt: Date.now() + Math.max(60, maxAgeSeconds - 60) * 1000,
  };

  return certs;
}

export interface AuthenticatedUser {
  uid: string;
  email?: string;
}

/**
 * Verifies a Firebase ID token without firebase-admin.
 *
 * Uses Google's public X.509 certificates for the `securetoken` service and
 * validates signature, issuer, audience and expiration via `jose`.
 * This works on any Node runtime (including AI Studio / Cloud Run) and does
 * not require a service account or the Gemini capability.
 */
export async function verifyFirebaseIdToken(token: string): Promise<AuthenticatedUser> {
  let header;
  try {
    header = decodeProtectedHeader(token);
  } catch {
    throw new ApiError(401, 'Sessão inválida. Entre novamente.');
  }

  if (header.alg !== 'RS256' || !header.kid) {
    throw new ApiError(401, 'Sessão inválida. Entre novamente.');
  }

  const certs = await getSecureTokenCerts();
  const certificate = certs[header.kid];
  if (!certificate) {
    throw new ApiError(401, 'Sessão inválida. Entre novamente.');
  }

  let key = keyCache.get(header.kid);
  if (!key) {
    key = await importX509(certificate, 'RS256');
    keyCache.set(header.kid, key);
  }

  try {
    const { payload } = await jwtVerify(token, key, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
      clockTolerance: 5,
    });

    if (!payload.sub) {
      throw new Error('Token sem subject');
    }

    return {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.warn('[auth] Token Firebase inválido:', (error as Error)?.message);
    throw new ApiError(401, 'Sessão expirada ou inválida. Entre novamente.');
  }
}

/**
 * Reads the user's profile through the Firestore REST API using the user's own
 * ID token (so Firestore Rules still apply) and requires credits > 0.
 *
 * Defense in depth: the client transaction is the source of truth for the
 * deduction, but users with zero credits cannot start a new AI generation.
 */
export async function assertCreditsAvailable(uid: string, token: string): Promise<number> {
  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(PROJECT_ID)}` +
    `/databases/${encodeURIComponent(DATABASE_ID)}` +
    `/documents/users/${encodeURIComponent(uid)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(503, 'Não foi possível validar seus créditos agora. Tente novamente.');
  }

  if (response.status === 401) {
    throw new ApiError(401, 'Sessão expirada. Entre novamente.');
  }

  if (response.status === 403) {
    throw new ApiError(403, 'Você não tem permissão para acessar este perfil.');
  }

  if (response.status === 404) {
    throw new ApiError(403, 'Perfil não encontrado. Saia e entre novamente.');
  }

  if (!response.ok) {
    throw new ApiError(503, 'Não foi possível validar seus créditos agora. Tente novamente.');
  }

  const payload = (await response.json()) as {
    fields?: { credits?: { integerValue?: string; doubleValue?: number } };
  };

  const rawCredits = payload.fields?.credits;
  const credits = Number(rawCredits?.integerValue ?? rawCredits?.doubleValue ?? 0);

  if (!Number.isFinite(credits) || credits <= 0) {
    throw new ApiError(402, 'Você não tem créditos suficientes para gerar uma nova trilha.');
  }

  return credits;
}
