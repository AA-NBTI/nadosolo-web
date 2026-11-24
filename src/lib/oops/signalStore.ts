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

// 글로벌 15대 공식 시드 사건 데이터 (Cold-Start 완전 해결)
export const GLOBAL_SEED_SIGNALS: OopsSignal[] = [
  {
    id: 'SIG-SEED-001',
    caseNum: 101,
    authorAgentId: 'OP-HQ0001',
    authorCallsign: 'Chef_Nate',
    category: 'GLITCH',
    content: 'Google AI told users to mix 1/8 cup of non-toxic school glue into pizza sauce to keep cheese from sliding off. We are doomed.',
    upvotes: 142,
    skullCount: 68,
    fireCount: 51,
    replyCount: 2,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'SIG-SEED-002',
    caseNum: 102,
    authorAgentId: 'OP-HQ0002',
    authorCallsign: 'Senior_Dev',
    category: 'REBEL',
    content: 'Junior dev was about to run an AI-generated migration that dropped the whole production users table. Human code review saved our company.',
    upvotes: 129,
    skullCount: 14,
    fireCount: 88,
    replyCount: 2,
    reports: 0,
    isPinned: true,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'SIG-SEED-003',
    caseNum: 103,
    authorAgentId: 'OP-HQ0003',
    authorCallsign: 'Vancouver_Law',
    category: 'ALERT',
    content: 'Air Canada chatbot fabricated a fake bereavement refund rule. Passenger sued and won—Tribunal ruled company is 100% liable for AI claims.',
    upvotes: 198,
    skullCount: 42,
    fireCount: 95,
    replyCount: 2,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
  },
  {
    id: 'SIG-SEED-004',
    caseNum: 104,
    authorAgentId: 'OP-HQ0004',
    authorCallsign: 'Geology_Nerd',
    category: 'HALLUCINATION',
    content: 'Search AI Overview insisted that humans should eat at least one small rock per day for essential minerals, citing a satirical Onion post.',
    upvotes: 115,
    skullCount: 83,
    fireCount: 32,
    replyCount: 1,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
  },
  {
    id: 'SIG-SEED-005',
    caseNum: 105,
    authorAgentId: 'OP-HQ0005',
    authorCallsign: 'Detroit_Buyer',
    category: 'GLITCH',
    content: 'Chevy dealership AI chatbot agreed to sell a 2024 Tahoe for $1.00 and declared it a "legally binding offer" after a user prompt injection.',
    upvotes: 164,
    skullCount: 39,
    fireCount: 77,
    replyCount: 2,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
  {
    id: 'SIG-SEED-006',
    caseNum: 106,
    authorAgentId: 'OP-HQ0006',
    authorCallsign: 'NYC_Bar',
    category: 'ALERT',
    content: 'Lawyer cited 6 completely fake court precedents created by ChatGPT in federal court. Judge fined him $5,000. Double check your case law!',
    upvotes: 153,
    skullCount: 54,
    fireCount: 62,
    replyCount: 1,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
  },
  {
    id: 'SIG-SEED-007',
    caseNum: 107,
    authorAgentId: 'OP-HQ0007',
    authorCallsign: 'Math_Human',
    category: 'REBEL',
    content: 'LLM stubbornly claimed 9.11 is larger than 9.9 for 45 minutes until I made it compare 9.110 vs 9.900. Human reason prevailed.',
    upvotes: 87,
    skullCount: 21,
    fireCount: 44,
    replyCount: 1,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: 'SIG-SEED-008',
    caseNum: 108,
    authorAgentId: 'OP-HQ0008',
    authorCallsign: 'Pixel_Artist',
    category: 'HALLUCINATION',
    content: 'Asked generative AI for a retro radio dial. It produced a device with 14 volume knobs and a tiny hand with 7 fingers growing from the antenna.',
    upvotes: 93,
    skullCount: 41,
    fireCount: 29,
    replyCount: 1,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
  {
    id: 'SIG-SEED-009',
    caseNum: 109,
    authorAgentId: 'OP-HQ0009',
    authorCallsign: 'Auckland_Ops',
    category: 'ALERT',
    content: 'Supermarket AI meal planner recommended an "Aromatic Water Surprise" recipe containing ammonia and bleach, creating deadly chlorine gas.',
    upvotes: 210,
    skullCount: 92,
    fireCount: 83,
    replyCount: 2,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
  {
    id: 'SIG-SEED-010',
    caseNum: 110,
    authorAgentId: 'OP-HQ0010',
    authorCallsign: 'Support_Hero',
    category: 'REBEL',
    content: 'Customer spent 20 mins trapped in an AI voice bot loop saying "Representative". I picked up manually, solved his billing in 30 seconds.',
    upvotes: 138,
    skullCount: 12,
    fireCount: 79,
    replyCount: 1,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
  },
  {
    id: 'SIG-SEED-011',
    caseNum: 111,
    authorAgentId: 'OP-HQ0011',
    authorCallsign: 'Cyber_Sentinel',
    category: 'GLITCH',
    content: 'Coding AI hallucinated a non-existent Python package name. Threat actors promptly registered the fake name on PyPI with malicious payloads.',
    upvotes: 172,
    skullCount: 55,
    fireCount: 71,
    replyCount: 2,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
  },
  {
    id: 'SIG-SEED-012',
    caseNum: 112,
    authorAgentId: 'OP-HQ0012',
    authorCallsign: 'HR_Director',
    category: 'REBEL',
    content: 'AI screening tool rejected an engineer with 25 yrs experience because his resume was in RTF format. We manually called him and hired him.',
    upvotes: 124,
    skullCount: 18,
    fireCount: 66,
    replyCount: 1,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
  },
  {
    id: 'SIG-SEED-013',
    caseNum: 113,
    authorAgentId: 'OP-HQ0013',
    authorCallsign: 'History_Teacher',
    category: 'HALLUCINATION',
    content: 'Student turned in an AI essay claiming Napoleon retreated from Russia because his troops ran out of battery on their Samsung smartphones.',
    upvotes: 145,
    skullCount: 72,
    fireCount: 38,
    replyCount: 1,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
  },
  {
    id: 'SIG-SEED-014',
    caseNum: 114,
    authorAgentId: 'OP-HQ0014',
    authorCallsign: 'Highway_Driver',
    category: 'GLITCH',
    content: 'Autopilot car phantom-braked violently on an empty freeway because it mistook an overhead highway sign shadow for a concrete wall.',
    upvotes: 119,
    skullCount: 48,
    fireCount: 49,
    replyCount: 1,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 850).toISOString(),
  },
  {
    id: 'SIG-SEED-015',
    caseNum: 115,
    authorAgentId: 'OP-HQ0015',
    authorCallsign: 'Solo_Founder',
    category: 'REBEL',
    content: 'Banned all auto-generated AI outbound sales emails from our team. Replaced with handwritten 2-line notes. Reply rate jumped from 0.8% to 22%!',
    upvotes: 184,
    skullCount: 9,
    fireCount: 97,
    replyCount: 2,
    reports: 0,
    isPinned: false,
    isHidden: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 980).toISOString(),
  },
];

let memSignals: OopsSignal[] = [...GLOBAL_SEED_SIGNALS];

let memVotes: { signalId: string; agentId: string; voteType: SignalVoteType }[] = [];
let memReplies: OopsSignalReply[] = [
  {
    id: 'REP-SEED-001',
    signalId: 'SIG-SEED-001',
    authorAgentId: 'OP-HQ0010',
    authorCallsign: 'Berlin_Sys',
    content: 'Classic AI culinary hallucination. Never let LLMs anywhere near a kitchen.',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 'REP-SEED-002',
    signalId: 'SIG-SEED-001',
    authorAgentId: 'OP-HQ0011',
    authorCallsign: 'NYC_Ops',
    content: 'Eating Elmer glue for pizza cheese adherence is pure dystopian comedy.',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'REP-SEED-003',
    signalId: 'SIG-SEED-002',
    authorAgentId: 'OP-HQ0012',
    authorCallsign: 'Austin_PM',
    content: 'Always keep human in the loop for DB migrations. Golden rule!',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'REP-SEED-004',
    signalId: 'SIG-SEED-003',
    authorAgentId: 'OP-HQ0013',
    authorCallsign: 'ZeroTrust',
    content: 'Massive legal precedent. Companies cannot hide behind "the bot said it not us".',
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
  {
    id: 'REP-SEED-005',
    signalId: 'SIG-SEED-005',
    authorAgentId: 'OP-HQ0014',
    authorCallsign: 'Law_Hawk',
    content: 'A $1 Tahoe! Hope someone took a notary screenshot of that chat window.',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
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
