'use client';

import React, { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  buildTrackedUrl,
  type ShortLinkRecord,
  type TrackingBucket,
  type TrackingEvent,
  type TrackingService,
  type TrackingSummary,
} from '@/modules/tracking';

interface Props {
  isLight?: boolean;
  onNotify?: (msg: string) => void;
}

type ViewTab = 'SOURCE' | 'MEDIUM' | 'CAMPAIGN' | 'PATH' | 'SHORT' | 'LOGS';

const PRESET_PATHS: Record<TrackingService, Array<{ label: string; path: string }>> = {
  NADOSOLO: [
    { label: '홈', path: '/' },
    { label: '신청', path: '/meetup' },
    { label: '다이닝', path: '/dining' },
    { label: '살롱', path: '/salon' },
    { label: '어필리에이트', path: '/affiliate' },
  ],
  TABLEBARO: [
    { label: '매장검색', path: '/reserve' },
    { label: '입점신청', path: '/biz' },
    { label: '어필리에이트', path: '/reserve/affiliate' },
  ],
  OOPS: [
    { label: '피드', path: '/oops' },
    { label: '단말앱', path: '/oops/app' },
  ],
};

const PRESET_CHANNELS = [
  { key: 'instagram', label: '인스타그램', medium: 'social' },
  { key: 'naver_place', label: '네이버', medium: 'search' },
  { key: 'blog', label: '블로그', medium: 'content' },
  { key: 'daangn', label: '당근', medium: 'local' },
  { key: 'offline_qr', label: '오프라인QR', medium: 'qr' },
  { key: 'affiliate', label: '어필리에이트', medium: 'referral' },
];

