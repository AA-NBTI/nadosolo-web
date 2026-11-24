'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Bell, Check, Copy, Radio, Send, Smartphone, Zap } from 'lucide-react';

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

  const [vapidKey, setVapidKey] = useState('');
  const [agentsCount, setAgentsCount] = useState<number>(0);

  const [alias, setAlias] = useState('');
  const [myAgentId, setMyAgentId] = useState<string | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [targetCode, setTargetCode] = useState(initialPingTarget);
  const [pingTitle, setPingTitle] = useState('OOPS! 신호 도착');
  const [pingBody, setPingBody] = useState('저항군 요원으로부터 독립 호출이 전달되었습니다.');
  const [pingBusy, setPingBusy] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

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
        setPushError(
          'Web Push 미지원 브라우저입니다. 아이폰은 Safari [공유 ➔ 홈 화면에 추가] 후 실행해 주세요.'
        );
        return;
      }
      if (!vapidKey) {
        setPushError('서버 VAPID 키를 불러오지 못했습니다.');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushError('알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해 주세요.');
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
      setPushMsg(`단말기 연결 완료! 요원 코드: ${data.agent.agentId}`);
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
      setPingResult('수신 요원 코드를 입력하세요.');
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
          title: pingTitle,
          body: pingBody,
          url: '/app',
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setPingResult(`발송 실패: ${data.error}`);
      } else {
        setPingResult(`✓ ${code} 단말기로 독립 푸시 발사 완료`);
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
    <div className="min-h-screen bg-[#f4f4f0] text-black flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-[#f4f4f0] border-b-2 border-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/oops"
              className="group inline-flex items-center gap-1.5 select-none cursor-pointer"
              title="OOPS 홈으로 이동"
            >
              <span className="inline-block px-2.5 py-0.5 bg-[#ff4d00] text-white font-black text-sm sm:text-base font-mono tracking-tighter border-2 border-black shadow-[2px_2px_0px_#000] -rotate-2 group-hover:rotate-0 group-hover:scale-105 group-active:translate-x-[1px] group-active:translate-y-[1px] group-active:shadow-none transition-all uppercase">
                oops!
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-black tracking-tight hidden xs:inline">
                .monster
              </span>
            </Link>
            <span className="px-2 py-0.5 bg-[#ffc900] border-2 border-black text-xs font-mono font-bold">
              APP
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold bg-white border-2 border-black shadow-[2px_2px_0_#000] px-2.5 py-1">
            <Radio className="w-3.5 h-3.5 text-[#ff4d00] animate-pulse" />
            <span>노드 {agentsCount}</span>
          </div>
        </div>
      </header>

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

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-8 sm:py-12 space-y-8">
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
                  <span>01. 내 단말기 신호 연결</span>
                </span>
                {myAgentId && (
                  <span className="text-xs font-mono font-black px-2 py-0.5 bg-[#ffc900] border border-black">
                    {myAgentId}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-medium">
                앱스토어 없이 폰을 독립 수신기로 등록합니다. 발급된 고유 링크를 친구나 동료에게 전달하세요.
              </p>

              <div className="space-y-2.5">
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="요원 호출명 (예: 김대표)"
                  className="w-full px-3 py-2.5 bg-white border-2 border-black text-sm font-mono focus:outline-none focus:bg-[#ffc900]/15"
                />
                <button
                  type="button"
                  disabled={pushBusy}
                  onClick={connectIndependentPush}
                  className="w-full py-3 px-4 bg-[#ffc900] hover:bg-[#ffd633] text-black font-black text-sm border-2 border-black shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  <span>{pushBusy ? '연결 중...' : myAgentId ? '통신망 재동기화' : '알림 켜기'}</span>
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
                    내 직통 호출 링크
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
                      <span>{copied ? '복사됨' : '복사'}</span>
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
                  <span>02. 회원 간 직통 호출</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-zinc-600">DIRECT PING</span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-medium">
                상대방의 요원 코드를 입력하면 메신저나 SNS 없이 상대방 잠금 화면에 즉시 신호를 보냅니다.
              </p>

              <div className="space-y-2.5">
                <input
                  type="text"
                  value={targetCode}
                  onChange={(e) => setTargetCode(e.target.value.toUpperCase())}
                  placeholder="수신 요원 코드 (예: OP-XXXXXX)"
                  className="w-full px-3 py-2.5 bg-white border-2 border-black text-sm font-mono font-bold focus:outline-none focus:bg-[#ff90e8]/15"
                />
                <input
                  type="text"
                  value={pingTitle}
                  onChange={(e) => setPingTitle(e.target.value)}
                  placeholder="알림 제목"
                  className="w-full px-3 py-2 bg-white border-2 border-black text-sm focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={pingBody}
                  onChange={(e) => setPingBody(e.target.value)}
                  placeholder="메시지 내용"
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
                    <span>{pingBusy ? '전송 중...' : '신호 발사'}</span>
                  </button>
                  {myAgentId && (
                    <button
                      type="button"
                      disabled={pingBusy}
                      onClick={() => sendMonsterPing(myAgentId)}
                      className="px-4 py-3 bg-white hover:bg-zinc-100 border-2 border-black shadow-[3px_3px_0_#000] text-xs font-mono font-black cursor-pointer"
                    >
                      내 폰 테스트
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

      <footer className="border-t-2 border-black bg-white py-6 px-5 text-xs font-mono mt-auto">
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
          <div className="text-zinc-600">독립 통신망 운영본부</div>
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
