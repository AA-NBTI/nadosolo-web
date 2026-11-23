import { NextResponse } from 'next/server';
import { getReservationDriver, getReservationEngine } from '@/lib/reservation/runtime';
import {
  getDefaultPaymentAdapter,
  transitionPaymentStatus,
  type PaymentRecord,
} from '@/modules/payment';

export const dynamic = 'force-dynamic';

/**
 * 테이블바로 예약 선결제 승인 API
 * - PG 어댑터(TEST / TOSS)를 통해 결제를 승인하고 예약 meta.payment 상태를 PAID로 전이한다.
 */
export async function POST(request: Request) {
  const engine = getReservationEngine();
  const driver = getReservationDriver();
  if (!engine || !driver) {
    return NextResponse.json({ ok: false, error: '예약 모듈 비활성' }, { status: 503 });
  }

  let body: { bookingId?: string; paymentKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: '잘못된 요청' }, { status: 400 });
  }

  const bookingId = String(body.bookingId || '').trim();
  if (!bookingId) {
    return NextResponse.json({ ok: false, error: '예약 번호가 필요합니다.' }, { status: 400 });
  }

  try {
    const booking = await engine.getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ ok: false, error: '예약을 찾을 수 없습니다.' }, { status: 404 });
    }

    const payment = booking.meta?.payment as PaymentRecord | undefined;
    if (!payment || payment.amountKrw < 1000) {
      return NextResponse.json({ ok: false, error: '선결제 대상 예약이 아닙니다.' }, { status: 400 });
    }
    if (payment.status === 'PAID') {
      return NextResponse.json({ ok: true, alreadyPaid: true, booking, payment });
    }

    const adapter = getDefaultPaymentAdapter();
    const paymentKey =
      String(body.paymentKey || '').trim() ||
      (adapter.provider === 'TEST' ? `test_pk_${Date.now().toString(36)}` : '');

    const res = await adapter.confirm({
      orderId: payment.orderId,
      paymentKey,
      amountKrw: payment.amountKrw,
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error || '결제 승인 실패' }, { status: 400 });
    }

    const nextPayment: PaymentRecord = {
      ...transitionPaymentStatus(payment, 'PAID'),
      provider: res.provider,
      paymentKey: res.paymentKey,
      paidAt: new Date().toISOString(),
    };

    const updated = {
      ...booking,
      meta: { ...booking.meta, payment: nextPayment },
      updatedAt: new Date().toISOString(),
    };
    await driver.saveBooking(updated);

    return NextResponse.json({
      ok: true,
      booking: updated,
      payment: nextPayment,
      attribution: booking.meta?.attribution ?? null,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
