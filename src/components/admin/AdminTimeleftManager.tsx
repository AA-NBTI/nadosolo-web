'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { nadoSoloSupabaseService } from '@/lib/supabase/service';
import {
  PromoCode,
  getPromoCodes,
  savePromoCodes,
} from '@/lib/promoCodes';

export type TimeleftSection = 'SLOT' | 'NOTIFY' | 'SANCTION' | 'TICKET' | 'PARTNER' | 'AUTOMATION';

interface Props {
  section: TimeleftSection;
  partnerVenues?: { venueId: string; name: string; cityCode: string; budgetTier: string; maxTablesPerNight: number }[];
  onNotify?: (msg: string) => void;
}

const TITLES: Record<TimeleftSection, string> = {
  SLOT: '슬롯',
  NOTIFY: '알림',
  SANCTION: '제재',
  TICKET: '참가권',
  PARTNER: '제휴',
  AUTOMATION: '자동화',
};

const BTN =
  'px-2.5 py-1 text-sm font-mono border border-white/20 bg-white/5 hover:bg-white/10 text-white cursor-pointer disabled:opacity-40';
const ROW =
  'p-3.5 border border-white/10 bg-[#0c0d12] hover:bg-white/[0.03] hover:border-white/20 transition-colors';
const INPUT =
  'px-2.5 py-1.5 text-sm font-mono bg-black/40 border border-white/20 text-white placeholder:text-zinc-500 outline-none focus:border-white/40';
const BADGE = 'px-2 py-0.5 text-sm font-mono border border-white/20 text-zinc-200';

