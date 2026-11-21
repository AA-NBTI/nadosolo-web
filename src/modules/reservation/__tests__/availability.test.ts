/**
 * Cal.com × 네이버 스마트플레이스 레퍼런스 검증 테스트 (기준 1, 2, 3, 4, 5, 8번)
 * 실행: npm run test:reservation:availability
 */
import assert from 'node:assert/strict';
import {
  createMemoryDriver,
  createReservationEngine,
  ReservationError,
  type BookableUnit,
  type ResourceProfile,
  type ScheduleConfig,
} from '../index';

let now = new Date('2026-12-01T00:00:00Z'); // 화요일

const profile: ResourceProfile = {
  address: '부산 수영구 광안해변로 219',
  addressDetail: '3층 오션뷰홀',
  phone: '051-755-1234',
  managerPhone: '010-1234-5678',
  guideNote: '발렛파킹 가능, 콜키지 1병 무료',
};

const units: BookableUnit[] = [
  { id: 'room-6', name: '오션뷰 6인 룸', minPartySize: 4, maxPartySize: 6, quantity: 2, durationMinutes: 120, active: true },
  { id: 'hall-4', name: '홀 4인석', minPartySize: 2, maxPartySize: 4, quantity: 3, durationMinutes: 90, active: true },
];

const schedule: ScheduleConfig = {
  timezoneOffsetMinutes: 540, // KST (+09:00)
  weekly: [
    // 금요일(5): 17:00~22:00 (브레이크 없음), 60분 간격
    { dayOfWeek: 5, startTime: '17:00', endTime: '22:00', slotIntervalMinutes: 60, active: true },
    // 수요일(3): 11:30~21:00, 브레이크 15:00~17:00, 60분 간격
    { dayOfWeek: 3, startTime: '11:30', endTime: '21:00', breakStart: '15:00', breakEnd: '17:00', slotIntervalMinutes: 60, active: true },
  ],
  overrides: [
    // 2026-12-11 (금) 임시 휴무
    { date: '2026-12-11', closed: true, reason: '대관 행사' },
  ],
};

(async () => {
  const engine = createReservationEngine({
    policy: { holdMinutes: 60, freeCancelHoursBefore: 48, noShowGraceMinutes: 15 },
    driver: createMemoryDriver(),
    clock: () => now,
  });

  await engine.registerResource({
    id: 'VEN_GWANGAN_VIEW',
    kind: 'restaurant',
    name: '광안브릿지뷰',
    capacity: 24,
    attributes: { profile, units, schedule },
  });

  // 1. 주간 영업일(수요일 2026-12-02): 브레이크타임(15:00~17:00) 걸친 시간 제외 + 6명 조건이면 6인 룸만 조회
  const wedWindows = await engine.getAvailableWindows({
    resourceId: 'VEN_GWANGAN_VIEW',
    date: '2026-12-02',
    partySize: 6,
  });
  assert.ok(wedWindows.length > 0);
  assert.ok(wedWindows.every((w) => w.unitId === 'room-6'), '6명은 6인 룸만 가능');
  // 14:30~16:30은 브레이크(15:00~17:00)와 겹치므로 제외되어야 함
  assert.equal(wedWindows.some((w) => w.startsAt.includes('05:30:00')), false, '14:30 KST(05:30Z) 브레이크 제외');

  // 2. 휴무일(금요일 2026-12-11): DateOverride closed=true -> 0개 반환
  const closedWindows = await engine.getAvailableWindows({
    resourceId: 'VEN_GWANGAN_VIEW',
    date: '2026-12-11',
    partySize: 6,
  });
  assert.equal(closedWindows.length, 0, '휴무일은 빈 시간 0개');

  // 3. 정상 금요일(2026-12-04): 19:00 KST (10:00 UTC) 예약 2건 진행 -> 3번째는 SLOT_FULL
  const friWindows = await engine.getAvailableWindows({
    resourceId: 'VEN_GWANGAN_VIEW',
    date: '2026-12-04',
    partySize: 6,
  });
  const target19 = friWindows.find((w) => w.startsAt === '2026-12-04T10:00:00.000Z');
  assert.ok(target19 && target19.remainingQuantity === 2);

  const b1 = await engine.bookWindow({
    resourceId: 'VEN_GWANGAN_VIEW',
    unitId: 'room-6',
    startsAt: '2026-12-04T10:00:00.000Z',
    partySize: 5,
    ownerRef: 'user-1',
    attendee: { name: '김솔로', phone: '010-1111-2222', requests: '창가 자리 부탁드려요' },
  });
  assert.equal((b1.meta.attendee as any).requests, '창가 자리 부탁드려요');

  // 19:00(10:00Z~12:00Z)와 겹치는 18:00(09:00Z~11:00Z)의 잔여 수량도 2 -> 1로 감소해야 함 (겹침 계산 검증)
  const friAfter1 = await engine.getAvailableWindows({
    resourceId: 'VEN_GWANGAN_VIEW',
    date: '2026-12-04',
    partySize: 6,
  });
  const w18 = friAfter1.find((w) => w.startsAt === '2026-12-04T09:00:00.000Z');
  assert.equal(w18?.remainingQuantity, 1, '시간 겹침 구간(18:00~20:00) 잔여 수량 1로 감소');

  await engine.bookWindow({
    resourceId: 'VEN_GWANGAN_VIEW',
    unitId: 'room-6',
    startsAt: '2026-12-04T10:00:00.000Z',
    partySize: 6,
    ownerRef: 'user-2',
  });

  // 3번째 시도 -> 정원(quantity=2) 소진으로 SLOT_FULL
  await assert.rejects(
    () =>
      engine.bookWindow({
        resourceId: 'VEN_GWANGAN_VIEW',
        unitId: 'room-6',
        startsAt: '2026-12-04T10:00:00.000Z',
        partySize: 6,
        ownerRef: 'user-3',
      }),
    (e: unknown) => e instanceof ReservationError && e.code === 'SLOT_FULL'
  );

  // 19:00 시간대는 목록에서도 사라져야 함
  const friAfter2 = await engine.getAvailableWindows({
    resourceId: 'VEN_GWANGAN_VIEW',
    date: '2026-12-04',
    partySize: 6,
  });
  assert.equal(friAfter2.some((w) => w.startsAt === '2026-12-04T10:00:00.000Z'), false);

  console.log('  ✓ 레퍼런스 1·2·3·4·5·8번(업체상세·유닛·주간스케줄·휴무일·시간겹침 동적가용성·예약자요청) 전체 통과\n\n1/1 통과');
})().catch((e) => {
  console.error('  ✗', e);
  process.exit(1);
});
