import { NextResponse } from 'next/server';
import { getReservationDriver, getReservationEngine } from '@/lib/reservation/runtime';
import { summarizeBookingState, type ReservationPublicState } from '@/lib/reservation/reveal';

export const dynamic = 'force-dynamic';

/**
 * 모임(eventId)의 예약 상태 요약.
 * CONFIRMED일 때만 확정된 업체의 주소·전화·이용안내를 함께 반환한다 (대기 중에는 비공개 유지).
 */
export async function GET(request: Request) {
  const eventId = new URL(request.url).searchParams.get('eventId')?.trim();
  if (!eventId) {
    return NextResponse.json({ ok: false, error: 'eventId 필요' }, { status: 400 });
  }
  const engine = getReservationEngine();
  const driver = getReservationDriver();
  if (!engine || !driver) {
    const state: ReservationPublicState = 'DISABLED';
    return NextResponse.json({ ok: true, state });
  }
  try {
    const bookings = await engine.listBookings({ ownerRef: eventId });
    const state = summarizeBookingState(bookings);
    if (state !== 'CONFIRMED') {
      return NextResponse.json({ ok: true, state });
    }
    const confirmed = bookings.find((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
    const resource = confirmed ? await driver.getResource(confirmed.resourceId) : null;
    const profile = (resource?.attributes?.profile || null) as Record<string, any> | null;
    return NextResponse.json({
      ok: true,
      state,
      venue: resource
        ? {
            id: resource.id,
            name: resource.name,
            address: profile?.address || '',
            addressDetail: profile?.addressDetail || '',
            phone: profile?.phone || '',
            guideNote: profile?.guideNote || '',
          }
        : null,
    });
  } catch {
    return NextResponse.json({ ok: true, state: 'DISABLED' as ReservationPublicState });
  }
}
