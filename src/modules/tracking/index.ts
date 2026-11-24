/**
 * 범용 유입 추적 모듈: UTM · QR · 추천코드를 단일 Attribution 모델로 통합.
 * 서비스(나도솔로/테이블바로)에 종속되지 않는 순수 함수만 포함한다.
 */

export interface Attribution {
  partnerCode?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  resourceId?: string;
  capturedAt: string; // ISO
}

export const ATTRIBUTION_TTL_DAYS = 30;

const clean = (v: string | null | undefined, max = 64) => {
  const s = String(v ?? '').trim().slice(0, max);
  return s || undefined;
};

/** URL 쿼리에서 어트리뷰션 추출. 추적 파라미터가 없으면 null */
export function parseAttribution(
  search: string | URLSearchParams,
  now: Date = new Date(),
  resourceId?: string
): Attribution | null {
  const p = typeof search === 'string' ? new URLSearchParams(search) : search;
  const partnerCode = clean(p.get('ref'))?.toUpperCase();
  const source = clean(p.get('utm_source'));
  const medium = clean(p.get('utm_medium'));
  const campaign = clean(p.get('utm_campaign'));
  if (!partnerCode && !source && !medium && !campaign) return null;
  return {
    partnerCode,
    source,
    medium,
    campaign,
    resourceId: clean(resourceId, 128),
    capturedAt: now.toISOString(),
  };
}

export function isAttributionFresh(a: Attribution, now: Date = new Date()): boolean {
  const age = now.getTime() - new Date(a.capturedAt).getTime();
  return Number.isFinite(age) && age >= 0 && age <= ATTRIBUTION_TTL_DAYS * 86400000;
}

/** 마지막 클릭 우선: 새 유입이 있으면 교체, 없으면 유효한 기존 값 유지 */
export function mergeAttribution(
  prev: Attribution | null,
  next: Attribution | null,
  now: Date = new Date()
): Attribution | null {
  if (next) return next;
  return prev && isAttributionFresh(prev, now) ? prev : null;
}

/** QR/채널 링크 생성. QR은 이 URL을 인코딩하면 되며 별도 추적 경로가 필요 없다. */
export function buildTrackedUrl(
  origin: string,
  path: string,
  params: { ref?: string; source?: string; medium?: string; campaign?: string }
): string {
  const u = new URL(path, origin);
  if (params.ref) u.searchParams.set('ref', params.ref.toUpperCase());
  if (params.source) u.searchParams.set('utm_source', params.source);
  if (params.medium) u.searchParams.set('utm_medium', params.medium);
  if (params.campaign) u.searchParams.set('utm_campaign', params.campaign);
  return u.toString();
}

/** 채널별 집계 (사장님 마케팅 분석용) */
export interface ChannelStat {
  channel: string;
  visits: number;
  bookings: number;
  amountKrw: number;
}

export function summarizeByChannel(
  events: Array<{ type: 'VISIT' | 'BOOKING'; attribution?: Attribution | null; amountKrw?: number }>
): ChannelStat[] {
  const map = new Map<string, ChannelStat>();
  for (const e of events) {
    const channel = e.attribution?.source || (e.attribution?.partnerCode ? `ref:${e.attribution.partnerCode}` : '직접');
    const row = map.get(channel) ?? { channel, visits: 0, bookings: 0, amountKrw: 0 };
    if (e.type === 'VISIT') row.visits += 1;
    else {
      row.bookings += 1;
      row.amountKrw += e.amountKrw ?? 0;
    }
    map.set(channel, row);
  }
  return [...map.values()].sort((a, b) => b.bookings - a.bookings || b.visits - a.visits);
}

/** 서버 입력 검증: 외부에서 받은 어트리뷰션 객체를 안전한 형태로 정규화 */
export function sanitizeAttribution(raw: unknown): Attribution | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown, max = 64) => clean(typeof v === 'string' ? v : undefined, max);
  const capturedAt = typeof r.capturedAt === 'string' && !Number.isNaN(Date.parse(r.capturedAt))
    ? new Date(r.capturedAt).toISOString()
    : new Date().toISOString();
  const a: Attribution = {
    partnerCode: str(r.partnerCode)?.toUpperCase(),
    source: str(r.source),
    medium: str(r.medium),
    campaign: str(r.campaign),
    resourceId: str(r.resourceId, 128),
    capturedAt,
  };
  return a.partnerCode || a.source || a.medium || a.campaign ? a : null;
}

