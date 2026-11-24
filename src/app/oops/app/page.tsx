'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Bell,
  Check,
  ChevronDown,
  Copy,
  Globe,
  Radio,
  Send,
  Smartphone,
  Zap,
} from 'lucide-react';
import { OOPS_DICT, OOPS_LOCALES, type OopsLocale } from '@/lib/oops/i18n';

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

function OopsAppContent() {
  const sp = useSearchParams();
  const initialPingTarget = (sp.get('ping') || '').trim().toUpperCase();

  const [locale, setLocale] = useState<OopsLocale>('en');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
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
  }, []);

  const changeLocale = (next: OopsLocale) => {
    setLocale(next);
    localStorage.setItem('oops_locale_v1', next);
  };

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as any).standalone);
    setIsStandalone(inStandalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (inStandalone && Notification.permission === 'default') {
      setShowInstallBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

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

  const triggerAppInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowInstallBanner(false);
        setDeferredPrompt(null);
        void connectIndependentPush();
      }
    } else {
      void connectIndependentPush();
    }
  };

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
        setPushError(data.error || '등록 실패');
        return;
      }

      localStorage.setItem('oops_agent_id_v1', data.agent.agentId);
      setMyAgentId(data.agent.agentId);
      setTargetCode((prev) => prev || data.agent.agentId);
      setPushMsg(`${t.msgConnected} ${data.agent.agentId}`);
      void loadStatus();
    } catch (err) {
      setPushError(err instanceof Error ? err.message : '연결 오류');
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
          title: pingTitle.trim() || t.pingTitleDefault,
          body: pingBody.trim() || t.pingBodyDefault,
          url: '/app',
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setPingResult(`ERR: ${data.error}`);
      } else {
        setPingResult(`✓ ${t.msgPingSuccess} ${code}`);
      }
    } catch {
      setPingResult('네트워크 오류');
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
    const url = `${origin}/app?ping=${myAgentId}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="oops-theme min-h-screen bg-[#f4f4f0] text-black flex flex-col font-sans selection:bg-zinc-300 selection:text-black">
      <header className="sticky top-0 z-40 bg-[#f4f4f0] border-b-2 border-black">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/oops"
              className="group inline-flex items-center gap-2 select-none cursor-pointer"
              title="OOPS Home"
            >
              <img
                src="/oops-emblem.jpg"
                alt="OOPS.MONSTER"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-black shadow-[2px_2px_0_#000] group-hover:scale-105 transition-transform"
              />
            </Link>
            <span className="px-2 py-0.5 bg-[#ffc900] border-2 border-black text-xs font-mono font-bold">
              APP
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/oops"
              className="group inline-flex items-center select-none cursor-pointer"
              title="OOPS Home"
            >
              <span className="inline-block px-2.5 py-1 bg-[#ff4d00] text-white font-black text-xs sm:text-sm font-mono tracking-tighter border-2 border-black shadow-[2px_2px_0px_#000] -rotate-2 group-hover:rotate-0 group-hover:scale-105 transition-all uppercase">
                oops!
              </span>
            </Link>

            <div className="flex items-center gap-2 text-xs font-mono font-bold bg-white border-2 border-black shadow-[2px_2px_0_#000] px-2.5 py-1">
              <Radio className="w-3.5 h-3.5 text-[#ff4d00] animate-pulse" />
              <span>{t.activeNodes} {agentsCount}</span>
            </div>

            {/* 언어 드롭다운 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-zinc-100 border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-mono font-black cursor-pointer"
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

      {showInstallBanner && (
        <div className="bg-[#ffc900] border-b-2 border-black px-4 py-2.5 sticky top-16 z-30 shadow-[0_3px_0_#000]">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 text-xs font-mono font-bold">
            <span className="truncate">
              {locale === 'ko'
                ? isStandalone
                  ? '알림 활성화 필요'
                  : '홈 화면 앱 설치 및 알림 연동'
                : isStandalone
                  ? 'Push activation required'
                  : 'Install App & Enable Alerts'}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={triggerAppInstall}
                className="px-3.5 py-1.5 bg-black text-white text-xs font-black border-2 border-black shadow-[2px_2px_0_#ff90e8] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                {locale === 'ko'
                  ? isStandalone
                    ? '알림 켜기'
                    : '앱 설치'
                  : isStandalone
                    ? 'ENABLE'
                    : 'INSTALL'}
              </button>
              <button
                type="button"
                onClick={() => setShowInstallBanner(false)}
                className="px-2 py-1.5 bg-white text-black border-2 border-black text-xs font-black cursor-pointer"
              >
                {locale === 'ko' ? '닫기' : 'CLOSE'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-10 space-y-8">
        {/* Poolsuite 레트로 터미널 창 */}
        <section className="bg-[#d6d3c9] border-2 border-black shadow-[8px_8px_0_#000]">
          <div className="bg-[#000080] text-white px-3 py-2 border-b-2 border-black flex items-center justify-between select-none">
            <div className="flex items-center gap-2 font-mono text-xs sm:text-sm font-bold tracking-wide">
              <span className="inline-block w-3 h-3 bg-[#ffc900] border border-white" />
              <span>OOPS_COMMUNICATOR_v1.0.EXE</span>
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

          <div className="px-4 py-1.5 bg-[#ebe8df] border-b-2 border-black flex items-center justify-between text-xs font-mono">
            <span className="font-bold">HUMAN-TO-HUMAN DIRECT CALL</span>
            <span className="text-zinc-700">NO-GATEKEEPER</span>
          </div>

          <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 좌: 내 기기 연결 */}
            <div className="bg-[#f4f4f0] border-2 border-black p-5 shadow-[4px_4px_0_#000] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
                <span className="font-mono text-sm font-black flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#ff4d00]" />
                  <span>{t.step1Title}</span>
                </span>
                {myAgentId && (
                  <span className="text-xs font-mono font-black px-2 py-0.5 bg-[#ffc900] border border-black">
                    {myAgentId}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-medium">
                {t.step1Desc}
              </p>

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
                  className="w-full py-3 px-4 bg-[#ffc900] hover:bg-[#ffd633] text-black font-black text-sm border-2 border-black shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
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
                      https://oops.monster/app?ping={myAgentId}
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
            </div>

            {/* 우: 몬스터 호출 발사 */}
            <div className="bg-[#f4f4f0] border-2 border-black p-5 shadow-[4px_4px_0_#000] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
                <span className="font-mono text-sm font-black flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#ff4d00]" />
                  <span>{t.step2Title}</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-zinc-600">{t.step2Badge}</span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-medium">
                {t.step2Desc}
              </p>

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
                    className="flex-1 py-3 px-4 bg-[#ff90e8] hover:bg-[#ffa6ed] text-black font-black text-sm border-2 border-black shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{pingBusy ? t.firingBtn : t.fireBtn}</span>
                  </button>
                  {myAgentId && (
                    <button
                      type="button"
                      disabled={pingBusy}
                      onClick={() => sendMonsterPing(myAgentId)}
                      className="px-4 py-3 bg-white hover:bg-zinc-100 border-2 border-black shadow-[3px_3px_0_#000] text-xs font-mono font-black cursor-pointer"
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
      </main>

      <footer className="border-t-2 border-black bg-white py-6 text-xs font-mono mt-auto">
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
      </footer>
    </div>
  );
}

export default function OopsAppPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f4f0]" />}>
      <OopsAppContent />
    </Suspense>
  );
}
