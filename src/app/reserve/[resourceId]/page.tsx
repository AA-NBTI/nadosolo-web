'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, Clock, MapPin, Phone, Users, CheckCircle2, RefreshCw } from 'lucide-react';

interface PublicResource {
  id: string;
  kind: string;
  name: string;
  address: string;
  addressDetail: string;
  phone: string;
  guideNote: string;
  coverImageUrl?: string;
  signatureMenu?: string;
  priceRange?: string;
  tags?: string[];
  units?: Array<{ minPartySize: number; maxPartySize: number; active: boolean }>;
  schedule?: {
    weekly?: Array<{
      dayOfWeek: number;
      active: boolean;
      startTime: string;
      endTime: string;
      slotIntervalMinutes?: number;
      breakStart?: string;
      breakEnd?: string;
    }>;
    overrides?: Array<{
      date: string;
      closed?: boolean;
      customStartTime?: string;
      customEndTime?: string;
    }>;
    timezoneOffsetMinutes?: number;
  };
}

interface AvailableWindow {
  unitId: string;
  unitName: string;
  startsAt: string;
  endsAt: string;
  remainingQuantity: number;
}

interface WaitingTicket {
  id: string;
  ticketNo: number;
  name: string;
  phone: string;
  partySize: number;
  status: string;
}

const KIND_LABEL: Record<string, string> = {
  restaurant: '다이닝',
  lodging: '숙박',
  space: '공간',
  etc: '예약',
};

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

function checkDateSchedule(resource: PublicResource | null, dateStr: string): { isOpen: boolean; reason?: string } {
  if (!resource?.schedule) return { isOpen: true };
  const override = resource.schedule.overrides?.find((o) => o.date === dateStr);
  if (override?.closed) return { isOpen: false, reason: '해당 날짜는 매장 특별 휴무일입니다.' };

  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)).getUTCDay();
  const rule = resource.schedule.weekly?.find((w) => w.dayOfWeek === dayOfWeek && w.active);
  if (!rule && (!override || !override.customStartTime)) {
    const activeDays = (resource.schedule.weekly || []).filter((w) => w.active);
    const openDays = activeDays.map((w) => DAY_KO[w.dayOfWeek]).join(', ');
    return {
      isOpen: false,
      reason: openDays ? `선택하신 날짜(${DAY_KO[dayOfWeek]}요일)는 매장 정기 휴무일입니다. (영업 요일: ${openDays})` : '현재 영업일이 설정되지 않았습니다.',
    };
  }
  return { isOpen: true };
}

function getNextOpenDate(resource: PublicResource, fromDateStr: string): string | null {
  const baseMs = Date.parse(`${fromDateStr}T00:00:00Z`);
  for (let i = 1; i <= 14; i++) {
    const d = new Date(baseMs + i * 86400_000);
    const dateStr = d.toISOString().slice(0, 10);
    const check = checkDateSchedule(resource, dateStr);
    if (check.isOpen) return dateStr;
  }
  return null;
}

function todayKst(): string {
  const kst = new Date(Date.now() + 9 * 3600_000);
  return kst.toISOString().slice(0, 10);
}

