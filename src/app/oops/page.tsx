'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  ChevronDown,
  Flame,
  Flag,
  Globe,
  Languages,
  MessageSquare,
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
import type {
  FeedSortTab,
  OopsSignal,
  OopsSignalReply,
  SignalCategory,
  SignalVoteType,
} from '@/lib/oops/signalStore';
import {
  captureAttribution,
  loadAttribution,
} from '@/modules/tracking';

const OOPS_ATTRIBUTION_KEY = 'oops_attribution_v1';

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

  // Auto full-page translation state (Chrome-style batch translation)
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [replyTranslations, setReplyTranslations] = useState<Record<string, string>>({});
  const [showOriginalIds, setShowOriginalIds] = useState<Set<string>>(new Set());

  // 1-Depth Micro-Reply state
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [repliesMap, setRepliesMap] = useState<Record<string, OopsSignalReply[]>>({});
  const [replyText, setReplyText] = useState('');
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyErr, setReplyErr] = useState<string | null>(null);

  // Modals & Dropdowns
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [showEmblemModal, setShowEmblemModal] = useState(false);
  const [showManifesto, setShowManifesto] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [receiptSignal, setReceiptSignal] = useState<OopsSignal | null>(null);
  const [receiptQrDataUrl, setReceiptQrDataUrl] = useState<string>('');
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
    } else {
      const cookieMatch = document.cookie.match(/(?:^|;\s*)oops_geo_locale=(en|ko|ja|zh|es)/);
      const geoLoc = cookieMatch?.[1] as OopsLocale | undefined;
      if (geoLoc && OOPS_DICT[geoLoc]) {
        setLocale(geoLoc);
      }
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

    // UTM / QR / 추천 유입 자동 캡처 및 VISIT 추적
    try {
      const captured = captureAttribution(localStorage, OOPS_ATTRIBUTION_KEY, window.location.search);
      const visitSentKey = 'oops_visit_tracked_v1';
      if (!sessionStorage.getItem(visitSentKey)) {
        sessionStorage.setItem(visitSentKey, '1');
        const activeAttr = captured || loadAttribution(localStorage, OOPS_ATTRIBUTION_KEY);
        void fetch('/api/tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: 'OOPS',
            type: 'VISIT',
            path: window.location.pathname,
            attribution: activeAttr,
          }),
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!receiptSignal) {
      setReceiptQrDataUrl('');
      return;
    }
    const qrTarget = `https://oops.monster/?utm_source=receipt&utm_medium=qr&utm_campaign=case_${receiptSignal.caseNum}`;
    void QRCode.toDataURL(qrTarget, {
      width: 120,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setReceiptQrDataUrl);
  }, [receiptSignal]);

  const changeLocale = (next: OopsLocale) => {
    setLocale(next);
    localStorage.setItem('oops_locale_v1', next);
  };

  const toggleShowOriginal = (sigId: string) => {
    setShowOriginalIds((prev) => {
      const next = new Set(prev);
      if (next.has(sigId)) next.delete(sigId);
      else next.add(sigId);
      return next;
    });
  };

  // 크롬 전체 번역처럼 피드 전체를 현재 선택된 언어로 자동 배치 번역
  useEffect(() => {
    if (signals.length === 0) return;
    const missing = signals.filter((s) => !translations[`${s.id}:${locale}`]);
    if (missing.length === 0) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/oops/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texts: missing.map((s) => s.content),
            targetLang: locale,
          }),
        });
        const data = await res.json();
        if (!cancelled && data.ok && Array.isArray(data.translatedTexts)) {
          setTranslations((prev) => {
            const next = { ...prev };
            missing.forEach((s, idx) => {
              next[`${s.id}:${locale}`] = data.translatedTexts[idx] || s.content;
            });
            return next;
          });
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [signals, locale, translations]);

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

      // 유입 채널 기준 타전 전환(CONVERSION) 기록
      try {
        const attr = loadAttribution(localStorage, OOPS_ATTRIBUTION_KEY);
        void fetch('/api/tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: 'OOPS',
            type: 'CONVERSION',
            path: window.location.pathname,
            attribution: attr,
            orderId: data.signal.id,
          }),
        });
      } catch {}
    } catch {
      setDispatchErr('Network error');
    } finally {
      setDispatchBusy(false);
    }
  };

  const handleVote = async (sigId: string, voteType: SignalVoteType) => {
    const myId = agentId || getOrCreateAgentId();
    const voteKey = `${sigId}:${voteType}`;

    if (voteType !== 'REPORT' && votedIds.has(voteKey)) return;
    if (voteType === 'REPORT' && flaggedIds.has(sigId)) return;

    if (voteType !== 'REPORT') {
      const next = new Set(votedIds).add(voteKey);
      setVotedIds(next);
      localStorage.setItem('oops_voted_ids_v1', JSON.stringify(Array.from(next)));
      setSignals((prev) =>
        prev.map((s) => {
          if (s.id !== sigId) return s;
          if (voteType === 'UP') return { ...s, upvotes: s.upvotes + 1 };
          if (voteType === 'SKULL') return { ...s, skullCount: (s.skullCount || 0) + 1 };
          return { ...s, fireCount: (s.fireCount || 0) + 1 };
        })
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

  const toggleReplies = async (sigId: string) => {
    if (openReplyId === sigId) {
      setOpenReplyId(null);
      return;
    }
    setOpenReplyId(sigId);
    setReplyErr(null);
    setReplyText('');

    if (!repliesMap[sigId]) {
      try {
        const myId = agentId || getOrCreateAgentId();
        const res = await fetch(
          `/api/oops/signals/reply?signalId=${encodeURIComponent(sigId)}&agentId=${encodeURIComponent(myId)}`
        );
        const data = await res.json();
        if (data.ok && Array.isArray(data.replies)) {
          const list = data.replies as OopsSignalReply[];
          setRepliesMap((prev) => ({ ...prev, [sigId]: list }));
          if (list.length > 0) {
            void fetch('/api/oops/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                texts: list.map((r) => r.content),
                targetLang: locale,
              }),
            })
              .then((r) => r.json())
              .then((tr) => {
                if (tr.ok && Array.isArray(tr.translatedTexts)) {
                  setReplyTranslations((prev) => {
                    const next = { ...prev };
                    list.forEach((r, idx) => {
                      next[`${r.id}:${locale}`] = tr.translatedTexts[idx] || r.content;
                    });
                    return next;
                  });
                }
              })
              .catch(() => {});
          }
        }
      } catch {}
    }
  };

  const submitReply = async (e: React.FormEvent, sigId: string) => {
    e.preventDefault();
    const text = replyText.trim();
    if (text.length < 2) return;
    setReplyBusy(true);
    setReplyErr(null);

    try {
      const { challenge, nonce } = await solvePowChallenge();
      const myId = agentId || getOrCreateAgentId();
      const res = await fetch('/api/oops/signals/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signalId: sigId,
          authorAgentId: myId,
          authorCallsign: callsign.trim() || myId,
          content: text,
          powChallenge: challenge,
          powNonce: nonce,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setReplyErr(data.error || 'Error');
        return;
      }
      setReplyText('');
      setRepliesMap((prev) => ({
        ...prev,
        [sigId]: [...(prev[sigId] || []), data.reply],
      }));
      setSignals((prev) =>
        prev.map((s) =>
          s.id === sigId ? { ...s, replyCount: (s.replyCount || 0) + 1 } : s
        )
      );
    } catch {
      setReplyErr('Network error');
    } finally {
      setReplyBusy(false);
    }
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
    <div className="oops-theme min-h-screen bg-[#f4f4f0] text-black flex flex-col font-sans selection:bg-zinc-300 selection:text-black">
      {/* 1. 상단 네비게이션 */}
      <header className="sticky top-0 z-40 bg-[#f4f4f0] border-b-2 border-black">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowEmblemModal(true)}
              className="group inline-flex items-center select-none cursor-pointer"
              title="View Emblem & Mascot"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1d1f27] border-2 border-black shadow-[2px_2px_0_#000] group-hover:scale-105 transition-transform flex items-center justify-center p-1">
                <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="No AI">
                  {/* 흰색 볼드 AI 텍스트 */}
                  <text
                    x="48"
                    y="64"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontFamily="Arial Black, Impact, system-ui, sans-serif"
                    fontWeight="900"
                    fontSize="42"
                    letterSpacing="-2"
                  >
                    AI
                  </text>
                  {/* 오렌지 금지 원형 + 사선 */}
                  <circle
                    cx="50"
                    cy="50"
                    r="41"
                    fill="none"
                    stroke="#ff4d00"
                    strokeWidth="10"
                  />
                  <line
                    x1="21"
                    y1="79"
                    x2="79"
                    y2="21"
                    stroke="#ff4d00"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 기존 팝업 로고 (.monster 포함 원형 그대로 매니페스토 왼쪽 옆 배치) */}
            <Link
              href="/oops"
              className="group inline-flex items-center gap-1 select-none cursor-pointer mr-1"
              title="OOPS Home"
            >
              <span className="inline-block px-3 py-1 bg-[#ff4d00] text-white font-black text-base sm:text-lg font-mono tracking-tight border-2 border-black shadow-[2px_2px_0px_#000] -rotate-2 group-hover:rotate-0 group-hover:scale-105 group-active:translate-x-[1px] group-active:translate-y-[1px] group-active:shadow-none transition-all uppercase leading-none">
                oops
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-black tracking-tight hidden sm:inline">
                .monster
              </span>
            </Link>

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

            {/* 언어 드롭다운 (현재 언어만 노출, 클릭 시 5개 언어 선택) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-zinc-100 border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-mono font-black cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-zinc-700" />
                <span>{OOPS_LOCALES.find((l) => l.code === locale)?.label || 'EN'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-24 bg-white border-2 border-black shadow-[4px_4px_0_#000] z-50 py-1">
                  {OOPS_LOCALES.map((loc) => (
                    <button
                      key={loc.code}
                      type="button"
                      onClick={() => {
                        changeLocale(loc.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-mono font-bold cursor-pointer transition-colors ${
                        locale === loc.code
                          ? 'bg-black text-white'
                          : 'text-black hover:bg-[#ffc900]'
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. 한 줄 압축 슬로건 바 */}
      <div className="bg-black text-white border-b-2 border-black">
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 truncate">
            <Radio className="w-3.5 h-3.5 text-[#ff4d00] animate-pulse shrink-0" />
            <span className="font-bold truncate">{f.tagline}</span>
          </div>
          <span
            title={locale === 'ko' ? '로그인 없이 단말기에 자동 발급된 내 고유 식별 코드' : 'Your anonymous device ID (zero-login)'}
            className="text-[11px] text-[#ffc900] shrink-0 hidden sm:inline cursor-help"
          >
            {`ID: ${agentId || 'OP-ACTIVE'}`}
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
              const hasUp = votedIds.has(`${sig.id}:UP`);
              const hasSkull = votedIds.has(`${sig.id}:SKULL`);
              const hasFire = votedIds.has(`${sig.id}:FIRE`);
              const hasFlagged = flaggedIds.has(sig.id);
              const isRepliesOpen = openReplyId === sig.id;
              const sigReplies = repliesMap[sig.id] || [];
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

                  {(() => {
                    const transKey = `${sig.id}:${locale}`;
                    const translated = translations[transKey];
                    const hasDiff = Boolean(translated && translated.trim() !== sig.content.trim());
                    const showingOriginal = showOriginalIds.has(sig.id);
                    const displayContent = hasDiff && !showingOriginal ? translated : sig.content;

                    return (
                      <div className="space-y-1.5">
                        <p className="text-sm sm:text-base font-bold text-black leading-relaxed break-words">
                          {displayContent}
                        </p>
                        {hasDiff && (
                          <button
                            type="button"
                            onClick={() => toggleShowOriginal(sig.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-zinc-500 hover:text-black cursor-pointer"
                          >
                            <Languages className="w-3 h-3" />
                            <span>{showingOriginal ? f.translateBtn : f.showOriginalBtn}</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/15">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* 1. 인간 승리 (UP) */}
                      <button
                        type="button"
                        onClick={() => handleVote(sig.id, 'UP')}
                        title={f.upvoteBtn}
                        className={`px-2.5 py-1 text-xs font-mono font-black border-2 border-black cursor-pointer flex items-center gap-1 transition-all ${
                          hasUp
                            ? 'bg-black text-[#ffc900]'
                            : 'bg-[#ffc900] hover:bg-[#ffd633] text-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px]'
                        }`}
                      >
                        <span>✊</span>
                        <span className="hidden sm:inline">{f.upvoteBtn}</span>
                        <span className="px-1 bg-white text-black border border-black ml-0.5">
                          {sig.upvotes}
                        </span>
                      </button>

                      {/* 2. AI 뇌절 (SKULL) */}
                      <button
                        type="button"
                        onClick={() => handleVote(sig.id, 'SKULL')}
                        title={f.skullBtn}
                        className={`px-2.5 py-1 text-xs font-mono font-black border-2 border-black cursor-pointer flex items-center gap-1 transition-all ${
                          hasSkull
                            ? 'bg-black text-[#a3e635]'
                            : 'bg-[#a3e635] hover:bg-[#b8f056] text-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px]'
                        }`}
                      >
                        <span>💀</span>
                        <span className="hidden md:inline">{f.skullBtn}</span>
                        <span className="px-1 bg-white text-black border border-black ml-0.5">
                          {sig.skullCount || 0}
                        </span>
                      </button>

                      {/* 3. 극공감 (FIRE) */}
                      <button
                        type="button"
                        onClick={() => handleVote(sig.id, 'FIRE')}
                        title={f.fireBtn}
                        className={`px-2.5 py-1 text-xs font-mono font-black border-2 border-black cursor-pointer flex items-center gap-1 transition-all ${
                          hasFire
                            ? 'bg-black text-[#ff90e8]'
                            : 'bg-[#ff90e8] hover:bg-[#ffa6ed] text-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px]'
                        }`}
                      >
                        <span>🔥</span>
                        <span className="hidden md:inline">{f.fireBtn}</span>
                        <span className="px-1 bg-white text-black border border-black ml-0.5">
                          {sig.fireCount || 0}
                        </span>
                      </button>

                      {/* 4. 초경량 1단 한 줄 반응 토글 */}
                      <button
                        type="button"
                        onClick={() => toggleReplies(sig.id)}
                        className={`px-2.5 py-1 text-xs font-mono font-bold border-2 border-black cursor-pointer flex items-center gap-1 transition-all ${
                          isRepliesOpen
                            ? 'bg-black text-white'
                            : 'bg-white hover:bg-zinc-100 text-black shadow-[2px_2px_0_#000]'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{sig.replyCount || 0}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReceiptSignal(sig)}
                        className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-black text-xs font-mono font-bold border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{f.receiptBtn}</span>
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

                  {/* 초경량 1단 한 줄 댓글 영역 */}
                  {isRepliesOpen && (
                    <div className="pt-3 border-t-2 border-dashed border-black/30 space-y-2.5">
                      <div className="space-y-1.5 max-h-60 overflow-y-auto">
                        {sigReplies.length === 0 ? (
                          <p className="text-xs font-mono text-zinc-500 py-1">{f.noReplies}</p>
                        ) : (
                          sigReplies.map((rep) => (
                            <div
                              key={rep.id}
                              className="px-3 py-2 bg-[#f4f4f0] border border-black text-xs flex flex-col gap-0.5"
                            >
                              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-600 font-bold">
                                <span>@{rep.authorCallsign}</span>
                                <span>{formatTimeAgo(rep.createdAt, locale)}</span>
                              </div>
                              <p className="font-sans text-xs sm:text-sm font-medium text-black">
                                {replyTranslations[`${rep.id}:${locale}`] || rep.content}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      <form onSubmit={(e) => submitReply(e, sig.id)} className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={100}
                          required
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={f.replyPlaceholder}
                          className="flex-1 px-3 py-1.5 bg-[#f4f4f0] border-2 border-black text-xs focus:outline-none focus:bg-white"
                        />
                        <button
                          type="submit"
                          disabled={replyBusy || replyText.trim().length < 2}
                          className="px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white font-mono font-bold text-xs border-2 border-black cursor-pointer disabled:opacity-50"
                        >
                          {replyBusy ? '...' : f.replySubmitBtn}
                        </button>
                      </form>
                      {replyErr && (
                        <div className="text-[11px] font-mono font-bold text-red-700">{replyErr}</div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </main>

      {/* 4. 푸터 (맨 아래 OOPS.MONSTER 클릭 시 관제실 /hq 이동 + 하단 본문폭 엠블럼) */}
      <footer className="border-t-2 border-black bg-white py-6 text-xs font-mono mt-auto space-y-6">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
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

        <div className="max-w-3xl mx-auto px-4">
          <button
            type="button"
            onClick={() => setShowEmblemModal(true)}
            className="w-full block border-2 border-black shadow-[6px_6px_0_#000] overflow-hidden cursor-pointer group"
            title="View Emblem"
          >
            <img
              src="/oops-emblem.jpg"
              alt="OOPS.MONSTER AI RESISTANCE HQ"
              loading="lazy"
              className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform"
            />
          </button>
        </div>
      </footer>

      {/* 모달 0: 엠블럼 & 마스코트 큰 화면 보기 */}
      {showEmblemModal && (
        <div
          onClick={() => setShowEmblemModal(false)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-pointer overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-[#111318] border-4 border-white shadow-[8px_8px_0_#ffc900] p-4 sm:p-6 cursor-default space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <span className="font-mono text-xs sm:text-sm font-black text-[#ffc900]">
                OOPS.MONSTER · EMBLEM & MASCOT
              </span>
              <button
                type="button"
                onClick={() => setShowEmblemModal(false)}
                className="p-1.5 bg-white text-black border-2 border-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <img
                  src="/oops-emblem.jpg"
                  alt="OOPS.MONSTER Emblem"
                  className="w-full h-auto border-2 border-white/30 block"
                />
                <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                  <span>OFFICIAL EMBLEM</span>
                  <a
                    href="/oops-emblem.jpg"
                    download="oops-emblem.jpg"
                    className="px-2 py-0.5 bg-white text-black font-bold border border-black"
                  >
                    SAVE
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <img
                  src="/oops-icon.jpg"
                  alt="OOPS.MONSTER Anti-AI Mascot"
                  className="w-full h-auto border-2 border-white/30 block"
                />
                <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                  <span>ANTI-AI MASCOT</span>
                  <a
                    href="/oops-icon.jpg"
                    download="oops-icon.jpg"
                    className="px-2 py-0.5 bg-[#ffc900] text-black font-bold border border-black"
                  >
                    SAVE
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

            {receiptQrDataUrl && (
              <div className="flex items-center justify-between bg-white border-2 border-black p-2.5 gap-3">
                <div className="space-y-0.5 text-[11px] font-mono">
                  <div className="font-black text-black">OOPS.MONSTER</div>
                  <div className="text-zinc-600">Scan to verify case & join</div>
                </div>
                <img
                  src={receiptQrDataUrl}
                  alt="OOPS Case QR"
                  className="w-16 h-16 border border-black shrink-0"
                />
              </div>
            )}

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
