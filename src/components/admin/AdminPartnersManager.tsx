'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { BudgetTier, PartnerVenue } from '@/engine';
import {
  AffiliateApplicationRow,
  AffiliateEventLog,
  AffiliatePayoutRecord,
  PartnerMeta,
  VenuePartnerApplication,
  clearCreatorPayoutRequest,
  createAffiliateApplication,
  deleteAffiliateApplication,
  deleteAffiliatePayout,
  fetchAffiliateApplications,
  fetchAffiliateEvents,
  fetchAffiliatePayouts,
  fetchPartnerMetaMap,
  fetchVenueApplications,
  saveAffiliatePayouts,
  savePartnerMetaMap,
  updateAffiliateStatusAndPromo,
  updateVenueApplicationStatus,
} from '@/lib/affiliateDb';

export type PartnersSection = 'AFFILIATE' | 'FUNNEL' | 'PAYOUT' | 'VENUE';

interface Props {
  section: PartnersSection;
  isLight?: boolean;
  partnerVenues?: PartnerVenue[];
  onAddVenue?: (v: PartnerVenue) => void;
  onUpdateVenue?: (v: PartnerVenue) => void;
  onDeleteVenue?: (venueId: string) => void;
  onNotify?: (msg: string) => void;
}

const TITLES: Record<PartnersSection, string> = {
  AFFILIATE: '파트너',
  FUNNEL: '성과',
  PAYOUT: '정산',
  VENUE: '식당',
};

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString('ko-KR') : '-');

