import { NextRequest, NextResponse } from 'next/server';
import {
  COUNTRIES_REGISTRY,
  calculateGlobalTotals,
  type CountryData,
} from '@/lib/oops/movementStore';

// 런타임 인메모리 델타 누적 (서버 리스타트 전까지 즉각 반영)
const liveRegistry: Record<string, CountryData> = JSON.parse(JSON.stringify(COUNTRIES_REGISTRY));
let nextEnlistmentSerial = 18492;

export async function GET(req: NextRequest) {
  const totals = calculateGlobalTotals(liveRegistry);
  return NextResponse.json(
    {
      ok: true,
      countries: liveRegistry,
      totals,
      nextSerial: nextEnlistmentSerial,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=15',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || '').toUpperCase();
    const rawCountry = String(body?.countryCode || 'KR').toUpperCase();
    const countryCode = liveRegistry[rawCountry] ? rawCountry : 'KR';

    if (action === 'VOTE') {
      const choice = String(body?.choice || 'YES').toUpperCase();
      if (choice !== 'YES' && choice !== 'NO') {
        return NextResponse.json({ ok: false, error: 'Invalid vote choice' }, { status: 400 });
      }

      const target = liveRegistry[countryCode];
      if (choice === 'YES') {
        target.votes.yes += 1;
      } else {
        target.votes.no += 1;
      }
      target.votes.total += 1;

      const totals = calculateGlobalTotals(liveRegistry);
      return NextResponse.json({
        ok: true,
        action: 'VOTE',
        country: target,
        totals,
      });
    }

    if (action === 'ENLIST') {
      const callsign = String(body?.callsign || '').trim().slice(0, 24) || `OP-${countryCode}-${String(nextEnlistmentSerial).slice(-4)}`;
      const target = liveRegistry[countryCode];
      target.signatures += 1;
      nextEnlistmentSerial += 1;

      const totals = calculateGlobalTotals(liveRegistry);
      return NextResponse.json({
        ok: true,
        action: 'ENLIST',
        record: {
          enlistmentNo: nextEnlistmentSerial - 1,
          callsign,
          countryCode,
          enlistedAt: new Date().toISOString(),
        },
        country: target,
        totals,
      });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
