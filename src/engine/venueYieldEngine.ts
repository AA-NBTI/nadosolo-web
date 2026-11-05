import {
  DynamicPriceQuote,
  Gender,
  MatchedTable,
  ParticipantProfile,
  PartnerVenue,
  SocialMode,
} from './types';
import { LocalePolicyEngine } from './localePolicyEngine';

/**
 * [Domain B - ⑥] VenueAndYieldEngine (공간 자동 배정 & 수급·노쇼 방어 엔진)
 * - 편성된 테이블의 도시, 예산 티어($~$$$), 식단 제약(비건/할랄 등)을 수용하는 최적의 제휴 식당(Venue)을 배정합니다.
 * - 지역·모드별 성비 불균형이나 마감 임박도에 따라 다이내믹 프라이싱(할인율)을 산출합니다.
 * - 당일 취소/노쇼 결원 발생 시 대기열(Standby Pool)에서 신뢰 점수(TrustScore)와 조건이 맞는 최적 대체자를 추출합니다.
 */
export class VenueAndYieldEngine {
  /**
   * 편성된 테이블 리스트에 조건(도시, 예산, 식단 제약)이 호환되는 제휴 식당 자동 매칭
   */
  public static assignVenuesToTables(
    tables: MatchedTable[],
    venues: PartnerVenue[]
  ): MatchedTable[] {
    const venueUsage = new Map<string, number>();

    return tables.map((table) => {
      const compatibleVenue = venues.find((v) => {
        if (v.cityCode !== table.cityCode) return false;
        if (v.budgetTier !== table.budgetTier) return false;

        const currentUsed = venueUsage.get(v.venueId) ?? 0;
        if (currentUsed >= v.maxTablesPerNight) return false;

        // 테이블 내 필수 식단 제약(비건/할랄 등)을 식당이 모두 지원하는지 확인
        return table.requiredDietarySupport.every((req) =>
          v.supportedDietary.includes(req)
        );
      });

      if (compatibleVenue) {
        venueUsage.set(
          compatibleVenue.venueId,
          (venueUsage.get(compatibleVenue.venueId) ?? 0) + 1
        );
      }

      return {
        ...table,
        assignedVenue: compatibleVenue,
      };
    });
  }

  /**
   * 수급 및 마감 시간 기반 다이내믹 프라이싱 계산
   */
  public static calculateDynamicPrice(params: {
    cityCode: string;
    mode: SocialMode;
    applicantGender: Gender;
    currentMaleCount: number;
    currentFemaleCount: number;
    hoursUntilEvent: number;
    isStandbyInvite?: boolean;
  }): DynamicPriceQuote {
    const city = LocalePolicyEngine.getCityConfig(params.cityCode);
    const basePrice = city.baseTicketPrice;

    if (params.isStandbyInvite) {
      return {
        cityCode: params.cityCode,
        mode: params.mode,
        basePrice,
        finalPrice: Math.round(basePrice * 0.5),
        discountRatePercent: 50,
        pricingReason: 'STANDBY_LAST_MINUTE',
      };
    }

    // ROMANCE 모드에서 특정 성별이 2명 이상 부족할 때 부족 성별 신청자에게 25% 밸런스 부스트 할인 제공
    if (params.mode === 'ROMANCE') {
      const maleShortage = params.currentFemaleCount - params.currentMaleCount >= 2;
      const femaleShortage = params.currentMaleCount - params.currentFemaleCount >= 2;

      if (
        (params.applicantGender === 'M' && maleShortage) ||
        (params.applicantGender === 'F' && femaleShortage)
      ) {
        return {
          cityCode: params.cityCode,
          mode: params.mode,
          basePrice,
          finalPrice: Math.round(basePrice * 0.75),
          discountRatePercent: 25,
          pricingReason: 'GENDER_BALANCE_BOOST',
        };
      }
    }

    // 모임 96시간(4일) 이전 신청 시 얼리버드 15% 할인
    if (params.hoursUntilEvent >= 96) {
      return {
        cityCode: params.cityCode,
        mode: params.mode,
        basePrice,
        finalPrice: Math.round(basePrice * 0.85),
        discountRatePercent: 15,
        pricingReason: 'EARLY_BIRD',
      };
    }

    return {
      cityCode: params.cityCode,
      mode: params.mode,
      basePrice,
      finalPrice: basePrice,
      discountRatePercent: 0,
      pricingReason: 'STANDARD',
    };
  }

  /**
   * 당일 취소/노쇼 발생 시 대기열(Standby Pool)에서 즉시 투입 가능한 최적 후보 추천
   */
  public static findStandbyReplacement(
    table: MatchedTable,
    droppedUser: ParticipantProfile,
    standbyPool: ParticipantProfile[]
  ): ParticipantProfile | null {
    const policy = LocalePolicyEngine.getModePolicy(table.mode);

    const candidates = standbyPool
      .filter((c) => {
        if (c.cityCode !== table.cityCode) return false;
        if (c.preferredTableLanguage !== table.tableLanguage) return false;
        if (policy.enforceEqualGenderRatio && c.gender !== droppedUser.gender) {
          return false;
        }
        // 노쇼 방지: 대기열 긴급 투입은 신뢰 점수(trustScore) 80점 이상인 검증 유저만 허용
        return c.trustScore >= 80;
      })
      .sort((a, b) => b.trustScore - a.trustScore);

    return candidates[0] ?? null;
  }
}

