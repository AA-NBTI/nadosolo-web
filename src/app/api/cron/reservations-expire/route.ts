import { NextResponse } from 'next/server';
import { getNadoSoloReservationEngine } from '@/lib/reservation/nadosolo';

export const dynamic = 'force-dynamic';

/** 홀드 만료 정리 (Hobby 플랜: 하루 1회). 만료분은 폴백 대체 예약으로 이어진다. */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  const engine = getNadoSoloReservationEngine();
  if (!engine) {
    return NextResponse.json({ ok: true, cron: 'reservations-expire', enabled: false });
  }
  try {
    const expired = await engine.expireHolds();
    return NextResponse.json({ ok: true, cron: 'reservations-expire', enabled: true, expired: expired.length });
  } catch (e) {
    return NextResponse.json({ ok: false, cron: 'reservations-expire', error: (e as Error).message }, { status: 500 });
  }
}