export default function AdminPartnersManager({
  section,
  isLight = false,
  partnerVenues = [],
  onAddVenue,
  onUpdateVenue,
  onDeleteVenue,
  onNotify,
}: Props) {
  const notify = useCallback((m: string) => onNotify?.(m), [onNotify]);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const [apps, setApps] = useState<AffiliateApplicationRow[]>([]);
  const [metaMap, setMetaMap] = useState<Record<string, PartnerMeta>>({});
  const [events, setEvents] = useState<AffiliateEventLog[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayoutRecord[]>([]);
  const [venueApps, setVenueApps] = useState<VenuePartnerApplication[]>([]);

  const [draftMeta, setDraftMeta] = useState<PartnerMeta>({
    commissionRate: 10,
    discountRate: 10,
    bankInfo: '',
    note: '',
  });

  // 수동 파트너 등록 입력
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerEmail, setNewPartnerEmail] = useState('');
  const [newPartnerCode, setNewPartnerCode] = useState('');
  const [newPartnerChannel, setNewPartnerChannel] = useState('');

  // 신규 제휴 식당 등록 입력
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueCity, setNewVenueCity] = useState('SEOUL_SEONGSU');
  const [newVenueBudget, setNewVenueBudget] = useState<BudgetTier>('$$');
  const [newVenueTables, setNewVenueTables] = useState(3);

  const boxCls = isLight
    ? 'border border-zinc-200 bg-white shadow-sm'
    : 'border border-white/10 bg-[#0c0d12]';
  const rowCls = isLight
    ? 'p-3.5 border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors'
    : 'p-3.5 border border-white/10 bg-[#0c0d12] hover:bg-white/[0.03] hover:border-white/20 transition-colors';
  const btnCls = isLight
    ? 'px-2.5 py-1 text-sm font-mono border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 cursor-pointer disabled:opacity-40'
    : 'px-2.5 py-1 text-sm font-mono border border-white/20 bg-white/5 hover:bg-white/10 text-white cursor-pointer disabled:opacity-40';
  const inputCls = isLight
    ? 'px-2.5 py-1.5 text-sm font-mono bg-white border border-zinc-300 text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-500'
    : 'px-2.5 py-1.5 text-sm font-mono bg-black/40 border border-white/20 text-white placeholder:text-zinc-500 outline-none focus:border-white/40';
  const badgeCls = isLight
    ? 'px-2 py-0.5 text-sm font-mono border border-zinc-300 text-zinc-800'
    : 'px-2 py-0.5 text-sm font-mono border border-white/20 text-zinc-200';
  const titleTextCls = isLight ? 'text-zinc-900' : 'text-white';
  const subTextCls = isLight ? 'text-zinc-600' : 'text-zinc-400';
  const muteTextCls = isLight ? 'text-zinc-500' : 'text-zinc-500';
  const dividerCls = isLight ? 'border-zinc-200' : 'border-white/10';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, m, ev, po, va] = await Promise.all([
        fetchAffiliateApplications(),
        fetchPartnerMetaMap(),
        fetchAffiliateEvents(),
        fetchAffiliatePayouts(),
        fetchVenueApplications(),
      ]);
      setApps(a);
      setMetaMap(m);
      setEvents(ev);
      setPayouts(po);
      setVenueApps(va);
    } catch (e: any) {
      notify(`불러오기 실패: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    setOpenId(null);
    load();
  }, [load]);

  const openPartnerDetail = (a: AffiliateApplicationRow) => {
    const key = a.id || a.code;
    if (openId === key) {
      setOpenId(null);
      return;
    }
    const existing = metaMap[a.code] || { commissionRate: 10, discountRate: 10, bankInfo: '', note: '' };
    setDraftMeta({
      commissionRate: existing.commissionRate ?? 10,
      discountRate: existing.discountRate ?? 10,
      bankInfo: existing.bankInfo ?? '',
      note: existing.note ?? '',
    });
    setOpenId(key);
  };

  const handleSaveMeta = async (a: AffiliateApplicationRow) => {
    const nextMap = { ...metaMap, [a.code]: draftMeta };
    setMetaMap(nextMap);
    await savePartnerMetaMap(nextMap);
    if (a.status === 'APPROVED') {
      await updateAffiliateStatusAndPromo(a, 'APPROVED', draftMeta);
    }
    notify(`${a.partnerName} 설정 저장`);
    load();
  };

  const handleStatus = async (a: AffiliateApplicationRow, status: 'APPROVED' | 'REJECTED' | 'SUSPENDED') => {
    const cleanedNote = (draftMeta.note || '').replace(/^\[정지\]\s*/g, '').trim();
    const syncedDraft: PartnerMeta = {
      ...draftMeta,
      note: status === 'SUSPENDED' ? (cleanedNote ? `[정지] ${cleanedNote}` : '[정지]') : cleanedNote,
    };
    setDraftMeta(syncedDraft);
    await updateAffiliateStatusAndPromo(a, status, syncedDraft);
    notify(`${a.partnerName} → ${status}`);
    load();
  };

  const handleAddPartner = async () => {
    const res = await createAffiliateApplication({
      partnerName: newPartnerName,
      contactEmail: newPartnerEmail,
      channelUrl: newPartnerChannel,
      code: newPartnerCode,
      status: 'APPROVED',
    });
    if (!res.ok) {
      notify(res.error || '파트너 추가 실패');
      return;
    }
    setNewPartnerName('');
    setNewPartnerEmail('');
    setNewPartnerCode('');
    setNewPartnerChannel('');
    notify('파트너 추가 완료');
    load();
  };

  const handleDeletePartner = async (a: AffiliateApplicationRow) => {
    await deleteAffiliateApplication(a);
    setOpenId(null);
    notify(`${a.partnerName} 삭제`);
    load();
  };

  const handlePayout = async (a: AffiliateApplicationRow, balance: number) => {
    if (balance <= 0) return notify('지급할 정산 잔액이 없습니다.');
    const bankInfo = metaMap[a.code]?.bankInfo?.trim();
    if (!bankInfo) {
      return notify('파트너 탭에서 정산 계좌를 먼저 등록해 주세요.');
    }
    const rec: AffiliatePayoutRecord = {
      id: `PAY_${Date.now()}`,
      code: a.code,
      partnerName: a.partnerName,
      amountKrw: balance,
      bankInfo,
      note: `${a.code} 정산 지급`,
      paidAt: new Date().toISOString(),
    };
    const next = [rec, ...payouts];
    setPayouts(next);
    await saveAffiliatePayouts(next);
    await clearCreatorPayoutRequest(a.code);
    notify(`${a.partnerName} ₩${balance.toLocaleString()} 지급 확정`);
    void load();
  };

  const handleApproveVenueApp = async (va: VenuePartnerApplication) => {
    const createdVenueId = `VEN_PARTNER_${Date.now().toString().slice(-5)}`;
    onAddVenue?.({
      venueId: createdVenueId,
      name: va.venueName,
      cityCode: va.cityCode,
      budgetTier: va.budgetTier,
      supportedDietary: va.supportedDietary,
      vibeThemes: ['WINE_BISTRO', 'CASUAL_DINING'],
      maxTablesPerNight: va.maxTablesPerNight,
    });
    const next = await updateVenueApplicationStatus(va.applicationId, 'APPROVED', createdVenueId);
    setVenueApps(next);
    notify(`${va.venueName} 승인`);
  };

  const handleRejectVenueApp = async (va: VenuePartnerApplication) => {
    const next = await updateVenueApplicationStatus(va.applicationId, 'REJECTED');
    setVenueApps(next);
    notify(`${va.venueName} 반려`);
  };

  const handleCancelPayout = async (payoutId: string) => {
    const next = await deleteAffiliatePayout(payoutId);
    setPayouts(next);
    notify('지급 이력 취소');
  };

  const handleCreateVenue = () => {
    if (!newVenueName.trim() || !onAddVenue) return notify('식당명을 입력해 주세요.');
    const created: PartnerVenue = {
      venueId: `VEN_PARTNER_${Date.now().toString().slice(-5)}`,
      name: newVenueName.trim(),
      cityCode: newVenueCity,
      budgetTier: newVenueBudget,
      supportedDietary: ['NONE', 'ALCOHOL_FREE'],
      vibeThemes: ['WINE_BISTRO', 'CASUAL_DINING'],
      maxTablesPerNight: Math.max(1, newVenueTables),
    };
    onAddVenue(created);
    setNewVenueName('');
    setNewVenueTables(3);
    notify(`${created.name} 추가`);
  };

  const renderHeader = (title: string, count?: number, right?: React.ReactNode) => (
    <div className={`p-3 ${boxCls} flex items-center justify-between gap-3`}>
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
        <h2 className={`font-serif-editorial text-lg font-normal ${titleTextCls}`}>{title}</h2>
        {typeof count === 'number' && (
          <span className={`text-sm font-mono px-2 py-0.5 border ${dividerCls} ${subTextCls}`}>{count}건</span>
        )}
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );

  const refreshBtn = (
    <button type="button" className={btnCls} onClick={load} disabled={loading}>
      {loading ? '로딩' : '새로고침'}
    </button>
  );

  // 1. 파트너 심사 · 커미션율 · 할인율 · 계좌 설정
  if (section === 'AFFILIATE') {
    return (
      <div className="space-y-3">
        {renderHeader(TITLES.AFFILIATE, apps.length, refreshBtn)}
        <div className={`p-3 ${boxCls} grid grid-cols-1 sm:grid-cols-5 gap-2`}>
          <input
            className={inputCls}
            placeholder="파트너명"
            value={newPartnerName}
            onChange={(e) => setNewPartnerName(e.target.value)}
          />
          <input
            className={inputCls}
            placeholder="이메일"
            value={newPartnerEmail}
            onChange={(e) => setNewPartnerEmail(e.target.value)}
          />
          <input
            className={inputCls}
            placeholder="코드"
            value={newPartnerCode}
            onChange={(e) => setNewPartnerCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
          />
          <input
            className={inputCls}
            placeholder="채널 URL"
            value={newPartnerChannel}
            onChange={(e) => setNewPartnerChannel(e.target.value)}
          />
          <button type="button" className={btnCls} onClick={handleAddPartner}>추가</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {apps.map((a) => {
            const key = a.id || a.code;
            const open = openId === key;
            const meta = metaMap[a.code] || { commissionRate: 10, discountRate: 10 };
            const isSuspended = Boolean(meta.note?.startsWith('[정지]'));
            return (
              <div key={key} className={`${rowCls} ${open ? 'md:col-span-full' : ''}`}>
                <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => openPartnerDetail(a)}>
                  <div className="min-w-0">
                    <div className={`text-sm truncate ${titleTextCls}`}>{a.partnerName}</div>
                    <div className={`text-sm font-mono truncate ${subTextCls}`}>{a.code} · {a.contactEmail}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {meta.payoutRequestedAt && <span className={badgeCls}>출금요청</span>}
                    <span className={badgeCls}>수수료 {meta.commissionRate}%</span>
                    <span className={badgeCls}>{isSuspended ? 'SUSPENDED' : a.status}</span>
                  </div>
                </div>

                {open && (
                  <div className={`mt-3 pt-3 border-t ${dividerCls} space-y-3`}>
                    <div className={`text-sm font-mono ${subTextCls}`}>
                      채널: {a.channelUrl || '-'} · 신청일: {fmt(a.createdAt)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <label className="space-y-1">
                        <span className={`text-sm font-mono block ${subTextCls}`}>수수료(%)</span>
                        <input
                          type="number"
                          className={`w-full ${inputCls}`}
                          value={draftMeta.commissionRate}
                          onChange={(e) => setDraftMeta({ ...draftMeta, commissionRate: Number(e.target.value) })}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className={`text-sm font-mono block ${subTextCls}`}>할인율(%)</span>
                        <input
                          type="number"
                          className={`w-full ${inputCls}`}
                          value={draftMeta.discountRate}
                          onChange={(e) => setDraftMeta({ ...draftMeta, discountRate: Number(e.target.value) })}
                        />
                      </label>
                      <label className="space-y-1 sm:col-span-2">
                        <span className={`text-sm font-mono block ${subTextCls}`}>정산계좌</span>
                        <input
                          type="text"
                          className={`w-full ${inputCls}`}
                          placeholder="은행 · 계좌번호 · 예금주"
                          value={draftMeta.bankInfo || ''}
                          onChange={(e) => setDraftMeta({ ...draftMeta, bankInfo: e.target.value })}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      className={`w-full ${inputCls}`}
                      placeholder="심사 메모"
                      value={draftMeta.note || ''}
                      onChange={(e) => setDraftMeta({ ...draftMeta, note: e.target.value })}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={btnCls} onClick={() => handleSaveMeta(a)}>저장</button>
                      <button type="button" className={btnCls} onClick={() => handleStatus(a, 'APPROVED')}>승인</button>
                      <button type="button" className={btnCls} onClick={() => handleStatus(a, 'REJECTED')}>반려</button>
                      <button type="button" className={btnCls} onClick={() => handleStatus(a, 'SUSPENDED')}>정지</button>
                      <button type="button" className={btnCls} onClick={() => handleDeletePartner(a)}>삭제</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. 성과 퍼널 (클릭 -> 결제 전환 -> CVR -> 매출)
  if (section === 'FUNNEL') {
    return (
      <div className="space-y-3">
        {renderHeader(TITLES.FUNNEL, apps.length, refreshBtn)}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {apps.map((a) => {
            const clicks = events.filter((e) => e.code === a.code && e.eventType === 'CLICK').length;
            const pur = events.filter((e) => e.code === a.code && e.eventType === 'PURCHASE' && !e.blockedSelfReferral);
            const blocked = events.filter((e) => e.code === a.code && e.blockedSelfReferral).length;
            const rev = pur.reduce((s, e) => s + (e.amountKrw || 0), 0);
            const comm = pur.reduce((s, e) => s + (e.commissionKrw || 0), 0);
            const cvr = clicks > 0 ? Math.round((pur.length / clicks) * 100) : 0;
            return (
              <div key={a.id || a.code} className={rowCls}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm truncate ${titleTextCls}`}>{a.partnerName} ({a.code})</span>
                  <span className={badgeCls}>전환 {cvr}%</span>
                </div>
                <div className={`grid grid-cols-3 gap-2 mt-2 text-sm font-mono ${subTextCls}`}>
                  <span>클릭 {clicks}</span>
                  <span>결제 {pur.length}</span>
                  <span>차단 {blocked}</span>
                </div>
                <div className={`text-sm font-mono mt-1 ${titleTextCls}`}>
                  매출 ₩{rev.toLocaleString()} · 수수료 ₩{comm.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
        {renderHeader('로그', events.length)}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {events.slice(0, 20).map((ev) => (
            <div key={ev.id} className={rowCls}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-mono ${titleTextCls}`}>{ev.code} · {ev.eventType}</span>
                <span className={badgeCls}>{ev.blockedSelfReferral ? '자기추천차단' : ev.eventType === 'PURCHASE' ? `₩${(ev.commissionKrw || 0).toLocaleString()}` : '유입'}</span>
              </div>
              <div className={`text-sm font-mono mt-1 ${muteTextCls}`}>{ev.userId || '-'} · {fmt(ev.at)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. 정산 원장 & 지급 확정
  if (section === 'PAYOUT') {
    return (
      <div className="space-y-3">
        {renderHeader(TITLES.PAYOUT, apps.length, refreshBtn)}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {apps.map((a) => {
            const totalComm = events
              .filter((e) => e.code === a.code && e.eventType === 'PURCHASE' && !e.blockedSelfReferral)
              .reduce((s, e) => s + (e.commissionKrw || 0), 0);
            const paid = payouts
              .filter((p) => p.code === a.code)
              .reduce((s, p) => s + (p.amountKrw || 0), 0);
            const balance = Math.max(0, totalComm - paid);
            const bank = metaMap[a.code]?.bankInfo?.trim() || '계좌 미등록';
            return (
              <div key={a.id || a.code} className={`${rowCls} flex items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <div className={`text-sm truncate ${titleTextCls}`}>{a.partnerName} ({a.code})</div>
                  <div className={`text-sm font-mono truncate ${subTextCls}`}>
                    누적 ₩{totalComm.toLocaleString()} · 지급 ₩{paid.toLocaleString()} · {bank}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {metaMap[a.code]?.payoutRequestedAt && <span className={badgeCls}>출금요청</span>}
                  <span className={badgeCls}>잔액 ₩{balance.toLocaleString()}</span>
                  <button type="button" className={btnCls} disabled={balance <= 0} onClick={() => handlePayout(a, balance)}>
                    지급
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {renderHeader('지급이력', payouts.length)}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {payouts.map((p) => (
            <div key={p.id} className={`${rowCls} flex items-center justify-between gap-3`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm truncate ${titleTextCls}`}>{p.partnerName} ({p.code})</span>
                  <span className={badgeCls}>₩{p.amountKrw.toLocaleString()}</span>
                </div>
                <div className={`text-sm font-mono mt-1 truncate ${subTextCls}`}>{p.bankInfo} · {fmt(p.paidAt)}</div>
              </div>
              <button type="button" className={btnCls} onClick={() => handleCancelPayout(p.id)}>취소</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. 제휴 식당 B2B 파트너 (입점 신청 심사 + 활성 영업 매장)
  return (
    <div className="space-y-3">
      {renderHeader('입점신청', venueApps.length, refreshBtn)}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {venueApps.map((va) => (
          <div key={va.applicationId} className={`${rowCls} flex items-center justify-between gap-3`}>
            <div className="min-w-0">
              <div className={`text-sm truncate ${titleTextCls}`}>{va.venueName}</div>
              <div className={`text-sm font-mono truncate ${subTextCls}`}>
                {va.cityCode} · {va.budgetTier} · {va.maxTablesPerNight}테이블 · {va.contactEmail}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={badgeCls}>{va.status}</span>
              {va.status === 'PENDING' && (
                <>
                  <button type="button" className={btnCls} onClick={() => handleApproveVenueApp(va)}>승인</button>
                  <button type="button" className={btnCls} onClick={() => handleRejectVenueApp(va)}>반려</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {renderHeader(TITLES.VENUE, partnerVenues.length)}
      {onAddVenue && (
        <div className={`p-3 ${boxCls} grid grid-cols-1 sm:grid-cols-5 gap-2`}>
          <input
            className={inputCls}
            placeholder="식당명"
            value={newVenueName}
            onChange={(e) => setNewVenueName(e.target.value)}
          />
          <select
            className={inputCls}
            value={newVenueCity}
            onChange={(e) => setNewVenueCity(e.target.value)}
          >
            <option value="SEOUL_SEONGSU">서울 성수</option>
            <option value="SEOUL_GANGNAM">서울 강남</option>
            <option value="BUSAN_HAEUNDAE">부산 해운대</option>
            <option value="BUSAN_GWANGAN">부산 광안리</option>
            <option value="BUSAN_JEONPO">부산 전포</option>
          </select>
          <select
            className={inputCls}
            value={newVenueBudget}
            onChange={(e) => setNewVenueBudget(e.target.value as BudgetTier)}
          >
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
          </select>
          <input
            type="number"
            min={1}
            className={inputCls}
            value={newVenueTables}
            onChange={(e) => setNewVenueTables(Number(e.target.value))}
          />
          <button type="button" className={btnCls} onClick={handleCreateVenue}>추가</button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {partnerVenues.map((v) => {
          const open = openId === v.venueId;
          return (
            <div key={v.venueId} className={`${rowCls} ${open ? 'md:col-span-full' : ''}`}>
              <div className="flex items-center justify-between gap-2 cursor-pointer" onClick={() => setOpenId(open ? null : v.venueId)}>
                <div className="min-w-0">
                  <div className={`text-sm truncate ${titleTextCls}`}>{v.name}</div>
                  <div className={`text-sm font-mono ${subTextCls}`}>{v.cityCode} · {v.budgetTier}</div>
                </div>
                <span className={badgeCls}>{v.maxTablesPerNight}테이블</span>
              </div>
              {open && (
                <div className={`mt-3 pt-3 border-t ${dividerCls} flex flex-wrap items-center justify-between gap-3`}>
                  <div className={`text-sm font-mono ${subTextCls}`}>
                    식단 지원: {(v.supportedDietary || ['NONE']).join(', ')} · 무드: {(v.vibeThemes || []).join(', ') || '-'}
                  </div>
                  <div className="flex items-center gap-2">
                    {onUpdateVenue && (
                      <>
                        <button
                          type="button"
                          className={btnCls}
                          onClick={() => onUpdateVenue({ ...v, maxTablesPerNight: Math.max(1, v.maxTablesPerNight - 1) })}
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          className={btnCls}
                          onClick={() => onUpdateVenue({ ...v, maxTablesPerNight: v.maxTablesPerNight + 1 })}
                        >
                          +1
                        </button>
                      </>
                    )}
                    {onDeleteVenue && (
                      <button
                        type="button"
                        className={btnCls}
                        onClick={() => {
                          onDeleteVenue(v.venueId);
                          setOpenId(null);
                          notify(`${v.name} 삭제`);
                        }}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
