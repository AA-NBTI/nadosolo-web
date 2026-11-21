import { NextResponse } from 'next/server';
import { getYotVenueRanking } from '@/lib/yot/yotService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const ranking = await getYotVenueRanking(limit);
    return NextResponse.json({ ranking });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '랭킹 조회 실패' }, { status: 500 });
  }
}
