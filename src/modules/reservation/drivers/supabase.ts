import {
  ReservationError,
  type Booking,
  type BookingFilter,
  type ReservationDriver,
  type Resource,
  type Slot,
} from '../types';

/** supabase-js 클라이언트와 구조적으로 호환되는 최소 형태 (import 의존 없음). */
export interface SupabaseLike {
  from(table: string): any;
}

export interface SupabaseDriverOptions {
  tables?: { resources?: string; slots?: string; bookings?: string };
}

const nul = <T,>(v: T | null | undefined): T | undefined => (v === null || v === undefined ? undefined : v);

function toResource(r: any): Resource {
  return {
    id: r.id,
    kind: r.kind,
    name: r.name,
    capacity: r.capacity,
    active: r.active,
    attributes: r.attributes ?? {},
  };
}

function toSlot(r: any): Slot {
  return {
    id: r.id,
    resourceId: r.resource_id,
    startsAt: new Date(r.starts_at).toISOString(),
    endsAt: r.ends_at ? new Date(r.ends_at).toISOString() : undefined,
    capacity: r.capacity,
    open: r.open,
  };
}

function toBooking(r: any): Booking {
  return {
    id: r.id,
    slotId: r.slot_id,
    resourceId: r.resource_id,
    ownerRef: r.owner_ref,
    groupRef: nul(r.group_ref),
    partySize: r.party_size,
    status: r.status,
    idempotencyKey: nul(r.idempotency_key),
    holdExpiresAt: r.hold_expires_at ? new Date(r.hold_expires_at).toISOString() : undefined,
    penalty: nul(r.penalty),
    reason: nul(r.reason),
    fallbackOf: nul(r.fallback_of),
    fallbackBookingId: nul(r.fallback_booking_id),
    meta: r.meta ?? {},
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  };
}

function fail(error: { message?: string } | null, what: string): never {
  const msg = error?.message ?? 'unknown';
  if (msg.includes('SLOT_FULL')) throw new ReservationError('SLOT_FULL', msg);
  if (msg.includes('NOT_FOUND')) throw new ReservationError('NOT_FOUND', msg);
  throw new Error(`[reservation] ${what} 실패: ${msg}`);
}

/**
 * Supabase 드라이버.
 * - 정원 보호의 최종 방어선은 DB 트리거(reservation_guard_capacity)이다.
 * - withLock은 같은 프로세스 안의 경합만 줄이는 직렬화이며, 인스턴스 간 안전성은 트리거가 보장한다.
 * - 서버 전용(service role) 클라이언트를 주입할 것.
 */
export function createSupabaseDriver(
  client: SupabaseLike,
  options: SupabaseDriverOptions = {}
): ReservationDriver {
  const T = {
    resources: options.tables?.resources ?? 'reservation_resources',
    slots: options.tables?.slots ?? 'reservation_slots',
    bookings: options.tables?.bookings ?? 'reservation_bookings',
  };
  const tails = new Map<string, Promise<unknown>>();

  return {
    async getResource(id) {
      const { data, error } = await client.from(T.resources).select('*').eq('id', id).maybeSingle();
      if (error) fail(error, 'getResource');
      return data ? toResource(data) : null;
    },
    async saveResource(r) {
      const { error } = await client.from(T.resources).upsert(
        { id: r.id, kind: r.kind, name: r.name, capacity: r.capacity, active: r.active, attributes: r.attributes },
        { onConflict: 'id' }
      );
      if (error) fail(error, 'saveResource');
    },
    async listResources(filter) {
      let q = client.from(T.resources).select('*');
      if (filter?.kind) q = q.eq('kind', filter.kind);
      const { data, error } = await q;
      if (error) fail(error, 'listResources');
      return (data ?? []).map(toResource);
    },

    async getSlot(id) {
      const { data, error } = await client.from(T.slots).select('*').eq('id', id).maybeSingle();
      if (error) fail(error, 'getSlot');
      return data ? toSlot(data) : null;
    },
    async saveSlot(s) {
      const { error } = await client.from(T.slots).upsert(
        {
          id: s.id,
          resource_id: s.resourceId,
          starts_at: s.startsAt,
          ends_at: s.endsAt ?? null,
          capacity: s.capacity,
          open: s.open,
        },
        { onConflict: 'id' }
      );
      if (error) fail(error, 'saveSlot');
    },
    async listSlots(filter) {
      let q = client.from(T.slots).select('*');
      if (filter?.resourceId) q = q.eq('resource_id', filter.resourceId);
      const { data, error } = await q;
      if (error) fail(error, 'listSlots');
      return (data ?? []).map(toSlot);
    },

    async getBooking(id) {
      const { data, error } = await client.from(T.bookings).select('*').eq('id', id).maybeSingle();
      if (error) fail(error, 'getBooking');
      return data ? toBooking(data) : null;
    },
    async saveBooking(b) {
      const { error } = await client.from(T.bookings).upsert(
        {
          id: b.id,
          slot_id: b.slotId,
          resource_id: b.resourceId,
          owner_ref: b.ownerRef,
          group_ref: b.groupRef ?? null,
          party_size: b.partySize,
          status: b.status,
          idempotency_key: b.idempotencyKey ?? null,
          hold_expires_at: b.holdExpiresAt ?? null,
          penalty: b.penalty ?? null,
          reason: b.reason ?? null,
          fallback_of: b.fallbackOf ?? null,
          fallback_booking_id: b.fallbackBookingId ?? null,
          meta: b.meta,
          created_at: b.createdAt,
          updated_at: b.updatedAt,
        },
        { onConflict: 'id' }
      );
      if (error) fail(error, 'saveBooking');
    },
    async listBookings(filter?: BookingFilter) {
      let q = client.from(T.bookings).select('*');
      if (filter?.slotId) q = q.eq('slot_id', filter.slotId);
      if (filter?.resourceId) q = q.eq('resource_id', filter.resourceId);
      if (filter?.ownerRef) q = q.eq('owner_ref', filter.ownerRef);
      if (filter?.groupRef) q = q.eq('group_ref', filter.groupRef);
      if (filter?.status) {
        q = Array.isArray(filter.status) ? q.in('status', filter.status) : q.eq('status', filter.status);
      }
      const { data, error } = await q;
      if (error) fail(error, 'listBookings');
      return (data ?? []).map(toBooking);
    },

    async withLock<R>(key: string, fn: () => Promise<R>): Promise<R> {
      const prev = tails.get(key) ?? Promise.resolve();
      const run = prev.then(fn, fn);
      tails.set(key, run.catch(() => undefined));
      return run;
    },
  };
}
