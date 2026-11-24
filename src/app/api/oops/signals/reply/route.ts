import { NextRequest, NextResponse } from 'next/server';
import {
  checkPostRateLimit,
  containsExternalUrl,
  createReply,
  listReplies,
  verifyPowChallenge,
} from '@/lib/oops/signalStore';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const signalId = (sp.get('signalId') || '').trim();
  const viewerAgentId = (sp.get('agentId') || '').trim().slice(0, 32);

  if (!signalId) {
    return NextResponse.json({ ok: false, error: 'Missing signalId' }, { status: 400 });
  }

  const replies = await listReplies(signalId, viewerAgentId);
  return NextResponse.json({ ok: true, replies });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signalId = String(body?.signalId || '').trim();
    const authorAgentId = String(body?.authorAgentId || '').trim().slice(0, 32);
    const authorCallsign = String(body?.authorCallsign || '').trim().slice(0, 24);
    const content = String(body?.content || '').trim();
    const powChallenge = String(body?.powChallenge || '');
    const powNonce = String(body?.powNonce || '');

    if (!signalId || !authorAgentId) {
      return NextResponse.json({ ok: false, error: 'Missing required fields.' }, { status: 400 });
    }
    if (content.length < 2 || content.length > 100) {
      return NextResponse.json(
        { ok: false, error: 'Reply must be between 2 and 100 characters.' },
        { status: 400 }
      );
    }
    if (!verifyPowChallenge(powChallenge, powNonce)) {
      return NextResponse.json({ ok: false, error: 'Security verification failed.' }, { status: 403 });
    }
    if (containsExternalUrl(content)) {
      return NextResponse.json(
        { ok: false, error: 'External URLs are blocked.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkPostRateLimit(`reply:${authorAgentId}`, 10_000) || !checkPostRateLimit(`ip_r:${ip}`, 5_000)) {
      return NextResponse.json({ ok: false, error: 'Wait a few seconds before replying again.' }, { status: 429 });
    }

    const reply = await createReply({
      signalId,
      authorAgentId,
      authorCallsign: authorCallsign || authorAgentId,
      content,
    });

    return NextResponse.json({ ok: true, reply });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
