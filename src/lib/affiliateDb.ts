import { createClient } from '@/lib/supabase/client';
import { getAppConfig, saveAppConfig } from '@/lib/appConfigDb';
import { fetchPromoCodes, savePromoCodesDb } from '@/lib/promoCodes';

export interface AffiliateApplicationRow {
  id?: string;
  partnerName: string;
  channelUrl: string;
  contactEmail: string;
  code: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  createdAt: string;
}

export interface PartnerMeta {
  commissionRate: number; // % (기본 10)
  discountRate: number; // % (기본 10)
  bankInfo?: string;
  note?: string;
}

export interface AffiliateEventLog {
  id: string;
  code: string;
  eventType: 'CLICK' | 'PURCHASE';
  amountKrw?: number;
  commissionKrw?: number;
  userId?: string;
  orderId?: string;
  blockedSelfReferral?: boolean;
  at: string;
}

export interface AffiliatePayoutRecord {
  id: string;
  code: string;
  partnerName: string;
  amountKrw: number;
  bankInfo: string;
  note?: string;
  paidAt: string;
}

const META_KEY = 'affiliate_partner_meta';
const META_LOCAL = 'nadosolo_affiliate_meta_v1';
const EVENTS_KEY = 'affiliate_events';
const EVENTS_LOCAL = 'nadosolo_affiliate_events_v1';
const PAYOUTS_KEY = 'affiliate_payouts';
const PAYOUTS_LOCAL = 'nadosolo_affiliate_payouts_v1';

export async function fetchAffiliateApplications(): Promise<AffiliateApplicationRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('affiliate_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data) {
      return data.map((r: any) => ({
        id: r.id,
        partnerName: r.partner_name,
        channelUrl: r.channel_url,
        contactEmail: r.contact_email,
        code: String(r.code || '').toUpperCase(),
        status: (r.status || 'PENDING') as AffiliateApplicationRow['status'],
        createdAt: r.created_at,
      }));
    }
  } catch {}

  if (typeof window !== 'undefined') {
    try {
      const local = JSON.parse(localStorage.getItem('nadosolo_affiliate_apps_v1') || '[]');
      if (Array.isArray(local)) return local;
    } catch {}
  }
  return [];
}

export async function fetchPartnerMetaMap(): Promise<Record<string, PartnerMeta>> {
  const res = await getAppConfig<Record<string, PartnerMeta>>(META_KEY, META_LOCAL, {});
  return res && typeof res === 'object' ? res : {};
}

export async function savePartnerMetaMap(map: Record<string, PartnerMeta>): Promise<boolean> {
  return saveAppConfig(META_KEY, META_LOCAL, map);
}

export async function fetchAffiliateEvents(): Promise<AffiliateEventLog[]> {
  const res = await getAppConfig<AffiliateEventLog[]>(EVENTS_KEY, EVENTS_LOCAL, []);
  return Array.isArray(res) ? res : [];
}

export async function fetchAffiliatePayouts(): Promise<AffiliatePayoutRecord[]> {
  const res = await getAppConfig<AffiliatePayoutRecord[]>(PAYOUTS_KEY, PAYOUTS_LOCAL, []);
  return Array.isArray(res) ? res : [];
}

export async function saveAffiliatePayouts(list: AffiliatePayoutRecord[]): Promise<boolean> {
  return saveAppConfig(PAYOUTS_KEY, PAYOUTS_LOCAL, list);
}

export async function updateAffiliateStatusAndPromo(
  app: AffiliateApplicationRow,
  nextStatus: 'APPROVED' | 'REJECTED' | 'SUSPENDED',
  meta?: PartnerMeta
): Promise<void> {
  const code = app.code.trim().toUpperCase();
  const dbStatus = nextStatus === 'SUSPENDED' ? 'REJECTED' : nextStatus;

  if (app.id) {
    const supabase = createClient();
    await supabase.from('affiliate_applications').update({ status: dbStatus }).eq('id', app.id);
  }

  const metaMap = await fetchPartnerMetaMap();
  const prevMeta = metaMap[code] || { commissionRate: 10, discountRate: 10 };
  const mergedMeta: PartnerMeta = {
    ...prevMeta,
    ...(meta || {}),
    note: nextStatus === 'SUSPENDED' ? `[정지] ${meta?.note ?? prevMeta.note ?? ''}`.trim() : (meta?.note ?? prevMeta.note),
  };
  metaMap[code] = mergedMeta;
  await savePartnerMetaMap(metaMap);

  const promos = await fetchPromoCodes();
  const exists = promos.some((p) => p.code === code);
  const nextPromos = exists
    ? promos.map((p) =>
        p.code === code
          ? { ...p, value: mergedMeta.discountRate, type: 'PERCENT' as const, active: nextStatus === 'APPROVED' }
          : p
      )
    : nextStatus === 'APPROVED'
    ? [...promos, { code, type: 'PERCENT' as const, value: mergedMeta.discountRate, active: true }]
    : promos;
  await savePromoCodesDb(nextPromos);
}

export async function trackAffiliateClick(rawCode: string, userId?: string): Promise<void> {
  const code = rawCode.trim().toUpperCase();
  if (!code || typeof window === 'undefined') return;
  const dedupKey = `nadosolo_ref_clicked_${code}`;
  if (sessionStorage.getItem(dedupKey)) return;
  sessionStorage.setItem(dedupKey, '1');

  const events = await fetchAffiliateEvents();
  const next: AffiliateEventLog[] = [
    {
      id: `CLK_${Date.now()}`,
      code,
      eventType: 'CLICK' as const,
      userId: userId || 'GUEST',
      at: new Date().toISOString(),
    },
    ...events,
  ].slice(0, 500);
  await saveAppConfig(EVENTS_KEY, EVENTS_LOCAL, next);
}

export async function trackAffiliatePurchase(params: {
  code: string;
  orderId: string;
  amountKrw: number;
  userId?: string;
  userEmail?: string;
  userHandle?: string;
}): Promise<void> {
  const code = params.code.trim().toUpperCase();
  if (!code) return;

  const [events, apps, metaMap] = await Promise.all([
    fetchAffiliateEvents(),
    fetchAffiliateApplications(),
    fetchPartnerMetaMap(),
  ]);

  if (events.some((e) => e.eventType === 'PURCHASE' && e.orderId === params.orderId)) {
    return;
  }

  const partner = apps.find((a) => a.code === code);
  const meta = metaMap[code] || { commissionRate: 10, discountRate: 10 };
  const normalizedHandle = (params.userHandle || '').replace(/^@/, '').toUpperCase();
  const isSelfReferral = Boolean(
    (partner?.contactEmail && params.userEmail && partner.contactEmail.toLowerCase() === params.userEmail.toLowerCase()) ||
      (normalizedHandle && normalizedHandle === code)
  );

  const commissionKrw = isSelfReferral ? 0 : Math.round((params.amountKrw * meta.commissionRate) / 100);

  const next: AffiliateEventLog[] = [
    {
      id: `PUR_${Date.now()}`,
      code,
      eventType: 'PURCHASE' as const,
      amountKrw: params.amountKrw,
      commissionKrw,
      userId: params.userId || 'GUEST',
      orderId: params.orderId,
      blockedSelfReferral: isSelfReferral,
      at: new Date().toISOString(),
    },
    ...events,
  ].slice(0, 500);

  await saveAppConfig(EVENTS_KEY, EVENTS_LOCAL, next);
}