/** 브라우저 저장소 연동 (storage: localStorage 호환 객체) */
export function loadAttribution(
  storage: Pick<Storage, 'getItem'>,
  key: string,
  now: Date = new Date()
): Attribution | null {
  try {
    const parsed = sanitizeAttribution(JSON.parse(storage.getItem(key) || 'null'));
    return parsed && isAttributionFresh(parsed, now) ? parsed : null;
  } catch {
    return null;
  }
}

export function captureAttribution(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  key: string,
  search: string,
  now: Date = new Date()
): Attribution | null {
  const merged = mergeAttribution(loadAttribution(storage, key, now), parseAttribution(search, now), now);
  try {
    if (merged) storage.setItem(key, JSON.stringify(merged));
  } catch {}
  return merged;
}

export type TrackingService = 'NADOSOLO' | 'TABLEBARO' | 'OOPS';

export interface TrackingEvent {
  id: string;
  service: TrackingService;
  type: 'VISIT' | 'CONVERSION';
  path: string;
  attribution: Attribution | null;
  amountKrw?: number;
  orderId?: string;
  resourceId?: string;
  at: string;
}

export interface ShortLinkRecord {
  code: string;
  service: TrackingService;
  targetUrl: string;
  label?: string;
  clicks: number;
  createdAt: string;
}

export interface TrackingBucket {
  key: string;
  visits: number;
  conversions: number;
  cvr: number;
  amountKrw: number;
}

export interface TrackingSummary {
  visits: number;
  conversions: number;
  cvr: number;
  amountKrw: number;
  bySource: TrackingBucket[];
  byMedium: TrackingBucket[];
  byCampaign: TrackingBucket[];
  byPath: TrackingBucket[];
}

const calcCvr = (visits: number, conversions: number) =>
  visits > 0 ? Math.round((conversions / visits) * 1000) / 10 : conversions > 0 ? 100 : 0;

function aggregateBuckets(
  events: TrackingEvent[],
  pickKey: (e: TrackingEvent) => string
): TrackingBucket[] {
  const map = new Map<string, { visits: number; conversions: number; amountKrw: number }>();
  for (const e of events) {
    const key = pickKey(e);
    const cur = map.get(key) ?? { visits: 0, conversions: 0, amountKrw: 0 };
    if (e.type === 'VISIT') cur.visits += 1;
    else {
      cur.conversions += 1;
      cur.amountKrw += e.amountKrw ?? 0;
    }
    map.set(key, cur);
  }
  return [...map.entries()]
    .map(([key, v]) => ({
      key,
      visits: v.visits,
      conversions: v.conversions,
      cvr: calcCvr(v.visits, v.conversions),
      amountKrw: v.amountKrw,
    }))
    .sort((a, b) => b.conversions - a.conversions || b.visits - a.visits || b.amountKrw - a.amountKrw);
}

/** 서비스별 유입·전환 이벤트를 다차원(채널·매체·캠페인·경로)으로 집계한다. */
export function summarizeTracking(events: TrackingEvent[]): TrackingSummary {
  let visits = 0;
  let conversions = 0;
  let amountKrw = 0;
  for (const e of events) {
    if (e.type === 'VISIT') visits += 1;
    else {
      conversions += 1;
      amountKrw += e.amountKrw ?? 0;
    }
  }
  return {
    visits,
    conversions,
    cvr: calcCvr(visits, conversions),
    amountKrw,
    bySource: aggregateBuckets(
      events,
      (e) =>
        e.attribution?.source ||
        (e.attribution?.partnerCode ? `ref:${e.attribution.partnerCode}` : '직접')
    ),
    byMedium: aggregateBuckets(events, (e) => e.attribution?.medium || '직접'),
    byCampaign: aggregateBuckets(events, (e) => e.attribution?.campaign || '일반'),
    byPath: aggregateBuckets(events, (e) => e.path || '/'),
  };
}

const SHORT_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

/** 혼동 문자(0,O,1,l,I)를 제외한 6자리 URL-safe 단축 코드 생성 */
export function generateShortCode(length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += SHORT_ALPHABET[Math.floor(Math.random() * SHORT_ALPHABET.length)];
  }
  return out;
}
