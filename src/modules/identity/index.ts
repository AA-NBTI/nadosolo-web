/**
 * 나도솔로 계정 역할 · 유형 분류 및 세션 격리 모듈
 * 관리자(ADMIN) · 가상/테스트(TESTER) · 실제 이용회원(REAL_MEMBER)을 명확히 분리한다.
 */

export type AccountCategory = 'ADMIN' | 'TESTER' | 'REAL_MEMBER';

export const ADMIN_SESSION_STORAGE_KEY = 'nadosolo_admin_session_v1';

export const RESERVED_ADMIN_IDS = ['admin', '관리자', 'master', 'system'] as const;

const TESTER_ID_PATTERN =
  /^(test\d+|user_jisoo|user_minwoo|user_taeo|user_seoa|aaa|bbb|cc|aa|bb|P_\d+|SIM_\d+)$/i;

export interface AccountInspectable {
  id?: string;
  userId?: string;
  handle?: string;
  nickname?: string;
  role?: string;
  verified_badge?: string;
  verifiedBadge?: string;
  self_domain_scores?: Record<string, any>;
}

export function isReservedAdminIdentifier(rawId: string): boolean {
  const cleaned = rawId.trim().replace(/^@/, '').toLowerCase();
  return (RESERVED_ADMIN_IDS as readonly string[]).includes(cleaned);
}

export function classifyAccountProfile(profileOrUser?: AccountInspectable | null): AccountCategory {
  if (!profileOrUser) return 'REAL_MEMBER';

  const id = String(profileOrUser.id ?? profileOrUser.userId ?? '').trim();
  const handle = String(profileOrUser.handle ?? '').trim();
  const handleNoAt = handle.replace(/^@/, '');
  const nickname = String(profileOrUser.nickname ?? '').trim();
  const scores = profileOrUser.self_domain_scores;
  const accountRoleMeta = scores?._account_role;

  if (
    profileOrUser.role === 'ADMIN' ||
    profileOrUser.verified_badge === 'ADMIN' ||
    profileOrUser.verifiedBadge === 'ADMIN' ||
    handle.toLowerCase() === '@admin' ||
    id.toUpperCase() === 'ADMIN_01' ||
    id.toLowerCase() === 'admin' ||
    id === '관리자' ||
    nickname === '관리자' ||
    accountRoleMeta === 'ADMIN'
  ) {
    return 'ADMIN';
  }

  if (
    accountRoleMeta === 'TESTER' ||
    TESTER_ID_PATTERN.test(id) ||
    TESTER_ID_PATTERN.test(handleNoAt)
  ) {
    return 'TESTER';
  }

  return 'REAL_MEMBER';
}

export function isAdminAccount(profileOrUser?: AccountInspectable | null): boolean {
  return classifyAccountProfile(profileOrUser) === 'ADMIN';
}

export function isTesterAccount(profileOrUser?: AccountInspectable | null): boolean {
  return classifyAccountProfile(profileOrUser) === 'TESTER';
}

export function filterMatchingEligibleProfiles<T extends AccountInspectable>(
  profiles: T[],
  options?: { excludeTesters?: boolean }
): T[] {
  return profiles.filter((p) => {
    const cat = classifyAccountProfile(p);
    if (cat === 'ADMIN') return false;
    if (options?.excludeTesters && cat === 'TESTER') return false;
    return true;
  });
}
