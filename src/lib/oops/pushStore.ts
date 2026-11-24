import * as webpush from 'web-push';
import type { PushSubscription } from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';

export interface OopsPushAgent {
  agentId: string;
  alias: string;
  subscription: PushSubscription;
  createdAt: string;
  lastPingAt?: string;
}

export interface OopsBackerRecord {
  id: string;
  name: string;
  org: string;
  email: string;
  tier: string;
  message: string;
  createdAt: string;
}

const AGENTS_KEY = 'oops_push_agents_v1';
const BACKERS_KEY = 'oops_founding_backers_v1';

let memAgents: OopsPushAgent[] = [];
let memBackers: OopsBackerRecord[] = [];

async function readConfig<T>(key: string, fallback: T): Promise<T> {
  try {
    const supabase = createAdminClient();
    if (!supabase) return fallback;
    const { data, error } = await supabase
      .from('app_configs')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (!error && data?.value !== undefined && data?.value !== null) {
      return data.value as T;
    }
  } catch {}
  return fallback;
}

async function writeConfig<T>(key: string, value: T): Promise<void> {
  try {
    const supabase = createAdminClient();
    if (!supabase) return;
    await supabase
      .from('app_configs')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  } catch {}
}

export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
}

function ensureVapidConfigured(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  const priv = process.env.VAPID_PRIVATE_KEY || '';
  if (!pub || !priv) return false;
  webpush.setVapidDetails('mailto:hq@oops.monster', pub, priv);
  return true;
}

function makeAgentId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'OP-';
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function listOopsAgents(): Promise<OopsPushAgent[]> {
  const db = await readConfig<OopsPushAgent[]>(AGENTS_KEY, memAgents);
  memAgents = db;
  return db;
}

export async function upsertOopsAgent(params: {
  subscription: PushSubscription;
  alias?: string;
}): Promise<OopsPushAgent> {
  const list = await listOopsAgents();
  const existing = list.find((a) => a.subscription?.endpoint === params.subscription.endpoint);
  if (existing) {
    existing.subscription = params.subscription;
    if (params.alias?.trim()) existing.alias = params.alias.trim().slice(0, 40);
    memAgents = list;
    await writeConfig(AGENTS_KEY, list);
    return existing;
  }

  const created: OopsPushAgent = {
    agentId: makeAgentId(),
    alias: params.alias?.trim().slice(0, 40) || '저항군 요원',
    subscription: params.subscription,
    createdAt: new Date().toISOString(),
  };
  const next = [created, ...list].slice(0, 500);
  memAgents = next;
  await writeConfig(AGENTS_KEY, next);
  return created;
}

export async function sendOopsPush(params: {
  agentId?: string;
  subscription?: PushSubscription;
  title: string;
  body: string;
  url?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!ensureVapidConfigured()) {
    return { ok: false, error: 'VAPID 키가 설정되지 않았습니다.' };
  }

  let targetSub = params.subscription;
  if (!targetSub && params.agentId) {
    const list = await listOopsAgents();
    const found = list.find((a) => a.agentId === params.agentId);
    if (!found) return { ok: false, error: '해당 요원 코드를 찾을 수 없습니다.' };
    targetSub = found.subscription;
    found.lastPingAt = new Date().toISOString();
    memAgents = list;
    await writeConfig(AGENTS_KEY, list);
  }

  if (!targetSub) {
    return { ok: false, error: '푸시 수신 대상이 없습니다.' };
  }

  try {
    await webpush.sendNotification(
      targetSub,
      JSON.stringify({
        title: params.title,
        body: params.body,
        url: params.url || '/',
        tag: `oops-${Date.now()}`,
      })
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '푸시 발송 실패',
    };
  }
}

export async function listOopsBackers(): Promise<OopsBackerRecord[]> {
  const db = await readConfig<OopsBackerRecord[]>(BACKERS_KEY, memBackers);
  memBackers = db;
  return db;
}

export async function addOopsBacker(params: {
  name: string;
  org: string;
  email: string;
  tier: string;
  message: string;
}): Promise<OopsBackerRecord> {
  const list = await listOopsBackers();
  const record: OopsBackerRecord = {
    id: `BK-${Date.now().toString(36).toUpperCase()}`,
    name: params.name.trim().slice(0, 60),
    org: params.org.trim().slice(0, 80),
    email: params.email.trim().slice(0, 120),
    tier: params.tier.trim().slice(0, 40) || 'FOUNDING_BACKER',
    message: params.message.trim().slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  const next = [record, ...list].slice(0, 300);
  memBackers = next;
  await writeConfig(BACKERS_KEY, next);
  return record;
}

export async function broadcastOopsPush(params: {
  title: string;
  body: string;
  url?: string;
}): Promise<{ total: number; sent: number; failed: number }> {
  const agents = await listOopsAgents();
  let sent = 0;
  let failed = 0;
  for (const agent of agents) {
    const res = await sendOopsPush({
      subscription: agent.subscription,
      title: params.title,
      body: params.body,
      url: params.url || '/',
    });
    if (res.ok) sent++;
    else failed++;
  }
  return { total: agents.length, sent, failed };
}
