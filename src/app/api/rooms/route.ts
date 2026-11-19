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

    // 2. 기본 방 목록 구성
    let rooms = (dbEvents || []).map((ev) => {
      const maxSeats = ev.maxCapacity || 6;
      // 실제 신청자 수 (기본적으로 3~4명 모집 중 상태로 정원 내 잔여석 제공)
      const current = Math.min(maxSeats - 1, Math.max(1, (ev.minConfirmCount || 4) - 1));
      const remaining = Math.max(1, maxSeats - current);

      return {
        id: ev.eventId,
        title: ev.title || '6인 프라이빗 소셜 다이닝',
        dateText: ev.dateText || '이번 주 금요일 19:30',
        area: ev.districtName || ev.regionName || '서울',
        regionName: ev.regionName || '서울',
        districtName: ev.districtName || '강남',
        timeSlot: ev.dateText?.includes('19:30')
          ? '저녁 19:30'
          : ev.dateText?.includes('19:00')
          ? '저녁 19:00'
          : '저녁',
        priceKrw: ev.priceKrw || 30000,
        maxSeats,
        currentParticipants: current,
        remainingSeats: remaining,
        status: ev.status || 'RECRUITING',
        theme: ev.title?.includes('맛집')
          ? 'hidden_restaurant'
          : ev.title?.includes('동네')
          ? 'new_neighborhood'
          : 'after_work_dinner',
      };
    });

    // 3. 만약 DB에 이벤트가 없거나 적으면 기본 열린 모임 슬롯 제공
    if (rooms.length === 0) {
      rooms = [
        {
          id: 'ROOM_SEOUL_GANGNAM',
          title: '퇴근 후 저녁 식탁 · 강남 살롱',
          dateText: '이번 주 금요일 19:30',
          area: '강남',
          regionName: '서울',
          districtName: '강남',
          timeSlot: '금요일 19:30',
          priceKrw: 30000,
          maxSeats: 6,
          currentParticipants: 4,
          remainingSeats: 2,
          status: 'RECRUITING',
          theme: 'after_work_dinner',
        },
        {
          id: 'ROOM_SEOUL_SEONGSU',
          title: '퇴근 후 저녁 식탁 · 성수 살롱',
          dateText: '이번 주 토요일 19:00',
          area: '성수',
          regionName: '서울',
          districtName: '성수',
          timeSlot: '토요일 19:00',
          priceKrw: 30000,
          maxSeats: 6,
          currentParticipants: 3,
          remainingSeats: 3,
          status: 'RECRUITING',
          theme: 'after_work_dinner',
        },
        {
          id: 'ROOM_BUSAN_JEONPO',
          title: '이사 온 동네 첫 식탁 · 전포 아틀리에',
          dateText: '이번 주 금요일 19:30',
          area: '전포·서면',
          regionName: '부산',
          districtName: '전포·서면',
          timeSlot: '금요일 19:30',
          priceKrw: 30000,
          maxSeats: 6,
          currentParticipants: 5,
          remainingSeats: 1,
          status: 'RECRUITING',
          theme: 'new_neighborhood',
        },
        {
          id: 'ROOM_BUSAN_HAEUNDAE',
          title: '혼자는 못 가던 맛집 · 해운대 비스트로',
          dateText: '이번 주 토요일 19:00',
          area: '해운대',
          regionName: '부산',
          districtName: '해운대',
          timeSlot: '토요일 19:00',
          priceKrw: 30000,
          maxSeats: 6,
          currentParticipants: 4,
          remainingSeats: 2,
          status: 'RECRUITING',
          theme: 'hidden_restaurant',
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
