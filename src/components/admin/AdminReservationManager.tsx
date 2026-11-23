'use client';

import React, { useCallback, useEffect, useState } from 'react';

interface ResourceItem {
  id: string;
  kind: string;
  name: string;
  capacity: number;
  active: boolean;
  attributes: Record<string, any>;
}

interface BookingItem {
  id: string;
  slotId: string;
  resourceId: string;
  ownerRef: string;
  groupRef?: string;
  partySize: number;
  status: string;
  holdExpiresAt?: string;
  fallbackOf?: string;
  fallbackBookingId?: string;
  meta?: Record<string, any>;
  createdAt: string;
  respondUrl?: string | null;
}

interface Props {
  isLight?: boolean;
  initialView?: 'BOOKINGS' | 'RESOURCES';
  onNotify?: (msg: string) => void;
}

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: '대기',
  CONFIRMED: '확정',
  COMPLETED: '완료',
  DECLINED: '거절',
  EXPIRED: '만료',
  CANCELLED: '취소',
  NO_SHOW: '노쇼',
};

const KIND_LABEL: Record<string, string> = {
  restaurant: '식당',
  lodging: '숙박',
  space: '공간',
  etc: '기타',
};

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export default function AdminReservationManager({
  isLight = false,
  initialView = 'BOOKINGS',
  onNotify,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'BOOKINGS' | 'RESOURCES'>(initialView);
  const [showAddForm, setShowAddForm] = useState(false);

  // 자원 등록 폼 상태 (Cal.com + 네이버 플레이스 기준)
  const [kind, setKind] = useState('restaurant');
  const [name, setName] = useState('');
  const [cityCode, setCityCode] = useState('SEOUL_GANGNAM');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [phone, setPhone] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [pin, setPin] = useState('');
  const [guideNote, setGuideNote] = useState('');
  const [unitName, setUnitName] = useState('6인 프라이빗 테이블');
  const [capacity, setCapacity] = useState(6);
  const [quantity, setQuantity] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [openDays, setOpenDays] = useState<number[]>([3, 5, 6]); // 수, 금, 토
  const [startTime, setStartTime] = useState('17:30');
  const [endTime, setEndTime] = useState('22:00');

  useEffect(() => {
    setViewMode(initialView);
  }, [initialView]);

  const notify = useCallback((m: string) => onNotify?.(m), [onNotify]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reservations');
      const data = await res.json();
      setEnabled(Boolean(data.enabled));
      setResources(Array.isArray(data.resources) ? data.resources : []);
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } catch {
      notify('예약 현황 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (payload: Record<string, any>, successMsg: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        notify(data.error || '처리 실패');
        return false;
      }
      notify(successMsg);
      await load();
      return true;
    } catch {
      notify('요청 실패');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !phone.trim()) {
      notify('업체명, 주소, 전화번호는 필수입니다.');
      return;
    }
    const weekly = openDays.map((d) => ({
      dayOfWeek: d,
      startTime,
      endTime,
      slotIntervalMinutes: 60,
      active: true,
    }));
    const ok = await runAction(
      {
        action: 'UPSERT_RESOURCE',
        kind,
        name: name.trim(),
        cityCode,
        capacity: Math.max(1, capacity) * Math.max(1, quantity),
        active: true,
        contactEmail: contactEmail.trim() || undefined,
        pin: pin.trim() || undefined,
        profile: {
          address: address.trim(),
          addressDetail: addressDetail.trim(),
          phone: phone.trim(),
          managerPhone: managerPhone.trim(),
          guideNote: guideNote.trim(),
        },
        units: [
          {
            id: 'unit-main',
            name: unitName.trim() || '기본 좌석',
            minPartySize: 1,
            maxPartySize: Math.max(1, capacity),
            quantity: Math.max(1, quantity),
            durationMinutes: Math.max(30, durationMinutes),
            active: true,
          },
        ],
        schedule: {
          timezoneOffsetMinutes: 540,
          weekly,
          overrides: [],
        },
      },
      `${name.trim()} 등록`
    );
    if (ok) {
      setName('');
      setAddress('');
      setAddressDetail('');
      setPhone('');
      setManagerPhone('');
      setContactEmail('');
      setPin('');
      setGuideNote('');
      setShowAddForm(false);
    }
  };

  const toggleDay = (d: number) => {
    setOpenDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      notify('복사 완료');
    } catch {
      notify('복사 실패');
    }
  };

  const boxCls = isLight
    ? 'border border-zinc-200 bg-white shadow-sm'
    : 'border border-white/10 bg-[#0c0d12]';
  const rowCls = isLight
    ? 'p-3.5 border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors cursor-pointer'
    : 'p-3.5 border border-white/10 bg-[#0c0d12] hover:bg-white/[0.03] hover:border-white/20 transition-colors cursor-pointer';
  const btnCls = isLight
    ? 'px-2.5 py-1 text-sm font-mono border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 cursor-pointer disabled:opacity-40'
    : 'px-2.5 py-1 text-sm font-mono border border-white/20 bg-white/5 hover:bg-white/10 text-white cursor-pointer disabled:opacity-40';
  const inputCls = isLight
    ? 'w-full px-2.5 py-1.5 text-sm font-mono bg-white border border-zinc-300 text-zinc-900 outline-none'
    : 'w-full px-2.5 py-1.5 text-sm font-mono bg-black/40 border border-white/20 text-white outline-none';
  const badgeCls = isLight
    ? 'px-2 py-0.5 text-sm font-mono border border-zinc-300 text-zinc-800'
    : 'px-2 py-0.5 text-sm font-mono border border-white/20 text-white';
  const titleCls = isLight ? 'text-zinc-900' : 'text-white';
  const subCls = isLight ? 'text-zinc-600' : 'text-zinc-400';

  const resourceNameMap = new Map(resources.map((r) => [r.id, r.name]));

  return (
    <div className="space-y-4">
      <div className={`p-3 ${boxCls} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
          <h2 className={`font-serif-editorial text-lg font-normal ${titleCls}`}>테이블바로</h2>
          <span className={badgeCls}>
            {viewMode === 'BOOKINGS' ? `${bookings.length}건` : `${resources.length}곳`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('BOOKINGS')}
            className={`${btnCls} ${viewMode === 'BOOKINGS' ? 'border-white/40 font-bold' : ''}`}
          >
            관제
          </button>
          <button
            type="button"
            onClick={() => setViewMode('RESOURCES')}
            className={`${btnCls} ${viewMode === 'RESOURCES' ? 'border-white/40 font-bold' : ''}`}
          >
            자원
          </button>
          {viewMode === 'RESOURCES' ? (
            <button
              type="button"
              disabled={!enabled}
              onClick={() => setShowAddForm((v) => !v)}
              className={btnCls}
            >
              {showAddForm ? '닫기' : '+ 추가'}
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={loading || !enabled}
                onClick={() => void runAction({ action: 'CREATE_TEST_BOOKING' }, '테스트 예약 생성')}
                className={btnCls}
              >
                + 테스트
              </button>
              <button
                type="button"
                disabled={loading || !enabled}
                onClick={() => void runAction({ action: 'EXPIRE_HOLDS' }, '만료 정리 완료')}
                className={btnCls}
              >
                만료정리
              </button>
            </>
          )}
          <button type="button" disabled={loading} onClick={() => void load()} className={btnCls}>
            새로고침
          </button>
        </div>
      </div>

      {!enabled && (
        <div className={`p-4 ${boxCls} text-sm font-mono ${subCls}`}>
          예약 모듈 비활성 상태 (RESERVATION_ENABLED=true 필요)
        </div>
      )}

      {viewMode === 'RESOURCES' && showAddForm && (
        <form onSubmit={handleSaveResource} className={`p-4 ${boxCls} space-y-3 text-sm font-mono`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className={`block mb-1 ${subCls}`}>업종</label>
              <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls}>
                <option value="restaurant">식당</option>
                <option value="lodging">숙박</option>
                <option value="space">공간</option>
                <option value="etc">기타</option>
              </select>
            </div>
            <div>
              <label className={`block mb-1 ${subCls}`}>업체명</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="광안브릿지뷰" className={inputCls} />
            </div>
            <div>
              <label className={`block mb-1 ${subCls}`}>지역코드</label>
              <input value={cityCode} onChange={(e) => setCityCode(e.target.value)} placeholder="BUSAN_GWANGAN" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className={`block mb-1 ${subCls}`}>도로명 주소 (필수)</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="부산 수영구 광안해변로 219" className={inputCls} />
            </div>
            <div>
              <label className={`block mb-1 ${subCls}`}>상세 위치</label>
              <input value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} placeholder="3층 오션뷰홀" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className={`block mb-1 ${subCls}`}>매장 전화 (필수)</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="051-755-1234" className={inputCls} />
            </div>
            <div>
              <label className={`block mb-1 ${subCls}`}>담당자 휴대폰</label>
              <input value={managerPhone} onChange={(e) => setManagerPhone(e.target.value)} placeholder="010-1234-5678" className={inputCls} />
            </div>
            <div>
              <label className={`block mb-1 ${subCls}`}>이용 안내</label>
              <input value={guideNote} onChange={(e) => setGuideNote(e.target.value)} placeholder="주차 2시간 무료" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className={`block mb-1 ${subCls}`}>로그인 이메일</label>
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="owner@store.com" className={inputCls} />
            </div>
            <div>
              <label className={`block mb-1 ${subCls}`}>비밀번호 (PIN)</label>
              <input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4자 이상 (예: 1234)" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className={`block mb-1 ${subCls}`}>유닛명</label>
              <input value={unitName} onChange={(e) => setUnitName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={`block mb-1 ${subCls}`}>인원(단위당)</label>
              <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={`block mb-1 ${subCls}`}>보유 수량</label>
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={`block mb-1 ${subCls}`}>이용시간(분)</label>
              <input type="number" min={30} step={30} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className={inputCls} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {DAY_LABELS.map((lbl, idx) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`${btnCls} ${openDays.includes(idx) ? 'border-white/50 font-bold bg-white/15' : 'opacity-50'}`}
                >
                  {lbl}
                </button>
              ))}
              <input value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-20 px-2 py-1 text-sm font-mono bg-black/40 border border-white/20 text-white" />
              <span className={subCls}>~</span>
              <input value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-20 px-2 py-1 text-sm font-mono bg-black/40 border border-white/20 text-white" />
            </div>
            <button type="submit" disabled={loading} className={btnCls}>
              저장
            </button>
          </div>
        </form>
      )}

      {viewMode === 'BOOKINGS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {bookings.length === 0 ? (
            <div className={`col-span-full p-4 ${boxCls} text-sm font-mono ${subCls}`}>
              접수된 예약이 없습니다.
            </div>
          ) : (
            bookings.map((b) => {
              const isOpen = openId === b.id;
              const venueName =
                resourceNameMap.get(b.resourceId) ||
                (b.meta?.venueName as string) ||
                b.resourceId;
              const when = (b.meta?.startsAtText as string) || b.createdAt.slice(0, 16);
              const att = b.meta?.attendee as { name?: string; phone?: string; requests?: string } | undefined;
              return (
                <div
                  key={b.id}
                  onClick={() => setOpenId(isOpen ? null : b.id)}
                  className={`${rowCls} ${isOpen ? 'col-span-full' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] shrink-0" />
                      <span className={`font-medium truncate ${titleCls}`}>
                        {venueName} · {when} · {b.partySize}명
                      </span>
                    </div>
                    <span className={badgeCls}>{STATUS_LABEL[b.status] || b.status}</span>
                  </div>

                  {isOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-4 pt-4 border-t border-white/10 space-y-3 text-sm font-mono"
                    >
                      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 ${subCls}`}>
                        <div>예약ID: {b.id}</div>
                        <div>모임ID: {b.ownerRef}</div>
                        <div>방ID: {b.groupRef || '-'}</div>
                      </div>
                      {att && (
                        <div className={subCls}>
                          예약자: {att.name || '-'} ({att.phone || '-'}) {att.requests ? `· 요청: ${att.requests}` : ''}
                        </div>
                      )}
                      {b.respondUrl && (
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 border border-white/10 bg-black/30">
                          <span className={`truncate max-w-xl ${titleCls}`}>{b.respondUrl}</span>
                          <button
                            type="button"
                            onClick={() => void copyLink(b.respondUrl!)}
                            className={btnCls}
                          >
                            복사
                          </button>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        {b.status === 'REQUESTED' && (
                          <>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                void runAction({ action: 'CONFIRM', bookingId: b.id }, '확정')
                              }
                              className={btnCls}
                            >
                              확정
                            </button>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                void runAction({ action: 'DECLINE', bookingId: b.id }, '거절')
                              }
                              className={btnCls}
                            >
                              거절
                            </button>
                          </>
                        )}
                        {b.status === 'CONFIRMED' && (
                          <>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                void runAction({ action: 'COMPLETE', bookingId: b.id }, '완료')
                              }
                              className={btnCls}
                            >
                              완료
                            </button>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                void runAction({ action: 'NO_SHOW', bookingId: b.id }, '노쇼')
                              }
                              className={btnCls}
                            >
                              노쇼
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {resources.length === 0 ? (
            <div className={`col-span-full p-4 ${boxCls} text-sm font-mono ${subCls}`}>
              등록된 자원이 없습니다. 상단 `+ 추가`를 눌러 업체를 등록해 주세요.
            </div>
          ) : (
            resources.map((r) => {
              const isOpen = openId === r.id;
              const p = r.attributes?.profile as Record<string, any> | undefined;
              const units = (r.attributes?.units as any[]) || [];
              const sch = r.attributes?.schedule as { weekly?: any[] } | undefined;
              return (
                <div
                  key={r.id}
                  onClick={() => setOpenId(isOpen ? null : r.id)}
                  className={`${rowCls} ${isOpen ? 'col-span-full' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] shrink-0" />
                      <span className={`font-medium truncate ${titleCls}`}>
                        {r.name} · {KIND_LABEL[r.kind] || r.kind} · {r.capacity}석
                        {r.attributes?.contactEmail ? ` · ${r.attributes.contactEmail}` : ''}
                      </span>
                    </div>
                    <span className={badgeCls}>{r.active ? 'ON' : '승인대기'}</span>
                  </div>
                  {isOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-4 pt-4 border-t border-white/10 space-y-2 text-sm font-mono"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={subCls}>
                          ID: {r.id} · 지역: {r.attributes?.cityCode || '-'} · 티어: {r.attributes?.budgetTier || '-'}
                        </span>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() =>
                            void runAction(
                              { action: 'TOGGLE_RESOURCE', resourceId: r.id },
                              '상태 전환'
                            )
                          }
                          className={btnCls}
                        >
                          {r.active ? '비활성' : '승인'}
                        </button>
                      </div>
                      <div className={titleCls}>
                        주소: {p?.address || '미등록'} {p?.addressDetail || ''} · 전화: {p?.phone || '미등록'}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2 border border-white/10 bg-black/30">
                        <span className={`truncate ${titleCls}`}>
                          공개 예약 링크: {typeof window !== 'undefined' ? `${window.location.origin}/reserve/${r.id}` : `/reserve/${r.id}`}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => void copyLink(`${window.location.origin}/reserve/${r.id}`)}
                            className={btnCls}
                          >
                            복사
                          </button>
                          <a href={`/reserve/${r.id}`} target="_blank" rel="noreferrer" className={btnCls}>
                            열기
                          </a>
                        </div>
                      </div>
                      {p?.guideNote && <div className={subCls}>안내: {p.guideNote}</div>}
                      {units.length > 0 && (
                        <div className={subCls}>
                          유닛: {units.map((u) => `${u.name}(${u.minPartySize}~${u.maxPartySize}명×${u.quantity})`).join(', ')}
                        </div>
                      )}
                      {sch?.weekly && sch.weekly.length > 0 && (
                        <div className={subCls}>
                          영업: {sch.weekly.map((w) => `${DAY_LABELS[w.dayOfWeek]}(${w.startTime}~${w.endTime})`).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
