import { NextRequest, NextResponse } from 'next/server';
import {
  broadcastOopsPush,
  listOopsAgents,
  listOopsBackers,
} from '@/lib/oops/pushStore';
import { OOPS_RELEASES } from '@/lib/oops/releases';
import {
  hqModerateSignal,
  listBannedAgents,
  listSignals,
} from '@/lib/oops/signalStore';
import { summarizeTracking } from '@/modules/tracking';
import { listTrackingEvents } from '@/lib/tracking/serverStore';

function isAuthorized(req: NextRequest, bodyKey?: string): boolean {
  const expected = process.env.OOPS_HQ_KEY || 'aa1111';
  const headerKey = req.headers.get('x-oops-hq-key') || '';
  const queryKey = req.nextUrl.searchParams.get('key') || '';
  const candidate = bodyKey || headerKey || queryKey;
  return candidate === expected;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: '인증 암호가 일치하지 않습니다.' }, { status: 401 });
  }

  const [agents, backers, signals, bannedAgents, trackingEvents] = await Promise.all([
    listOopsAgents(),
    listOopsBackers(),
    listSignals({ tab: 'LIVE', includeHidden: true, limit: 150 }),
    listBannedAgents(),
    listTrackingEvents('OOPS'),
  ]);

  return NextResponse.json({
    ok: true,
    latestVersion: OOPS_RELEASES[0]?.version || 'v0.4.0',
    releases: OOPS_RELEASES,
    agents: agents.map((a) => ({
      agentId: a.agentId,
      alias: a.alias,
      createdAt: a.createdAt,
      lastPingAt: a.lastPingAt || null,
    })),
    backers,
    signals,
    bannedAgents,
    trackingSummary: summarizeTracking(trackingEvents),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!isAuthorized(req, String(body?.key || ''))) {
      return NextResponse.json({ ok: false, error: '인증 암호가 일치하지 않습니다.' }, { status: 401 });
    }

    const action = String(body?.action || '').toUpperCase();
    if (action === 'BROADCAST') {
      const title = String(body?.title || 'OOPS HQ 긴급 공지').slice(0, 80);
      const msg = String(body?.body || '').trim().slice(0, 200);
      if (!msg) {
        return NextResponse.json({ ok: false, error: '공지 본문을 입력해 주세요.' }, { status: 400 });
      }
      const result = await broadcastOopsPush({ title, body: msg, url: '/' });
      return NextResponse.json({ ok: true, result });
    }

    if (action === 'MODERATE') {
      const modAction = String(body?.modAction || '').toUpperCase();
      if (!['PIN', 'UNPIN', 'HIDE', 'RESTORE', 'SHADOWBAN', 'UNBAN'].includes(modAction)) {
        return NextResponse.json({ ok: false, error: '유효하지 않은 제어 명령입니다.' }, { status: 400 });
      }
      await hqModerateSignal({
        action: modAction as any,
        signalId: body?.signalId ? String(body.signalId) : undefined,
        agentId: body?.agentId ? String(body.agentId) : undefined,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: '지원하지 않는 요청입니다.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : '서버 오류' },
      { status: 500 }
    );
  }
}
