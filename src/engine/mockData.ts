import {
  DietaryRestriction,
  GrowthPointTag,
  InterestTag,
  ParticipantProfile,
  PeerMirrorFeedback,
  PositiveCharmTag,
  SessionGrowthSnapshot,
  TraitVector,
} from './types';

export const INTEREST_LABELS: Record<InterestTag, string> = {
  WINE: '🍷 와인·위스키',
  COOKING: '🍳 요리·미식',
  RUNNING: '🏃 러닝·아웃도어',
  FITNESS: '💪 홈트·피트니스',
  TECH_STARTUP: '💻 IT·스타트업',
  FINANCE: '📈 재테크·투자',
  BOOK_ART: '🎨 전시·독서',
  TRAVEL: '✈️ 여행·캠핑',
  MOVIE_MUSIC: '🎬 영화·음악',
  LANGUAGE: '🌍 외국어·글로벌',
};

export const DIETARY_LABELS: Record<DietaryRestriction, string> = {
  NONE: '제약 없음',
  VEGAN: '🥗 비건(Vegan)',
  HALAL: '🕌 할랄(Halal)',
  NO_PORK: '🐷 돼지고기 제외',
  ALCOHOL_FREE: '🥤 논알콜 선호',
};

export const CHARM_TAG_LABELS: Record<PositiveCharmTag, string> = {
  WARM_LISTENER: '🌱 따뜻하게 경청해줘서 마음이 편했어요',
  GREAT_QUESTIONER: '💬 질문을 센스 있게 던져 대화를 살려줘요',
  STYLISH_NEAT: '✨ 스타일링과 첫인상이 깔끔하고 세련됐어요',
  BRIGHT_ENERGY: '☀️ 표정과 리액션이 밝아 에너지가 좋아요',
  RICH_STORYTELLER: '📚 일상과 취미 대화 소재가 흥미로워요',
};

export const GROWTH_TAG_LABELS: Record<GrowthPointTag, string> = {
  NEED_MORE_QUESTIONS: '💡 내 이야기 후 상대방에게 질문을 조금 더 던져주면 좋겠어요',
  RELAX_FACIAL_TENSION: '😊 초반 긴장을 풀고 미소를 조금 더 지으면 훨씬 따뜻할 거예요',
  UPGRADE_STYLING: '👔 본인의 분위기를 살리는 헤어·스타일링 디테일이 더해지면 완벽해요',
  MORE_EYE_CONTACT: '👀 골고루 눈을 맞추며 리액션해주면 호감도가 급상승할 거예요',
  EXPAND_LIFE_TOPICS: '🎨 주말 취미나 나만의 라이프 스토리가 조금 더 궁금해요',
};

export const INITIAL_U01_SELF_VECTOR: TraitVector = {
  extroversion: 0.25,
  talkLead: 0.2,
  lifestyleActive: 0.25,
  romanceIntent: 0.85,
  alcoholPreference: 0.8,
};

export const INITIAL_PEER_FEEDBACKS: PeerMirrorFeedback[] = [
  {
    sessionId: 'SES_PAST_01',
    fromUserId: 'USER_BB',
    toUserId: 'USER_AA',
    observedTraitHint: { talkLead: 0.85, extroversion: 0.8, romanceIntent: 0.85, alcoholPreference: 0.8 },
    competencyRatings: {
      communicationBalance: 88,
      groomingAndSelfCare: 80,
      empathyAndVibe: 90,
      lifestyleVitality: 85,
    },
    selectedCharmTag: 'GREAT_QUESTIONER',
    selectedGrowthTipTag: 'UPGRADE_STYLING',
  },
  {
    sessionId: 'SES_PAST_02',
    fromUserId: 'USER_BB',
    toUserId: 'USER_AA',
    observedTraitHint: { talkLead: 0.8, extroversion: 0.75, romanceIntent: 0.85, alcoholPreference: 0.8 },
    competencyRatings: {
      communicationBalance: 86,
      groomingAndSelfCare: 82,
      empathyAndVibe: 88,
      lifestyleVitality: 84,
    },
    selectedCharmTag: 'WARM_LISTENER',
    selectedGrowthTipTag: 'MORE_EYE_CONTACT',
  },
];

export const INITIAL_GROWTH_SNAPSHOTS: SessionGrowthSnapshot[] = [
  {
    sessionNumber: 1,
    sessionId: 'SES_01',
    recordedAt: '2026-10-02',
    competencyScores: {
      communicationBalance: 72,
      groomingAndSelfCare: 64,
      empathyAndVibe: 78,
      lifestyleVitality: 75,
    },
    mirrorExtroversion: 0.65,
    mirrorTalkLead: 0.6,
    receivedLikesCount: 1,
  },
  {
    sessionNumber: 2,
    sessionId: 'SES_02',
    recordedAt: '2026-10-16',
    competencyScores: {
      communicationBalance: 80,
      groomingAndSelfCare: 67,
      empathyAndVibe: 84,
      lifestyleVitality: 80,
    },
    mirrorExtroversion: 0.72,
    mirrorTalkLead: 0.75,
    receivedLikesCount: 2,
  },
  {
    sessionNumber: 3,
    sessionId: 'SES_03',
    recordedAt: '2026-11-06',
    competencyScores: {
      communicationBalance: 87,
      groomingAndSelfCare: 69,
      empathyAndVibe: 89,
      lifestyleVitality: 83,
    },
    mirrorExtroversion: 0.78,
    mirrorTalkLead: 0.83,
    receivedLikesCount: 2,
  },
];

export const INITIAL_PARTICIPANTS: ParticipantProfile[] = [
  {
    userId: 'USER_AA',
    nickname: '김에이',
    gender: 'F',
    birthYear: 1994,
    cityCode: 'SEOUL_SEONGSU',
    preferredMode: 'ROMANCE',
    languages: { ko: 'NATIVE' },
    preferredTableLanguage: 'ko',
    budgetTier: '$$',
    dietary: ['NONE'],
    interests: ['COOKING', 'WINE'],
    selfVector: INITIAL_U01_SELF_VECTOR,
    trustScore: 98,
    verified: true,
  },
  {
    userId: 'USER_BB',
    nickname: '이비비',
    gender: 'M',
    birthYear: 1992,
    cityCode: 'SEOUL_SEONGSU',
    preferredMode: 'ROMANCE',
    languages: { ko: 'NATIVE' },
    preferredTableLanguage: 'ko',
    budgetTier: '$$',
    dietary: ['NONE'],
    interests: ['RUNNING', 'TECH_STARTUP'],
    selfVector: { extroversion: 0.7, talkLead: 0.6, lifestyleActive: 0.8, romanceIntent: 0.85, alcoholPreference: 0.7 },
    trustScore: 96,
    verified: true,
  },
];

export const STANDBY_WAITLIST_POOL: ParticipantProfile[] = [];

