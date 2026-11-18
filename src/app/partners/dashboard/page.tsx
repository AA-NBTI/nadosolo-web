'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, Check, LogOut, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  AffiliateApplicationRow,
  AffiliateEventLog,
  AffiliatePayoutRecord,
  PartnerMeta,
  VenuePartnerApplication,
  authenticateCreatorPartner,
  authenticateVenuePartner,
  fetchAffiliateApplications,
  fetchAffiliateEvents,
  fetchAffiliatePayouts,
  fetchPartnerMetaMap,
  fetchVenueApplications,
  requestCreatorPayout,
} from '@/lib/affiliateDb';

const PARTNER_SESSION_KEY = 'nadosolo_partner_session_v1';

interface PartnerSession {
  role: 'CREATOR' | 'VENUE';
  identifier: string;
  name: string;
}

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString('ko-KR') : '-');

export default function PartnerPortalDashboardPage() {
  const [roleTab, setRoleTab] = useState<'CREATOR' | 'VENUE'>('CREATOR');
  const [identifier, setIdentifier] = useState('');
  const [passwordPin, setPasswordPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [session, setSession] = useState<PartnerSession | null>(null);
  const [ready, setReady] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // 크리에이터 상태
  const [creatorApp, setCreatorApp] = useState<AffiliateApplicationRow | null>(null);
  const [creatorMeta, setCreatorMeta] = useState<PartnerMeta>({ commissionRate: 10, discountRate: 10 });
  const [creatorEvents, setCreatorEvents] = useState<AffiliateEventLog[]>([]);
  const [creatorPayouts, setCreatorPayouts] = useState<AffiliatePayoutRecord[]>([]);
  const [bankInput, setBankInput] = useState('');
  const [copied, setCopied] = useState(false);

  // 식당 B2B 상태
  const [venueApp, setVenueApp] = useState<VenuePartnerApplication | null>(null);
  const [assignedMeetups, setAssignedMeetups] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(PARTNER_SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as PartnerSession;
          if (parsed?.role && parsed?.identifier) {
            setSession(parsed);
          }
        }
      } catch {}
    }
    setReady(true);
  }, []);

  const loadData = useCallback(async (sess: PartnerSession) => {
    setLoading(true);
    try {
      if (sess.role === 'CREATOR') {
        const [apps, metaMap, events, payouts] = await Promise.all([
          fetchAffiliateApplications(),
          fetchPartnerMetaMap(),
          fetchAffiliateEvents(),
          fetchAffiliatePayouts(),
        ]);
        const hit = apps.find((a) => a.code === sess.identifier.toUpperCase());
        if (hit) {
          const meta = metaMap[hit.code] || { commissionRate: 10, discountRate: 10 };
          setCreatorApp(hit);
          setCreatorMeta(meta);
          setBankInput(meta.bankInfo || '');
          setCreatorEvents(events.filter((e) => e.code === hit.code));
          setCreatorPayouts(payouts.filter((p) => p.code === hit.code));
        }
      } else {
        const apps = await fetchVenueApplications();
        const hit = apps.find((v) => v.applicationId === sess.identifier);
        if (hit) {
          setVenueApp(hit);
          if (hit.approvedVenueId) {
            const supabase = createClient();
            const { data } = await supabase
              .from('meetups')
              .select('meetup_id,title,date_text,status,max_capacity')
              .eq('venue_id', hit.approvedVenueId)
              .order('created_at', { ascending: false })
              .limit(20);
            setAssignedMeetups(data || []);
          } else {
            setAssignedMeetups([]);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      void loadData(session);
    }
  }, [session, loadData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (roleTab === 'CREATOR') {
      const res = await authenticateCreatorPartner(identifier, passwordPin);
      if (!res.ok || !res.partner) {
        setLoginError(res.error || '로그인 실패');
        return;
      }
      const sess: PartnerSession = {
        role: 'CREATOR',
        identifier: res.partner.code,
        name: res.partner.partnerName,
      };
      localStorage.setItem(PARTNER_SESSION_KEY, JSON.stringify(sess));
      setSession(sess);
      setPasswordPin('');
    } else {
      const res = await authenticateVenuePartner(identifier, passwordPin);
      if (!res.ok || !res.application) {
        setLoginError(res.error || '로그인 실패');
        return;
      }
      const sess: PartnerSession = {
        role: 'VENUE',
        identifier: res.application.applicationId,
        name: res.application.venueName,
      };
      localStorage.setItem(PARTNER_SESSION_KEY, JSON.stringify(sess));
      setSession(sess);
      setPasswordPin('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(PARTNER_SESSION_KEY);
    setSession(null);
    setCreatorApp(null);
    setVenueApp(null);
    setNotice(null);
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorApp) return;
    const res = await requestCreatorPayout(creatorApp.code, bankInput);
    if (!res.ok || !res.meta) {
      setNotice(res.error || '출금 신청 실패');
      return;
    }
    setCreatorMeta(res.meta);
    setNotice('정산 계좌 저장 및 출금 신청이 접수되었습니다.');
  };

  if (!ready) {
    return <main className="min-h-screen bg-[#07080a]" />;
  }

  // 비로그인 상태: 파트너스 전용 로그인 화면
  if (!session) {
    return (
      <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] py-16 px-5 sm:px-8 flex items-center justify-center">
        <div className="w-full max-w-md border border-white/15 bg-[#0c0d12] p-6 sm:p-8 space-y-6">
          <div className="space-y-2 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <span className="text-sm font-mono text-zinc-300 uppercase">PARTNERS PORTAL</span>
            </div>
            <h1 className="font-serif-editorial text-3xl text-white font-normal">파트너스 로그인</h1>
            <p className="text-sm text-zinc-400">
              일반 다이닝 회원 계정과 분리된 파트너스 전용 워크스페이스입니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setRoleTab('CREATOR');
                setLoginError(null);
              }}
              className={`py-2.5 text-sm font-mono border cursor-pointer ${
                roleTab === 'CREATOR'
                  ? 'border-white/40 bg-white/10 text-white font-semibold'
                  : 'border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              크리에이터 파트너
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleTab('VENUE');
                setLoginError(null);
              }}
              className={`py-2.5 text-sm font-mono border cursor-pointer ${
                roleTab === 'VENUE'
                  ? 'border-white/40 bg-white/10 text-white font-semibold'
                  : 'border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              식당 파트너 (B2B)
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 text-sm">
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={roleTab === 'CREATOR' ? '추천 코드 또는 신청 이메일' : '매장명 또는 담당자 이메일'}
              className="w-full px-4 py-3 bg-[#07080a] border border-white/15 text-white font-mono"
            />
            <input
              type="password"
              required
              value={passwordPin}
              onChange={(e) => setPasswordPin(e.target.value)}
              placeholder="파트너 비밀번호"
              className="w-full px-4 py-3 bg-[#07080a] border border-white/15 text-white font-mono"
            />
            {loginError && <p className="text-sm font-mono text-zinc-200 border-l-2 border-[#f04f74] pl-3">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3 border border-white/30 bg-white/15 hover:bg-white/25 text-white font-mono font-semibold cursor-pointer"
            >
              로그인
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-sm font-mono text-zinc-400">
            <Link href="/affiliate" prefetch={true} className="hover:text-white">
              크리에이터 신청 →
            </Link>
            <Link href="/partners" prefetch={true} className="hover:text-white">
              식당 입점 신청 →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 크리에이터 파트너 대시보드
  if (session.role === 'CREATOR') {
    const clicks = creatorEvents.filter((e) => e.eventType === 'CLICK').length;
    const validPurchases = creatorEvents.filter((e) => e.eventType === 'PURCHASE' && !e.blockedSelfReferral);
    const totalCommission = validPurchases.reduce((s, e) => s + (e.commissionKrw || 0), 0);
    const paidTotal = creatorPayouts.reduce((s, p) => s + (p.amountKrw || 0), 0);
    const balance = Math.max(0, totalCommission - paidTotal);
    const isSuspended = Boolean(creatorMeta.note?.startsWith('[정지]'));
    const statusLabel = isSuspended ? 'SUSPENDED' : creatorApp?.status || 'PENDING';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nadosolo.com';
    const refUrl = `${origin}/meetup?ref=${encodeURIComponent(creatorApp?.code || session.identifier)}`;

    return (
      <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] py-12 px-5 sm:px-8">
        <div className="max-w-[1000px] mx-auto space-y-6">
          <header className="p-4 border border-white/10 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <div>
                <h1 className="font-serif-editorial text-2xl text-white font-normal">
                  {creatorApp?.partnerName || session.name} ({session.identifier})
                </h1>
                <p className="text-sm font-mono text-zinc-400">
                  상태: {statusLabel} · 수수료 {creatorMeta.commissionRate}% · 고객할인 {creatorMeta.discountRate}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadData(session)}
                disabled={loading}
                className="px-3 py-1.5 border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-mono text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>새로고침</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-mono text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>로그아웃</span>
              </button>
            </div>
          </header>

          {notice && (
            <div className="p-3 border border-white/25 bg-[#0c0d12] text-sm font-mono text-white">{notice}</div>
          )}

          {/* 추천 링크 복사 */}
          <section className="p-4 border border-white/10 bg-[#0c0d12] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              readOnly
              value={refUrl}
              className="flex-1 px-3 py-2 bg-[#07080a] border border-white/15 text-sm font-mono text-zinc-200"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(refUrl).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              className="px-4 py-2 border border-white/30 bg-white/10 hover:bg-white/20 text-sm font-mono text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '복사됨' : '복사'}</span>
            </button>
          </section>

          {/* 4대 실적 KPI */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm font-mono">
            <div className="p-4 border border-white/10 bg-[#0c0d12]">
              <span className="text-zinc-400 block">링크 클릭</span>
              <strong className="text-white text-xl">{clicks}회</strong>
            </div>
            <div className="p-4 border border-white/10 bg-[#0c0d12]">
              <span className="text-zinc-400 block">결제 전환</span>
              <strong className="text-white text-xl">{validPurchases.length}건</strong>
            </div>
            <div className="p-4 border border-white/10 bg-[#0c0d12]">
              <span className="text-zinc-400 block">누적 수수료</span>
              <strong className="text-white text-xl">₩{totalCommission.toLocaleString()}</strong>
            </div>
            <div className="p-4 border border-white/10 bg-[#0c0d12]">
              <span className="text-zinc-400 block">정산 가능 잔액</span>
              <strong className="text-white text-xl">₩{balance.toLocaleString()}</strong>
            </div>
          </section>

          {/* 계좌 등록 및 출금 신청 */}
          <section className="p-5 border border-white/10 bg-[#0c0d12] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif-editorial text-xl text-white font-normal">정산 계좌 · 출금 신청</h2>
              {creatorMeta.payoutRequestedAt && (
                <span className="px-2.5 py-0.5 border border-white/25 text-sm font-mono text-white">
                  출금요청중 ({fmt(creatorMeta.payoutRequestedAt)})
                </span>
              )}
            </div>
            <form onSubmit={handleRequestPayout} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={bankInput}
                onChange={(e) => setBankInput(e.target.value)}
                placeholder="은행명 · 계좌번호 · 예금주"
                className="flex-1 px-4 py-2.5 bg-[#07080a] border border-white/15 text-sm font-mono text-white"
              />
              <button
                type="submit"
                className="px-5 py-2.5 border border-white/30 bg-white/15 hover:bg-white/25 text-sm font-mono text-white font-semibold cursor-pointer"
              >
                출금 신청
              </button>
            </form>
          </section>

          {/* 지급 완료 이력 */}
          <section className="space-y-3">
            <h2 className="font-serif-editorial text-xl text-white font-normal">지급 이력 ({creatorPayouts.length}건)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {creatorPayouts.length === 0 ? (
                <div className="p-4 border border-white/10 bg-[#0c0d12] text-sm font-mono text-zinc-400">
                  지급 완료된 내역이 없습니다.
                </div>
              ) : (
                creatorPayouts.map((p) => (
                  <div key={p.id} className="p-4 border border-white/10 bg-[#0c0d12] space-y-1">
                    <div className="flex items-center justify-between text-sm font-mono">
                      <span className="text-white font-semibold">₩{p.amountKrw.toLocaleString()}</span>
                      <span className="text-zinc-400">{fmt(p.paidAt)}</span>
                    </div>
                    <div className="text-sm font-mono text-zinc-400">{p.bankInfo}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  // 제휴 식당(B2B) 파트너 대시보드
  const statusText =
    venueApp?.status === 'APPROVED'
      ? '제휴 승인 (배정 활성)'
      : venueApp?.status === 'REJECTED'
      ? '심사 반려'
      : '심사 대기중';

  return (
    <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] py-12 px-5 sm:px-8">
      <div className="max-w-[1000px] mx-auto space-y-6">
        <header className="p-4 border border-white/10 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
            <div>
              <h1 className="font-serif-editorial text-2xl text-white font-normal">
                {venueApp?.venueName || session.name}
              </h1>
              <p className="text-sm font-mono text-zinc-400">
                심사 상태: {statusText} · {venueApp?.contactEmail || ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadData(session)}
              disabled={loading}
              className="px-3 py-1.5 border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-mono text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-mono text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>로그아웃</span>
            </button>
          </div>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm font-mono">
          <div className="p-4 border border-white/10 bg-[#0c0d12]">
            <span className="text-zinc-400 block">지역</span>
            <strong className="text-white">{venueApp?.cityCode || '-'}</strong>
          </div>
          <div className="p-4 border border-white/10 bg-[#0c0d12]">
            <span className="text-zinc-400 block">객단가</span>
            <strong className="text-white">{venueApp?.budgetTier || '-'}</strong>
          </div>
          <div className="p-4 border border-white/10 bg-[#0c0d12]">
            <span className="text-zinc-400 block">수용 테이블</span>
            <strong className="text-white">{venueApp?.maxTablesPerNight ?? 0}테이블</strong>
          </div>
          <div className="p-4 border border-white/10 bg-[#0c0d12]">
            <span className="text-zinc-400 block">식단 옵션</span>
            <strong className="text-white">{(venueApp?.supportedDietary || ['NONE']).join(', ')}</strong>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif-editorial text-xl text-white font-normal">
            배정 모임 현황 ({assignedMeetups.length}건)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {assignedMeetups.length === 0 ? (
              <div className="p-4 border border-white/10 bg-[#0c0d12] text-sm font-mono text-zinc-400">
                현재 매장에 배정된 6인 모임 일정이 없습니다.
              </div>
            ) : (
              assignedMeetups.map((m) => (
                <div key={m.meetup_id} className="p-4 border border-white/10 bg-[#0c0d12] space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-white font-medium truncate">{m.title}</span>
                    <span className="px-2 py-0.5 border border-white/20 font-mono text-white shrink-0">{m.status}</span>
                  </div>
                  <div className="text-sm font-mono text-zinc-400">
                    {m.date_text} · 정원 {m.max_capacity ?? 6}명
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
