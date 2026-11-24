import { NextRequest, NextResponse } from 'next/server';
import {
  broadcastOopsPush,
  listOopsAgents,
  sendOopsPush,
} from '@/lib/oops/pushStore';

function verifyApiKey(req: NextRequest): boolean {
  const secret = process.env.OOPS_API_KEY || process.env.ADMIN_PASSWORD || 'oops_secret_key_2026';
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const customHeader = req.headers.get('x-oops-api-key') || '';
  return token === secret || customHeader === secret;
}

/**
 * [OOPS 범용 알림 REST API v1]
 * 외부 서비스(나도솔로, 테이블바로, 제3의 파트너사)에서 호출하는 표준 엔드포인트
 * 
 * POST /api/oops/v1/send
 * Headers:
 *   Authorization: Bearer <OOPS_API_KEY>
 * Body:
 *   - target: string ('ALL' 또는 'OP-XXXXXX' 요원 코드)
 *   - title: string (알림 제목)
 *   - body: string (알림 본문)
 *   - url?: string (클릭 시 이동할 링크)
 *   - sourceService?: string (호출 서비스 식별자: NADOSOLO, TABLEBARO, etc.)
 */
export async function POST(req: NextRequest) {
  if (!verifyApiKey(req)) {
    return NextResponse.json(
      { ok: false, error: '유효하지 않은 OOPS API 키입니다.' },
      { status: 401 }
    );
  }

  try {
    const json = await req.json();
    const target = String(json?.target || '').trim().toUpperCase();
    const title = String(json?.title || 'OOPS 알림').slice(0, 80);
    const body = String(json?.body || '').trim().slice(0, 200);
    const url = json?.url ? String(json.url) : '/';
    const sourceService = String(json?.sourceService || 'UNKNOWN').toUpperCase();

    if (!target) {
      return NextResponse.json(
        { ok: false, error: '수신 대상(target)을 지정해야 합니다. (ALL 또는 OP-XXXXXX)' },
        { status: 400 }
      );
    }

    if (!body) {
      return NextResponse.json(
        { ok: false, error: '알림 내용(body)을 입력해야 합니다.' },
        { status: 400 }
      );
    }

    // 1) 전체 브로드캐스트
    if (target === 'ALL') {
      const res = await broadcastOopsPush({ title, body, url });
      return NextResponse.json({
        ok: true,
        type: 'BROADCAST',
        sourceService,
        result: res,
        messageId: `oops_bc_${Date.now().toString(36)}`,
      });
    }

    // 2) 특정 요원 대상 발송
    const res = await sendOopsPush({
      agentId: target,
      title,
      body,
      url,
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: res.error || '푸시 발송 실패' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      type: 'UNICAST',
      target,
      sourceService,
      messageId: `oops_msg_${Date.now().toString(36)}`,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : '서버 오류' },
      { status: 500 }
    );
  }
}

/** 발송 가능한 등록 요원 수 등 통계 조회 */
export async function GET(req: NextRequest) {
  if (!verifyApiKey(req)) {
    return NextResponse.json({ ok: false, error: '인증 실패' }, { status: 401 });
  }
  const agents = await listOopsAgents();
  return NextResponse.json({
    ok: true,
    totalAgents: agents.length,
    activeAgents: agents.filter((a) => a.lastPingAt).length,
  });
}
