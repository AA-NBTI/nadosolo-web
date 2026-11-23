import { createAdminClient } from '@/lib/supabase/admin';
import type { PayLinkRecord } from '@/modules/paylink';

const PAYLINKS_KEY = 'paylinks_v1';
const MAX_PAYLINKS = 1000;
let memPayLinks: PayLinkRecord[] = [];

export async function listPayLinks(resourceId?: string): Promise<PayLinkRecord[]> {
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('app_configs')
        .select('value')
        .eq('key', PAYLINKS_KEY)
        .maybeSingle();
      if (!error && Array.isArray(data?.value)) {
        memPayLinks = data.value as PayLinkRecord[];
      }
    }
  } catch {}
  return resourceId
    ? memPayLinks.filter((p) => p.resourceId === resourceId)
    : memPayLinks;
}

export async function getPayLink(id: string): Promise<PayLinkRecord | null> {
  const list = await listPayLinks();
  return list.find((p) => p.id === id) ?? null;
}

export async function upsertPayLink(record: PayLinkRecord): Promise<void> {
  const list = await listPayLinks();
  const idx = list.findIndex((p) => p.id === record.id);
  const next =
    idx >= 0
      ? list.map((p, i) => (i === idx ? record : p))
      : [record, ...list].slice(0, MAX_PAYLINKS);

  memPayLinks = next;
  try {
    const supabase = createAdminClient();
    if (!supabase) return;
    await supabase
      .from('app_configs')
      .upsert(
        { key: PAYLINKS_KEY, value: next, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
  } catch {}
}
