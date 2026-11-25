import { createAdminClient } from '@/lib/supabase/admin';
import {
  COUNTRIES_REGISTRY,
  type CountryData,
  type EnlistmentRecord,
} from './movementStore';

export const MOVEMENT_KV_KEY = 'oops_movement_live_state_v1';

export interface MovementState {
  countries: Record<string, CountryData>;
  nextSerial: number;
  recentSignatories: EnlistmentRecord[];
}

let memState: MovementState = {
  countries: JSON.parse(JSON.stringify(COUNTRIES_REGISTRY)),
  nextSerial: 1,
  recentSignatories: [],
};

export async function loadMovementState(): Promise<MovementState> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from('app_kv')
        .select('value')
        .eq('key', MOVEMENT_KV_KEY)
        .maybeSingle();

      if (!error && data?.value) {
        const val = data.value as Partial<MovementState>;
        if (val.countries) {
          memState = {
            countries: { ...JSON.parse(JSON.stringify(COUNTRIES_REGISTRY)), ...val.countries },
            nextSerial: typeof val.nextSerial === 'number' && val.nextSerial >= 1 ? val.nextSerial : 1,
            recentSignatories: Array.isArray(val.recentSignatories) ? val.recentSignatories : [],
          };
        }
      }
    } catch {}
  }
  return memState;
}

export async function saveMovementState(state: MovementState): Promise<void> {
  memState = state;
  const admin = createAdminClient();
  if (admin) {
    try {
      await admin
        .from('app_kv')
        .upsert(
          { key: MOVEMENT_KV_KEY, value: state, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
    } catch {}
  }
}
