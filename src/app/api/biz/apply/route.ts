import { NextResponse } from 'next/server';
import { getReservationDriver } from '@/lib/reservation/runtime';
import type { Resource } from '@/modules/reservation';
import { normalizeSlug } from '@/modules/tenancy';

export const dynamic = 'force-dynamic';

/**
 * 예약 업체 독립 입점 신청 API (affiliateDb 의존 0%, reservation_resources에 active=false로 직접 저장)
 */
export async function POST(request: Request) {
  const driver = getReservationDriver();
  if (!driver) {
    return NextResponse.json({ ok: false, error: '예약 모듈 비활성' }, { status: 503 });
  }
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: '잘못된 요청' }, { status: 400 });
  }

  const contactEmail = String(body.contactEmail || '').trim().toLowerCase();
  const pin = String(body.pin || '').trim();
  const managerName = String(body.managerName || '').trim();
  const rawHandle = String(body.handle || body.slug || '').trim();
  const cleanHandle = rawHandle ? normalizeSlug(rawHandle) : null;

  if (rawHandle && !cleanHandle) {
    return NextResponse.json(
      { ok: false, error: '핸들은 영문 소문자·숫자 2~32자만 사용할 수 있습니다. (예약어 제외)' },
      { status: 400 }
    );
  }

  if (!contactEmail || pin.length < 4) {
    return NextResponse.json(
      { ok: false, error: '이메일과 비밀번호(4자 이상)를 입력해 주세요.' },
      { status: 400 }
    );
  }

  try {
    const existing = await driver.listResources();
    const dup = existing.find(
      (r) => String(r.attributes?.contactEmail || '').trim().toLowerCase() === contactEmail
    );
    if (dup) {
      return NextResponse.json({ ok: false, error: '이미 등록된 이메일입니다.' }, { status: 409 });
    }
    if (cleanHandle) {
      const slugDup = existing.find(
        (r) => String((r.attributes?.profile as Record<string, any> | undefined)?.slug || '').toLowerCase() === cleanHandle
      );
      if (slugDup) {
        return NextResponse.json({ ok: false, error: `이미 사용 중인 핸들입니다: @${cleanHandle}` }, { status: 409 });
      }
    }

    const id = `BIZ_${Date.now().toString(36).toUpperCase()}`;
    const defaultName = managerName ? `${managerName} (업체등록 대기)` : `${contactEmail.split('@')[0]} (업체등록 대기)`;
    const resource: Resource = {
      id,
      kind: 'restaurant',
      name: defaultName,
      capacity: 12,
      active: false, // 관리자 승인 게이트: /admin 승인 후 로그인 및 노출 가능
      attributes: {
        cityCode: 'SEOUL_GANGNAM',
        budgetTier: '$$',
        maxTablesPerNight: 2,
        supportedDietary: ['NONE'],
        nadosoloApproved: false,
        onboardingCompleted: false, // 첫 로그인 시 업체 필수 정보 등록 후 true 전환
        contactEmail,
        managerName,
        pin,
        profile: {
          address: '',
          addressDetail: '',
          phone: '',
          managerName,
          managerPhone: '',
          guideNote: '',
          ...(cleanHandle ? { slug: cleanHandle } : {}),
        },
        units: [
          {
            id: 'unit-main',
            name: '메인 테이블',
            minPartySize: 1,
            maxPartySize: 6,
            quantity: 2,
            durationMinutes: 120,
            active: true,
          },
        ],
        schedule: {
          timezoneOffsetMinutes: 540,
          weekly: [0, 1, 2, 3, 4, 5, 6].map((d) => ({
            dayOfWeek: d,
            startTime: '11:00',
            endTime: '22:00',
            slotIntervalMinutes: 60,
            active: true,
          })),
          overrides: [],
        },
      },
    };
    await driver.saveResource(resource);

    return NextResponse.json({
      ok: true,
      resourceId: id,
      resource: {
        id: resource.id,
        kind: resource.kind,
        name: resource.name,
        contactEmail,
        managerName,
        onboardingCompleted: false,
        profile: resource.attributes.profile,
      },
      message: '회원가입이 완료되었습니다. 첫 로그인 후 업체 정보를 등록해 주세요.',
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
