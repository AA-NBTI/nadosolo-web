/**
 * 범용 예약 모듈 코어 계약.
 * 특정 서비스/업종에 종속되지 않는 순수 표준 타입 (외부 import 금지).
 */

/** 업체 상세 프로필 (네이버 스마트플레이스 기준, Resource.attributes.profile에 저장) */
export interface ResourceProfile {
  address: string;
  addressDetail?: string;
  phone: string;
  managerPhone?: string;
  timezone?: string;
  guideNote?: string;
  imageUrl?: string;
}

/** 예약 상품/유닛 (Cal.com EventType + OpenTable Zone/Table 기준) */
export interface BookableUnit {
  id: string;
  name: string;
  minPartySize: number;
  maxPartySize: number;
  quantity: number;
  durationMinutes: number;
  active: boolean;
}

/** 주간 영업 규칙 (0=일 ~ 6=토) */
export interface WeeklyScheduleRule {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  breakStart?: string;
  breakEnd?: string;
  slotIntervalMinutes: number;
  active: boolean;
}

/** 특정일 휴무 또는 단축·연장 영업 오버라이드 */
export interface DateOverride {
  date: string; // 'YYYY-MM-DD'
  closed: boolean;
  customStartTime?: string;
  customEndTime?: string;
  reason?: string;
}

/** 업체 운영 스케줄 */
export interface ScheduleConfig {
  timezoneOffsetMinutes?: number; // 기본 540 (KST +09:00)
  weekly: WeeklyScheduleRule[];
  overrides: DateOverride[];
}

/** 예약자 정보 및 요청사항 (Cal.com Attendee 기준) */
export interface AttendeeInfo {
  name: string;
  phone: string;
  email?: string;
  requests?: string;
}

export interface AvailableWindow {
  unitId: string;
  unitName: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  remainingQuantity: number;
}

export interface GetAvailabilityInput {
  resourceId: string;
  date: string; // 'YYYY-MM-DD'
  partySize: number;
  unitId?: string;
}

export interface BookWindowInput {
  resourceId: string;
  unitId: string;
  startsAt: string; // ISO
  partySize: number;
  ownerRef: string;
  attendee?: AttendeeInfo;
  groupRef?: string;
  idempotencyKey?: string;
  meta?: Record<string, unknown>;
}

/** 예약 대상 (식당, 객실, 룸, 티켓 등). 업종별 정보는 attributes에 담는다. */
export interface Resource {
  id: string;
  kind: string;
  name: string;
  capacity: number;
  active: boolean;
  attributes: Record<string, unknown>;
}

/** 예약 가능한 시간 단위. capacity는 해당 슬롯의 총 좌석(수량). */
export interface Slot {
  id: string;
  resourceId: string;
  startsAt: string; // ISO
  endsAt?: string; // ISO
  capacity: number;
  open: boolean;
}

export type BookingStatus =
  | 'REQUESTED' // 요청됨 (수량 홀드 중, 공급처 응답 대기)
  | 'CONFIRMED' // 공급처 확정
  | 'COMPLETED' // 이용 완료
  | 'DECLINED' // 공급처 거절
  | 'EXPIRED' // 홀드 만료 (미응답)
  | 'CANCELLED' // 취소
  | 'NO_SHOW'; // 노쇼

export type CancelPenalty = 'NONE' | 'LATE';

