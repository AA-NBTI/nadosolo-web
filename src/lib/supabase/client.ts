import { createBrowserClient } from '@supabase/ssr';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (typeof window !== 'undefined' && browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);

  if (typeof window !== 'undefined') {
    browserClient = client;
  }

  return client;
}


