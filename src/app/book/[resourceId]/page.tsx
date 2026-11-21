'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, Clock, MapPin, Phone, Users, CheckCircle2 } from 'lucide-react';

interface PublicResource {
  id: string;
  kind: string;
  name: string;
  address: string;
  addressDetail: string;
  phone: string;
  guideNote: string;
}

interface AvailableWindow {
  unitId: string;
  unitName: string;
  startsAt: string;
  endsAt: string;
  remainingQuantity: number;
}

const KIND_LABEL: Record<string, string> = {
  restaurant: '다이닝',
  lodging: '숙박',
  space: '공간',
  etc: '예약',
};

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

export default function PublicBookingPage() {
  const params = useParams<{ resourceId: string }>();
  const resourceId = decodeURIComponent(params.resourceId || '');

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
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [resourceId, date, partySize]);

  useEffect(() => {
    void fetchAvailability();
  }, [fetchAvailability]);

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

  if (confirmedId && resource) {
    return (
      <main className="min-h-screen bg-[#07080a] text-zinc-100 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md border border-white/15 bg-[#0c0d12] p-8 space-y-5 text-center">
          <CheckCircle2 className="w-10 h-10 text-[#f04f74] mx-auto" />
          <h1 className="font-serif-editorial text-2xl text-white font-normal">예약 접수 완료</h1>
          <div className="text-sm font-mono text-zinc-300 space-y-1.5 border-y border-white/10 py-4 text-left">
            <div>매장: {resource.name}</div>
            <div>일시: {date} {selected ? fmtTimeKst(selected.startsAt) : ''}</div>
            <div>인원: {partySize}명 ({selected?.unitName})</div>
            <div>예약번호: {confirmedId}</div>
          </div>
          <p className="text-sm text-zinc-400">매장 확인 후 예약이 최종 확정됩니다.</p>
          <button
            type="button"
            onClick={() => {
              setConfirmedId(null);
              void fetchAvailability();
            }}
            className="w-full py-3 border border-white/25 bg-white/10 hover:bg-white/20 text-sm font-mono text-white cursor-pointer"
          >
            확인
          </button>
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
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                <span className="text-sm font-mono text-zinc-400">
                  {KIND_LABEL[resource.kind] || '예약'}
                </span>
              </div>
              <h1 className="font-serif-editorial text-2xl sm:text-3xl text-white font-normal">
                {resource.name}
              </h1>
              <div className="space-y-1.5 text-sm text-zinc-300">
                {resource.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#f04f74] shrink-0" />
                    <span>{resource.address} {resource.addressDetail}</span>
                  </div>
                )}
                {resource.phone && (
                  <div className="flex items-center gap-2 font-mono">
                    <Phone className="w-4 h-4 text-[#f04f74] shrink-0" />
                    <span>{resource.phone}</span>
                  </div>
                )}
                {resource.guideNote && (
                  <p className="text-sm text-zinc-400 pt-1">{resource.guideNote}</p>
                )}
              </div>
            </header>

            {/* 1. 날짜 & 인원 선택 */}
            <section className="p-6 border border-white/10 bg-[#0c0d12] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-mono text-zinc-400 flex items-center gap-1.5 mb-2">
                    <Calendar className="w-4 h-4 text-[#f04f74]" />
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
                    <Users className="w-4 h-4 text-[#f04f74]" />
                    <span>인원</span>
                  </label>
                  <select
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-black/50 border border-white/20 text-sm font-mono text-white outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>{n}명</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. 예약 가능 시간대 선택 */}
              <div className="pt-2 space-y-2">
                <div className="text-sm font-mono text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#f04f74]" />
                  <span>시간 선택</span>
                </div>
                {loading ? (
                  <div className="text-sm font-mono text-zinc-400 py-3">조회 중...</div>
                ) : windows.length === 0 ? (
                  <div className="p-4 border border-white/10 bg-black/30 text-sm font-mono text-zinc-400">
                    선택한 날짜/인원에 예약 가능한 시간대가 없습니다. (휴무일이거나 영업시간 설정을 확인해 주세요.)
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {windows.map((w) => {
                      const active = selected?.startsAt === w.startsAt && selected?.unitId === w.unitId;
                      return (
                        <button
                          key={`${w.unitId}-${w.startsAt}`}
                          type="button"
                          onClick={() => setSelected(w)}
                          className={`p-3 border text-left transition-all cursor-pointer ${
                            active
                              ? 'border-[#f04f74] bg-white/15 text-white'
                              : 'border-white/15 bg-black/40 hover:border-white/30 text-zinc-200'
                          }`}
                        >
                          <div className="text-sm font-mono font-bold">{fmtTimeKst(w.startsAt)}</div>
                          <div className="text-sm text-zinc-400 truncate">
                            {w.unitName} · 잔여 {w.remainingQuantity}
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
                <h2 className="font-serif-editorial text-lg text-white font-normal">예약자 정보</h2>
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
                  className="w-full py-3.5 border border-white/30 bg-white/15 hover:bg-white/25 text-sm font-mono font-bold text-white cursor-pointer disabled:opacity-40"
                >
                  {submitting ? '처리 중...' : '예약'}
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="p-8 border border-white/15 bg-[#0c0d12] text-center text-sm font-mono text-zinc-300">
            {loading ? '불러오는 중...' : (errorMsg || '업체를 찾을 수 없습니다.')}
          </div>
        )}
      </div>
    </main>
  );
}