function fmtTimeKst(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function PublicReservePage() {
  const params = useParams<{ resourceId: string }>();
  const resourceId = decodeURIComponent(params.resourceId || '');

  const [mode, setMode] = useState<'BOOK' | 'WAIT'>('BOOK');
  const [resource, setResource] = useState<PublicResource | null>(null);
  const [windows, setWindows] = useState<AvailableWindow[]>([]);
  const [date, setDate] = useState<string>(todayKst);
  const [partySize, setPartySize] = useState<number>(2);
  const [selected, setSelected] = useState<AvailableWindow | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [requests, setRequests] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const initialAdjusted = useRef(false);

  // 웨이팅(줄서기) 상태
  const [waitingOpen, setWaitingOpen] = useState(true);
  const [waitingCount, setWaitingCount] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [waitName, setWaitName] = useState('');
  const [waitPhone, setWaitPhone] = useState('');
  const [waitPartySize, setWaitPartySize] = useState(2);
  const [myTicket, setMyTicket] = useState<{ entry: WaitingTicket; aheadCount: number } | null>(null);
  const [waitBusy, setWaitBusy] = useState(false);
  const [waitError, setWaitError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    if (!resourceId) return;
    setLoading(true);
    setErrorMsg(null);
    setSelected(null);
    try {
      const res = await fetch(
        `/api/reservations/public?resourceId=${encodeURIComponent(resourceId)}&date=${encodeURIComponent(date)}&partySize=${partySize}`
      );
      const data = await res.json();
      if (!data.ok) {
        setErrorMsg(data.error || '예약 정보를 불러올 수 없습니다.');
        setResource(null);
        setWindows([]);
      } else {
        setResource(data.resource);
        setWindows(Array.isArray(data.windows) ? data.windows : []);
        if (!initialAdjusted.current && data.resource?.schedule) {
          initialAdjusted.current = true;
          const check = checkDateSchedule(data.resource, date);
          if (!check.isOpen) {
            const nextOpen = getNextOpenDate(data.resource, date);
            if (nextOpen) setDate(nextOpen);
          }
        }
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [resourceId, date, partySize]);

  const fetchWaiting = useCallback(
    async (targetPhone?: string) => {
      if (!resourceId) return;
      try {
        const q = targetPhone ? `&phone=${encodeURIComponent(targetPhone)}` : '';
        const res = await fetch(`/api/reservations/waiting?resourceId=${encodeURIComponent(resourceId)}${q}`);
        const data = await res.json();
        if (data.ok) {
          setWaitingOpen(data.waitingOpen !== false);
          setWaitingCount(Number(data.waitingCount) || 0);
          setEstimatedMinutes(Number(data.estimatedMinutes) || 0);
          if (targetPhone) {
            setMyTicket(data.mine || null);
          }
        }
      } catch {}
    },
    [resourceId]
  );

  useEffect(() => {
    void fetchAvailability();
    void fetchWaiting();
  }, [fetchAvailability, fetchWaiting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      setErrorMsg('예약 시간을 선택해 주세요.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/reservations/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId,
          unitId: selected.unitId,
          startsAt: selected.startsAt,
          partySize,
          name: name.trim(),
          phone: phone.trim(),
          requests: requests.trim(),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErrorMsg(data.error || '예약 접수에 실패했습니다.');
      } else {
        setConfirmedId(data.booking?.id || 'RESERVED');
      }
    } catch {
      setErrorMsg('예약 요청 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinWaiting = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitError(null);
    setWaitBusy(true);
    try {
      const res = await fetch('/api/reservations/waiting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId,
          action: 'JOIN',
          name: waitName.trim(),
          phone: waitPhone.trim(),
          partySize: waitPartySize,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setWaitError(data.error || '줄서기 등록에 실패했습니다.');
        if (waitPhone.trim()) {
          await fetchWaiting(waitPhone.trim());
        }
      } else {
        setMyTicket({ entry: data.entry, aheadCount: data.aheadCount ?? 0 });
        await fetchWaiting(waitPhone.trim());
      }
    } catch {
      setWaitError('줄서기 요청 중 오류가 발생했습니다.');
    } finally {
      setWaitBusy(false);
    }
  };

  const handleCancelWaiting = async () => {
    if (!myTicket) return;
    setWaitBusy(true);
    setWaitError(null);
    try {
      const res = await fetch('/api/reservations/waiting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId,
          action: 'CANCEL',
          waitingId: myTicket.entry.id,
          phone: myTicket.entry.phone,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setWaitError(data.error || '대기 취소에 실패했습니다.');
      } else {
        setMyTicket(null);
        await fetchWaiting();
      }
    } catch {
      setWaitError('대기 취소 중 오류가 발생했습니다.');
    } finally {
      setWaitBusy(false);
    }
  };

  if (confirmedId && resource) {
    return (
      <main className="min-h-screen bg-[#07080a] text-zinc-100 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md border border-white/15 bg-[#0c0d12] p-8 space-y-5 text-center">
          <CheckCircle2 className="w-10 h-10 text-[#3b82f6] mx-auto" />
          <h1 className="font-serif-editorial text-2xl text-white font-normal">예약 접수 완료</h1>
          <div className="text-sm font-mono text-zinc-300 space-y-1.5 border-y border-white/10 py-4 text-left">
            <div>매장: {resource.name}</div>
            <div>일시: {date} {selected ? fmtTimeKst(selected.startsAt) : ''}</div>
            <div>인원: {partySize}명 ({selected?.unitName})</div>
            <div>예약번호: {confirmedId}</div>
          </div>
          <p className="text-sm text-zinc-400">매장 확인 후 예약이 최종 확정됩니다.</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/reserve/my?phone=${encodeURIComponent(phone)}`}
              className="py-3 border border-[#3b82f6]/60 bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 text-sm font-mono text-white text-center font-medium"
            >
              예약확인
            </Link>
            <button
              type="button"
              onClick={() => {
                setConfirmedId(null);
                void fetchAvailability();
              }}
              className="py-3 border border-white/25 bg-white/10 hover:bg-white/20 text-sm font-mono text-white cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07080a] text-zinc-100 py-10 px-5 sm:px-8">
      <div className="max-w-[760px] mx-auto space-y-6">
        {resource ? (
          <>
            {/* 업체 프로필 헤더 */}
            <header className="p-6 border border-white/15 bg-[#0c0d12] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-mono text-zinc-400">
                  {KIND_LABEL[resource.kind] || '예약'}
                </span>
                <Link href="/reserve" className="text-sm font-mono text-zinc-400 hover:text-white">
                  매장검색
                </Link>
              </div>
              <h1 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal">
                {resource.name}
              </h1>
              {resource.coverImageUrl && (
                <div className="w-full h-52 overflow-hidden border border-white/10 bg-black/40">
                  <img src={resource.coverImageUrl} alt={resource.name} loading="lazy" className="w-full h-full object-cover" />
                </div>
              )}
              {(resource.signatureMenu || resource.priceRange) && (
                <div className="text-sm text-zinc-200 font-medium">
                  {resource.signatureMenu}
                  {resource.signatureMenu && resource.priceRange ? ' · ' : ''}
                  {resource.priceRange}
                </div>
              )}
              <div className="space-y-1.5 text-sm text-zinc-300">
                {resource.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#3b82f6] shrink-0" />
                    <span>{resource.address} {resource.addressDetail}</span>
                  </div>
                )}
                {resource.phone && (
                  <div className="flex items-center gap-2 font-mono">
                    <Phone className="w-4 h-4 text-[#3b82f6] shrink-0" />
                    <span>{resource.phone}</span>
                  </div>
                )}
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {resource.tags.map((t) => (
                      <span key={t} className="px-2.5 py-0.5 border border-white/15 bg-black/40 text-sm font-mono text-zinc-300">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                {resource.guideNote && (
                  <p className="text-sm text-zinc-400 pt-1">{resource.guideNote}</p>
                )}
              </div>
            </header>

            {/* 사전 예약 vs 지금 줄서기(테이블링) 모드 전환 */}
            <div className="grid grid-cols-2 border border-white/15 bg-[#0c0d12] p-1">
              <button
                type="button"
                onClick={() => setMode('BOOK')}
                className={`py-2.5 text-sm font-mono cursor-pointer transition-colors ${
                  mode === 'BOOK' ? 'bg-[#3b82f6]/25 border border-[#3b82f6]/60 text-white font-bold' : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                사전 예약
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('WAIT');
                  void fetchWaiting(myTicket?.entry.phone);
                }}
                className={`py-2.5 text-sm font-mono cursor-pointer transition-colors ${
                  mode === 'WAIT' ? 'bg-[#3b82f6]/25 border border-[#3b82f6]/60 text-white font-bold' : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                지금 줄서기 (대기 {waitingCount}팀)
              </button>
            </div>

            {mode === 'WAIT' ? (
              <section className="p-6 border border-white/15 bg-[#0c0d12] space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <div className="text-lg font-serif-editorial text-white">원격 웨이팅</div>
                    <div className="text-sm font-mono text-zinc-400">
                      {waitingOpen
                        ? `현재 ${waitingCount}팀 대기 중 · 예상 약 ${estimatedMinutes}분`
                        : '현재 원격 줄서기가 마감되었습니다.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void fetchWaiting(myTicket?.entry.phone || waitPhone.trim() || undefined)}
                    className="px-3 py-1.5 border border-white/20 text-sm font-mono text-zinc-200 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>새로고침</span>
                  </button>
                </div>

                {waitError && (
                  <div className="p-3 border border-white/20 bg-white/5 text-sm font-mono text-white">
                    {waitError}
                  </div>
                )}

                {myTicket ? (
                  <div className="p-5 border border-[#3b82f6]/60 bg-[#3b82f6]/10 space-y-3 text-center">
                    <div className="text-sm font-mono text-zinc-300">내 대기 번호표</div>
                    <div className="text-4xl font-mono font-bold text-white">#{myTicket.entry.ticketNo}</div>
                    {myTicket.entry.status === 'CALLED' ? (
                      <div className="p-2.5 border border-[#3b82f6] bg-[#3b82f6]/30 text-sm font-mono font-bold text-white">
                        매장에서 입장 호출했습니다. 카운터로 입장해 주세요!
                      </div>
                    ) : (
                      <div className="text-sm font-mono text-zinc-200">
                        내 앞 대기: <strong className="text-white">{myTicket.aheadCount}팀</strong> · {myTicket.entry.partySize}명 ({myTicket.entry.name})
                      </div>
                    )}
                    <div className="pt-2 flex justify-center gap-2">
                      <button
                        type="button"
                        disabled={waitBusy}
                        onClick={() => void handleCancelWaiting()}
                        className="px-4 py-2 border border-white/25 bg-white/10 hover:bg-white/20 text-sm font-mono text-white cursor-pointer"
                      >
                        {waitBusy ? '처리중' : '대기 취소'}
                      </button>
                    </div>
                  </div>
                ) : waitingOpen ? (
                  <form onSubmit={handleJoinWaiting} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select
                        value={waitPartySize}
                        onChange={(e) => setWaitPartySize(Number(e.target.value))}
                        className="px-3.5 py-2.5 bg-black/50 border border-white/20 text-sm font-mono text-white outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>{n}명</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        value={waitName}
                        onChange={(e) => setWaitName(e.target.value)}
                        placeholder="대기자 성함"
                        className="px-3.5 py-2.5 bg-black/50 border border-white/20 text-sm text-white outline-none"
                      />
                      <input
                        type="tel"
                        required
                        value={waitPhone}
                        onChange={(e) => setWaitPhone(e.target.value)}
                        placeholder="연락처 (010-0000-0000)"
                        className="px-3.5 py-2.5 bg-black/50 border border-white/20 text-sm font-mono text-white outline-none"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="submit"
                        disabled={waitBusy}
                        className="flex-1 py-3 border border-[#3b82f6]/60 bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 text-sm font-mono font-bold text-white cursor-pointer disabled:opacity-40"
                      >
                        {waitBusy ? '등록 중...' : '줄서기 등록'}
                      </button>
                      {waitPhone.trim().length >= 8 && (
                        <button
                          type="button"
                          onClick={() => void fetchWaiting(waitPhone.trim())}
                          className="px-4 py-3 border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-mono text-zinc-200 cursor-pointer"
                        >
                          내 순번 조회
                        </button>
                      )}
                    </div>
                  </form>
                ) : null}
              </section>
            ) : (
              <>
                {/* 1. 날짜 & 인원 선택 */}
                <section className="p-6 border border-white/10 bg-[#0c0d12] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-mono text-zinc-400 flex items-center gap-1.5 mb-2">
                        <Calendar className="w-4 h-4 text-[#3b82f6]" />
                        <span>날짜</span>
                      </label>
                      <input
                        type="date"
                        value={date}
                        min={todayKst()}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-black/50 border border-white/20 text-sm font-mono text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-mono text-zinc-400 flex items-center gap-1.5 mb-2">
                        <Users className="w-4 h-4 text-[#3b82f6]" />
                        <span>인원</span>
                      </label>
                      <select
                        value={partySize}
                        onChange={(e) => setPartySize(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-black/50 border border-white/20 text-sm font-mono text-white outline-none"
                      >
                        {(() => {
                          const activeUnits = (resource.units || []).filter((u) => u.active);
                          const minP = activeUnits.length > 0 ? Math.min(...activeUnits.map((u) => u.minPartySize || 1)) : 1;
                          const maxP = activeUnits.length > 0 ? Math.max(...activeUnits.map((u) => u.maxPartySize || 6)) : 10;
                          return Array.from({ length: Math.max(1, maxP - minP + 1) }, (_, idx) => minP + idx).map((n) => (
                            <option key={n} value={n}>{n}명</option>
                          ));
                        })()}
                      </select>
                    </div>
                  </div>

                  {/* 2. 예약 가능 시간대 선택 */}
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-mono text-zinc-400 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#3b82f6]" />
                        <span>시간 선택</span>
                      </div>
                      {(() => {
                        const activeWeekly = (resource.schedule?.weekly || []).filter((w) => w.active);
                        if (activeWeekly.length === 0) return null;
                        const openDaysText = activeWeekly.map((w) => DAY_KO[w.dayOfWeek]).join('·');
                        const timeRange = activeWeekly[0] ? `${activeWeekly[0].startTime}~${activeWeekly[0].endTime}` : '';
                        return (
                          <span className="text-xs font-mono text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5">
                            영업: 매주 {openDaysText} ({timeRange})
                          </span>
                        );
                      })()}
                    </div>

                    {loading ? (
                      <p className="text-sm font-mono text-zinc-400 py-4">조회 중...</p>
                    ) : windows.length === 0 ? (
                      (() => {
                        const dateCheck = checkDateSchedule(resource, date);
                        const nextOpen = getNextOpenDate(resource, date);
                        return (
                          <div className="py-4 border border-white/10 px-4 space-y-3 bg-black/30">
                            <p className="text-sm font-mono text-zinc-300">
                              {dateCheck.isOpen
                                ? '선택한 날짜의 예약 가능한 시간대가 모두 마감되었습니다.'
                                : dateCheck.reason}
                            </p>
                            {nextOpen && nextOpen !== date && (
                              <button
                                type="button"
                                onClick={() => setDate(nextOpen)}
                                className="px-3 py-1.5 border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition-colors cursor-pointer"
                              >
                                가장 빠른 영업일({nextOpen}) 보기
                              </button>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {windows.map((w) => {
                          const active = selected?.unitId === w.unitId && selected?.startsAt === w.startsAt;
                          return (
                            <button
                              key={`${w.unitId}_${w.startsAt}`}
                              type="button"
                              onClick={() => setSelected(w)}
                              className={`p-3 border text-left font-mono text-sm transition-colors cursor-pointer ${
                                active
                                  ? 'border-[#3b82f6] bg-[#3b82f6]/20 text-white font-bold'
                                  : 'border-white/15 bg-black/40 text-zinc-300 hover:border-white/35'
                              }`}
                            >
                              <div>{fmtTimeKst(w.startsAt)}</div>
                              <div className="text-zinc-400 truncate">
                                {w.unitName} · {w.remainingQuantity}석
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>

                {/* 3. 예약자 정보 입력 */}
                {selected && (
                  <form onSubmit={handleSubmit} className="p-6 border border-white/15 bg-[#0c0d12] space-y-4">
                    <div className="text-sm font-mono text-white">
                      선택: {date} {fmtTimeKst(selected.startsAt)} · {selected.unitName} · {partySize}명
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="예약자 성함"
                        className="px-3.5 py-2.5 bg-black/50 border border-white/20 text-sm text-white outline-none"
                      />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="연락처 (010-0000-0000)"
                        className="px-3.5 py-2.5 bg-black/50 border border-white/20 text-sm font-mono text-white outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      value={requests}
                      onChange={(e) => setRequests(e.target.value)}
                      placeholder="요청사항 (알레르기, 창가 자리 등 선택 입력)"
                      className="w-full px-3.5 py-2.5 bg-black/50 border border-white/20 text-sm text-white outline-none"
                    />
                    {errorMsg && (
                      <div className="p-3 border border-white/20 bg-white/5 text-sm text-white font-mono">
                        {errorMsg}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 border border-[#3b82f6]/60 bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 text-sm font-mono font-bold text-white cursor-pointer disabled:opacity-40"
                    >
                      {submitting ? '처리 중...' : '예약'}
                    </button>
                  </form>
                )}
              </>
            )}
          </>
        ) : (
          <div className="p-8 border border-white/15 bg-[#0c0d12] text-center text-sm font-mono text-zinc-300">
            {loading ? '불러오는 중...' : (errorMsg || '업체를 찾을 수 없습니다.')}
          </div>
        )}
        <footer className="pt-4 text-center text-sm font-mono text-zinc-500">
          TABLEBARO · 앱 설치 없는 3초 테이블 예약 · 원격 웨이팅
        </footer>
      </div>
    </main>
  );
}
