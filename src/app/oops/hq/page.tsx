'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Activity,
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronRight,
  Database,
  Globe,
  Lock,
  Pin,
  QrCode,
  Radio,
  Send,
  Shield,
  Smartphone,
  Trash2,
  Users,
} from 'lucide-react';
import type { OopsReleaseEntry } from '@/lib/oops/releases';
import type { OopsSignal } from '@/lib/oops/signalStore';
import { getAllThreatThemes, ThreatTheme } from '@/lib/oops/universalThreatEngine';

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

type HqTabKey =
  | 'OVERVIEW'
  | 'THREAT_ENGINE'
  | 'FEED_SIGNALS'
  | 'PUSH_BROADCAST'
  | 'CAMPAIGN_TRACKING'
  | 'BACKERS'
  | 'RELEASES';

interface HqNavCategory {
  title: string;
  items: {
    key: HqTabKey;
    label: string;
    badge?: string | number;
  }[];
}

export default function OopsHqAdminPage() {
  const [passkey, setPasskey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 현재 활성 탭
  const [activeTab, setActiveTab] = useState<HqTabKey>('OVERVIEW');

  const [latestVersion, setLatestVersion] = useState('v0.4.0');
  const [releases, setReleases] = useState<OopsReleaseEntry[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [backers, setBackers] = useState<BackerRow[]>([]);
  const [signals, setSignals] = useState<OopsSignal[]>([]);
  const [bannedAgents, setBannedAgents] = useState<string[]>([]);
  const [hqTrans, setHqTrans] = useState<Record<string, string>>({});
  const [hqTransBusy, setHqTransBusy] = useState<string | null>(null);

  // UTM / QR 캠페인 통계
  const [trackingSummary, setTrackingSummary] = useState<{
    totalVisits: number;
    totalConversions: number;
    bySource: { source: string; visits: number; conversions: number }[];
  } | null>(null);
  const [utmSource, setUtmSource] = useState('x');
  const [utmCampaign, setUtmCampaign] = useState('launch_us');
  const [qrImage, setQrImage] = useState('');
  const [utmCopied, setUtmCopied] = useState(false);

  // 브로드캐스트
  const [bcTitle, setBcTitle] = useState('OOPS HQ 긴급 타전');
  const [bcBody, setBcBody] = useState('');
  const [bcBusy, setBcBusy] = useState(false);
  const [bcResult, setBcResult] = useState<string | null>(null);

  // 위험 지수 테마 목록
  const threatThemes = getAllThreatThemes();

  const fetchDashboard = useCallback(async (keyToUse: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/oops/hq?key=${encodeURIComponent(keyToUse)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || '접근이 거부되었습니다. 암호키를 확인하십시오.');
        setAuthed(false);
        return;
      }
      setAuthed(true);
      setLatestVersion(data.latestVersion || 'v0.4.0');
      setReleases(data.releases || []);
      setAgents(data.agents || []);
      setBackers(data.backers || []);
      setSignals(data.signals || []);
      setBannedAgents(data.bannedAgents || []);
      setTrackingSummary(data.trackingSummary || null);
    } catch {
      setError('서버 연결 실패');
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('oops_hq_key_v1');
    if (saved) {
      setPasskey(saved);
      void fetchDashboard(saved);
    }
  }, [fetchDashboard]);

  // QR 코드 실시간 생성
  useEffect(() => {
    if (!authed) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://oops.monster';
    const targetUrl = `${origin}?utm_source=${encodeURIComponent(utmSource)}&utm_campaign=${encodeURIComponent(utmCampaign)}`;
    QRCode.toDataURL(targetUrl, { width: 240, margin: 1 })
      .then((url) => setQrImage(url))
      .catch(() => {});
  }, [authed, utmSource, utmCampaign]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;
    localStorage.setItem('oops_hq_key_v1', passkey.trim());
    await fetchDashboard(passkey.trim());
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcBody.trim()) return;
    setBcBusy(true);
    setBcResult(null);
    try {
      const res = await fetch('/api/oops/hq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BROADCAST',
          passkey,
          title: bcTitle.trim(),
          body: bcBody.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setBcResult(`발송 성공: ${data.result?.sent || 0}건 전송됨 (실패 ${data.result?.failed || 0}건)`);
        setBcBody('');
      } else {
        setBcResult(`발송 실패: ${data.error || 'Unknown error'}`);
      }
    } catch {
      setBcResult('네트워크 에러 발생');
    } finally {
      setBcBusy(false);
    }
  };

  const handleModerate = async (
    action: 'PIN' | 'UNPIN' | 'HIDE' | 'RESTORE' | 'SHADOWBAN' | 'UNBAN',
    signalId?: string,
    agentId?: string
  ) => {
    try {
      const res = await fetch('/api/oops/hq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, passkey, signalId, agentId }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchDashboard(passkey);
      }
    } catch {}
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

  // 나도솔로 관제실 헌법 규격의 네비게이션 카테고리 구성
  const NAV_CATEGORIES: HqNavCategory[] = [
    {
      title: '관제 및 지표',
      items: [
        { key: 'OVERVIEW', label: '종합 관제 대시보드' },
        { key: 'THREAT_ENGINE', label: '범용 위험 지수 엔진', badge: threatThemes.length },
        { key: 'CAMPAIGN_TRACKING', label: 'UTM / QR 유입 추적', badge: trackingSummary?.totalVisits || 0 },
      ],
    },
    {
      title: '현장 제보 및 피드',
      items: [
        { key: 'FEED_SIGNALS', label: '글로벌 무전 피드 관제', badge: signals.length },
      ],
    },
    {
      title: '통신 및 백커 네트워크',
      items: [
        { key: 'PUSH_BROADCAST', label: '긴급 브로드캐스트 타전', badge: agents.length },
        { key: 'BACKERS', label: '창립 백커 네트워크', badge: backers.length },
        { key: 'RELEASES', label: '시스템 릴리즈 이력', badge: latestVersion },
      ],
    },
  ];

  // 1. 로그인 락 스크린 (나도솔로 관제실 헌법 규격: 무채색 모노크롬)
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#07080a] text-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0c0d12] border border-white/10 p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f04f74]" />
              <h1 className="font-serif-editorial text-lg text-white font-normal">
                OOPS HQ CONSOLE
              </h1>
            </div>
            <span className="text-xs font-mono text-zinc-400 border border-white/10 px-2 py-0.5">
              RESTRICTED
            </span>
          </div>

          <p className="text-sm text-zinc-400">
            OOPS 글로벌 위험 기상대 및 저항군 본부 관제실입니다. 관리자 전용 보안 암호키를 입력하십시오.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                SECURITY PASSKEY
              </label>
              <input
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="비밀 암호키 입력 (기본: admin)"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-white/40"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-950/30 border border-red-500/30 text-xs font-mono text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-mono font-bold text-sm border border-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? '검증 중...' : '관제실 입장'}
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link
              href="/oops"
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← OOPS 메인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. 인증 완료: 나도솔로 관제실 헌법 규격의 2단 그리드 + 독립 사이드바 아키텍처
  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex flex-col font-sans">
      {/* 2-1. 최상단 마스터 헤더 (표준 테두리 박스 규격) */}
      <header className="sticky top-0 z-40 bg-[#0c0d12] border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#f04f74]" />
            <span className="font-serif-editorial text-lg text-white font-normal">
              OOPS GLOBAL HQ CONSOLE
            </span>
            <span className="px-2 py-0.5 border border-white/10 text-xs font-mono text-zinc-400">
              {latestVersion}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/oops"
              target="_blank"
              className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>라이브 뷰</span>
              <span>↗</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('oops_hq_key_v1');
                setAuthed(false);
              }}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              관제실 잠금
            </button>
          </div>
        </div>
      </header>

      {/* 2-2. 2컬럼 레이아웃 (좌측 독립 스크롤 사이드바 + 우측 2단 컴팩트 메인 콘텐츠) */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* 좌측 사이드바: 헌법 제6조 원칙 4 (독립 스크롤 & 위치 고정) */}
        <aside className="lg:h-[calc(100vh-6.5rem)] lg:overflow-y-auto lg:sticky lg:top-20 space-y-6 pr-2">
          <nav className="space-y-5">
            {NAV_CATEGORIES.map((cat) => (
              <div key={cat.title} className="space-y-1.5">
                <div className="text-xs font-mono text-zinc-400 font-bold px-2 uppercase tracking-wider">
                  {cat.title}
                </div>
                <div className="space-y-0.5">
                  {cat.items.map((item) => {
                    const active = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveTab(item.key)}
                        className={`w-full text-left px-3 py-2 text-sm font-mono transition-all flex items-center justify-between cursor-pointer border-l-2 ${
                          active
                            ? 'bg-white/[0.08] text-white font-bold border-[#f04f74] pl-2.5'
                            : 'bg-transparent hover:bg-white/[0.03] text-zinc-400 hover:text-white border-transparent pl-2.5'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className="px-1.5 py-0.2 text-xs font-mono border border-white/10 text-zinc-400 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-3 border border-white/10 bg-[#0c0d12] space-y-2 text-xs font-mono text-zinc-400">
            <div className="text-white font-bold">OOPS OBSERVER SSOT</div>
            <div>네트워크 노드: {agents.length}개</div>
            <div>접수된 사건: {signals.length}건</div>
            <div>관측 국가: 42개국</div>
          </div>
        </aside>

        {/* 우측 메인 콘텐츠: 헌법 제6조 원칙 3 & 원칙 5 (2열 컴팩트 그리드 + 한 화면 조망) */}
        <main className="space-y-6">
          {/* 1. 종합 관제 대시보드 (OVERVIEW) */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* 상단 컨트롤 바: 헌법 제6조 원칙 6 (표준 테두리 박스 규격) */}
              <div className="p-3 border border-white/10 bg-[#0c0d12] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h2 className="font-serif-editorial text-lg text-white font-normal">
                    글로벌 위험 기상 및 통신망 관제 현황
                  </h2>
                </div>
                <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                  REALTIME SSOT
                </span>
              </div>

              {/* 핵심 지표 4열 컴팩트 카드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
                <div className="p-4 border border-white/10 bg-[#0c0d12] space-y-1">
                  <div className="text-xs text-zinc-400">연결 푸시 노드</div>
                  <div className="text-2xl font-bold text-white">{agents.length}</div>
                </div>
                <div className="p-4 border border-white/10 bg-[#0c0d12] space-y-1">
                  <div className="text-xs text-zinc-400">접수된 시민 제보</div>
                  <div className="text-2xl font-bold text-white">{signals.length}</div>
                </div>
                <div className="p-4 border border-white/10 bg-[#0c0d12] space-y-1">
                  <div className="text-xs text-zinc-400">창립 백커 신청</div>
                  <div className="text-2xl font-bold text-white">{backers.length}</div>
                </div>
                <div className="p-4 border border-white/10 bg-[#0c0d12] space-y-1">
                  <div className="text-xs text-zinc-400">누적 방문 / 타전 전환</div>
                  <div className="text-2xl font-bold text-white">
                    {trackingSummary?.totalVisits || 0} / {trackingSummary?.totalConversions || 0}
                  </div>
                </div>
              </div>

              {/* 2열 컴팩트 그리드: 위협 지수 현황 vs 최신 제보 피드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 왼쪽: 6대 위기 지수 현황 */}
                <div className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                      <h3 className="font-serif-editorial text-base text-white">
                        6대 범용 위험 지수 레이더
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('THREAT_ENGINE')}
                      className="text-xs font-mono text-zinc-400 hover:text-white"
                    >
                      전체 관리 →
                    </button>
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    {threatThemes.map((th) => (
                      <div
                        key={th.id}
                        className="p-2.5 bg-zinc-900/50 border border-white/5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-white font-medium truncate">{th.titles.ko}</div>
                          <div className="text-zinc-500 text-[11px] truncate">{th.code}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-white font-bold text-sm">{th.globalIndex.toFixed(1)}°</span>
                          <span className="text-amber-400 text-xs ml-1.5">+{th.delta24h}°</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 오른쪽: 최근 긴급 무전 제보 */}
                <div className="p-4 border border-white/10 bg-[#0c0d12] space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
                      <h3 className="font-serif-editorial text-base text-white">
                        실시간 시민 무전 신호
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('FEED_SIGNALS')}
                      className="text-xs font-mono text-zinc-400 hover:text-white"
                    >
                      전체 관제 →
                    </button>
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    {signals.slice(0, 5).map((sig) => (
                      <div
                        key={sig.id}
                        className="p-2.5 bg-zinc-900/50 border border-white/5 space-y-1"
                      >
                        <div className="flex items-center justify-between text-zinc-400">
                          <span>CASE #OP-{String(sig.caseNum || 100).padStart(4, '0')}</span>
                          <span>@{sig.authorCallsign}</span>
                        </div>
                        <p className="text-white text-xs line-clamp-1">{sig.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. 범용 위험 지수 엔진 관리 (THREAT_ENGINE) */}
          {activeTab === 'THREAT_ENGINE' && (
            <div className="space-y-6">
              <div className="p-3 border border-white/10 bg-[#0c0d12] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h2 className="font-serif-editorial text-lg text-white font-normal">
                    범용 위험 지수 엔진 (6대 채널 관측 파라미터)
                  </h2>
                </div>
                <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                  {threatThemes.length} CHANNELS
                </span>
              </div>

              {/* 2열 컴팩트 그리드로 각 테마 상세 파라미터 카드 조망 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {threatThemes.map((th) => (
                  <div
                    key={th.id}
                    className="p-4 border border-white/10 bg-[#0c0d12] space-y-3 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-white font-bold text-sm">{th.titles.ko}</span>
                      <span className="px-2 py-0.5 border border-white/10 text-amber-400 font-bold">
                        {th.globalIndex}°
                      </span>
                    </div>

                    <div className="space-y-1 text-zinc-400">
                      <div>공식 코드: <strong className="text-zinc-200">{th.code}</strong></div>
                      <div>표본 수: <strong className="text-zinc-200">{th.sampleSize.toLocaleString()}명</strong></div>
                      <div>관측 국가: <strong className="text-zinc-200">{th.regionCount}개국</strong></div>
                      <div>
                        인식 격차: <strong className="text-amber-400">
                          {th.divergence.gap > 0 ? `+${th.divergence.gap}°` : `${th.divergence.gap}°`}
                        </strong>
                      </div>
                    </div>

                    {/* 도시별 체감온도 목록 */}
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <div className="text-zinc-500 text-[11px]">주요 도시 실측 지표:</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {th.regionalMetrics.slice(0, 4).map((rm) => (
                          <div
                            key={rm.city.ko}
                            className="p-1.5 bg-zinc-900 border border-white/5 flex items-center justify-between"
                          >
                            <span className="text-zinc-300">{rm.city.ko}</span>
                            <span className="text-white font-bold">{rm.temperature}°</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. 글로벌 무전 피드 관제 (FEED_SIGNALS) - 핀 고정, 숨김, 차단 제어 */}
          {activeTab === 'FEED_SIGNALS' && (
            <div className="space-y-6">
              <div className="p-3 border border-white/10 bg-[#0c0d12] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h2 className="font-serif-editorial text-lg text-white font-normal">
                    글로벌 무전 피드 관제 및 관리자 고정 제어
                  </h2>
                </div>
                <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                  총 {signals.length}건 접수됨
                </span>
              </div>

              {/* 사건 제보 2열 컴팩트 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {signals.map((sig) => {
                  const isBanned = bannedAgents.includes(sig.authorAgentId);
                  const translated = hqTrans[sig.id];

                  return (
                    <div
                      key={sig.id}
                      className={`p-4 border border-white/10 bg-[#0c0d12] space-y-3 font-mono text-xs ${
                        sig.isHidden ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold bg-white/10 px-1.5 py-0.5 border border-white/10">
                            CASE #OP-{String(sig.caseNum || 100).padStart(4, '0')}
                          </span>
                          <span className="text-zinc-400">[{sig.category}]</span>
                          {sig.isPinned && (
                            <span className="px-1.5 py-0.5 bg-[#f04f74] text-white font-bold">
                              본부 고정
                            </span>
                          )}
                          {sig.isHidden && (
                            <span className="px-1.5 py-0.5 bg-zinc-700 text-white font-bold">
                              숨김
                            </span>
                          )}
                          {isBanned && (
                            <span className="px-1.5 py-0.5 bg-red-900 text-white font-bold">
                              차단됨
                            </span>
                          )}
                        </div>

                        <div className="text-zinc-400">
                          @{sig.authorCallsign}
                        </div>
                      </div>

                      <p className="text-sm font-sans font-medium text-white break-words">
                        {sig.content}
                      </p>

                      {translated && (
                        <div className="p-2.5 bg-zinc-900 border-l-2 border-[#f04f74] text-xs text-zinc-300">
                          {translated}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                        <div className="text-zinc-400">
                          ✊ {sig.upvotes} · 🚩 {sig.reports}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => translateInPlace(sig)}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white cursor-pointer"
                          >
                            {hqTransBusy === sig.id ? '번역중' : translated ? '접기' : '번역'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleModerate(sig.isPinned ? 'UNPIN' : 'PIN', sig.id)}
                            className={`px-2 py-1 border cursor-pointer font-bold ${
                              sig.isPinned
                                ? 'bg-[#f04f74] border-[#f04f74] text-white'
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                            }`}
                          >
                            {sig.isPinned ? '고정 해제' : '핀 고정'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleModerate(sig.isHidden ? 'RESTORE' : 'HIDE', sig.id)}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            {sig.isHidden ? '복구' : '숨김'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleModerate(isBanned ? 'UNBAN' : 'SHADOWBAN', undefined, sig.authorAgentId)
                            }
                            className={`px-2 py-1 border cursor-pointer ${
                              isBanned
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                                : 'bg-red-950/40 border-red-500/40 text-red-300 hover:bg-red-900/60'
                            }`}
                          >
                            {isBanned ? '차단 해제' : '차단'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. 긴급 푸시 브로드캐스트 (PUSH_BROADCAST) */}
          {activeTab === 'PUSH_BROADCAST' && (
            <div className="space-y-6">
              <div className="p-3 border border-white/10 bg-[#0c0d12] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h2 className="font-serif-editorial text-lg text-white font-normal">
                    전체 연결 노드 긴급 브로드캐스트 타전
                  </h2>
                </div>
                <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                  {agents.length} AGENTS ONLINE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 발송 폼 */}
                <form
                  onSubmit={handleBroadcast}
                  className="p-5 border border-white/10 bg-[#0c0d12] space-y-4 font-mono text-xs"
                >
                  <div>
                    <label className="block text-zinc-400 mb-1">타전 공지 제목</label>
                    <input
                      type="text"
                      value={bcTitle}
                      onChange={(e) => setBcTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-white/10 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">긴급 타전 내용</label>
                    <textarea
                      rows={4}
                      value={bcBody}
                      onChange={(e) => setBcBody(e.target.value)}
                      placeholder="전 세계 저항군 노드에 일괄 전송할 메시지를 입력하십시오..."
                      className="w-full px-3 py-2 bg-zinc-900 border border-white/10 text-white text-sm"
                    />
                  </div>

                  {bcResult && (
                    <div className="p-2.5 bg-zinc-900 border border-white/20 text-white font-bold">
                      {bcResult}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={bcBusy}
                    className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-bold text-sm border border-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {bcBusy ? '전파 중...' : `전체 ${agents.length}개 노드에 즉시 발사`}
                  </button>
                </form>

                {/* 연결 노드 목록 */}
                <div className="p-5 border border-white/10 bg-[#0c0d12] space-y-3 font-mono text-xs">
                  <div className="text-white font-bold border-b border-white/10 pb-2">
                    연결된 요원 단말기 ({agents.length})
                  </div>
                  <div className="space-y-1.5 max-h-80 overflow-y-auto">
                    {agents.map((ag) => (
                      <div
                        key={ag.agentId}
                        className="p-2 bg-zinc-900 border border-white/5 flex items-center justify-between"
                      >
                        <span className="text-zinc-200">{ag.agentId} ({ag.alias})</span>
                        <span className="text-zinc-500">{ag.createdAt.slice(0, 10)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. UTM / QR 유입 추적 (CAMPAIGN_TRACKING) */}
          {activeTab === 'CAMPAIGN_TRACKING' && (
            <div className="space-y-6">
              <div className="p-3 border border-white/10 bg-[#0c0d12] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h2 className="font-serif-editorial text-lg text-white font-normal">
                    UTM · QR 캠페인 추적 및 유입 분석
                  </h2>
                </div>
                <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                  전체 방문 {trackingSummary?.totalVisits || 0}회
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 캠페인 생성기 */}
                <div className="p-5 border border-white/10 bg-[#0c0d12] space-y-4 font-mono text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1">유입 채널 (utm_source)</label>
                    <input
                      type="text"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">캠페인 명 (utm_campaign)</label>
                    <input
                      type="text"
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-white/10 text-white"
                    />
                  </div>

                  {qrImage && (
                    <div className="flex items-center gap-4 pt-2">
                      <img src={qrImage} alt="Campaign QR" className="w-24 h-24 bg-white p-1 border border-white/20" />
                      <a
                        href={qrImage}
                        download={`oops-qr-${utmSource}.png`}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white"
                      >
                        QR 다운로드
                      </a>
                    </div>
                  )}
                </div>

                {/* 채널별 통계 */}
                <div className="p-5 border border-white/10 bg-[#0c0d12] space-y-3 font-mono text-xs">
                  <div className="text-white font-bold border-b border-white/10 pb-2">
                    채널별 유입 및 타전 전환율
                  </div>
                  <div className="space-y-1.5">
                    {trackingSummary?.bySource.map((row, idx) => (
                      <div
                        key={`${row.source}-${idx}`}
                        className="p-2.5 bg-zinc-900 border border-white/5 flex items-center justify-between"
                      >
                        <span className="text-zinc-200 uppercase font-bold">{row.source || 'direct'}</span>
                        <span className="text-zinc-400">
                          방문 {row.visits} / 타전 {row.conversions}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. 창립 백커 네트워크 (BACKERS) */}
          {activeTab === 'BACKERS' && (
            <div className="space-y-6">
              <div className="p-3 border border-white/10 bg-[#0c0d12] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h2 className="font-serif-editorial text-lg text-white font-normal">
                    창립 백커 및 동지 합류 신청자 명부
                  </h2>
                </div>
                <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                  {backers.length} BACKERS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                {backers.map((b) => (
                  <div key={b.id} className="p-4 border border-white/10 bg-[#0c0d12] space-y-1.5">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="text-white font-bold">{b.id}</span>
                      <span>{b.createdAt.slice(0, 10)}</span>
                    </div>
                    <div className="text-sm font-sans font-bold text-white">
                      {b.name} {b.org ? `(${b.org})` : ''}
                    </div>
                    <div className="text-zinc-400">{b.email}</div>
                    {b.message && <p className="text-zinc-300 font-sans pt-1">{b.message}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. 시스템 릴리즈 이력 (RELEASES) */}
          {activeTab === 'RELEASES' && (
            <div className="space-y-6">
              <div className="p-3 border border-white/10 bg-[#0c0d12] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
                  <h2 className="font-serif-editorial text-lg text-white font-normal">
                    시스템 독립 릴리즈 및 패치 이력
                  </h2>
                </div>
                <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">
                  CURRENT: {latestVersion}
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {releases.map((r) => (
                  <div key={r.version} className="p-4 border border-white/10 bg-[#0c0d12] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-white text-black font-bold">
                        {r.version}
                      </span>
                      <span className="text-zinc-400">{r.date}</span>
                    </div>
                    <div className="text-white font-bold">{r.title}</div>
                    <ul className="space-y-1 list-disc list-inside text-zinc-400 font-sans">
                      {r.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
