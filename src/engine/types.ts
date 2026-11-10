/**
 * NadoSolo Core Engine v2 - [3 Domains x 8 Modules] Type Definitions
 * UI에 종속되지 않으며, 글로벌 확장 + 다중 소셜 모드 + 미러(타인이 본 나) + 그로스(자기성장 코칭)를 포괄합니다.
 */

export type Gender = 'M' | 'F';
export type SocialMode = 'ROMANCE' | 'PLATONIC' | 'THEME';
export type LanguageCode = 'ko' | 'en' | 'ja' | 'es';
export type FluencyLevel = 'BASIC' | 'CONVERSATIONAL' | 'FLUENT' | 'NATIVE';
export type BudgetTier = '$' | '$$' | '$$$';
export type DietaryRestriction = 'NONE' | 'VEGAN' | 'HALAL' | 'NO_PORK' | 'ALCOHOL_FREE';
export type CultureTag = 'KR' | 'US_EU' | 'JP' | 'GLOBAL';

export type InterestTag =
  | 'WINE'
  | 'COOKING'
  | 'RUNNING'
  | 'FITNESS'
  | 'TECH_STARTUP'
  | 'FINANCE'
  | 'BOOK_ART'
  | 'TRAVEL'
  | 'MOVIE_MUSIC'
  | 'LANGUAGE';

export interface LoggedInUser {
  userId: string;
  handle: string; // @핸들 고유 ID (예: @jisoo_kim)
  role?: 'MEMBER' | 'ADMIN';
  email: string;
  nickname: string;
  phone?: string;
  jobTitle?: string;
  gender: Gender;
  birthYear: number;
  authProvider: 'KAKAO' | 'GOOGLE' | 'APPLE' | 'EMAIL';
  verifiedBadge: string;
  sessionCount: number;
}

// ============================================================================
// DOMAIN A. 자아 & 성장 (Identity & Growth: ① Profiling / ② Mirror / ③ Growth)
// ============================================================================

/** 5차원 기본 성향 벡터 (0.0 ~ 1.0) */
export interface TraitVector {
  /** 외향성 및 에너지 (0.0 조용함 ~ 1.0 활발함) */
  extroversion: number;
  /** 대화 주도성 (0.0 경청형 ~ 1.0 화제 주도형) */
  talkLead: number;
  /** 라이프스타일 활력도 (0.0 인도어/휴식 ~ 1.0 아웃도어/취미부자) */
  lifestyleActive: number;
  /** 로맨스 목적성 (0.0 순수 친구/네트워킹 ~ 1.0 설레는 연애) */
  romanceIntent: number;
  /** 주류 선호도 (0.0 논알콜 ~ 1.0 애주가) */
  alcoholPreference: number;
}

/** 4대 솔로 역량 지표 (자기관리 및 소통 코칭용, 0 ~ 100점) */
export interface SoloCompetencyScores {
  /** 대화 균형감 (독점하지 않고 질문과 경청을 주고받는 능력) */
  communicationBalance: number;
  /** 첫인상 & 자기관리/그루밍 (스타일링, 깔끔함, 표정 여유) */
  groomingAndSelfCare: number;
  /** 공감 & 리액션 온도 (상대방을 편안하게 해주는 정서적 매력) */
  empathyAndVibe: number;
  /** 라이프 활력 & 대화 소재 풍부함 */
  lifestyleVitality: number;
}

export interface SurveyQuestionOption {
  id: string;
  label: string;
  weights: Partial<TraitVector>;
}

export interface SurveyQuestion {
  id: string;
  category: 'personality' | 'lifestyle' | 'dining' | 'romance';
  questionText: string;
  options: SurveyQuestionOption[];
}

export interface SurveyAnswer {
  questionId: string;
  selectedOptionId: string;
}

/** 동석자가 모임 종료 후 남기는 익명 다면 피드백 (거울 데이터 원천) */
export type PositiveCharmTag =
  | 'WARM_LISTENER'       // 따뜻하게 경청해줘요
  | 'GREAT_QUESTIONER'    // 질문을 센스 있게 던져요
  | 'STYLISH_NEAT'        // 스타일링과 인상이 깔끔해요
  | 'BRIGHT_ENERGY'       // 표정과 리액션이 밝아요
  | 'RICH_STORYTELLER';   // 대화 소재가 흥미롭고 풍부해요

