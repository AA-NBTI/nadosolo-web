'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Lock, Radio, Send, Users } from 'lucide-react';
import type { OopsReleaseEntry } from '@/lib/oops/releases';

interface AgentRow {
  agentId: string;
  alias: string;
  createdAt: string;
  lastPingAt: string | null;
}

interface BackerRow {
  id: string;
  name: string;
  org: string;
  email: string;
  tier: string;
  message: string;
  createdAt: string;
}

export default function OopsHqAdminPage() {
  const [passkey, setPasskey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [latestVersion, setLatestVersion] = useState('v0.4.0');
  const [releases, setReleases] = useState<OopsReleaseEntry[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [backers, setBackers] = useState<BackerRow[]>([]);

  const [bcTitle, setBcTitle] = useState('OOPS HQ 공지');
  const [bcBody, setBcBody] = useState('');
  const [bcBusy, setBcBusy] = useState(false);
  const [bcResult, setBcResult] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (keyToUse: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/oops/hq', {
        headers: { 'x-oops-hq-key': keyToUse },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAuthed(false);
        setError(data.error || '인증 실패');
        return;
      }
      setAuthed(true);
      setLatestVersion(data.latestVersion || 'v0.3.0');
      setReleases(data.releases || []);
      setAgents(data.agents || []);
      setBackers(data.backers || []);
    } catch {
      setError('서버 연결 오류');
    } finally {
      setLoading(false);
    }
  }, []);

  // 링크 진입 시 기존 저장된 비밀번호 자동로그인 제거 (항상 암호 수동 입력 강제)
  useEffect(() => {
    localStorage.removeItem('oops_hq_key_v1');
    setPasskey('');
    setAuthed(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchDashboard(passkey.trim());
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBcBusy(true);
    setBcResult(null);
    try {
      const res = await fetch('/api/oops/hq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-oops-hq-key': passkey.trim(),
        },
        body: JSON.stringify({
          action: 'BROADCAST',
          title: bcTitle,
          body: bcBody,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setBcResult(`실패: ${data.error}`);
      } else {
        setBcResult(
          `발송 완료 (전체 ${data.result.total} / 성공 ${data.result.sent} / 실패 ${data.result.failed})`
        );
        setBcBody('');
      }
    } finally {
      setBcBusy(false);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#f4f4f0] text-black flex items-center justify-center p-5">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <span className="font-mono font-black text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#ff4d00]" />
              <span>OOPS HQ CONSOLE</span>
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#ffc900] border border-black">
              RESTRICTED
            </span>
          </div>

          <p className="text-xs text-zinc-700 font-medium">
            OOPS HQ 관제실 보안 인증이 필요합니다. 관리자 암호를 입력해 주세요.
          </p>

          <input
            type="password"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
            placeholder="HQ 접속 암호 입력"
            className="w-full px-3.5 py-2.5 bg-[#f4f4f0] border-2 border-black text-sm font-mono focus:outline-none focus:bg-white"
          />

          {error && (
            <div className="p-2.5 bg-[#ff4d00]/15 border-2 border-black text-xs font-bold text-red-900">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black text-white font-black text-sm border-2 border-black shadow-[3px_3px_0px_#ff90e8] cursor-pointer"
          >
            {loading ? '확인 중...' : 'HQ 관제실 입장 ➔'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-black flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-[#f4f4f0] border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/oops"
              className="px-2.5 py-1 bg-white border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-mono font-bold flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>oops.monster</span>
            </Link>
            <span className="font-mono font-black text-sm sm:text-base">OOPS HQ CONSOLE</span>
            <span className="px-2 py-0.5 bg-[#ff90e8] border-2 border-black text-xs font-mono font-black">
              {latestVersion}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('oops_hq_key_v1');
              setAuthed(false);
            }}
            className="px-3 py-1 bg-white border-2 border-black text-xs font-mono font-bold cursor-pointer"
          >
            잠금
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-5 py-8 space-y-8">
        {/* 상단 지표 3카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-5">
            <div className="text-xs font-mono font-bold text-zinc-600 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#ff4d00]" />
              <span>연결 노드 (PUSH AGENTS)</span>
            </div>
            <div className="text-3xl font-black mt-2 font-mono">{agents.length}</div>
          </div>
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] p-5">
            <div className="text-xs font-mono font-bold text-zinc-600 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-black" />
              <span>창립 백커 신청 (BACKERS)</span>
            </div>
            <div className="text-3xl font-black mt-2 font-mono">{backers.length}</div>
          </div>
          <div className="bg-[#ffc900] border-2 border-black shadow-[4px_4px_0px_#000] p-5">
            <div className="text-xs font-mono font-bold text-black">OOPS 독립 버전</div>
            <div className="text-3xl font-black mt-2 font-mono">{latestVersion}</div>
          </div>
        </div>

        {/* 전체 노드 브로드캐스트 + 요원 목록 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleBroadcast}
            className="bg-white border-2 border-black shadow-[5px_5px_0px_#000] p-5 space-y-4"
          >
            <div className="font-mono font-black text-sm border-b-2 border-black pb-2 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#ff4d00]" />
              <span>전체 저항군 노드 일괄 푸시 발송 (BROADCAST)</span>
            </div>
            <input
              type="text"
              value={bcTitle}
              onChange={(e) => setBcTitle(e.target.value)}
              placeholder="공지 제목"
              className="w-full px-3 py-2 bg-[#f4f4f0] border-2 border-black text-sm"
            />
            <textarea
              rows={3}
              required
              value={bcBody}
              onChange={(e) => setBcBody(e.target.value)}
              placeholder="연결된 모든 기기에 보낼 공지 메시지"
              className="w-full px-3 py-2 bg-[#f4f4f0] border-2 border-black text-sm"
            />
            <button
              type="submit"
              disabled={bcBusy}
              className="w-full py-2.5 bg-[#ff90e8] border-2 border-black shadow-[3px_3px_0px_#000] font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{bcBusy ? '발송 중...' : `전체 ${agents.length}개 노드에 즉시 발사`}</span>
            </button>
            {bcResult && (
              <div className="p-2.5 bg-[#a3e635]/40 border-2 border-black text-xs font-mono font-bold">
                {bcResult}
              </div>
            )}
          </form>

          {/* 연결 요원 목록 */}
          <div className="bg-white border-2 border-black shadow-[5px_5px_0px_#000] p-5 space-y-3">
            <div className="font-mono font-black text-sm border-b-2 border-black pb-2">
              연결된 요원 단말기 ({agents.length})
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {agents.length === 0 ? (
                <div className="text-xs text-zinc-500 font-mono py-6 text-center">
                  아직 연결된 푸시 노드가 없습니다.
                </div>
              ) : (
                agents.map((a) => (
                  <div
                    key={a.agentId}
                    className="flex items-center justify-between px-3 py-2 bg-[#f4f4f0] border border-black text-xs font-mono"
                  >
                    <div>
                      <span className="font-black">{a.agentId}</span> · {a.alias}
                    </div>
                    <div className="text-zinc-600">{a.createdAt.slice(0, 10)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 창립 백커 신청 내역 */}
        <section className="bg-white border-2 border-black shadow-[5px_5px_0px_#000] p-5 space-y-4">
          <div className="font-mono font-black text-sm border-b-2 border-black pb-2">
            창립 백커 · 동지 합류 신청 내역 ({backers.length})
          </div>
          {backers.length === 0 ? (
            <div className="text-xs text-zinc-500 font-mono py-6 text-center">
              아직 접수된 백커 신청이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {backers.map((b) => (
                <div key={b.id} className="p-4 bg-[#f4f4f0] border-2 border-black space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-black bg-[#ffc900] px-1.5 border border-black">{b.id}</span>
                    <span className="text-zinc-600">{b.createdAt.slice(0, 16).replace('T', ' ')}</span>
                  </div>
                  <div className="text-sm font-black">
                    {b.name} {b.org ? `(${b.org})` : ''}
                  </div>
                  <div className="text-xs font-mono text-blue-800">{b.email}</div>
                  {b.message && <p className="text-xs text-zinc-800 pt-1">{b.message}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* OOPS 전용 패치 노트 / 버전 이력 */}
        <section className="bg-white border-2 border-black shadow-[5px_5px_0px_#000] p-5 space-y-4">
          <div className="font-mono font-black text-sm border-b-2 border-black pb-2">
            OOPS.MONSTER 독립 업데이트 이력 (나도솔로 버전과 분리됨)
          </div>
          <div className="space-y-3">
            {releases.map((r) => (
              <div key={r.version} className="p-4 bg-[#f4f4f0] border-2 border-black space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-black text-white font-mono text-xs font-black">
                    {r.version}
                  </span>
                  <span className="text-xs font-mono text-zinc-600">{r.date}</span>
                </div>
                <div className="text-sm font-black">{r.title}</div>
                <ul className="list-disc pl-5 text-xs text-zinc-800 space-y-1">
                  {r.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
