import { NextResponse } from 'next/server';
import { ReservationError, extractSchedule, extractUnits, type ScheduleConfig } from '@/modules/reservation';
import {
  getNadoSoloReservationDriver,
  getNadoSoloReservationEngine,
  syncMeetupVenueOnFallback,
} from '@/lib/reservation/nadosolo';

export const dynamic = 'force-dynamic';

function todayKst(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}

/**
 * 업체 포털 전용 API:
 * - GET: 매장 예약 목록 + 지정 날짜의 실시간 시간대별 빈 자리/만석 현황 + 휴무 여부
 * - POST: ACCEPT | DECLINE | COMPLETE | NO_SHOW | WALKIN_BOOK | BLOCK_WINDOW | TOGGLE_DAY_CLOSED
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get('venueId')?.trim();
  const date = searchParams.get('date')?.trim() || todayKst();
  if (!venueId) {
    return NextResponse.json({ ok: false, error: 'venueId 필요' }, { status: 400 });
  }
  const engine = getNadoSoloReservationEngine();
  const driver = getNadoSoloReservationDriver();
  if (!engine || !driver) {
    return NextResponse.json({ ok: true, enabled: false, bookings: [], windows: [], isClosedDay: false });
  }
  try {
    const [resource, bookings] = await Promise.all([
      driver.getResource(venueId),
      engine.listBookings({ resourceId: venueId }),
    ]);
    bookings.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    // 고객 연락처(또는 ownerRef)별 방문·노쇼 이력 자동 집계
    const statsByKey = new Map<string, { visits: number; noShows: number }>();
    for (const b of bookings) {
      const att = b.meta?.attendee as { phone?: string } | undefined;
      const key = (att?.phone && att.phone !== '-' ? att.phone : b.ownerRef).trim();
      const cur = statsByKey.get(key) ?? { visits: 0, noShows: 0 };
      if (b.status === 'COMPLETED') cur.visits += 1;
      if (b.status === 'NO_SHOW') cur.noShows += 1;
      statsByKey.set(key, cur);
    }

    const enrichedBookings = bookings.map((b) => {
      const att = b.meta?.attendee as { phone?: string } | undefined;
      const key = (att?.phone && att.phone !== '-' ? att.phone : b.ownerRef).trim();
      return {
        ...b,
        customerStats: statsByKey.get(key) ?? { visits: 0, noShows: 0 },
      };
    });

    const schedule = resource ? extractSchedule(resource) : null;
    const isClosedDay = Boolean(schedule?.overrides?.some((o) => o.date === date && o.closed));
    const units = resource ? extractUnits(resource).filter((u) => u.active) : [];
    const windows = resource
      ? await engine.getAvailableWindows({ resourceId: venueId, date, partySize: 1 }).catch(() => [])
      : [];

    return NextResponse.json({
      ok: true,
      enabled: true,
      date,
      isClosedDay,
      profile: resource?.attributes?.profile || {},
      tableBoard: resource?.attributes?.tableBoard || {},
      schedule,
      units,
      windows,
      bookings: enrichedBookings,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const engine = getNadoSoloReservationEngine();
  const driver = getNadoSoloReservationDriver();
  if (!engine || !driver) {
    return NextResponse.json({ ok: false, error: '예약 기능이 비활성화되어 있습니다.' }, { status: 503 });
  }
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: '잘못된 요청' }, { status: 400 });
  }

  const venueId = String(body.venueId || '').trim();
  const action = String(body.action || '').trim();
  if (!venueId || !action) {
    return NextResponse.json({ ok: false, error: '필수 파라미터 누락' }, { status: 400 });
  }

  try {
    // -1. 1초 홀 테이블 보드 착석/비움 원클릭 토글
    if (action === 'TOGGLE_TABLE') {
      const tableKey = String(body.tableKey || '').trim();
      if (!tableKey) return NextResponse.json({ ok: false, error: 'tableKey 필요' }, { status: 400 });
      const resource = await driver.getResource(venueId);
      if (!resource) return NextResponse.json({ ok: false, error: '매장 자원 없음' }, { status: 404 });
      const prevBoard = ((resource.attributes?.tableBoard as Record<string, any>) || {});
      const cur = prevBoard[tableKey];
      const nextOccupied = !cur?.occupied;
      const nextBoard = {
        ...prevBoard,
        [tableKey]: nextOccupied
          ? { occupied: true, seatedAt: new Date().toISOString() }
          : { occupied: false },
      };
      resource.attributes = { ...resource.attributes, tableBoard: nextBoard };
      await driver.saveResource(resource);
      return NextResponse.json({ ok: true, tableBoard: nextBoard });
    }

    // -0.5. 첫 로그인 시 업체 필수 정보 등록(온보딩 완료)
    if (action === 'COMPLETE_ONBOARDING') {
      const resource = await driver.getResource(venueId);
      if (!resource) return NextResponse.json({ ok: false, error: '매장 자원 없음' }, { status: 404 });

      const name = String(body.name || '').trim();
      const kind = String(body.kind || 'restaurant').trim();
      const address = String(body.profile?.address || '').trim();
      const addressDetail = String(body.profile?.addressDetail || '').trim();
      const phone = String(body.profile?.phone || '').trim();
      const guideNote = String(body.profile?.guideNote || '').trim();
      const quantity = Math.max(1, Number(body.quantity) || 2);
      const partyCap = Math.max(1, Number(body.partyCap) || 6);

      if (!name || !address || !phone) {
        return NextResponse.json(
          { ok: false, error: '업체명, 도로명 주소, 매장 연락처를 모두 입력해 주세요.' },
          { status: 400 }
        );
      }

      const defaultUnitName =
        kind === 'restaurant' ? '홀 테이블' : kind === 'lodging' ? '객실' : kind === 'space' ? '예약 룸' : '기본 예약 단위';

      const units = [
        {
          id: 'unit-main',
          name: defaultUnitName,
          minPartySize: 1,
          maxPartySize: partyCap,
          quantity,
          durationMinutes: 120,
          active: true,
        },
      ];

      resource.name = name;
      resource.kind = kind;
      resource.capacity = quantity * partyCap;
      resource.active = true;
      resource.attributes = {
        ...resource.attributes,
        onboardingCompleted: true,
        maxTablesPerNight: quantity,
        profile: {
          ...(resource.attributes?.profile as Record<string, any> | undefined),
          address,
          addressDetail,
          phone,
          managerPhone: phone,
          guideNote,
        },
        units,
      };
      await driver.saveResource(resource);
      return NextResponse.json({
        ok: true,
        resource: {
          id: resource.id,
          kind: resource.kind,
          name: resource.name,
          capacity: resource.capacity,
          active: resource.active,
          onboardingCompleted: true,
          managerName: String(resource.attributes?.managerName || ''),
          profile: resource.attributes.profile,
          contactEmail: String(resource.attributes?.contactEmail || ''),
        },
      });
    }

    // 0. 업체 직접 설정 저장 (매장 프로필 · 복수 유닛 · 주간 스케줄)
    if (action === 'UPDATE_SETTINGS') {
      const resource = await driver.getResource(venueId);
      if (!resource) return NextResponse.json({ ok: false, error: '매장 자원 없음' }, { status: 404 });
      const nextUnits = Array.isArray(body.units) ? body.units : extractUnits(resource);
      const nextTotalCap = nextUnits.reduce(
        (acc: number, u: any) => acc + (u.active ? Math.max(1, Number(u.quantity) || 1) * Math.max(1, Number(u.maxPartySize) || 1) : 0),
        0
      );
      resource.capacity = Math.max(1, nextTotalCap || resource.capacity);
      resource.attributes = {
        ...resource.attributes,
        ...(body.profile ? { profile: body.profile } : {}),
        ...(Array.isArray(body.units) ? { units: nextUnits } : {}),
        ...(body.schedule ? { schedule: body.schedule } : {}),
      };
      await driver.saveResource(resource);
      return NextResponse.json({ ok: true, resource });
    }

    // 1. 특정 날짜 전체 휴무 마감 / 해제
    if (action === 'TOGGLE_DAY_CLOSED') {
      const date = String(body.date || '').trim();
      if (!date) return NextResponse.json({ ok: false, error: 'date 필요' }, { status: 400 });
      const resource = await driver.getResource(venueId);
      if (!resource) return NextResponse.json({ ok: false, error: '매장 자원 없음' }, { status: 404 });

      const prevSchedule: ScheduleConfig = extractSchedule(resource) ?? {
        timezoneOffsetMinutes: 540,
        weekly: [],
        overrides: [],
      };
      const exists = prevSchedule.overrides.some((o) => o.date === date && o.closed);
      const nextOverrides = exists
        ? prevSchedule.overrides.filter((o) => o.date !== date)
        : [...prevSchedule.overrides.filter((o) => o.date !== date), { date, closed: true, reason: '사장님 마감' }];

      resource.attributes = {
        ...resource.attributes,
        schedule: { ...prevSchedule, overrides: nextOverrides },
      };
      await driver.saveResource(resource);
      return NextResponse.json({ ok: true, isClosedDay: !exists });
    }

    // 2. 전화·워크인 손님 직접 등록 또는 특정 시간대 만석 마감
    if (action === 'WALKIN_BOOK' || action === 'BLOCK_WINDOW') {
      const unitId = String(body.unitId || 'unit-main');
      const startsAt = String(body.startsAt || '');
      const partySize = Math.max(1, Number(body.partySize) || 2);
      const guestName = action === 'BLOCK_WINDOW' ? '현장마감' : String(body.guestName || '전화/워크인');
      const guestPhone = String(body.guestPhone || '-');
      if (!startsAt) return NextResponse.json({ ok: false, error: 'startsAt 필요' }, { status: 400 });

      const startsAtText = new Date(startsAt).toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const requested = await engine.bookWindow({
        resourceId: venueId,
        unitId,
        startsAt,
        partySize,
        ownerRef: action === 'BLOCK_WINDOW' ? `BLOCK:${venueId}` : `WALKIN:${venueId}`,
        attendee: { name: guestName, phone: guestPhone, requests: action === 'BLOCK_WINDOW' ? '사장님 수동 만석 처리' : '매장 직접 등록' },
        meta: { source: action === 'BLOCK_WINDOW' ? 'owner_block' : 'owner_walkin', startsAtText },
      });
      const confirmed = await engine.confirm(requested.id);
      return NextResponse.json({ ok: true, booking: confirmed });
    }

    // 3. 기존 예약 상태 변경 (수락/거절/완료/노쇼)
    const bookingId = String(body.bookingId || '');
    const reason = body.reason ? String(body.reason) : undefined;
    if (!bookingId) return NextResponse.json({ ok: false, error: 'bookingId 필요' }, { status: 400 });

    const current = await engine.getBooking(bookingId);
    if (!current || current.resourceId !== venueId) {
      return NextResponse.json({ ok: false, error: '해당 매장의 예약이 아닙니다.' }, { status: 403 });
    }

    if (action === 'ACCEPT') {
      const b = await engine.confirm(bookingId);
      return NextResponse.json({ ok: true, booking: b });
    }
    if (action === 'DECLINE') {
      const b = await engine.decline(bookingId, reason || '매장 사정 거절');
      const fallbackBookingId = await syncMeetupVenueOnFallback(engine, b).catch(() => null);
      return NextResponse.json({ ok: true, booking: b, fallbackBookingId });
    }
    if (action === 'COMPLETE') {
      const b = await engine.complete(bookingId);
      return NextResponse.json({ ok: true, booking: b });
    }
    if (action === 'NO_SHOW') {
      const b = await engine.markNoShow(bookingId);
      return NextResponse.json({ ok: true, booking: b });
    }
    return NextResponse.json({ ok: false, error: '지원하지 않는 action' }, { status: 400 });
  } catch (e) {
    if (e instanceof ReservationError) {
      return NextResponse.json({ ok: false, code: e.code, error: e.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