export type GrowthPointTag =
  | 'NEED_MORE_QUESTIONS' // 본인 이야기 비중을 조금 줄이고 질문을 더 던지면 좋겠어요
  | 'RELAX_FACIAL_TENSION'// 초반 긴장을 풀고 미소를 조금 더 지으면 훨씬 따뜻할 거예요
  | 'UPGRADE_STYLING'     // 본인의 매력을 살리는 헤어/스타일링 디테일이 더해지면 완벽해요
  | 'MORE_EYE_CONTACT'    // 골고루 눈을 맞추며 리액션해주면 호감도가 급상승할 거예요
  | 'EXPAND_LIFE_TOPICS'; // 일상/취미 등 자신만의 라이프 스토리가 조금 더 궁금해요

export interface PeerMirrorFeedback {
  sessionId: string;
  fromUserId: string;
  toUserId: string;
  observedTraitHint: Partial<TraitVector>;
  competencyRatings: SoloCompetencyScores;
  selectedCharmTag: PositiveCharmTag;
  selectedGrowthTipTag?: GrowthPointTag;
}

/** 조하리의 창(Johari Window) 분석 결과: 내가 본 나 vs 타인이 본 나 */
export interface JohariGapInsight {
  axis: keyof TraitVector;
  selfScore: number;      // 0 ~ 100 환산
  mirrorScore: number;    // 0 ~ 100 환산
  gap: number;            // mirrorScore - selfScore
  quadrant:
    | 'OPEN_STRENGTH'     // 나와 타인 모두 인정하는 강점
    | 'HIDDEN_CHARM'      // 나는 과소평가했으나 타인이 발견한 숨은 매력 (gap >= +15)
    | 'BLIND_SPOT'        // 나는 높게 평가했으나 타인에겐 다르게 비친 사각지대 (gap <= -15)
    | 'NEUTRAL_ALIGNED';  // 인식 일치
  summaryMessage: string;
}

export interface MirrorDiagnosisResult {
  userId: string;
  feedbackCount: number;
  selfVector: TraitVector;
  mirrorVector: TraitVector;
  /** 매칭 엔진에 주입할 합성 실효 벡터 (Self * α + Mirror * (1-α)) */
  effectiveVector: TraitVector;
  competencyAvg: SoloCompetencyScores;
  topCharms: PositiveCharmTag[];
  topGrowthPoints: GrowthPointTag[];
  johariInsights: JohariGapInsight[];
}

/** 회차별 성장 스냅샷 (Growth Engine 시계열 데이터) */
export interface SessionGrowthSnapshot {
  sessionNumber: number;
  sessionId: string;
  recordedAt: string;
  competencyScores: SoloCompetencyScores;
  mirrorExtroversion: number;
  mirrorTalkLead: number;
  receivedLikesCount: number;
}

export interface CoachingPrescription {
  focusArea: keyof SoloCompetencyScores;
  currentScore: number;
  coachingTitle: string;
  gentleAdvice: string;
  nextSessionMicroMission: string;
  recommendedProgram: {
    programId: string;
    category: 'STYLING_GROOMING' | 'CONVERSATION_SPEECH' | 'LIFESTYLE_CLUB' | 'MINDSET';
    title: string;
  };
}

export interface GrowthCoachingReport {
  userId: string;
  totalSessionsCompleted: number;
  overallGrowthDelta: number; // 첫 회차 대비 종합 역량 상승폭
  competencyTrend: {
    axis: keyof SoloCompetencyScores;
    firstScore: number;
    latestScore: number;
    delta: number;
  }[];
  unlockedAuraBadges: string[];
  prescriptions: CoachingPrescription[];
  shouldPromptProfileLevelUp: boolean;
}

// ============================================================================
// DOMAIN B. 글로벌 매칭 & 운영 (Matching & Ops: ④ Policy / ⑤ Grouping / ⑥ VenueYield)
// ============================================================================

export interface CityLocaleConfig {
  cityCode: string;           // 예: 'SEOUL_SEONGSU', 'TOKYO_SHIBUYA', 'NYC_SOHO'
  countryCode: string;        // 'KR', 'JP', 'US'
  ianaTimezone: string;       // 'Asia/Seoul', 'Asia/Tokyo', 'America/New_York'
  currency: 'KRW' | 'JPY' | 'USD' | 'EUR';
  baseTicketPrice: number;
  cultureTag: CultureTag;
}

/** 모드별 동적 가중치 매트릭스 (합계 1.0) */
export interface DynamicWeightMatrix {
  ageCompatibilityWeight: number;
  traitSynergyWeight: number;
  interestSimilarityWeight: number;
  intentAlignmentWeight: number;
  energyBalanceWeight: number;
}

