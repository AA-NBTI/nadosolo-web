import { createReservationEngine } from '../core';
import { createMemoryDriver } from '../drivers/memory';
import { sameCityTierFallback } from '../adapters/restaurant.adapter';
import type {
  FallbackStrategy,
  ReservationDriver,
  ReservationEngine,
  ReservationEvent,
  ReservationPolicy,
} from '../types';

/** 나도솔로 6인 식탁 기준. */
export const NADOSOLO_TABLE_SIZE = 6;

/** 헌법 규율: 48시간 전 무료 취소, 24시간 이내·노쇼 제재 판정 기준 반영. */
export const NADOSOLO_RESERVATION_POLICY: ReservationPolicy = {
  holdMinutes: 180,
  freeCancelHoursBefore: 48,
  noShowGraceMinutes: 15,
  maxPartySize: NADOSOLO_TABLE_SIZE,
};

export function createNadoSoloReservationEngine(
  overrides: {
    driver?: ReservationDriver;
    clock?: () => Date;
    fallback?: FallbackStrategy;
    onEvent?: (e: ReservationEvent) => void | Promise<void>;
    policy?: Partial<ReservationPolicy>;
  } = {}
): ReservationEngine {
  return createReservationEngine({
    policy: { ...NADOSOLO_RESERVATION_POLICY, ...overrides.policy },
    driver: overrides.driver ?? createMemoryDriver(),
    clock: overrides.clock,
    fallback: overrides.fallback ?? sameCityTierFallback,
    onEvent: overrides.onEvent,
  });
}
