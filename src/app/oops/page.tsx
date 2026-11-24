'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Flame,
  Flag,
  Globe,
  Pin,
  Radio,
  Receipt,
  Send,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { OOPS_DICT, OOPS_LOCALES, type OopsLocale } from '@/lib/oops/i18n';
import { FEED_I18N } from '@/lib/oops/feedI18n';
import type { FeedSortTab, OopsSignal, SignalCategory } from '@/lib/oops/signalStore';

const CATEGORIES: SignalCategory[] = ['GLITCH', 'REBEL', 'HALLUCINATION', 'ALERT'];

const CATEGORY_COLORS: Record<SignalCategory, string> = {
  GLITCH: 'bg-[#ffc900] text-black',
  REBEL: 'bg-[#ff90e8] text-black',
  HALLUCINATION: 'bg-[#a3e635] text-black',
  ALERT: 'bg-[#ff4d00] text-white',
};

function formatTimeAgo(iso: string, locale: OopsLocale): string {
  const diffSec = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return locale === 'ko' ? `${diffSec}초 전` : `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return locale === 'ko' ? `${diffMin}분 전` : `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return locale === 'ko' ? `${diffHr}시간 전` : `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return locale === 'ko' ? `${diffDay}일 전` : `${diffDay}d`;
}

/** 브라우저 Web Crypto API 기반 경량 PoW 연산 (< 5ms) */
async function solvePowChallenge(): Promise<{ challenge: string; nonce: string }> {
  const challenge = `${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  const encoder = new TextEncoder();
  for (let i = 0; i < 5000; i++) {
    const nonce = i.toString(36);
    const buf = await crypto.subtle.digest('SHA-256', encoder.encode(`${challenge}:${nonce}`));
    const hex = Array.from(new Uint8Array(buf))
      .slice(0, 2)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    if (hex.startsWith('00')) {
      return { challenge, nonce };
    }
  }
  return { challenge, nonce: '0' };
}

function getOrCreateAgentId(): string {
  if (typeof window === 'undefined') return 'OP-ANON00';
  let id = localStorage.getItem('oops_agent_id_v1');
  if (!id) {
    const hex = Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .toUpperCase()
      .padStart(6, '0');
    id = `OP-${hex}`;
    localStorage.setItem('oops_agent_id_v1', id);
  }
  return id;
}

function OopsSnsMainContent() {
  // 서구권 English-First 기본값 ('en')
  const [locale, setLocale] = useState<OopsLocale>('en');
  const t = OOPS_DICT[locale];
  const f = FEED_I18N[locale];

  const [agentId, setAgentId] = useState<string>('');
  const [tab, setTab] = useState<FeedSortTab>('HOT');
  const [signals, setSignals] = useState<OopsSignal[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer state
  const [category, setCategory] = useState<SignalCategory>('GLITCH');
  const [content, setContent] = useState('');
  const [callsign, setCallsign] = useState('');
  const [dispatchBusy, setDispatchBusy] = useState(false);
  const [dispatchErr, setDispatchErr] = useState<string | null>(null);

  // Local vote/flag memory
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  // Modals
  const [showManifesto, setShowManifesto] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [receiptSignal, setReceiptSignal] = useState<OopsSignal | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Criteria Backer Application state
  const [backerName, setBackerName] = useState('');
  const [backerOrg, setBackerOrg] = useState('');
  const [backerEmail, setBackerEmail] = useState('');
  const [backerMessage, setBackerMessage] = useState('');
  const [backerBusy, setBackerBusy] = useState(false);
  const [backerDone, setBackerDone] = useState<string | null>(null);

  useEffect(() => {
    const savedLoc = localStorage.getItem('oops_locale_v1') as OopsLocale | null;
    if (savedLoc && OOPS_DICT[savedLoc]) {
      setLocale(savedLoc);
    }
    const id = getOrCreateAgentId();
    setAgentId(id);

    try {
      const savedVotes = JSON.parse(localStorage.getItem('oops_voted_ids_v1') || '[]');
      if (Array.isArray(savedVotes)) setVotedIds(new Set(savedVotes));
      const savedFlags = JSON.parse(localStorage.getItem('oops_flagged_ids_v1') || '[]');
      if (Array.isArray(savedFlags)) setFlaggedIds(new Set(savedFlags));
      const savedCallsign = localStorage.getItem('oops_callsign_v1') || '';
      if (savedCallsign) setCallsign(savedCallsign);
    } catch {}
  }, []);

  const changeLocale = (next: OopsLocale) => {
    setLocale(next);
    localStorage.setItem('oops_locale_v1', next);
  };

  const loadFeed = useCallback(
    async (activeTab: FeedSortTab, myId: string) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/oops/signals?tab=${activeTab}&agentId=${encodeURIComponent(myId)}`
        );
        const data = await res.json();
        if (data.ok && Array.isArray(data.signals)) {
          setSignals(data.signals);
        }
      } catch {} finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (agentId) {
      void loadFeed(tab, agentId);
    }
  }, [tab, agentId, loadFeed]);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (text.length < 3) return;
    setDispatchBusy(true);
    setDispatchErr(null);

    try {
      const { challenge, nonce } = await solvePowChallenge();
      const myId = agentId || getOrCreateAgentId();
      if (callsign.trim()) {
        localStorage.setItem('oops_callsign_v1', callsign.trim());
      }

      const res = await fetch('/api/oops/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorAgentId: myId,
          authorCallsign: callsign.trim() || myId,
          category,
          content: text,
          powChallenge: challenge,
          powNonce: nonce,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (res.status === 429) setDispatchErr(f.errRateLimit);
        else if (String(data.error || '').toLowerCase().includes('url')) setDispatchErr(f.errUrlBlocked);
        else setDispatchErr(data.error || 'Dispatch error');
        return;
      }

      setContent('');
      setSignals((prev) => [data.signal, ...prev]);
    } catch {
      setDispatchErr('Network error');
    } finally {
      setDispatchBusy(false);
    }
  };

  const handleVote = async (sigId: string, voteType: 'UP' | 'REPORT') => {
    const myId = agentId || getOrCreateAgentId();
    if (voteType === 'UP' && votedIds.has(sigId)) return;
    if (voteType === 'REPORT' && flaggedIds.has(sigId)) return;

    if (voteType === 'UP') {
      const next = new Set(votedIds).add(sigId);
      setVotedIds(next);
      localStorage.setItem('oops_voted_ids_v1', JSON.stringify(Array.from(next)));
      setSignals((prev) =>
        prev.map((s) => (s.id === sigId ? { ...s, upvotes: s.upvotes + 1 } : s))
      );
    } else {
      const next = new Set(flaggedIds).add(sigId);
      setFlaggedIds(next);
      localStorage.setItem('oops_flagged_ids_v1', JSON.stringify(Array.from(next)));
    }

    try {
      const res = await fetch('/api/oops/signals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalId: sigId, agentId: myId, voteType }),
      });
      const data = await res.json();
      if (voteType === 'REPORT' && data.autoHidden) {
        setSignals((prev) => prev.filter((s) => s.id !== sigId));
      }
    } catch {}
  };

  const copyReceiptText = () => {
    if (!receiptSignal) return;
    const text = `[OOPS.MONSTER // CASE #OP-${String(receiptSignal.caseNum).padStart(4, '0')}]\n[${f.categories[receiptSignal.category]}]\n"${receiptSignal.content}"\n✊ ${receiptSignal.upvotes} Human Wins · https://oops.monster`;
    void navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const shareReceiptOnX = () => {
    if (!receiptSignal) return;
    const text = encodeURIComponent(
      `[OOPS CASE #OP-${String(receiptSignal.caseNum).padStart(4, '0')}]\n"${receiptSignal.content}"\n\nHuman Resistance Network:`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=https://oops.monster`, '_blank');
  };

  const submitBacker = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackerBusy(true);
    setBackerDone(null);
    try {
      const res = await fetch('/api/oops/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BACKER_APPLY',
          name: backerName,
          org: backerOrg,
          email: backerEmail,
          tier: 'PROTOCOL_APPLICANT',
          message: backerMessage,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setBackerDone(`${t.msgBackerDone} ${data.backerId}`);
        setBackerName('');
        setBackerOrg('');
        setBackerEmail('');
        setBackerMessage('');
      }
    } finally {
      setBackerBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-black flex flex-col font-sans">
      {/* 1. 상단 네비게이션 */}
      <header className="sticky top-0 z-40 bg-[#f4f4f0] border-b-2 border-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Link
              href="/oops"
              className="group inline-flex items-center gap-1.5 select-none cursor-pointer"
              title="OOPS Home"
            >
              <span className="inline-block px-3 py-1 bg-[#ff4d00] text-white font-black text-base sm:text-lg font-mono tracking-tighter border-2 border-black shadow-[3px_3px_0px_#000] -rotate-2 group-hover:rotate-0 group-hover:scale-105 group-active:translate-x-[2px] group-active:translate-y-[2px] group-active:shadow-none transition-all uppercase">
                oops!
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-black tracking-tight hidden sm:inline">
                .monster
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setShowManifesto(true)}
              className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-black font-bold text-xs font-mono border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              {f.navManifesto}
            </button>

            <button
              type="button"
              onClick={() => setShowCriteria(true)}
              className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-black font-bold text-xs font-mono border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer hidden xs:inline-block"
            >
              {f.navCriteria}
            </button>

            <a
              href="/app"
              className="px-2.5 py-1.5 bg-[#ffc900] hover:bg-[#ffd633] text-black font-black text-xs font-mono border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{f.navApp}</span>
            </a>

            {/* 언어 스위처 (EN 기본 / KO 검수 전환 가능) */}
            <div className="flex items-center bg-white border-2 border-black shadow-[2px_2px_0px_#000] px-1 py-0.5 gap-0.5">
              <Globe className="w-3.5 h-3.5 mx-1 text-zinc-600 hidden md:block" />
              {OOPS_LOCALES.map((loc) => (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => changeLocale(loc.code)}
                  className={`px-1.5 py-0.5 text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                    locale === loc.code
                      ? 'bg-black text-white'
                      : 'text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* 2. 한 줄 압축 슬로건 바 */}
      <div className="bg-black text-white border-b-2 border-black px-4 py-2">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 truncate">
            <Radio className="w-3.5 h-3.5 text-[#ff4d00] animate-pulse shrink-0" />
            <span className="font-bold truncate">{f.tagline}</span>
          </div>
          <span className="text-[11px] text-[#ffc900] shrink-0 hidden sm:inline">
            {agentId || 'OP-ACTIVE'}
          </span>
        </div>
      </div>

      {/* 3. 메인 라이브 무전 피드 (트렌디한 First-Screen SNS) */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* 3-1. 로그인 없는 한 줄 타전기 (Signal Composer) */}
        <section className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 text-xs font-mono font-black border-2 border-black cursor-pointer transition-all ${
                    category === cat
                      ? `${CATEGORY_COLORS[cat]} shadow-[2px_2px_0_#000]`
                      : 'bg-[#f4f4f0] text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {f.categories[cat]}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-mono text-zinc-500">{f.noLoginHint}</span>
          </div>

          <form onSubmit={handleDispatch} className="space-y-3">
            <textarea
              rows={2}
              maxLength={200}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={f.composerPlaceholder}
              className="w-full px-3.5 py-2.5 bg-[#f4f4f0] border-2 border-black text-sm sm:text-base font-medium focus:outline-none focus:bg-white resize-none"
            />

            {dispatchErr && (
              <div className="p-2 bg-[#ff4d00]/15 border-2 border-black text-xs font-mono font-bold text-red-900">
                {dispatchErr}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                <input
                  type="text"
                  maxLength={20}
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  placeholder={f.callsignPlaceholder}
                  className="w-full max-w-[200px] px-3 py-1.5 bg-[#f4f4f0] border-2 border-black text-xs font-mono focus:outline-none focus:bg-white"
                />
                <span className="text-xs font-mono text-zinc-500">
                  {content.length}/200
                </span>
              </div>

              <button
                type="submit"
                disabled={dispatchBusy || content.trim().length < 3}
                className="px-6 py-2.5 bg-[#ff4d00] hover:bg-[#ff621f] text-white font-black text-sm font-mono border-2 border-black shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{dispatchBusy ? f.dispatchingBtn : f.dispatchBtn}</span>
              </button>
            </div>
          </form>
        </section>

        {/* 3-2. 3대 랭킹 정렬 탭 (HOT / LIVE / TOP) */}
        <div className="flex items-center gap-2 border-b-2 border-black pb-3">
          <button
            type="button"
            onClick={() => setTab('HOT')}
            className={`px-3.5 py-1.5 text-xs font-mono font-black border-2 border-black cursor-pointer flex items-center gap-1.5 transition-all ${
              tab === 'HOT'
                ? 'bg-[#ffc900] text-black shadow-[2px_2px_0_#000]'
                : 'bg-white text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{f.tabs.HOT}</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('LIVE')}
            className={`px-3.5 py-1.5 text-xs font-mono font-black border-2 border-black cursor-pointer flex items-center gap-1.5 transition-all ${
              tab === 'LIVE'
                ? 'bg-[#a3e635] text-black shadow-[2px_2px_0_#000]'
                : 'bg-white text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{f.tabs.LIVE}</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('TOP')}
            className={`px-3.5 py-1.5 text-xs font-mono font-black border-2 border-black cursor-pointer flex items-center gap-1.5 transition-all ${
              tab === 'TOP'
                ? 'bg-[#ff90e8] text-black shadow-[2px_2px_0_#000]'
                : 'bg-white text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{f.tabs.TOP}</span>
          </button>
        </div>

        {/* 3-3. 라이브 피드 목록 */}
        <section className="space-y-4">
          {loading && signals.length === 0 ? (
            <div className="p-10 text-center bg-white border-2 border-black font-mono text-sm font-bold">
              INTERCEPTING SIGNALS...
            </div>
          ) : signals.length === 0 ? (
            <div className="p-10 text-center bg-white border-2 border-black font-mono text-sm text-zinc-600">
              {f.emptyFeed}
            </div>
          ) : (
            signals.map((sig) => {
              const hasVoted = votedIds.has(sig.id);
              const hasFlagged = flaggedIds.has(sig.id);
              const caseStr = `CASE #OP-${String(sig.caseNum || 100).padStart(4, '0')}`;

              return (
                <article
                  key={sig.id}
                  className={`bg-white border-2 border-black p-4 sm:p-5 space-y-3 transition-all ${
                    sig.isPinned
                      ? 'shadow-[6px_6px_0_#ff4d00]'
                      : 'shadow-[4px_4px_0_#000]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex flex-wrap items-center gap-2">
                      {sig.isPinned && (
                        <span className="px-2 py-0.5 bg-[#ff4d00] text-white font-black border border-black flex items-center gap-1">
                          <Pin className="w-3 h-3" />
                          <span>{f.pinnedBadge}</span>
                        </span>
                      )}
                      <span className="font-black text-black bg-[#f4f4f0] px-2 py-0.5 border border-black">
                        {caseStr}
                      </span>
                      <span
                        className={`px-2 py-0.5 font-bold border border-black ${
                          CATEGORY_COLORS[sig.category] || 'bg-zinc-200'
                        }`}
                      >
                        {f.categories[sig.category]}
                      </span>
                    </div>

                    <div className="text-zinc-600 font-bold">
                      @{sig.authorCallsign} · {formatTimeAgo(sig.createdAt, locale)}
                    </div>
                  </div>

                  <p className="text-sm sm:text-base font-bold text-black leading-relaxed break-words">
                    {sig.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-black/15">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleVote(sig.id, 'UP')}
                        className={`px-3 py-1.5 text-xs font-mono font-black border-2 border-black cursor-pointer flex items-center gap-1.5 transition-all ${
                          hasVoted
                            ? 'bg-black text-[#ffc900]'
                            : 'bg-[#ffc900] hover:bg-[#ffd633] text-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px]'
                        }`}
                      >
                        <span>✊</span>
                        <span>{f.upvoteBtn}</span>
                        <span className="px-1.5 py-0.2 bg-white text-black border border-black ml-0.5">
                          {sig.upvotes}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReceiptSignal(sig)}
                        className="px-3 py-1.5 bg-white hover:bg-zinc-100 text-black text-xs font-mono font-bold border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>{f.receiptBtn}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={hasFlagged}
                      onClick={() => handleVote(sig.id, 'REPORT')}
                      title={hasFlagged ? f.reportedMsg : f.reportBtn}
                      className={`px-2 py-1 text-xs font-mono border border-black cursor-pointer flex items-center gap-1 ${
                        hasFlagged
                          ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
                          : 'bg-white hover:bg-red-50 text-zinc-600 hover:text-red-700'
                      }`}
                    >
                      <Flag className="w-3 h-3" />
                      <span className="hidden sm:inline">{f.reportBtn}</span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>

      {/* 4. 푸터 (맨 아래 OOPS.MONSTER 클릭 시 관제실 /hq 이동) */}
      <footer className="border-t-2 border-black bg-white py-6 px-5 text-xs font-mono mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-bold flex items-center gap-1.5">
            <Link
              href="/hq"
              className="px-1.5 py-0.5 bg-[#ffc900] hover:bg-[#ffd633] text-black border-2 border-black shadow-[1.5px_1.5px_0_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              title="HQ Command Console"
            >
              OOPS.MONSTER
            </Link>
            <span className="text-zinc-700">· AI RESISTANCE HEADQUARTERS</span>
          </div>
          <div className="text-zinc-600">{t.footerRight}</div>
        </div>
      </footer>

      {/* 모달 1: 선언문 (MANIFESTO) */}
      {showManifesto && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#f4f4f0] border-2 border-black shadow-[8px_8px_0_#000] max-h-[88vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <span className="px-2.5 py-0.5 bg-black text-white text-xs font-mono font-bold">
                {t.manifestoTag}
              </span>
              <button
                type="button"
                onClick={() => setShowManifesto(false)}
                className="p-1 bg-white border-2 border-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black leading-tight">
              {t.heroTitlePre}{' '}
              <span className="bg-[#ffc900] px-1.5 border border-black inline-block">
                {t.heroTitleHighlight}
              </span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-800 font-medium">{t.heroDesc}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {t.pillars.map((p, idx) => (
                <div key={p.code} className="bg-white border-2 border-black p-3.5 space-y-1.5">
                  <span
                    className={`inline-block text-[11px] font-mono font-bold px-2 py-0.5 border border-black ${
                      idx === 0 ? 'bg-[#ff90e8]' : idx === 1 ? 'bg-[#ffc900]' : 'bg-[#a3e635]'
                    }`}
                  >
                    {p.code}
                  </span>
                  <h3 className="font-black text-sm">{p.title}</h3>
                  <p className="text-xs text-zinc-700">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 모달 2: 본부 참여 기준 및 승인 요청 (CRITERIA) */}
      {showCriteria && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border-2 border-black shadow-[8px_8px_0_#000] max-h-[88vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-black text-white text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#ffc900]" />
                <span>{t.backerTag}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCriteria(false)}
                className="p-1 bg-[#f4f4f0] border-2 border-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black">{t.backerTitle}</h2>
              <p className="text-sm text-zinc-700 font-medium">{t.backerDesc}</p>
            </div>

            <form onSubmit={submitBacker} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <input
                type="text"
                required
                value={backerName}
                onChange={(e) => setBackerName(e.target.value)}
                placeholder={t.namePlaceholder}
                className="px-3.5 py-2.5 bg-[#f4f4f0] border-2 border-black text-sm focus:outline-none focus:bg-white"
              />
              <input
                type="text"
                value={backerOrg}
                onChange={(e) => setBackerOrg(e.target.value)}
                placeholder={t.orgPlaceholder}
                className="px-3.5 py-2.5 bg-[#f4f4f0] border-2 border-black text-sm focus:outline-none focus:bg-white"
              />
              <input
                type="email"
                required
                value={backerEmail}
                onChange={(e) => setBackerEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="sm:col-span-2 px-3.5 py-2.5 bg-[#f4f4f0] border-2 border-black text-sm focus:outline-none focus:bg-white"
              />
              <textarea
                rows={3}
                value={backerMessage}
                onChange={(e) => setBackerMessage(e.target.value)}
                placeholder={t.msgPlaceholder}
                className="sm:col-span-2 px-3.5 py-2.5 bg-[#f4f4f0] border-2 border-black text-sm focus:outline-none focus:bg-white"
              />
              <div className="sm:col-span-2 flex items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={backerBusy}
                  className="px-6 py-2.5 bg-black hover:bg-zinc-800 text-white font-black text-sm border-2 border-black shadow-[3px_3px_0_#ff90e8] cursor-pointer disabled:opacity-50"
                >
                  {backerBusy ? t.submittingBtn : t.submitBtn}
                </button>
                {backerDone && (
                  <span className="text-xs font-mono font-bold bg-[#a3e635]/50 border-2 border-black px-3 py-1.5">
                    {backerDone}
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 모달 3: 사건 박제 영수증 카드 (RECEIPT) */}
      {receiptSignal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border-4 border-black shadow-[10px_10px_0_#ffc900] p-6 space-y-4 font-mono">
            <div className="flex items-center justify-between border-b-2 border-dashed border-black pb-3">
              <div className="flex items-center gap-1.5 font-black text-xs">
                <ShieldAlert className="w-4 h-4 text-[#ff4d00]" />
                <span>{f.receiptModalTitle}</span>
              </div>
              <button
                type="button"
                onClick={() => setReceiptSignal(null)}
                className="p-1 border border-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#f4f4f0] border-2 border-black p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>CASE #OP-{String(receiptSignal.caseNum).padStart(4, '0')}</span>
                <span className={`px-2 py-0.5 border border-black ${CATEGORY_COLORS[receiptSignal.category]}`}>
                  {f.categories[receiptSignal.category]}
                </span>
              </div>
              <p className="font-sans font-black text-base text-black leading-snug">
                &ldquo;{receiptSignal.content}&rdquo;
              </p>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-black/20">
                <span>@{receiptSignal.authorCallsign}</span>
                <span className="font-black">✊ {receiptSignal.upvotes}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={copyReceiptText}
                className="flex-1 py-2.5 bg-white hover:bg-zinc-100 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0_#000] cursor-pointer"
              >
                {copiedReceipt ? f.copiedBtn : f.copyReceiptBtn}
              </button>
              <button
                type="button"
                onClick={shareReceiptOnX}
                className="flex-1 py-2.5 bg-black hover:bg-zinc-800 text-white font-black text-xs border-2 border-black shadow-[2px_2px_0_#ff90e8] cursor-pointer"
              >
                {f.shareXBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OopsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f4f0]" />}>
      <OopsSnsMainContent />
    </Suspense>
  );
}
