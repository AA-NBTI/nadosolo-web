import { NextResponse } from 'next/server';
import { ReservationError } from '@/modules/reservation';
import { getReservationDriver, getReservationEngine } from '@/lib/reservation/runtime';
import {
  computeRefundAmount,
  getDefaultPaymentAdapter,
  transitionPaymentStatus,
  type PaymentRecord,
} from '@/modules/payment';

export const dynamic = 'force-dynamic';

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

/**
 * 일반 손님용 내 예약 조회 & 직접 취소 API (무로그인 · 연락처 본인 확인)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = normalizePhone(searchParams.get('phone') || '');

  if (phone.length < 8) {
    return NextResponse.json({ ok: false, error: '연락처를 정확히 입력해 주세요.' }, { status: 400 });
  }

  const engine = getReservationEngine();
  const driver = getReservationDriver();
  if (!engine || !driver) {
    return NextResponse.json({ ok: false, error: '예약 모듈 비활성' }, { status: 503 });
  }

  try {
    const [allBookings, resources] = await Promise.all([
      engine.listBookings(),
      driver.listResources(),
    ]);
    const resMap = new Map(resources.map((r) => [r.id, r]));

    const mine = allBookings
      .filter((b) => {
        const att = b.meta?.attendee as { phone?: string } | undefined;
        const attPhone = normalizePhone(att?.phone || '');
        const ownerPhone = normalizePhone(b.ownerRef.replace(/^GUEST:/, ''));
        return (attPhone && attPhone === phone) || (ownerPhone && ownerPhone === phone);
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map((b) => {
        const res = resMap.get(b.resourceId);
        const profile = (res?.attributes?.profile || {}) as Record<string, any>;
        const att = b.meta?.attendee as { name?: string; phone?: string; requests?: string } | undefined;
        return {
          id: b.id,
          resourceId: b.resourceId,
          resourceName: res?.name || (b.meta?.venueName as string) || b.resourceId,
          resourceAddress: profile.address || '',
          resourcePhone: profile.phone || '',
          partySize: b.partySize,
          status: b.status,
          startsAtText: (b.meta?.startsAtText as string) || '',
          guestName: att?.name || '',
          requests: att?.requests || '',
          payment: (b.meta?.payment as Record<string, unknown> | undefined) || null,
          createdAt: b.createdAt,
        };
      });

    return NextResponse.json({ ok: true, bookings: mine });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const engine = getReservationEngine();
  if (!engine) {
    return NextResponse.json({ ok: false, error: '예약 모듈 비활성' }, { status: 503 });
  }

  let body: { bookingId?: string; phone?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: '잘못된 요청' }, { status: 400 });
  }

  const bookingId = String(body.bookingId || '').trim();
  const phone = normalizePhone(String(body.phone || ''));
  if (!bookingId || phone.length < 8) {
    return NextResponse.json({ ok: false, error: '예약 번호와 연락처가 필요합니다.' }, { status: 400 });
  }

  try {
    const booking = await engine.getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ ok: false, error: '예약을 찾을 수 없습니다.' }, { status: 404 });
    }

    const att = booking.meta?.attendee as { phone?: string } | undefined;
    const attPhone = normalizePhone(att?.phone || '');
    const ownerPhone = normalizePhone(booking.ownerRef.replace(/^GUEST:/, ''));

    if (attPhone !== phone && ownerPhone !== phone) {
      return NextResponse.json({ ok: false, error: '연락처가 일치하지 않습니다.' }, { status: 403 });
    }

    const updated = await engine.cancel(bookingId, '이용자 직접 취소');
    const payment = updated.meta?.payment as PaymentRecord | undefined;
    const driver = getReservationDriver();

    if (payment && payment.status === 'PAID' && driver) {
      const [slot, resource] = await Promise.all([
        driver.getSlot(updated.slotId),
        driver.getResource(updated.resourceId),
      ]);
      const prof = (resource?.attributes?.profile || {}) as Record<string, any>;
      const freeCancelHours = Math.max(0, Number(prof.freeCancelHours ?? 48));
      const { refundAmountKrw, fullRefund } = computeRefundAmount({
        paidAmountKrw: payment.amountKrw,
        startsAt: slot?.startsAt || updated.createdAt,
        rule: { freeCancelHours, lateRefundRatePercent: 0 },
      });
      if (refundAmountKrw > 0 && payment.paymentKey) {
        await getDefaultPaymentAdapter().refund({
          paymentKey: payment.paymentKey,
          amountKrw: refundAmountKrw,
          reason: '이용자 직접 취소',
        });
      }
      const nextStatus = fullRefund ? 'REFUNDED' : 'PARTIAL_REFUNDED';
      const refundedPayment: PaymentRecord = {
        ...transitionPaymentStatus(payment, nextStatus),
        refundedAt: new Date().toISOString(),
        refundAmountKrw,
        refundReason: '이용자 직접 취소',
      };
      const withRefund = {
        ...updated,
        meta: { ...updated.meta, payment: refundedPayment },
      };
      await driver.saveBooking(withRefund);
      return NextResponse.json({ ok: true, booking: withRefund });
    }

    return NextResponse.json({ ok: true, booking: updated });
  } catch (e) {
    if (e instanceof ReservationError) {
      return NextResponse.json({ ok: false, code: e.code, error: e.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
