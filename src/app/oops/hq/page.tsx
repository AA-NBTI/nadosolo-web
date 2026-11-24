'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { ArrowLeft, Bell, Lock, QrCode, Radio, Send, Users } from 'lucide-react';
import type { OopsReleaseEntry } from '@/lib/oops/releases';
import type { OopsSignal } from '@/lib/oops/signalStore';

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
  const [signals, setSignals] = useState<OopsSignal[]>([]);
  const [bannedAgents, setBannedAgents] = useState<string[]>([]);
  const [hqTrans, setHqTrans] = useState<Record<string, string>>({});
  const [hqTransBusy, setHqTransBusy] = useState<string | null>(null);

  // UTM / QR 캠페인 생성 및 통계 상태
  const [trackingSummary, setTrackingSummary] = useState<{
    totalVisits: number;
    totalConversions: number;
    bySource: { source: string; visits: number; conversions: number }[];
  } | null>(null);
  const [utmSource, setUtmSource] = useState('x');
  const [utmCampaign, setUtmCampaign] = useState('launch_us');
  const [qrImage, setQrImage] = useState('');
  const [utmCopied, setUtmCopied] = useState(false);

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
      setSignals(data.signals || []);
      setBannedAgents(data.bannedAgents || []);
      if (data.trackingSummary) {
        setTrackingSummary(data.trackingSummary);
      }
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

  useEffect(() => {
    const src = encodeURIComponent(utmSource.trim() || 'direct');
    const camp = encodeURIComponent(utmCampaign.trim() || 'launch');
    const targetUrl = `https://oops.monster/?utm_source=${src}&utm_medium=campaign&utm_campaign=${camp}`;
    void QRCode.toDataURL(targetUrl, {
      width: 180,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setQrImage);
  }, [utmSource, utmCampaign]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchDashboard(passkey.trim());
  };

  const translateInPlace = async (sig: OopsSignal) => {
    if (hqTrans[sig.id]) {
      setHqTrans((prev) => {
        const next = { ...prev };
        delete next[sig.id];
        return next;
      });
      return;
    }
    setHqTransBusy(sig.id);
    try {
      const res = await fetch('/api/oops/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sig.content, targetLang: 'ko' }),
      });
      const data = await res.json();
      if (data.ok && data.translatedText) {
        setHqTrans((prev) => ({ ...prev, [sig.id]: data.translatedText }));
      }
    } catch {} finally {
      setHqTransBusy(null);
    }
  };

  const handleModerate = async (
    modAction: 'PIN' | 'UNPIN' | 'HIDE' | 'RESTORE' | 'SHADOWBAN' | 'UNBAN',
    signalId?: string,
    agentId?: string
  ) => {
    try {
      const res = await fetch('/api/oops/hq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-oops-hq-key': passkey.trim(),
        },
        body: JSON.stringify({
          action: 'MODERATE',
          modAction,
          signalId,
          agentId,
        }),
      });
      if (res.ok) {
        void fetchDashboard(passkey.trim());
      }
    } catch {}
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
      <div className="oops-theme min-h-screen bg-[#f4f4f0] text-black flex items-center justify-center p-5 selection:bg-[#ffc900] selection:text-black">
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
    <div className="oops-theme min-h-screen bg-[#f4f4f0] text-black flex flex-col font-sans selection:bg-[#ffc900] selection:text-black">
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

        {/* UTM · QR 캠페인 생성기 & 유입 통계 */}
        <section className="bg-white border-2 border-black shadow-[5px_5px_0px_#000] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2">
            <span className="font-mono font-black text-sm flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#ff4d00]" />
              <span>UTM · QR 유입 추적 및 캠페인 생성기</span>
            </span>
            {trackingSummary && (
              <span className="text-xs font-mono font-bold bg-[#ffc900] px-2 py-0.5 border border-black">
                누적 방문 {trackingSummary.totalVisits} · 타전 전환 {trackingSummary.totalConversions}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="md:col-span-2 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  placeholder="유입 소스 (예: x, reddit, hn, sticker)"
                  className="px-3 py-2 bg-[#f4f4f0] border-2 border-black text-xs font-mono"
                />
                <input
                  type="text"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  placeholder="캠페인명 (예: launch_us)"
                  className="px-3 py-2 bg-[#f4f4f0] border-2 border-black text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://oops.monster/?utm_source=${encodeURIComponent(utmSource.trim() || 'direct')}&utm_medium=campaign&utm_campaign=${encodeURIComponent(utmCampaign.trim() || 'launch')}`}
                  className="flex-1 px-3 py-2 bg-[#f4f4f0] border border-black text-xs font-mono text-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    const u = `https://oops.monster/?utm_source=${encodeURIComponent(utmSource.trim() || 'direct')}&utm_medium=campaign&utm_campaign=${encodeURIComponent(utmCampaign.trim() || 'launch')}`;
                    void navigator.clipboard.writeText(u);
                    setUtmCopied(true);
                    setTimeout(() => setUtmCopied(false), 1800);
                  }}
                  className="px-3.5 py-2 bg-black text-white text-xs font-mono font-bold border-2 border-black cursor-pointer shrink-0"
                >
                  {utmCopied ? '복사됨' : '복사'}
                </button>
              </div>

              {/* 채널별 유입 통계 */}
              {trackingSummary && trackingSummary.bySource.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  <div className="text-xs font-mono font-bold text-zinc-600">채널별 유입 및 타전 전환율</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {trackingSummary.bySource.map((row) => (
                      <div key={row.source} className="p-2.5 bg-[#f4f4f0] border border-black text-xs font-mono">
                        <div className="font-black text-black uppercase">{row.source}</div>
                        <div className="text-zinc-700 mt-0.5">
                          방문 {row.visits} / 타전 {row.conversions}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-[#f4f4f0] border-2 border-black space-y-2">
              {qrImage && (
                <img src={qrImage} alt="Campaign QR" className="w-32 h-32 border-2 border-black bg-white" />
              )}
              {qrImage && (
                <a
                  href={qrImage}
                  download={`oops-qr-${utmSource || 'direct'}.png`}
                  className="px-3 py-1 bg-white hover:bg-zinc-100 border border-black text-xs font-mono font-bold cursor-pointer"
                >
                  QR 다운로드
                </a>
              )}
            </div>
          </div>
        </section>

        {/* 글로벌 무전 피드 관제 & Shadowban 제어 */}
        <section className="bg-white border-2 border-black shadow-[5px_5px_0px_#000] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2">
            <span className="font-mono font-black text-sm">
              글로벌 무전 피드 관제 ({signals.length}건 · 그림자 차단 요원 {bannedAgents.length}명)
            </span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {signals.map((sig) => {
              const isBanned = bannedAgents.includes(sig.authorAgentId);
              const translated = hqTrans[sig.id];

              return (
                <div
                  key={sig.id}
                  className={`p-3.5 border-2 border-black space-y-2 ${
                    sig.isHidden ? 'bg-zinc-200 opacity-75' : 'bg-[#f4f4f0]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-black bg-white px-1.5 py-0.5 border border-black">
                        CASE #OP-{String(sig.caseNum || 100).padStart(4, '0')}
                      </span>
                      <span className="font-bold">[{sig.category}]</span>
                      <span className="text-zinc-600">
                        {sig.authorCallsign} ({sig.authorAgentId})
                      </span>
                      {sig.isPinned && (
                        <span className="px-1.5 py-0.5 bg-[#ff4d00] text-white font-black">고정됨</span>
                      )}
                      {sig.isHidden && (
                        <span className="px-1.5 py-0.5 bg-black text-white font-black">숨김</span>
                      )}
                      {isBanned && (
                        <span className="px-1.5 py-0.5 bg-red-700 text-white font-black">SHADOWBAN</span>
                      )}
                    </div>
                    <div className="font-bold">
                      ✊ {sig.upvotes} · 🚩 {sig.reports}
                    </div>
                  </div>

                  <p className="text-sm font-bold text-black">{sig.content}</p>
                  {translated && (
                    <div className="p-2 bg-white border-l-4 border-black text-xs font-medium text-zinc-800">
                      {translated}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={hqTransBusy === sig.id}
                      onClick={() => translateInPlace(sig)}
                      className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-black text-xs font-mono font-bold cursor-pointer"
                    >
                      {hqTransBusy === sig.id ? '번역 중...' : translated ? '번역 접기' : '한글 번역'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleModerate(sig.isPinned ? 'UNPIN' : 'PIN', sig.id)}
                      className="px-2.5 py-1 bg-[#ffc900] hover:bg-[#ffd633] border border-black text-xs font-mono font-bold cursor-pointer"
                    >
                      {sig.isPinned ? '고정 해제' : '핀 고정'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleModerate(sig.isHidden ? 'RESTORE' : 'HIDE', sig.id)}
                      className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-black text-xs font-mono font-bold cursor-pointer"
                    >
                      {sig.isHidden ? '복구' : '숨김'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleModerate(isBanned ? 'UNBAN' : 'SHADOWBAN', undefined, sig.authorAgentId)
                      }
                      className={`px-2.5 py-1 border border-black text-xs font-mono font-bold cursor-pointer ${
                        isBanned ? 'bg-black text-white' : 'bg-[#ff90e8] text-black'
                      }`}
                    >
                      {isBanned ? '차단 해제' : '그림자 차단'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

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
