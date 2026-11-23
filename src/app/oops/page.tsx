'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Bell,
  Check,
  Copy,
  Radio,
  Send,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react';

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
  const [pingTitle, setPingTitle] = useState('OOPS! 몬스터 호출');
  const [pingBody, setPingBody] = useState('거대 플랫폼 없이 보낸 직통 알림입니다. 지금 확인하세요!');
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
      setPushMsg(`독립 통신망 연결 완료! 고유 코드: ${data.agent.agentId}`);
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
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col">
      {/* 상단 OOPS HQ 헤더 */}
      <header className="sticky top-0 z-40 bg-[#07080a]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-lg font-bold tracking-tight text-white">
              oops.monster
            </span>
            <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 border border-red-500/40 text-red-400">
              AI RESISTANCE HQ
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 border border-white/15 px-3 py-1.5 bg-white/[0.03]">
            <Radio className="w-3.5 h-3.5 text-red-400" />
            <span>연결 노드 {agentsCount}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-12 sm:py-16 space-y-16">
        {/* 1. 창립 선언문 */}
        <section className="space-y-6 border-b border-white/10 pb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-red-500/40 bg-red-500/10 text-xs font-mono text-red-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>FOUNDING MANIFESTO · HUMAN-FIRST INFRASTRUCTURE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.2] text-white">
            AI가 인간보다 더 많은 것을 결정할 수 있는 세상에서,
            <br />
            <span className="text-red-400">누가 인간의 편에 설 것인가?</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 max-w-3xl leading-relaxed">
            <strong>OOPS HQ</strong>는 거대 플랫폼과 AI 알고리즘의 통제를 거부하고,
            인간이 최종 통제권(브레이크)과 직통 연결망을 되찾기 위해 출범한
            <strong> AI 저항군 본부</strong>입니다. 우리는 말뿐인 선언이 아닌,
            카카오톡 API와 앱스토어 검열을 거치지 않는 <strong>독립 통신망</strong>을 직접 가동합니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 border border-white/10 bg-[#0d0f14] space-y-1.5">
              <div className="text-xs font-mono text-red-400">01 · 신경망 (OOPS)</div>
              <div className="text-sm font-semibold text-white">독립 직통 푸시망</div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                메신저 통행세 0원. 사람·매장·AI의 실수 직전 호출을 폰으로 즉시 전송합니다.
              </p>
            </div>
            <a
              href="https://nadosolo.com"
              className="p-4 border border-white/10 bg-[#0d0f14] hover:border-white/25 transition-colors space-y-1.5"
            >
              <div className="text-xs font-mono text-[#f04f74]">02 · 아지트 (NADOSOLO)</div>
              <div className="text-sm font-semibold text-white">오프라인 인간 연대</div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                스크린 너머가 아닌 실제 식탁에서 얼굴을 맞대고 소통하는 소셜 메타인지 플랫폼.
              </p>
            </a>
            <a
              href="https://tablebaro.com"
              className="p-4 border border-white/10 bg-[#0d0f14] hover:border-white/25 transition-colors space-y-1.5"
            >
              <div className="text-xs font-mono text-blue-400">03 · 보급로 (TABLEBARO)</div>
              <div className="text-sm font-semibold text-white">실물 매장 직거래</div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                거대 플랫폼 수수료 없이 오프라인 매장과 손님을 직접 연결하는 예약 엔진.
              </p>
            </a>
          </div>
        </section>

        {/* 2. 제1호 무기: 3초 독립 PWA 푸시 통신망 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 좌측: 내 기기 연결 */}
          <div className="p-6 border border-white/15 bg-[#0c0e14] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-mono text-white font-semibold">
                <Smartphone className="w-4 h-4 text-red-400" />
                <span>STEP 1 · 내 기기 독립 통신망 연결</span>
              </div>
              {myAgentId && (
                <span className="text-xs font-mono px-2 py-0.5 border border-white/20 bg-white/5 text-white">
                  {myAgentId}
                </span>
              )}
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              앱스토어 설치 없이 브라우저 표준(Web Push / PWA)으로 즉시 연결됩니다.
              연결 후 발급되는 호출 링크를 친구·가족·AI 시스템에 넘겨보세요.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="요원 호출명 (예: 김대표, 지수)"
                className="w-full px-3.5 py-2.5 bg-[#07080a] border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
              />
              <button
                type="button"
                disabled={pushBusy}
                onClick={connectIndependentPush}
                className="w-full py-3 px-4 bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>{pushBusy ? '연결 중...' : myAgentId ? '통신망 재동기화' : '내 기기 독립 알림 켜기'}</span>
              </button>
            </div>

            {pushMsg && (
              <div className="p-3 border border-white/20 bg-white/[0.04] text-xs font-mono text-zinc-100">
                {pushMsg}
              </div>
            )}
            {pushError && (
              <div className="p-3 border border-red-500/40 bg-red-500/10 text-xs text-red-300">
                {pushError}
              </div>
            )}

            {myAgentId && (
              <div className="p-3.5 border border-white/15 bg-[#07080a] space-y-2.5">
                <div className="text-xs font-mono text-zinc-400">내 직통 호출 링크 (공유용)</div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs text-white truncate">
                    https://oops.monster/?ping={myAgentId}
                  </code>
                  <button
                    type="button"
                    onClick={copyShareUrl}
                    className="shrink-0 px-2.5 py-1 border border-white/20 text-xs font-mono text-white hover:bg-white/10 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '복사됨' : '복사'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="text-xs text-zinc-400 border-t border-white/10 pt-3 leading-relaxed">
              📱 <strong>아이폰(iOS)</strong>은 Safari 하단 <strong>공유(□↑) ➔ 홈 화면에 추가</strong> 후
              바탕화면 아이콘으로 실행해야 알림이 수신됩니다.
            </div>
          </div>

          {/* 우측: 몬스터 호출 발사 */}
          <div className="p-6 border border-white/15 bg-[#0c0e14] space-y-5">
            <div className="flex items-center gap-2 text-sm font-mono text-white font-semibold">
              <Zap className="w-4 h-4 text-red-400" />
              <span>STEP 2 · 직통 몬스터 호출 발사 (무설치)</span>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              상대방의 요원 코드만 입력하면 카카오톡 없이 서버가 즉시 기기 잠금화면에 푸시를 쏩니다.
              방금 내 기기를 연결하셨다면 바로 자가 테스트해 보세요.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={targetCode}
                onChange={(e) => setTargetCode(e.target.value.toUpperCase())}
                placeholder="수신 요원 코드 (예: OP-XXXXXX)"
                className="w-full px-3.5 py-2.5 bg-[#07080a] border border-white/15 text-sm font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
              />
              <input
                type="text"
                value={pingTitle}
                onChange={(e) => setPingTitle(e.target.value)}
                placeholder="알림 제목"
                className="w-full px-3.5 py-2.5 bg-[#07080a] border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
              />
              <textarea
                rows={2}
                value={pingBody}
                onChange={(e) => setPingBody(e.target.value)}
                placeholder="전달할 메시지"
                className="w-full px-3.5 py-2.5 bg-[#07080a] border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pingBusy}
                  onClick={() => sendMonsterPing()}
                  className="flex-1 py-3 px-4 border border-red-500/60 bg-red-500/20 hover:bg-red-500/30 text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{pingBusy ? '발사 중...' : '독립 푸시 발사'}</span>
                </button>
                {myAgentId && (
                  <button
                    type="button"
                    disabled={pingBusy}
                    onClick={() => sendMonsterPing(myAgentId)}
                    className="px-4 py-3 border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-mono text-white cursor-pointer"
                  >
                    내 폰 테스트
                  </button>
                )}
              </div>
            </div>

            {pingResult && (
              <div className="p-3 border border-white/20 bg-white/[0.04] text-xs font-mono text-zinc-100">
                {pingResult}
              </div>
            )}
          </div>
        </section>

        {/* 3. 창립 백커(Founding Backer) · 동지 합류 */}
        <section className="p-6 sm:p-8 border border-white/15 bg-[#0c0e14] space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-red-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FOUNDING BACKERS & ALLIES</span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              창립 백커 · 전략적 파트너 합류
            </h2>
            <p className="text-sm text-zinc-300 max-w-2xl">
              인간 주권 기술과 독립 통신망 비전에 공감하는 CEO, 엔젤 투자자, 엔지니어의 합류를 기다립니다.
              후원·전략 투자·기술 제휴 의사를 남겨주시면 본부에서 직접 연락드립니다.
            </p>
          </div>

          <form onSubmit={submitBacker} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={backerName}
              onChange={(e) => setBackerName(e.target.value)}
              placeholder="성함 *"
              className="px-3.5 py-2.5 bg-[#07080a] border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
            />
            <input
              type="text"
              value={backerOrg}
              onChange={(e) => setBackerOrg(e.target.value)}
              placeholder="소속 / 직책"
              className="px-3.5 py-2.5 bg-[#07080a] border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
            />
            <input
              type="email"
              required
              value={backerEmail}
              onChange={(e) => setBackerEmail(e.target.value)}
              placeholder="회신받을 이메일 *"
              className="sm:col-span-2 px-3.5 py-2.5 bg-[#07080a] border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
            />
            <textarea
              rows={3}
              value={backerMessage}
              onChange={(e) => setBackerMessage(e.target.value)}
              placeholder="합류 형태(창립 백커 후원 / 전략 투자 / 기술 기여) 및 메시지"
              className="sm:col-span-2 px-3.5 py-2.5 bg-[#07080a] border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
            />
            <div className="sm:col-span-2 flex items-center justify-between gap-4 pt-1">
              <button
                type="submit"
                disabled={backerBusy}
                className="px-6 py-3 bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                {backerBusy ? '전송 중...' : '합류 의사 전달'}
              </button>
              {backerDone && (
                <span className="text-xs font-mono text-zinc-200">{backerDone}</span>
              )}
            </div>
          </form>
        </section>
      </main>

      {/* 하단 푸터 */}
      <footer className="border-t border-white/10 py-8 px-5 text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-mono text-zinc-400">
            OOPS.MONSTER · Operated by 템바보드 주식회사 (107-88-44796)
          </div>
          <div className="flex items-center gap-4 font-mono">
            <a href="https://nadosolo.com" className="hover:text-white transition-colors">
              nadosolo.com
            </a>
            <a href="https://tablebaro.com" className="hover:text-white transition-colors">
              tablebaro.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function OopsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07080a]" />}>
      <OopsHqContent />
    </Suspense>
  );
}
