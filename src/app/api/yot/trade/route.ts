import { NextResponse } from 'next/server';
import { registerYotTrade } from '@/lib/yot/yotService';
import { YotTradePayload } from '@/lib/yot/yotTypes';

export async function POST(request: Request) {
  try {
    const body: YotTradePayload = await request.json();

    if (!body.venue || !body.venue.place_name) {
      return NextResponse.json(
        { error: '식당 정보가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    if (!body.user_email || !body.user_email.includes('@')) {
      return NextResponse.json(
        { error: '쿠폰 및 안내를 수령할 올바른 이메일 주소를 입력하십시오.' },
        { status: 400 }
      );
    }

    const result = await registerYotTrade(body);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[YotTradeAPI] Error:', err);
    return NextResponse.json(
      { error: err.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
