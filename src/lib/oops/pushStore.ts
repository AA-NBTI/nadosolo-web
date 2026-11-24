import type { PushSubscription } from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';

// Turbopack / Next.js 15 CommonJS 호환 처리
// eslint-disable-next-line @typescript-eslint/no-require-imports
const webpush = require('web-push');

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
    await supabase.from('app_configs').upsert({ key, value });
  } catch {}
}

export async function getRegisteredAgents(): Promise<OopsPushAgent[]> {
  const list = await readConfig<OopsPushAgent[]>(AGENTS_KEY, memAgents);
  memAgents = list;
  return list;
}

export async function upsertRegisteredAgent(agent: OopsPushAgent): Promise<void> {
  const list = await getRegisteredAgents();
  const idx = list.findIndex((a) => a.agentId === agent.agentId);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...agent, lastPingAt: new Date().toISOString() };
  } else {
    list.unshift(agent);
  }
  memAgents = list.slice(0, 5000);
  await writeConfig(AGENTS_KEY, memAgents);
}

export async function removeRegisteredAgent(agentId: string): Promise<void> {
  const list = await getRegisteredAgents();
  memAgents = list.filter((a) => a.agentId !== agentId);
  await writeConfig(AGENTS_KEY, memAgents);
}

export async function getFoundingBackers(): Promise<OopsBackerRecord[]> {
  const list = await readConfig<OopsBackerRecord[]>(BACKERS_KEY, memBackers);
  memBackers = list;
  return list;
}

export async function addFoundingBacker(record: OopsBackerRecord): Promise<void> {
  const list = await getFoundingBackers();
  list.unshift(record);
  memBackers = list.slice(0, 1000);
  await writeConfig(BACKERS_KEY, memBackers);
}

export interface BroadcastResult {
  total: number;
  sent: number;
  failed: number;
  purged: number;
}

export async function broadcastPush(payload: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}): Promise<BroadcastResult> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:ops@oops.monster';

  const agents = await getRegisteredAgents();
  const result: BroadcastResult = {
    total: agents.length,
    sent: 0,
    failed: 0,
    purged: 0,
  };

  if (!publicKey || !privateKey) {
    console.warn('[OOPS PUSH] VAPID keys not configured, skipping web-push dispatch');
    return result;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const payloadStr = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || 'https://oops.monster',
    tag: payload.tag || 'oops-hq-broadcast',
    icon: '/icon?size=192',
    badge: '/icon?size=96',
    timestamp: Date.now(),
  });

  const staleAgentIds: string[] = [];

  await Promise.all(
    agents.map(async (ag) => {
      try {
        await webpush.sendNotification(ag.subscription, payloadStr, {
          TTL: 60 * 60 * 24, // 24시간
          urgency: 'high',
        });
        result.sent++;
      } catch (err: any) {
        result.failed++;
        const statusCode = err?.statusCode;
        // 404/410 은 만료/해지된 엔드포인트 -> 자동 정리
        if (statusCode === 404 || statusCode === 410) {
          staleAgentIds.push(ag.agentId);
        }
      }
    })
  );

  if (staleAgentIds.length > 0) {
    const purgeSet = new Set(staleAgentIds);
    memAgents = memAgents.filter((a) => !purgeSet.has(a.agentId));
    await writeConfig(AGENTS_KEY, memAgents);
    result.purged = staleAgentIds.length;
  }

  return result;
}
