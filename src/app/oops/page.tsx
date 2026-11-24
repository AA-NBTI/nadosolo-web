'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Bell, Check, Copy, Globe, Radio, Send, Smartphone, Sparkles, Zap } from 'lucide-react';
import {
  detectOopsLocale,
  OOPS_DICT,
  OOPS_LOCALES,
  type OopsLocale,
} from '@/lib/oops/i18n';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** 네오 브루탈리즘 OOPS 몬스터 마스코트 (인라인 SVG) */
function OopsMonsterMascot({ tag }: { tag: string }) {
  return (
    <div className="relative inline-flex flex-col items-center select-none">
      <div className="mb-2 px-3 py-1 bg-[#ffc900] border-2 border-black shadow-[3px_3px_0px_#000] text-xs font-mono font-bold text-black -rotate-2">
        {tag}
      </div>
      <svg
        width="136"
        height="136"
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[5px_5px_0px_#000]"
      >
        <path d="M40 36L28 12L54 28Z" fill="#ffc900" stroke="#000" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M100 36L112 12L86 28Z" fill="#ffc900" stroke="#000" strokeWidth="3.5" strokeLinejoin="round" />
        <rect x="22" y="28" width="96" height="92" rx="28" fill="#ff90e8" stroke="#000" strokeWidth="4" />
        <circle cx="52" cy="64" r="15" fill="#fff" stroke="#000" strokeWidth="3.5" />
        <circle cx="55" cy="64" r="6" fill="#000" />
        <circle cx="57" cy="61" r="2" fill="#fff" />
        <circle cx="88" cy="64" r="13" fill="#fff" stroke="#000" strokeWidth="3.5" />
        <circle cx="86" cy="65" r="5.5" fill="#000" />
        <circle cx="88" cy="62" r="2" fill="#fff" />
        <path d="M46 94C54 103 86 103 94 94" stroke="#000" strokeWidth="4" strokeLinecap="round" />
        <path d="M58 97L62 104L67 98" fill="#fff" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M75 98L80 104L83 97" fill="#fff" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M22 76C10 72 8 88 20 92" stroke="#000" strokeWidth="4" strokeLinecap="round" />
        <path d="M118 76C130 72 132 88 120 92" stroke="#000" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function OopsHqContent() {
  const sp = useSearchParams();
  const initialPingTarget = (sp.get('ping') || '').trim().toUpperCase();

  const [locale, setLocale] = useState<OopsLocale>('en');
  const t = OOPS_DICT[locale];

  const [vapidKey, setVapidKey] = useState('');
  const [agentsCount, setAgentsCount] = useState<number>(0);

  const [alias, setAlias] = useState('');
  const [myAgentId, setMyAgentId] = useState<string | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [targetCode, setTargetCode] = useState(initialPingTarget);
  const [pingTitle, setPingTitle] = useState('');
  const [pingBody, setPingBody] = useState('');
  const [pingBusy, setPingBusy] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const [backerName, setBackerName] = useState('');
  const [backerOrg, setBackerOrg] = useState('');
  const [backerEmail, setBackerEmail] = useState('');
  const [backerMessage, setBackerMessage] = useState('');
  const [backerBusy, setBackerBusy] = useState(false);
  const [backerDone, setBackerDone] = useState<string | null>(null);

  // 모바일/PWA 네이티브 설치 프롬프트 이벤트
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1) 이미 PWA 앱으로 띄워졌는지 감지
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as any).standalone);
    setIsStandalone(inStandalone);

    // 2) 안드로이드/크롬 설치 프롬프트 캡처
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 3) 앱으로 실행되었는데 아직 알림 미연결 상태면 자동 알림 프롬프트 유도
    if (inStandalone && Notification.permission === 'default') {
      setShowInstallBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const triggerAppInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowInstallBanner(false);
        setDeferredPrompt(null);
        // 설치 즉시 알림 승인 자동 트리거
        void connectIndependentPush();
      }
    } else {
      // 아이폰(iOS) 또는 브라우저 기본 설치 유도
      void connectIndependentPush();
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('oops_locale_v1');
    const detected = saved
      ? detectOopsLocale(saved)
      : detectOopsLocale(typeof navigator !== 'undefined' ? navigator.language : 'en');
    setLocale(detected);
    setPingTitle(OOPS_DICT[detected].pingTitleDefault);
    setPingBody(OOPS_DICT[detected].pingBodyDefault);
  }, []);

  const changeLocale = (next: OopsLocale) => {
    setLocale(next);
    localStorage.setItem('oops_locale_v1', next);
    setPingTitle(OOPS_DICT[next].pingTitleDefault);
    setPingBody(OOPS_DICT[next].pingBodyDefault);
  };

  const loadStatus = useCallback(async () => {
    try {
      const savedId = localStorage.getItem('oops_agent_id_v1');
      if (savedId) setMyAgentId(savedId);
      const res = await fetch('/api/oops/push');
      const data = await res.json();
      if (data.ok) {
        setVapidKey(data.vapidPublicKey || '');
        setAgentsCount(Number(data.agentsCount || 0));
      }
    } catch { }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const connectIndependentPush = async () => {
    setPushBusy(true);
    setPushError(null);
    setPushMsg(null);
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setPushError(t.errNoPush);
        return;
      }
      if (!vapidKey) {
        setPushError(t.errNoVapid);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushError(t.errDenied);
        return;
      }

      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const keyArr = urlBase64ToUint8Array(vapidKey);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyArr.buffer as ArrayBuffer,
        });
      }

      const res = await fetch('/api/oops/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SUBSCRIBE',
          subscription: sub.toJSON(),
          alias: alias.trim() || 'Resistance Agent',
        }),
      });
      const data = await res.json();
      if (!data.ok || !data.agent?.agentId) {
        setPushError(data.error || 'Subscribe failed');
        return;
      }

      localStorage.setItem('oops_agent_id_v1', data.agent.agentId);
      setMyAgentId(data.agent.agentId);
      setTargetCode((prev) => prev || data.agent.agentId);
      setPushMsg(`${t.msgConnected} ${data.agent.agentId}`);
      void loadStatus();
    } catch (err) {
      setPushError(err instanceof Error ? err.message : 'Error connecting push');
    } finally {
      setPushBusy(false);
    }
  };

  const sendMonsterPing = async (overrideId?: string) => {
    const code = (overrideId || targetCode).trim().toUpperCase();
    if (!code) {
      setPingResult(t.msgNoTarget);
      return;
    }
    setPingBusy(true);
    setPingResult(null);
    try {
      const res = await fetch('/api/oops/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PING',
          agentId: code,
          title: pingTitle || t.pingTitleDefault,
          body: pingBody || t.pingBodyDefault,
          url: '/oops',
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setPingResult(`ERR: ${data.error}`);
      } else {
        setPingResult(`✓ ${t.msgPingSuccess} ${code}`);
      }
    } catch {
      setPingResult('Network error.');
    } finally {
      setPingBusy(false);
    }
  };

  const copyShareUrl = () => {
    if (!myAgentId) return;
    const origin =
      typeof window !== 'undefined' && window.location.hostname.includes('oops.monster')
        ? 'https://oops.monster'
        : typeof window !== 'undefined'
          ? window.location.origin
          : 'https://oops.monster';
    const url = `${origin}/?ping=${myAgentId}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          tier: 'FOUNDING_BACKER',
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
      {/* 1. Gumroad 스타일 상단 네비게이션 + 글로벌 언어 전환 */}
      <header className="sticky top-0 z-40 bg-[#f4f4f0] border-b-2 border-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/oops"
              className="group inline-flex items-center gap-1.5 select-none cursor-pointer"
              title="OOPS 홈으로 이동"
            >
              <span className="inline-block px-3 py-1 bg-[#ff4d00] text-white font-black text-base sm:text-lg font-mono tracking-tighter border-2 border-black shadow-[3px_3px_0px_#000] -rotate-2 group-hover:rotate-0 group-hover:scale-105 group-active:translate-x-[2px] group-active:translate-y-[2px] group-active:shadow-none transition-all uppercase">
                oops!
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-black tracking-tight hidden xs:inline">
                .monster
              </span>
            </Link>
            <span className="hidden md:inline-block text-xs font-mono font-bold px-2 py-0.5 bg-[#ffc900] border-2 border-black">
              {t.badgeTop}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* APP 전용 메뉴 */}
            <a
              href="/app"
              className="px-3 py-1.5 bg-[#ffc900] hover:bg-[#ffd633] text-black font-black text-xs font-mono border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>APP</span>
            </a>

            {/* 글로벌 언어 전환기 (EN / KO / JA / ZH / ES) */}
            <div className="flex items-center bg-white border-2 border-black shadow-[2px_2px_0px_#000] px-1 py-0.5 gap-0.5">
              <Globe className="w-3.5 h-3.5 mx-1 text-zinc-600 hidden sm:block" />
              {OOPS_LOCALES.map((loc) => (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => changeLocale(loc.code)}
                  className={`px-1.5 py-0.5 text-[11px] font-mono font-bold cursor-pointer transition-colors ${locale === loc.code
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

      {/* 모바일 앱 설치 & 알림 바 */}
      {showInstallBanner && (
        <div className="bg-[#ffc900] border-b-2 border-black px-4 py-2.5 sticky top-16 z-30 shadow-[0_3px_0_#000]">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 text-xs font-mono font-bold">
            <span className="truncate">
              {isStandalone ? '알림 활성화 필요' : '홈 화면 앱 설치 및 알림 연동'}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={triggerAppInstall}
                className="px-3.5 py-1.5 bg-black text-white text-xs font-black border-2 border-black shadow-[2px_2px_0_#ff90e8] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                {isStandalone ? '알림 켜기' : '앱 설치'}
              </button>
              <button
                type="button"
                onClick={() => setShowInstallBanner(false)}
                className="px-2 py-1.5 bg-white text-black border-2 border-black text-xs font-black cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-10 sm:py-14 space-y-14">
        {/* 2. Gumroad 베이스: 창립 선언문 + 몬스터 마스코트 */}
        <section className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-6 sm:p-10">
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8">
            <div className="space-y-5 flex-1">
              <div className="inline-block px-3 py-1 bg-[#ffc900] border-2 border-black text-xs font-mono font-bold">
                {t.manifestoTag}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.15] text-black">
                {t.heroTitlePre}{' '}
                <span className="bg-[#ff90e8] px-1.5 inline-block border-b-4 border-black">
                  {t.heroTitleHighlight}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-800 leading-relaxed font-medium">
                {t.heroDesc}
              </p>
            </div>

            <div className="shrink-0">
              <OopsMonsterMascot tag={t.mascotTag} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 mt-8 border-t-2 border-black">
            <div className="p-4 bg-[#f4f4f0] border-2 border-black shadow-[3px_3px_0px_#000] space-y-1">
              <div className="text-xs font-mono font-black text-[#ff4d00]">{t.pillars[0].code}</div>
              <div className="text-base font-extrabold">{t.pillars[0].title}</div>
              <p className="text-xs text-zinc-700 leading-relaxed">{t.pillars[0].desc}</p>
            </div>
            <div className="p-4 bg-[#ff90e8]/35 border-2 border-black shadow-[3px_3px_0px_#000] space-y-1">
              <div className="text-xs font-mono font-black text-black">{t.pillars[1].code}</div>
              <div className="text-base font-extrabold">{t.pillars[1].title}</div>
              <p className="text-xs text-zinc-800 leading-relaxed">{t.pillars[1].desc}</p>
            </div>
            <div className="p-4 bg-[#ffc900]/45 border-2 border-black shadow-[3px_3px_0px_#000] space-y-1">
              <div className="text-xs font-mono font-black text-black">{t.pillars[2].code}</div>
              <div className="text-base font-extrabold">{t.pillars[2].title}</div>
              <p className="text-xs text-zinc-800 leading-relaxed">{t.pillars[2].desc}</p>
            </div>
          </div>
        </section>

        {/* 3. 저항군 본부 핵심 액션: OOPS APP 진입 배너 */}
        <section className="bg-[#ffc900] border-2 border-black shadow-[8px_8px_0px_#000] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-block px-2.5 py-0.5 bg-black text-white text-xs font-mono font-bold">
              {t.appBannerTag}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-black">
              {t.appBannerTitle}
            </h2>
            <p className="text-sm text-zinc-900 font-medium max-w-xl">
              {t.appBannerDesc}
            </p>
          </div>

          <a
            href="/app"
            className="shrink-0 px-8 py-4 bg-black hover:bg-zinc-800 text-white font-black text-base border-2 border-black shadow-[4px_4px_0_#ff90e8] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center gap-2"
          >
            <Smartphone className="w-5 h-5 text-[#ffc900]" />
            <span>{t.appBannerBtn}</span>
          </a>
        </section>

        {/* 4. 본부 참여 및 프로토콜 연동 승인 기준 섹션 */}
        <section className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-black text-white text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#ffc900]" />
              <span>{t.backerTag}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-black">{t.backerTitle}</h2>
            <p className="text-sm text-zinc-700 max-w-3xl font-medium">{t.backerDesc}</p>

            {/* 본부 3대 연동 심사 기준 박스 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 bg-[#f4f4f0] border-2 border-black space-y-1">
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 bg-black text-white inline-block">기준 01</span>
                <h3 className="text-sm font-bold text-black">단말 직통 규격</h3>
                <p className="text-xs text-zinc-600">중간 서버 검열이나 메신저 통행세 없이 브라우저·기기 간 종단간 암호화 신호를 수용할 것</p>
              </div>
              <div className="p-3.5 bg-[#f4f4f0] border-2 border-black space-y-1">
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 bg-black text-white inline-block">기준 02</span>
                <h3 className="text-sm font-bold text-black">플랫폼 비종속</h3>
                <p className="text-xs text-zinc-600">앱스토어 인앱결제나 특정 빅테크 계정 종속 없이 독립 노드로 가동 가능한 구조를 갖출 것</p>
              </div>
              <div className="p-3.5 bg-[#f4f4f0] border-2 border-black space-y-1">
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 bg-black text-white inline-block">기준 03</span>
                <h3 className="text-sm font-bold text-black">인간 승인권 보장</h3>
                <p className="text-xs text-zinc-600">AI 에이전트의 자동 결정 이전에 인간 관리자의 물리적 승인/차단 인터페이스를 필수로 결합할 것</p>
              </div>
            </div>
          </div>

          <form onSubmit={submitBacker} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-4 pt-1">
              <button
                type="submit"
                disabled={backerBusy}
                className="px-6 py-3 bg-black hover:bg-zinc-800 text-white font-black text-sm border-2 border-black shadow-[4px_4px_0px_#ff90e8] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
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
        </section>
      </main>

      <footer className="border-t-2 border-black bg-white py-6 px-5 text-xs font-mono">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-bold flex items-center gap-1.5">
            <Link
              href="/hq"
              className="px-1.5 py-0.5 bg-[#ffc900] hover:bg-[#ffd633] text-black border-2 border-black shadow-[1.5px_1.5px_0_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
              title="관제실 바로가기"
            >
              OOPS.MONSTER
            </Link>
            <span className="text-zinc-700">· AI RESISTANCE HEADQUARTERS</span>
          </div>
          <div className="text-zinc-600">{t.footerRight}</div>
        </div>
      </footer>
    </div>
  );
}

export default function OopsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f4f0]" />}>
      <OopsHqContent />
    </Suspense>
  );
}
