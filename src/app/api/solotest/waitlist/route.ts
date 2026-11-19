import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, contact, contactType, area, timeSlot, consentAt } = body;

    if (!contact || !contact.trim()) {
      return NextResponse.json(
        { ok: false, message: '연락처를 입력해 주세요.' },
        { status: 400 }
      );
    }

    if (!consentAt) {
      return NextResponse.json(
        { ok: false, message: '알림 수신 동의가 필요합니다.' },
        { status: 400 }
      );
    }

    const waitlistEntry = {
      id: `wl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sessionId: sessionId || null,
      contact: contact.trim(),
      contactType: contactType || 'PHONE',
      area: area || '전체',
      timeSlot: timeSlot || '전체',
      consentAt: consentAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // 서버 로그 및 메모리 기록 (추후 Supabase waitlist 테이블 직결)
    console.log('[SoloTest Waitlist Submitted]', waitlistEntry);

    return NextResponse.json({
      ok: true,
      message: '대기 신청이 정상 접수되었습니다. 첫 모임이 열리면 연락드리겠습니다.',
      data: waitlistEntry,
    });
  } catch (error: any) {
    console.error('[API /api/solotest/waitlist] error:', error);
    return NextResponse.json(
      { ok: false, message: '처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
