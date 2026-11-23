import { createAdminClient } from '@/lib/supabase/admin';
import {
  generateShortCode,
  sanitizeAttribution,
  type Attribution,
  type ShortLinkRecord,
  type TrackingEvent,
  type TrackingService,
} from '@/modules/tracking';

const SERVICE_EVENT_KEYS: Record<TrackingService, string> = {
  NADOSOLO: 'nadosolo_tracking_events_v1',
  TABLEBARO: 'tablebaro_tracking_events_v1',
};

const SHORT_LINKS_KEY = 'short_links_v1';
const MAX_EVENTS_PER_SERVICE = 1000;
const MAX_SHORT_LINKS = 1000;

// 개발/테스트 환경 오프라인 폴백용 메모리 저장소
const memEvents: Record<TrackingService, TrackingEvent[]> = {
  NADOSOLO: [],
  TABLEBARO: [],
};
let memShortLinks: ShortLinkRecord[] = [];

async function readConfig<T>(key: string, fallback: T): Promise<T> {
  try {
    const supabase = createAdminClient();
    if (!supabase) return fallback;
    const { data, error } = await supabase
      .from('app_configs')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (!error && data?.value !== undefined && data.value !== null) {
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

export async function listTrackingEvents(
  service: TrackingService,
  resourceId?: string
): Promise<TrackingEvent[]> {
  const key = SERVICE_EVENT_KEYS[service];
  const stored = await readConfig<TrackingEvent[]>(key, memEvents[service]);
  const list = Array.isArray(stored) ? stored : memEvents[service];
  if (list.length > 0) memEvents[service] = list;
  if (resourceId) {
    return list.filter((e) => e.resourceId === resourceId || e.attribution?.resourceId === resourceId);
  }
  return list;
}

export async function recordTrackingEvent(input: {
  service: TrackingService;
  type: 'VISIT' | 'CONVERSION';
  path: string;
  attribution?: Attribution | unknown;
  amountKrw?: number;
  orderId?: string;
  resourceId?: string;
}): Promise<TrackingEvent> {
  const key = SERVICE_EVENT_KEYS[input.service];
  const current = await listTrackingEvents(input.service);

  // 동일 orderId 전환 중복 기록 방지 (멱등성)
  if (input.type === 'CONVERSION' && input.orderId) {
    const dup = current.find((e) => e.type === 'CONVERSION' && e.orderId === input.orderId);
    if (dup) return dup;
  }

  const event: TrackingEvent = {
    id: `trk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    service: input.service,
    type: input.type,
    path: String(input.path || '/').slice(0, 200),
    attribution: sanitizeAttribution(input.attribution),
    amountKrw: input.amountKrw ? Math.max(0, Math.round(Number(input.amountKrw))) : undefined,
    orderId: input.orderId ? String(input.orderId).slice(0, 120) : undefined,
    resourceId: input.resourceId ? String(input.resourceId).slice(0, 120) : undefined,
    at: new Date().toISOString(),
  };

  const next = [event, ...current].slice(0, MAX_EVENTS_PER_SERVICE);
  memEvents[input.service] = next;
  await writeConfig(key, next);
  return event;
}

export async function listShortLinks(service?: TrackingService): Promise<ShortLinkRecord[]> {
  const stored = await readConfig<ShortLinkRecord[]>(SHORT_LINKS_KEY, memShortLinks);
  const list = Array.isArray(stored) ? stored : memShortLinks;
  if (list.length > 0) memShortLinks = list;
  return service ? list.filter((l) => l.service === service) : list;
}

export async function createOrGetShortLink(input: {
  service: TrackingService;
  targetUrl: string;
  label?: string;
}): Promise<ShortLinkRecord> {
  const targetUrl = String(input.targetUrl || '').trim();
  const all = await listShortLinks();

  // 같은 서비스 + 같은 targetUrl이면 기존 단축 코드 재사용
  const existing = all.find(
    (l) => l.service === input.service && l.targetUrl === targetUrl
  );
  if (existing) return existing;

  let code = generateShortCode(6);
  const used = new Set(all.map((l) => l.code));
  while (used.has(code)) {
    code = generateShortCode(6);
  }

  const created: ShortLinkRecord = {
    code,
    service: input.service,
    targetUrl,
    label: input.label ? String(input.label).trim().slice(0, 80) : undefined,
    clicks: 0,
    createdAt: new Date().toISOString(),
  };

  const next = [created, ...all].slice(0, MAX_SHORT_LINKS);
  memShortLinks = next;
  await writeConfig(SHORT_LINKS_KEY, next);
  return created;
}

export async function resolveAndHitShortLink(code: string): Promise<ShortLinkRecord | null> {
  const clean = String(code || '').trim();
  if (!clean) return null;
  const all = await listShortLinks();
  const idx = all.findIndex((l) => l.code === clean);
  if (idx < 0) return null;

  const updated: ShortLinkRecord = {
    ...all[idx],
    clicks: (all[idx].clicks || 0) + 1,
  };
  const next = [...all];
  next[idx] = updated;
  memShortLinks = next;
  await writeConfig(SHORT_LINKS_KEY, next);
  return updated;
}
