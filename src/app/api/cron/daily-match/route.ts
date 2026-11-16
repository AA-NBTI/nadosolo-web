import { NextResponse } from 'next/server';
import { runPipelineOnServer } from '@/lib/pipeline/serverRunner';

/**
 * Vercel Cron (무료 Hobby 플랜 호환: 하루 1회 매일 KST 18:00 / UTC 09:00 실행)
 * - CRON_SECRET 환경변수가 설정되어 있으면 Bearer 토큰을 검증합니다.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await runPipelineOnServer({
      mode: 'EXECUTE',
      requirePaid: true,
      coreCount: 4,
    });
    return NextResponse.json({
      cron: 'daily-match',
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, cron: 'daily-match', error: err?.message || 'Cron 실행 실패' },
      { status: 500 }
    );
  }
}
