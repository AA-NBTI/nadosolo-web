import type {
  Booking,
  BookingFilter,
  ReservationDriver,
  Resource,
  Slot,
} from '../types';

/** 테스트·개발용 인메모리 드라이버. 키별 프로미스 체인으로 직렬화한다. */
export function createMemoryDriver(): ReservationDriver {
  const resources = new Map<string, Resource>();
  const slots = new Map<string, Slot>();
  const bookings = new Map<string, Booking>();
  const tails = new Map<string, Promise<unknown>>();

  const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

  return {
    async getResource(id) {
      const r = resources.get(id);
      return r ? clone(r) : null;
    },
    async saveResource(resource) {
      resources.set(resource.id, clone(resource));
    },
    async listResources(filter) {
      return [...resources.values()]
        .filter((r) => !filter?.kind || r.kind === filter.kind)
        .map(clone);
    },

    async getSlot(id) {
      const s = slots.get(id);
      return s ? clone(s) : null;
    },
    async saveSlot(slot) {
      slots.set(slot.id, clone(slot));
    },
    async listSlots(filter) {
      return [...slots.values()]
        .filter((s) => !filter?.resourceId || s.resourceId === filter.resourceId)
        .map(clone);
    },

    async getBooking(id) {
      const b = bookings.get(id);
      return b ? clone(b) : null;
    },
    async saveBooking(booking) {
      bookings.set(booking.id, clone(booking));
    },
    async listBookings(filter?: BookingFilter) {
      const statuses = filter?.status
        ? Array.isArray(filter.status)
          ? filter.status
          : [filter.status]
        : null;
      return [...bookings.values()]
        .filter((b) => !filter?.slotId || b.slotId === filter.slotId)
        .filter((b) => !filter?.resourceId || b.resourceId === filter.resourceId)
        .filter((b) => !filter?.ownerRef || b.ownerRef === filter.ownerRef)
        .filter((b) => !filter?.groupRef || b.groupRef === filter.groupRef)
        .filter((b) => !statuses || statuses.includes(b.status))
        .map(clone);
    },

    async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
      const prev = tails.get(key) ?? Promise.resolve();
      const run = prev.then(fn, fn);
      tails.set(
        key,
        run.catch(() => undefined)
      );
      return run;
    },
  };
}
