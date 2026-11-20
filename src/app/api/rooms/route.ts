import { NextRequest, NextResponse } from 'next/server';
import { nadoSoloSupabaseService } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const theme = searchParams.get('theme') || '';
    const area = searchParams.get('area') || '전체';
    const time = searchParams.get('time') || '전체';

    // 1. Supabase 이벤트 조회
    const dbEvents = await nadoSoloSupabaseService.getEvents();

    // 2. 타임레프트 제0조 블라인드 슬롯 변환 (방 제목·식당 비공개, [도시 × 일정] 단위)
    const slotMap = new Map<string, any>();
    for (const ev of dbEvents || []) {
      if (ev.status === 'CANCELLED_MIN' || ev.status === 'COMPLETED') continue;
      const regionName = ev.regionName || '서울';
      const dateText = ev.dateText || '이번 주 금요일 19:30';
      const slotKey = `${regionName}|${dateText}`;
      if (!slotMap.has(slotKey)) {
        slotMap.set(slotKey, {
          id: ev.eventId,
          title: `${regionName} · ${dateText} 블라인드 슬롯`,
          dateText,
          area: regionName,
          regionName,
          districtName: 'D-1 19:00 공개',
          timeSlot: dateText.includes('19:30') ? '저녁 19:30' : dateText.includes('19:00') ? '저녁 19:00' : '저녁',
          priceKrw: ev.priceKrw || 30000,
          maxSeats: 6,
          currentParticipants: 0,
          remainingSeats: 6,
          status: ev.status || 'RECRUITING',
          theme: 'blind_slot',
        });
      }
    }
    let rooms = Array.from(slotMap.values());

    // 3. 만약 DB에 이벤트가 없거나 적으면 기본 열린 블라인드 슬롯 제공
    if (rooms.length === 0) {
      rooms = [
        {
          id: 'SLOT_SEOUL_FRI',
          title: '서울 · 이번 주 금요일 19:30 블라인드 슬롯',
          dateText: '이번 주 금요일 19:30',
          area: '서울',
          regionName: '서울',
          districtName: 'D-1 19:00 공개',
          timeSlot: '금요일 19:30',
          priceKrw: 30000,
          maxSeats: 6,
          currentParticipants: 0,
          remainingSeats: 6,
          status: 'RECRUITING',
          theme: 'blind_slot',
        },
        {
          id: 'SLOT_BUSAN_FRI',
          title: '부산 · 이번 주 금요일 19:30 블라인드 슬롯',
          dateText: '이번 주 금요일 19:30',
          area: '부산',
          regionName: '부산',
          districtName: 'D-1 19:00 공개',
          timeSlot: '금요일 19:30',
          priceKrw: 30000,
          maxSeats: 6,
          currentParticipants: 0,
          remainingSeats: 6,
          status: 'RECRUITING',
          theme: 'blind_slot',
        },
      ];
    }

    // 4. 필터링 (area, time, theme)
    let filtered = rooms.filter((r) => r.status === 'RECRUITING' && r.remainingSeats > 0);

    if (area && area !== '전체') {
      filtered = filtered.filter(
        (r) =>
          r.area.includes(area) ||
          r.regionName.includes(area) ||
          r.districtName.includes(area)
      );
    }

    if (time && time !== '전체') {
      filtered = filtered.filter((r) => r.timeSlot.includes(time) || r.dateText.includes(time));
    }

    // theme이 전달되었을 때, 해당 theme을 우선 정렬하되 완전 배제는 안 하거나 필요 시 필터
    if (theme) {
      filtered.sort((a, b) => (b.theme === theme ? 1 : 0) - (a.theme === theme ? 1 : 0));
    }

    return NextResponse.json({
      ok: true,
      rooms: filtered,
      totalCount: filtered.length,
    });
  } catch (error: any) {
    console.error('[API /api/rooms] error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || '방 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
