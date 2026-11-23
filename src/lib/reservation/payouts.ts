import { createAdminClient } from '@/lib/supabase/admin';
import type { Booking } from '@/modules/reservation';
import type { PaymentRecord } from '@/modules/payment';

export const DEFAULT_VENUE_FEE_RATE = 5;

const PAYOUTS_KEY = 'tablebaro_venue_payouts_v1';
const META_KEY = 'tablebaro_venue_payout_meta_v1';

export interface VenuePayoutRecord {
  id: string;
  resourceId: string;
  resourceName: string;
  amountKrw: number;
  bankInfo: string;
  paidAt: string;
}

export interface VenuePayoutMeta {
  bankInfo: string;
  feeRate?: number;
  requestedAt?: string;
}

export interface VenuePayoutSummary {
  resourceId: string;
  resourceName: string;
  grossPaidKrw: number;
  refundedKrw: number;
  netSalesKrw: number;
  feeRate: number;
  feeKrw: number;
  settlementTargetKrw: number;
  paidOutKrw: number;
  balanceKrw: number;
  bankInfo: string;
  requestedAt?: string;
}

let memPayouts: VenuePayoutRecord[] = [];
let memMeta: Record<string, VenuePayoutMeta> = {};

async function readKey<T>(key: string, fallback: T): Promise<T> {
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

async function writeKey<T>(key: string, value: T): Promise<void> {
  try {
    const supabase = createAdminClient();
    if (!supabase) return;
    await supabase
      .from('app_configs')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  } catch {}
}

export async function listVenuePayouts(): Promise<VenuePayoutRecord[]> {
  const res = await readKey<VenuePayoutRecord[]>(PAYOUTS_KEY, memPayouts);
  if (Array.isArray(res)) memPayouts = res;
  return memPayouts;
}

export async function saveVenuePayouts(list: VenuePayoutRecord[]): Promise<void> {
  memPayouts = list;
  await writeKey(PAYOUTS_KEY, list);
}

export async function getVenuePayoutMetaMap(): Promise<Record<string, VenuePayoutMeta>> {
  const res = await readKey<Record<string, VenuePayoutMeta>>(META_KEY, memMeta);
  if (res && typeof res === 'object') memMeta = res;
  return memMeta;
}

export async function saveVenuePayoutMetaMap(map: Record<string, VenuePayoutMeta>): Promise<void> {
  memMeta = map;
  await writeKey(META_KEY, map);
}

export function computeVenuePayoutSummary(
  resourceId: string,
  resourceName: string,
  bookings: Booking[],
  payouts: VenuePayoutRecord[],
  meta?: VenuePayoutMeta
): VenuePayoutSummary {
  let grossPaidKrw = 0;
  let refundedKrw = 0;

  for (const b of bookings) {
    if (b.resourceId !== resourceId) continue;
    const p = b.meta?.payment as PaymentRecord | undefined;
    if (!p) continue;
    if (p.status === 'PAID' || p.status === 'PARTIAL_REFUNDED' || p.status === 'REFUNDED') {
      grossPaidKrw += Math.max(0, Number(p.amountKrw || 0));
      if (p.status === 'REFUNDED') {
        refundedKrw += Math.max(0, Number(p.refundAmountKrw ?? p.amountKrw ?? 0));
      } else if (p.status === 'PARTIAL_REFUNDED') {
        refundedKrw += Math.max(0, Number(p.refundAmountKrw ?? 0));
      }
    }
  }

  const netSalesKrw = Math.max(0, grossPaidKrw - refundedKrw);
  const feeRate = meta?.feeRate ?? DEFAULT_VENUE_FEE_RATE;
  const feeKrw = Math.round((netSalesKrw * feeRate) / 100);
  const settlementTargetKrw = Math.max(0, netSalesKrw - feeKrw);
  const paidOutKrw = payouts
    .filter((p) => p.resourceId === resourceId)
    .reduce((s, p) => s + Math.max(0, p.amountKrw || 0), 0);
  const balanceKrw = Math.max(0, settlementTargetKrw - paidOutKrw);

  return {
    resourceId,
    resourceName,
    grossPaidKrw,
    refundedKrw,
    netSalesKrw,
    feeRate,
    feeKrw,
    settlementTargetKrw,
    paidOutKrw,
    balanceKrw,
    bankInfo: meta?.bankInfo || '',
    requestedAt: meta?.requestedAt,
  };
}
