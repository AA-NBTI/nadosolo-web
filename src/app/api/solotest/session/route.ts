import { NextRequest, NextResponse } from 'next/server';
import { SOLOTEST_VERSION } from '@/lib/solotest/data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, answers, result, utm, eventName } = body;

    const sessionRecord = {
      id: sessionId || `solo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      version: SOLOTEST_VERSION,
      answers: answers || {},
      result: result || {},
      utm: utm || {},
      eventName: eventName || 'test_complete',
    };

    console.log('[SoloTest Session Event]', sessionRecord);

    return NextResponse.json({
      ok: true,
      sessionId: sessionRecord.id,
    });
  } catch (error: any) {
    console.error('[API /api/solotest/session] error:', error);
    return NextResponse.json(
      { ok: false, message: '세션 저장 오류' },
      { status: 500 }
    );
  }
}
