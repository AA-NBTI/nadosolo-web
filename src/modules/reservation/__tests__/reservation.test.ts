/**
 * 범용 예약 모듈 독립 검증. 실행: npm run test:reservation
 * 나도솔로 코드/DB 없이 메모리 드라이버만으로 통과해야 한다.
 */
import assert from 'node:assert/strict';
import {
  createMemoryDriver,
  createNadoSoloReservationEngine,
  createReservationEngine,
  ReservationError,
  sameCityTierFallback,
  tableSlotsForNight,
  venueToResource,
  type ReservationEvent,
  type VenueLike,
} from '../index';

let current = new Date('2026-12-01T00:00:00Z');
const clock = () => current;
const at = (iso: string) => {
  current = new Date(iso);
};

const SLOT_START = '2026-12-05T10:30:00.000Z';

const venue = (id: string, tables = 2, tier = '$$'): VenueLike => ({
  venueId: id,
  name: id,
  cityCode: 'SEOUL',
  budgetTier: tier,
  supportedDietary: ['VEGAN'],
  vibeThemes: ['CASUAL_DINING'],
  maxTablesPerNight: tables,
});

async function setup(venues: VenueLike[]) {
  at('2026-12-01T00:00:00Z');
  const events: ReservationEvent[] = [];
  const engine = createNadoSoloReservationEngine({
    driver: createMemoryDriver(),
    clock,
    onEvent: (e) => {
      events.push(e);
    },
  });
  for (const v of venues) {
    await engine.registerResource(venueToResource(v, 6));
    for (const s of tableSlotsForNight(v, SLOT_START, 6)) await engine.addSlot(s);
  }
  return { engine, events };
}

const tests: Array<[string, () => Promise<void>]> = [];
const test = (name: string, fn: () => Promise<void>) => tests.push([name, fn]);

test('요청 → 확정 → 완료 정상 흐름과 이벤트', async () => {
  const { engine, events } = await setup([venue('A')]);
  const slotId = `A:${SLOT_START}:T1`;
  const b = await engine.request({ slotId, ownerRef: 'table-1', partySize: 6 });
  assert.equal(b.status, 'REQUESTED');
  assert.equal((await engine.availability(slotId)).remaining, 0);
  const c = await engine.confirm(b.id);
  assert.equal(c.status, 'CONFIRMED');
  at('2026-12-05T11:00:00Z');
  assert.equal((await engine.complete(b.id)).status, 'COMPLETED');
  assert.deepEqual(
    events.map((e) => e.type),
    ['booking.requested', 'booking.confirmed', 'booking.completed']
  );
});

test('초과 예약 방지: 동시 요청 중 정원만큼만 성공', async () => {
  const { engine } = await setup([venue('A', 1)]);
  const slotId = `A:${SLOT_START}:T1`;
  const results = await Promise.allSettled(
    Array.from({ length: 10 }, (_, i) =>
      engine.request({ slotId, ownerRef: `u${i}`, partySize: 2 })
    )
  );
  const ok = results.filter((r) => r.status === 'fulfilled').length;
  assert.equal(ok, 3);
  const full = results.filter(
    (r) => r.status === 'rejected' && (r.reason as ReservationError).code === 'SLOT_FULL'
  ).length;
  assert.equal(full, 7);
  assert.equal((await engine.availability(slotId)).remaining, 0);
});

test('멱등 키: 같은 키 재요청은 같은 예약 반환', async () => {
  const { engine, events } = await setup([venue('A')]);
  const slotId = `A:${SLOT_START}:T1`;
  const a = await engine.request({ slotId, ownerRef: 'x', partySize: 3, idempotencyKey: 'k1' });
  const b = await engine.request({ slotId, ownerRef: 'x', partySize: 3, idempotencyKey: 'k1' });
  assert.equal(a.id, b.id);
  assert.equal(events.filter((e) => e.type === 'booking.requested').length, 1);
});

test('입력 검증: 최대 인원 초과·0명·닫힌 슬롯·과거 슬롯', async () => {
  const { engine } = await setup([venue('A')]);
  const slotId = `A:${SLOT_START}:T1`;
  await assert.rejects(() => engine.request({ slotId, ownerRef: 'x', partySize: 7 }), { code: 'INVALID_INPUT' });
  await assert.rejects(() => engine.request({ slotId, ownerRef: 'x', partySize: 0 }), { code: 'INVALID_INPUT' });
  await engine.setSlotOpen(slotId, false);
  await assert.rejects(() => engine.request({ slotId, ownerRef: 'x', partySize: 2 }), { code: 'SLOT_CLOSED' });
  await engine.setSlotOpen(slotId, true);
  at('2026-12-06T00:00:00Z');
  await assert.rejects(() => engine.request({ slotId, ownerRef: 'x', partySize: 2 }), { code: 'SLOT_CLOSED' });
});

test('홀드 만료: 좌석 해제, 늦은 확정은 HOLD_EXPIRED', async () => {
  const { engine } = await setup([venue('A', 1)]);
  const slotId = `A:${SLOT_START}:T1`;
  const b = await engine.request({ slotId, ownerRef: 'x', partySize: 6 });
  at('2026-12-01T03:01:00Z'); // holdMinutes 180 경과
  assert.equal((await engine.availability(slotId)).remaining, 6);
  await assert.rejects(() => engine.confirm(b.id), { code: 'HOLD_EXPIRED' });
  assert.equal((await engine.getBooking(b.id))!.status, 'EXPIRED');
});

