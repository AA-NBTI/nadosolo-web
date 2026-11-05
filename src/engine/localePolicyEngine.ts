import {
  CityLocaleConfig,
  FluencyLevel,
  ModePolicyConfig,
  SocialMode,
} from './types';

/**
 * [Domain B - ④] LocalePolicyEngine (글로벌 로케일 & 소셜 모드별 동적 가중치 엔진)
 * - 전 세계 도시별 타임존(IANA), 통화, 문화권 태그를 관리합니다.
 * - 모임 모드(ROMANCE / PLATONIC / THEME)에 따라 성비 규칙, 연령 폭, 매칭 가중치 매트릭스를 동적으로 스위칭합니다.
 */
export class LocalePolicyEngine {
  private static readonly CITY_CONFIGS: Record<string, CityLocaleConfig> = {
    BUSAN_JEONPO: {
      cityCode: 'BUSAN_JEONPO',
      countryCode: 'KR',
      ianaTimezone: 'Asia/Seoul',
      currency: 'KRW',
      baseTicketPrice: 25000,
      cultureTag: 'KR',
    },
    BUSAN_HAEUNDAE: {
      cityCode: 'BUSAN_HAEUNDAE',
      countryCode: 'KR',
      ianaTimezone: 'Asia/Seoul',
      currency: 'KRW',
      baseTicketPrice: 25000,
      cultureTag: 'KR',
    },
    BUSAN_GWANGAN: {
      cityCode: 'BUSAN_GWANGAN',
      countryCode: 'KR',
      ianaTimezone: 'Asia/Seoul',
      currency: 'KRW',
      baseTicketPrice: 25000,
      cultureTag: 'KR',
    },
    SEOUL_SEONGSU: {
      cityCode: 'SEOUL_SEONGSU',
      countryCode: 'KR',
      ianaTimezone: 'Asia/Seoul',
      currency: 'KRW',
      baseTicketPrice: 25000,
      cultureTag: 'KR',
    },
    SEOUL_GANGNAM: {
      cityCode: 'SEOUL_GANGNAM',
      countryCode: 'KR',
      ianaTimezone: 'Asia/Seoul',
      currency: 'KRW',
      baseTicketPrice: 25000,
      cultureTag: 'KR',
    },
    TOKYO_SHIBUYA: {
      cityCode: 'TOKYO_SHIBUYA',
      countryCode: 'JP',
      ianaTimezone: 'Asia/Tokyo',
      currency: 'JPY',
      baseTicketPrice: 2500,
      cultureTag: 'JP',
    },
    NYC_SOHO: {
      cityCode: 'NYC_SOHO',
      countryCode: 'US',
      ianaTimezone: 'America/New_York',
      currency: 'USD',
      baseTicketPrice: 20,
      cultureTag: 'US_EU',
    },
  };

  /**
   * 3대 소셜 모드별 동적 가중치 매트릭스 및 제약 정책
   * - ROMANCE: 3:3 성비 강제, 연령 폭 ±5세, 연령(0.30) 및 성향 시너지(0.35) 중심
   * - PLATONIC: 성비 무관, 연령 폭 ±8세, 성향/대화 밸런스(0.45) 및 관심사(0.25) 중심
   * - THEME: 성비 무관, 연령 폭 ±12세, 공통 관심사/테마 일치도(0.55) 최우선
   */
  private static readonly MODE_POLICIES: Record<SocialMode, ModePolicyConfig> = {
    ROMANCE: {
      mode: 'ROMANCE',
      tableSize: 6,
      enforceEqualGenderRatio: true,
      maxAgeGapYears: 5,
      minFluencyRequired: 'CONVERSATIONAL',
      weights: {
        ageCompatibilityWeight: 0.30,
        traitSynergyWeight: 0.35,
        interestSimilarityWeight: 0.15,
        intentAlignmentWeight: 0.10,
        energyBalanceWeight: 0.10,
      },
    },
    PLATONIC: {
      mode: 'PLATONIC',
      tableSize: 6,
      enforceEqualGenderRatio: false,
      maxAgeGapYears: 8,
      minFluencyRequired: 'CONVERSATIONAL',
      weights: {
        ageCompatibilityWeight: 0.10,
        traitSynergyWeight: 0.45,
        interestSimilarityWeight: 0.25,
        intentAlignmentWeight: 0.05,
        energyBalanceWeight: 0.15,
      },
    },
    THEME: {
      mode: 'THEME',
      tableSize: 6,
      enforceEqualGenderRatio: false,
      maxAgeGapYears: 12,
      minFluencyRequired: 'CONVERSATIONAL',
      weights: {
        ageCompatibilityWeight: 0.05,
        traitSynergyWeight: 0.20,
        interestSimilarityWeight: 0.55,
        intentAlignmentWeight: 0.05,
        energyBalanceWeight: 0.15,
      },
    },
  };

  private static readonly FLUENCY_RANK: Record<FluencyLevel, number> = {
    BASIC: 1,
    CONVERSATIONAL: 2,
    FLUENT: 3,
    NATIVE: 4,
  };

  public static getCityConfig(cityCode: string): CityLocaleConfig {
    return (
      this.CITY_CONFIGS[cityCode] ?? {
        cityCode,
        countryCode: 'GLOBAL',
        ianaTimezone: 'UTC',
        currency: 'USD',
        baseTicketPrice: 25,
        cultureTag: 'GLOBAL',
      }
    );
  }

  public static getModePolicy(mode: SocialMode): ModePolicyConfig {
    return this.MODE_POLICIES[mode];
  }

  public static isFluencySufficient(
    userLevel: FluencyLevel | undefined,
    requiredLevel: FluencyLevel
  ): boolean {
    if (!userLevel) return false;
    return this.FLUENCY_RANK[userLevel] >= this.FLUENCY_RANK[requiredLevel];
  }
}

