import type { FallbackStrategy, Resource, Slot } from '../types';

/**
 * PartnerVenue 호환 최소 형태.
 * 엔진 타입을 import하지 않고 구조적 타입으로만 받아 모듈 독립성을 유지한다.
 */
export interface VenueLike {
  venueId: string;
  name: string;
  cityCode: string;
  budgetTier: string;
  supportedDietary: string[];
  vibeThemes: string[];
  maxTablesPerNight: number;
}

/** 제휴 식당 → 예약 자원. 수용량은 (테이블 수 × 테이블 인원). */
export function venueToResource(venue: VenueLike, tableSize: number): Resource {
  return {
    id: venue.venueId,
    kind: 'restaurant',
    name: venue.name,
    capacity: venue.maxTablesPerNight * tableSize,
    active: true,
    attributes: {
      cityCode: venue.cityCode,
      budgetTier: venue.budgetTier,
      supportedDietary: venue.supportedDietary,
      vibeThemes: venue.vibeThemes,
      maxTablesPerNight: venue.maxTablesPerNight,
      tableSize,
    },
  };
}

/** 하룻밤 테이블 단위 슬롯 생성 (테이블 1개 = 슬롯 1개). */
export function tableSlotsForNight(
  venue: VenueLike,
  startsAtIso: string,
  tableSize: number
): Slot[] {
  return Array.from({ length: venue.maxTablesPerNight }, (_, i) => ({
    id: `${venue.venueId}:${startsAtIso}:T${i + 1}`,
    resourceId: venue.venueId,
    startsAt: startsAtIso,
    capacity: tableSize,
    open: true,
  }));
}

/** 같은 시각·도시·예산 티어(및 식단 지원)의 다른 식당 슬롯으로 대체 (단체 모임 전용, 일반 손님 예약 제외). */
export const sameCityTierFallback: FallbackStrategy = async ({ failed, slot, resource, engine }) => {
  const src = failed.meta?.source;
  if (src === 'public_link' || src === 'owner_walkin' || src === 'owner_block') return null;
  const need = (failed.meta.requiredDietary as string[] | undefined) ?? [];
  const candidates = await engine.searchSlots({
    kind: 'restaurant',
    from: slot.startsAt,
    to: slot.startsAt,
    minRemaining: failed.partySize,
    excludeSlotIds: [failed.slotId],
    predicate: (_s, r) =>
      r.id !== resource.id &&
      r.attributes.cityCode === resource.attributes.cityCode &&
      r.attributes.budgetTier === resource.attributes.budgetTier &&
      need.every((d) => ((r.attributes.supportedDietary as string[]) ?? []).includes(d)),
  });
  return candidates.length ? { slotId: candidates[0].slot.id } : null;
};