test('expireHolds: 만료분 일괄 처리', async () => {
  const { engine } = await setup([venue('A', 2)]);
  await engine.request({ slotId: `A:${SLOT_START}:T1`, ownerRef: 'a', partySize: 6 });
  await engine.request({ slotId: `A:${SLOT_START}:T2`, ownerRef: 'b', partySize: 6 });
  at('2026-12-01T04:00:00Z');
  const expired = await engine.expireHolds();
  assert.equal(expired.length, 2);
  assert.equal((await engine.expireHolds()).length, 0);
});

test('상태 전이 위반 차단', async () => {
  const { engine } = await setup([venue('A')]);
  const b = await engine.request({ slotId: `A:${SLOT_START}:T1`, ownerRef: 'x', partySize: 6 });
  await assert.rejects(() => engine.complete(b.id), { code: 'INVALID_TRANSITION' });
  await engine.confirm(b.id);
  await assert.rejects(() => engine.confirm(b.id), { code: 'INVALID_TRANSITION' });
  await assert.rejects(() => engine.decline(b.id), { code: 'INVALID_TRANSITION' });
  await engine.cancel(b.id);
  await assert.rejects(() => engine.cancel(b.id), { code: 'INVALID_TRANSITION' });
});

test('취소 정책: 48시간 전 무료, 이내 LATE', async () => {
  const { engine } = await setup([venue('A', 2)]);
  const early = await engine.request({ slotId: `A:${SLOT_START}:T1`, ownerRef: 'a', partySize: 6 });
  await engine.confirm(early.id);
  at('2026-12-02T00:00:00Z'); // 약 82시간 전
  assert.equal((await engine.cancel(early.id)).penalty, 'NONE');

  at('2026-12-01T00:00:00Z');
  const late = await engine.request({ slotId: `A:${SLOT_START}:T2`, ownerRef: 'b', partySize: 6 });
  await engine.confirm(late.id);
  at('2026-12-04T12:00:00Z'); // 22.5시간 전
  const c = await engine.cancel(late.id);
  assert.equal(c.penalty, 'LATE');
  assert.equal((await engine.availability(`A:${SLOT_START}:T2`)).remaining, 6);
});

test('노쇼: 유예 시간 전에는 불가, 이후 가능', async () => {
  const { engine } = await setup([venue('A')]);
  const b = await engine.request({ slotId: `A:${SLOT_START}:T1`, ownerRef: 'x', partySize: 6 });
  await engine.confirm(b.id);
  at('2026-12-05T10:40:00Z');
  await assert.rejects(() => engine.markNoShow(b.id), { code: 'TOO_EARLY' });
  at('2026-12-05T10:46:00Z');
  assert.equal((await engine.markNoShow(b.id)).status, 'NO_SHOW');
});

test('거절 시 같은 도시·티어 식당으로 자동 폴백', async () => {
  const { engine, events } = await setup([venue('A', 1), venue('B', 1), venue('C', 1, '$$$')]);
  const b = await engine.request({ slotId: `A:${SLOT_START}:T1`, ownerRef: 'tbl', partySize: 6 });
  await engine.decline(b.id, '만석');
  const original = (await engine.getBooking(b.id))!;
  assert.equal(original.status, 'DECLINED');
  assert.ok(original.fallbackBookingId);
  const next = (await engine.getBooking(original.fallbackBookingId!))!;
  assert.equal(next.resourceId, 'B'); // C는 티어 불일치
  assert.equal(next.fallbackOf, b.id);
  assert.ok(events.some((e) => e.type === 'booking.fallback_requested'));
});

test('폴백 후보가 없으면 대체 없이 종료', async () => {
  const { engine } = await setup([venue('A', 1), venue('C', 1, '$$$')]);
  const b = await engine.request({ slotId: `A:${SLOT_START}:T1`, ownerRef: 'tbl', partySize: 6 });
  await engine.decline(b.id);
  assert.equal((await engine.getBooking(b.id))!.fallbackBookingId, undefined);
});

test('코어는 업종 무관: 호텔 자원을 코어만으로 운용', async () => {
  const engine = createReservationEngine({
    policy: { holdMinutes: 30, freeCancelHoursBefore: 24, noShowGraceMinutes: 0 },
    driver: createMemoryDriver(),
    clock,
  });
  at('2026-12-01T00:00:00Z');
  await engine.registerResource({ id: 'room-101', kind: 'hotel_room', name: '101호', capacity: 2, attributes: { bed: 'queen' } });
  await engine.addSlot({ id: 'room-101:night', resourceId: 'room-101', startsAt: '2026-12-10T06:00:00Z', capacity: 2 });
  const b = await engine.request({ slotId: 'room-101:night', ownerRef: 'guest', partySize: 2 });
  assert.equal((await engine.confirm(b.id)).status, 'CONFIRMED');
  const found = await engine.searchSlots({ kind: 'hotel_room' });
  assert.equal(found.length, 0); // 만실
});

void sameCityTierFallback;

(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
    } catch (e) {
      failed++;
      console.error(`  ✗ ${name}\n    ${(e as Error).message}`);
    }
  }
  console.log(`\n${tests.length - failed}/${tests.length} 통과`);
  process.exit(failed ? 1 : 0);
})();
