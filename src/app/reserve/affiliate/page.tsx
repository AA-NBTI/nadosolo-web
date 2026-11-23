'use client';

import React, { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  TABLEBARO_PARTNERS_PRESET,
  tablebaroPartnersEngine as engine,
  type PartnerApplicationRecord,
  type PartnerComputedMetrics,
} from '@/modules/partners';
import { buildTrackedUrl } from '@/modules/tracking';

const SESSION_KEY = TABLEBARO_PARTNERS_PRESET.storageKeys.sessionKey;
const STATUS_LABEL: Record<string, string> = {
  PENDING: '심사',
  APPROVED: '승인',
  REJECTED: '반려',
  SUSPENDED: '정지',
};
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

const inputCls =
  'w-full px-3 py-2.5 bg-black/50 border border-white/20 text-sm font-mono text-white outline-none focus:border-[#3b82f6]';
const btnCls =
  'px-4 py-2.5 border border-white/30 bg-white/10 hover:bg-white/20 text-sm font-mono font-semibold text-white cursor-pointer disabled:opacity-40';

export default function TablebaroPartnersPage() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [session, setSession] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [code, setCode] = useState('');

  const [partner, setPartner] = useState<PartnerApplicationRecord | null>(null);
  const [metrics, setMetrics] = useState<PartnerComputedMetrics | null>(null);
  const [commissionRate, setCommissionRate] = useState(TABLEBARO_PARTNERS_PRESET.defaultCommissionRate);
  const [bank, setBank] = useState('');
  const [venueId, setVenueId] = useState('');
  const [qr, setQr] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [shortBusy, setShortBusy] = useState(false);

  useEffect(() => {
    setSession(localStorage.getItem(SESSION_KEY));
    setReady(true);
  }, []);

  const load = useCallback(async (c: string) => {
    const [apps, events, payouts, metaMap] = await Promise.all([
      engine.fetchApplications(),
      engine.fetchEvents(),
      engine.fetchPayouts(),
      engine.fetchMetaMap(),
    ]);
    const hit = apps.find((a) => a.code.toUpperCase() === c.toUpperCase()) ?? null;
    setPartner(hit);
    setMetrics(engine.computePartnerMetrics(c, events, payouts));
    const meta = metaMap[c.toUpperCase()];
    if (meta) {
      setCommissionRate(meta.commissionRate);
      setBank(meta.bankInfo || '');
    }
  }, []);

  useEffect(() => {
    if (session) void load(session);
  }, [session, load]);

  const approved = partner?.status === 'APPROVED';
  const link = session
    ? buildTrackedUrl(
        typeof window !== 'undefined' ? window.location.origin : '',
        venueId.trim() ? `/reserve/${venueId.trim()}` : '/reserve',
        { ref: session, source: 'affiliate', medium: 'referral', campaign: `tablebaro_${session}` }
      )
    : '';

  useEffect(() => {
    setShortUrl('');
  }, [venueId, session]);

  useEffect(() => {
    if (!link || !approved) {
      setQr('');
      return;
    }
    QRCode.toDataURL(shortUrl || link, { width: 512, margin: 2 }).then(setQr).catch(() => setQr(''));
  }, [link, approved, shortUrl]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await engine.authenticateCreator(identifier, pin);
    setBusy(false);
    if (!res.ok || !res.partner) {
      setError(res.error || '로그인에 실패했습니다.');
      return;
    }
    localStorage.setItem(SESSION_KEY, res.partner.code);
    setSession(res.partner.code);
    setPin('');
  };

  const signup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (pin.trim().length < 4) {
      setBusy(false);
      setError('비밀번호는 4자 이상 입력해 주세요.');
      return;
    }
    const res = await engine.createApplication({
      partnerName: name,
      contactEmail: email,
      channelUrl,
      code,
      passwordPin: pin,
      status: 'PENDING',
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error || '신청에 실패했습니다.');
      return;
    }
    setNotice('신청 완료');
    setTab('LOGIN');
    setIdentifier(code);
    setPin('');
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setPartner(null);
    setMetrics(null);
  };

  const payout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    const res = await engine.requestPayout(session, bank);
    setNotice(res.ok ? '정산 요청 완료' : res.error || '요청에 실패했습니다.');
  };

  if (!ready) return null;

  return (
    <main className="w-full min-h-screen bg-[#07080a] text-[#f5f2eb] px-4 py-10 flex justify-center">
      <div className="w-full max-w-[720px] space-y-4">
        {!session ? (
          <div className="p-8 border border-white/10 bg-[#0c0d12] space-y-6 max-w-[460px] mx-auto w-full">
            <h1 className="font-serif-editorial text-2xl text-white font-normal text-center">테이블바로 어필리에이트</h1>
            <div className="grid grid-cols-2 bg-black/40 p-1 border border-white/10">
              {(['LOGIN', 'SIGNUP'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTab(t);
                    setError(null);
                  }}
                  className={`py-2.5 text-sm font-mono cursor-pointer ${
                    tab === t ? 'border border-white/30 bg-white/10 text-white font-semibold' : 'text-zinc-400 border border-transparent'
                  }`}
                >
                  {t === 'LOGIN' ? '로그인' : '신청'}
                </button>
              ))}
            </div>
            {notice && <div className="p-3 border border-white/20 text-sm font-mono text-white text-center">{notice}</div>}
            {error && <div className="p-3 border border-white/30 text-sm font-mono text-white text-center">{error}</div>}
            {tab === 'LOGIN' ? (
              <form onSubmit={login} className="space-y-3">
                <input className={inputCls} placeholder="추천 코드 또는 이메일" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                <input className={inputCls} type="password" placeholder="비밀번호" value={pin} onChange={(e) => setPin(e.target.value)} required />
                <button type="submit" disabled={busy} className={`${btnCls} w-full`}>
                  {busy ? '확인 중' : '로그인'}
                </button>
              </form>
            ) : (
              <form onSubmit={signup} className="space-y-3">
                <input className={inputCls} placeholder="이름 또는 활동명" value={name} onChange={(e) => setName(e.target.value)} required />
                <input className={inputCls} type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input className={inputCls} placeholder="채널 주소 (블로그·인스타)" value={channelUrl} onChange={(e) => setChannelUrl(e.target.value)} />
                <input className={inputCls} placeholder="추천 코드 (영문·숫자)" value={code} onChange={(e) => setCode(e.target.value)} required />
                <input className={inputCls} type="password" placeholder="비밀번호 (4자 이상)" value={pin} onChange={(e) => setPin(e.target.value)} required />
                <button type="submit" disabled={busy} className={`${btnCls} w-full`}>
                  {busy ? '접수 중' : '신청'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            <header className="p-3 border border-white/10 bg-[#0c0d12] flex flex-wrap items-center gap-3 text-sm font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
              <h1 className="font-serif-editorial text-lg text-white font-normal">어필리에이트</h1>
              <span className="px-2 py-0.5 border border-white/10 text-zinc-300">{session}</span>
              <span className="px-2 py-0.5 border border-white/30 text-white">{STATUS_LABEL[partner?.status || 'PENDING']}</span>
              <button type="button" onClick={logout} className="ml-auto px-3 py-1.5 border border-white/20 bg-white/5 hover:bg-white/10 text-white cursor-pointer">
                로그아웃
              </button>
            </header>

            {notice && <div className="p-3 border border-white/20 text-sm font-mono text-white">{notice}</div>}

            <section className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm font-mono">
              {[
                ['클릭', String(metrics?.clicks ?? 0)],
                ['예약', String(metrics?.purchases ?? 0)],
                ['수수료', won(metrics?.totalCommissionKrw ?? 0)],
                ['잔액', won(metrics?.balanceKrw ?? 0)],
              ].map(([k, v]) => (
                <div key={k} className="p-3 border border-white/10 bg-[#0c0d12]">
                  <div className="text-zinc-400">{k}</div>
                  <div className="text-white text-base mt-1">{v}</div>
                </div>
              ))}
            </section>

            <section className="p-4 border border-white/10 bg-[#0c0d12] space-y-3 text-sm font-mono">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                <h2 className="font-serif-editorial text-lg text-white font-normal">링크</h2>
                <span className="px-2 py-0.5 border border-white/10 text-zinc-400">수수료 {commissionRate}%</span>
              </div>
              {approved ? (
                <>
                  <input className={inputCls} placeholder="매장 코드 (선택)" value={venueId} onChange={(e) => setVenueId(e.target.value)} />
                  <p className="text-zinc-200 break-all">{link}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(shortUrl || link);
                        setNotice('복사 완료');
                      }}
                      className={btnCls}
                    >
                      복사
                    </button>
                    <button
                      type="button"
                      disabled={shortBusy}
                      onClick={async () => {
                        setShortBusy(true);
                        try {
                          const res = await fetch('/api/short', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ service: 'TABLEBARO', targetUrl: link, label: session || undefined }),
                          });
                          const data = await res.json();
                          if (data.ok && data.shortPath) {
                            const s = `${window.location.origin}${data.shortPath}`;
                            setShortUrl(s);
                            void navigator.clipboard.writeText(s);
                            setNotice(`단축링크 생성 및 복사: ${s}`);
                          }
                        } finally {
                          setShortBusy(false);
                        }
                      }}
                      className={btnCls}
                    >
                      {shortBusy ? '생성 중' : '단축링크'}
                    </button>
                    {qr && (
                      <a href={qr} download={`tablebaro-${session}.png`} className={btnCls}>
                        QR저장
                      </a>
                    )}
                  </div>
                  {shortUrl && <p className="text-white font-bold">단축: {shortUrl}</p>}
                  {qr && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qr} alt="QR" width={140} height={140} className="bg-white p-1" />
                  )}
                </>
              ) : (
                <p className="text-zinc-300">승인 후 링크가 발급됩니다.</p>
              )}
            </section>

            <form onSubmit={payout} className="p-4 border border-white/10 bg-[#0c0d12] space-y-3 text-sm font-mono">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                <h2 className="font-serif-editorial text-lg text-white font-normal">정산</h2>
              </div>
              <input className={inputCls} placeholder="은행 · 계좌 · 예금주" value={bank} onChange={(e) => setBank(e.target.value)} />
              <button type="submit" className={btnCls}>
                요청
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
