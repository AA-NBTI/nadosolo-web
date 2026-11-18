import { createClient } from '@/lib/supabase/client';

/**
 * Supabase app_configs 테이블 읽기/쓰기 (미생성·오프라인 시 localStorage 폴백)
 */
export async function getAppConfig<T>(key: string, localKey: string, fallback: T): Promise<T> {
  let localVal: T | null = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) localVal = JSON.parse(raw) as T;
    } catch {}
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('app_configs')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (!error && data && data.value !== undefined && data.value !== null) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(localKey, JSON.stringify(data.value));
        } catch {}
      }
      return data.value as T;
    }
  } catch {}

  return localVal !== null ? localVal : fallback;
}

export async function saveAppConfig<T>(key: string, localKey: string, value: T): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(localKey, JSON.stringify(value));
    } catch {}
  }
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('app_configs')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    return !error;
  } catch {
    return false;
  }
}
