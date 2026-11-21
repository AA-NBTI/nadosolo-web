import { NextResponse } from 'next/server';
import { ReservationError } from '@/modules/reservation';
import { getNadoSoloReservationEngine, syncMeetupVenueOnFallback } from '@/lib/reservation/nadosolo';
import { getLinkSecret, verifyResponseToken } from '@/lib/reservation/token';

export const dynamic = 'force-dynamic';

const STATUS_BY_CODE: Record<string, number> = {
  NOT_FOUND: 404,
  INVALID_INPUT: 400,
  SLOT_CLOSED: 409,
  SLOT_FULL: 409,
  INVALID_TRANSITION: 409,
  HOLD_EXPIRED: 410,
  TOO_EARLY: 409,
};

/** 식당 수락/거절. 서명 토큰이 곧 인증이다. */
export async function POST(request: Request) {
  const secret = getLinkSecret();
  const engine = getNadoSoloReservationEngine();
  if (!secret || !engine) {
    return NextResponse.json({ ok: false, error: '예약 기능이 비활성화되어 있습니다.' }, { status: 503 });
  }

  let body: { token?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: '잘못된 요청입니다.' }, { status: 400 });
  }
  const action = body.action === 'ACCEPT' || body.action === 'DECLINE' ? body.action : null;
  const verified = body.token ? verifyResponseToken(body.token, secret) : null;
  if (!action || !verified) {
    return NextResponse.json({ ok: false, error: '유효하지 않거나 만료된 링크입니다.' }, { status: 401 });
  }

  try {
    const booking =
      action === 'ACCEPT'
        ? await engine.confirm(verified.bookingId)
        : await engine.decline(verified.bookingId, '식당 거절');
    const fallbackId =
      action === 'DECLINE' ? await syncMeetupVenueOnFallback(engine, booking).catch(() => null) : null;
    return NextResponse.json({ ok: true, status: booking.status, fallbackBookingId: fallbackId });
  } catch (e) {
    if (e instanceof ReservationError) {
      return NextResponse.json(
        { ok: false, code: e.code, error: e.message },
        { status: STATUS_BY_CODE[e.code] ?? 400 }
      );
    }
    return NextResponse.json({ ok: false, error: '처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
