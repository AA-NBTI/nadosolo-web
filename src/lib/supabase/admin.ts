import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * 서버 전용 service role 클라이언트. 절대 클라이언트 컴포넌트에서 import하지 말 것.
 * SUPABASE_SERVICE_ROLE_KEY가 없으면 null을 반환한다 (호출 측이 기능을 건너뛴다).
 */
export function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
