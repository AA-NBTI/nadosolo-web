import { NextResponse } from 'next/server';
import { getReservationDriver, getReservationEngine } from '@/lib/reservation/runtime';
import {
  computeVenuePayoutSummary,
  getVenuePayoutMetaMap,
  listVenuePayouts,
  saveVenuePayoutMetaMap,
  saveVenuePayouts,
  type VenuePayoutRecord,
} from '@/lib/reservation/payouts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resourceId = searchParams.get('resourceId')?.trim();

  const engine = getReservationEngine();
  const driver = getReservationDriver();
  if (!engine || !driver) {
    return NextResponse.json({ ok: false, error: '예약 모듈 비활성' }, { status: 503 });
  }

  const [resources, bookings, payouts, metaMap] = await Promise.all([
    driver.listResources(),
    engine.listBookings(),
    listVenuePayouts(),
    getVenuePayoutMetaMap(),
  ]);

  if (resourceId) {
    const res = resources.find((r) => r.id === resourceId);
    const summary = computeVenuePayoutSummary(
      resourceId,
      res?.name || resourceId,
      bookings,
      payouts,
      metaMap[resourceId]
    );
    return NextResponse.json({
      ok: true,
      summary,
      payouts: payouts.filter((p) => p.resourceId === resourceId),
    });
  }

  const summaries = resources.map((r) =>
    computeVenuePayoutSummary(r.id, r.name, bookings, payouts, metaMap[r.id])
  );
  return NextResponse.json({ ok: true, summaries, payouts });
}

export async function POST(request: Request) {
  let body: {
    action?: 'SAVE_BANK' | 'REQUEST' | 'PAYOUT';
    resourceId?: string;
    resourceName?: string;
    bankInfo?: string;
    amountKrw?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: '잘못된 요청' }, { status: 400 });
  }

  const resourceId = String(body.resourceId || '').trim();
  if (!resourceId) {
    return NextResponse.json({ ok: false, error: '매장 ID 필요' }, { status: 400 });
  }

  const metaMap = await getVenuePayoutMetaMap();
  const curMeta = metaMap[resourceId] ?? { bankInfo: '' };

  if (body.action === 'SAVE_BANK' || body.action === 'REQUEST') {
    const bankInfo = String(body.bankInfo ?? curMeta.bankInfo ?? '').trim();
    if (body.action === 'REQUEST' && !bankInfo) {
      return NextResponse.json({ ok: false, error: '정산 계좌를 입력해 주세요.' }, { status: 400 });
    }
    const nextMeta = {
      ...curMeta,
      bankInfo,
      ...(body.action === 'REQUEST' ? { requestedAt: new Date().toISOString() } : {}),
    };
    await saveVenuePayoutMetaMap({ ...metaMap, [resourceId]: nextMeta });
    return NextResponse.json({ ok: true, meta: nextMeta });
  }

  if (body.action === 'PAYOUT') {
    const amountKrw = Math.round(Number(body.amountKrw || 0));
    if (amountKrw <= 0) {
      return NextResponse.json({ ok: false, error: '지급 금액이 0원보다 커야 합니다.' }, { status: 400 });
    }
    const payouts = await listVenuePayouts();
    const record: VenuePayoutRecord = {
      id: `vpay_${Date.now().toString(36)}`,
      resourceId,
      resourceName: String(body.resourceName || resourceId),
      amountKrw,
      bankInfo: curMeta.bankInfo || '계좌 미등록',
      paidAt: new Date().toISOString(),
    };
    await saveVenuePayouts([record, ...payouts]);
    if (curMeta.requestedAt) {
      const nextMeta = { ...curMeta };
      delete nextMeta.requestedAt;
      await saveVenuePayoutMetaMap({ ...metaMap, [resourceId]: nextMeta });
    }
    return NextResponse.json({ ok: true, record });
  }

  return NextResponse.json({ ok: false, error: '지원하지 않는 action' }, { status: 400 });
}
