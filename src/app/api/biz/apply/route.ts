import { NextResponse } from 'next/server';
import { getNadoSoloReservationDriver } from '@/lib/reservation/nadosolo';
import type { Resource } from '@/modules/reservation';

export const dynamic = 'force-dynamic';

/**
 * 예약 업체 독립 입점 신청 API (affiliateDb 의존 0%, reservation_resources에 active=false로 직접 저장)
 */
export async function POST(request: Request) {
  const driver = getNadoSoloReservationDriver();
  if (!driver) {
    return NextResponse.json({ ok: false, error: '예약 모듈 비활성' }, { status: 503 });
  }
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: '잘못된 요청' }, { status: 400 });
  }

  const name = String(body.name || '').trim();
  const kind = String(body.kind || 'restaurant').trim();
  const contactEmail = String(body.contactEmail || '').trim().toLowerCase();
  const pin = String(body.pin || '').trim();
  const address = String(body.address || '').trim();
  const phone = String(body.phone || '').trim();
  const guideNote = String(body.guideNote || '').trim();
  const cityCode = String(body.cityCode || 'SEOUL_GANGNAM').trim();
  const budgetTier = String(body.budgetTier || '$$').trim();
  const quantity = Math.max(1, Number(body.quantity) || 2);
  const partyCap = Math.max(1, Number(body.partyCap) || 6);

  if (!name || !contactEmail || pin.length < 4 || !address || !phone) {
    return NextResponse.json(
      { ok: false, error: '업체명, 이메일, 비밀번호(4자 이상), 주소, 전화번호를 모두 입력해 주세요.' },
      { status: 400 }
    );
  }

  try {
    const existing = await driver.listResources();
    const dup = existing.find(
      (r) => String(r.attributes?.contactEmail || '').trim().toLowerCase() === contactEmail
    );
    if (dup) {
      return NextResponse.json({ ok: false, error: '이미 등록된 담당자 이메일입니다.' }, { status: 409 });
    }

    const id = `BIZ_${Date.now().toString(36).toUpperCase()}`;
    const resource: Resource = {
      id,
      kind,
      name,
      capacity: quantity * partyCap,
      active: true, // 가입 즉시 무료 예약 포털(/biz) & 공개 예약 링크(/book) 개통
      attributes: {
        cityCode,
        budgetTier,
        maxTablesPerNight: quantity,
        supportedDietary: Array.isArray(body.supportedDietary) ? body.supportedDietary : ['NONE'],
        nadosoloApproved: false, // 나도솔로 공식 6인 송객만 관리자 승인 분리
        contactEmail,
        pin,
        profile: {
          address,
          addressDetail: String(body.addressDetail || '').trim(),
          phone,
          managerPhone: phone,
          guideNote,
        },
        units: [
          {
            id: 'unit-main',
            name: String(body.unitName || (kind === 'restaurant' ? '6인 프라이빗 테이블' : '기본 예약 단위')),
            minPartySize: 1,
            maxPartySize: partyCap,
            quantity,
            durationMinutes: Math.max(30, Number(body.durationMinutes) || 120),
            active: true,
          },
        ],
        schedule: {
          timezoneOffsetMinutes: 540,
          weekly: [3, 5, 6].map((d) => ({
            dayOfWeek: d,
            startTime: '17:30',
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
        profile: resource.attributes.profile,
      },
      message: '등록이 완료되었습니다.',
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
