import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const MURAL_OPENS_AT = Date.parse('2026-11-20T00:00:00-05:00');
const COOKIE_NAME = 'noemi_mural_access';
const attempts = new Map();

function equal(a, b) {
  const first = createHash('sha256').update(a).digest();
  const second = createHash('sha256').update(b).digest();
  return timingSafeEqual(first, second);
}
function signature(payload, secret) {
  return createHmac('sha256', secret).update(`noemi-mural:${payload}`).digest('base64url');
}
export function muralAccessState(request, { now = Date.now(), secret = process.env.MURAL_PASSPHRASE || '' } = {}) {
  const isPublic = now >= MURAL_OPENS_AT;
  let authorized = isPublic;
  if (!authorized && secret) {
    const cookie = String(request.headers.cookie || '').split(';').map(item => item.trim()).find(item => item.startsWith(`${COOKIE_NAME}=`));
    const token = cookie?.slice(COOKIE_NAME.length + 1) || '';
    const [expires, nonce, signed, ...extra] = token.split('.');
    const payload = `${expires}.${nonce}`;
    authorized = extra.length === 0 && /^\d+$/.test(expires || '') && /^[a-f0-9]{32}$/.test(nonce || '') &&
      Number(expires) > now && Number(expires) <= MURAL_OPENS_AT && equal(signed || '', signature(payload, secret));
  }
  return { authorized, requiresPassphrase: !isPublic, configured: Boolean(secret) || isPublic,
    opensAt: new Date(MURAL_OPENS_AT).toISOString(), serverNow: new Date(now).toISOString() };
}
export function authenticateMural(request, passphrase, { now = Date.now(), secret = process.env.MURAL_PASSPHRASE || '' } = {}) {
  if (now >= MURAL_OPENS_AT) return { status: 200, authorized: true };
  if (!secret) return { status: 503, authorized: false };
  // Per-instance throttle supplements the shared password; never record the password.
  const ip = String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  for (const [key, value] of attempts) if (now >= value.until) attempts.delete(key);
  const bucket = attempts.get(ip) || { count: 0, until: now + 60_000 };
  if (bucket.count >= 8) return { status: 429, authorized: false };
  if (typeof passphrase !== 'string' || passphrase.length > 1024 || !equal(passphrase, secret)) {
    bucket.count++; attempts.set(ip, bucket);
    return { status: 401, authorized: false };
  }
  attempts.delete(ip);
  const payload = `${MURAL_OPENS_AT}.${randomBytes(16).toString('hex')}`;
  const secure = String(request.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https' || Boolean(request.socket?.encrypted);
  return { status: 200, authorized: true,
    cookie: `${COOKIE_NAME}=${payload}.${signature(payload, secret)}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${Math.ceil((MURAL_OPENS_AT - now) / 1000)}; Expires=${new Date(MURAL_OPENS_AT).toUTCString()}${secure ? '; Secure' : ''}` };
}
export function isMuralProtectedPath(pathname) {
  return pathname === '/api/messages' || pathname === '/api/prepare-image' || /^\/api\/messages\/\d+\/position$/.test(pathname);
}
