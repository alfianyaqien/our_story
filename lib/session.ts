import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

/**
 * Signed session cookies.
 *
 * The session used to be stored as raw JSON:
 *
 *   Set-Cookie: session={"userId":3,"username":"alfian",...}
 *
 * httpOnly stops page scripts reading it, but nothing authenticated the
 * contents. Anyone able to set a cookie in their own browser - devtools, an
 * extension, any XSS - could write {"userId":1} and be served that account's
 * data, because every route trusted the number it found there. That is a full
 * authentication bypass, and it got worse once stories made one account's data
 * genuinely private from another's.
 *
 * The payload is now HMAC-SHA256 signed with SESSION_SECRET (which was already
 * declared in .env.example but read by nothing). Tampering invalidates the
 * signature and the session is rejected. The cookie is still readable by
 * whoever holds it - it is not encrypted - so it carries only what the app
 * already exposes to that user about themselves, never anything secret.
 *
 * An absolute expiry travels inside the signed payload as well as in the
 * cookie's own maxAge: the client controls when it sends a cookie, so expiry
 * has to be enforced server-side to mean anything.
 */

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 1 week

export interface SessionPayload {
  userId: number;
  username: string;
  displayName: string;
  email?: string;
  /** Unix seconds. Checked on read; a client can always withhold expiry. */
  exp: number;
}

/**
 * Fail closed rather than fall back to a default. A hardcoded fallback would
 * mean every deployment that forgot to set the variable shared one publicly
 * known signing key, which is indistinguishable from no signing at all.
 */
function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      'SESSION_SECRET must be set to at least 32 characters. ' +
        'Generate one with: openssl rand -base64 48'
    );
  }
  return value;
}

function sign(payloadB64: string): string {
  return createHmac('sha256', secret()).update(payloadB64).digest('base64url');
}

/** Constant-time compare so a wrong signature leaks no timing information. */
function signaturesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Serialise and sign. Returns the cookie value, `payload.signature`. */
export function serializeSession(
  data: Omit<SessionPayload, 'exp'>,
  ttlSeconds = SESSION_TTL_SECONDS
): string {
  const payload: SessionPayload = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${payloadB64}.${sign(payloadB64)}`;
}

/** Verify and parse a cookie value. Returns null for anything not trustworthy. */
export function parseSession(value: string | undefined): SessionPayload | null {
  if (!value) return null;

  const dot = value.lastIndexOf('.');
  if (dot <= 0) return null; // includes the old unsigned JSON format

  const payloadB64 = value.slice(0, dot);
  const signature = value.slice(dot + 1);

  let expected: string;
  try {
    expected = sign(payloadB64);
  } catch {
    // No usable secret: refuse every session rather than accept unsigned ones.
    return null;
  }
  if (!signaturesMatch(signature, expected)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (typeof payload?.userId !== 'number' || !Number.isInteger(payload.userId)) {
    return null;
  }
  if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) {
    return null;
  }

  return payload;
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

/** Issue a session cookie. */
export async function setSessionCookie(
  data: Omit<SessionPayload, 'exp'>
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, serializeSession(data), {
    ...cookieOptions,
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Read and verify the current session, or null. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return parseSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
