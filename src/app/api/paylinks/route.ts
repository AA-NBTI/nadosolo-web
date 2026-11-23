import { NextResponse } from 'next/server';
import { createPayLinkRecord, markPayLinkPaid, type PayLinkService } from '@/modules/paylink';
import { getDefaultPaymentAdapter } from '@/modules/payment';
import { getPayLink, listPayLinks, upsertPayLink } from '@/lib/paylink/serverStore';
import { dispatchNotification } from '@/lib/notify/serverStore';
import { recordTrackingEvent } from '@/lib/tracking/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')?.trim();
  const resourceId = searchParams.get('resourceId')?.trim();

  if (id) {
    const link = await getPayLink(id);
    if (!link) {
      return NextResponse.json({ ok: false, error: '결제 링크를 찾을 수 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, link });
  }

  const links = await listPayLinks(resourceId || undefined);
  return NextResponse.json({ ok: true, links: links.slice(0, 100) });
}

export async function POST(request: Request) {
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: '잘못된 요청' }, { status: 400 });
  }

  const action = String(body.action || 'CREATE').toUpperCase();

  if (action === 'CREATE') {
    try {
      const service: PayLinkService =
        String(body.service || '').toUpperCase() === 'NADOSOLO' ? 'NADOSOLO' : 'TABLEBARO';
      const record = createPayLinkRecord({
        service,
        resourceId: String(body.resourceId || ''),
        resourceName: String(body.resourceName || body.resourceId || ''),
        customerName: String(body.customerName || ''),
        customerPhone: String(body.customerPhone || ''),
        amountKrw: Number(body.amountKrw || 0),
        memo: typeof body.memo === 'string' ? body.memo : undefined,
      });
      await upsertPayLink(record);

      const reqUrl = new URL(request.url);
      const payUrl = `${reqUrl.origin}/pay/${record.id}`;
      void dispatchNotification({
        service,
        template: 'BOOKING_REQUEST',
        to: record.customerPhone,
        title: `${record.resourceName} 결제 안내`,
        body: `${record.customerName}님 ${record.amountKrw.toLocaleString('ko-KR')}원 결제 링크입니다.${record.memo ? ` (${record.memo})` : ''}`,
        linkUrl: payUrl,
      });

      return NextResponse.json({ ok: true, link: record, payPath: `/pay/${record.id}`, payUrl });
    } catch (e) {
      return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
    }
  }

  if (action === 'PAY') {
    const id = String(body.id || '').trim();
    const record = await getPayLink(id);
    if (!record) {
      return NextResponse.json({ ok: false, error: '결제 링크를 찾을 수 없습니다.' }, { status: 404 });
    }
    if (record.status === 'PAID') {
      return NextResponse.json({ ok: true, alreadyPaid: true, link: record });
    }

    const adapter = getDefaultPaymentAdapter();
    const paymentKey =
      String(body.paymentKey || '').trim() ||
      (adapter.provider === 'TEST' ? `test_pl_${Date.now().toString(36)}` : '');

    const res = await adapter.confirm({
      orderId: record.orderId,
      paymentKey,
      amountKrw: record.amountKrw,
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error || '결제 승인 실패' }, { status: 400 });
    }

    const paid = markPayLinkPaid(record, res.paymentKey || '');
    await upsertPayLink(paid);

    void recordTrackingEvent({
      service: paid.service,
      type: 'CONVERSION',
      path: `/pay/${paid.id}`,
      attribution: { source: 'paylink', medium: 'sms', campaign: paid.resourceId, capturedAt: paid.paidAt! },
      amountKrw: paid.amountKrw,
      orderId: paid.orderId,
      resourceId: paid.resourceId,
    });

    void dispatchNotification({
      service: paid.service,
      template: 'BOOKING_CONFIRMED',
      to: paid.customerPhone,
      title: `${paid.resourceName} 결제 완료`,
      body: `${paid.customerName}님 ${paid.amountKrw.toLocaleString('ko-KR')}원 결제가 확정되었습니다.`,
      linkUrl: `/pay/${paid.id}`,
    });

    return NextResponse.json({ ok: true, link: paid });
  }

  return NextResponse.json({ ok: false, error: '지원하지 않는 action' }, { status: 400 });
}
