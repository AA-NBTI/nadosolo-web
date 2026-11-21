/**
 * Supabase 드라이버 매핑 검증 (가짜 클라이언트 사용, 실DB 불필요).
 * 실행: npm run test:reservation:supabase
 * DB 트리거(정원 보호)는 가짜 클라이언트가 동일 규칙으로 흉내 낸다.
 */
import assert from 'node:assert/strict';
import {
  createNadoSoloReservationEngine,
  createSupabaseDriver,
  tableSlotsForNight,
  venueToResource,
  type SupabaseLike,
  type VenueLike,
} from '../index';

type Row = Record<string, any>;

function createFakeSupabase(): SupabaseLike {
  const db: Record<string, Row[]> = {
    reservation_resources: [],
    reservation_slots: [],
    reservation_bookings: [],
  };
  return {
    from(table: string) {
      const filters: Array<(r: Row) => boolean> = [];
      const builder: any = {
        select: () => builder,
        eq: (c: string, v: any) => (filters.push((r) => r[c] === v), builder),
        in: (c: string, vs: any[]) => (filters.push((r) => vs.includes(r[c])), builder),
        maybeSingle: async () => ({
          data: db[table].find((r) => filters.every((f) => f(r))) ?? null,
          error: null,
        }),
        upsert: async (row: Row) => {
          if (table === 'reservation_bookings' && ['REQUESTED', 'CONFIRMED'].includes(row.status)) {
            const slot = db.reservation_slots.find((s) => s.id === row.slot_id);
            const occupied = db.reservation_bookings
              .filter((b) => b.slot_id === row.slot_id && b.id !== row.id)
              .filter((b) => b.status === 'CONFIRMED' || b.status === 'REQUESTED')
              .reduce((n, b) => n + b.party_size, 0);
            if (slot && occupied + row.party_size > slot.capacity) {
              return { error: { message: 'SLOT_FULL: trigger' } };
            }
          }
          const i = db[table].findIndex((r) => r.id === row.id);
          if (i >= 0) db[table][i] = { ...db[table][i], ...row };
          else db[table].push({ ...row });
          return { error: null };
        },
        then: (resolve: (v: any) => void) =>
          resolve({ data: db[table].filter((r) => filters.every((f) => f(r))), error: null }),
      };
      return builder;
    },
  };
}

const venue = (id: string): VenueLike => ({
  venueId: id,
  name: id,
  cityCode: 'SEOUL',
  budgetTier: '$$',
  supportedDietary: [],
  vibeThemes: [],
  maxTablesPerNight: 1,
});

(async () => {
  let now = new Date('2026-12-01T00:00:00Z');
  const engine = createNadoSoloReservationEngine({
    driver: createSupabaseDriver(createFakeSupabase()),
    clock: () => now,
  });
  const START = '2026-12-05T10:30:00.000Z';
  for (const id of ['A', 'B']) {
    await engine.registerResource(venueToResource(venue(id), 6));
    for (const s of tableSlotsForNight(venue(id), START, 6)) await engine.addSlot(s);
  }

  const slotA = `A:${START}:T1`;
  const b = await engine.request({ slotId: slotA, ownerRef: 'tbl', partySize: 6, groupRef: 'g1', meta: { x: 1 } });
  assert.equal(b.status, 'REQUESTED');
  assert.deepEqual((await engine.getBooking(b.id))!.meta, { x: 1 });

  // DB 정원 보호 오류가 SLOT_FULL로 변환되는지
  await assert.rejects(() => engine.request({ slotId: slotA, ownerRef: 'z', partySize: 1 }), { code: 'SLOT_FULL' });

  // 거절 → 폴백, 필드 왕복
  await engine.decline(b.id, '만석');
  const orig = (await engine.getBooking(b.id))!;
  assert.equal(orig.status, 'DECLINED');
  assert.equal(orig.reason, '만석');
  const next = (await engine.getBooking(orig.fallbackBookingId!))!;
  assert.equal(next.resourceId, 'B');
  assert.equal(next.groupRef, 'g1');
  assert.equal(next.fallbackOf, b.id);

  await engine.confirm(next.id);
  now = new Date('2026-12-05T11:00:00Z');
  assert.equal((await engine.complete(next.id)).status, 'COMPLETED');
  assert.equal((await engine.listBookings({ groupRef: 'g1', status: ['COMPLETED', 'DECLINED'] })).length, 2);

  console.log('  ✓ supabase 드라이버 매핑·정원 오류 변환·폴백 왕복\n\n1/1 통과');
})().catch((e) => {
  console.error('  ✗', e);
  process.exit(1);
});
