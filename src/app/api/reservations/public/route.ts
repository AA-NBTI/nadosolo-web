import { NextResponse } from 'next/server';
import { ReservationError, extractUnits } from '@/modules/reservation';
import { getReservationDriver, getReservationEngine } from '@/lib/reservation/runtime';
import { sanitizeAttribution } from '@/modules/tracking';
import { recordTrackingEvent } from '@/lib/tracking/serverStore';
import { dispatchNotification } from '@/lib/notify/serverStore';

export const dynamic = 'force-dynamic';

/**
 * 업체 공개 예약 API (사장님 인스타·블로그 링크 `/book/[resourceId]` 전용)
 * - GET: 업체 프로필 + 지정 날짜/인원의 예약 가능 시간대 동적 계산
 * - POST: 일반 이용자 직접 예약 요청 (bookWindow)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resourceId = searchParams.get('resourceId')?.trim();
  const date = searchParams.get('date')?.trim();
  const partySize = Math.max(1, Number(searchParams.get('partySize') || '2'));

  const engine = getReservationEngine();
  const driver = getReservationDriver();
  if (!engine || !driver) {
    return NextResponse.json({ ok: false, error: '예약 모듈 비활성' }, { status: 503 });
  }

  // resourceId가 없으면 공개 가능한 활성 매장 목록 반환 (/table 탐색 페이지용)
  if (!resourceId) {
    try {
      const all = await driver.listResources();
      const resources = all
        .filter((r) => r.active && r.attributes?.onboardingCompleted !== false)
        .map((r) => {
          const p = (r.attributes?.profile || {}) as Record<string, any>;
          return {
            id: r.id,
            kind: r.kind,
            name: r.name,
            address: p.address || '',
            addressDetail: p.addressDetail || '',
            phone: p.phone || '',
            guideNote: p.guideNote || '',
            coverImageUrl: p.coverImageUrl || '',
            signatureMenu: p.signatureMenu || '',
            priceRange: p.priceRange || '',
            tags: Array.isArray(p.tags) ? p.tags : [],
            capacity: r.capacity,
          };
        });
      return NextResponse.json({ ok: true, resources });
    } catch (e) {
      return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
    }
  }

  try {
    let resource = await driver.getResource(resourceId);
    if (!resource) {
      const all = await driver.listResources();
      const targetSlug = resourceId.toLowerCase();
      resource =
        all.find(
          (r) =>
            String((r.attributes?.profile as Record<string, any> | undefined)?.slug || '').toLowerCase() === targetSlug
        ) ?? null;
    }
    if (!resource || !resource.active || resource.attributes?.onboardingCompleted === false) {
      return NextResponse.json({ ok: false, error: '예약 가능한 업체를 찾을 수 없습니다.' }, { status: 404 });
    }

    const windows = date
      ? await engine.getAvailableWindows({ resourceId: resource.id, date, partySize })
      : [];

    const profile = (resource.attributes?.profile || {}) as Record<string, any>;
    const units = extractUnits(resource).filter((u) => u.active);
    const schedule = (resource.attributes?.schedule || null) as Record<string, any> | null;

    return NextResponse.json({
      ok: true,
      resource: {
        id: resource.id,
        kind: resource.kind,
        name: resource.name,
        address: profile.address || '',
        addressDetail: profile.addressDetail || '',
        phone: profile.phone || '',
        guideNote: profile.guideNote || '',
        coverImageUrl: profile.coverImageUrl || '',
        signatureMenu: profile.signatureMenu || '',
        priceRange: profile.priceRange || '',
        tags: Array.isArray(profile.tags) ? profile.tags : [],
        prepayAmountKrw: Math.max(0, Number(profile.prepayAmountKrw ?? profile.depositKrw ?? 0)),
        freeCancelHours: Math.max(0, Number(profile.freeCancelHours ?? 48)),
        units,
        schedule,
      },
      windows,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const engine = getReservationEngine();
  if (!engine) {
    return NextResponse.json({ ok: false, error: '예약 모듈 비활성' }, { status: 503 });
  }

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: '잘못된 요청' }, { status: 400 });
  }

  const resourceId = String(body.resourceId || '').trim();
  const unitId = String(body.unitId || 'default').trim();
  const startsAt = String(body.startsAt || '').trim();
  const partySize = Number(body.partySize);
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const requests = String(body.requests || '').trim();

  if (!resourceId || !startsAt || !name || !phone || !Number.isInteger(partySize) || partySize < 1) {
    return NextResponse.json({ ok: false, error: '예약자 이름, 연락처, 시간, 인원을 모두 입력해 주세요.' }, { status: 400 });
  }

  try {
    const driver = getReservationDriver();
    let canonicalResourceId = resourceId;
    let prepayAmountKrw = 0;
    if (driver) {
      let resource = await driver.getResource(resourceId);
      if (!resource) {
        const all = await driver.listResources();
        const targetSlug = resourceId.toLowerCase();
        resource =
          all.find(
            (r) =>
              String((r.attributes?.profile as Record<string, any> | undefined)?.slug || '').toLowerCase() === targetSlug
          ) ?? null;
      }
      if (resource) canonicalResourceId = resource.id;
      const blocked = Array.isArray(resource?.attributes?.blockedPhones)
        ? (resource.attributes.blockedPhones as string[])
        : [];
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits && blocked.includes(phoneDigits)) {
        return NextResponse.json(
          { ok: false, error: '매장 운영 정책상 온라인 예약이 제한된 연락처입니다.' },
          { status: 403 }
        );
      }
      const prof = (resource?.attributes?.profile || {}) as Record<string, any>;
      prepayAmountKrw = Math.max(0, Math.round(Number(prof.prepayAmountKrw ?? prof.depositKrw ?? 0)));
    }

    const startsAtText = new Date(startsAt).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const requiresPayment = prepayAmountKrw >= 1000;
    const paymentMeta = requiresPayment
      ? {
          orderId: `tb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          provider: process.env.TOSS_SECRET_KEY ? 'TOSS' : 'TEST',
          amountKrw: prepayAmountKrw,
          status: 'PENDING',
        }
      : undefined;

    const cleanAttr = sanitizeAttribution(body.attribution);
    const booking = await engine.bookWindow({
      resourceId: canonicalResourceId,
      unitId,
      startsAt,
      partySize,
      ownerRef: `GUEST:${phone}`,
      attendee: { name, phone, requests: requests || undefined },
      meta: {
        source: 'public_link',
        startsAtText,
        ...(paymentMeta ? { payment: paymentMeta } : {}),
        ...(cleanAttr ? { attribution: cleanAttr } : {}),
      },
    });

    if (!requiresPayment) {
      void recordTrackingEvent({
        service: 'TABLEBARO',
        type: 'CONVERSION',
        path: `/reserve/${canonicalResourceId}`,
        attribution: cleanAttr,
        amountKrw: 0,
        orderId: booking.id,
        resourceId: canonicalResourceId,
      });
      void dispatchNotification({
        service: 'TABLEBARO',
        template: 'BOOKING_REQUEST',
        to: phone,
        title: '예약 접수',
        body: `${name}님 ${startsAtText} ${partySize}명 예약이 접수되었습니다.`,
        linkUrl: `/reserve/my`,
      });
    }

    return NextResponse.json({ ok: true, booking, requiresPayment, prepayAmountKrw });
  } catch (e) {
    if (e instanceof ReservationError) {
      return NextResponse.json({ ok: false, code: e.code, error: e.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