export interface ModePolicyConfig {
  mode: SocialMode;
  tableSize: number;
  enforceEqualGenderRatio: boolean;
  maxAgeGapYears: number;
  minFluencyRequired: FluencyLevel;
  weights: DynamicWeightMatrix;
}

export interface ParticipantProfile {
  userId: string;
  nickname: string;
  gender: Gender;
  birthYear: number;
  cityCode: string;
  /** 신청한 모임 모드 */
  preferredMode: SocialMode;
  /** 구사 언어 및 유창성 */
  languages: Partial<Record<LanguageCode, FluencyLevel>>;
  preferredTableLanguage: LanguageCode;
  budgetTier: BudgetTier;
  dietary: DietaryRestriction[];
  interests: InterestTag[];
  /** 내가 본 나 (Self) */
  selfVector: TraitVector;
  /** 미러 엔진이 산출한 실효 벡터 (없으면 selfVector 사용) */
  effectiveVector?: TraitVector;
  /** 출석/매너 신뢰 점수 (0 ~ 100, 기본 80) */
  trustScore: number;
  verified: boolean;
}

export interface HistoricalEncounter {
  userA: string;
  userB: string;
  sessionId: string;
}

export interface MatchedTable {
  tableId: string;
  cityCode: string;
  mode: SocialMode;
  tableLanguage: LanguageCode;
  budgetTier: BudgetTier;
  requiredDietarySupport: DietaryRestriction[];
  participants: ParticipantProfile[];
  assignedVenue?: PartnerVenue;
  harmonyScore: number;
  scoreBreakdown: {
    ageCompatibility: number;
    traitSynergy: number;
    interestSimilarity: number;
    intentAlignment: number;
    energyBalance: number;
  };
}

export interface GroupingResult {
  matchedTables: MatchedTable[];
  unassignedParticipants: ParticipantProfile[];
}

export interface PartnerVenue {
  venueId: string;
  name: string;
  cityCode: string;
  budgetTier: BudgetTier;
  supportedDietary: DietaryRestriction[];
  vibeThemes: ('WINE_BISTRO' | 'CASUAL_DINING' | 'COOKING_STUDIO' | 'PRIVATE_LOUNGE')[];
  maxTablesPerNight: number;
}

export interface DynamicPriceQuote {
  cityCode: string;
  mode: SocialMode;
  basePrice: number;
  finalPrice: number;
  discountRatePercent: number;
  pricingReason: 'STANDARD' | 'EARLY_BIRD' | 'GENDER_BALANCE_BOOST' | 'STANDBY_LAST_MINUTE';
}

// ============================================================================
// DOMAIN C. 현장 세션 & 인연 (Session & Match: ⑦ Playbook / ⑧ MutualMatch)
// ============================================================================

export type PlaybookStageType =
  | 'CHECK_IN'
  | 'ICE_BREAKING'
  | 'TOPIC_TALK'
  | 'SEAT_SHUFFLE'
  | 'SECRET_VOTE'
  | 'WRAP_UP';

export interface SeatAssignment {
  seatNumber: number;
  userId: string;
  nickname: string;
  pairingReason?: string;
}

export interface PlaybookCard {
  cardId: string;
  cultureTags: CultureTag[];
  modes: SocialMode[];
  title: string;
  promptText: string;
  balanceOptions?: [string, string];
}

export interface PlaybookStageConfig {
  stageId: string;
  type: PlaybookStageType;
  title: string;
  durationMinutes: number;
  description: string;
  cards?: PlaybookCard[];
  triggerSeatShuffle?: boolean;
}

export interface PlaybookTemplate {
  templateId: string;
  name: string;
  stages: PlaybookStageConfig[];
}

export interface TableSessionState {
  sessionId: string;
  tableId: string;
  mode: SocialMode;
  cultureTag: CultureTag;
  templateId: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  currentStageIndex: number;
  currentCardIndex: number;
  stageStartedAt: string;
  checkedInUserIds: string[];
  currentSeats: SeatAssignment[];
}

export type VoteCategory = 'ROMANCE' | 'DINING_FRIEND' | 'THEME_CREW';

export interface SecretVote {
  sessionId: string;
  fromUserId: string;
  toUserId: string;
  category: VoteCategory;
  oneLineMessage?: string;
  submittedAt: string;
}

export interface MutualMatchPair {
  sessionId: string;
  userA: string;
  userB: string;
  matchedCategory: VoteCategory;
  isCrossCategoryMatch: boolean;
  cityCode: string;
  ianaTimezone: string;
  revealScheduledAtUtc: string;
}
