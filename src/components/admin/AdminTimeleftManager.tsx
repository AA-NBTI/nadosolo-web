'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { nadoSoloSupabaseService } from '@/lib/supabase/service';
import {
  PromoCode,
  fetchPromoCodes,
  savePromoCodesDb,
} from '@/lib/promoCodes';
import { getAppConfig, saveAppConfig } from '@/lib/appConfigDb';
import {
  DEFAULT_MEMBERSHIP_TIERS,
  MembershipTierCode,
  MembershipTierSpec,
  fetchMembershipTiers,
  saveMembershipTiers,
} from '@/lib/membershipTiers';

export type TimeleftSection = 'SLOT' | 'NOTIFY' | 'SANCTION' | 'TICKET' | 'PARTNER' | 'AUTOMATION';

interface Props {
  section: TimeleftSection;
  isLight?: boolean;
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

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString('ko-KR') : '-');

export default function AdminTimeleftManager({
  section,
  isLight = false,
  partnerVenues = [],
  onNotify,
}: Props) {
  const supabase = createClient();
  const notify = useCallback((m: string) => onNotify?.(m), [onNotify]);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const [meetups, setMeetups] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [notis, setNotis] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [promoUsage, setPromoUsage] = useState<Record<string, number>>({});
  const [tiers, setTiers] = useState<MembershipTierSpec[]>(DEFAULT_MEMBERSHIP_TIERS);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [yotVenues, setYotVenues] = useState<any[]>([]);
  const [runLog, setRunLog] = useState<any[]>([]);

  const [nUser, setNUser] = useState('');
  const [nTitle, setNTitle] = useState('');
  const [nMsg, setNMsg] = useState('');
  const [pCode, setPCode] = useState('');
  const [pType, setPType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [pValue, setPValue] = useState(10);
  const [query, setQuery] = useState('');

  const boxCls = isLight
    ? 'border border-zinc-200 bg-white shadow-sm'
    : 'border border-white/10 bg-[#0c0d12]';
  const rowCls = isLight
    ? 'p-3.5 border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors'
    : 'p-3.5 border border-white/10 bg-[#0c0d12] hover:bg-white/[0.03] hover:border-white/20 transition-colors';
  const btnCls = isLight
    ? 'px-2.5 py-1 text-sm font-mono border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 cursor-pointer disabled:opacity-40'
    : 'px-2.5 py-1 text-sm font-mono border border-white/20 bg-white/5 hover:bg-white/10 text-white cursor-pointer disabled:opacity-40';
  const inputCls = isLight
    ? 'px-2.5 py-1.5 text-sm font-mono bg-white border border-zinc-300 text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-500'
    : 'px-2.5 py-1.5 text-sm font-mono bg-black/40 border border-white/20 text-white placeholder:text-zinc-500 outline-none focus:border-white/40';
  const badgeCls = isLight
    ? 'px-2 py-0.5 text-sm font-mono border border-zinc-300 text-zinc-800'
    : 'px-2 py-0.5 text-sm font-mono border border-white/20 text-zinc-200';
  const titleTextCls = isLight ? 'text-zinc-900' : 'text-white';
  const subTextCls = isLight ? 'text-zinc-600' : 'text-zinc-400';
  const muteTextCls = isLight ? 'text-zinc-500' : 'text-zinc-500';
  const dividerCls = isLight ? 'border-zinc-200' : 'border-white/10';

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
        const [p, promoList, usageLogs, tierList] = await Promise.all([
          supabase.from('profiles').select('id,nickname,handle,self_domain_scores').limit(200),
          fetchPromoCodes(),
          getAppConfig<Array<{ promo?: string }>>('promo_usage_logs', 'nadosolo_promo_usage_logs_v1', []),
          fetchMembershipTiers(),
        ]);
        setProfiles(p.data || []);
        setPromos(promoList);
        setTiers(tierList);
        const counts: Record<string, number> = {};
        if (Array.isArray(usageLogs)) {
          for (const u of usageLogs) {
            if (u.promo) counts[u.promo] = (counts[u.promo] || 0) + 1;
          }
        }
        setPromoUsage(counts);
      } else if (section === 'PARTNER') {
        const [{ data, error }, yotRes] = await Promise.all([
          supabase
            .from('affiliate_applications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100),
          fetch('/api/yot/ranking?limit=20')
            .then((r) => r.json())
            .catch(() => ({ ranking: [] })),
        ]);
        if (yotRes?.ranking) setYotVenues(yotRes.ranking);
        if (!error && data) {
          setAffiliates(
            data.map((r: any) => ({
              id: r.id,
              partnerName: r.partner_name,
              channelUrl: r.channel_url,
              contactEmail: r.contact_email,
              code: r.code,
              status: r.status || 'PENDING',
              createdAt: r.created_at,
            }))
          );
        } else {
          setAffiliates(JSON.parse(localStorage.getItem('nadosolo_affiliate_apps_v1') || '[]'));
        }
      } else if (section === 'AUTOMATION') {
        const logs = await getAppConfig<any[]>('pipeline_run_logs', 'nadosolo_pipeline_run_log_v1', []);
        setRunLog(Array.isArray(logs) ? logs : []);
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

  const countFor = (eventId: string, status?: string) =>
    apps.filter((a) => a.event_id === eventId && (!status || a.status === status)).length;

  const toggleMeetupStatus = async (m: any) => {
    const next = m.status === 'RECRUITING' ? 'CLOSED' : 'RECRUITING';
    const { error } = await supabase.from('meetups').update({ status: next }).eq('meetup_id', m.meetup_id);
    notify(error ? `실패: ${error.message}` : `${m.title} → ${next}`);
    load();
  };

  const revealMeetup = async (m: any) => {
    const confirmed = apps.filter((a) => a.event_id === m.meetup_id && a.status === 'CONFIRMED');
    const targets =
      confirmed.length > 0
        ? confirmed
        : apps.filter((a) => a.event_id === m.meetup_id && a.status !== 'CANCELLED');

    await supabase.from('meetups').update({ status: 'CONFIRMED' }).eq('meetup_id', m.meetup_id);

    if (targets.length === 0) {
      notify(`${m.title} → CONFIRMED (발송 대상 없음)`);
      load();
      return;
    }

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
    load();
  };

  const rolloverMeetup = async (m: any) => {
    const targets = apps.filter((a) => a.event_id === m.meetup_id && a.status !== 'CANCELLED');
    for (const t of targets) {
      await nadoSoloSupabaseService.adjustTicketCredits(t.user_id, 1);
    }
    await supabase
      .from('event_applications')
      .update({ status: 'CANCELLED' })
      .eq('event_id', m.meetup_id)
      .neq('status', 'CANCELLED');
    await supabase.from('meetups').update({ status: 'CANCELLED_MIN' }).eq('meetup_id', m.meetup_id);

    if (targets.length > 0) {
      await supabase.from('notifications').insert(
        targets.map((t) => ({
          user_id: t.user_id,
          event_id: m.meetup_id,
          type: 'ROLLOVER_CREDIT',
          title: '모임 자동 이월',
          message: `[${m.title}] 최소 인원 미달로 이월되어 참가권 1매가 적립되었습니다.`,
          channel: 'IN_APP',
        }))
      );
    }
    notify(`이월 ${targets.length}명 (참가권 +1)`);
    load();
  };

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

  const releaseBlock = async (id: string) => {
    const { error } = await supabase.from('user_blocks').delete().eq('id', id);
    notify(error ? `실패: ${error.message}` : '해제');
    load();
  };

  const creditOf = (p: any) =>
    typeof p.self_domain_scores?._ticket_credits === 'number' ? p.self_domain_scores._ticket_credits : 0;

  const tierOf = (p: any): MembershipTierCode =>
    (p.self_domain_scores?._tier_code || 'STANDARD') as MembershipTierCode;

  const changeTier = async (id: string, nextCode: MembershipTierCode) => {
    const expiresAt =
      nextCode === 'BARO'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : undefined;
    const ok = await nadoSoloSupabaseService.updateMemberTier(id, nextCode, expiresAt);
    notify(ok ? `티어 ${nextCode}` : '티어 변경 실패');
    load();
  };

  const handleSaveTiers = async () => {
    const ok = await saveMembershipTiers(tiers);
    notify(ok ? '티어 가격 저장 완료' : '저장 실패');
  };

  const adjust = async (id: string, delta: number) => {
    const next = await nadoSoloSupabaseService.adjustTicketCredits(id, delta);
    notify(`참가권 ${next}매`);
    load();
  };

  const persistPromos = (list: PromoCode[]) => {
    setPromos(list);
    void savePromoCodesDb(list);
  };

  const approveAffiliate = async (a: any) => {
    const code = String(a.code || '').trim().toUpperCase();
    if (a.id) {
      await supabase.from('affiliate_applications').update({ status: 'APPROVED' }).eq('id', a.id);
    }
    const existing = await fetchPromoCodes();
    if (code && !existing.some((p) => p.code === code)) {
      await savePromoCodesDb([...existing, { code, type: 'PERCENT', value: 10, active: true }]);
    }
    notify(`${a.partnerName} 승인 (${code} 10% 활성화)`);
    load();
  };

  const addPromo = () => {
    const code = pCode.trim().toUpperCase();
    if (!code || promos.some((p) => p.code === code)) return notify('코드 중복 또는 공백');
    persistPromos([...promos, { code, type: pType, value: pValue, active: true }]);
    setPCode('');
  };

  const runPipeline = async (kind: 'DRY' | 'EXEC' | 'CRON') => {
    setLoading(true);
    try {
      const res =
        kind === 'DRY'
          ? await fetch('/api/pipeline/auto-match')
          : await fetch('/api/pipeline/auto-match', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(
                kind === 'CRON'
                  ? { mode: 'EXECUTE', requirePaid: true, coreCount: 4 }
                  : { mode: 'EXECUTE' }
              ),
            });
      const json = await res.json();
      const entry = {
        at: new Date().toISOString(),
        kind,
        status: res.status,
        ok: !!json.ok,
        summary: JSON.stringify(json).slice(0, 220),
      };
      const next = [entry, ...runLog].slice(0, 30);
      setRunLog(next);
      void saveAppConfig('pipeline_run_logs', 'nadosolo_pipeline_run_log_v1', next);
      notify(`${kind} ${json.ok ? '성공' : '실패'}`);
    } catch (e: any) {
      notify(`호출 실패: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = (title: string, count?: number, children?: React.ReactNode) => (
    <div className={`p-3 ${boxCls} flex items-center justify-between gap-3`}>
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
        <h2 className={`font-serif-editorial text-lg font-normal ${titleTextCls}`}>{title}</h2>
        {typeof count === 'number' && (
          <span className={`text-sm font-mono px-2 py-0.5 border ${dividerCls} ${subTextCls}`}>{count}건</span>
        )}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );

  const refresh = (
    <button type="button" className={btnCls} onClick={load} disabled={loading}>
      {loading ? '로딩' : '새로고침'}
    </button>
  );

  if (section === 'SLOT') {
    return (
      <div className="space-y-3">
        {renderHeader(TITLES.SLOT, meetups.length, refresh)}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {meetups.map((m) => {
            const open = openId === m.meetup_id;
            const confirmed = countFor(m.meetup_id, 'CONFIRMED');
            const total = countFor(m.meetup_id) - countFor(m.meetup_id, 'CANCELLED');
            const short = confirmed < (m.min_confirm_count ?? 4);
            return (
              <div key={m.meetup_id} className={`${rowCls} ${open ? 'md:col-span-full' : ''}`}>
                <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => setOpenId(open ? null : m.meetup_id)}>
                  <div className="min-w-0">
                    <div className={`font-serif-editorial text-sm truncate ${titleTextCls}`}>{m.title}</div>
                    <div className={`text-sm font-mono ${subTextCls}`}>{m.region_name || m.district_name} · {m.date_text}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={badgeCls}>{total}/{m.max_capacity ?? 6}</span>
                    <span className={badgeCls}>{m.status}</span>
                  </div>
                </div>
                {open && (
                  <div className={`mt-3 pt-3 border-t ${dividerCls} space-y-3`}>
                    <div className={`grid grid-cols-3 gap-2 text-sm font-mono ${titleTextCls}`}>
                      <div className={`p-2 border ${dividerCls}`}>신청 {total}</div>
                      <div className={`p-2 border ${dividerCls}`}>확정 {confirmed}</div>
                      <div className={`p-2 border ${dividerCls}`}>{short ? '미달' : '충족'} (최소 {m.min_confirm_count ?? 4})</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={btnCls} onClick={() => toggleMeetupStatus(m)}>
                        {m.status === 'RECRUITING' ? '마감' : '모집'}
                      </button>
                      <button type="button" className={btnCls} onClick={() => revealMeetup(m)}>공개</button>
                      <button type="button" className={btnCls} onClick={() => rolloverMeetup(m)}>이월</button>
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
        {renderHeader(TITLES.NOTIFY, notis.length, refresh)}
        <div className={`p-3 ${boxCls} grid grid-cols-1 md:grid-cols-4 gap-2`}>
          <input className={inputCls} placeholder="대상 ID 또는 ALL" value={nUser} onChange={(e) => setNUser(e.target.value)} />
          <input className={inputCls} placeholder="제목" value={nTitle} onChange={(e) => setNTitle(e.target.value)} />
          <input className={inputCls} placeholder="내용" value={nMsg} onChange={(e) => setNMsg(e.target.value)} />
          <button type="button" className={btnCls} onClick={sendNotification}>발송</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {notis.map((n) => (
            <div key={n.id} className={rowCls}>
              <div className="flex items-center justify-between gap-2">
                <span className={`font-serif-editorial text-sm truncate ${titleTextCls}`}>{n.title}</span>
                <span className={badgeCls}>{n.type}</span>
              </div>
              <div className={`text-sm mt-1 truncate ${subTextCls}`}>{n.message}</div>
              <div className={`text-sm font-mono mt-1 ${muteTextCls}`}>{n.user_id} · {fmt(n.created_at)} · {n.is_read ? '읽음' : '안읽음'}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'SANCTION') {
    return (
      <div className="space-y-3">
        {renderHeader(TITLES.SANCTION, blocks.length, refresh)}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {blocks.map((b) => (
            <div key={b.id} className={`${rowCls} flex items-center justify-between gap-3`}>
              <div className="min-w-0">
                <div className={`text-sm font-mono truncate ${titleTextCls}`}>{b.from_user_id} → {b.blocked_user_id}</div>
                <div className={`text-sm font-mono ${subTextCls}`}>{b.reason} · {fmt(b.created_at)}</div>
              </div>
              <button type="button" className={btnCls} onClick={() => releaseBlock(b.id)}>해제</button>
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
        {renderHeader(TITLES.TICKET, profiles.length, refresh)}
        <div className={`p-3 ${boxCls} grid grid-cols-2 md:grid-cols-5 gap-2`}>
          <input className={inputCls} placeholder="코드" value={pCode} onChange={(e) => setPCode(e.target.value)} />
          <select className={inputCls} value={pType} onChange={(e) => setPType(e.target.value as any)}>
            <option value="PERCENT">%</option>
            <option value="FIXED">원</option>
          </select>
          <input className={inputCls} type="number" value={pValue} onChange={(e) => setPValue(Number(e.target.value))} />
          <button type="button" className={btnCls} onClick={addPromo}>추가</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {promos.map((p) => (
            <div key={p.code} className={`${rowCls} flex items-center justify-between gap-2`}>
              <span className={`text-sm font-mono ${titleTextCls}`}>
                {p.code} · {p.type === 'PERCENT' ? `${p.value}%` : `₩${p.value.toLocaleString()}`} · 사용 {promoUsage[p.code] || 0}건
              </span>
              <div className="flex gap-2">
                <button type="button" className={btnCls} onClick={() => persistPromos(promos.map((x) => (x.code === p.code ? { ...x, active: !x.active } : x)))}>
                  {p.active ? 'ON' : 'OFF'}
                </button>
                <button type="button" className={btnCls} onClick={() => persistPromos(promos.filter((x) => x.code !== p.code))}>삭제</button>
              </div>
            </div>
          ))}
        </div>
        {renderHeader(
          '티어 가격',
          tiers.length,
          <button type="button" className={btnCls} onClick={handleSaveTiers}>저장</button>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {tiers.map((t) => (
            <div key={t.code} className={`${rowCls} flex items-center justify-between gap-3`}>
              <div className="min-w-0">
                <div className={`text-sm font-mono ${titleTextCls}`}>
                  {t.name} ({t.code})
                </div>
                <div className={`text-sm font-mono truncate ${subTextCls}`}>
                  Rank {t.rank} · {t.billingCycle === 'YEARLY' ? '1년권' : t.billingCycle === 'PER_EVENT' ? '1회 기준' : '가입비'}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-sm font-mono ${subTextCls}`}>₩</span>
                <input
                  type="number"
                  step={10000}
                  min={0}
                  value={t.priceKrw}
                  onChange={(e) => {
                    const nextVal = Math.max(0, Number(e.target.value) || 0);
                    setTiers((prev) =>
                      prev.map((x) => (x.code === t.code ? { ...x, priceKrw: nextVal } : x))
                    );
                  }}
                  className={`${inputCls} w-32 text-right`}
                />
              </div>
            </div>
          ))}
        </div>
        {renderHeader('보유', list.length, <input className={inputCls} placeholder="검색" value={query} onChange={(e) => setQuery(e.target.value)} />)}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {list.map((p) => (
            <div key={p.id} className={`${rowCls} flex items-center justify-between gap-2`}>
              <div className="min-w-0">
                <div className={`text-sm truncate ${titleTextCls}`}>{p.nickname}</div>
                <div className={`text-sm font-mono truncate ${muteTextCls}`}>{p.id}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={tierOf(p)}
                  onChange={(e) => changeTier(p.id, e.target.value as MembershipTierCode)}
                  className={`${inputCls} py-1`}
                >
                  {tiers.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.code}
                    </option>
                  ))}
                </select>
                <button type="button" className={btnCls} onClick={() => adjust(p.id, -1)}>-1</button>
                <span className={badgeCls}>{creditOf(p)}매</span>
                <button type="button" className={btnCls} onClick={() => adjust(p.id, 1)}>+1</button>
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
        {renderHeader(TITLES.PARTNER, affiliates.length + partnerVenues.length, refresh)}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {affiliates.map((a, i) => (
            <div key={`${a.id || a.code}-${i}`} className={rowCls}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm truncate ${titleTextCls}`}>{a.partnerName}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={badgeCls}>어필리에이트 · {a.code}</span>
                  <span className={badgeCls}>{a.status || 'PENDING'}</span>
                  {a.status !== 'APPROVED' && (
                    <button type="button" className={btnCls} onClick={() => approveAffiliate(a)}>승인</button>
                  )}
                </div>
              </div>
              <div className={`text-sm font-mono truncate ${subTextCls}`}>{a.contactEmail} · {a.channelUrl}</div>
              <div className={`text-sm font-mono ${muteTextCls}`}>{fmt(a.createdAt)}</div>
            </div>
          ))}
          {partnerVenues.map((v) => (
            <div key={v.venueId} className={rowCls}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm truncate ${titleTextCls}`}>{v.name}</span>
                <span className={badgeCls}>식당</span>
              </div>
              <div className={`text-sm font-mono ${subTextCls}`}>{v.cityCode} · {v.budgetTier} · {v.maxTablesPerNight}테이블</div>
            </div>
          ))}
          {yotVenues.map((yv, idx) => (
            <div key={yv.provider_place_id || idx} className={rowCls}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm truncate font-medium ${titleTextCls}`}>
                  #{idx + 1} {yv.place_name}
                </span>
                <span className={badgeCls}>제보 {yv.report_count || 1}건</span>
              </div>
              <div className={`text-sm font-mono truncate ${subTextCls}`}>
                {yv.region_city} {yv.region_gu} {yv.region_dong} {yv.category_name ? `· ${yv.category_name.split('>').pop()?.trim()}` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {renderHeader(
        TITLES.AUTOMATION,
        runLog.length,
        <>
          <button type="button" className={btnCls} onClick={() => runPipeline('DRY')} disabled={loading}>점검</button>
          <button type="button" className={btnCls} onClick={() => runPipeline('EXEC')} disabled={loading}>실행</button>
          <button type="button" className={btnCls} onClick={() => runPipeline('CRON')} disabled={loading}>크론</button>
        </>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {runLog.map((r, i) => (
          <div key={i} className={rowCls}>
            <div className="flex items-center justify-between gap-2">
              <span className={badgeCls}>{r.kind}</span>
              <span className={badgeCls}>{r.ok ? '성공' : `실패 ${r.status}`}</span>
            </div>
            <div className={`text-sm font-mono mt-1 ${muteTextCls}`}>{fmt(r.at)}</div>
            <div className={`text-sm font-mono mt-1 break-all ${subTextCls}`}>{r.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
