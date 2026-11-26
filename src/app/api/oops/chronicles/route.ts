import { NextRequest, NextResponse } from 'next/server';
import {
  loadChroniclesState,
  recordDailyChronicleVote,
  addDailyIncident,
  generateCitation,
  queryChronicles,
} from '@/lib/oops/chronicleStore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = (searchParams.get('period') || 'DAILY').toUpperCase() as 'DAILY' | 'MONTHLY' | 'YEARLY';
  const year = searchParams.get('year') || undefined;
  const month = searchParams.get('month') || undefined;
  const targetDate = searchParams.get('date');

  const state = await loadChroniclesState();

  if (targetDate && state.entries[targetDate]) {
    const entry = state.entries[targetDate];
    return NextResponse.json({
      ok: true,
      entry,
      citation: generateCitation(entry),
    });
  }

  const list = await queryChronicles({ period, year, month });

  return NextResponse.json(
    {
      ok: true,
      establishedDate: state.establishedDate,
      totalDays: list.length,
      chronicles: list.map((e) => ({
        ...e,
        citation: generateCitation(e),
      })),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action || '').toUpperCase();

    if (action === 'DAILY_VOTE') {
      const choice = String(body?.choice || 'YES').toUpperCase();
      if (choice !== 'YES' && choice !== 'NO' && choice !== 'NEUTRAL') {
        return NextResponse.json({ ok: false, error: '유효하지 않은 선택지입니다.' }, { status: 400 });
      }
      const dateStr = body?.date ? String(body.date) : undefined;
      const updatedEntry = await recordDailyChronicleVote(choice as any, dateStr);

      return NextResponse.json({
        ok: true,
        action: 'DAILY_VOTE',
        entry: updatedEntry,
      });
    }

    if (action === 'REPORT_INCIDENT') {
      const title = String(body?.title || '').trim().slice(0, 100);
      const description = String(body?.description || '').trim().slice(0, 500);
      const category = String(body?.category || '오작동');
      const reporterCallsign = String(body?.reporterCallsign || '익명_요원').trim().slice(0, 30);
      const sourceUrl = body?.sourceUrl ? String(body.sourceUrl).trim().slice(0, 200) : undefined;

      if (!title || !description) {
        return NextResponse.json({ ok: false, error: '제목과 내용을 입력해 주세요.' }, { status: 400 });
      }

      const incident = await addDailyIncident(
        {
          title,
          description,
          category: category as any,
          reporterCallsign,
          sourceUrl,
        },
        body?.date ? String(body.date) : undefined
      );

      return NextResponse.json({
        ok: true,
        action: 'REPORT_INCIDENT',
        incident,
      });
    }

    return NextResponse.json({ ok: false, error: '알 수 없는 요청입니다.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || '서버 오류' }, { status: 500 });
  }
}