export interface Booking {
  id: string;
  slotId: string;
  resourceId: string;
  ownerRef: string; // 예약 주체 (회원/모임 식별자 등 외부 참조)
  groupRef?: string; // 묶음 식별자 (테이블 ID 등)
  partySize: number;
  status: BookingStatus;
  idempotencyKey?: string;
  holdExpiresAt?: string;
  penalty?: CancelPenalty;
  reason?: string;
  fallbackOf?: string; // 이 예약이 대체 예약인 경우 원본 ID
  fallbackBookingId?: string; // 이 예약 실패 후 생성된 대체 예약 ID
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationPolicy {
  /** 요청 후 공급처 응답을 기다리는 시간(분). 초과 시 만료. */
  holdMinutes: number;
  /** 이용 시작 N시간 전까지 무료 취소. 이후 취소는 LATE 페널티 플래그. */
  freeCancelHoursBefore: number;
  /** 시작 후 N분이 지나야 노쇼 처리 가능. */
  noShowGraceMinutes: number;
  /** 1건당 최대 인원 (선택). */
  maxPartySize?: number;
}

export type ReservationErrorCode =
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'SLOT_CLOSED'
  | 'SLOT_FULL'
  | 'INVALID_TRANSITION'
  | 'HOLD_EXPIRED'
  | 'TOO_EARLY';

export class ReservationError extends Error {
  constructor(
    public readonly code: ReservationErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ReservationError';
  }
}

export interface Availability {
  slotId: string;
  capacity: number;
  held: number; // REQUESTED 점유
  confirmed: number; // CONFIRMED 점유
  remaining: number;
}

export type ReservationEventType =
  | 'booking.requested'
  | 'booking.confirmed'
  | 'booking.declined'
  | 'booking.expired'
  | 'booking.cancelled'
  | 'booking.completed'
  | 'booking.no_show'
  | 'booking.fallback_requested';

export interface ReservationEvent {
  type: ReservationEventType;
  booking: Booking;
  at: string;
}

export interface BookingFilter {
  slotId?: string;
  resourceId?: string;
  ownerRef?: string;
  groupRef?: string;
  status?: BookingStatus | BookingStatus[];
}

/** 저장소·동시성 제어를 주입하는 드라이버 계약. */
export interface ReservationDriver {
  getResource(id: string): Promise<Resource | null>;
  saveResource(resource: Resource): Promise<void>;
  listResources(filter?: { kind?: string }): Promise<Resource[]>;

  getSlot(id: string): Promise<Slot | null>;
  saveSlot(slot: Slot): Promise<void>;
  listSlots(filter?: { resourceId?: string }): Promise<Slot[]>;

  getBooking(id: string): Promise<Booking | null>;
  saveBooking(booking: Booking): Promise<void>;
  listBookings(filter?: BookingFilter): Promise<Booking[]>;

  /** 같은 key에 대한 작업을 직렬화한다 (초과 예약 방지). */
  withLock<T>(key: string, fn: () => Promise<T>): Promise<T>;
}

export interface SlotSearchQuery {
  kind?: string;
  from?: string;
  to?: string;
  minRemaining?: number;
  excludeSlotIds?: string[];
  predicate?: (slot: Slot, resource: Resource, availability: Availability) => boolean;
}

export interface FallbackContext {
  failed: Booking;
  slot: Slot;
  resource: Resource;
  engine: ReservationEngine;
}

/** 거절/만료된 예약을 대체할 슬롯을 찾는 전략. null이면 대체 없음. */
export type FallbackStrategy = (ctx: FallbackContext) => Promise<{ slotId: string } | null>;

export interface RequestBookingInput {
  slotId: string;
  ownerRef: string;
  partySize: number;
  groupRef?: string;
  idempotencyKey?: string;
  meta?: Record<string, unknown>;
}

export interface ReservationEngineOptions {
  policy: ReservationPolicy;
  driver: ReservationDriver;
  clock?: () => Date;
  idGenerator?: () => string;
  fallback?: FallbackStrategy;
  onEvent?: (event: ReservationEvent) => void | Promise<void>;
}

export interface ReservationEngine {
  readonly policy: ReservationPolicy;

  registerResource(input: Omit<Resource, 'active' | 'attributes'> & Partial<Pick<Resource, 'active' | 'attributes'>>): Promise<Resource>;
  addSlot(input: Omit<Slot, 'open'> & Partial<Pick<Slot, 'open'>>): Promise<Slot>;
  setSlotOpen(slotId: string, open: boolean): Promise<Slot>;

  availability(slotId: string): Promise<Availability>;
  searchSlots(query?: SlotSearchQuery): Promise<Array<{ slot: Slot; resource: Resource; availability: Availability }>>;
  getAvailableWindows(input: GetAvailabilityInput): Promise<AvailableWindow[]>;
  bookWindow(input: BookWindowInput): Promise<Booking>;

  request(input: RequestBookingInput): Promise<Booking>;
  confirm(bookingId: string): Promise<Booking>;
  decline(bookingId: string, reason?: string): Promise<Booking>;
  cancel(bookingId: string, reason?: string): Promise<Booking>;
  complete(bookingId: string): Promise<Booking>;
  markNoShow(bookingId: string): Promise<Booking>;
  expireHolds(): Promise<Booking[]>;

  getBooking(bookingId: string): Promise<Booking | null>;
  listBookings(filter?: BookingFilter): Promise<Booking[]>;
}
