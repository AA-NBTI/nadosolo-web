'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Copy, Check, LogOut, RefreshCw } from 'lucide-react';
import { buildTrackedUrl } from '@/modules/tracking';
import {
  AffiliateApplicationRow,
  AffiliateEventLog,
  AffiliatePayoutRecord,
  PartnerMeta,
  authenticateCreatorPartner,
  fetchAffiliateApplications,
  fetchAffiliateEvents,
  fetchAffiliatePayouts,
  fetchPartnerMetaMap,
  requestCreatorPayout,
} from '@/lib/affiliateDb';

const PARTNER_SESSION_KEY = 'nadosolo_partner_session_v1';

interface PartnerSession {
  role: 'CREATOR';
  identifier: string;
  name: string;
}

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString('ko-KR') : '-');

/**
 * 순수 어필리에이트(크리에이터) 전용 포털.
 * - 예약 업체(식당·숙박·공간) 포털은 독립 서비스 `/biz` 로 분리됨.
 */
export default function PartnerPortalDashboardPage() {
  const [identifier, setIdentifier] = useState('');
  const [passwordPin, setPasswordPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [session, setSession] = useState<PartnerSession | null>(null);
  const [ready, setReady] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [creatorApp, setCreatorApp] = useState<AffiliateApplicationRow | null>(null);
  const [creatorMeta, setCreatorMeta] = useState<PartnerMeta>({ commissionRate: 10, discountRate: 10 });
  const [creatorEvents, setCreatorEvents] = useState<AffiliateEventLog[]>([]);
  const [creatorPayouts, setCreatorPayouts] = useState<AffiliatePayoutRecord[]>([]);
  const [bankInput, setBankInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [shortBusy, setShortBusy] = useState(false);

  useEffect(() => {
    const c = creatorApp?.code || session?.identifier;
    if (!c || typeof window === 'undefined') {
      setQr('');
      return;
    }
    const url =
      shortUrl ||
      buildTrackedUrl(window.location.origin, '/meetup', {
        ref: c,
        source: 'affiliate',
        medium: 'referral',
        campaign: `nadosolo_${c}`,
      });
    QRCode.toDataURL(url, { width: 512, margin: 2 }).then(setQr).catch(() => setQr(''));
  }, [creatorApp?.code, session?.identifier, shortUrl]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(PARTNER_SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { role?: string; identifier?: string; name?: string };
          if (parsed?.role === 'CREATOR' && parsed?.identifier) {
            setSession({ role: 'CREATOR', identifier: parsed.identifier, name: parsed.name || '' });
          } else if (parsed?.role === 'VENUE') {
            localStorage.removeItem(PARTNER_SESSION_KEY);
          }
        }
      } catch {}
    }
    setReady(true);
  }, []);

  const loadData = useCallback(async (sess: PartnerSession) => {
    setLoading(true);
    try {
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) void loadData(session);
  }, [session, loadData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
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
  };

  const handleLogout = () => {
    localStorage.removeItem(PARTNER_SESSION_KEY);
    setSession(null);
    setCreatorApp(null);
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

  if (!ready) return <main className="min-h-screen bg-[#07080a]" />;

  if (!session) {
    return (
      <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] py-16 px-5 sm:px-8 flex items-center justify-center">
        <div className="w-full max-w-md border border-white/15 bg-[#0c0d12] p-6 sm:p-8 space-y-6">
          <div className="space-y-2 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
              <span className="text-sm font-mono text-zinc-300 uppercase">AFFILIATE PORTAL</span>
            </div>
            <h1 className="font-serif-editorial text-3xl text-white font-normal">어필리에이트 로그인</h1>
            <p className="text-sm text-zinc-400">
              크리에이터 추천 성과 및 커미션 정산 전용 워크스페이스입니다.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 text-sm">
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="추천 코드 또는 신청 이메일"
              className="w-full px-4 py-3 bg-[#07080a] border border-white/15 text-white font-mono"
            />
            <input
              type="password"
              required
              value={passwordPin}
              onChange={(e) => setPasswordPin(e.target.value)}
              placeholder="비밀번호"
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
              어필리에이트 신청 →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const clicks = creatorEvents.filter((e) => e.eventType === 'CLICK').length;
  const validPurchases = creatorEvents.filter((e) => e.eventType === 'PURCHASE' && !e.blockedSelfReferral);
  const totalCommission = validPurchases.reduce((s, e) => s + (e.commissionKrw || 0), 0);
  const paidTotal = creatorPayouts.reduce((s, p) => s + (p.amountKrw || 0), 0);
  const balance = Math.max(0, totalCommission - paidTotal);
  const activeCode = creatorApp?.code || session.identifier;
  const refUrl =
    typeof window !== 'undefined'
      ? buildTrackedUrl(window.location.origin, '/meetup', {
          ref: activeCode,
          source: 'affiliate',
          medium: 'referral',
          campaign: `nadosolo_${activeCode}`,
        })
      : `/meetup?ref=${activeCode}&utm_source=affiliate&utm_medium=referral&utm_campaign=nadosolo_${activeCode}`;

  return (
    <main className="min-h-screen bg-[#07080a] text-[#f5f2eb] py-12 px-5 sm:px-8">
      <div className="max-w-[1000px] mx-auto space-y-6">
        <header className="p-4 border border-white/10 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
            <div>
              <h1 className="font-serif-editorial text-2xl text-white font-normal">
                {creatorApp?.partnerName || session.name}
              </h1>
              <p className="text-sm font-mono text-zinc-400">
                코드: {creatorApp?.code || session.identifier} · 커미션 {creatorMeta.commissionRate}% · 지인할인 {creatorMeta.discountRate}%
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
          <div className="p-3 border border-white/25 bg-white/5 text-sm font-mono text-white">{notice}</div>
        )}

        <section className="p-5 border border-white/10 bg-[#0c0d12] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-mono text-zinc-300">내 전용 홍보 링크</span>
            <span className="text-sm font-mono text-zinc-400">
              가입 시 할인코드: <strong className="text-white">{creatorApp?.code || session.identifier}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={refUrl}
              className="flex-1 px-3 py-2 bg-[#07080a] border border-white/15 text-sm font-mono text-zinc-200"
            />
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(refUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              className="px-4 py-2 border border-white/25 bg-white/10 hover:bg-white/20 text-sm font-mono text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '복사됨' : '복사'}</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                setShortBusy(true);
                try {
                  const res = await fetch('/api/short', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ service: 'NADOSOLO', targetUrl: refUrl, label: activeCode }),
                  });
                  const data = await res.json();
                  if (data.ok && data.shortPath) {
                    const s = `${window.location.origin}${data.shortPath}`;
                    setShortUrl(s);
                    void navigator.clipboard.writeText(s);
                    setNotice(`단축링크 생성 및 복사 완료: ${s}`);
                  }
                } finally {
                  setShortBusy(false);
                }
              }}
              disabled={shortBusy}
              className="px-4 py-2 border border-white/25 bg-white/10 hover:bg-white/20 text-sm font-mono text-white cursor-pointer disabled:opacity-40"
            >
              {shortBusy ? '생성 중' : '단축링크'}
            </button>
            {qr && (
              <a
                href={qr}
                download={`nadosolo-${creatorApp?.code || session.identifier}.png`}
                className="px-4 py-2 border border-white/25 bg-white/10 hover:bg-white/20 text-sm font-mono text-white cursor-pointer"
              >
                QR저장
              </a>
            )}
          </div>
          {shortUrl && (
            <div className="text-sm font-mono text-zinc-200">
              단축링크: <span className="text-white font-bold">{shortUrl}</span>
            </div>
          )}
          {qr && (
            <div className="pt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="홍보 QR" width={120} height={120} className="bg-white p-1" />
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm font-mono">
          <div className="p-4 border border-white/10 bg-[#0c0d12]">
            <span className="text-zinc-400 block">링크 클릭</span>
            <strong className="text-white text-xl">{clicks}회</strong>
          </div>
          <div className="p-4 border border-white/10 bg-[#0c0d12]">
            <span className="text-zinc-400 block">전환 결제</span>
            <strong className="text-white text-xl">{validPurchases.length}건</strong>
          </div>
          <div className="p-4 border border-white/10 bg-[#0c0d12]">
            <span className="text-zinc-400 block">총 누적 커미션</span>
            <strong className="text-white text-xl">₩{totalCommission.toLocaleString()}</strong>
          </div>
          <div className="p-4 border border-white/10 bg-[#0c0d12]">
            <span className="text-zinc-400 block">정산 가능 잔액</span>
            <strong className="text-white text-xl">₩{balance.toLocaleString()}</strong>
          </div>
        </section>

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
