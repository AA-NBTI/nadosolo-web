import { NextResponse } from 'next/server';
import { parseAttribution } from '@/modules/tracking';
import { recordTrackingEvent, resolveAndHitShortLink } from '@/lib/tracking/serverStore';

export const dynamic = 'force-dynamic';

/**
 * 자체 단축 URL 리다이렉트 (`/s/[code]`)
 * - 클릭 수를 증가시키고 목적지 URL의 UTM/ref를 파싱해 해당 서비스 저장소에 VISIT을 기록한다.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const record = await resolveAndHitShortLink(code);

  const reqUrl = new URL(request.url);
  if (!record) {
    return NextResponse.redirect(new URL('/', reqUrl.origin));
  }

  const dest = record.targetUrl.startsWith('http')
    ? new URL(record.targetUrl)
    : new URL(record.targetUrl, reqUrl.origin);

  const attr = parseAttribution(dest.search);
  const resourceMatch = dest.pathname.match(/^\/reserve\/([^/]+)/);
  const resourceId = resourceMatch && resourceMatch[1] !== 'my' && resourceMatch[1] !== 'affiliate'
    ? decodeURIComponent(resourceMatch[1])
    : undefined;

  await recordTrackingEvent({
    service: record.service,
    type: 'VISIT',
    path: dest.pathname,
    attribution: attr ?? { source: 'short_link', campaign: record.code, capturedAt: new Date().toISOString() },
    resourceId,
  });

  return NextResponse.redirect(dest, 307);
}
