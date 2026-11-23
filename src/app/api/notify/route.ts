import { NextResponse } from 'next/server';
import type { NotifyService } from '@/modules/notify';
import { listNotifyLogs } from '@/lib/notify/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const service: NotifyService =
    String(searchParams.get('service') || '').toUpperCase() === 'NADOSOLO'
      ? 'NADOSOLO'
      : 'TABLEBARO';

  const logs = await listNotifyLogs(service);
  return NextResponse.json({ ok: true, service, logs: logs.slice(0, 100) });
}
