import { NextRequest, NextResponse } from 'next/server';
import {
  checkPostRateLimit,
  containsExternalUrl,
  createSignal,
  listSignals,
  type FeedSortTab,
  type SignalCategory,
  type SignalVoteType,
  verifyPowChallenge,
  voteSignal,
} from '@/lib/oops/signalStore';

const VALID_CATEGORIES = new Set<SignalCategory>(['GLITCH', 'REBEL', 'HALLUCINATION', 'ALERT']);

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const rawTab = (sp.get('tab') || 'HOT').toUpperCase();
  const tab: FeedSortTab = rawTab === 'LIVE' || rawTab === 'TOP' ? rawTab : 'HOT';
  const viewerAgentId = (sp.get('agentId') || '').trim().slice(0, 32);

  const signals = await listSignals({ tab, viewerAgentId, limit: 60 });

  return NextResponse.json(
    { ok: true, tab, signals },
    {
      headers: {
        // 바이럴 트래픽 폭증 시 DB 보호용 Edge 캐싱
        'Cache-Control': viewerAgentId
          ? 'private, max-age=5'
          : 'public, s-maxage=10, stale-while-revalidate=20',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authorAgentId = String(body?.authorAgentId || '').trim().slice(0, 32);
    const authorCallsign = String(body?.authorCallsign || '').trim().slice(0, 24);
    const rawCat = String(body?.category || 'GLITCH').toUpperCase() as SignalCategory;
    const category: SignalCategory = VALID_CATEGORIES.has(rawCat) ? rawCat : 'GLITCH';
    const content = String(body?.content || '').trim();
    const powChallenge = String(body?.powChallenge || '');
    const powNonce = String(body?.powNonce || '');

    if (!authorAgentId) {
      return NextResponse.json({ ok: false, error: 'Missing device agent signature.' }, { status: 400 });
    }
    if (content.length < 3 || content.length > 200) {
      return NextResponse.json(
        { ok: false, error: 'Signal must be between 3 and 200 characters.' },
        { status: 400 }
      );
    }

    // 1. 경량 PoW 봇 방어 검증
    if (!verifyPowChallenge(powChallenge, powNonce)) {
      return NextResponse.json({ ok: false, error: 'Security verification failed. Please retry.' }, { status: 403 });
    }

    // 2. 외부 홍보/피싱 링크 원천 차단
    if (containsExternalUrl(content)) {
      return NextResponse.json(
        { ok: false, error: 'External URLs and promotional links are blocked by HQ protocol.' },
        { status: 400 }
      );
    }

    // 3. 연속 도배 속도 제한 (단말 + IP 기준 20초 쿨다운)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkPostRateLimit(`post:${authorAgentId}`, 20_000) || !checkPostRateLimit(`ip:${ip}`, 10_000)) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit active. Wait a moment before dispatching again.' },
        { status: 429 }
      );
    }

    const signal = await createSignal({
      authorAgentId,
      authorCallsign: authorCallsign || authorAgentId,
      category,
      content,
    });

    return NextResponse.json({ ok: true, signal });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const signalId = String(body?.signalId || '').trim();
    const agentId = String(body?.agentId || '').trim().slice(0, 32);
    const rawVote = String(body?.voteType || 'UP').toUpperCase();
    const voteType: SignalVoteType =
      rawVote === 'SKULL' || rawVote === 'FIRE' || rawVote === 'REPORT' ? rawVote : 'UP';

    if (!signalId || !agentId) {
      return NextResponse.json({ ok: false, error: 'Missing signalId or agentId.' }, { status: 400 });
    }

    const res = await voteSignal({ signalId, agentId, voteType });
    if (res.duplicate) {
      return NextResponse.json({ ok: false, duplicate: true, error: 'Already recorded.' }, { status: 409 });
    }
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: 'Vote failed.' }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      count: res.count,
      autoHidden: res.autoHidden,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
