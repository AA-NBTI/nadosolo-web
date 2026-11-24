import { NextResponse } from 'next/server';
import type { TrackingService } from '@/modules/tracking';
import { createOrGetShortLink, listShortLinks } from '@/lib/tracking/serverStore';

export const dynamic = 'force-dynamic';

const parseService = (raw: unknown): TrackingService => {
  const s = String(raw || '').toUpperCase();
  if (s === 'TABLEBARO') return 'TABLEBARO';
  if (s === 'OOPS') return 'OOPS';
  return 'NADOSOLO';
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service')
    ? parseService(searchParams.get('service'))
    : undefined;
  const links = await listShortLinks(service);
  return NextResponse.json({ ok: true, links });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: '잘못된 요청' }, { status: 400 });
  }

  const targetUrl = String(body.targetUrl || '').trim();
  if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && !targetUrl.startsWith('/'))) {
    return NextResponse.json({ ok: false, error: '유효한 대상 URL이 필요합니다.' }, { status: 400 });
  }

  const service = parseService(body.service);
  const label = typeof body.label === 'string' ? body.label : undefined;

  const record = await createOrGetShortLink({ service, targetUrl, label });
  return NextResponse.json({
    ok: true,
    record,
    shortPath: `/s/${record.code}`,
  });
}
