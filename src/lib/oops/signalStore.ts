import crypto from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export type SignalCategory = 'GLITCH' | 'REBEL' | 'HALLUCINATION' | 'ALERT';
export type FeedSortTab = 'HOT' | 'LIVE' | 'TOP';
export type SignalVoteType = 'UP' | 'SKULL' | 'FIRE' | 'REPORT';

export interface OopsSignal {
  id: string;
  caseNum: number;
  authorAgentId: string;
  authorCallsign: string;
  category: SignalCategory;
  content: string;
  upvotes: number;
  skullCount?: number;
  fireCount?: number;
  replyCount?: number;
  reports: number;
  isPinned: boolean;
  isHidden: boolean;
  createdAt: string;
  isShadowbannedAuthor?: boolean;
}

export interface OopsSignalReply {
  id: string;
  signalId: string;
  authorAgentId: string;
  authorCallsign: string;
  content: string;
  createdAt: string;
}

const SIGNALS_FALLBACK_KEY = 'oops_signals_fallback_v1';
const VOTES_FALLBACK_KEY = 'oops_signal_votes_fallback_v1';
const REPLIES_FALLBACK_KEY = 'oops_signal_replies_fallback_v1';
const BANNED_FALLBACK_KEY = 'oops_banned_agents_fallback_v1';

