/**
 * 한국어 검색엔진(네이버·구글) 최적화용 한글 시맨틱 모임 슬러그 생성기
 * 예: ("부산광역시", "해운대구", "RESET") -> "부산-해운대구-지적환기-소셜다이닝"
 */

const CITY_NORMALIZE_MAP: Record<string, string> = {
  서울특별시: '서울',
  부산광역시: '부산',
  대구광역시: '대구',
  인천광역시: '인천',
  광주광역시: '광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
  경기도: '경기',
  강원특별자치도: '강원',
  제주특별자치도: '제주',
};

const PURPOSE_SEO_KEYWORD_MAP: Record<string, string> = {
  FRIEND: '친구교류-소셜다이닝',
  RESET: '지적환기-소셜다이닝',
  TASTE: '취향공유-소셜다이닝',
  ROMANCE: '인연만남-소셜다이닝',
};

export function buildMeetupSeoSlug(
  city?: string,
  district?: string,
  purpose?: string,
  suffix?: string
): string {
  const rawCity = (city || '부산').trim();
  const cleanCity = CITY_NORMALIZE_MAP[rawCity] || rawCity;
  const cleanDistrict = (district || '').trim();
  const purposeKeyword =
    PURPOSE_SEO_KEYWORD_MAP[(purpose || 'RESET').toUpperCase()] || '소셜다이닝';

  return [cleanCity, cleanDistrict, purposeKeyword, suffix]
    .filter((p): p is string => Boolean(p && p.trim()))
    .map((p) => p.replace(/\s+/g, '-').replace(/[^\w가-힣-]/g, ''))
    .filter(Boolean)
    .join('-');
}
