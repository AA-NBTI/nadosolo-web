import type {
  AvailableWindow,
  BookableUnit,
  Booking,
  GetAvailabilityInput,
  Resource,
  ScheduleConfig,
  WeeklyScheduleRule,
} from './types';

function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** 'YYYY-MM-DD'와 오프셋 분을 받아 해당 날짜 00:00(로컬)의 UTC epoch(ms) 및 요일(0..6)을 반환 */
function dateAnchor(dateStr: string, offsetMin: number): { dayStartUtcMs: number; dayOfWeek: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
  const dayStartUtcMs = utcMidnight - offsetMin * 60_000;
  const dayOfWeek = new Date(utcMidnight).getUTCDay();
  return { dayStartUtcMs, dayOfWeek };
}

export function extractUnits(resource: Resource): BookableUnit[] {
  const raw = resource.attributes?.units;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw as BookableUnit[];
  }
  return [
    {
      id: 'default',
      name: resource.name,
      minPartySize: 1,
      maxPartySize: resource.capacity,
      quantity: 1,
      durationMinutes: 120,
      active: true,
    },
  ];
}

export function extractSchedule(resource: Resource): ScheduleConfig | null {
  const raw = resource.attributes?.schedule;
  if (!raw || typeof raw !== 'object') return null;
  return raw as ScheduleConfig;
}

/**
 * Cal.com + OpenTable 동적 가용성 계산기:
 * (주간 영업 스케줄) - (특정일 휴무/단축) - (브레이크타임) - (겹치는 유효 예약)
 */
export function computeAvailableWindows(
  resource: Resource,
  bookings: Booking[],
  input: GetAvailabilityInput,
  nowMs: number
): AvailableWindow[] {
  if (!resource.active) return [];
  const schedule = extractSchedule(resource);
  if (!schedule) return [];

  const offsetMin = schedule.timezoneOffsetMinutes ?? 540; // 기본 KST (+09:00)
  const { dayStartUtcMs, dayOfWeek } = dateAnchor(input.date, offsetMin);

  const override = schedule.overrides?.find((o) => o.date === input.date);
  if (override?.closed) return [];

  const rule: WeeklyScheduleRule | undefined = schedule.weekly?.find(
    (w) => w.dayOfWeek === dayOfWeek && w.active
  );
  if (!rule && (!override || !override.customStartTime || !override.customEndTime)) {
    return [];
  }

  const startMin = parseHHMM(override?.customStartTime || rule!.startTime);
  const endMin = parseHHMM(override?.customEndTime || rule!.endTime);
  const interval = Math.max(15, rule?.slotIntervalMinutes || 30);
  const breakStartMin = rule?.breakStart ? parseHHMM(rule.breakStart) : null;
  const breakEndMin = rule?.breakEnd ? parseHHMM(rule.breakEnd) : null;

  const units = extractUnits(resource).filter(
    (u) =>
      u.active &&
      (!input.unitId || u.id === input.unitId) &&
      input.partySize >= u.minPartySize &&
      input.partySize <= u.maxPartySize
  );
  if (units.length === 0) return [];

  // 현재 점유 중인 유효 예약만 필터링
  const activeBookings = bookings.filter((b) => {
    if (b.status === 'CONFIRMED') return true;
    if (b.status === 'REQUESTED') {
      return !b.holdExpiresAt || Date.parse(b.holdExpiresAt) > nowMs;
    }
    return false;
  });

  // 1초 홀 테이블 보드(현장 착석) 상태 추출
  const tableBoard = (resource.attributes?.tableBoard as Record<string, { occupied?: boolean; seatedAt?: string }> | undefined) || {};

  const out: AvailableWindow[] = [];

  for (const unit of units) {
    // 해당 유닛의 현재 착석(식사중) 테이블 시간 구간 목록
    const occupiedIntervals: Array<{ startMs: number; endMs: number }> = [];
    for (let i = 1; i <= Math.max(1, unit.quantity); i += 1) {
      const cell = tableBoard[`${unit.id}#${i}`];
      if (!cell?.occupied) continue;
      const seatedMs = cell.seatedAt ? Date.parse(cell.seatedAt) : nowMs;
      const occStartMs = Number.isFinite(seatedMs) ? seatedMs : nowMs;
      const occEndMs = occStartMs + unit.durationMinutes * 60_000;
      if (occEndMs > nowMs) {
        occupiedIntervals.push({ startMs: occStartMs, endMs: occEndMs });
      }
    }

    for (let cursor = startMin; cursor + unit.durationMinutes <= endMin; cursor += interval) {
      const winEndMin = cursor + unit.durationMinutes;

      // 브레이크타임 겹침 제외
      if (breakStartMin !== null && breakEndMin !== null) {
        if (cursor < breakEndMin && winEndMin > breakStartMin) continue;
      }

      const startsAtMs = dayStartUtcMs + cursor * 60_000;
      const endsAtMs = dayStartUtcMs + winEndMin * 60_000;
      if (startsAtMs <= nowMs) continue;

      // 해당 시간대와 겹치는 동일 유닛 예약 수(또는 인원) 차감
      let usedQty = 0;
      for (const b of activeBookings) {
        const bUnitId = (b.meta?.unitId as string) || 'default';
        if (bUnitId !== unit.id) continue;

        const bStartMs = b.meta?.startsAt ? Date.parse(String(b.meta.startsAt)) : Date.parse(b.createdAt);
        const bDuration = Number(b.meta?.durationMinutes) || unit.durationMinutes;
        const bEndMs = b.meta?.endsAt ? Date.parse(String(b.meta.endsAt)) : bStartMs + bDuration * 60_000;

        if (bStartMs < endsAtMs && bEndMs > startsAtMs) {
          usedQty += Number(b.meta?.unitCount) || 1;
        }
      }

      // 홀 테이블 보드 현장 착석 수 차감
      for (const occ of occupiedIntervals) {
        if (occ.startMs < endsAtMs && occ.endMs > startsAtMs) {
          usedQty += 1;
        }
      }

      const remainingQuantity = Math.max(0, unit.quantity - usedQty);
      if (remainingQuantity > 0) {
        out.push({
          unitId: unit.id,
          unitName: unit.name,
          startsAt: new Date(startsAtMs).toISOString(),
          endsAt: new Date(endsAtMs).toISOString(),
          remainingQuantity,
        });
      }
    }
  }

  return out.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}
