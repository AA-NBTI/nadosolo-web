import type { Booking } from '@/modules/reservation';

/**
 * 회원에게 공개 가능한 예약 상태 요약. 식당명·좌석 등 상세는 절대 포함하지 않는다.
 * - NONE: 예약 기록 없음 (예약 모듈 미사용 방 → 기존 Reveal 규칙 유지)
 * - PENDING: 식당 응답 대기
 * - CONFIRMED: 식당 확정
 * - FAILED: 거절·만료·취소로 확정 예약이 없음 (운영자 확인 필요)
 */
export type ReservationPublicState = 'NONE' | 'PENDING' | 'CONFIRMED' | 'FAILED' | 'DISABLED';

export function summarizeBookingState(
  bookings: Pick<Booking, 'status' | 'holdExpiresAt'>[],
  nowMs: number = Date.now()
): ReservationPublicState {
  if (bookings.length === 0) return 'NONE';
  if (bookings.some((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')) return 'CONFIRMED';
  const pending = bookings.some(
    (b) =>
      b.status === 'REQUESTED' &&
      (!b.holdExpiresAt || Date.parse(b.holdExpiresAt) > nowMs)
  );
  return pending ? 'PENDING' : 'FAILED';
}

/** 예약 상태가 Reveal을 막는지. 확정되지 않은 식당이 공개되는 사고를 방지한다. */
export function blocksReveal(state: ReservationPublicState): boolean {
  return state === 'PENDING' || state === 'FAILED';
}