function Header({ title, count, children }: { title: string; count?: number; children?: React.ReactNode }) {
  return (
    <div className="p-3 border border-white/10 bg-[#0c0d12] flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
        <h2 className="font-serif-editorial text-lg text-white font-normal">{title}</h2>
        {typeof count === 'number' && (
          <span className="text-sm font-mono px-2 py-0.5 border border-white/10 text-zinc-400">{count}건</span>
        )}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString('ko-KR') : '-');

export default function AdminTimeleftManager({ section, partnerVenues = [], onNotify }: Props) {
  const supabase = createClient();
  const notify = useCallback((m: string) => onNotify?.(m), [onNotify]);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  // 데이터
  const [meetups, setMeetups] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [notis, setNotis] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [runLog, setRunLog] = useState<any[]>([]);

  // 입력
  const [nUser, setNUser] = useState('');
  const [nTitle, setNTitle] = useState('');
  const [nMsg, setNMsg] = useState('');
  const [pCode, setPCode] = useState('');
  const [pType, setPType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [pValue, setPValue] = useState(10);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (section === 'SLOT') {
        const [m, a] = await Promise.all([
          supabase.from('meetups').select('*').order('created_at', { ascending: false }).limit(60),
          supabase.from('event_applications').select('user_id,event_id,status'),
        ]);
        setMeetups(m.data || []);
        setApps(a.data || []);
      } else if (section === 'NOTIFY') {
        const n = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(60);
        setNotis(n.data || []);
      } else if (section === 'SANCTION') {
        const b = await supabase.from('user_blocks').select('*').order('created_at', { ascending: false }).limit(100);
        setBlocks(b.data || []);
      } else if (section === 'TICKET') {
        const p = await supabase.from('profiles').select('id,nickname,handle,self_domain_scores').limit(200);
        setProfiles(p.data || []);
        setPromos(getPromoCodes());
      } else if (section === 'PARTNER') {
        setAffiliates(JSON.parse(localStorage.getItem('nadosolo_affiliate_apps_v1') || '[]'));
      } else if (section === 'AUTOMATION') {
        setRunLog(JSON.parse(localStorage.getItem('nadosolo_pipeline_run_log_v1') || '[]'));
      }
    } catch (e: any) {
      notify(`불러오기 실패: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  }, [section, supabase, notify]);

  useEffect(() => {
    setOpenId(null);
    load();
  }, [load]);

  // ---- 슬롯 ----
  const countFor = (eventId: string, status?: string) =>
    apps.filter((a) => a.event_id === eventId && (!status || a.status === status)).length;

  const toggleMeetupStatus = async (m: any) => {
    const next = m.status === 'RECRUITING' ? 'CLOSED' : 'RECRUITING';
    const { error } = await supabase.from('meetups').update({ status: next }).eq('meetup_id', m.meetup_id);
    notify(error ? `실패: ${error.message}` : `${m.title} → ${next}`);
    load();
  };

  const revealMeetup = async (m: any) => {
    const targets = apps.filter((a) => a.event_id === m.meetup_id && a.status === 'CONFIRMED');
    if (targets.length === 0) return notify('확정 인원이 없습니다.');
    const rows = targets.map((t) => ({
      user_id: t.user_id,
      event_id: m.meetup_id,
      type: 'D1_REVEAL',
      title: '내일 모임 공개',
      message: `${m.title} 식당·시간·동석자 힌트가 공개되었습니다.`,
      channel: 'IN_APP',
    }));
    const { error } = await supabase.from('notifications').insert(rows);
    notify(error ? `실패: ${error.message}` : `공개 ${rows.length}명 발송`);
  };

  const rolloverMeetup = async (m: any) => {
    const targets = apps.filter((a) => a.event_id === m.meetup_id && a.status !== 'CANCELLED');
    for (const t of targets) await nadoSoloSupabaseService.adjustTicketCredits(t.user_id, 1);
    await supabase.from('event_applications').update({ status: 'CANCELLED' }).eq('event_id', m.meetup_id).neq('status', 'CANCELLED');
    notify(`이월 ${targets.length}명 (참가권 +1)`);
    load();
  };

  // ---- 알림 ----
  const sendNotification = async () => {
    if (!nUser.trim() || !nTitle.trim() || !nMsg.trim()) return notify('대상·제목·내용 필수');
    let ids: string[] = [nUser.trim()];
    if (nUser.trim().toUpperCase() === 'ALL') {
      const { data } = await supabase.from('profiles').select('id').limit(500);
      ids = (data || []).map((r: any) => r.id);
    }
    const rows = ids.map((id) => ({
      user_id: id,
      type: 'ADMIN_NOTICE',
      title: nTitle.trim(),
      message: nMsg.trim(),
      channel: 'IN_APP',
    }));
    const { error } = await supabase.from('notifications').insert(rows);
    notify(error ? `실패: ${error.message}` : `${rows.length}건 발송`);
    setNTitle('');
    setNMsg('');
    load();
  };

  // ---- 제재 ----
  const releaseBlock = async (id: string) => {
    const { error } = await supabase.from('user_blocks').delete().eq('id', id);
    notify(error ? `실패: ${error.message}` : '해제');
    load();
  };

  // ---- 참가권 ----
  const creditOf = (p: any) =>
    typeof p.self_domain_scores?._ticket_credits === 'number' ? p.self_domain_scores._ticket_credits : 0;

  const adjust = async (id: string, delta: number) => {
    const next = await nadoSoloSupabaseService.adjustTicketCredits(id, delta);
    notify(`참가권 ${next}매`);
    load();
  };

  const persistPromos = (list: PromoCode[]) => {
    setPromos(list);
    savePromoCodes(list);
  };

  const addPromo = () => {
    const code = pCode.trim().toUpperCase();
    if (!code || promos.some((p) => p.code === code)) return notify('코드 중복 또는 공백');
    persistPromos([...promos, { code, type: pType, value: pValue, active: true }]);
    setPCode('');
  };

  // ---- 자동화 ----
  const runPipeline = async (kind: 'DRY' | 'EXEC' | 'CRON') => {
    setLoading(true);
    try {
      const res =
        kind === 'CRON'
          ? await fetch('/api/cron/daily-match')
          : kind === 'DRY'
          ? await fetch('/api/pipeline/auto-match')
          : await fetch('/api/pipeline/auto-match', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mode: 'EXECUTE' }),
            });
      const json = await res.json();
      const entry = { at: new Date().toISOString(), kind, status: res.status, ok: !!json.ok, summary: JSON.stringify(json).slice(0, 220) };
      const next = [entry, ...runLog].slice(0, 30);
      setRunLog(next);
      localStorage.setItem('nadosolo_pipeline_run_log_v1', JSON.stringify(next));
      notify(`${kind} ${json.ok ? '성공' : '실패'}`);
    } catch (e: any) {
      notify(`호출 실패: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const refresh = (
    <button type="button" className={BTN} onClick={load} disabled={loading}>
      {loading ? '로딩' : '새로고침'}
    </button>
  );

  // ================= 렌더 =================
  if (section === 'SLOT') {
    return (
      <div className="space-y-3">
        <Header title={TITLES.SLOT} count={meetups.length}>{refresh}</Header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {meetups.map((m) => {
            const open = openId === m.meetup_id;
            const confirmed = countFor(m.meetup_id, 'CONFIRMED');
            const total = countFor(m.meetup_id) - countFor(m.meetup_id, 'CANCELLED');
            const short = confirmed < (m.min_confirm_count ?? 4);
            return (
              <div key={m.meetup_id} className={`${ROW} ${open ? 'md:col-span-full' : ''}`}>
                <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => setOpenId(open ? null : m.meetup_id)}>
                  <div className="min-w-0">
                    <div className="font-serif-editorial text-sm text-white truncate">{m.title}</div>
                    <div className="text-sm font-mono text-zinc-400">{m.region_name || m.district_name} · {m.date_text}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={BADGE}>{total}/{m.max_capacity ?? 6}</span>
                    <span className={BADGE}>{m.status}</span>
                  </div>
                </div>
                {open && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-sm font-mono text-zinc-200">
                      <div className="p-2 border border-white/10">신청 {total}</div>
                      <div className="p-2 border border-white/10">확정 {confirmed}</div>
                      <div className="p-2 border border-white/10">{short ? '미달' : '충족'} (최소 {m.min_confirm_count ?? 4})</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={BTN} onClick={() => toggleMeetupStatus(m)}>
                        {m.status === 'RECRUITING' ? '마감' : '모집'}
                      </button>
                      <button type="button" className={BTN} onClick={() => revealMeetup(m)}>공개</button>
                      <button type="button" className={BTN} onClick={() => rolloverMeetup(m)}>이월</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (section === 'NOTIFY') {
    return (
      <div className="space-y-3">
        <Header title={TITLES.NOTIFY} count={notis.length}>{refresh}</Header>
        <div className="p-3 border border-white/10 bg-[#0c0d12] grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className={INPUT} placeholder="대상 ID 또는 ALL" value={nUser} onChange={(e) => setNUser(e.target.value)} />
          <input className={INPUT} placeholder="제목" value={nTitle} onChange={(e) => setNTitle(e.target.value)} />
          <input className={INPUT} placeholder="내용" value={nMsg} onChange={(e) => setNMsg(e.target.value)} />
          <button type="button" className={BTN} onClick={sendNotification}>발송</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {notis.map((n) => (
            <div key={n.id} className={ROW}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-serif-editorial text-sm text-white truncate">{n.title}</span>
                <span className={BADGE}>{n.type}</span>
              </div>
              <div className="text-sm text-zinc-300 mt-1 truncate">{n.message}</div>
              <div className="text-sm font-mono text-zinc-500 mt-1">{n.user_id} · {fmt(n.created_at)} · {n.is_read ? '읽음' : '안읽음'}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'SANCTION') {
    return (
      <div className="space-y-3">
        <Header title={TITLES.SANCTION} count={blocks.length}>{refresh}</Header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {blocks.map((b) => (
            <div key={b.id} className={`${ROW} flex items-center justify-between gap-3`}>
              <div className="min-w-0">
                <div className="text-sm font-mono text-white truncate">{b.from_user_id} → {b.blocked_user_id}</div>
                <div className="text-sm font-mono text-zinc-400">{b.reason} · {fmt(b.created_at)}</div>
              </div>
              <button type="button" className={BTN} onClick={() => releaseBlock(b.id)}>해제</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'TICKET') {
    const list = profiles.filter(
      (p) => !query || `${p.nickname}${p.handle}${p.id}`.toLowerCase().includes(query.toLowerCase())
    );
    return (
      <div className="space-y-3">
        <Header title={TITLES.TICKET} count={profiles.length}>{refresh}</Header>
        <div className="p-3 border border-white/10 bg-[#0c0d12] grid grid-cols-2 md:grid-cols-5 gap-2">
          <input className={INPUT} placeholder="코드" value={pCode} onChange={(e) => setPCode(e.target.value)} />
          <select className={INPUT} value={pType} onChange={(e) => setPType(e.target.value as any)}>
            <option value="PERCENT">%</option>
            <option value="FIXED">원</option>
          </select>
          <input className={INPUT} type="number" value={pValue} onChange={(e) => setPValue(Number(e.target.value))} />
          <button type="button" className={BTN} onClick={addPromo}>추가</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {promos.map((p) => (
            <div key={p.code} className={`${ROW} flex items-center justify-between gap-2`}>
              <span className="text-sm font-mono text-white">{p.code} · {p.type === 'PERCENT' ? `${p.value}%` : `₩${p.value.toLocaleString()}`}</span>
              <div className="flex gap-2">
                <button type="button" className={BTN} onClick={() => persistPromos(promos.map((x) => (x.code === p.code ? { ...x, active: !x.active } : x)))}>
                  {p.active ? 'ON' : 'OFF'}
                </button>
                <button type="button" className={BTN} onClick={() => persistPromos(promos.filter((x) => x.code !== p.code))}>삭제</button>
              </div>
            </div>
          ))}
        </div>
        <Header title="보유">
          <input className={INPUT} placeholder="검색" value={query} onChange={(e) => setQuery(e.target.value)} />
        </Header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {list.map((p) => (
            <div key={p.id} className={`${ROW} flex items-center justify-between gap-2`}>
              <div className="min-w-0">
                <div className="text-sm text-white truncate">{p.nickname}</div>
                <div className="text-sm font-mono text-zinc-500 truncate">{p.id}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" className={BTN} onClick={() => adjust(p.id, -1)}>-1</button>
                <span className={BADGE}>{creditOf(p)}매</span>
                <button type="button" className={BTN} onClick={() => adjust(p.id, 1)}>+1</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'PARTNER') {
    return (
      <div className="space-y-3">
        <Header title={TITLES.PARTNER} count={affiliates.length + partnerVenues.length}>{refresh}</Header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {affiliates.map((a, i) => (
            <div key={`${a.code}-${i}`} className={ROW}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-white truncate">{a.partnerName}</span>
                <span className={BADGE}>어필리에이트 · {a.code}</span>
              </div>
              <div className="text-sm font-mono text-zinc-400 truncate">{a.contactEmail} · {a.channelUrl}</div>
              <div className="text-sm font-mono text-zinc-500">{fmt(a.createdAt)}</div>
            </div>
          ))}
          {partnerVenues.map((v) => (
            <div key={v.venueId} className={ROW}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-white truncate">{v.name}</span>
                <span className={BADGE}>식당</span>
              </div>
              <div className="text-sm font-mono text-zinc-400">{v.cityCode} · {v.budgetTier} · {v.maxTablesPerNight}테이블</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Header title={TITLES.AUTOMATION} count={runLog.length}>
        <button type="button" className={BTN} onClick={() => runPipeline('DRY')} disabled={loading}>점검</button>
        <button type="button" className={BTN} onClick={() => runPipeline('EXEC')} disabled={loading}>실행</button>
        <button type="button" className={BTN} onClick={() => runPipeline('CRON')} disabled={loading}>크론</button>
      </Header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {runLog.map((r, i) => (
          <div key={i} className={ROW}>
            <div className="flex items-center justify-between gap-2">
              <span className={BADGE}>{r.kind}</span>
              <span className={BADGE}>{r.ok ? '성공' : `실패 ${r.status}`}</span>
            </div>
            <div className="text-sm font-mono text-zinc-500 mt-1">{fmt(r.at)}</div>
            <div className="text-sm font-mono text-zinc-300 mt-1 break-all">{r.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
