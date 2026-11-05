import { PartnerVenue, PlaybookTemplate, SurveyQuestion } from './types';

export const DEFAULT_SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'Q1_WEEKEND',
    category: 'lifestyle',
    questionText: '혼자 보내는 주말, 가장 이상적인 풍경은?',
    options: [
      {
        id: 'Q1_A',
        label: '집에서 넷플릭스 보며 밀린 요리나 휴식 즐기기',
        weights: { lifestyleActive: -0.25, extroversion: -0.15 },
      },
      {
        id: 'Q1_B',
        label: '성수동 팝업스토어나 동네 핫플 맛집 탐방하기',
        weights: { lifestyleActive: 0.25, extroversion: 0.2 },
      },
    ],
  },
  {
    id: 'Q2_TALK_STYLE',
    category: 'personality',
    questionText: '처음 만난 사람들과의 식사 자리에서 나는?',
    options: [
      {
        id: 'Q2_A',
        label: '질문을 던지고 분위기를 먼저 이끄는 편이다',
        weights: { talkLead: 0.3, extroversion: 0.25 },
      },
      {
        id: 'Q2_B',
        label: '상대방의 이야기를 잘 들어주고 리액션하는 편이다',
        weights: { talkLead: -0.3, extroversion: -0.1 },
      },
    ],
  },
  {
    id: 'Q3_ALCOHOL',
    category: 'dining',
    questionText: '금요일 저녁 식사 자리에서 선호하는 주류 스타일은?',
    options: [
      {
        id: 'Q3_A',
        label: '와인이나 하이볼을 곁들이며 기분 좋게 마시는 걸 좋아한다',
        weights: { alcoholPreference: 0.3 },
      },
      {
        id: 'Q3_B',
        label: '논알콜 음료나 가볍게 한 잔 정도만 마신다',
        weights: { alcoholPreference: -0.3 },
      },
    ],
  },
  {
    id: 'Q4_INTENT',
    category: 'romance',
    questionText: '이번 나도솔로 다이닝에서 가장 기대하는 것은?',
    options: [
      {
        id: 'Q4_A',
        label: '설레는 이성과의 자연스러운 만남과 로맨스',
        weights: { romanceIntent: 0.35 },
      },
      {
        id: 'Q4_B',
        label: '성별·나이 무관! 취향과 대화가 통하는 동네 친구/크루',
        weights: { romanceIntent: -0.25 },
      },
    ],
  },
];

/**
 * 제휴 식당(PartnerVenue) 샘플 프리셋 (식단 제약 및 예산 티어 지원)
 */
export const SAMPLE_PARTNER_VENUES: PartnerVenue[] = [
  // --- 🇰🇷 부산 제휴 파트너 베뉴 ---
  {
    venueId: 'VEN_BUSAN_HAEUNDAE_01',
    name: '해운대 마린시티 오션 테라스 와인 클럽',
    cityCode: 'BUSAN_HAEUNDAE',
    budgetTier: '$$$',
    supportedDietary: ['NONE', 'NO_PORK', 'ALCOHOL_FREE'],
    vibeThemes: ['WINE_BISTRO', 'PRIVATE_LOUNGE'],
    maxTablesPerNight: 4,
  },
  {
    venueId: 'VEN_BUSAN_GWANGAN_02',
    name: '광안 브릿지 뷰 내추럴 와인 비스트로',
    cityCode: 'BUSAN_GWANGAN',
    budgetTier: '$$',
    supportedDietary: ['NONE', 'VEGAN', 'ALCOHOL_FREE'],
    vibeThemes: ['WINE_BISTRO', 'CASUAL_DINING'],
    maxTablesPerNight: 3,
  },
  {
    venueId: 'VEN_BUSAN_JEONPO_03',
    name: '전리단길 아티장 셰프 키친',
    cityCode: 'BUSAN_JEONPO',
    budgetTier: '$$',
    supportedDietary: ['NONE', 'NO_PORK', 'HALAL'],
    vibeThemes: ['CASUAL_DINING', 'COOKING_STUDIO'],
    maxTablesPerNight: 3,
  },
  {
    venueId: 'VEN_BUSAN_CENTUM_04',
    name: '센텀 BEXCO 프라이빗 룸 다이닝',
    cityCode: 'BUSAN_CENTUM',
    budgetTier: '$$$',
    supportedDietary: ['NONE', 'VEGAN', 'HALAL', 'NO_PORK'],
    vibeThemes: ['PRIVATE_LOUNGE', 'CASUAL_DINING'],
    maxTablesPerNight: 2,
  },
  {
    venueId: 'VEN_BUSAN_DONGNAE_05',
    name: '온천천 감성 테라스 비스트로',
    cityCode: 'BUSAN_DONGNAE',
    budgetTier: '$$',
    supportedDietary: ['NONE', 'NO_PORK', 'ALCOHOL_FREE'],
    vibeThemes: ['CASUAL_DINING', 'WINE_BISTRO'],
    maxTablesPerNight: 2,
  },

  // --- 서울 & 글로벌 베뉴 ---
  {
    venueId: 'VEN_SEONGSU_WINE_01',
    name: '성수 오랑주리 와인 비스트로',
    cityCode: 'SEOUL_SEONGSU',
    budgetTier: '$$',
    supportedDietary: ['NONE', 'NO_PORK', 'VEGAN'],
    vibeThemes: ['WINE_BISTRO', 'CASUAL_DINING'],
    maxTablesPerNight: 3,
  },
  {
    venueId: 'VEN_SEONGSU_COOK_02',
    name: '서울숲 테이블 쿠킹 라운지',
    cityCode: 'SEOUL_SEONGSU',
    budgetTier: '$$',
    supportedDietary: ['NONE', 'VEGAN', 'HALAL', 'ALCOHOL_FREE'],
    vibeThemes: ['COOKING_STUDIO', 'PRIVATE_LOUNGE'],
    maxTablesPerNight: 2,
  },
  {
    venueId: 'VEN_NYC_SOHO_01',
    name: 'Soho Olive & Vine Kitchen',
    cityCode: 'NYC_SOHO',
    budgetTier: '$$',
    supportedDietary: ['NONE', 'VEGAN', 'HALAL'],
    vibeThemes: ['WINE_BISTRO', 'CASUAL_DINING'],
    maxTablesPerNight: 4,
  },
];

