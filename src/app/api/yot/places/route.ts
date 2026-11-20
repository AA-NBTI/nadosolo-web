import { NextResponse } from 'next/server';
import { YotVenueItem } from '@/lib/yot/yotTypes';

// 기본 로컬 맛집 프리셋 (카카오 API 키가 설정되지 않았거나 오프라인일 때 즉각 추천)
const FALLBACK_PLACES: YotVenueItem[] = [
  {
    provider_place_id: 'kakao_jeonpo_baohaus',
    place_name: '바오하우스',
    category_name: '음식점 > 아시아음식 > 대만음식',
    address_name: '부산 부산진구 서전로38번길 62-9',
    road_address_name: '부산 부산진구 서전로38번길 62-9',
    region_city: '부산',
    region_gu: '부산진구',
    region_dong: '전포동',
    lat: 35.1554,
    lng: 129.0621,
  },
  {
    provider_place_id: 'kakao_haeundae_amso',
    place_name: '해운대암소갈비집',
    category_name: '음식점 > 한식 > 육류,고기',
    address_name: '부산 해운대구 중동2로10번길 325',
    road_address_name: '부산 해운대구 중동2로10번길 325',
    region_city: '부산',
    region_gu: '해운대구',
    region_dong: '중동',
    lat: 35.1638,
    lng: 129.1636,
  },
  {
    provider_place_id: 'kakao_gwangan_millac',
    place_name: '밀락더마켓 타파스바',
    category_name: '음식점 > 술집 > 와인바',
    address_name: '부산 수영구 민락수변로17번길 56',
    road_address_name: '부산 수영구 민락수변로17번길 56',
    region_city: '부산',
    region_gu: '수영구',
    region_dong: '민락동',
    lat: 35.1542,
    lng: 129.1245,
  },
  {
    provider_place_id: 'kakao_seomyeon_samgwang',
    place_name: '삼광보리밥',
    category_name: '음식점 > 한식 > 찌개,전골',
    address_name: '부산 부산진구 가야대로784번길 56-4',
    region_city: '부산',
    region_gu: '부산진구',
    region_dong: '부전동',
    lat: 35.1578,
    lng: 129.0589,
  },
  {
    provider_place_id: 'kakao_gangnam_cheongdam',
    place_name: '새벽집 청담본점',
    category_name: '음식점 > 한식 > 육류,고기',
    address_name: '서울 강남구 도산대로101길 6',
    region_city: '서울',
    region_gu: '강남구',
    region_dong: '청담동',
    lat: 37.5244,
    lng: 127.0512,
  },
  {
    provider_place_id: 'kakao_seongsu_soomoon',
    place_name: '소문난성수감자탕',
    category_name: '음식점 > 한식 > 감자탕',
    address_name: '서울 성동구 연무장길 45',
    region_city: '서울',
    region_gu: '성동구',
    region_dong: '성수동2가',
    lat: 37.5428,
    lng: 127.0562,
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('query') || '').trim();

  if (!query) {
    return NextResponse.json({ places: FALLBACK_PLACES.slice(0, 5) });
  }

  const kakaoRestApiKey = process.env.KAKAO_REST_API_KEY;

  if (kakaoRestApiKey) {
    try {
      const kakaoUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(
        query
      )}&category_group_code=FD6&size=10`;

      const res = await fetch(kakaoUrl, {
        headers: {
          Authorization: `KakaoAK ${kakaoRestApiKey}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const places: YotVenueItem[] = (data.documents || []).map((doc: any) => {
          // 주소 파싱 (시/구/동)
          const addressParts = (doc.address_name || '').split(' ');
          const city = addressParts[0] || '부산';
          const gu = addressParts[1] || '';
          const dong = addressParts[2] || '';

          return {
            provider_place_id: `kakao_${doc.id}`,
            place_name: doc.place_name,
            category_name: doc.category_name,
            address_name: doc.address_name,
            road_address_name: doc.road_address_name,
            region_city: city,
            region_gu: gu,
            region_dong: dong,
            lat: parseFloat(doc.y),
            lng: parseFloat(doc.x),
          };
        });

        if (places.length > 0) {
          return NextResponse.json({ places });
        }
      }
    } catch (err) {
      console.warn('[KakaoPlaceAPI] Fetch error, using fallback:', err);
    }
  }

  // 폴백 검색: 검색어가 포함된 항목 필터링
  const filtered = FALLBACK_PLACES.filter(
    (p) =>
      p.place_name.includes(query) ||
      p.address_name.includes(query) ||
      (p.category_name && p.category_name.includes(query))
  );

  // 검색 결과가 없으면 사용자가 입력한 단어로 동적 가상 식당 생성 (원활한 진행 보장)
  if (filtered.length === 0) {
    const customVenue: YotVenueItem = {
      provider_place_id: `custom_${Date.now()}`,
      place_name: query,
      category_name: '음식점 > 일반맛집',
      address_name: '부산/서울 등 방문 희망 구역',
      region_city: '부산',
      region_gu: '전역',
      region_dong: '중심가',
    };
    return NextResponse.json({ places: [customVenue] });
  }

  return NextResponse.json({ places: filtered });
}
