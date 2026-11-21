/**
 * 예약 상태 요약·Reveal 차단 규칙 테스트. 실행: npm run test:reservation:reveal
 */
import assert from 'node:assert/strict';
import { blocksReveal, summarizeBookingState } from './reveal';

const now = Date.parse('2026-12-01T00:00:00Z');
const future = '2026-12-01T01:00:00Z';
const past = '2026-11-30T23:00:00Z';

assert.equal(summarizeBookingState([], now), 'NONE');
assert.equal(summarizeBookingState([{ status: 'REQUESTED', holdExpiresAt: future }], now), 'PENDING');
assert.equal(summarizeBookingState([{ status: 'REQUESTED', holdExpiresAt: past }], now), 'FAILED', '만료된 홀드');
assert.equal(
  summarizeBookingState([{ status: 'DECLINED' }, { status: 'CONFIRMED' }], now),
  'CONFIRMED',
  '거절 후 대체 예약 확정'
);
assert.equal(
  summarizeBookingState([{ status: 'DECLINED' }, { status: 'REQUESTED', holdExpiresAt: future }], now),
  'PENDING',
  '거절 후 대체 예약 대기'
);
assert.equal(summarizeBookingState([{ status: 'DECLINED' }, { status: 'EXPIRED' }], now), 'FAILED');
assert.equal(summarizeBookingState([{ status: 'COMPLETED' }], now), 'CONFIRMED');

assert.equal(blocksReveal('PENDING'), true);
assert.equal(blocksReveal('FAILED'), true);
for (const s of ['NONE', 'CONFIRMED', 'DISABLED'] as const) assert.equal(blocksReveal(s), false, s);

console.log('  ✓ 예약 상태 요약·Reveal 차단 규칙\n\n1/1 통과');
