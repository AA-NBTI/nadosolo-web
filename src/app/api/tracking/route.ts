import { NextResponse } from 'next/server';
import { summarizeTracking, type TrackingService } from '@/modules/tracking';
import {
  listShortLinks,
  listTrackingEvents,
  recordTrackingEvent,
} from '@/lib/tracking/serverStore';

export const dynamic = 'force-dynamic';

const parseService = (raw: string | null | undefined): TrackingService =>
  String(raw || '').toUpperCase() === 'TABLEBARO' ? 'TABLEBARO' : 'NADOSOLO';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const service = parseService(searchParams.get('service'));
  const resourceId = searchParams.get('resourceId')?.trim() || undefined;

  const [events, shortLinks] = await Promise.all([
    listTrackingEvents(service, resourceId),
    listShortLinks(service),
  ]);

  return NextResponse.json({
    ok: true,
    service,
    summary: summarizeTracking(events),
    events: events.slice(0, 100),
    shortLinks: shortLinks.slice(0, 100),
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: '잘못된 요청' }, { status: 400 });
  }

  const service = parseService(body.service as string | undefined);
  const type = body.type === 'CONVERSION' ? 'CONVERSION' : 'VISIT';
  const path = String(body.path || '/').trim() || '/';

  const event = await recordTrackingEvent({
    service,
    type,
    path,
    attribution: body.attribution,
    amountKrw: typeof body.amountKrw === 'number' ? body.amountKrw : undefined,
    orderId: typeof body.orderId === 'string' ? body.orderId : undefined,
    resourceId: typeof body.resourceId === 'string' ? body.resourceId : undefined,
  });

  return NextResponse.json({ ok: true, event });
}
