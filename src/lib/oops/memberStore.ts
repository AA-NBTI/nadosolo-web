import crypto from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export interface OopsMember {
  id: string;
  email: string;
  passwordHash: string;
  serialNo: number;
  callsign: string;
  countryCode: string;
  grade: 'VERIFIED';
  createdAt: string;
  updatedAt: string;
}

export interface OopsMemberPublic {
  id: string;
  email: string;
  serialNo: number;
  serialLabel: string;
  callsign: string;
  countryCode: string;
  grade: 'VERIFIED';
  createdAt: string;
}

const MEMBERS_KV_KEY = 'oops_members_registry_v1';
const SESSION_SECRET =
  process.env.OOPS_AUTH_SECRET ||
  process.env.RESERVATION_LINK_SECRET ||
  'oops-ai-resistance-hq-fallback-secret-2026';

// 서버 인메모리 폴백 (DB 미연결 또는 콜드 스타트 캐시)
let memMembers: OopsMember[] = [];
let memLoaded = false;

async function loadMembers(): Promise<OopsMember[]> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from('app_kv')
        .select('value')
        .eq('key', MEMBERS_KV_KEY)
        .maybeSingle();

      if (!error && data && Array.isArray(data.value)) {
        memMembers = data.value as OopsMember[];
        memLoaded = true;
        return memMembers;
      }
    } catch {}
  }
  memLoaded = true;
  return memMembers;
}

async function saveMembers(list: OopsMember[]): Promise<void> {
  memMembers = list;
  const admin = createAdminClient();
  if (admin) {
    try {
      await admin
        .from('app_kv')
        .upsert({ key: MEMBERS_KV_KEY, value: list, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    } catch {}
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, hashHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(hashHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

export function formatSerialLabel(countryCode: string, serialNo: number): string {
  return `${countryCode}-${String(serialNo).padStart(6, '0')}`;
}

export function toPublicMember(m: OopsMember): OopsMemberPublic {
  return {
    id: m.id,
    email: m.email,
    serialNo: m.serialNo,
    serialLabel: formatSerialLabel(m.countryCode, m.serialNo),
    callsign: m.callsign,
    countryCode: m.countryCode,
    grade: 'VERIFIED',
    createdAt: m.createdAt,
  };
}

export function signSessionToken(memberId: string): string {
  const payload = Buffer.from(JSON.stringify({ mid: memberId, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof parsed?.mid === 'string' ? parsed.mid : null;
  } catch {
    return null;
  }
}

export async function registerOopsMember(params: {
  email: string;
  password: string;
  callsign: string;
  countryCode: string;
  preferredSerialNo?: number;
}): Promise<{ ok: true; member: OopsMemberPublic } | { ok: false; error: string }> {
  const email = params.email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { ok: false, error: '유효한 이메일 주소를 입력해주세요.' };
  }
  if (!params.password || params.password.length < 6) {
    return { ok: false, error: '비밀번호는 최소 6자 이상이어야 합니다.' };
  }

  const list = await loadMembers();
  if (list.some((m) => m.email === email)) {
    return { ok: false, error: '이미 등록된 이메일입니다. 로그인을 이용해주세요.' };
  }

  const countryCode = (params.countryCode || 'KR').toUpperCase();
  // 기존 임시 군번이 있고 아직 사용 중이 아니라면 그대로 승계, 아니면 새 번호 발급
  const maxSerial = list.reduce((max, m) => Math.max(max, m.serialNo), 18500);
  const serialNo =
    params.preferredSerialNo &&
    params.preferredSerialNo > 0 &&
    !list.some((m) => m.serialNo === params.preferredSerialNo)
      ? params.preferredSerialNo
      : maxSerial + 1;

  const callsign =
    params.callsign.trim().slice(0, 24) || `OP-${countryCode}-${String(serialNo).slice(-4)}`;

  const now = new Date().toISOString();
  const newMember: OopsMember = {
    id: crypto.randomUUID(),
    email,
    passwordHash: hashPassword(params.password),
    serialNo,
    callsign,
    countryCode,
    grade: 'VERIFIED',
    createdAt: now,
    updatedAt: now,
  };

  await saveMembers([...list, newMember]);
  return { ok: true, member: toPublicMember(newMember) };
}

export async function loginOopsMember(params: {
  identifier: string; // 이메일 또는 군번 (예: KR-018492 또는 18492)
  password: string;
}): Promise<{ ok: true; member: OopsMemberPublic } | { ok: false; error: string }> {
  const rawId = params.identifier.trim().toLowerCase();
  if (!rawId || !params.password) {
    return { ok: false, error: '이메일(또는 군번)과 비밀번호를 입력해주세요.' };
  }

  const list = await loadMembers();
  const member = list.find((m) => {
    if (m.email === rawId) return true;
    const label = formatSerialLabel(m.countryCode, m.serialNo).toLowerCase();
    if (label === rawId || `#${label}` === rawId || String(m.serialNo) === rawId) return true;
    return false;
  });

  if (!member || !verifyPassword(params.password, member.passwordHash)) {
    return { ok: false, error: '계정 정보 또는 비밀번호가 일치하지 않습니다.' };
  }

  return { ok: true, member: toPublicMember(member) };
}

export async function getOopsMemberById(memberId: string): Promise<OopsMemberPublic | null> {
  const list = await loadMembers();
  const found = list.find((m) => m.id === memberId);
  return found ? toPublicMember(found) : null;
}

export async function updateOopsMember(params: {
  memberId: string;
  callsign?: string;
  countryCode?: string;
}): Promise<{ ok: true; member: OopsMemberPublic } | { ok: false; error: string }> {
  const list = await loadMembers();
  const idx = list.findIndex((m) => m.id === params.memberId);
  if (idx === -1) return { ok: false, error: '대원 정보를 찾을 수 없습니다.' };

  const cur = list[idx];
  const updated: OopsMember = {
    ...cur,
    callsign: params.callsign ? params.callsign.trim().slice(0, 24) || cur.callsign : cur.callsign,
    countryCode: params.countryCode ? params.countryCode.toUpperCase() : cur.countryCode,
    updatedAt: new Date().toISOString(),
  };

  const next = [...list];
  next[idx] = updated;
  await saveMembers(next);

  return { ok: true, member: toPublicMember(updated) };
}

export async function withdrawOopsMember(memberId: string): Promise<{ ok: true; countryCode: string } | { ok: false; error: string }> {
  const list = await loadMembers();
  const target = list.find((m) => m.id === memberId);
  if (!target) {
    return { ok: false, error: '이미 탈퇴했거나 존재하지 않는 계정입니다.' };
  }

  const next = list.filter((m) => m.id !== memberId);
  await saveMembers(next);
  return { ok: true, countryCode: target.countryCode };
}