const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`;
const fmt = (iso: string) => new Date(iso).toLocaleString('ko-KR');

export default function AdminTrackingManager({ isLight = false, onNotify }: Props) {
  const [service, setService] = useState<TrackingService>('NADOSOLO');
  const [tab, setTab] = useState<ViewTab>('SOURCE');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<TrackingSummary | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [shortLinks, setShortLinks] = useState<ShortLinkRecord[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);

  // 범용 UTM · 단축 URL · QR 생성기 상태
  const [genOpen, setGenOpen] = useState(false);
  const [targetPath, setTargetPath] = useState('/meetup');
  const [source, setSource] = useState('instagram');
  const [medium, setMedium] = useState('social');
  const [campaign, setCampaign] = useState('');
  const [refCode, setRefCode] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [genBusy, setGenBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tracking?service=${service}`);
      const data = await res.json();
      if (data.ok) {
        setSummary(data.summary);
        setEvents(Array.isArray(data.events) ? data.events : []);
        setShortLinks(Array.isArray(data.shortLinks) ? data.shortLinks : []);
      }
    } catch {
      onNotify?.('트래킹 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [service, onNotify]);

  useEffect(() => {
    void load();
    setShortUrl('');
    setQrDataUrl('');
    setTargetPath(service === 'NADOSOLO' ? '/meetup' : '/reserve');
  }, [service, load]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const trackedUrl = buildTrackedUrl(origin || 'https://nadosolo.com', targetPath || '/', {
    source: source.trim() || undefined,
    medium: medium.trim() || undefined,
    campaign: campaign.trim() || undefined,
    ref: refCode.trim() || undefined,
  });

  const handleGenerateShortAndQr = async () => {
    setGenBusy(true);
    try {
      const res = await fetch('/api/short', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service,
          targetUrl: trackedUrl,
          label: `${source || 'direct'}_${targetPath}`,
        }),
      });
      const data = await res.json();
      if (data.ok && data.shortPath) {
        const fullShort = `${origin}${data.shortPath}`;
        setShortUrl(fullShort);
        const qr = await QRCode.toDataURL(fullShort, { width: 512, margin: 2 });
        setQrDataUrl(qr);
        onNotify?.('단축링크 생성 완료');
        void load();
      }
    } catch {
      onNotify?.('생성 실패');
    } finally {
      setGenBusy(false);
    }
  };

  const copyText = (text: string) => {
    void navigator.clipboard.writeText(text);
    onNotify?.('복사 완료');
  };

  const boxCls = isLight
    ? 'border border-zinc-200 bg-white shadow-sm'
    : 'border border-white/10 bg-[#0c0d12]';
  const rowCls = isLight
    ? 'p-3.5 border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors'
    : 'p-3.5 border border-white/10 bg-[#0c0d12] hover:bg-white/[0.03] hover:border-white/25 transition-colors';
  const btnCls = isLight
    ? 'px-2.5 py-1 text-sm font-mono border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 cursor-pointer disabled:opacity-40'
    : 'px-2.5 py-1 text-sm font-mono border border-white/20 bg-white/5 hover:bg-white/10 text-white cursor-pointer disabled:opacity-40';
  const inputCls = isLight
    ? 'px-2.5 py-1.5 text-sm font-mono bg-white border border-zinc-300 text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-500'
    : 'px-2.5 py-1.5 text-sm font-mono bg-black/40 border border-white/20 text-white placeholder:text-zinc-500 outline-none focus:border-white/40';
  const badgeCls = isLight
    ? 'px-2 py-0.5 text-sm font-mono border border-zinc-300 text-zinc-800'
    : 'px-2 py-0.5 text-sm font-mono border border-white/20 text-zinc-200';
  const titleCls = isLight ? 'text-zinc-900' : 'text-white';
  const subCls = isLight ? 'text-zinc-600' : 'text-zinc-400';

  const currentBuckets: TrackingBucket[] =
    tab === 'SOURCE'
      ? summary?.bySource ?? []
      : tab === 'MEDIUM'
      ? summary?.byMedium ?? []
      : tab === 'CAMPAIGN'
      ? summary?.byCampaign ?? []
      : summary?.byPath ?? [];

  return (
    <div className="space-y-3">
      {/* 표준 상단 컨트롤 바 */}
      <div className={`p-3 ${boxCls} flex flex-wrap items-center justify-between gap-2`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <h2 className={`font-serif-editorial text-lg font-normal ${titleCls}`}>트래킹</h2>
          <span className={badgeCls}>{summary?.visits ?? 0}</span>
          <div className="flex items-center gap-1 ml-1">
            {(['NADOSOLO', 'TABLEBARO'] as const).map((sv) => (
              <button
                key={sv}
                type="button"
                onClick={() => {
                  setService(sv);
                  setOpenKey(null);
                }}
                className={`${btnCls} ${service === sv ? (isLight ? 'border-zinc-900 font-bold' : 'border-white/50 bg-white/15 font-bold') : 'opacity-60'}`}
              >
                {sv === 'NADOSOLO' ? '나도솔로' : '테이블바로'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setGenOpen((v) => !v)} className={btnCls}>
            {genOpen ? '닫기' : '+ 생성'}
          </button>
          <button type="button" onClick={() => void load()} disabled={loading} className={btnCls}>
            새로고침
          </button>
        </div>
      </div>

      {/* 범용 UTM · 단축 URL · QR 생성기 */}
      {genOpen && (
        <div className={`p-4 ${boxCls} space-y-3`}>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PATHS[service].map((p) => (
              <button
                key={p.path}
                type="button"
                onClick={() => setTargetPath(p.path)}
                className={`${btnCls} ${targetPath === p.path ? 'border-white/50 bg-white/15' : 'opacity-70'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <input className={inputCls} placeholder="경로 (/meetup)" value={targetPath} onChange={(e) => setTargetPath(e.target.value)} />
            <select
              className={inputCls}
              value={source}
              onChange={(e) => {
                const v = e.target.value;
                setSource(v);
                const hit = PRESET_CHANNELS.find((c) => c.key === v);
                if (hit) setMedium(hit.medium);
              }}
            >
              {PRESET_CHANNELS.map((c) => (
                <option key={c.key} value={c.key}>{c.label} ({c.key})</option>
              ))}
            </select>
            <input className={inputCls} placeholder="매체 (medium)" value={medium} onChange={(e) => setMedium(e.target.value)} />
            <input className={inputCls} placeholder="캠페인 (선택)" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
            <input className={inputCls} placeholder="추천코드 (선택)" value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-sm font-mono break-all flex-1 min-w-[200px] ${subCls}`}>{trackedUrl}</span>
            <button type="button" onClick={() => copyText(trackedUrl)} className={btnCls}>복사</button>
            <button type="button" onClick={() => void handleGenerateShortAndQr()} disabled={genBusy} className={btnCls}>
              {genBusy ? '생성 중' : '단축 · QR'}
            </button>
          </div>
          {shortUrl && (
            <div className={`p-3 border ${isLight ? 'border-zinc-200' : 'border-white/15'} flex flex-wrap items-center justify-between gap-4`}>
              <div className="space-y-2 min-w-0">
                <div className={`text-sm font-mono font-bold ${titleCls}`}>{shortUrl}</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => copyText(shortUrl)} className={btnCls}>복사</button>
                  {qrDataUrl && (
                    <a href={qrDataUrl} download={`qr-${service.toLowerCase()}-${source}.png`} className={btnCls}>
                      QR저장
                    </a>
                  )}
                </div>
              </div>
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR" width={112} height={112} className="bg-white p-1" />
              )}
            </div>
          )}
        </div>
      )}

      {/* 핵심 4대 지표 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          ['유입', String(summary?.visits ?? 0)],
          ['전환', String(summary?.conversions ?? 0)],
          ['전환율', `${summary?.cvr ?? 0}%`],
          ['매출', won(summary?.amountKrw ?? 0)],
        ].map(([k, v]) => (
          <div key={k} className={`p-3 ${boxCls}`}>
            <div className={`text-sm font-mono ${subCls}`}>{k}</div>
            <div className={`text-base font-mono font-bold mt-1 ${titleCls}`}>{v}</div>
          </div>
        ))}
      </div>

      {/* 차원 탭 */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ['SOURCE', '채널'],
            ['MEDIUM', '매체'],
            ['CAMPAIGN', '캠페인'],
            ['PATH', '경로'],
            ['SHORT', '단축링크'],
            ['LOGS', '로그'],
          ] as Array<[ViewTab, string]>
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setTab(k);
              setOpenKey(null);
            }}
            className={`${btnCls} ${tab === k ? (isLight ? 'border-zinc-900 font-bold' : 'border-white/50 bg-white/15 font-bold') : 'opacity-65'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 채널 · 매체 · 캠페인 · 경로 2열 그리드 */}
      {(tab === 'SOURCE' || tab === 'MEDIUM' || tab === 'CAMPAIGN' || tab === 'PATH') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {currentBuckets.length === 0 && (
            <div className={`col-span-full p-4 ${boxCls} text-sm font-mono ${subCls}`}>데이터 없음</div>
          )}
          {currentBuckets.map((b) => {
            const isOpen = openKey === b.key;
            return (
              <React.Fragment key={b.key}>
                <button
                  type="button"
                  onClick={() => setOpenKey(isOpen ? null : b.key)}
                  className={`${rowCls} text-left flex items-center justify-between gap-2 cursor-pointer`}
                >
                  <span className={`text-sm font-mono truncate ${titleCls}`}>{b.key}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={badgeCls}>유입 {b.visits}</span>
                    <span className={badgeCls}>전환 {b.conversions} ({b.cvr}%)</span>
                  </div>
                </button>
                {isOpen && (
                  <div className={`col-span-full p-3.5 border ${isLight ? 'border-zinc-300 bg-zinc-50' : 'border-white/25 bg-[#0c0d12]'} flex flex-wrap items-center justify-between gap-3 text-sm font-mono`}>
                    <span className={titleCls}>{b.key}</span>
                    <span className={subCls}>유입 {b.visits} · 전환 {b.conversions} · 전환율 {b.cvr}% · 매출 {won(b.amountKrw)}</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* 단축 링크 목록 */}
      {tab === 'SHORT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {shortLinks.length === 0 && (
            <div className={`col-span-full p-4 ${boxCls} text-sm font-mono ${subCls}`}>단축링크 없음</div>
          )}
          {shortLinks.map((l) => (
            <div key={l.code} className={`${rowCls} flex items-center justify-between gap-2`}>
              <div className="min-w-0">
                <div className={`text-sm font-mono font-bold truncate ${titleCls}`}>/s/{l.code}</div>
                <div className={`text-sm font-mono truncate ${subCls}`}>{l.targetUrl}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={badgeCls}>클릭 {l.clicks}</span>
                <button type="button" onClick={() => copyText(`${origin}/s/${l.code}`)} className={btnCls}>
                  복사
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 실시간 로그 */}
      {tab === 'LOGS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {events.length === 0 && (
            <div className={`col-span-full p-4 ${boxCls} text-sm font-mono ${subCls}`}>로그 없음</div>
          )}
          {events.slice(0, 40).map((ev) => (
            <div key={ev.id} className={rowCls}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-mono truncate ${titleCls}`}>
                  {ev.type === 'CONVERSION' ? '전환' : '유입'} · {ev.path}
                </span>
                <span className={badgeCls}>
                  {ev.attribution?.source || (ev.attribution?.partnerCode ? `ref:${ev.attribution.partnerCode}` : '직접')}
                </span>
              </div>
              <div className={`text-sm font-mono mt-1 truncate ${subCls}`}>
                {ev.amountKrw ? `${won(ev.amountKrw)} · ` : ''}
                {ev.attribution?.medium ? `${ev.attribution.medium} · ` : ''}
                {fmt(ev.at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
