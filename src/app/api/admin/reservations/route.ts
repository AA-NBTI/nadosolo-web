import { NextResponse } from 'next/server';
import { ReservationError } from '@/modules/reservation';
import {
  getNadoSoloReservationDriver,
  getNadoSoloReservationEngine,
  syncMeetupVenueOnFallback,
  upsertRestaurantResource,
} from '@/lib/reservation/nadosolo';
import { buildResponseUrl } from '@/lib/reservation/token';
import type { BudgetTier, DietaryRestriction } from '@/engine/types';

export const dynamic = 'force-dynamic';

/**
 * 관리자 전용 예약 관제 & 자원(식당/공간) 목록 조회
 */
export async function GET() {
  const engine = getNadoSoloReservationEngine();
  const driver = getNadoSoloReservationDriver();
  if (!engine || !driver) {
    return NextResponse.json({ ok: true, enabled: false, resources: [], bookings: [] });
  }
  try {
    const [resources, rawBookings] = await Promise.all([
      driver.listResources(),
      engine.listBookings(),
    ]);
    rawBookings.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    const bookings = rawBookings.map((b) => {
      const expiresAt = b.holdExpiresAt ? Date.parse(b.holdExpiresAt) : null;
      const respondUrl =
        b.status === 'REQUESTED' && expiresAt ? buildResponseUrl(b.id, expiresAt) : null;
      return { ...b, respondUrl };
    });

    return NextResponse.json({ ok: true, enabled: true, resources, bookings });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

/**
 * 관리자 예약/자원 제어:
 * - SYNC_RESOURCE: 제휴 식당 입점 승인/등록 시 reservation_resources에 반영
 * - TOGGLE_RESOURCE: 자원 활성/비활성 전환
 * - CONFIRM / DECLINE / COMPLETE / NO_SHOW / EXPIRE_HOLDS
 */
export async function POST(request: Request) {
  const engine = getNadoSoloReservationEngine();
  const driver = getNadoSoloReservationDriver();
  if (!engine || !driver) {
    return NextResponse.json({ ok: false, error: '예약 모듈 비활성 상태' }, { status: 503 });
  }
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: '잘못된 요청' }, { status: 400 });
  }

  try {
    const action = String(body.action || '');
    if (action === 'UPSERT_RESOURCE') {
      const id = String(body.id || `RES_${Date.now().toString(36).toUpperCase()}`);
      const name = String(body.name || '').trim();
      const kind = String(body.kind || 'restaurant').trim();
      const capacity = Math.max(1, Number(body.capacity) || 6);
      if (!name) return NextResponse.json({ ok: false, error: '업체명 필요' }, { status: 400 });
      const existing = await driver.getResource(id);
      const prevAttrs = (existing?.attributes || {}) as Record<string, any>;
      const resource = {
        id,
        kind,
        name,
        capacity,
        active: body.active !== undefined ? Boolean(body.active) : (existing?.active ?? true),
        attributes: {
          ...prevAttrs,
          cityCode: body.cityCode ?? prevAttrs.cityCode ?? 'SEOUL',
          budgetTier: body.budgetTier ?? prevAttrs.budgetTier ?? '$$',
          ...(body.contactEmail ? { contactEmail: String(body.contactEmail).trim().toLowerCase() } : {}),
          ...(body.pin ? { pin: String(body.pin).trim() } : {}),
          profile: body.profile ?? prevAttrs.profile ?? {},
          units: body.units ?? prevAttrs.units ?? [],
          schedule: body.schedule ?? prevAttrs.schedule ?? null,
        },
      };
      await driver.saveResource(resource);
      return NextResponse.json({ ok: true, resource });
    }
    if (action === 'CREATE_TEST_BOOKING') {
      const activeList = (await driver.listResources()).filter((r) => r.active);
      if (activeList.length === 0) {
        return NextResponse.json({ ok: false, error: '활성 자원을 먼저 등록해 주세요.' }, { status: 400 });
      }
      const target = activeList[0];
      const startsAt = new Date(Date.now() + 3 * 24 * 3600_000).toISOString();
      const slotId = `${target.id}:${startsAt}:TEST`;
      await engine.addSlot({
        id: slotId,
        resourceId: target.id,
        startsAt,
        capacity: target.capacity,
      });
      const b = await engine.request({
        slotId,
        ownerRef: `EVT_TEST_${Date.now().toString().slice(-5)}`,
        groupRef: 'TEST_ROOM',
        partySize: Math.min(6, target.capacity),
        meta: {
          source: 'admin_test',
          venueName: target.name,
          startsAtText: '테스트 일정 (3일 뒤 19:30)',
          attendee: { name: '테스트단원', phone: '010-0000-0000', requests: '조용한 테이블 요청' },
        },
      });
      return NextResponse.json({ ok: true, booking: b });
    }
    if (action === 'SYNC_RESOURCE') {
      const res = await upsertRestaurantResource({
        venueId: String(body.venueId),
        name: String(body.name),
        cityCode: String(body.cityCode || 'SEOUL'),
        budgetTier: (body.budgetTier as BudgetTier) || '$$',
        maxTablesPerNight: Number(body.maxTablesPerNight) || 2,
        supportedDietary: Array.isArray(body.supportedDietary)
          ? (body.supportedDietary as DietaryRestriction[])
          : ['NONE'],
        active: Boolean(body.active),
        contactEmail: body.contactEmail ? String(body.contactEmail) : undefined,
        pin: body.pin ? String(body.pin) : undefined,
      });
      return NextResponse.json({ ok: true, resource: res });
    }
    if (action === 'TOGGLE_RESOURCE') {
      const r = await driver.getResource(String(body.resourceId));
      if (!r) return NextResponse.json({ ok: false, error: '자원 없음' }, { status: 404 });
      r.active = !r.active;
      await driver.saveResource(r);
      return NextResponse.json({ ok: true, resource: r });
    }
    if (action === 'EXPIRE_HOLDS') {
      const expired = await engine.expireHolds();
      for (const b of expired) {
        await syncMeetupVenueOnFallback(engine, b).catch(() => null);
      }
      return NextResponse.json({ ok: true, expiredCount: expired.length });
    }
    if (action === 'CONFIRM') {
      const b = await engine.confirm(String(body.bookingId));
      return NextResponse.json({ ok: true, booking: b });
    }
    if (action === 'DECLINE') {
      const b = await engine.decline(String(body.bookingId), String(body.reason || '관리자 거절'));
      const fallbackBookingId = await syncMeetupVenueOnFallback(engine, b).catch(() => null);
      return NextResponse.json({ ok: true, booking: b, fallbackBookingId });
    }
    if (action === 'COMPLETE') {
      const b = await engine.complete(String(body.bookingId));
      return NextResponse.json({ ok: true, booking: b });
    }
    if (action === 'NO_SHOW') {
      const b = await engine.markNoShow(String(body.bookingId));
      return NextResponse.json({ ok: true, booking: b });
    }
    return NextResponse.json({ ok: false, error: '알 수 없는 action' }, { status: 400 });
  } catch (e) {
    if (e instanceof ReservationError) {
      return NextResponse.json({ ok: false, code: e.code, error: e.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
