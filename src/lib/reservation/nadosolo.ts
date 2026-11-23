import {
  NADOSOLO_TABLE_SIZE,
  type Booking,
  type ReservationDriver,
  type ReservationEngine,
  type Resource,
} from '@/modules/reservation';
import type { BudgetTier, DietaryRestriction, PartnerVenue } from '@/engine/types';
import { buildResponseUrl } from '@/lib/reservation/token';
import { createAdminClient } from '@/lib/supabase/admin';
import { getReservationDriver, getReservationEngine } from '@/lib/reservation/runtime';

export const getNadoSoloReservationDriver = getReservationDriver;
export const getNadoSoloReservationEngine = getReservationEngine;

/** '2026-11-20 (금) 19:30' 같은 슬롯 문자열(KST)을 ISO(UTC)로 변환. 실패 시 null. */
export function parseScheduleSlot(slot: string): string | null {
  const m = /(\d{4})-(\d{2})-(\d{2}).*?(\d{1,2}):(\d{2})/.exec(slot);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const date = new Date(`${y}-${mo}-${d}T${h.padStart(2, '0')}:${mi}:00+09:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export interface RoomReservationInput {
  eventId: string;
  roomId: string;
  scheduleSlot: string;
  memberCount: number;
  venueId?: string;
  venueName?: string;
  cityCode?: string;
  budgetTier?: string;
}

/** reservation_resources(kind='restaurant', active=true) → PartnerVenue 변환 */
export function resourceToPartnerVenue(r: Resource): PartnerVenue {
  const attrs = (r.attributes || {}) as Record<string, unknown>;
  const maxTables = Number(attrs.maxTablesPerNight) || Math.max(1, Math.floor(r.capacity / NADOSOLO_TABLE_SIZE));
  const dietary = Array.isArray(attrs.supportedDietary)
    ? (attrs.supportedDietary as DietaryRestriction[])
    : (['NONE'] as DietaryRestriction[]);
  const themes = Array.isArray(attrs.vibeThemes)
    ? (attrs.vibeThemes as PartnerVenue['vibeThemes'])
    : (['CASUAL_DINING'] as PartnerVenue['vibeThemes']);

  return {
    venueId: r.id,
    name: r.name,
    cityCode: String(attrs.cityCode || 'SEOUL'),
    budgetTier: (attrs.budgetTier as BudgetTier) || '$$',
    supportedDietary: dietary,
    vibeThemes: themes,
    maxTablesPerNight: maxTables,
  };
}

/** 활성 제휴 식당 목록 조회 (파이프라인 매칭용 - 테이블바로 일반 매장 제외) */
export async function listActiveRestaurantVenues(): Promise<PartnerVenue[]> {
  const driver = getNadoSoloReservationDriver();
  if (!driver) return [];
  const resources = await driver.listResources({ kind: 'restaurant' });
  return resources
    .filter((r) => r.active && r.attributes?.nadosoloApproved !== false)
    .map(resourceToPartnerVenue);
}

/** 제휴 식당 자원 등록/갱신 (입점 신청 및 관리자 승인 시 사용) */
export async function upsertRestaurantResource(params: {
  venueId: string;
  name: string;
  cityCode: string;
  budgetTier: BudgetTier;
  maxTablesPerNight: number;
  supportedDietary: DietaryRestriction[];
  active: boolean;
  contactEmail?: string;
  pin?: string;
}): Promise<Resource | null> {
  const driver = getNadoSoloReservationDriver();
  if (!driver) return null;
  const existing = await driver.getResource(params.venueId);
  const prevAttrs = (existing?.attributes || {}) as Record<string, unknown>;
  const resource: Resource = {
    id: params.venueId,
    kind: 'restaurant',
    name: params.name,
    capacity: Math.max(1, params.maxTablesPerNight) * NADOSOLO_TABLE_SIZE,
    active: params.active,
    attributes: {
      ...prevAttrs,
      cityCode: params.cityCode,
      budgetTier: params.budgetTier,
      maxTablesPerNight: params.maxTablesPerNight,
      supportedDietary: params.supportedDietary,
      vibeThemes: prevAttrs.vibeThemes || ['CASUAL_DINING'],
      ...(params.contactEmail ? { contactEmail: params.contactEmail } : {}),
      ...(params.pin ? { pin: params.pin } : {}),
    },
  };
  await driver.saveResource(resource);
  return resource;
}

/** 확정된 방 1개에 대해 식당 예약을 요청한다. 반환: 예약 ID 또는 건너뜀 사유. */
export async function requestRoomReservation(
  engine: ReservationEngine,
  room: RoomReservationInput
): Promise<{ bookingId?: string; respondUrl?: string; skipped?: string }> {
  if (!room.venueId) return { skipped: '배정 식당 없음' };
  if (room.memberCount < 1) return { skipped: '참가자 없음' };
  const startsAt = parseScheduleSlot(room.scheduleSlot);
  if (!startsAt) return { skipped: `일정 해석 불가: ${room.scheduleSlot}` };

  const driver = getNadoSoloReservationDriver();
  const existing = driver ? await driver.getResource(room.venueId) : null;
  if (!existing) {
    await engine.registerResource({
      id: room.venueId,
      kind: 'restaurant',
      name: room.venueName ?? room.venueId,
      capacity: NADOSOLO_TABLE_SIZE,
      attributes: { cityCode: room.cityCode, budgetTier: room.budgetTier },
    });
  }

  const slotId = `${room.venueId}:${startsAt}:${room.roomId}`;
  await engine.addSlot({
    id: slotId,
    resourceId: room.venueId,
    startsAt,
    capacity: NADOSOLO_TABLE_SIZE,
  });
  const booking = await engine.request({
    slotId,
    ownerRef: room.eventId,
    groupRef: room.roomId,
    partySize: Math.min(room.memberCount, NADOSOLO_TABLE_SIZE),
    idempotencyKey: `meetup:${room.eventId}`,
    meta: { source: 'pipeline', venueName: room.venueName, startsAtText: room.scheduleSlot },
  });
  const expiresAt = booking.holdExpiresAt ? Date.parse(booking.holdExpiresAt) : null;
  const respondUrl = expiresAt ? buildResponseUrl(booking.id, expiresAt) : null;
  return { bookingId: booking.id, respondUrl: respondUrl ?? undefined };
}

/** 거절/만료 후 대체 예약이 생성된 경우 meetups 테이블의 식당 정보도 함께 동기화 */
export async function syncMeetupVenueOnFallback(
  engine: ReservationEngine,
  declinedBooking: Booking
): Promise<string | null> {
  if (!declinedBooking.fallbackBookingId) return null;
  const nextBooking = await engine.getBooking(declinedBooking.fallbackBookingId);
  if (!nextBooking) return null;
  const driver = getNadoSoloReservationDriver();
  const nextResource = driver ? await driver.getResource(nextBooking.resourceId) : null;
  const nextVenueName = nextResource?.name || (nextBooking.meta?.venueName as string) || nextBooking.resourceId;

  const admin = createAdminClient();
  if (admin && nextBooking.ownerRef) {
    await admin
      .from('meetups')
      .update({
        venue_id: nextBooking.resourceId,
        venue_name_override: nextVenueName,
        updated_at: new Date().toISOString(),
      })
      .eq('meetup_id', nextBooking.ownerRef);
  }
  return nextBooking.id;
}
