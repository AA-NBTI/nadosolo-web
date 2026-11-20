/**
 * 엿장수 (Yot) 코너 타입 시스템 및 게임/확률 엔진
 */

export interface YotVenueItem {
  id?: string;
  provider_place_id: string; // 카카오/네이버 고유 장소 ID
  place_name: string;        // 식당명
  category_name?: string;    // 업종 카테고리
  address_name: string;      // 전체 지번/도로명 주소
  road_address_name?: string;
  region_city: string;       // 도시 (부산, 서울 등)
  region_gu: string;         // 자치구 (부산진구, 해운대구 등)
  region_dong: string;       // 동 (전포동, 우동 등)
  lat?: number;
  lng?: number;
  report_count?: number;
}

// 방문 목적 칩 (복수 선택 가능)
export const YOT_PURPOSE_CHIPS = [
  { id: 'SOLO_BURDEN', label: '🥩 2인분 이상 주문 필수(고기/전골)', short: '혼자 가기 부담' },
  { id: 'MANY_MENUS', label: '🍽️ 메뉴를 여러 개 시켜 맛보고 싶어서', short: '다양한 메뉴' },
  { id: 'ATMOSPHERE', label: '🍷 둘 이상 가야 분위기 나는 곳이라서', short: '분위기 맛집' },
  { id: 'WAITING', label: '⏳ 웨이팅이 길어 혼자 서있기 민망해서', short: '웨이팅 핫플' },
  { id: 'SECRET_HIDDEN', label: '🤫 아는 사람만 아는 나만의 숨은 아지트', short: '숨은 노포' },
  { id: 'SPECIAL_PRICE', label: '💰 가격이 있어 특별한 날 함께 가고 싶어서', short: '스페셜 다이닝' },
  { id: 'NEW_FRIEND', label: '🤝 새로운 사람들과 가볍게 뚫고 싶어서', short: '소셜 친화' },
] as const;

export type YotPurposeTagId = typeof YOT_PURPOSE_CHIPS[number]['id'];

// 제보 페이로드 (이메일 수집 기반)
export interface YotTradePayload {
  venue: YotVenueItem;
  purpose_tags: string[];
  one_line_review: string;
  user_email: string;
}

// 룰렛 슬롯 6칸 표준 정의
export type YotSlotKey = 'BOOM' | '1000' | '2000' | '3000' | '5000' | '10000';

export interface YotSlotItem {
  key: YotSlotKey;
  label: string;
  amount: number; // 0 for BOOM
  color: string;
  textColor: string;
}

export const YOT_SLOTS: YotSlotItem[] = [
  { key: 'BOOM', label: '꽝', amount: 0, color: '#18181b', textColor: '#a1a1aa' },
  { key: '1000', label: '1,000원', amount: 1000, color: '#27272a', textColor: '#f4f4f5' },
  { key: '2000', label: '2,000원', amount: 2000, color: '#18181b', textColor: '#f4f4f5' },
  { key: '3000', label: '3,000원', amount: 3000, color: '#27272a', textColor: '#f4f4f5' },
  { key: '5000', label: '5,000원', amount: 5000, color: '#18181b', textColor: '#f4f4f5' },
  { key: '10000', label: '10,000원', amount: 10000, color: '#f04f74', textColor: '#ffffff' }, // 브랜드 포인트
];

