'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bell, Check, Copy, Globe, Radio, Send, Sparkles, Zap } from 'lucide-react';
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
    } catch {}
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
            <span className="px-2.5 py-1 bg-[#ff90e8] border-2 border-black shadow-[2px_2px_0px_#000] font-mono text-sm font-black tracking-tight">
              oops.monster
            </span>
            <span className="hidden md:inline-block text-xs font-mono font-bold px-2 py-0.5 bg-[#ffc900] border-2 border-black">
              {t.badgeTop}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 글로벌 언어 전환기 (EN / KO / JA / ZH / ES) */}
            <div className="flex items-center bg-white border-2 border-black shadow-[2px_2px_0px_#000] px-1 py-0.5 gap-0.5">
              <Globe className="w-3.5 h-3.5 mx-1 text-zinc-600 hidden sm:block" />
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

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold bg-white border-2 border-black shadow-[2px_2px_0px_#000] px-2.5 py-1">
              <Radio className="w-3.5 h-3.5 text-[#ff4d00] animate-pulse" />
              <span>{t.activeNodes}: {agentsCount}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 모바일 1초 앱 설치 & 알림 자동 세팅 플로팅 바 */}
      {showInstallBanner && (
        <div className="bg-[#ffc900] border-b-2 border-black px-4 py-3 sticky top-16 z-30 shadow-[0_4px_0_#000]">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-mono font-bold">
            <div className="flex items-center gap-2">
              <span className="text-lg">📲</span>
              <span>
                {isStandalone
                  ? '앱 설치 완료! 알림 권한을 승인해야 백그라운드 몬스터 호출이 작동합니다.'
                  : '홈 화면에 앱을 추가하면 알림 설정이 1초 만에 자동 연결됩니다.'}
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={triggerAppInstall}
                className="flex-1 sm:flex-none px-4 py-2 bg-black text-white font-black text-xs border-2 border-black shadow-[2px_2px_0_#ff90e8] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                {isStandalone ? '알림 즉시 켜기 ➔' : '1초 앱 설치 & 알림 켜기 ➔'}
              </button>
              <button
                type="button"
                onClick={() => setShowInstallBanner(false)}
                className="px-2.5 py-2 bg-white text-black border-2 border-black text-xs font-black cursor-pointer"
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

        {/* 3. 중간 삽입: Poolsuite.net 스타일 레트로 OS 윈도우 */}
        <section className="bg-[#d6d3c9] border-2 border-black shadow-[8px_8px_0px_#000]">
          <div className="bg-[#000080] text-white px-3 py-2 border-b-2 border-black flex items-center justify-between select-none">
            <div className="flex items-center gap-2 font-mono text-xs sm:text-sm font-bold tracking-wide">
              <span className="inline-block w-3 h-3 bg-[#ffc900] border border-white" />
              <span>{t.terminalTitle}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 bg-[#d6d3c9] text-black border border-black flex items-center justify-center text-xs font-black leading-none">
                _
              </span>
              <span className="w-5 h-5 bg-[#d6d3c9] text-black border border-black flex items-center justify-center text-xs font-black leading-none">
                □
              </span>
              <span className="w-5 h-5 bg-[#ff4d00] text-white border border-black flex items-center justify-center text-xs font-black leading-none">
                ×
              </span>
            </div>
          </div>

          <div className="px-4 py-1.5 bg-[#ebe8df] border-b-2 border-black flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-4 font-bold">
              {t.terminalMenus.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
            <span className="text-zinc-700">{t.terminalProtocol}</span>
          </div>

          <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 좌측 모듈 */}
            <div className="bg-[#f4f4f0] border-2 border-black p-5 shadow-[4px_4px_0px_#000] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
                <span className="font-mono text-sm font-black flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#ff4d00]" />
                  <span>{t.step1Title}</span>
                </span>
                {myAgentId && (
                  <span className="text-xs font-mono font-black px-2 py-0.5 bg-[#ffc900] border border-black">
                    {myAgentId}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed">{t.step1Desc}</p>

              <div className="space-y-2.5">
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder={t.aliasPlaceholder}
                  className="w-full px-3 py-2.5 bg-white border-2 border-black text-sm font-mono focus:outline-none focus:bg-[#ffc900]/15"
                />
                <button
                  type="button"
                  disabled={pushBusy}
                  onClick={connectIndependentPush}
                  className="w-full py-3 px-4 bg-[#ffc900] hover:bg-[#ffd633] text-black font-black text-sm border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  <span>{pushBusy ? t.connectingBtn : myAgentId ? t.reconnectBtn : t.connectBtn}</span>
                </button>
              </div>

              {pushMsg && (
                <div className="p-2.5 bg-[#a3e635]/40 border-2 border-black text-xs font-mono font-bold">
                  {pushMsg}
                </div>
              )}
              {pushError && (
                <div className="p-2.5 bg-[#ff4d00]/20 border-2 border-black text-xs font-bold text-red-900">
                  {pushError}
                </div>
              )}

              {myAgentId && (
                <div className="p-3 bg-white border-2 border-black space-y-2">
                  <div className="text-[11px] font-mono font-bold text-zinc-600">
                    {t.shareLabel}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono font-bold truncate">
                      https://oops.monster/?ping={myAgentId}
                    </code>
                    <button
                      type="button"
                      onClick={copyShareUrl}
                      className="shrink-0 px-2.5 py-1 bg-[#ff90e8] border-2 border-black text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? t.copiedBtn : t.copyBtn}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="text-xs font-mono text-zinc-700 pt-2 border-t border-black/20">
                {t.iosTip}
              </div>
            </div>

            {/* 우측 모듈 */}
            <div className="bg-[#f4f4f0] border-2 border-black p-5 shadow-[4px_4px_0px_#000] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
                <span className="font-mono text-sm font-black flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#ff4d00]" />
                  <span>{t.step2Title}</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-zinc-600">{t.step2Badge}</span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed">{t.step2Desc}</p>

              <div className="space-y-2.5">
                <input
                  type="text"
                  value={targetCode}
                  onChange={(e) => setTargetCode(e.target.value.toUpperCase())}
                  placeholder={t.targetPlaceholder}
                  className="w-full px-3 py-2.5 bg-white border-2 border-black text-sm font-mono font-bold focus:outline-none focus:bg-[#ff90e8]/15"
                />
                <input
                  type="text"
                  value={pingTitle}
                  onChange={(e) => setPingTitle(e.target.value)}
                  placeholder={t.pingTitlePlaceholder}
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={pingBody}
                  onChange={(e) => setPingBody(e.target.value)}
                  placeholder={t.pingBodyPlaceholder}
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pingBusy}
                    onClick={() => sendMonsterPing()}
                    className="flex-1 py-3 px-4 bg-[#ff90e8] hover:bg-[#ffa6ed] text-black font-black text-sm border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{pingBusy ? t.firingBtn : t.fireBtn}</span>
                  </button>
                  {myAgentId && (
                    <button
                      type="button"
                      disabled={pingBusy}
                      onClick={() => sendMonsterPing(myAgentId)}
                      className="px-4 py-3 bg-white hover:bg-zinc-100 border-2 border-black shadow-[3px_3px_0px_#000] text-xs font-mono font-black cursor-pointer"
                    >
                      {t.selfTestBtn}
                    </button>
                  )}
                </div>
              </div>

              {pingResult && (
                <div className="p-2.5 bg-[#ffc900]/40 border-2 border-black text-xs font-mono font-bold">
                  {pingResult}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4. Gumroad 스타일 창립 백커 합류 카드 */}
        <section className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-black text-white text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#ffc900]" />
              <span>{t.backerTag}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-black">{t.backerTitle}</h2>
            <p className="text-sm text-zinc-700 max-w-2xl font-medium">{t.backerDesc}</p>
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
          <div className="font-bold">OOPS.MONSTER · AI RESISTANCE HEADQUARTERS</div>
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
