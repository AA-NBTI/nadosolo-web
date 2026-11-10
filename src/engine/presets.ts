import { PartnerVenue, PlaybookTemplate, SurveyQuestion } from './types';

export const DEFAULT_SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'Q1_COMM_PACE',
    category: 'personality',
    questionText: '처음 만난 6인의 식탁에서 선호하는 나의 대화 템포는?',
    options: [
      {
        id: 'Q1_A',
        label: '질문을 먼저 건네며 테이블의 물꼬를 트는 화자형',
        weights: { talkLead: 0.3, extroversion: 0.25 },
      },
      {
        id: 'Q1_B',
        label: '상대방의 이야기를 깊이 듣고 차분히 호응하는 청자형',
        weights: { talkLead: -0.3, extroversion: -0.1 },
      },
    ],
  },
  {
    id: 'Q2_SILENCE_COPING',
    category: 'personality',
    questionText: '대화 중 잠시 정적이 흘렀을 때 내가 느끼는 태도는?',
    options: [
      {
        id: 'Q2_A',
        label: '정적도 식사의 자연스러운 여백으로 편안하게 받아들인다',
        weights: { talkLead: -0.2, extroversion: -0.15 },
      },
      {
        id: 'Q2_B',
        label: '새로운 화제나 가벼운 질문을 던져 분위기를 부드럽게 환기한다',
        weights: { talkLead: 0.25, extroversion: 0.2 },
      },
    ],
  },
  {
    id: 'Q3_DINING_VIBE',
    category: 'dining',
    questionText: '금요일 저녁 식사 자리에서 가장 편안한 주류 페어링은?',
    options: [
      {
        id: 'Q3_A',
        label: '와인이나 하이볼을 곁들이며 기분 좋은 취기를 즐긴다',
        weights: { alcoholPreference: 0.3 },
      },
      {
        id: 'Q3_B',
        label: '논알콜 음료나 차를 마시며 맑은 정신으로 대화에 집중한다',
        weights: { alcoholPreference: -0.3 },
      },
    ],
  },
  {
    id: 'Q4_SOLO_PURPOSE',
    category: 'lifestyle',
    questionText: '6인의 프라이빗 소셜 다이닝에서 내가 가장 얻고 싶은 것은?',
    options: [
      {
        id: 'Q4_A',
        label: '타인의 시선을 통해 나의 소통 매너와 첫인상을 객관적으로 발견하기',
        weights: { talkLead: 0.15, extroversion: 0.1, lifestyleActive: 0.1 },
      },
      {
        id: 'Q4_B',
        label: '일상의 답답함과 역할에서 벗어나 새로운 사람들과 지적 환기하기',
        weights: { lifestyleActive: 0.25, extroversion: 0.15, romanceIntent: 0.1 },
      },
    ],
  },
  {
    id: 'Q5_FEEDBACK_STYLE',
    category: 'romance',
    questionText: '모임 종료 후 동석자들에게 기대하는 피드백의 온도는?',
    options: [
      {
        id: 'Q5_A',
        label: '성장을 위해 솔직하고 날카로운 객관적 관찰 리포트',
        weights: { talkLead: 0.1, romanceIntent: -0.1 },
      },
      {
        id: 'Q5_B',
        label: '나의 고유한 매력과 장점을 짚어주는 따뜻한 지지와 공감',
        weights: { talkLead: -0.1, romanceIntent: 0.25 },
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