/**
 * 문화권(KR / US_EU / GLOBAL) 및 소셜 모드(ROMANCE / PLATONIC / THEME) 반응형 플레이북
 */
export const ADAPTIVE_DINING_PLAYBOOK: PlaybookTemplate = {
  templateId: 'TPL_GLOBAL_ADAPTIVE_DINING',
  name: '글로벌 & 모드 반응형 6인 소셜 다이닝 플레이북 (120분)',
  stages: [
    {
      stageId: 'STG_1_CHECKIN',
      type: 'CHECK_IN',
      title: '웰컴 체크인 & 맞춤형 좌석 안내',
      durationMinutes: 15,
      description: '도착 순서대로 체크인하고 엔진이 배정한 최적 케미 좌석에 착석해 주세요.',
    },
    {
      stageId: 'STG_2_ICEBREAK',
      type: 'ICE_BREAKING',
      title: '1교시: 아이스브레이킹 & 키워드 토크',
      durationMinutes: 30,
      description: '모임 모드와 문화권에 맞춘 첫인상 대화 카드입니다.',
      cards: [
        {
          cardId: 'CRD_ICE_KR_ROMANCE',
          cultureTags: ['KR', 'GLOBAL'],
          modes: ['ROMANCE'],
          title: '나의 혼삶 레벨과 설레는 순간',
          promptText: '독립 N년차! 혼자 살면서 가장 좋았던 순간과, 반대로 "이럴 땐 진짜 연인이 옆에 있었으면 좋겠다" 싶었던 순간은 언제인가요?',
        },
        {
          cardId: 'CRD_ICE_GLOBAL_THEME',
          cultureTags: ['KR', 'US_EU', 'JP', 'GLOBAL'],
          modes: ['PLATONIC', 'THEME'],
          title: '요즘 나를 가장 설레게 하는 몰입(Deep Dive)',
          promptText: '일(Work)을 제외하고 요즘 내 주말 시간과 에너지를 가장 많이 쏟고 있는 취미나 관심사는 무엇인가요? 입문하게 된 계기를 들려주세요!',
        },
      ],
    },
    {
      stageId: 'STG_3_SHUFFLE',
      type: 'SEAT_SHUFFLE',
      title: '하프타임: 2부 좌석 로테이션',
      durationMinutes: 5,
      description: '모임 성격(로맨스 이성 시프트 vs 크로스 토크 시프트)에 따라 새로운 자리로 이동합니다.',
      triggerSeatShuffle: true,
    },
    {
      stageId: 'STG_4_TOPIC',
      type: 'TOPIC_TALK',
      title: '2교시: 밸런스 게임 & 딥토크',
      durationMinutes: 50,
      description: '서로의 가치관과 취향을 깊이 알아보는 라운드입니다.',
      cards: [
        {
          cardId: 'CRD_BAL_ROMANCE',
          cultureTags: ['KR', 'GLOBAL'],
          modes: ['ROMANCE'],
          title: '주말 데이트 스타일 밸런스',
          promptText: '연인과 보내는 주말, 더 끌리는 쪽은?',
          balanceOptions: [
            '핫플 와인바 & 전시회 나들이 데이트',
            '함께 장 봐서 집에서 요리해 먹고 영화 보기',
          ],
        },
        {
          cardId: 'CRD_BAL_THEME',
          cultureTags: ['KR', 'US_EU', 'JP', 'GLOBAL'],
          modes: ['PLATONIC', 'THEME'],
          title: '인생 대화 코드 밸런스',
          promptText: '친구나 크루와 대화할 때 내가 더 즐거움을 느끼는 주제는?',
          balanceOptions: [
            '미식·여행·취미 등 일상의 즐거움과 경험 공유',
            '커리어·재테크·인생 목표 등 성장과 인사이트 교류',
          ],
        },
      ],
    },
    {
      stageId: 'STG_5_VOTE',
      type: 'SECRET_VOTE',
      title: '3교시: 시크릿 매칭 투표 & 미러 피드백',
      durationMinutes: 15,
      description: '다시 만나고 싶은 분을 선택하고, 동석자분들의 숨은 매력과 원포인트 성장 카드를 익명으로 선물해 주세요.',
    },
    {
      stageId: 'STG_6_WRAPUP',
      type: 'WRAP_UP',
      title: '마무리 및 자정 매칭 & 내일 아침 코칭 리포트 안내',
      durationMinutes: 5,
      description: '오늘 밤 자정(현지 시각 00:00)에 상호 매칭 결과가 공개되며, 내일 아침 [나도솔로 미러 & 그로스 코칭 리포트]가 발송됩니다.',
    },
  ],
};
