import { NextResponse } from 'next/server';
import { ReservationError, extractUnits } from '@/modules/reservation';
import { getNadoSoloReservationDriver, getNadoSoloReservationEngine } from '@/lib/reservation/nadosolo';

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

  const engine = getNadoSoloReservationEngine();
  const driver = getNadoSoloReservationDriver();
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
    const resource = await driver.getResource(resourceId);
    if (!resource || !resource.active || resource.attributes?.onboardingCompleted === false) {
      return NextResponse.json({ ok: false, error: '예약 가능한 업체를 찾을 수 없습니다.' }, { status: 404 });
    }

    const windows = date
      ? await engine.getAvailableWindows({ resourceId, date, partySize })
      : [];

    const profile = (resource.attributes?.profile || {}) as Record<string, any>;
    const units = extractUnits(resource).filter((u) => u.active);

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
        units,
      },
      windows,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const engine = getNadoSoloReservationEngine();
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
    const driver = getNadoSoloReservationDriver();
    if (driver) {
      const resource = await driver.getResource(resourceId);
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

    const booking = await engine.bookWindow({
      resourceId,
      unitId,
      startsAt,
      partySize,
      ownerRef: `GUEST:${phone}`,
      attendee: { name, phone, requests: requests || undefined },
      meta: { source: 'public_link', startsAtText },
    });

    return NextResponse.json({ ok: true, booking });
  } catch (e) {
    if (e instanceof ReservationError) {
      return NextResponse.json({ ok: false, code: e.code, error: e.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
