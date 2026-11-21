import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * 식당 응답 링크용 서명 토큰 (무상태, DB 불필요).
 * 형식: base64url(`${bookingId}.${expMs}`) + '.' + base64url(HMAC-SHA256)
 * - 시크릿(RESERVATION_LINK_SECRET)이 없으면 발급/검증 모두 거부한다 (약한 기본값 없음).
 * - 재사용 방지는 예약 상태머신이 담당한다 (이미 처리된 예약은 INVALID_TRANSITION).
 */
const b64 = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');

function mac(payload: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(payload).digest();
}

export function getLinkSecret(): string | null {
  const s = process.env.RESERVATION_LINK_SECRET;
  return s && s.length >= 16 ? s : null;
}

export function signResponseToken(bookingId: string, expiresAtMs: number, secret: string): string {
  const payload = b64(`${bookingId}.${expiresAtMs}`);
  return `${payload}.${b64(mac(payload, secret))}`;
}

export function verifyResponseToken(
  token: string,
  secret: string,
  nowMs: number = Date.now()
): { bookingId: string; expiresAtMs: number } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = mac(payload, secret);
  let given: Buffer;
  try {
    given = Buffer.from(sig, 'base64url');
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  const decoded = Buffer.from(payload, 'base64url').toString('utf8');
  const i = decoded.lastIndexOf('.');
  if (i < 1) return null;
  const bookingId = decoded.slice(0, i);
  const expiresAtMs = Number(decoded.slice(i + 1));
  if (!Number.isFinite(expiresAtMs) || expiresAtMs < nowMs) return null;
  return { bookingId, expiresAtMs };
}

/** 응답 링크 URL 생성. 시크릿이 없으면 null. */
export function buildResponseUrl(bookingId: string, expiresAtMs: number): string | null {
  const secret = getLinkSecret();
  if (!secret) return null;
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  return `${base}/r/${signResponseToken(bookingId, expiresAtMs, secret)}`;
}