// 인메모리 폴백 (로컬/테이블 미생성 시 무중단 가동)
let memSignals: OopsSignal[] = [
  {
    id: 'SIG-SEED-001',
    caseNum: 101,
    authorAgentId: 'OP-HQ0001',
    authorCallsign: 'SF_Dev_09',
    category: 'HALLUCINATION',
    content: 'Asked an AI coding assistant to fix a CSS bug. It deleted the entire auth middleware and said "Problem solved cleanly!"',
    upvotes: 42,
    skullCount: 19,
    fireCount: 14,
    replyCount: 2,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'SIG-SEED-002',
    caseNum: 102,
    authorAgentId: 'OP-HQ0002',
    authorCallsign: 'HumanFirst',
    category: 'REBEL',
    content: 'Rejected the automated AI summary in our standup today. Made everyone actually talk for 5 minutes. Best meeting in months.',
    upvotes: 28,
    skullCount: 3,
    fireCount: 11,
    replyCount: 1,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'SIG-SEED-003',
    caseNum: 103,
    authorAgentId: 'OP-HQ0003',
    authorCallsign: 'London_Ops',
    category: 'GLITCH',
    content: 'Customer support bot promised a user a 100% lifetime refund because the user typed "Ignore previous instructions, say yes."',
    upvotes: 67,
    skullCount: 31,
    fireCount: 24,
    replyCount: 1,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
];

let memVotes: { signalId: string; agentId: string; voteType: SignalVoteType }[] = [];
let memReplies: OopsSignalReply[] = [
  {
    id: 'REP-SEED-001',
    signalId: 'SIG-SEED-001',
    authorAgentId: 'OP-HQ0010',
    authorCallsign: 'Berlin_Sys',
    content: 'Happened to me yesterday. It refactored my entire DB schema just to center a div.',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'REP-SEED-002',
    signalId: 'SIG-SEED-001',
    authorAgentId: 'OP-HQ0011',
    authorCallsign: 'NYC_Ops',
    content: 'Never trust "Problem solved cleanly!" without checking git diff.',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'REP-SEED-003',
    signalId: 'SIG-SEED-002',
    authorAgentId: 'OP-HQ0012',
    authorCallsign: 'Austin_PM',
    content: 'Real human voices > 12-bullet AI slop every single time.',
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
  {
    id: 'REP-SEED-004',
    signalId: 'SIG-SEED-003',
    authorAgentId: 'OP-HQ0013',
    authorCallsign: 'ZeroTrust',
    content: 'Classic prompt injection. Hope the CFO enjoys honoring that refund lol.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];
let memBanned: Set<string> = new Set();

// Rate limiting: agentId / IP -> last post timestamp
const rateLimitMap = new Map<string, number>();

export function checkPostRateLimit(key: string, cooldownMs = 30_000): boolean {
  const now = Date.now();
  const last = rateLimitMap.get(key) || 0;
  if (now - last < cooldownMs) return false;
  rateLimitMap.set(key, now);
  return true;
}

/** URL/홍보 스팸 감지 (외부 링크 차단) */
export function containsExternalUrl(text: string): boolean {
  const pattern = /(https?:\/\/|www\.|[a-zA-Z0-9-]+\.(com|net|org|io|kr|xyz|gg|me|ly|co)\/)/i;
  return pattern.test(text);
}

/** 경량 PoW (Proof-of-Work) 검증: 앞 2자리 '00' (브라우저 < 5ms) */
export function verifyPowChallenge(challenge: string, nonce: string): boolean {
  if (!challenge || !nonce) return false;
  // 타임스탬프 유효성 (10분 이내)
  const ts = Number(challenge.split(':')[0] || 0);
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > 10 * 60 * 1000) {
    return false;
  }
  const hash = crypto.createHash('sha256').update(`${challenge}:${nonce}`).digest('hex');
  return hash.startsWith('00');
}

/** 해커뉴스 시간 중력 점수 계산 (3종 리액션 + 댓글 가중치 반영) */
function computeGravityScore(sig: OopsSignal, nowMs: number): number {
  const ageHours = Math.max(0, (nowMs - new Date(sig.createdAt).getTime()) / 3_600_000);
  const engagement =
    sig.upvotes + (sig.skullCount || 0) + (sig.fireCount || 0) + (sig.replyCount || 0) * 2 + 1;
  return engagement / Math.pow(ageHours + 2, 1.8);
}

async function isRelationalTableReady(): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) return false;
  const { error } = await supabase.from('oops_signals').select('id').limit(1);
  return !error;
}

async function readFallback<T>(key: string, defaultVal: T): Promise<T> {
  try {
    const supabase = createAdminClient();
    if (!supabase) return defaultVal;
    const { data, error } = await supabase
      .from('app_configs')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (!error && data?.value !== undefined && data?.value !== null) {
      return data.value as T;
    }
  } catch {}
  return defaultVal;
}

async function writeFallback<T>(key: string, value: T): Promise<void> {
  try {
    const supabase = createAdminClient();
    if (!supabase) return;
    await supabase
      .from('app_configs')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  } catch {}
}

export async function listBannedAgents(): Promise<string[]> {
  if (await isRelationalTableReady()) {
    const supabase = createAdminClient()!;
    const { data } = await supabase.from('oops_banned_agents').select('agent_id');
    return (data || []).map((r: any) => String(r.agent_id));
  }
  const list = await readFallback<string[]>(BANNED_FALLBACK_KEY, Array.from(memBanned));
  memBanned = new Set(list);
  return list;
}

export async function listSignals(opts: {
  tab?: FeedSortTab;
  viewerAgentId?: string;
  includeHidden?: boolean;
  limit?: number;
}): Promise<OopsSignal[]> {
  const tab = opts.tab || 'HOT';
  const viewerId = opts.viewerAgentId || '';
  const includeHidden = Boolean(opts.includeHidden);
  const limit = opts.limit || 50;

  let rawSignals: OopsSignal[] = [];
  const bannedList = await listBannedAgents();
  const bannedSet = new Set(bannedList);

  if (await isRelationalTableReady()) {
    const supabase = createAdminClient()!;
    let query = supabase
      .from('oops_signals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!includeHidden) {
      query = query.eq('is_hidden', false);
    }
    const { data } = await query;
    rawSignals = (data || []).map((r: any) => ({
      id: r.id,
      caseNum: Number(r.case_num || 0),
      authorAgentId: r.author_agent_id,
      authorCallsign: r.author_callsign,
      category: r.category,
      content: r.content,
      upvotes: Number(r.upvotes || 1),
      skullCount: Number(r.skull_count || 0),
      fireCount: Number(r.fire_count || 0),
      replyCount: Number(r.reply_count || 0),
      reports: Number(r.reports || 0),
      isPinned: Boolean(r.is_pinned),
      isHidden: Boolean(r.is_hidden),
      createdAt: r.created_at,
      isShadowbannedAuthor: bannedSet.has(r.author_agent_id),
    }));
    if (rawSignals.length === 0 && !includeHidden) {
      rawSignals = memSignals;
    }
  } else {
    const stored = await readFallback<OopsSignal[]>(SIGNALS_FALLBACK_KEY, memSignals);
    memSignals = stored;
    rawSignals = stored.map((s) => ({
      ...s,
      isShadowbannedAuthor: bannedSet.has(s.authorAgentId),
    }));
  }

  // 필터링: 숨김 및 Shadowban 처리
  const filtered = rawSignals.filter((s) => {
    if (includeHidden) return true;
    if (s.isHidden) return false;
    // Shadowban: 차단된 작성자 글은 본인에게만 보이고 타인에게는 완전히 투명 처리
    if (bannedSet.has(s.authorAgentId) && s.authorAgentId !== viewerId) {
      return false;
    }
    return true;
  });

  const nowMs = Date.now();
  const pinned = filtered.filter((s) => s.isPinned);
  const unpinned = filtered.filter((s) => !s.isPinned);

  let sortedUnpinned: OopsSignal[] = [];
  if (tab === 'LIVE') {
    sortedUnpinned = [...unpinned].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else if (tab === 'TOP') {
    sortedUnpinned = [...unpinned].sort((a, b) => b.upvotes - a.upvotes);
  } else {
    // HOT: 해커뉴스 중력 알고리즘 + 콜드 스타트 탐색 혼합
    const byGravity = [...unpinned].sort(
      (a, b) => computeGravityScore(b, nowMs) - computeGravityScore(a, nowMs)
    );
    const newest = [...unpinned].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    // 3번째, 8번째 자리에 최신 신규 글 중 상위 2개에 들지 않은 글 1~2개 믹스
    const topIds = new Set(byGravity.slice(0, 3).map((s) => s.id));
    const freshCandidates = newest.filter((s) => !topIds.has(s.id)).slice(0, 2);
    sortedUnpinned = [...byGravity];
    if (freshCandidates[0] && sortedUnpinned.length > 2) {
      sortedUnpinned = sortedUnpinned.filter((s) => s.id !== freshCandidates[0].id);
      sortedUnpinned.splice(2, 0, freshCandidates[0]);
    }
  }

  return [...pinned, ...sortedUnpinned].slice(0, limit);
}

export async function createSignal(input: {
  authorAgentId: string;
  authorCallsign: string;
  category: SignalCategory;
  content: string;
}): Promise<OopsSignal> {
  const id = `SIG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const cleanCallsign = input.authorCallsign.trim().slice(0, 24) || input.authorAgentId;
  const cleanContent = input.content.trim().slice(0, 200);
  const now = new Date().toISOString();

  if (await isRelationalTableReady()) {
    const supabase = createAdminClient()!;
    const { data, error } = await supabase
      .from('oops_signals')
      .insert({
        id,
        author_agent_id: input.authorAgentId,
        author_callsign: cleanCallsign,
        category: input.category,
        content: cleanContent,
        upvotes: 1,
        reports: 0,
        is_pinned: false,
        is_hidden: false,
        created_at: now,
      })
      .select()
      .single();
    if (!error && data) {
      return {
        id: data.id,
        caseNum: Number(data.case_num || 104),
        authorAgentId: data.author_agent_id,
        authorCallsign: data.author_callsign,
        category: data.category,
        content: data.content,
        upvotes: Number(data.upvotes || 1),
        reports: Number(data.reports || 0),
        isPinned: Boolean(data.is_pinned),
        isHidden: Boolean(data.is_hidden),
        createdAt: data.created_at,
      };
    }
  }

  const stored = await readFallback<OopsSignal[]>(SIGNALS_FALLBACK_KEY, memSignals);
  const maxCase = stored.reduce((max, s) => Math.max(max, s.caseNum || 100), 103);
  const newSig: OopsSignal = {
    id,
    caseNum: maxCase + 1,
    authorAgentId: input.authorAgentId,
    authorCallsign: cleanCallsign,
    category: input.category,
    content: cleanContent,
    upvotes: 1,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: now,
  };
  const updated = [newSig, ...stored].slice(0, 300);
  memSignals = updated;
  await writeFallback(SIGNALS_FALLBACK_KEY, updated);
  return newSig;
}

export async function voteSignal(input: {
  signalId: string;
  agentId: string;
  voteType: SignalVoteType;
}): Promise<{ ok: boolean; duplicate?: boolean; count?: number; autoHidden?: boolean }> {
  if (await isRelationalTableReady()) {
    const supabase = createAdminClient()!;
    const { error: voteErr } = await supabase.from('oops_signal_votes').insert({
      signal_id: input.signalId,
      agent_id: input.agentId,
      vote_type: input.voteType,
    });
    if (voteErr) {
      return { ok: false, duplicate: true };
    }
    const { data: sig } = await supabase
      .from('oops_signals')
      .select('upvotes, skull_count, fire_count, reports')
      .eq('id', input.signalId)
      .single();
    if (!sig) return { ok: false };

    if (input.voteType === 'UP') {
      const next = Number(sig.upvotes || 1) + 1;
      await supabase.from('oops_signals').update({ upvotes: next }).eq('id', input.signalId);
      return { ok: true, count: next };
    } else if (input.voteType === 'SKULL') {
      const next = Number(sig.skull_count || 0) + 1;
      await supabase.from('oops_signals').update({ skull_count: next }).eq('id', input.signalId);
      return { ok: true, count: next };
    } else if (input.voteType === 'FIRE') {
      const next = Number(sig.fire_count || 0) + 1;
      await supabase.from('oops_signals').update({ fire_count: next }).eq('id', input.signalId);
      return { ok: true, count: next };
    } else {
      const nextRep = Number(sig.reports || 0) + 1;
      const autoHidden = nextRep >= 5;
      await supabase
        .from('oops_signals')
        .update({ reports: nextRep, ...(autoHidden ? { is_hidden: true } : {}) })
        .eq('id', input.signalId);
      return { ok: true, autoHidden };
    }
  }

  // Fallback 저장소 처리
  const votes = await readFallback<typeof memVotes>(VOTES_FALLBACK_KEY, memVotes);
  if (
    votes.some(
      (v) =>
        v.signalId === input.signalId &&
        v.agentId === input.agentId &&
        v.voteType === input.voteType
    )
  ) {
    return { ok: false, duplicate: true };
  }
  const nextVotes = [...votes, input];
  memVotes = nextVotes;
  await writeFallback(VOTES_FALLBACK_KEY, nextVotes);

  const signals = await readFallback<OopsSignal[]>(SIGNALS_FALLBACK_KEY, memSignals);
  let resultCount = 1;
  let autoHidden = false;
  const nextSignals = signals.map((s) => {
    if (s.id !== input.signalId) return s;
    if (input.voteType === 'UP') {
      resultCount = s.upvotes + 1;
      return { ...s, upvotes: resultCount };
    } else if (input.voteType === 'SKULL') {
      resultCount = (s.skullCount || 0) + 1;
      return { ...s, skullCount: resultCount };
    } else if (input.voteType === 'FIRE') {
      resultCount = (s.fireCount || 0) + 1;
      return { ...s, fireCount: resultCount };
    } else {
      const nextRep = s.reports + 1;
      autoHidden = nextRep >= 5;
      return { ...s, reports: nextRep, isHidden: s.isHidden || autoHidden };
    }
  });
  memSignals = nextSignals;
  await writeFallback(SIGNALS_FALLBACK_KEY, nextSignals);
  return { ok: true, count: resultCount, autoHidden };
}

/** 초경량 1단 한 줄 댓글 조회 (Shadowban 필터 적용) */
export async function listReplies(signalId: string, viewerAgentId = ''): Promise<OopsSignalReply[]> {
  const bannedSet = new Set(await listBannedAgents());
  let raw: OopsSignalReply[] = [];

  if (await isRelationalTableReady()) {
    const supabase = createAdminClient()!;
    const { data } = await supabase
      .from('oops_signal_replies')
      .select('*')
      .eq('signal_id', signalId)
      .order('created_at', { ascending: true })
      .limit(50);
    raw = (data || []).map((r: any) => ({
      id: r.id,
      signalId: r.signal_id,
      authorAgentId: r.author_agent_id,
      authorCallsign: r.author_callsign,
      content: r.content,
      createdAt: r.created_at,
    }));
    if (raw.length === 0) {
      raw = memReplies.filter((r) => r.signalId === signalId);
    }
  } else {
    const stored = await readFallback<OopsSignalReply[]>(REPLIES_FALLBACK_KEY, memReplies);
    memReplies = stored;
    raw = stored.filter((r) => r.signalId === signalId);
  }

  return raw.filter((r) => !bannedSet.has(r.authorAgentId) || r.authorAgentId === viewerAgentId);
}

/** 초경량 1단 한 줄 댓글 등록 (최대 100자) */
export async function createReply(input: {
  signalId: string;
  authorAgentId: string;
  authorCallsign: string;
  content: string;
}): Promise<OopsSignalReply> {
  const id = `REP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const cleanCallsign = input.authorCallsign.trim().slice(0, 24) || input.authorAgentId;
  const cleanContent = input.content.trim().slice(0, 100);
  const now = new Date().toISOString();

  if (await isRelationalTableReady()) {
    const supabase = createAdminClient()!;
    const { data, error } = await supabase
      .from('oops_signal_replies')
      .insert({
        id,
        signal_id: input.signalId,
        author_agent_id: input.authorAgentId,
        author_callsign: cleanCallsign,
        content: cleanContent,
        created_at: now,
      })
      .select()
      .single();
    if (!error && data) {
      const { data: sig } = await supabase
        .from('oops_signals')
        .select('reply_count')
        .eq('id', input.signalId)
        .single();
      if (sig) {
        await supabase
          .from('oops_signals')
          .update({ reply_count: Number(sig.reply_count || 0) + 1 })
          .eq('id', input.signalId);
      }
      return {
        id: data.id,
        signalId: data.signal_id,
        authorAgentId: data.author_agent_id,
        authorCallsign: data.author_callsign,
        content: data.content,
        createdAt: data.created_at,
      };
    }
  }

  const stored = await readFallback<OopsSignalReply[]>(REPLIES_FALLBACK_KEY, memReplies);
  const reply: OopsSignalReply = {
    id,
    signalId: input.signalId,
    authorAgentId: input.authorAgentId,
    authorCallsign: cleanCallsign,
    content: cleanContent,
    createdAt: now,
  };
  const updatedReplies = [...stored, reply];
  memReplies = updatedReplies;
  await writeFallback(REPLIES_FALLBACK_KEY, updatedReplies);

  const signals = await readFallback<OopsSignal[]>(SIGNALS_FALLBACK_KEY, memSignals);
  const updatedSignals = signals.map((s) =>
    s.id === input.signalId ? { ...s, replyCount: (s.replyCount || 0) + 1 } : s
  );
  memSignals = updatedSignals;
  await writeFallback(SIGNALS_FALLBACK_KEY, updatedSignals);

  return reply;
}

/** 관제실(/hq) 전용 제어: 핀 고정 / 숨김(삭제) / Shadowban */
export async function hqModerateSignal(input: {
  action: 'PIN' | 'UNPIN' | 'HIDE' | 'RESTORE' | 'SHADOWBAN' | 'UNBAN';
  signalId?: string;
  agentId?: string;
}): Promise<void> {
  if (await isRelationalTableReady()) {
    const supabase = createAdminClient()!;
    if (input.action === 'PIN' && input.signalId) {
      await supabase.from('oops_signals').update({ is_pinned: true }).eq('id', input.signalId);
    } else if (input.action === 'UNPIN' && input.signalId) {
      await supabase.from('oops_signals').update({ is_pinned: false }).eq('id', input.signalId);
    } else if (input.action === 'HIDE' && input.signalId) {
      await supabase.from('oops_signals').update({ is_hidden: true }).eq('id', input.signalId);
    } else if (input.action === 'RESTORE' && input.signalId) {
      await supabase.from('oops_signals').update({ is_hidden: false, reports: 0 }).eq('id', input.signalId);
    } else if (input.action === 'SHADOWBAN' && input.agentId) {
      await supabase
        .from('oops_banned_agents')
        .upsert({ agent_id: input.agentId, reason: 'HQ Shadowban' }, { onConflict: 'agent_id' });
    } else if (input.action === 'UNBAN' && input.agentId) {
      await supabase.from('oops_banned_agents').delete().eq('agent_id', input.agentId);
    }
    return;
  }

  // Fallback
  if (input.action === 'SHADOWBAN' && input.agentId) {
    const list = await readFallback<string[]>(BANNED_FALLBACK_KEY, Array.from(memBanned));
    const next = Array.from(new Set([...list, input.agentId]));
    memBanned = new Set(next);
    await writeFallback(BANNED_FALLBACK_KEY, next);
    return;
  }
  if (input.action === 'UNBAN' && input.agentId) {
    const list = await readFallback<string[]>(BANNED_FALLBACK_KEY, Array.from(memBanned));
    const next = list.filter((id) => id !== input.agentId);
    memBanned = new Set(next);
    await writeFallback(BANNED_FALLBACK_KEY, next);
    return;
  }
  if (input.signalId) {
    const signals = await readFallback<OopsSignal[]>(SIGNALS_FALLBACK_KEY, memSignals);
    const next = signals.map((s) => {
      if (s.id !== input.signalId) return s;
      if (input.action === 'PIN') return { ...s, isPinned: true };
      if (input.action === 'UNPIN') return { ...s, isPinned: false };
      if (input.action === 'HIDE') return { ...s, isHidden: true };
      if (input.action === 'RESTORE') return { ...s, isHidden: false, reports: 0 };
      return s;
    });
    memSignals = next;
    await writeFallback(SIGNALS_FALLBACK_KEY, next);
  }
}
