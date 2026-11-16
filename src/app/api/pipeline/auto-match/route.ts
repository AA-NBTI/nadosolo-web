import { NextResponse } from 'next/server';
import { AutoMatchRequestBody, runPipelineOnServer } from '@/lib/pipeline/serverRunner';

export async function GET() {
  try {
    const result = await runPipelineOnServer({ mode: 'DRY_RUN' });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || '파이프라인 상태 조회 실패' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as AutoMatchRequestBody;
    const result = await runPipelineOnServer(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || '자동 파이프라인 실행 실패' },
      { status: 500 }
    );
  }
}
