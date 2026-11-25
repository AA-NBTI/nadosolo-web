import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  COUNTRIES_REGISTRY,
  calculateGlobalTotals,
  type CountryData,
  type EnlistmentRecord,
} from '@/lib/oops/movementStore';

const MOVEMENT_KV_KEY = 'oops_movement_live_state_v1';

interface MovementState {
  countries: Record<string, CountryData>;
  nextSerial: number;
  recentSignatories: EnlistmentRecord[];
}

// 초기 상태: 모든 수치 0, 일련번호 1부터 시작
let memState: MovementState = {
  countries: JSON.parse(JSON.stringify(COUNTRIES_REGISTRY)),
  nextSerial: 1,
  recentSignatories: [],
};

async function loadState(): Promise<MovementState> {
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

async function saveState(state: MovementState): Promise<void> {
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

export async function GET() {
  const state = await loadState();
  const totals = calculateGlobalTotals(state.countries);
  return NextResponse.json(
    {
      ok: true,
      countries: state.countries,
      totals,
      nextSerial: state.nextSerial,
      recentSignatories: state.recentSignatories,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || '').toUpperCase();
    const state = await loadState();
    const rawCountry = String(body?.countryCode || 'KR').toUpperCase();
    const countryCode = state.countries[rawCountry] ? rawCountry : 'KR';

    if (action === 'VOTE') {
      const choice = String(body?.choice || 'YES').toUpperCase();
      if (choice !== 'YES' && choice !== 'NO') {
        return NextResponse.json({ ok: false, error: 'Invalid vote choice' }, { status: 400 });
      }

      const target = state.countries[countryCode];
      if (choice === 'YES') {
        target.votes.yes += 1;
      } else {
        target.votes.no += 1;
      }
      target.votes.total += 1;

      await saveState(state);
      const totals = calculateGlobalTotals(state.countries);
      return NextResponse.json({
        ok: true,
        action: 'VOTE',
        country: target,
        totals,
      });
    }

    if (action === 'ENLIST') {
      const serialNo = state.nextSerial;
      const callsign = `OP-${countryCode}-${String(serialNo).padStart(4, '0')}`;
      const target = state.countries[countryCode];
      target.signatures += 1;
      state.nextSerial += 1;

      const record: EnlistmentRecord = {
        enlistmentNo: serialNo,
        callsign,
        countryCode,
        enlistedAt: new Date().toISOString(),
      };

      state.recentSignatories = [record, ...state.recentSignatories].slice(0, 20);
      await saveState(state);

      const totals = calculateGlobalTotals(state.countries);
      return NextResponse.json({
        ok: true,
        action: 'ENLIST',
        record,
        country: target,
        totals,
        recentSignatories: state.recentSignatories,
      });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
