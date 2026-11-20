import { getAppConfig, saveAppConfig } from '@/lib/appConfigDb';

export type MembershipTierCode =
  | 'STANDARD'
  | 'BARO'
  | 'PREMIUM'
  | 'SIGNATURE'
  | 'BLACK'
  | 'BANDI';

export interface MembershipTierSpec {
  code: MembershipTierCode;
  rank: number;
  name: string;
  priceKrw: number;
  billingCycle: 'PER_EVENT' | 'YEARLY' | 'JOIN_FEE';
  summary: string;
  isActive: boolean;
}

export const TIER_CONFIG_KEY = 'membership_tier_configs_v1';
export const TIER_LOCAL_KEY = 'nadosolo_membership_tier_configs_v1';

export const DEFAULT_MEMBERSHIP_TIERS: MembershipTierSpec[] = [
  {
    code: 'STANDARD',
    rank: 0,
    name: '일반',
    priceKrw: 30000,
    billingCycle: 'PER_EVENT',
    summary: '1~3회 체험권 기준 일반 블라인드 슬롯 참여',
    isActive: true,
  },
  {
    code: 'BARO',
    rank: 1,
    name: '바로클럽',
    priceKrw: 600000,
    billingCycle: 'YEARLY',
    summary: '가입비 없는 1년 회원권 · 일반 슬롯 자유 예약',
    isActive: true,
  },
  {
    code: 'PREMIUM',
    rank: 2,
    name: '프리미엄',
    priceKrw: 300000,
    billingCycle: 'JOIN_FEE',
    summary: 'Rank 0~2 클럽 참여 · 매너 검증 테이블',
    isActive: true,
  },
  {
    code: 'SIGNATURE',
    rank: 3,
    name: '시그니처',
    priceKrw: 3000000,
    billingCycle: 'JOIN_FEE',
    summary: 'Rank 0~3 클럽 참여 · 고급 비스트로 전용',
    isActive: true,
  },
  {
    code: 'BLACK',
    rank: 4,
    name: '블랙',
    priceKrw: 30000000,
    billingCycle: 'JOIN_FEE',
    summary: 'Rank 0~4 클럽 참여 · 프라이빗 살롱',
    isActive: true,
  },
  {
    code: 'BANDI',
    rank: 5,
    name: '반디',
    priceKrw: 100000000,
    billingCycle: 'JOIN_FEE',
    summary: 'Rank 0~5 전 등급 자유 참여 · 최상위 클럽',
    isActive: true,
  },
];

export function getTierRank(code?: string): number {
  const hit = DEFAULT_MEMBERSHIP_TIERS.find((t) => t.code === code);
  return hit ? hit.rank : 0;
}

export function canAccessTier(userTierRank: number = 0, minTierRank: number = 0): boolean {
  return userTierRank >= minTierRank;
}

export async function fetchMembershipTiers(): Promise<MembershipTierSpec[]> {
  const list = await getAppConfig<MembershipTierSpec[]>(
    TIER_CONFIG_KEY,
    TIER_LOCAL_KEY,
    DEFAULT_MEMBERSHIP_TIERS
  );
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_MEMBERSHIP_TIERS;
  // 신규 기본 티어가 누락되지 않도록 병합
  return DEFAULT_MEMBERSHIP_TIERS.map((def) => {
    const saved = list.find((item) => item.code === def.code);
    return saved ? { ...def, ...saved, code: def.code, rank: def.rank } : def;
  });
}

export async function saveMembershipTiers(list: MembershipTierSpec[]): Promise<boolean> {
  return saveAppConfig(TIER_CONFIG_KEY, TIER_LOCAL_KEY, list);
}
