'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import type { OopsReleaseEntry } from '@/lib/oops/releases';
import type { OopsSignal } from '@/lib/oops/signalStore';
import type { OopsMemberPublic } from '@/lib/oops/memberStore';
import { getAllThreatThemes } from '@/lib/oops/universalThreatEngine';
import {
  OOPS_MILITARY_RANKS,
  RANK_GROUP_LABELS,
  resolveRankByPoints,
  type RankGroup,
} from '@/lib/oops/rankSystem';
import { OOPS_ORG_HIERARCHY, type OrgTrack } from '@/lib/oops/organizationSystem';
import { COUNTRIES_REGISTRY } from '@/lib/oops/movementStore';

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
  | 'ORGANIZATION'
  | 'RANKS'
  | 'OUTPOST'
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

  const [activeTab, setActiveTab] = useState<HqTabKey>('OVERVIEW');

  const [latestVersion, setLatestVersion] = useState('v3.1.5');
  const [releases, setReleases] = useState<OopsReleaseEntry[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [members, setMembers] = useState<OopsMemberPublic[]>([]);
  const [backers, setBackers] = useState<BackerRow[]>([]);
  const [signals, setSignals] = useState<OopsSignal[]>([]);
  const [bannedAgents, setBannedAgents] = useState<string[]>([]);
  const [hqTrans, setHqTrans] = useState<Record<string, string>>({});
  const [hqTransBusy, setHqTransBusy] = useState<string | null>(null);

  // 조직·계급 필터 및 클릭 펼침 상태 (List-First, Click-to-Reveal)
  const [orgFilter, setOrgFilter] = useState<'ALL' | OrgTrack>('ALL');
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);

  const [rankFilter, setRankFilter] = useState<'ALL' | RankGroup>('ALL');
  const [expandedRankCode, setExpandedRankCode] = useState<string | null>(null);

  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);

  // UTM / QR 캠페인 통계
  const [trackingSummary, setTrackingSummary] = useState<{
    totalVisits: number;
    totalConversions: number;
    bySource: { source: string; visits: number; conversions: number }[];
  } | null>(null);
  const [utmSource, setUtmSource] = useState('x');
  const [utmCampaign, setUtmCampaign] = useState('launch_kr');
  const [qrImage, setQrImage] = useState('');
  const [utmCopied, setUtmCopied] = useState(false);

  // 브로드캐스트
  const [bcTitle, setBcTitle] = useState('OOPS 사령부 긴급 타전');
  const [bcBody, setBcBody] = useState('');
  const [bcBusy, setBcBusy] = useState(false);
  const [bcResult, setBcResult] = useState<string | null>(null);

  const threatThemes = getAllThreatThemes();

  const fetchDashboard = useCallback(async (keyToUse: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/oops/hq?key=${encodeURIComponent(keyToUse)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || '접근 거부');
        setAuthed(false);
        return;
      }
      setAuthed(true);
      setLatestVersion(data.latestVersion || 'v3.1.5');
      setReleases(data.releases || []);
      setAgents(data.agents || []);
      setMembers(data.members || []);
      setBackers(data.backers || []);
      setSignals(data.signals || []);
      setBannedAgents(data.bannedAgents || []);
      setTrackingSummary(data.trackingSummary || null);
    } catch {
      setError('연결 실패');
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

  useEffect(() => {
    if (!authed) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://oops.monster';
    const targetUrl = `${origin}?utm_source=${encodeURIComponent(utmSource)}&utm_campaign=${encodeURIComponent(utmCampaign)}`;
    QRCode.toDataURL(targetUrl, { width: 220, margin: 1 })
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
        setBcResult(`전송 ${data.result?.sent || 0}건 / 실패 ${data.result?.failed || 0}건`);
        setBcBody('');
      } else {
        setBcResult(`실패: ${data.error || '오류'}`);
      }
    } catch {
      setBcResult('네트워크 오류');
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

  const NAV_CATEGORIES: HqNavCategory[] = [
    {
      title: '작전 · 조직',
      items: [
        { key: 'OVERVIEW', label: '종합상황' },
        { key: 'ORGANIZATION', label: '조직체계', badge: OOPS_ORG_HIERARCHY.length },
        { key: 'RANKS', label: '계급체계', badge: OOPS_MILITARY_RANKS.length },
        { key: 'OUTPOST', label: '초소대원', badge: members.length },
      ],
    },
    {
      title: '위협 · 첩보',
      items: [
        { key: 'THREAT_ENGINE', label: '위험엔진', badge: threatThemes.length },
        { key: 'FEED_SIGNALS', label: '현장제보', badge: signals.length },
      ],
    },
    {
      title: '통신 · 지원',
      items: [
        { key: 'PUSH_BROADCAST', label: '긴급타전', badge: agents.length },
        { key: 'CAMPAIGN_TRACKING', label: '유입추적', badge: trackingSummary?.totalVisits || 0 },
        { key: 'BACKERS', label: '후원지원', badge: backers.length },
        { key: 'RELEASES', label: '배포이력', badge: latestVersion },
      ],
    },
  ];

  // 1. 사령부 암구호 인증 화면 (OOPS 전술 모노크롬)
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#08090c] text-white flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-md bg-[#101218] border border-white/20 p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/15 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
              <h1 className="text-lg font-bold text-white tracking-wider">OOPS 작전사령부</h1>
            </div>
            <span className="text-sm text-zinc-200 border border-white/20 px-2.5 py-0.5">통제구역</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-200 mb-2 font-bold">암구호</label>
              <input
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="암구호 입력"
                className="w-full px-3.5 py-2.5 bg-[#08090c] border border-white/20 text-white text-sm focus:outline-none focus:border-white/50"
              />
            </div>

            {error && (
              <div className="p-3 bg-[#101218] border border-white/30 text-sm text-white">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-bold text-sm border border-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? '검증' : '입장'}
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link href="/oops" className="text-sm text-zinc-300 hover:text-white underline">
              복귀
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredOrgs =
    orgFilter === 'ALL' ? OOPS_ORG_HIERARCHY : OOPS_ORG_HIERARCHY.filter((o) => o.track === orgFilter);

  const filteredRanks =
    rankFilter === 'ALL' ? OOPS_MILITARY_RANKS : OOPS_MILITARY_RANKS.filter((r) => r.group === rankFilter);

  // 2. OOPS 군사 작전 사령부 대시보드 (모노크롬 + 고대비 화이트 + 2열 컴팩트 그리드)
  return (
    <div className="min-h-screen bg-[#08090c] text-white flex flex-col font-mono">
      {/* 마스터 헤더 */}
      <header className="sticky top-0 z-40 bg-[#101218] border-b border-white/15">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
            <span className="text-lg font-bold text-white tracking-wide">OOPS 작전사령부</span>
            <span className="px-2 py-0.5 border border-white/20 text-sm text-zinc-200">{latestVersion}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/oops"
              target="_blank"
              className="px-3 py-1 bg-white/5 hover:bg-white/15 border border-white/25 text-sm text-white font-bold"
            >
              라이브
            </Link>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('oops_hq_key_v1');
                setAuthed(false);
              }}
              className="px-3 py-1 bg-white/5 hover:bg-white/15 border border-white/25 text-sm text-white font-bold cursor-pointer"
            >
              잠금
            </button>
          </div>
        </div>
      </header>

      {/* 2단 레이아웃: 독립 스크롤 사이드바 + 메인 */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className="lg:h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:sticky lg:top-20 space-y-5 pr-2">
          <nav className="space-y-5">
            {NAV_CATEGORIES.map((cat) => (
              <div key={cat.title} className="space-y-1.5">
                <div className="text-sm text-zinc-300 font-bold px-2">{cat.title}</div>
                <div className="space-y-1">
                  {cat.items.map((item) => {
                    const active = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveTab(item.key)}
                        className={`w-full text-left px-3 py-2 text-sm transition-all flex items-center justify-between cursor-pointer border-l-2 ${
                          active
                            ? 'bg-white/10 text-white font-bold border-[#ff4d00]'
                            : 'bg-transparent hover:bg-white/5 text-zinc-200 hover:text-white border-transparent'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className="px-2 py-0.5 text-sm border border-white/20 text-zinc-200 shrink-0">
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

          <div className="p-3 border border-white/15 bg-[#101218] space-y-1.5 text-sm text-zinc-200">
            <div className="text-white font-bold">지휘통제</div>
            <div>초소대원: {members.length}명</div>
            <div>무전노드: {agents.length}기</div>
            <div>제보첩보: {signals.length}건</div>
          </div>
        </aside>

        {/* 메인 관제 패널 */}
        <main className="space-y-4">
          {/* 1. 종합상황 (OVERVIEW) */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              <div className="p-3 border border-white/15 bg-[#101218] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
                  <h2 className="text-lg text-white font-bold">종합상황</h2>
                </div>
                <span className="text-sm px-2.5 py-0.5 border border-white/20 text-white font-bold">
                  가동
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="p-4 border border-white/15 bg-[#101218] space-y-1">
                  <div className="text-sm text-zinc-200">초소대원</div>
                  <div className="text-2xl font-bold text-white">{members.length}</div>
                </div>
                <div className="p-4 border border-white/15 bg-[#101218] space-y-1">
                  <div className="text-sm text-zinc-200">무전노드</div>
                  <div className="text-2xl font-bold text-white">{agents.length}</div>
                </div>
                <div className="p-4 border border-white/15 bg-[#101218] space-y-1">
                  <div className="text-sm text-zinc-200">현장첩보</div>
                  <div className="text-2xl font-bold text-white">{signals.length}</div>
                </div>
                <div className="p-4 border border-white/15 bg-[#101218] space-y-1">
                  <div className="text-sm text-zinc-200">후원신청</div>
                  <div className="text-2xl font-bold text-white">{backers.length}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="p-4 border border-white/15 bg-[#101218] space-y-3">
                  <div className="flex items-center justify-between border-b border-white/15 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
                      <h3 className="text-sm font-bold text-white">조직편제</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('ORGANIZATION')}
                      className="px-2.5 py-1 text-sm border border-white/25 text-white hover:bg-white/10 cursor-pointer"
                    >
                      열기
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    {OOPS_ORG_HIERARCHY.slice(0, 4).map((org) => (
                      <div key={org.id} className="p-2.5 border border-white/10 bg-[#08090c] flex items-center justify-between">
                        <span className="text-white font-bold">{org.title}</span>
                        <span className="text-zinc-200">{org.track === 'BOARD' ? '이사회' : '사령부'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 border border-white/15 bg-[#101218] space-y-3">
                  <div className="flex items-center justify-between border-b border-white/15 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
                      <h3 className="text-sm font-bold text-white">위험지수</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('THREAT_ENGINE')}
                      className="px-2.5 py-1 text-sm border border-white/25 text-white hover:bg-white/10 cursor-pointer"
                    >
                      열기
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    {threatThemes.slice(0, 4).map((th) => (
                      <div key={th.id} className="p-2.5 border border-white/10 bg-[#08090c] flex items-center justify-between">
                        <span className="text-white font-bold truncate">{th.titles.ko}</span>
                        <span className="text-white font-bold shrink-0">{th.globalIndex.toFixed(1)}°</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. 조직체계 (이사회 + 군사 지휘 위계) */}
          {activeTab === 'ORGANIZATION' && (
            <div className="space-y-4">
              <div className="p-3 border border-white/15 bg-[#101218] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
                  <h2 className="text-lg text-white font-bold">조직체계</h2>
                  <span className="text-sm px-2 py-0.5 border border-white/20 text-zinc-200">
                    {filteredOrgs.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {(['ALL', 'BOARD', 'MILITARY'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setOrgFilter(f)}
                      className={`px-3 py-1 text-sm font-bold border cursor-pointer ${
                        orgFilter === f
                          ? 'bg-white text-black border-white'
                          : 'bg-white/5 text-white border-white/25 hover:bg-white/15'
                      }`}
                    >
                      {f === 'ALL' ? '전체' : f === 'BOARD' ? '이사회' : '사령부'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2열 컴팩트 그리드 (클릭 시 상세 펼침) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredOrgs.map((org) => {
                  const isOpen = expandedOrgId === org.id;
                  return (
                    <div
                      key={org.id}
                      onClick={() => setExpandedOrgId(isOpen ? null : org.id)}
                      className={`p-3.5 border border-white/15 bg-[#101218] hover:border-white/35 cursor-pointer transition-all ${
                        isOpen ? 'col-span-full border-white/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-bold text-zinc-300 shrink-0">{org.id}</span>
                          <span className="text-sm font-bold text-white truncate">{org.title}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 text-sm border border-white/25 text-white font-bold">
                            {org.track === 'BOARD' ? '이사회' : '사령부'}
                          </span>
                          <span className="px-2 py-0.5 text-sm border border-white/20 text-zinc-200">
                            {org.headcount.toLocaleString()}명
                          </span>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="mt-3 pt-3 border-t border-white/15 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="p-2.5 bg-[#08090c] border border-white/10">
                            <div className="text-zinc-300 font-bold mb-1">편제코드</div>
                            <div className="text-white">{org.code} (Tier {org.tier})</div>
                          </div>
                          <div className="p-2.5 bg-[#08090c] border border-white/10">
                            <div className="text-zinc-300 font-bold mb-1">핵심임무</div>
                            <div className="text-white">{org.role}</div>
                          </div>
                          <div className="p-2.5 bg-[#08090c] border border-white/10">
                            <div className="text-zinc-300 font-bold mb-1">지휘권한</div>
                            <div className="text-white">{org.authority}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. 계급체계 (훈련병 ~ 5스타 원수 20단계 풀 계급) */}
          {activeTab === 'RANKS' && (
            <div className="space-y-4">
              <div className="p-3 border border-white/15 bg-[#101218] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
                  <h2 className="text-lg text-white font-bold">계급체계</h2>
                  <span className="text-sm px-2 py-0.5 border border-white/20 text-zinc-200">
                    {filteredRanks.length}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(['ALL', 'ENLISTED', 'NCO', 'COMPANY_OFFICER', 'FIELD_OFFICER', 'GENERAL'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setRankFilter(g)}
                      className={`px-2.5 py-1 text-sm font-bold border cursor-pointer ${
                        rankFilter === g
                          ? 'bg-white text-black border-white'
                          : 'bg-white/5 text-white border-white/25 hover:bg-white/15'
                      }`}
                    >
                      {g === 'ALL'
                        ? '전체'
                        : g === 'ENLISTED'
                          ? '병사'
                          : g === 'NCO'
                            ? '부사관'
                            : g === 'COMPANY_OFFICER'
                              ? '위관'
                              : g === 'FIELD_OFFICER'
                                ? '영관'
                                : '장성'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2열 컴팩트 그리드 (클릭 시 5개국어 & 진급 기준 상세 펼침) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredRanks.map((r) => {
                  const isOpen = expandedRankCode === r.code;
                  return (
                    <div
                      key={r.code}
                      onClick={() => setExpandedRankCode(isOpen ? null : r.code)}
                      className={`p-3.5 border border-white/15 bg-[#101218] hover:border-white/35 cursor-pointer transition-all ${
                        isOpen ? 'col-span-full border-white/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-bold text-zinc-300">L{String(r.level).padStart(2, '0')}</span>
                          <span className="text-sm font-bold text-white">{r.insignia}</span>
                          <span className="text-sm font-bold text-white">{r.names.ko}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 text-sm border border-white/20 text-zinc-200">
                            {RANK_GROUP_LABELS[r.group].ko}
                          </span>
                          <span className="px-2 py-0.5 text-sm border border-white/25 text-white font-bold">
                            {r.minPoints.toLocaleString()} XP
                          </span>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="mt-3 pt-3 border-t border-white/15 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                          <div className="p-2 bg-[#08090c] border border-white/10">
                            <div className="text-zinc-300 font-bold">EN</div>
                            <div className="text-white">{r.names.en}</div>
                          </div>
                          <div className="p-2 bg-[#08090c] border border-white/10">
                            <div className="text-zinc-300 font-bold">JA</div>
                            <div className="text-white">{r.names.ja}</div>
                          </div>
                          <div className="p-2 bg-[#08090c] border border-white/10">
                            <div className="text-zinc-300 font-bold">ZH</div>
                            <div className="text-white">{r.names.zh}</div>
                          </div>
                          <div className="p-2 bg-[#08090c] border border-white/10">
                            <div className="text-zinc-300 font-bold">ES</div>
                            <div className="text-white">{r.names.es}</div>
                          </div>
                          <div className="p-2 bg-[#08090c] border border-white/10">
                            <div className="text-zinc-300 font-bold">진급기준</div>
                            <div className="text-white">{r.criteria.ko}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. 초소대원 (OUTPOST) */}
          {activeTab === 'OUTPOST' && (
            <div className="space-y-4">
              <div className="p-3 border border-white/15 bg-[#101218] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
                  <h2 className="text-lg text-white font-bold">초소대원</h2>
                  <span className="text-sm px-2 py-0.5 border border-white/20 text-zinc-200">
                    {members.length}
                  </span>
                </div>
                <span className="text-sm px-2.5 py-0.5 border border-white/25 text-white font-bold">정식등록</span>
              </div>

              {members.length === 0 ? (
                <div className="p-8 border border-white/15 bg-[#101218] text-center text-sm text-zinc-200">
                  등록된 초소 대원이 아직 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {members.map((m) => {
                    const isOpen = expandedMemberId === m.id;
                    const rank = resolveRankByPoints(m.points);
                    const c = COUNTRIES_REGISTRY[m.countryCode] || COUNTRIES_REGISTRY.KR;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setExpandedMemberId(isOpen ? null : m.id)}
                        className={`p-3.5 border border-white/15 bg-[#101218] hover:border-white/35 cursor-pointer ${
                          isOpen ? 'col-span-full border-white/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-bold text-white">#{m.serialLabel}</span>
                            <span className="text-sm text-zinc-200 truncate">{m.callsign}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 text-sm border border-white/20 text-white">
                              {c.flag} {c.code}
                            </span>
                            <span className="px-2 py-0.5 text-sm border border-white/25 text-white font-bold">
                              {rank.current.insignia} {rank.current.names.ko}
                            </span>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="mt-3 pt-3 border-t border-white/15 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="p-2 bg-[#08090c] border border-white/10">
                              <div className="text-zinc-300 font-bold">이메일</div>
                              <div className="text-white">{m.email}</div>
                            </div>
                            <div className="p-2 bg-[#08090c] border border-white/10">
                              <div className="text-zinc-300 font-bold">포인트</div>
                              <div className="text-white">{m.points} XP</div>
                            </div>
                            <div className="p-2 bg-[#08090c] border border-white/10">
                              <div className="text-zinc-300 font-bold">입대일</div>
                              <div className="text-white">{new Date(m.createdAt).toLocaleDateString('ko-KR')}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5. 위험엔진 (THREAT_ENGINE) */}
          {activeTab === 'THREAT_ENGINE' && (
            <div className="space-y-4">
              <div className="p-3 border border-white/15 bg-[#101218] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
                  <h2 className="text-lg text-white font-bold">위험엔진</h2>
                  <span className="text-sm px-2 py-0.5 border border-white/20 text-zinc-200">
                    {threatThemes.length}
                  </span>
                </div>
                <Link
                  href="/methodology"
                  target="_blank"
                  className="px-3 py-1 bg-white/5 hover:bg-white/15 border border-white/25 text-sm text-white font-bold"
                >
                  근거
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {threatThemes.map((th) => (
                  <div key={th.id} className="p-4 border border-white/15 bg-[#101218] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-300 font-bold">{th.code}</span>
                      <span className="text-sm font-bold text-white border border-white/25 px-2 py-0.5">
                        {th.globalIndex.toFixed(1)}°
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">{th.titles.ko}</div>
                    <div className="text-sm text-zinc-200">{th.subtitles.ko}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. 현장제보 (FEED_SIGNALS) */}
          {activeTab === 'FEED_SIGNALS' && (
            <div className="space-y-4">
              <div className="p-3 border border-white/15 bg-[#101218] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
                  <h2 className="text-lg text-white font-bold">현장제보</h2>
                  <span className="text-sm px-2 py-0.5 border border-white/20 text-zinc-200">
                    {signals.length}
                  </span>
                </div>
                <span className="text-sm px-2.5 py-0.5 border border-white/25 text-white font-bold">
                  차단 {bannedAgents.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {signals.map((sig) => {
                  const isOpen = expandedSignalId === sig.id;
                  const isBanned = bannedAgents.includes(sig.authorAgentId);
                  return (
                    <div
                      key={sig.id}
                      onClick={() => setExpandedSignalId(isOpen ? null : sig.id)}
                      className={`p-3.5 border border-white/15 bg-[#101218] cursor-pointer space-y-2 ${
                        isOpen ? 'col-span-full border-white/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-white font-bold truncate">
                          #OP-{String(sig.caseNum).padStart(4, '0')} · {sig.authorCallsign}
                        </span>
                        <span className="px-2 py-0.5 border border-white/25 text-white font-bold shrink-0">
                          {sig.category}
                        </span>
                      </div>

                      <div className="text-sm text-zinc-200 line-clamp-2">
                        {hqTrans[sig.id] || sig.content}
                      </div>

                      {isOpen && (
                        <div
                          className="pt-3 border-t border-white/15 flex flex-wrap items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => void translateInPlace(sig)}
                            disabled={hqTransBusy === sig.id}
                            className="px-3 py-1 bg-white/5 hover:bg-white/15 border border-white/25 text-sm text-white font-bold cursor-pointer"
                          >
                            {hqTrans[sig.id] ? '원문' : '번역'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleModerate(sig.isPinned ? 'UNPIN' : 'PIN', sig.id)}
                            className="px-3 py-1 bg-white/5 hover:bg-white/15 border border-white/25 text-sm text-white font-bold cursor-pointer"
                          >
                            {sig.isPinned ? '해제' : '고정'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleModerate(sig.isHidden ? 'RESTORE' : 'HIDE', sig.id)}
                            className="px-3 py-1 bg-white/5 hover:bg-white/15 border border-white/25 text-sm text-white font-bold cursor-pointer"
                          >
                            {sig.isHidden ? '복구' : '숨김'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void handleModerate(isBanned ? 'UNBAN' : 'SHADOWBAN', undefined, sig.authorAgentId)
                            }
                            className="px-3 py-1 bg-white/5 hover:bg-white/15 border border-white/25 text-sm text-white font-bold cursor-pointer"
                          >
                            {isBanned ? '해금' : '차단'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. 긴급타전 (PUSH_BROADCAST) */}
          {activeTab === 'PUSH_BROADCAST' && (
            <div className="space-y-4">
              <div className="p-3 border border-white/15 bg-[#101218] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
                  <h2 className="text-lg text-white font-bold">긴급타전</h2>
                </div>
                <span className="text-sm px-2.5 py-0.5 border border-white/20 text-white font-bold">
                  노드 {agents.length}
                </span>
              </div>

              <form onSubmit={handleBroadcast} className="p-4 border border-white/15 bg-[#101218] space-y-3">
                <input
                  type="text"
                  value={bcTitle}
                  onChange={(e) => setBcTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#08090c] border border-white/20 text-white text-sm"
                  placeholder="제목"
                />
                <textarea
                  rows={3}
                  value={bcBody}
                  onChange={(e) => setBcBody(e.target.value)}
                  placeholder="타전 지령 내용 입력"
                  className="w-full px-3 py-2 bg-[#08090c] border border-white/20 text-white text-sm resize-none"
                />
                {bcResult && <div className="text-sm text-white font-bold">{bcResult}</div>}
                <button
                  type="submit"
                  disabled={bcBusy || !bcBody.trim()}
                  className="px-5 py-2 bg-white hover:bg-zinc-200 text-black font-bold text-sm border border-white cursor-pointer disabled:opacity-50"
                >
                  {bcBusy ? '전송' : '발송'}
                </button>
              </form>
            </div>
          )}

          {/* 8. 유입추적 (CAMPAIGN_TRACKING) */}
          {activeTab === 'CAMPAIGN_TRACKING' && (
            <div className="space-y-4">
              <div className="p-3 border border-white/15 bg-[#101218] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
                  <h2 className="text-lg text-white font-bold">유입추적</h2>
                </div>
                <span className="text-sm px-2.5 py-0.5 border border-white/20 text-white font-bold">
                  방문 {trackingSummary?.totalVisits || 0}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 border border-white/15 bg-[#101218] space-y-3">
                  <div className="text-sm font-bold text-white">링크생성</div>
                  <input
                    type="text"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="출처 (utm_source)"
                    className="w-full px-3 py-2 bg-[#08090c] border border-white/20 text-white text-sm"
                  />
                  <input
                    type="text"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    placeholder="캠페인 (utm_campaign)"
                    className="w-full px-3 py-2 bg-[#08090c] border border-white/20 text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}?utm_source=${encodeURIComponent(utmSource)}&utm_campaign=${encodeURIComponent(utmCampaign)}`;
                      void navigator.clipboard.writeText(url);
                      setUtmCopied(true);
                      setTimeout(() => setUtmCopied(false), 2000);
                    }}
                    className="px-4 py-2 bg-white text-black font-bold text-sm border border-white cursor-pointer"
                  >
                    {utmCopied ? '완료' : '복사'}
                  </button>
                </div>

                <div className="p-4 border border-white/15 bg-[#101218] flex flex-col items-center justify-center">
                  {qrImage && <img src={qrImage} alt="OOPS QR" className="w-36 h-36 border border-white/20 bg-white p-1" />}
                </div>
              </div>
            </div>
          )}

          {/* 9. 후원지원 (BACKERS) */}
          {activeTab === 'BACKERS' && (
            <div className="space-y-4">
              <div className="p-3 border border-white/15 bg-[#101218] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
                  <h2 className="text-lg text-white font-bold">후원지원</h2>
                  <span className="text-sm px-2 py-0.5 border border-white/20 text-zinc-200">
                    {backers.length}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {backers.map((b) => (
                  <div key={b.id} className="p-4 border border-white/15 bg-[#101218] space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">{b.name}</span>
                      <span className="border border-white/25 px-2 py-0.5 text-white">{b.tier}</span>
                    </div>
                    <div className="text-zinc-200">{b.org || '-'} · {b.email}</div>
                    {b.message && <div className="text-zinc-300 pt-1">{b.message}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10. 배포이력 (RELEASES) */}
          {activeTab === 'RELEASES' && (
            <div className="space-y-4">
              <div className="p-3 border border-white/15 bg-[#101218] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
                  <h2 className="text-lg text-white font-bold">배포이력</h2>
                </div>
                <span className="text-sm px-2.5 py-0.5 border border-white/20 text-white font-bold">
                  {latestVersion}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {releases.map((r) => (
                  <div key={r.version} className="p-4 border border-white/15 bg-[#101218] space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">{r.version}</span>
                      <span className="text-zinc-300">{r.date}</span>
                    </div>
                    <div className="text-white font-bold">{r.title}</div>
                    <ul className="space-y-1 text-zinc-200">
                      {r.highlights.map((h, i) => (
                        <li key={i}>· {h}</li>
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
