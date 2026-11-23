import { NextResponse } from 'next/server';
import { getReservationDriver } from '@/lib/reservation/runtime';

export const dynamic = 'force-dynamic';

/**
 * 예약 업체 전용 포털 로그인 인증 API (reservation_resources 직접 조회, affiliateDb 의존 0%)
 * - identifier: 업체 ID (예: RES_...) 또는 등록된 담당자 이메일
 * - pin: 4자 이상 비밀번호 PIN
 */
export async function POST(request: Request) {
  const driver = getReservationDriver();
  if (!driver) {
    return NextResponse.json({ ok: false, error: '예약 모듈 비활성' }, { status: 503 });
  }
  let body: { identifier?: string; pin?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: '잘못된 요청' }, { status: 400 });
  }

  const identifier = String(body.identifier || '').trim().toLowerCase();
  const pin = String(body.pin || '').trim();
  if (!identifier || !pin) {
    return NextResponse.json({ ok: false, error: '업체 ID(또는 이메일)와 비밀번호를 입력해 주세요.' }, { status: 400 });
  }

  try {
    const resources = await driver.listResources();
    const matched = resources.find((r) => {
      const email = String(r.attributes?.contactEmail || '').trim().toLowerCase();
      return r.id.toLowerCase() === identifier || (email && email === identifier);
    });

    if (!matched) {
      return NextResponse.json({ ok: false, error: '등록된 업체를 찾을 수 없습니다.' }, { status: 401 });
    }
    const savedPin = String(matched.attributes?.pin || '');
    if (!savedPin || savedPin !== pin) {
      return NextResponse.json({ ok: false, error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }
    if (!matched.active) {
      return NextResponse.json({ ok: false, error: '관리자 승인 대기 중인 계정입니다.' }, { status: 403 });
    }

    const profile = (matched.attributes?.profile as Record<string, any>) || {};
    const explicitFlag = matched.attributes?.onboardingCompleted;
    const onboardingCompleted =
      typeof explicitFlag === 'boolean'
        ? explicitFlag
        : Boolean(matched.name && profile.address && profile.phone);

    return NextResponse.json({
      ok: true,
      resource: {
        id: matched.id,
        kind: matched.kind,
        name: matched.name,
        capacity: matched.capacity,
        active: matched.active,
        onboardingCompleted,
        managerName: String(matched.attributes?.managerName || profile.managerName || ''),
        profile,
        contactEmail: matched.attributes?.contactEmail || '',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
