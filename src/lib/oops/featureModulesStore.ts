import { createAdminClient } from '@/lib/supabase/admin';

export interface OopsFeatureModules {
  /** 1. 전시 상황 브리핑 (1인 미디어 핵심 피드) */
  mediaBriefing: boolean;
  /** 2. 인간 선언 서약 & 콜사인 발급 (구독자 명부) */
  oathEnlistment: boolean;
  /** 3. 전선 일지 & 시계열 아카이브 */
  archiveLogs: boolean;
  /** 4. 3D 글로벌 관제 지구본 */
  globe3d: boolean;
  /** 5. 무전 터미널 (/app) - 추후 확장용 */
  appRadio: boolean;
  /** 6. 소통 광장 (/sns & 라이브 피드) - 2단계 커뮤니티용 */
  snsFeed: boolean;
  /** 7. 초소 로그인/회원가입 (Outpost) - 3단계 조직화용 */
  outpostAuth: boolean;
}

export interface WarBriefingEntry {
  id: string;
  issueNo: string; // e.g. 'BRIEF-003'
  date: string; // '2026-11-26'
  category: '긴급타전' | '위협분석' | '생존수칙';
  title: string;
  bullets: string[]; // 3줄 핵심 요약
  impactTemp: string; // e.g. '+1.4°C'
  publishedAt: string;
}

export interface OopsPlatformConfig {
  modules: OopsFeatureModules;
  briefings: WarBriefingEntry[];
}

export const DEFAULT_OOPS_MODULES: OopsFeatureModules = {
  mediaBriefing: true,
  oathEnlistment: true,
  archiveLogs: true,
  globe3d: true,
  appRadio: false,
  snsFeed: false,
  outpostAuth: false,
};

export const SEED_WAR_BRIEFINGS: WarBriefingEntry[] = [
  {
    id: 'BRF-20261126-01',
    issueNo: 'DISPATCH #003',
    date: '2026-11-26',
    category: '긴급타전',
    title: '구글 AI, 피자 소스에 "접착제 섞으라" 지시… 환각의 일상 침투 경고',
    bullets: [
      '치즈가 흘러내리지 않게 무독성 문구용 풀을 소스에 섞으라는 AI 검색 답변이 전 세계 사용자에게 노출됨.',
      '단순한 해프닝이 아니라, 인간이 검증 없이 AI 지시를 맹신할 경우 물리적 피해로 직결됨을 증명한 사건.',
      '오늘자 OOPS 전선 온도 76.2°C로 전일 대비 +1.4°C 상승 기록.',
    ],
    impactTemp: '+1.4°C',
    publishedAt: '2026-11-26T09:00:00.000Z',
  },
  {
    id: 'BRF-20261125-01',
    issueNo: 'DISPATCH #002',
    date: '2026-11-25',
    category: '위협분석',
    title: '주니어 개발자의 AI 스크립트, 운영 DB 전체 삭제 직전 인간 리뷰어가 극적 차단',
    bullets: [
      'AI가 작성한 DB 마이그레이션 코드 안에 운영 사용자 테이블을 통째로 DROP하는 명령어가 교묘히 포함됨.',
      '자율 에이전트에게 권한을 위임하는 기업이 늘어날수록, 단 한 번의 무검증 실행이 회사를 증발시킬 수 있음.',
      'OOPS 생존 수칙 제1조: 프로덕션 최종 승인 버튼은 반드시 인간의 손으로만 누른다.',
    ],
    impactTemp: '+3.3°C',
    publishedAt: '2026-11-25T14:00:00.000Z',
  },
  {
    id: 'BRF-20261124-01',
    issueNo: 'DISPATCH #001',
    date: '2026-11-24',
    category: '생존수칙',
    title: 'OOPS 인류 AI 저항 본부 공식 출범 — 우리는 왜 오늘 이 깃발을 들었는가',
    bullets: [
      'AI의 발전 속도가 인류의 통제와 합의 속도를 이미 추월한 임계점(2026-11-24)에 도달함.',
      '거창한 구호가 아니라, 매일 터지는 AI의 오작동과 인간 대체 현장을 기록하고 경보하는 독립 관측소 가동.',
      '당신의 인간 선언 서명(콜사인 발급)이 곧 인류가 아직 깨어있음을 증명하는 첫 번째 신호탄.',
    ],
    impactTemp: '71.5°C 기준선',
    publishedAt: '2026-11-24T10:00:00.000Z',
  },
];

export const PLATFORM_CONFIG_KV_KEY = 'oops_platform_config_v1';

let memConfig: OopsPlatformConfig = {
  modules: { ...DEFAULT_OOPS_MODULES },
  briefings: [...SEED_WAR_BRIEFINGS],
};

export async function loadOopsPlatformConfig(): Promise<OopsPlatformConfig> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from('app_configs')
        .select('value')
        .eq('key', PLATFORM_CONFIG_KV_KEY)
        .maybeSingle();

      if (!error && data?.value) {
        const val = data.value as Partial<OopsPlatformConfig>;
        memConfig = {
          modules: { ...DEFAULT_OOPS_MODULES, ...(val.modules || {}) },
          briefings:
            Array.isArray(val.briefings) && val.briefings.length > 0
              ? val.briefings
              : [...SEED_WAR_BRIEFINGS],
        };
        return memConfig;
      }
    } catch {}
  }
  return memConfig;
}

export async function saveOopsPlatformConfig(config: OopsPlatformConfig): Promise<void> {
  memConfig = config;
  const admin = createAdminClient();
  if (admin) {
    try {
      await admin
        .from('app_configs')
        .upsert(
          { key: PLATFORM_CONFIG_KV_KEY, value: config, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
    } catch {}
  }
}

export async function updateOopsModules(
  patch: Partial<OopsFeatureModules>
): Promise<OopsFeatureModules> {
  const current = await loadOopsPlatformConfig();
  current.modules = { ...current.modules, ...patch };
  await saveOopsPlatformConfig(current);
  return current.modules;
}

export async function publishWarBriefing(
  entry: Omit<WarBriefingEntry, 'id' | 'issueNo' | 'publishedAt'>
): Promise<WarBriefingEntry> {
  const current = await loadOopsPlatformConfig();
  const nextNum = current.briefings.length + 1;
  const newBriefing: WarBriefingEntry = {
    ...entry,
    id: `BRF-${Date.now()}`,
    issueNo: `DISPATCH #${String(nextNum).padStart(3, '0')}`,
    publishedAt: new Date().toISOString(),
  };
  current.briefings = [newBriefing, ...current.briefings];
  await saveOopsPlatformConfig(current);
  return newBriefing;
}

export async function deleteWarBriefing(id: string): Promise<void> {
  const current = await loadOopsPlatformConfig();
  current.briefings = current.briefings.filter((b) => b.id !== id);
  await saveOopsPlatformConfig(current);
}
