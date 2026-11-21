import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = process.env.NODE_ENV === 'production'
  ? '__Host-romantic-vault-session'
  : 'romantic-vault-session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSigningSecret() {
  const secret = process.env.SESSION_SECRET;
  return typeof secret === 'string' && Buffer.byteLength(secret) >= 32 ? secret : null;
}

function sign(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function normalizePuzzleAnswer(value) {
  return value.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function verifyPuzzleAnswer(candidate) {
  const expected = process.env.VAULT_PUZZLE_ANSWER;
  const secret = getSigningSecret();
  if (typeof candidate !== 'string' || candidate.length > 200 ||
      typeof expected !== 'string' || !secret) return false;

  const normalizedCandidate = normalizePuzzleAnswer(candidate);
  const normalizedExpected = normalizePuzzleAnswer(expected);
  if (normalizedCandidate.length < 12 || normalizedExpected.length < 12) return false;

  const candidateDigest = createHmac('sha256', secret).update(normalizedCandidate).digest();
  const expectedDigest = createHmac('sha256', secret).update(normalizedExpected).digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}

export function createSessionToken() {
  const secret = getSigningSecret();
  if (!secret) throw new Error('SESSION_SECRET must contain at least 32 bytes.');

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${expiresAt}.${randomBytes(24).toString('base64url')}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function isValidSession(cookieHeader) {
  const secret = getSigningSecret();
  if (!secret || typeof cookieHeader !== 'string') return false;

  const cookie = cookieHeader.split(';').map(part => part.trim())
    .find(part => part.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return false;

  const token = cookie.slice(SESSION_COOKIE.length + 1);
  if (token.length > 256) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [expiresAtText, nonce, suppliedSignature] = parts;
  if (!/^\d+$/.test(expiresAtText) || !/^[A-Za-z0-9_-]{20,40}$/.test(nonce) ||
      !/^[A-Za-z0-9_-]{43}$/.test(suppliedSignature)) return false;

  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;

  const payload = `${expiresAtText}.${nonce}`;
  const expectedSignature = Buffer.from(sign(payload, secret));
  const actualSignature = Buffer.from(suppliedSignature);
  return expectedSignature.length === actualSignature.length &&
    timingSafeEqual(expectedSignature, actualSignature);
}
