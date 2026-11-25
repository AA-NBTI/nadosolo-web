import { NextRequest, NextResponse } from 'next/server';
import {
  calculateGlobalTotals,
  type EnlistmentRecord,
} from '@/lib/oops/movementStore';
import {
  loadMovementState,
  saveMovementState,
} from '@/lib/oops/movementServerStore';

export async function GET() {
  const state = await loadMovementState();
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
    const state = await loadMovementState();
    const rawCountry = String(body?.countryCode || 'KR').toUpperCase();
    const countryCode = state.countries[rawCountry] ? rawCountry : 'KR';

    if (action === 'VOTE') {
      const choice = String(body?.choice || 'YES').toUpperCase();
      if (choice !== 'YES' && choice !== 'NO' && choice !== 'NEUTRAL') {
        return NextResponse.json({ ok: false, error: 'Invalid vote choice' }, { status: 400 });
      }

      const target = state.countries[countryCode];
      if (choice === 'YES') {
        target.votes.yes += 1;
      } else if (choice === 'NO') {
        target.votes.no += 1;
      } else if (choice === 'NEUTRAL') {
        target.votes.neutral = (target.votes.neutral || 0) + 1;
      }
      target.votes.total += 1;

      await saveMovementState(state);
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
      const rawName = String(body?.name || '').trim().slice(0, 30);
      const signerName = rawName || `#${countryCode}-${String(serialNo).padStart(6, '0')}`;
      const target = state.countries[countryCode];
      target.signatures += 1;
      state.nextSerial += 1;

      const record: EnlistmentRecord = {
        enlistmentNo: serialNo,
        callsign: signerName,
        countryCode,
        enlistedAt: new Date().toISOString(),
      };

      // 관리자 관제 및 피드를 위해 최근 서약자 최대 100건 보존
      state.recentSignatories = [record, ...state.recentSignatories].slice(0, 100);
      await saveMovementState(state);

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
