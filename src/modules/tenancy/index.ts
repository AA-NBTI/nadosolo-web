/**
 * 범용 멀티테넌트 슬러그 · 서브도메인 해석 모듈.
 * 특정 서비스(테이블바로/나도솔로)나 업종에 종속되지 않는 순수 함수만 포함한다.
 */

export const RESERVED_SLUGS = new Set([
  'www',
  'api',
  'admin',
  'biz',
  'reserve',
  'affiliate',
  's',
  'r',
  'pay',
  'auth',
  'meetup',
  'dining',
  'salon',
  'dashboard',
  'static',
  'assets',
  'app',
  'mail',
  'blog',
  'cdn',
  'help',
  'support',
]);

/** 영문 소문자·숫자·하이픈 2~32자로 정규화. 유효하지 않거나 예약어면 null */
export function normalizeSlug(raw: string | null | undefined): string | null {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
  if (s.length < 2 || s.length > 32) return null;
  if (RESERVED_SLUGS.has(s)) return null;
  return s;
}

const DEFAULT_ROOT_DOMAINS = ['tablebaro.com', 'nadosolo.com', 'localhost'];

/**
 * Host 헤더에서 테넌트 서브도메인 슬러그 추출.
 * 예: `gosu.tablebaro.com` -> `'gosu'`, `gosu.localhost:3000` -> `'gosu'`
 * 루트 도메인 자체나 `*.vercel.app` 배포 호스트는 null 반환.
 */
export function extractSubdomainSlug(
  hostHeader: string | null | undefined,
  rootDomains: string[] = DEFAULT_ROOT_DOMAINS
): string | null {
  const host = String(hostHeader ?? '')
    .split(':')[0]
    .trim()
    .toLowerCase();
  if (!host || host.endsWith('.vercel.app')) return null;

  for (const root of rootDomains) {
    const cleanRoot = root.toLowerCase();
    if (host === cleanRoot || host === `www.${cleanRoot}`) return null;
    if (host.endsWith(`.${cleanRoot}`)) {
      const sub = host.slice(0, -(cleanRoot.length + 1));
      // 단일 레벨 서브도메인만 허용
      if (!sub || sub.includes('.')) return null;
      return normalizeSlug(sub);
    }
  }
  return null;
}

/** 테넌트 공개 URL 생성 (서브도메인 환경 vs 경로 환경 자동 대응) */
export function buildTenantUrl(params: {
  origin: string;
  resourceId: string;
  slug?: string | null;
  subdomainRoot?: string;
}): string {
  const cleanSlug = normalizeSlug(params.slug);
  if (cleanSlug && params.subdomainRoot) {
    return `https://${cleanSlug}.${params.subdomainRoot}`;
  }
  const base = params.origin.replace(/\/$/, '');
  return `${base}/reserve/${encodeURIComponent(cleanSlug || params.resourceId)}`;
}
