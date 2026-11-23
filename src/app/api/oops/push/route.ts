import { NextRequest, NextResponse } from 'next/server';
import {
  addOopsBacker,
  getVapidPublicKey,
  listOopsAgents,
  sendOopsPush,
  upsertOopsAgent,
} from '@/lib/oops/pushStore';

export async function GET() {
  const agents = await listOopsAgents();
  return NextResponse.json({
    ok: true,
    vapidPublicKey: getVapidPublicKey(),
    agentsCount: agents.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || '').toUpperCase();

    if (action === 'SUBSCRIBE') {
      if (!body?.subscription?.endpoint) {
        return NextResponse.json({ ok: false, error: '유효하지 않은 푸시 구독 정보입니다.' }, { status: 400 });
      }
      const agent = await upsertOopsAgent({
        subscription: body.subscription,
        alias: body.alias,
      });
      return NextResponse.json({ ok: true, agent });
    }

    if (action === 'PING') {
      const title = String(body?.title || 'OOPS! 몬스터 호출 도착').slice(0, 80);
      const msg = String(
        body?.body || '거대 플랫폼을 거치지 않고 인간이 직접 보낸 독립 알림입니다.'
      ).slice(0, 200);

      const res = await sendOopsPush({
        agentId: body.agentId ? String(body.agentId).trim() : undefined,
        subscription: body.subscription,
        title,
        body: msg,
        url: body.url ? String(body.url) : '/',
      });
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true, delivered: true });
    }

    if (action === 'BACKER_APPLY') {
      const name = String(body?.name || '').trim();
      const email = String(body?.email || '').trim();
      if (!name || !email) {
        return NextResponse.json({ ok: false, error: '성함과 이메일을 입력해 주세요.' }, { status: 400 });
      }
      const backer = await addOopsBacker({
        name,
        org: String(body?.org || ''),
        email,
        tier: String(body?.tier || 'FOUNDING_BACKER'),
        message: String(body?.message || ''),
      });
      return NextResponse.json({ ok: true, backerId: backer.id });
    }

    return NextResponse.json({ ok: false, error: '지원하지 않는 요청입니다.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : '서버 오류' },
      { status: 500 }
    );
  }
}
