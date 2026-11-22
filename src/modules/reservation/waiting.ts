import type { Resource } from './types';

export type WaitingStatus = 'WAITING' | 'CALLED' | 'SEATED' | 'CANCELLED' | 'NO_SHOW';

export interface WaitingEntry {
  id: string;
  ticketNo: number;
  date: string; // 'YYYY-MM-DD' KST
  name: string;
  phone: string;
  partySize: number;
  status: WaitingStatus;
  createdAt: string;
  calledAt?: string;
  seatedAt?: string;
}

export interface TodayWaitingState {
  date: string;
  waitingOpen: boolean;
  activeList: WaitingEntry[]; // WAITING | CALLED
  allToday: WaitingEntry[];
  waitingCount: number;
  estimatedMinutes: number;
}

export function todayKstDate(nowMs = Date.now()): string {
  return new Date(nowMs + 9 * 3600_000).toISOString().slice(0, 10);
}

export function normalizePhoneDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function getTodayWaitingState(resource: Resource, date = todayKstDate()): TodayWaitingState {
  const waitingOpen = resource.attributes?.waitingOpen !== false;
  const rawList = Array.isArray(resource.attributes?.waitingQueue)
    ? (resource.attributes.waitingQueue as WaitingEntry[])
    : [];

  const allToday = rawList
    .filter((w) => w.date === date)
    .sort((a, b) => a.ticketNo - b.ticketNo);

  const activeList = allToday.filter((w) => w.status === 'WAITING' || w.status === 'CALLED');

  return {
    date,
    waitingOpen,
    activeList,
    allToday,
    waitingCount: activeList.length,
    estimatedMinutes: activeList.length * 10,
  };
}

export function enqueueWaiting(
  resource: Resource,
  input: { name: string; phone: string; partySize: number },
  date = todayKstDate(),
  nowIso = new Date().toISOString()
): { resource: Resource; entry: WaitingEntry; aheadCount: number } {
  if (resource.attributes?.waitingOpen === false) {
    throw new Error('현재 원격 줄서기가 마감되었습니다.');
  }

  const name = input.name.trim();
  const phone = input.phone.trim();
  const digits = normalizePhoneDigits(phone);
  const partySize = Math.max(1, Math.floor(input.partySize || 1));

  if (!name || digits.length < 8) {
    throw new Error('성함과 올바른 연락처를 입력해 주세요.');
  }

  const state = getTodayWaitingState(resource, date);
  const dup = state.activeList.find((w) => normalizePhoneDigits(w.phone) === digits);
  if (dup) {
    throw new Error(`이미 대기 등록되어 있습니다. (대기번호 #${dup.ticketNo})`);
  }

  const maxNo = state.allToday.reduce((m, w) => Math.max(m, w.ticketNo), 0);
  const entry: WaitingEntry = {
    id: `wt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    ticketNo: maxNo + 1,
    date,
    name,
    phone,
    partySize,
    status: 'WAITING',
    createdAt: nowIso,
  };

  // 이전 날짜 대기 이력은 30개 이내 최신만 유지해 attributes 비대화 방지
  const prevOtherDays = (Array.isArray(resource.attributes?.waitingQueue)
    ? (resource.attributes.waitingQueue as WaitingEntry[])
    : []
  )
    .filter((w) => w.date !== date)
    .slice(-30);

  const nextResource: Resource = {
    ...resource,
    attributes: {
      ...resource.attributes,
      waitingQueue: [...prevOtherDays, ...state.allToday, entry],
    },
  };

  return {
    resource: nextResource,
    entry,
    aheadCount: state.activeList.length,
  };
}

export function updateWaitingStatus(
  resource: Resource,
  waitingId: string,
  nextStatus: WaitingStatus,
  nowIso = new Date().toISOString()
): { resource: Resource; entry: WaitingEntry } {
  const rawList = Array.isArray(resource.attributes?.waitingQueue)
    ? (resource.attributes.waitingQueue as WaitingEntry[])
    : [];

  let updated: WaitingEntry | null = null;
  const nextQueue = rawList.map((w) => {
    if (w.id !== waitingId) return w;
    updated = {
      ...w,
      status: nextStatus,
      ...(nextStatus === 'CALLED' ? { calledAt: nowIso } : {}),
      ...(nextStatus === 'SEATED' ? { seatedAt: nowIso } : {}),
    };
    return updated;
  });

  if (!updated) {
    throw new Error('대기 내역을 찾을 수 없습니다.');
  }

  return {
    resource: {
      ...resource,
      attributes: {
        ...resource.attributes,
        waitingQueue: nextQueue,
      },
    },
    entry: updated,
  };
}

export function findWaitingByPhone(
  resource: Resource,
  phone: string,
  date = todayKstDate()
): { entry: WaitingEntry; aheadCount: number } | null {
  const digits = normalizePhoneDigits(phone);
  if (digits.length < 8) return null;
  const state = getTodayWaitingState(resource, date);
  const idx = state.activeList.findIndex((w) => normalizePhoneDigits(w.phone) === digits);
  if (idx === -1) return null;
  return {
    entry: state.activeList[idx],
    aheadCount: idx,
  };
}
