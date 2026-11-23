'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bell, Check, Copy, Radio, Send, Sparkles, Zap } from 'lucide-react';

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
function OopsMonsterMascot() {
  return (
    <div className="relative inline-flex flex-col items-center select-none">
      <div className="mb-2 px-3 py-1 bg-[#ffc900] border-2 border-black shadow-[3px_3px_0px_#000] text-xs font-mono font-bold text-black -rotate-2">
        OOPS! HUMAN ONLY
      </div>
      <svg
        width="136"
        height="136"
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[5px_5px_0px_#000]"
      >
        {/* 뿔 */}
        <path d="M40 36L28 12L54 28Z" fill="#ffc900" stroke="#000" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M100 36L112 12L86 28Z" fill="#ffc900" stroke="#000" strokeWidth="3.5" strokeLinejoin="round" />
        {/* 몸통 */}
        <rect x="22" y="28" width="96" height="92" rx="28" fill="#ff90e8" stroke="#000" strokeWidth="4" />
        {/* 왼쪽 눈 */}
        <circle cx="52" cy="64" r="15" fill="#fff" stroke="#000" strokeWidth="3.5" />
        <circle cx="55" cy="64" r="6" fill="#000" />
        <circle cx="57" cy="61" r="2" fill="#fff" />
        {/* 오른쪽 눈 */}
        <circle cx="88" cy="64" r="13" fill="#fff" stroke="#000" strokeWidth="3.5" />
        <circle cx="86" cy="65" r="5.5" fill="#000" />
        <circle cx="88" cy="62" r="2" fill="#fff" />
        {/* 입 (익살스러운 지그재그) */}
        <path
          d="M46 94C54 103 86 103 94 94"
          stroke="#000"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="M58 97L62 104L67 98" fill="#fff" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M75 98L80 104L83 97" fill="#fff" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
        {/* 팔 */}
        <path d="M22 76C10 72 8 88 20 92" stroke="#000" strokeWidth="4" strokeLinecap="round" />
        <path d="M118 76C130 72 132 88 120 92" stroke="#000" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function OopsHqContent() {
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
  const [pingTitle, setPingTitle] = useState('OOPS! 몬스터 출동');
  const [pingBody, setPingBody] = useState('거대 플랫폼 없이 인간이 직접 보낸 호출입니다!');
  const [pingBusy, setPingBusy] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const [backerName, setBackerName] = useState('');
  const [backerOrg, setBackerOrg] = useState('');
  const [backerEmail, setBackerEmail] = useState('');
  const [backerMessage, setBackerMessage] = useState('');
  const [backerBusy, setBackerBusy] = useState(false);
  const [backerDone, setBackerDone] = useState<string | null>(null);

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
        setPushError(
          '이 브라우저는 Web Push를 지원하지 않습니다. 아이폰은 Safari [공유 ➔ 홈 화면에 추가] 후 앱으로 열어주세요.'
        );
        return;
      }
      if (!vapidKey) {
        setPushError('서버 푸시 공개키를 불러오지 못했습니다.');
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
          alias: alias.trim() || '저항군 요원',
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
      setPushMsg(`독립 통신망 연결 완료! 내 요원 코드: ${data.agent.agentId}`);
      void loadStatus();
    } catch (err) {
      setPushError(err instanceof Error ? err.message : '통신망 연결 중 오류가 발생했습니다.');
    } finally {
      setPushBusy(false);
    }
  };

  const sendMonsterPing = async (overrideId?: string) => {
    const code = (overrideId || targetCode).trim().toUpperCase();
    if (!code) {
      setPingResult('수신할 요원 코드(예: OP-XXXXXX)를 입력해 주세요.');
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
          url: '/oops',
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setPingResult(`발송 실패: ${data.error}`);
      } else {
        setPingResult(`✓ ${code} 기기로 독립 푸시 발사 완료!`);
      }
    } catch {
      setPingResult('네트워크 오류가 발생했습니다.');
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
        setBackerDone(`접수 완료 (${data.backerId}). 본부에서 직접 회신드리겠습니다.`);
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
      {/* 1. Gumroad 스타일 상단 네비게이션 */}
      <header className="sticky top-0 z-40 bg-[#f4f4f0] border-b-2 border-black">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-[#ff90e8] border-2 border-black shadow-[2px_2px_0px_#000] font-mono text-sm font-black tracking-tight">
              oops.monster
            </span>
            <span className="hidden sm:inline-block text-xs font-mono font-bold px-2 py-0.5 bg-[#ffc900] border-2 border-black">
              AI RESISTANCE HQ
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold bg-white border-2 border-black shadow-[2px_2px_0px_#000] px-3 py-1.5">
            <Radio className="w-3.5 h-3.5 text-[#ff4d00] animate-pulse" />
            <span>ACTIVE NODES: {agentsCount}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-10 sm:py-14 space-y-14">
        {/* 2. Gumroad 베이스: 창립 선언문 + 몬스터 마스코트 */}
        <section className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-6 sm:p-10">
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8">
            <div className="space-y-5 flex-1">
              <div className="inline-block px-3 py-1 bg-[#ffc900] border-2 border-black text-xs font-mono font-bold">
                FOUNDING MANIFESTO · 2026
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.15] text-black">
                AI가 인간보다 더 많은 것을 결정할 수 있는 세상에서,{' '}
                <span className="bg-[#ff90e8] px-1.5 inline-block border-b-4 border-black">
                  누가 인간의 편에 설 것인가?
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-800 leading-relaxed font-medium">
                <strong>OOPS HQ</strong>는 거대 AI와 플랫폼의 알고리즘 통제에 맞서,
                인간이 <strong>최종 브레이크</strong>와 <strong>무검열 직통 통신망</strong>을
                되찾기 위해 만든 AI 저항군 본부입니다.
              </p>
            </div>

            <div className="shrink-0">
              <OopsMonsterMascot />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 mt-8 border-t-2 border-black">
            <div className="p-4 bg-[#f4f4f0] border-2 border-black shadow-[3px_3px_0px_#000] space-y-1">
              <div className="text-xs font-mono font-black text-[#ff4d00]">01 · DIRECT PING</div>
              <div className="text-base font-extrabold">무검열 직통 호출망</div>
              <p className="text-xs text-zinc-700 leading-relaxed">
                메신저 통행세 0원. 사람과 사람을 브라우저·기기 단위로 직접 연결합니다.
              </p>
            </div>
            <div className="p-4 bg-[#ff90e8]/35 border-2 border-black shadow-[3px_3px_0px_#000] space-y-1">
              <div className="text-xs font-mono font-black text-black">02 · HUMAN BRAKE</div>
              <div className="text-base font-extrabold">AI 실행 최종 브레이크</div>
              <p className="text-xs text-zinc-800 leading-relaxed">
                AI 에이전트가 대신 결정하기 직전, 승인·차단 버튼을 인간 손에 돌려줍니다.
              </p>
            </div>
            <div className="p-4 bg-[#ffc900]/45 border-2 border-black shadow-[3px_3px_0px_#000] space-y-1">
              <div className="text-xs font-mono font-black text-black">03 · RETRO RESISTANCE</div>
              <div className="text-base font-extrabold">아날로그 감성 암호망</div>
              <p className="text-xs text-zinc-800 leading-relaxed">
                첨단 AI 시대에 오히려 90년대 레트로 단말기 감성으로 인간의 주권을 지킵니다.
              </p>
            </div>
          </div>
        </section>

        {/* 3. 중간 삽입: Poolsuite.net 스타일 레트로 OS 윈도우 (실전 통신 단말기) */}
        <section className="bg-[#d6d3c9] border-2 border-black shadow-[8px_8px_0px_#000]">
          {/* 레트로 OS 타이틀 바 */}
          <div className="bg-[#000080] text-white px-3 py-2 border-b-2 border-black flex items-center justify-between select-none">
            <div className="flex items-center gap-2 font-mono text-xs sm:text-sm font-bold tracking-wide">
              <span className="inline-block w-3 h-3 bg-[#ffc900] border border-white" />
              <span>OOPS_SIGNAL_TERMINAL_v1.0.EXE</span>
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

          {/* 레트로 툴바 스트립 */}
          <div className="px-4 py-1.5 bg-[#ebe8df] border-b-2 border-black flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-4 font-bold">
              <span>File</span>
              <span>Signal</span>
              <span>Monsters</span>
              <span>Help</span>
            </div>
            <span className="text-zinc-700">PROTOCOL: VAPID-WEBPUSH // NO-KAKAO</span>
          </div>

          {/* 레트로 윈도우 내부 컨텐츠 */}
          <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 좌측 모듈: 내 기기 등록 */}
            <div className="bg-[#f4f4f0] border-2 border-black p-5 shadow-[4px_4px_0px_#000] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
                <span className="font-mono text-sm font-black flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#ff4d00]" />
                  <span>01. 내 기기 신호 연결</span>
                </span>
                {myAgentId && (
                  <span className="text-xs font-mono font-black px-2 py-0.5 bg-[#ffc900] border border-black">
                    {myAgentId}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed">
                앱스토어 없이 웹표준 푸시로 내 폰을 독립 단말기로 등록합니다.
                발급된 링크를 친구·가족에게 넘겨 나를 깨우게 해보세요.
              </p>

              <div className="space-y-2.5">
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="요원 호출명 (예: 김대표, 지수)"
                  className="w-full px-3 py-2.5 bg-white border-2 border-black text-sm font-mono focus:outline-none focus:bg-[#ffc900]/15"
                />
                <button
                  type="button"
                  disabled={pushBusy}
                  onClick={connectIndependentPush}
                  className="w-full py-3 px-4 bg-[#ffc900] hover:bg-[#ffd633] text-black font-black text-sm border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  <span>{pushBusy ? '연결 중...' : myAgentId ? '통신망 재동기화' : '내 기기 독립 알림 켜기'}</span>
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
                    내 직통 호출 링크 (공유용)
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
                      <span>{copied ? '복사됨' : '복사'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="text-xs font-mono text-zinc-700 pt-2 border-t border-black/20">
                📱 아이폰(iOS): Safari [공유(□↑) ➔ 홈 화면에 추가] 후 앱으로 실행 시 수신 가능
              </div>
            </div>

            {/* 우측 모듈: 몬스터 발사 */}
            <div className="bg-[#f4f4f0] border-2 border-black p-5 shadow-[4px_4px_0px_#000] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
                <span className="font-mono text-sm font-black flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#ff4d00]" />
                  <span>02. 몬스터 호출 발사</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-zinc-600">INSTANT PING</span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed">
                요원 코드만 입력하면 카카오톡 없이 서버가 상대방 기기 잠금화면에 직접 몬스터 알림을 쏩니다.
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
                  placeholder="전달할 메시지"
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
                    <span>{pingBusy ? '발사 중...' : '몬스터 푸시 발사'}</span>
                  </button>
                  {myAgentId && (
                    <button
                      type="button"
                      disabled={pingBusy}
                      onClick={() => sendMonsterPing(myAgentId)}
                      className="px-4 py-3 bg-white hover:bg-zinc-100 border-2 border-black shadow-[3px_3px_0px_#000] text-xs font-mono font-black cursor-pointer"
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

        {/* 4. Gumroad 스타일 창립 백커 합류 카드 */}
        <section className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-black text-white text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#ffc900]" />
              <span>FOUNDING BACKERS & ALLIES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-black">
              창립 백커 · 전략적 동지 합류
            </h2>
            <p className="text-sm text-zinc-700 max-w-2xl font-medium">
              인간 주권 기술과 독립 통신망 비전에 공감하는 CEO, 엔젤 투자자, 크리에이터·엔지니어의 합류를 기다립니다.
            </p>
          </div>

          <form onSubmit={submitBacker} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={backerName}
              onChange={(e) => setBackerName(e.target.value)}
              placeholder="성함 *"
              className="px-3.5 py-2.5 bg-[#f4f4f0] border-2 border-black text-sm focus:outline-none focus:bg-white"
            />
            <input
              type="text"
              value={backerOrg}
              onChange={(e) => setBackerOrg(e.target.value)}
              placeholder="소속 / 직책"
              className="px-3.5 py-2.5 bg-[#f4f4f0] border-2 border-black text-sm focus:outline-none focus:bg-white"
            />
            <input
              type="email"
              required
              value={backerEmail}
              onChange={(e) => setBackerEmail(e.target.value)}
              placeholder="회신받을 이메일 *"
              className="sm:col-span-2 px-3.5 py-2.5 bg-[#f4f4f0] border-2 border-black text-sm focus:outline-none focus:bg-white"
            />
            <textarea
              rows={3}
              value={backerMessage}
              onChange={(e) => setBackerMessage(e.target.value)}
              placeholder="합류 형태(창립 백커 후원 / 전략 투자 / 기술 기여) 및 메시지"
              className="sm:col-span-2 px-3.5 py-2.5 bg-[#f4f4f0] border-2 border-black text-sm focus:outline-none focus:bg-white"
            />
            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-4 pt-1">
              <button
                type="submit"
                disabled={backerBusy}
                className="px-6 py-3 bg-black hover:bg-zinc-800 text-white font-black text-sm border-2 border-black shadow-[4px_4px_0px_#ff90e8] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
              >
                {backerBusy ? '전송 중...' : '합류 의사 전달하기 ➔'}
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

      {/* 순수 OOPS 푸터 */}
      <footer className="border-t-2 border-black bg-white py-6 px-5 text-xs font-mono">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-bold">OOPS.MONSTER · AI RESISTANCE HEADQUARTERS</div>
          <div className="text-zinc-600">HUMAN-FIRST INDEPENDENT SIGNAL NETWORK</div>
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