// 엿(Taffy) 개수 판정 함수 (겉은 엿장수 마음, 내부는 데이터 품질 점수)
export function calculateAwardedTaffy(payload: {
  venue: YotVenueItem;
  purpose_tags: string[];
  one_line_review: string;
}): { taffyCount: number; praiseComment: string } {
  const hasVenue = Boolean(payload.venue && payload.venue.place_name);
  const purposeCount = payload.purpose_tags?.length || 0;
  const reviewLength = (payload.one_line_review || '').trim().length;

  if (hasVenue && purposeCount >= 1 && reviewLength >= 5) {
    return {
      taffyCount: 3,
      praiseComment: '어이쿠! 혼자 가기 아까운 이유에 꿀팁까지 적어주시다니, 엿장수 인심 써서 엿 3개(룰렛 3회권) 드립니다!',
    };
  }

  if (hasVenue && (purposeCount >= 1 || reviewLength > 0)) {
    return {
      taffyCount: 2,
      praiseComment: '좋은 맛집에 추천 이유까지 주셨구려! 엿 2개(룰렛 2회권) 드리겠소!',
    };
  }

  return {
    taffyCount: 1,
    praiseComment: '식당 이름 하나 건졌네! 엿장수 기본 엿 1개(룰렛 1회권) 받으시오!',
  };
}

// 룰렛 스핀 회차별 확률 및 엿장수 보너스 로직
export interface SpinHistoryItem {
  spinIndex: number;
  slotKey: YotSlotKey;
  amount: number;
}

export function determineNextSpinResult(history: SpinHistoryItem[], totalTaffy: number): {
  resultSlot: YotSlotItem;
  bonusTaffyAwarded: boolean;
  bonusMessage?: string;
  targetCouponAmount: number;
} {
  const currentTurn = history.length + 1;
  let selectedSlot: YotSlotItem;
  let bonusTaffyAwarded = false;
  let bonusMessage: string | undefined;

  const consecutiveBooms = history.filter((h) => h.slotKey === 'BOOM').length;

  // 1회차: 주로 1000원, 2000원, 3000원 혹은 꽝(호기심 유발)
  if (currentTurn === 1) {
    const roll = Math.random();
    if (roll < 0.25) {
      selectedSlot = YOT_SLOTS.find((s) => s.key === 'BOOM')!;
    } else if (roll < 0.55) {
      selectedSlot = YOT_SLOTS.find((s) => s.key === '2000')!;
    } else if (roll < 0.85) {
      selectedSlot = YOT_SLOTS.find((s) => s.key === '3000')!;
    } else {
      selectedSlot = YOT_SLOTS.find((s) => s.key === '1000')!;
    }
  } 
  // 2회차: 긴장감 극대화
  else if (currentTurn === 2) {
    const prevWon = history[0]?.amount > 0;
    if (prevWon) {
      selectedSlot = Math.random() < 0.5 
        ? YOT_SLOTS.find((s) => s.key === 'BOOM')!
        : YOT_SLOTS.find((s) => s.key === '1000')!;
    } else {
      selectedSlot = YOT_SLOTS.find((s) => s.key === '5000')!;
    }
  } 
  // 3회차 (마지막 회차): 10,000원 잭팟 발동
  else {
    selectedSlot = YOT_SLOTS.find((s) => s.key === '10000')!;
  }

  // 엿장수 마음대로 보너스 엿 로직 (2회 돌렸는데 연속 2회 꽝이거나 결과가 아쉬울 때)
  if (currentTurn >= 2 && consecutiveBooms >= 2 && !history.some((h) => h.slotKey === '10000')) {
    bonusTaffyAwarded = true;
    bonusMessage = '에잉 쯧쯧! 꽝이 연거푸 나오다니 손이 영 안 따라주는구먼? 엿장수 인심이다, 보너스 엿 하나 더 줄 테니 다시 돌려보게!';
  }

  // 최종 누적 쿠폰 금액 산출 (3회 완주 시 최소 10,000원 보장)
  const previousSum = history.reduce((acc, cur) => acc + cur.amount, 0);
  let totalSum = previousSum + selectedSlot.amount;
  if (currentTurn >= 3 || currentTurn >= totalTaffy) {
    if (totalSum < 10000) {
      totalSum = 10000;
    }
  }

  return {
    resultSlot: selectedSlot,
    bonusTaffyAwarded,
    bonusMessage,
    targetCouponAmount: Math.max(totalSum, selectedSlot.amount),
  };
}
