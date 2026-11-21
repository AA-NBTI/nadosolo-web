import {
  Availability,
  Booking,
  BookingFilter,
  BookingStatus,
  BookWindowInput,
  GetAvailabilityInput,
  ReservationEngine,
  ReservationEngineOptions,
  ReservationError,
  ReservationEvent,
  ReservationEventType,
  RequestBookingInput,
  Resource,
  Slot,
  SlotSearchQuery,
} from './types';
import { computeAvailableWindows, extractSchedule, extractUnits } from './availability';

const HOLDING: BookingStatus[] = ['REQUESTED'];
const OCCUPYING: BookingStatus[] = ['REQUESTED', 'CONFIRMED'];

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  REQUESTED: ['CONFIRMED', 'DECLINED', 'EXPIRED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'NO_SHOW', 'CANCELLED'],
  COMPLETED: [],
  DECLINED: [],
  EXPIRED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

let seq = 0;
const defaultId = () => `rsv_${Date.now().toString(36)}_${(seq++).toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

/** 범용 예약 엔진 팩토리. 저장·시계·알림·폴백은 모두 주입받는다. */
export function createReservationEngine(options: ReservationEngineOptions): ReservationEngine {
  const { policy, driver } = options;
  const now = () => (options.clock ? options.clock() : new Date());
  const nextId = options.idGenerator ?? defaultId;
  const slotLock = (slotId: string) => `slot:${slotId}`;

  async function emit(type: ReservationEventType, booking: Booking) {
    if (!options.onEvent) return;
    const event: ReservationEvent = { type, booking, at: now().toISOString() };
    await options.onEvent(event);
  }

  function assertTransition(b: Booking, to: BookingStatus) {
    if (!TRANSITIONS[b.status].includes(to)) {
      throw new ReservationError(
        'INVALID_TRANSITION',
        `${b.status} → ${to} 전이는 허용되지 않습니다 (${b.id})`
      );
    }
  }

  async function mustBooking(id: string): Promise<Booking> {
    const b = await driver.getBooking(id);
    if (!b) throw new ReservationError('NOT_FOUND', `예약을 찾을 수 없습니다: ${id}`);
    return b;
  }

  async function mustSlot(id: string): Promise<Slot> {
    const s = await driver.getSlot(id);
    if (!s) throw new ReservationError('NOT_FOUND', `슬롯을 찾을 수 없습니다: ${id}`);
    return s;
  }

  function isHoldExpired(b: Booking): boolean {
    return (
      b.status === 'REQUESTED' &&
      !!b.holdExpiresAt &&
      Date.parse(b.holdExpiresAt) <= now().getTime()
    );
  }

  /** 슬롯 점유량 계산. 만료된 홀드는 점유로 보지 않는다. */
  async function computeAvailability(slot: Slot): Promise<Availability> {
    const list = await driver.listBookings({ slotId: slot.id, status: OCCUPYING });
    let held = 0;
    let confirmed = 0;
    for (const b of list) {
      if (b.status === 'CONFIRMED') confirmed += b.partySize;
      else if (HOLDING.includes(b.status) && !isHoldExpired(b)) held += b.partySize;
    }
    return {
      slotId: slot.id,
      capacity: slot.capacity,
      held,
      confirmed,
      remaining: Math.max(0, slot.capacity - held - confirmed),
    };
  }

  async function transition(
    bookingId: string,
    to: BookingStatus,
    patch: (b: Booking) => void,
    guard?: (b: Booking, slot: Slot) => void
  ): Promise<Booking> {
    const first = await mustBooking(bookingId);
    return driver.withLock(slotLock(first.slotId), async () => {
      const b = await mustBooking(bookingId);
      const slot = await mustSlot(b.slotId);
      assertTransition(b, to);
      guard?.(b, slot);
      b.status = to;
      patch(b);
      b.updatedAt = now().toISOString();
      await driver.saveBooking(b);
      return b;
    });
  }

  /** 거절/만료 후 대체 예약 시도. 락 밖에서 실행한다. */
  async function tryFallback(failed: Booking): Promise<void> {
    if (!options.fallback) return;
    const slot = await driver.getSlot(failed.slotId);
    const resource = slot ? await driver.getResource(slot.resourceId) : null;
    if (!slot || !resource) return;
    const pick = await options.fallback({ failed, slot, resource, engine });
    if (!pick) return;
    try {
      const replacement = await engine.request({
        slotId: pick.slotId,
        ownerRef: failed.ownerRef,
        partySize: failed.partySize,
        groupRef: failed.groupRef,
        meta: { ...failed.meta, fallbackOf: failed.id },
      });
      replacement.fallbackOf = failed.id;
      await driver.saveBooking(replacement);
      const original = await mustBooking(failed.id);
      original.fallbackBookingId = replacement.id;
      await driver.saveBooking(original);
      await emit('booking.fallback_requested', replacement);
    } catch (e) {
      if (!(e instanceof ReservationError)) throw e;
      // 대체 슬롯이 그 사이 찼다면 대체 없음으로 종료
    }
  }

  const engine: ReservationEngine = {
    policy,

    async registerResource(input) {
      if (!input.id || input.capacity < 1) {
        throw new ReservationError('INVALID_INPUT', '자원 ID와 1 이상의 수용량이 필요합니다.');
      }
      const resource: Resource = {
        active: true,
        attributes: {},
        ...input,
      };
      await driver.saveResource(resource);
      return resource;
    },

    async addSlot(input) {
      if (!input.id || input.capacity < 1 || Number.isNaN(Date.parse(input.startsAt))) {
        throw new ReservationError('INVALID_INPUT', '슬롯 ID, 수용량, 시작 시각이 올바르지 않습니다.');
      }
      const resource = await driver.getResource(input.resourceId);
      if (!resource) throw new ReservationError('NOT_FOUND', `자원을 찾을 수 없습니다: ${input.resourceId}`);
      const slot: Slot = { open: true, ...input };
      await driver.saveSlot(slot);
      return slot;
    },

    async setSlotOpen(slotId, open) {
      return driver.withLock(slotLock(slotId), async () => {
        const slot = await mustSlot(slotId);
        slot.open = open;
        await driver.saveSlot(slot);
        return slot;
      });
    },

    async availability(slotId) {
      return computeAvailability(await mustSlot(slotId));
    },

    async searchSlots(query: SlotSearchQuery = {}) {
      const resources = await driver.listResources(query.kind ? { kind: query.kind } : undefined);
      const out: Array<{ slot: Slot; resource: Resource; availability: Availability }> = [];
      const from = query.from ? Date.parse(query.from) : -Infinity;
      const to = query.to ? Date.parse(query.to) : Infinity;
      const nowMs = now().getTime();
      for (const resource of resources) {
        if (!resource.active) continue;
        const slots = await driver.listSlots({ resourceId: resource.id });
        for (const slot of slots) {
          const start = Date.parse(slot.startsAt);
          if (!slot.open || start <= nowMs || start < from || start > to) continue;
          if (query.excludeSlotIds?.includes(slot.id)) continue;
          const availability = await computeAvailability(slot);
          if (availability.remaining < (query.minRemaining ?? 1)) continue;
          if (query.predicate && !query.predicate(slot, resource, availability)) continue;
          out.push({ slot, resource, availability });
        }
      }
      return out.sort((a, b) => Date.parse(a.slot.startsAt) - Date.parse(b.slot.startsAt));
    },

    async getAvailableWindows(input: GetAvailabilityInput) {
      const resource = await driver.getResource(input.resourceId);
      if (!resource) throw new ReservationError('NOT_FOUND', `자원을 찾을 수 없습니다: ${input.resourceId}`);
      const bookings = await driver.listBookings({ resourceId: input.resourceId });
      return computeAvailableWindows(resource, bookings, input, now().getTime());
    },

    async bookWindow(input: BookWindowInput) {
      if (!input.ownerRef || !Number.isInteger(input.partySize) || input.partySize < 1) {
        throw new ReservationError('INVALID_INPUT', '예약 주체와 1 이상의 정수 인원이 필요합니다.');
      }
      const startMs = Date.parse(input.startsAt);
      if (Number.isNaN(startMs)) {
        throw new ReservationError('INVALID_INPUT', '시작 시각이 올바르지 않습니다.');
      }
      const schedule = await driver.getResource(input.resourceId).then((r) => (r ? extractSchedule(r) : null));
      const offsetMin = schedule?.timezoneOffsetMinutes ?? 540;
      const localDate = new Date(startMs + offsetMin * 60_000).toISOString().slice(0, 10);

      const created = await driver.withLock(`resource:${input.resourceId}`, async () => {
        const resource = await driver.getResource(input.resourceId);
        if (!resource || !resource.active) {
          throw new ReservationError('SLOT_CLOSED', '비활성화된 업체입니다.');
        }
        const unit = extractUnits(resource).find((u) => u.id === input.unitId && u.active);
        if (!unit) {
          throw new ReservationError('NOT_FOUND', `예약 단위를 찾을 수 없습니다: ${input.unitId}`);
        }
        if (input.partySize < unit.minPartySize || input.partySize > unit.maxPartySize) {
          throw new ReservationError(
            'INVALID_INPUT',
            `${unit.name} 인원은 ${unit.minPartySize}~${unit.maxPartySize}명입니다.`
          );
        }

        const bookings = await driver.listBookings({ resourceId: input.resourceId });
        if (input.idempotencyKey) {
          const dup = bookings.find((b) => b.idempotencyKey === input.idempotencyKey);
          if (dup) return { value: dup, created: false };
        }

        const windows = computeAvailableWindows(
          resource,
          bookings,
          { resourceId: input.resourceId, date: localDate, partySize: input.partySize, unitId: unit.id },
          now().getTime()
        );
        const match = windows.find((w) => Date.parse(w.startsAt) === startMs);
        if (!match || match.remainingQuantity < 1) {
          throw new ReservationError('SLOT_FULL', '선택한 시간대의 잔여 수량이 없습니다.');
        }

        const slotId = `${input.resourceId}:${unit.id}:${match.startsAt}`;
        const existingSlot = await driver.getSlot(slotId);
        if (!existingSlot) {
          await driver.saveSlot({
            id: slotId,
            resourceId: input.resourceId,
            startsAt: match.startsAt,
            endsAt: match.endsAt,
            capacity: unit.quantity * unit.maxPartySize,
            open: true,
          });
        }

        const ts = now();
        const b: Booking = {
          id: nextId(),
          slotId,
          resourceId: input.resourceId,
          ownerRef: input.ownerRef,
          groupRef: input.groupRef,
          partySize: input.partySize,
          status: 'REQUESTED',
          idempotencyKey: input.idempotencyKey,
          holdExpiresAt: new Date(ts.getTime() + policy.holdMinutes * 60_000).toISOString(),
          meta: {
            ...(input.meta ?? {}),
            unitId: unit.id,
            unitName: unit.name,
            startsAt: match.startsAt,
            endsAt: match.endsAt,
            durationMinutes: unit.durationMinutes,
            unitCount: 1,
            ...(input.attendee ? { attendee: input.attendee } : {}),
          },
          createdAt: ts.toISOString(),
          updatedAt: ts.toISOString(),
        };
        await driver.saveBooking(b);
        return { value: b, created: true };
      });

      if (created.created) await emit('booking.requested', created.value);
      return created.value;
    },

    async request(input: RequestBookingInput) {
      if (!input.ownerRef || !Number.isInteger(input.partySize) || input.partySize < 1) {
        throw new ReservationError('INVALID_INPUT', '예약 주체와 1 이상의 정수 인원이 필요합니다.');
      }
      if (policy.maxPartySize && input.partySize > policy.maxPartySize) {
        throw new ReservationError('INVALID_INPUT', `1건당 최대 ${policy.maxPartySize}명까지 예약할 수 있습니다.`);
      }
      const booking = await driver.withLock(slotLock(input.slotId), async () => {
        const slot = await mustSlot(input.slotId);

        if (input.idempotencyKey) {
          const dup = (await driver.listBookings({ slotId: slot.id })).find(
            (b) => b.idempotencyKey === input.idempotencyKey
          );
          if (dup) return { value: dup, created: false };
        }

        const resource = await driver.getResource(slot.resourceId);
        if (!slot.open || !resource?.active || Date.parse(slot.startsAt) <= now().getTime()) {
          throw new ReservationError('SLOT_CLOSED', '예약할 수 없는 슬롯입니다.');
        }
        const avail = await computeAvailability(slot);
        if (avail.remaining < input.partySize) {
          throw new ReservationError('SLOT_FULL', `잔여 ${avail.remaining}석으로 ${input.partySize}명 예약이 불가합니다.`);
        }

        const ts = now();
        const created: Booking = {
          id: nextId(),
          slotId: slot.id,
          resourceId: slot.resourceId,
          ownerRef: input.ownerRef,
          groupRef: input.groupRef,
          partySize: input.partySize,
          status: 'REQUESTED',
          idempotencyKey: input.idempotencyKey,
          holdExpiresAt: new Date(ts.getTime() + policy.holdMinutes * 60_000).toISOString(),
          meta: input.meta ?? {},
          createdAt: ts.toISOString(),
          updatedAt: ts.toISOString(),
        };
        await driver.saveBooking(created);
        return { value: created, created: true };
      });
      if (booking.created) await emit('booking.requested', booking.value);
      return booking.value;
    },

    async confirm(bookingId) {
      const first = await mustBooking(bookingId);
      const result = await driver.withLock(slotLock(first.slotId), async () => {
        const b = await mustBooking(bookingId);
        if (isHoldExpired(b)) {
          b.status = 'EXPIRED';
          b.updatedAt = now().toISOString();
          await driver.saveBooking(b);
          return { expired: b };
        }
        assertTransition(b, 'CONFIRMED');
        b.status = 'CONFIRMED';
        b.holdExpiresAt = undefined;
        b.updatedAt = now().toISOString();
        await driver.saveBooking(b);
        return { confirmed: b };
      });
      if (result.expired) {
        await emit('booking.expired', result.expired);
        await tryFallback(result.expired);
        throw new ReservationError('HOLD_EXPIRED', `홀드가 만료되어 확정할 수 없습니다 (${bookingId})`);
      }
      await emit('booking.confirmed', result.confirmed!);
      return result.confirmed!;
    },

    async decline(bookingId, reason) {
      const b = await transition(bookingId, 'DECLINED', (x) => {
        x.reason = reason;
        x.holdExpiresAt = undefined;
      });
      await emit('booking.declined', b);
      await tryFallback(b);
      return b;
    },

    async cancel(bookingId, reason) {
      const b = await transition(
        bookingId,
        'CANCELLED',
        (x) => {
          x.reason = reason;
          x.holdExpiresAt = undefined;
        },
        (x, slot) => {
          const hoursLeft = (Date.parse(slot.startsAt) - now().getTime()) / 3_600_000;
          x.penalty =
            x.status === 'CONFIRMED' && hoursLeft < policy.freeCancelHoursBefore ? 'LATE' : 'NONE';
        }
      );
      await emit('booking.cancelled', b);
      return b;
    },

    async complete(bookingId) {
      const b = await transition(
        bookingId,
        'COMPLETED',
        () => undefined,
        (_x, slot) => {
          if (Date.parse(slot.startsAt) > now().getTime()) {
            throw new ReservationError('TOO_EARLY', '이용 시작 전에는 완료 처리할 수 없습니다.');
          }
        }
      );
      await emit('booking.completed', b);
      return b;
    },

    async markNoShow(bookingId) {
      const b = await transition(
        bookingId,
        'NO_SHOW',
        () => undefined,
        (_x, slot) => {
          const allowedAt = Date.parse(slot.startsAt) + policy.noShowGraceMinutes * 60_000;
          if (now().getTime() < allowedAt) {
            throw new ReservationError('TOO_EARLY', '노쇼 유예 시간이 지나기 전에는 처리할 수 없습니다.');
          }
        }
      );
      await emit('booking.no_show', b);
      return b;
    },

    async expireHolds() {
      const pending = await driver.listBookings({ status: 'REQUESTED' });
      const expired: Booking[] = [];
      for (const p of pending) {
        if (!isHoldExpired(p)) continue;
        const done = await driver.withLock(slotLock(p.slotId), async () => {
          const b = await mustBooking(p.id);
          if (!isHoldExpired(b)) return null;
          b.status = 'EXPIRED';
          b.updatedAt = now().toISOString();
          await driver.saveBooking(b);
          return b;
        });
        if (!done) continue;
        expired.push(done);
        await emit('booking.expired', done);
        await tryFallback(done);
      }
      return expired;
    },

    getBooking: (id) => driver.getBooking(id),
    listBookings: (filter?: BookingFilter) => driver.listBookings(filter),
  };

  return engine;
}
