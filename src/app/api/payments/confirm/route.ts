import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ConfirmPaymentBody {
  paymentKey?: string;
  orderId?: string;
  amount?: number | string;
  eventId?: string;
  userId?: string;
  tickets?: number;
  promo?: string;
  tierCode?: string;
}

interface PaymentOrderRecord {
  orderId: string;
  paymentKey: string;
  amount: number;
  eventId: string;
  userId: string;
  tickets: number;
  promo?: string;
  status: 'CONFIRMED';
  mode: 'LIVE_TOSS' | 'TEST_MODE';
  confirmedAt: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConfirmPaymentBody;
    const paymentKey = String(body.paymentKey || '').trim();
    const orderId = String(body.orderId || '').trim();
    const amount = Number(body.amount);
    const eventId = String(body.eventId || '').trim();
    const userId = String(body.userId || '').trim();
    const tickets = body.tickets === 3 ? 3 : body.tickets === 2 ? 2 : 1;
    const promo = String(body.promo || '').trim().toUpperCase();
    const tierCode = String(body.tierCode || '').trim().toUpperCase();

    if (!paymentKey || !orderId || !Number.isFinite(amount) || amount < 1000) {
      return NextResponse.json(
        { ok: false, error: '유효하지 않은 결제 승인 파라미터입니다. (paymentKey/orderId/amount 누락)' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. 멱등성 확인 (이미 승인 완료된 주문번호인지 검사)
    const { data: existingCfg } = await supabase
      .from('app_configs')
      .select('value')
      .eq('key', 'payment_orders_v1')
      .single();

    const orders: PaymentOrderRecord[] = Array.isArray(existingCfg?.value)
      ? (existingCfg.value as PaymentOrderRecord[])
      : [];

    const already = orders.find((o) => o.orderId === orderId);
    if (already) {
      return NextResponse.json({
        ok: true,
        alreadyConfirmed: true,
        order: already,
      });
    }

    // 2. 토스페이먼츠 서버 승인 호출 (TOSS_SECRET_KEY 설정 시 실서버 승인, 미설정 시 테스트 키 검증)
    const secretKey = process.env.TOSS_SECRET_KEY;
    let mode: 'LIVE_TOSS' | 'TEST_MODE' = 'TEST_MODE';

    if (secretKey) {
      const encryptedKey = Buffer.from(`${secretKey}:`).toString('base64');
      const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${encryptedKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });

      const tossJson = await tossRes.json();
      if (!tossRes.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: tossJson?.message || '토스페이먼츠 결제 승인 검증에 실패했습니다.',
            code: tossJson?.code,
          },
          { status: 400 }
        );
      }
      mode = 'LIVE_TOSS';
    } else {
      // 테스트 환경 검증: paymentKey 형식 확인
      if (paymentKey.length < 8 || !orderId.startsWith('order_')) {
        return NextResponse.json(
          { ok: false, error: '테스트 결제 키 또는 주문 번호 형식이 올바르지 않습니다.' },
          { status: 400 }
        );
      }
    }

    // 3. 서버 DB에 결제 원장 기록 & 모임 신청 확정
    const newOrder: PaymentOrderRecord = {
      orderId,
      paymentKey,
      amount,
      eventId,
      userId: userId || 'GUEST',
      tickets,
      promo: promo || undefined,
      status: 'CONFIRMED',
      mode,
      confirmedAt: new Date().toISOString(),
    };

    const nextOrders = [newOrder, ...orders].slice(0, 500);
    await supabase.from('app_configs').upsert(
      {
        key: 'payment_orders_v1',
        value: nextOrders,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

    if (userId && eventId && eventId !== 'MEMBERSHIP_BARO_1Y') {
      await supabase.from('event_applications').upsert(
        {
          user_id: userId,
          event_id: eventId,
          status: 'APPLIED',
        },
        { onConflict: 'user_id,event_id' }
      );
    }

    if (userId && tierCode === 'BARO') {
      const { data: prof } = await supabase
        .from('profiles')
        .select('self_domain_scores')
        .eq('id', userId)
        .maybeSingle();
      const prevScores = (prof?.self_domain_scores || {}) as Record<string, any>;
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('profiles')
        .update({
          self_domain_scores: {
            ...prevScores,
            _tier_code: 'BARO',
            _tier_rank: 1,
            _tier_expires_at: expiresAt,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    return NextResponse.json({
      ok: true,
      alreadyConfirmed: false,
      order: newOrder,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || '결제 승인 처리 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
