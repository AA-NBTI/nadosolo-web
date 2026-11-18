/**
 * ============================================================================
 * [동적 축 레지스트리 & 12+4 적응형 질문지 · 매칭 엔진]
 * dynamicMatchingEngine.ts
 * ============================================================================
 * - 헌법 제2조(플러그인 아키텍처 & 표준 정규화) 준수:
 *   1) 축(Axis)과 질문지(Question)를 코드와 분리된 데이터 명세로 관리하여
 *      신규 축·문항 추가/수정/비활성화 시 코어 로직 수정이 불필요합니다.
 *   2) 활성화된 축의 가중치 합을 자동으로 100점 만점(score100)으로 정규화합니다.
 *   3) 모수(6명 -> 12명 -> 18명+) 증가에 따라 Tier 2/3 조건을 기준으로
 *      방을 자동 분화(Re-clustering)하고 내부 예상 적합도를 산출합니다.
 */

import { SAMPLE_PARTNER_VENUES } from './presets';
import { BudgetTier, PartnerVenue } from './types';

export type ConstraintTier = 'HARD' | 'CORE' | 'FINE';
export type AxisMatchStrategy =
  | 'EXACT'
  | 'COMPATIBILITY_MAP'
  | 'SIMILARITY'
  | 'COMPLEMENTARY'
  | 'DIVERSITY';

export type QuestionLayer = 'BASE' | 'DEEP' | 'PULSE';
export type QuestionInputType = 'SINGLE' | 'MULTI' | 'SCALE_1_5';

export type PurposeCode = 'RESET' | 'FRIEND' | 'TASTE' | 'ROMANCE';
export type DiningTrack = 'VEGAN' | 'NON_ALCOHOL' | 'ALCOHOL';
export type RelationshipStatus = 'SINGLE' | 'DATING' | 'MARRIED' | 'DIVORCED' | 'OTHER';
export type IndustryGroup =
  | 'IT_TECH'
  | 'FINANCE'
  | 'DESIGN_ART'
  | 'PRO_SERVICE'
  | 'COMMERCE'
  | 'EDU_PUBLIC'
  | 'FOUNDER'
  | 'OTHER';

/**
 * 동적 매칭 축 정의 (플러그인 단위)
 * 새로운 축을 추가해도 weight 합산으로 자동 100점 정규화됩니다.
 */
export interface MatchingAxisSpec {
  axisId: string;
  label: string; // 순수 단일 명사 (예: 목적, 깊이, 테마, 에너지)
  tier: ConstraintTier;
  strategy: AxisMatchStrategy;
  weight: number;
  isActive: boolean;
  /** 선택지/구간별 라벨 (단일 명사) */
  anchors: string[];
  /** COMPATIBILITY_MAP 전략일 때 선택지 간 호환율 (0.0 ~ 1.0) */
  compatibilityMap?: Record<string, Record<string, number>>;
}

export interface AdaptiveQuestionOption {
  id: string;
  label: string;
  /** 해당 선택지 선택 시 각 축(axisId)에 부여하는 0~100 정규화 점수 또는 범주 코드 */
  axisScores?: Record<string, number>;
  /** 범주형 메타 태그 (목적/관계상태/산업군/예산 등) */
  metaTag?: Record<string, string>;
}

export interface AdaptiveQuestionSpec {
  id: string;
  version: number;
  layer: QuestionLayer; // BASE(고정 12) | PULSE(오늘의 컨디션 4)
  categoryLabel: string; // 단일 명사: 현황 | 기질 | 경계 | 컨디션
  questionText: string;
  inputType: QuestionInputType;
  isActive: boolean;
  /** 복수 선택(MULTI) 시 최대 선택 가능 개수 */
  maxSelectCount?: number;
  /** SCALE_1_5일 때 1점/5점 라벨 및 연결 축 */
  scaleConfig?: {
    minLabel: string;
    maxLabel: string;
    axisWeights: Record<string, { weight: number; invert?: boolean }>;
  };
  /** SINGLE/MULTI일 때 선택지 */
  options?: AdaptiveQuestionOption[];
  /** 원하는 답이 없을 때 수동 기입("기타") 허용 여부 */
  allowCustomInput?: boolean;
  customPlaceholder?: string;
}

export interface AdaptiveAnswer {
  questionId: string;
  version: number;
  /** SINGLE이면 optionId, SCALE_1_5이면 1~5 문자열 또는 숫자 */
  value: string | number;
}

/**
 * [계층 2: 이용자 신청 의도 (Meetup Application Intent)]
 * 고정 회원정보(거주지 등)와 철저히 분리된 '이번 모임' 대분류 필수 조건입니다.
 * 예: 서울 거주자가 부산 출장 중 부산 모임을 신청하면 targetCity='부산'이 우선 적용됩니다.
 */
export interface MeetupApplicationIntent {
  targetCity: string;
  targetDistrict?: string;
  targetScheduleSlot: string;
  targetPurpose?: PurposeCode;
  targetBudgetTier?: BudgetTier;
  /** 추후 신규 필수 조건 추가 시 스키마 변경 없이 수용하는 확장 맵 */
  extraConditions?: Record<string, string | number | boolean>;
}

/**
 * [계층 3: 내부 엔진 표준 입력 프로필 (Engine Participant Input)]
 * 고정 프로필 + 신청 의도 + 성향 환산 좌표를 결합한 내부 엔진 전용 구조입니다.
 */
export interface UserAxisProfile {
  userId: string;
  gender: 'M' | 'F';
  birthYear: number;
  relationshipStatus: RelationshipStatus;
  industry: IndustryGroup;
  purpose: PurposeCode;
  budgetTier: BudgetTier;
  dietary: string;
  /** 개인 취향 체크: 비건 여부 */
  isVegan: boolean;
  /** 개인 취향 체크: 논알콜 여부 */
  isNonAlcohol: boolean;
  /** 고정 거주 지역 (통계·기본값용, 매칭 엔진은 targetCity만 사용) */
  residenceCity: string;
  /** 이번 모임 실제 매칭 희망 지역 (MeetupApplicationIntent 우선) */
  targetCity: string;
  /** 하위 호환용 별칭 (= targetCity) */
  cityCode: string;
  districtName?: string;
  /** 희망 모임 일정·시간 슬롯 (예: '2026-11-20 (금) 19:30') */
  scheduleSlot: string;
  /** 동적 축별 0~100 점수 (예: { DEPTH: 75, THEME: 50, ENERGY: 25 }) */
  axisScores: Record<string, number>;
  /** 각 축에서 가장 가까운 단일 명사 앵커 라벨 */
  axisLabels: Record<string, string>;
  /** 오늘의 컨디션(PULSE) 체크 여부 */
  hasPulseUpdate: boolean;
  /** 실제 응답한 설문 문항 수 (미입력/기본값 판별용) */
  answeredQuestionCount: number;
  /** 예산이 설문 실입력이 아닌 기본값('$$')인지 여부 */
  isDefaultBudget: boolean;
  /** 원문 설문 응답 스냅샷 (관리자 1:1 대조 검증용) */
  rawSurveyMap: Record<string, string>;
  /** 입금·결제(참여 신청) 완료 여부 */
  isPaid: boolean;
  /** 회원 현재 여정 단계 */
  memberStage: 'UNQUALIFIED' | 'READY' | 'APPLIED' | 'PRE_MATCHED' | 'CONFIRMED';
}

export interface RoomTargetSpec {
  roomId: string;
  title: string;
  cityCode: string;
  districtName?: string;
  scheduleSlot: string;
  purpose: PurposeCode;
  /** 방 중심 출생연도 (연령대 1요소 평가 기준) */
  targetBirthYear: number;
  /** 방 대표 예산 티어 */
  targetBudgetTier: '$' | '$$' | '$$$';
  /** 공통 방 트랙: 비건모임 | 논알콜 | 술모임 */
  diningTrack: DiningTrack;
  /** 공통 방 속성: 술모임(음주) 여부 (false면 논알콜 방) */
  isAlcoholRoom: boolean;
  /** 공통 방 속성: 비건 식단 지원 여부 */
  supportsVegan: boolean;
  /** 목표 축 점수 (0~100) */
  targetAxisScores: Record<string, number>;
  /** 목표 축 앵커 라벨 */
  targetLabels: Record<string, string>;
}

/**
 * 레퍼런스(Timeleft · Big Five · Faultline Prevention) 기반
 * 4대 목적별 전용 엔진 프로파일 (순서 · 가중치 · 연령 허용 곡선)
 */
export interface PurposeEngineProfile {
  purpose: PurposeCode;
  label: string;
  /** 연령 허용 기준: idealGap 이내 100%, maxGap 초과 0% */
  idealAgeGap: number;
  maxAgeGap: number;
  /** 목적별 1요소 가중치 (합계 100 자동 정규화) */
  weights: {
    PURPOSE: number;
    AGE: number;
    DEPTH: number;
    THEME: number;
    ENERGY: number;
    DIVERSITY: number;
    BUDGET: number;
  };
}

export interface AxisScoreBreakdown {
  axisId: string;
  label: string;
  earned: number;
  maxWeight: number;
  ratioPct: number;
}

export interface RoomMemberAssignment {
  member: UserAxisProfile;
  score100: number;
  /** CORE: 변동 확률 낮은 핵심 고정군(3~4명) | FLEX: 분화·재배치 가능 유동군(2명) */
  role: 'CORE' | 'FLEX';
  axisBreakdown: AxisScoreBreakdown[];
}

export interface StandbyCandidate {
  member: UserAxisProfile;
  score100: number;
  axisBreakdown: AxisScoreBreakdown[];
}

export interface WaitlistRouteOption {
  roomId: string;
  title: string;
  score100: number;
  blockedReason?: string;
}

export interface WaitlistRoutingPlan {
  member: UserAxisProfile;
  primaryRoom?: WaitlistRouteOption;
  secondaryRoom?: WaitlistRouteOption;
  eligibleRoomCount: number;
}

export interface DynamicMatchedRoom {
  roomId: string;
  spec: RoomTargetSpec;
  members: UserAxisProfile[];
  /** 코어(3~4명) + 유동(2명) 분리 배정 및 축별 객관 점수 */
  assignments: RoomMemberAssignment[];
  /** 노쇼 대비 추가 대기 스탠바이 인원 (최대 2명) */
  standbyCandidates: StandbyCandidate[];
  /** 배정된 제휴 식당 1순위 */
  assignedVenueId?: string;
  assignedVenueName?: string;
  assignedVenueBudgetTier?: BudgetTier;
  assignedVenueSupportsVegan?: boolean;
  /** 대체 제휴 식당 2순위 */
  backupVenueId?: string;
  backupVenueName?: string;
  venueAssignmentStatus: 'ASSIGNED' | 'WAITLIST_NO_VENUE';
  /** 관리자 전용 내부 예상 적합도 (0~100점) */
  expectedScore100: number;
  /** 모수 부족 등으로 완화된 조건 목록 (관리자 관제용) */
  relaxedConditions: string[];
  /** 성사 등급 라벨 */
  qualityGrade: 'OPTIMAL' | 'BALANCED' | 'MINIMUM_VIABLE';
}

export interface DynamicGroupingResult {
  rooms: DynamicMatchedRoom[];
  unassigned: UserAxisProfile[];
  /** 대기 인원별 1순위 · 2순위 추천 이동 예상 방 */
  waitlistRoutings: WaitlistRoutingPlan[];
  totalParticipants: number;
  activeAxisCount: number;
}

// ============================================================================
// 1. 기본 동적 축 레지스트리 (4대 축 · 향후 축 추가/수정 자유)
// ============================================================================

/**
 * 고도화 모듈 스위치 (준비되지 않은 기준은 당분간 평가에서 제외하고, 준비되면 ON)
 * - 일반화/필수/보조 계층이 완비되기 전까지 미완성 점수로 인한 왜곡을 방지합니다.
 */
export interface EngineFeatureModules {
  /** 예산(식당·가격 풀 연동 후 ON) */
  BUDGET: boolean;
  /** 직군 다양성(표준 직군 입력 완료 후 ON) */
  DIVERSITY: boolean;
  /** 소수 제약 보호(비건 가능 식당 풀 연동 후 ON) */
  VEGAN_GUARD: boolean;
}

export const DEFAULT_ENGINE_MODULES: EngineFeatureModules = {
  BUDGET: false,
  DIVERSITY: false,
  VEGAN_GUARD: true,
};

export const PURPOSE_LABELS: Record<PurposeCode, string> = {
  RESET: '변화',
  FRIEND: '교류',
  TASTE: '취향',
  ROMANCE: '인연',
};

/**
 * 4대 목적별 전용 매칭 엔진 프로파일
 * - 변화(RESET): 관점 전환 · 직군 다양성 · 대화 깊이 우선, 세대 유연
 * - 교류(FRIEND): 동년배 유대 · 단층선 방지 · 에너지 균형 우선
 * - 취향(TASTE): 테마·깊이·예산 일치 최우선, 연령 매우 유연
 * - 인연(ROMANCE): 연령 격차 엄격 · 성비 3:3 · 관계안전 필수
 */
export const PURPOSE_ENGINE_PROFILES: Record<PurposeCode, PurposeEngineProfile> = {
  RESET: {
    purpose: 'RESET',
    label: '변화',
    idealAgeGap: 10,
    maxAgeGap: 16,
    weights: {
      PURPOSE: 20,
      DEPTH: 25,
      THEME: 20,
      DIVERSITY: 15,
      ENERGY: 10,
      AGE: 5,
      BUDGET: 5,
    },
  },
  FRIEND: {
    purpose: 'FRIEND',
    label: '교류',
    idealAgeGap: 5,
    maxAgeGap: 12,
    weights: {
      PURPOSE: 20,
      AGE: 20,
      ENERGY: 20,
      DEPTH: 15,
      THEME: 15,
      DIVERSITY: 5,
      BUDGET: 5,
    },
  },
  TASTE: {
    purpose: 'TASTE',
    label: '취향',
    idealAgeGap: 12,
    maxAgeGap: 18,
    weights: {
      PURPOSE: 20,
      THEME: 30,
      DEPTH: 20,
      BUDGET: 15,
      ENERGY: 10,
      AGE: 5,
      DIVERSITY: 0,
    },
  },
  ROMANCE: {
    purpose: 'ROMANCE',
    label: '인연',
    idealAgeGap: 4,
    maxAgeGap: 9,
    weights: {
      PURPOSE: 25,
      AGE: 25,
      DEPTH: 15,
      THEME: 15,
      ENERGY: 10,
      BUDGET: 10,
      DIVERSITY: 0,
    },
  },
};

export const DEFAULT_MATCHING_AXES: MatchingAxisSpec[] = [
  {
    axisId: 'PURPOSE',
    label: '목적',
    tier: 'CORE',
    strategy: 'COMPATIBILITY_MAP',
    weight: 40,
    isActive: true,
    anchors: ['변화', '교류', '취향', '인연'],
    compatibilityMap: {
      RESET: { RESET: 1.0, FRIEND: 0.55, TASTE: 0.45, ROMANCE: 0.0 },
      FRIEND: { FRIEND: 1.0, RESET: 0.6, TASTE: 0.65, ROMANCE: 0.25 },
      TASTE: { TASTE: 1.0, FRIEND: 0.65, RESET: 0.5, ROMANCE: 0.3 },
      ROMANCE: { ROMANCE: 1.0, FRIEND: 0.2, TASTE: 0.2, RESET: 0.0 },
    },
  },
  {
    axisId: 'DEPTH',
    label: '깊이',
    tier: 'CORE',
    strategy: 'SIMILARITY',
    weight: 25,
    isActive: true,
    anchors: ['유쾌', '균형', '탐구', '사유'],
  },
  {
    axisId: 'THEME',
    label: '테마',
    tier: 'FINE',
    strategy: 'SIMILARITY',
    weight: 20,
    isActive: true,
    anchors: ['휴식', '미식', '예술', '영감'],
  },
  {
    axisId: 'ENERGY',
    label: '에너지',
    tier: 'FINE',
    strategy: 'COMPLEMENTARY',
    weight: 15,
    isActive: true,
    anchors: ['경청', '조화', '활력', '주도'],
  },
];

// ============================================================================
// 2. 2단계 프로그레시브 체크리스트 (결제 전 사전 BASE 9 + 결제 후 심층 DEEP 22 + 컨디션 PULSE 4 = 35문항)
// ============================================================================

export const DEFAULT_ADAPTIVE_QUESTIONS: AdaptiveQuestionSpec[] = [
  // ==========================================================================
  // [PART 1: 결제 전 필수 사전 체크리스트 (Fast Gate - BASE 9문항, 1분 컷)]
  // ==========================================================================
  {
    id: 'BASE_01_CITY',
    version: 1,
    layer: 'BASE',
    categoryLabel: '도시',
    questionText: '이번 주 다이닝에 참여하고 싶은 도시는 어디인가요? (직접 입력 가능)',
    inputType: 'SINGLE',
    allowCustomInput: true,
    customPlaceholder: '예: 대구, 대전, 광주, 제주 등 직접 입력',
    isActive: true,
    options: [
      { id: '서울', label: '서울 (성수 · 강남 · 한남 · 홍대 등)', metaTag: { targetCity: '서울' } },
      { id: '부산', label: '부산 (전포 · 해운대 · 광안리 등)', metaTag: { targetCity: '부산' } },
    ],
  },
  {
    id: 'BASE_02_RELATIONSHIP',
    version: 1,
    layer: 'BASE',
    categoryLabel: '현황',
    questionText: '현재 나의 관계 상태는 어떠한가요?',
    inputType: 'SINGLE',
    isActive: true,
    options: [
      { id: 'SINGLE', label: '미혼 · 싱글', metaTag: { relationshipStatus: 'SINGLE' } },
      { id: 'DATING', label: '연애 중', metaTag: { relationshipStatus: 'DATING' } },
      { id: 'MARRIED', label: '기혼', metaTag: { relationshipStatus: 'MARRIED' } },
      { id: 'DIVORCED', label: '돌싱', metaTag: { relationshipStatus: 'DIVORCED' } },
      { id: 'OTHER', label: '기타', metaTag: { relationshipStatus: 'OTHER' } },
    ],
  },
  {
    id: 'BASE_03_PURPOSE',
    version: 1,
    layer: 'BASE',
    categoryLabel: '목적',
    questionText: '나도솔로에서 지향하는 핵심 모임 목적은 무엇인가요?',
    inputType: 'SINGLE',
    isActive: true,
    options: [
      { id: 'RESET', label: '변화 (일상과 역할에서 벗어난 건강한 환기)', metaTag: { purpose: 'RESET' }, axisScores: { DEPTH: 65, THEME: 30 } },
      { id: 'FRIEND', label: '교류 (결이 통하는 편안한 사회적 친구)', metaTag: { purpose: 'FRIEND' }, axisScores: { DEPTH: 45, THEME: 50 } },
      { id: 'TASTE', label: '취향 (와인 · 미식 · 문화 공감)', metaTag: { purpose: 'TASTE' }, axisScores: { DEPTH: 60, THEME: 85 } },
      { id: 'ROMANCE', label: '인연 (미혼 한정 설레는 만남)', metaTag: { purpose: 'ROMANCE' }, axisScores: { DEPTH: 50, THEME: 60 } },
    ],
  },
  {
    id: 'BASE_04_INDUSTRY',
    version: 1,
    layer: 'BASE',
    categoryLabel: '직업',
    questionText: '현재 주로 몸담고 있는 분야를 선택해 주세요. (최대 2개 · 직접 입력 가능)',
    inputType: 'MULTI',
    maxSelectCount: 2,
    allowCustomInput: true,
    customPlaceholder: '예: 항공승무원, 건축가, 프리랜서 등 직접 입력',
    isActive: true,
    options: [
      { id: 'IT_TECH', label: 'IT · 테크 · 엔지니어링', metaTag: { industry: 'IT_TECH' } },
      { id: 'FINANCE', label: '금융 · 컨설팅 · 전략', metaTag: { industry: 'FINANCE' } },
      { id: 'DESIGN_ART', label: '디자인 · 예술 · 미디어', metaTag: { industry: 'DESIGN_ART' } },
      { id: 'PRO_SERVICE', label: '의료 · 법조 · 전문직', metaTag: { industry: 'PRO_SERVICE' } },
      { id: 'COMMERCE', label: '마케팅 · 유통 · 브랜드', metaTag: { industry: 'COMMERCE' } },
      { id: 'FOUNDER', label: '창업 · 경영 · 자영업', metaTag: { industry: 'FOUNDER' } },
      { id: 'EDU_PUBLIC', label: '교육 · 연구 · 공공', metaTag: { industry: 'EDU_PUBLIC' } },
    ],
  },
  {
    id: 'BASE_06_BUDGET',
    version: 1,
    layer: 'BASE',
    categoryLabel: '예산',
    questionText: '현장 1/N 식사 비용으로 가장 편안한 1인 예산 범위는?',
    inputType: 'SINGLE',
    isActive: true,
    options: [
      { id: '$', label: '3만원 이하 (캐주얼 다이닝)', metaTag: { budgetTier: '$' } },
      { id: '$$', label: '7만원 이하 (비스트로 · 펍)', metaTag: { budgetTier: '$$' } },
      { id: '$$$', label: '10만원 이하 (파인 다이닝 · 와인바)', metaTag: { budgetTier: '$$$' } },
      { id: 'ANY', label: '상관없음 (모든 가격대 수용 가능)', metaTag: { budgetTier: 'ANY' } },
    ],
  },
  {
    id: 'BASE_07_LANGUAGE',
    version: 1,
    layer: 'BASE',
    categoryLabel: '언어',
    questionText: '테이블에서 선호하는 대화 언어는 무엇인가요? (직접 입력 가능)',
    inputType: 'SINGLE',
    allowCustomInput: true,
    customPlaceholder: '예: 일본어, 중국어, 프랑스어 등 직접 입력',
    isActive: true,
    options: [
      { id: 'KO', label: '한국어 중심 테이블', metaTag: { language: 'KO' } },
      { id: 'EN', label: '영어 대화 가능 / 글로벌 교류', metaTag: { language: 'EN' } },
      { id: 'MIXED', label: '언어 무관', metaTag: { language: 'MIXED' } },
    ],
  },
  {
    id: 'BASE_08_ENERGY',
    version: 1,
    layer: 'BASE',
    categoryLabel: '기질',
    questionText: '평소 처음 만난 사람들의 모임에서 나의 기본 에너지는?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '조용히 경청하고 관찰',
      maxLabel: '먼저 말 걸고 대화 주도',
      axisWeights: { ENERGY: { weight: 1.0 } },
    },
  },
  {
    id: 'BASE_09_FEEDBACK_TONE',
    version: 1,
    layer: 'BASE',
    categoryLabel: '경계',
    questionText: '모임 종료 후 동석자들에게 기대하는 관찰 피드백 톤은?',
    inputType: 'SINGLE',
    isActive: true,
    options: [
      { id: 'OBJECTIVE', label: '성장을 위한 솔직한 표현 가능', axisScores: { DEPTH: 80 } },
      { id: 'BALANCED', label: '객관적 시선과 따뜻한 격려의 균형', axisScores: { DEPTH: 55 } },
      { id: 'WARM', label: '나의 고유한 매력을 짚어주는 응원', axisScores: { DEPTH: 35 } },
    ],
  },

  // ==========================================================================
  // [PART 2: 결제 후 D-1 정밀 배정 프로파일러 (DEEP 22문항)]
  // - 타임레프트 검증 Big Five 심층 16문항 전수 이식
  // - 라이프스타일 · 취향 · 2차 라운지 4문항
  // - 나도솔로 고유 소셜 미러 2문항
  // ==========================================================================

  // --- [외향성 (Extraversion) 4문항] ---
  {
    id: 'DEEP_E01_NEW_PEOPLE',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '외향',
    questionText: '낯선 사람들과의 새로운 만남이 나에게 주는 느낌은?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '다소 긴장되고 에너지가 소모됨',
      maxLabel: '설레고 활력과 에너지가 충전됨',
      axisWeights: { ENERGY: { weight: 1.2 } },
    },
  },
  {
    id: 'DEEP_E02_SPEAK_FIRST',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '외향',
    questionText: '낯선 테이블에서 먼저 입을 열고 분위기를 여는 편인가요?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '상대가 먼저 말 걸어주길 기다림',
      maxLabel: '내가 먼저 자연스럽게 질문을 던짐',
      axisWeights: { ENERGY: { weight: 1.0 } },
    },
  },
  {
    id: 'DEEP_E03_SILENCE_TOLERANCE',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '외향',
    questionText: '대화 중 잠깐의 정적이 흘렀을 때 나의 평소 반응은?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '정적이 어색해 빠르게 화제를 채움',
      maxLabel: '침묵도 편안한 대화의 여백으로 즐김',
      axisWeights: { DEPTH: { weight: 0.8 } },
    },
  },
  {
    id: 'DEEP_E04_SMALL_TALK',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '외향',
    questionText: '날씨, 최근 본 영화, 소소한 일상 스몰토크에 대한 선호도는?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '영양가 없게 느껴져 깊은 대화 선호',
      maxLabel: '마음의 벽을 허무는 훌륭한 윤활유',
      axisWeights: { ENERGY: { weight: 0.6 } },
    },
  },

  // --- [개방성 (Openness to Experience) 4문항] ---
  {
    id: 'DEEP_O01_UNFAMILIAR_THOUGHT',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '개방',
    questionText: '나와 완전히 다른 가치관이나 낯선 배경의 사람을 만났을 때 나의 태도는?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '이질감이 느껴져 거리를 둠',
      maxLabel: '호기심과 지적 흥미가 솟아남',
      axisWeights: { DEPTH: { weight: 0.9 } },
    },
  },
  {
    id: 'DEEP_O02_ABSTRACT_IDEAS',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '개방',
    questionText: '명확한 현실/팩트 이야기 vs 깊이 있는 개념/가치관/상상 대화 중 더 끌리는 쪽은?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '실질적인 팩트와 현실 이야기',
      maxLabel: '철학·개념·깊은 가치관 사유',
      axisWeights: { DEPTH: { weight: 1.2 } },
    },
  },
  {
    id: 'DEEP_O03_NEW_EXPERIENCE',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '개방',
    questionText: '실패 없는 익숙한 맛과 공간 vs 경험해보지 못한 새로운 발견 중 선호는?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '늘 가던 검증되고 익숙한 공간',
      maxLabel: '새롭고 이국적인 낯선 도전',
      axisWeights: { THEME: { weight: 1.0 } },
    },
  },
  {
    id: 'DEEP_O04_ART_CULTURE',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '개방',
    questionText: '예술, 전시, 철학, 음악 등 심미적 화제에 대한 관심도는?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '일상에서 거의 이야기하지 않음',
      maxLabel: '매우 좋아하며 깊게 이야기하고 싶음',
      axisWeights: { THEME: { weight: 1.0 } },
    },
  },

  // --- [친화성 (Agreeableness) 4문항] ---
  {
    id: 'DEEP_A01_EMPATHY_FACT',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '친화',
    questionText: '누군가 고민을 털어놓을 때 나의 첫 번째 반응은?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '명확한 해결책과 팩트 제시',
      maxLabel: '감정에 대한 온전한 공감과 경청',
      axisWeights: { DEPTH: { weight: 0.7 } },
    },
  },
  {
    id: 'DEEP_A02_DEBATE_STYLE',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '친화',
    questionText: '대화 중 의견 대립이나 논쟁이 생길 때 나의 태도는?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '논리적으로 옳고 그름을 짚어야 직성이 풀림',
      maxLabel: '관계의 온도를 지키며 부드럽게 조율',
      axisWeights: { DEPTH: { weight: 0.7 } },
    },
  },
  {
    id: 'DEEP_A03_LISTENING',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '친화',
    questionText: '상대방이 길게 이야기할 때 나의 평소 경청 스타일은?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '내 생각이 떠오르면 중간에 끼어들기도 함',
      maxLabel: '상대의 호흡이 끝날 때까지 온전히 귀 기울임',
      axisWeights: { DEPTH: { weight: 1.0 } },
    },
  },
  {
    id: 'DEEP_A04_HUMOR_CODE',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '친화',
    questionText: '테이블에서 가장 즐기는 유머와 티키타카 결은 무엇인가요?',
    inputType: 'SINGLE',
    isActive: true,
    options: [
      { id: 'WIT', label: '위트 있고 재치 넘치는 티키타카', axisScores: { DEPTH: 25, ENERGY: 75 } },
      { id: 'WARM', label: '따뜻하고 편안한 일상 공감 유머', axisScores: { DEPTH: 45, ENERGY: 45 } },
      { id: 'DEEP_TALK', label: '차분하고 은은한 미소의 사유형 대화', axisScores: { DEPTH: 90, ENERGY: 30 } },
      { id: 'INSIGHT', label: '새로운 시각과 영감이 오가는 유쾌함', axisScores: { DEPTH: 75, THEME: 90 } },
    ],
  },

  // --- [성실성 (Conscientiousness) 2문항] ---
  {
    id: 'DEEP_C01_TIME_PROMISE',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '성실',
    questionText: '약속 시간과 일정 관리에 대한 평소 습관은 어떠한가요?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '유연하고 상황에 맞춰 즉흥적으로 이동',
      maxLabel: '10분 전 도착 및 철저한 시간 엄수',
      axisWeights: { DEPTH: { weight: 0.5 } },
    },
  },
  {
    id: 'DEEP_C02_RULES_ETIQUETTE',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '성실',
    questionText: '테이블 매너와 다이닝 에티켓에 대한 나의 기준은?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '격식 없이 편안한 게 최고',
      maxLabel: '서로를 배려하는 품격과 매너가 매우 중요',
      axisWeights: { DEPTH: { weight: 0.8 } },
    },
  },

  // --- [정서적 안정성 (Calmness) 2문항] ---
  {
    id: 'DEEP_N01_STRESS_EXPRESSION',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '안정',
    questionText: '낯선 자리나 예상 밖 상황에서 나의 감정 컨트롤은?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '쉽게 긴장하거나 표정에서 티가 남',
      maxLabel: '어떤 상황에서도 침착하고 여유롭게 대처',
      axisWeights: { ENERGY: { weight: 0.7 } },
    },
  },
  {
    id: 'DEEP_N02_SENSITIVE_TOPICS',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '안정',
    questionText: '정치·사회 등 민감할 수 있는 이슈 대화에 대한 태도는?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '식탁에서는 가급적 피하고 싶음',
      maxLabel: '서로의 다름을 존중하며 성숙하게 토론 가능',
      axisWeights: { DEPTH: { weight: 0.7 } },
    },
  },

  // --- [라이프스타일 · 취향 · 2차 라운지 4문항] ---
  {
    id: 'DEEP_L01_INTERESTS',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '취향',
    questionText: '평소 주말과 퇴근 후 가장 많은 시간을 보내는 관심 분야는? (직접 입력 가능)',
    inputType: 'SINGLE',
    allowCustomInput: true,
    customPlaceholder: '예: 골프, 러닝, 반려동물, 재테크 등 직접 입력',
    isActive: true,
    options: [
      { id: 'REST', label: '여행 · 쉼 · 소소한 라이프스타일', axisScores: { THEME: 20 } },
      { id: 'GASTRO', label: '미식 · 와인 · 위스키 · 공간 탐방', axisScores: { THEME: 50 } },
      { id: 'ART', label: '책 · 전시 · 영화 · 음악 · 글쓰기', axisScores: { THEME: 75 } },
      { id: 'WORK', label: '비즈니스 · 커리어 · 스타트업 · 인사이트', axisScores: { THEME: 90 } },
    ],
  },
  {
    id: 'DEEP_L02_AFTER_DRINK',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '취향',
    questionText: '식사 후 2차 라운지(Last Drink)에 대한 참여 의향은?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '식사 마치고 바로 귀가 선호',
      maxLabel: '분위기 맞는 분들과 2차 라운지까지 즐겁게 동참',
      axisWeights: { ENERGY: { weight: 1.0 } },
    },
  },
  {
    id: 'DEEP_L03_TABLE_MOOD',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '취향',
    questionText: '내가 꿈꾸는 이번 모임의 가장 이상적인 테이블 무드는?',
    inputType: 'SINGLE',
    isActive: true,
    options: [
      { id: 'PARTY', label: '유쾌하고 웃음 가득한 에너제틱한 식탁', axisScores: { ENERGY: 85, DEPTH: 30 } },
      { id: 'SALON', label: '와인과 함께 깊어지는 지적 사유의 살롱', axisScores: { ENERGY: 40, DEPTH: 85 } },
      { id: 'HEALING', label: '부담 없이 마음을 털어놓는 따뜻한 쉼터', axisScores: { ENERGY: 45, DEPTH: 60 } },
      { id: 'NETWORK', label: '서로의 비즈니스와 성장을 응원하는 식탁', axisScores: { ENERGY: 70, DEPTH: 75 } },
    ],
  },
  {
    id: 'DEEP_L04_CONVERSATION_SPEED',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '취향',
    questionText: '내가 가장 편안하다고 느끼는 대화의 템포는?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '한마디씩 천천히 여백 있는 호흡',
      maxLabel: '빠른 티키타카와 박진감 있는 전개',
      axisWeights: { ENERGY: { weight: 0.8 } },
    },
  },

  // --- [나도솔로 고유 소셜 미러 2문항] ---
  {
    id: 'DEEP_S01_MIRROR_ASPECT',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '성찰',
    questionText: '오늘 동석자들에게 가장 발견받고 싶은 나의 소통 강점은 무엇인가요? (최대 2개 선택)',
    inputType: 'MULTI',
    maxSelectCount: 2,
    isActive: true,
    options: [
      { id: '경청', label: '경청 (끝까지 따뜻하게 들어주는 힘)', axisScores: { DEPTH: 85 } },
      { id: '배려', label: '배려 (테이블의 모두를 편안하게 품는 태도)', axisScores: { DEPTH: 70 } },
      { id: '품격', label: '품격 (단정하고 깊이 있는 어조와 매너)', axisScores: { DEPTH: 80 } },
      { id: '위트', label: '위트 (분위기를 부드럽게 환기하는 유머)', axisScores: { ENERGY: 80 } },
      { id: '표현', label: '표현 (내 생각과 감정을 솔직명쾌하게 전하는 솔직함)', axisScores: { ENERGY: 75 } },
      { id: '시선', label: '시선 (상대의 장점을 먼저 짚어내는 관찰력)', axisScores: { DEPTH: 75 } },
    ],
  },
  {
    id: 'DEEP_S02_SELF_IMAGE',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '성찰',
    questionText: '타인이 바라보는 나의 첫인상과 실제 나의 성향 간극은 어느 정도인가요?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '첫인상과 실제 성격이 거의 100% 일치',
      maxLabel: '알면 알수록 반전 매력이 매우 큼',
      axisWeights: { DEPTH: { weight: 0.6 } },
    },
  },

  // --- [식단 및 음료 제약/취향 (모임 전 필수/보조 영역)] ---
  // 23번: [보조 취향] 테이블 선호 음료 (단일 선택)
  {
    id: 'DEEP_D02_BEVERAGE_PREFERENCE',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '취향',
    questionText: '[보조 취향] 테이블 선호 음료 및 다이닝 스타일은 무엇인가요?',
    inputType: 'SINGLE',
    isActive: true,
    options: [
      { id: 'ALCOHOL_FREE', label: '논알콜 (술 없이 식사 중심)', metaTag: { dietary: 'ALCOHOL_FREE' } },
      { id: 'LIGHT_DRINK', label: '가볍게 맥주 · 하이볼 1~2잔' },
      { id: 'WINE_LOVER', label: '와인 · 칵테일 페어링 환영' },
      { id: 'LOW_SUGAR', label: '저당 · 헬시 라이프스타일' },
    ],
  },
  // 24번 (맨 마지막 영구 배치): [필수 제약] 식단 제한/알레르기 (복수 다중 선택 무제한)
  // [불변 헌칙: 질문 항목이 추가되더라도 식단 제약(DEEP_D01)은 항상 DEEP 파트의 맨 마지막 순서에 영구 배치]
  {
    id: 'DEEP_D01_DIETARY_RESTRICTIONS',
    version: 1,
    layer: 'DEEP',
    categoryLabel: '식단',
    questionText: '[필수 제약] 식당 배정 시 필수 반영해야 할 식단 제한이나 알레르기가 있으신가요? (복수 선택 · 직접 입력 가능)',
    inputType: 'MULTI',
    allowCustomInput: true,
    customPlaceholder: '예: 견과류/갑각류 알레르기, 글루텐 프리 등 직접 입력',
    isActive: true,
    options: [
      { id: 'NONE', label: '제한 없음 (모두 잘 먹어요)', metaTag: { dietary: 'NONE' } },
      { id: 'VEGAN', label: '비건 · 채식 메뉴 필수', metaTag: { dietary: 'VEGAN' } },
      { id: 'NO_PORK', label: '돼지고기 제외', metaTag: { dietary: 'NO_PORK' } },
      { id: 'HALAL', label: '할랄 식단', metaTag: { dietary: 'HALAL' } },
    ],
  },

  // ==========================================================================
  // [PART 3: 오늘의 컨디션 (재방문 시 15초 빠른 체크 - PULSE 4문항)]
  // ==========================================================================
  {
    id: 'P01_TODAY_ENERGY',
    version: 1,
    layer: 'PULSE',
    categoryLabel: '컨디션',
    questionText: '오늘 저녁 모임에서 내가 원하는 대화 에너지는?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '조용히 듣고 쉬고 싶다',
      maxLabel: '활발히 말하며 풀고 싶다',
      axisWeights: { ENERGY: { weight: 1.8 } },
    },
  },
  {
    id: 'P02_TODAY_DEPTH',
    version: 1,
    layer: 'PULSE',
    categoryLabel: '컨디션',
    questionText: '오늘 저녁 테이블에서 나누고 싶은 대화의 깊이는?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '가볍게 웃는 일상 수다',
      maxLabel: '진지한 고민 · 가치관 사유',
      axisWeights: { DEPTH: { weight: 1.8 } },
    },
  },
  {
    id: 'P03_TODAY_WORK_OFF',
    version: 1,
    layer: 'PULSE',
    categoryLabel: '컨디션',
    questionText: '오늘 밤 일(커리어·비즈니스) 이야기는 어느 정도가 좋을까요?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '일 얘기 완전히 OFF',
      maxLabel: '커리어 · 영감 교류 ON',
      axisWeights: { THEME: { weight: 1.8 } },
    },
  },
  {
    id: 'P04_TODAY_DRINK',
    version: 1,
    layer: 'PULSE',
    categoryLabel: '컨디션',
    questionText: '오늘 저녁 식사에 곁들이고 싶은 음료 스타일은?',
    inputType: 'SINGLE',
    isActive: true,
    options: [
      { id: 'NON_ALC', label: '논알콜 · 차(맑은 정신으로 대화)', axisScores: { THEME: 20 } },
      { id: 'LIGHT', label: '가볍게 한두 잔 (부담 없는 페어링)', axisScores: { THEME: 50 } },
      { id: 'WINE', label: '와인 · 칵테일 페어링 적극 환영', axisScores: { THEME: 65 } },
    ],
  },
];

// ============================================================================
// 3. 범용 스코어링 어댑터 (질문 응답 -> 표준 축 프로필 변환)
// ============================================================================

function scaleTo100(val: number): number {
  const clamped = Math.max(1, Math.min(5, val));
  return Math.round(((clamped - 1) / 4) * 100);
}

function resolveAnchorLabel(score100: number, anchors: string[]): string {
  if (!anchors.length) return '표준';
  const idx = Math.min(
    anchors.length - 1,
    Math.max(0, Math.floor((score100 / 100) * anchors.length))
  );
  return anchors[idx];
}

export function normalizeRegionCity(city?: string): string {
  if (!city) return '서울';
  const trimmed = city.trim();
  if (!trimmed) return '서울';
  if (trimmed.toUpperCase() === 'SEOUL') return '서울';
  if (trimmed.toUpperCase() === 'BUSAN') return '부산';
  return (
    trimmed
      .replace(/(특별시|광역시|특별자치시|특별자치도)$/g, '')
      .replace(/^(부산|서울|대구|인천|광주|대전|울산)시$/g, '$1') || trimmed
  );
}

export function computeUserAxisProfile(
  baseInfo: {
    userId: string;
    gender: 'M' | 'F';
    birthYear: number;
    residenceCity?: string;
    cityCode?: string;
    districtName?: string;
    scheduleSlot?: string;
    dietary?: string;
    purpose?: PurposeCode;
    budgetTier?: BudgetTier;
    isPaid?: boolean;
    memberStage?: 'UNQUALIFIED' | 'READY' | 'APPLIED' | 'PRE_MATCHED' | 'CONFIRMED';
  },
  answers: AdaptiveAnswer[],
  questions: AdaptiveQuestionSpec[] = DEFAULT_ADAPTIVE_QUESTIONS,
  axes: MatchingAxisSpec[] = DEFAULT_MATCHING_AXES,
  applicationIntent?: MeetupApplicationIntent
): UserAxisProfile {
  const answerMap = new Map<string, AdaptiveAnswer>();
  for (const ans of answers) {
    answerMap.set(ans.questionId, ans);
  }

  const sums: Record<string, number> = {};
  const weights: Record<string, number> = {};
  let relationshipStatus: RelationshipStatus = 'SINGLE';
  let industry: IndustryGroup = 'OTHER';
  let purpose: PurposeCode = baseInfo.purpose ?? 'RESET';
  let budgetTier: BudgetTier = baseInfo.budgetTier ?? '$$';
  let hasBudgetInput = Boolean(baseInfo.budgetTier);
  let hasPulseUpdate = false;
  let answeredQuestionCount = 0;
  const rawSurveyMap: Record<string, string> = {};

  let surveyDietary: string | undefined;
  let surveyTargetCity: string | undefined;

  const LEGACY_ID_FALLBACKS: Record<string, string[]> = {
    BASE_01_CITY: ['Q15_TARGET_CITY'],
    BASE_02_RELATIONSHIP: ['Q01_RELATIONSHIP'],
    BASE_03_PURPOSE: ['Q04_PURPOSE', 'Q02_THIRST'],
    BASE_04_INDUSTRY: ['Q03_INDUSTRY'],
    BASE_06_BUDGET: ['Q12_BUDGET'],
    BASE_07_LANGUAGE: ['Q14_LANGUAGE'],
    BASE_08_ENERGY: ['Q05_BASE_ENERGY'],
    BASE_09_FEEDBACK_TONE: ['Q10_FEEDBACK_TONE'],
    DEEP_D01_DIETARY_RESTRICTIONS: ['BASE_05_DIETARY', 'Q13_DIETARY'],
    DEEP_D02_BEVERAGE_PREFERENCE: ['P04_TODAY_DRINK'],
  };

  for (const q of questions) {
    if (!q.isActive) continue;
    let ans = answerMap.get(q.id);
    if (!ans && LEGACY_ID_FALLBACKS[q.id]) {
      for (const oldId of LEGACY_ID_FALLBACKS[q.id]) {
        const found = answerMap.get(oldId);
        if (found) {
          ans = found;
          break;
        }
      }
    }
    if (!ans) continue;

    answeredQuestionCount++;
    rawSurveyMap[q.id] = String(ans.value);
    if (q.layer === 'PULSE') hasPulseUpdate = true;

    if (q.inputType === 'SCALE_1_5' && q.scaleConfig) {
      const numVal = Number(ans.value);
      if (Number.isNaN(numVal)) continue;
      const rawScore = scaleTo100(numVal);

      for (const [axisId, cfg] of Object.entries(q.scaleConfig.axisWeights)) {
        const score = cfg.invert ? 100 - rawScore : rawScore;
        sums[axisId] = (sums[axisId] ?? 0) + score * cfg.weight;
        weights[axisId] = (weights[axisId] ?? 0) + cfg.weight;
      }
    } else if ((q.inputType === 'SINGLE' || q.inputType === 'MULTI') && q.options) {
      const tokens = String(ans.value)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (tokens.length === 0) continue;

      const dietaryTokens: string[] = [];
      for (const token of tokens) {
        if (token.startsWith('CUSTOM:')) {
          const customText = token.slice(7).trim();
          if ((q.id.includes('DIETARY')) && customText) {
            dietaryTokens.push(customText);
          }
          if ((q.id.includes('CITY')) && customText) {
            surveyTargetCity = customText;
          }
          continue;
        }
        const opt = q.options.find((o) => o.id === token);
        if (!opt) continue;

        if (opt.metaTag) {
          if (opt.metaTag.relationshipStatus) {
            relationshipStatus = opt.metaTag.relationshipStatus as RelationshipStatus;
          }
          if (opt.metaTag.industry) {
            industry = opt.metaTag.industry as IndustryGroup;
          }
          if (opt.metaTag.purpose) {
            purpose = opt.metaTag.purpose as PurposeCode;
          }
          if (opt.metaTag.budgetTier) {
            budgetTier = opt.metaTag.budgetTier as BudgetTier;
            hasBudgetInput = true;
          }
          if (opt.metaTag.dietary) {
            dietaryTokens.push(opt.metaTag.dietary);
          }
          if (opt.metaTag.targetCity) {
            surveyTargetCity = opt.metaTag.targetCity;
          }
        }

        if (opt.axisScores) {
          const w = q.layer === 'PULSE' ? 1.5 : 1.0;
          for (const [axisId, s] of Object.entries(opt.axisScores)) {
            sums[axisId] = (sums[axisId] ?? 0) + s * w;
            weights[axisId] = (weights[axisId] ?? 0) + w;
          }
        }
      }

      if (dietaryTokens.length > 0) {
        surveyDietary = dietaryTokens.join(',');
      }
    }
  }

  // 안전 규칙: 기혼/연애중 이용자가 ROMANCE 선택 시 RESET으로 자동 교정
  if ((relationshipStatus === 'MARRIED' || relationshipStatus === 'DATING') && purpose === 'ROMANCE') {
    purpose = 'RESET';
  }

  const axisScores: Record<string, number> = {};
  const axisLabels: Record<string, string> = {};

  for (const axis of axes) {
    if (!axis.isActive) continue;
    if (axis.axisId === 'PURPOSE') {
      const purposeIndex = ['RESET', 'FRIEND', 'TASTE', 'ROMANCE'].indexOf(purpose);
      axisScores.PURPOSE = purposeIndex >= 0 ? purposeIndex * 33 : 0;
      axisLabels.PURPOSE = PURPOSE_LABELS[purpose];
      continue;
    }

    const totalW = weights[axis.axisId] ?? 0;
    const score = totalW > 0 ? Math.round(sums[axis.axisId] / totalW) : 50;
    axisScores[axis.axisId] = score;
    axisLabels[axis.axisId] = resolveAnchorLabel(score, axis.anchors);
  }

  const rawDietary = (surveyDietary ?? baseInfo.dietary ?? 'NONE').toUpperCase();
  const isVegan = rawDietary.includes('VEGAN');
  const isNonAlcohol = rawDietary.includes('ALCOHOL_FREE');

  // 철저한 계층 분리: 거주지(residenceCity)와 모임 희망지(targetCity) 분리
  const resolvedResidence = normalizeRegionCity(baseInfo.residenceCity ?? baseInfo.cityCode);
  const resolvedTargetCity = normalizeRegionCity(
    applicationIntent?.targetCity ?? surveyTargetCity ?? baseInfo.cityCode ?? baseInfo.residenceCity
  );
  const resolvedPurpose = applicationIntent?.targetPurpose ?? purpose;
  const resolvedBudget = applicationIntent?.targetBudgetTier ?? budgetTier;
  const resolvedSlot =
    applicationIntent?.targetScheduleSlot ?? baseInfo.scheduleSlot ?? '2026-11-20 (금) 19:30';
  const resolvedDistrict = applicationIntent?.targetDistrict ?? baseInfo.districtName;

  return {
    userId: baseInfo.userId,
    gender: baseInfo.gender,
    birthYear: baseInfo.birthYear,
    relationshipStatus,
    industry,
    purpose: resolvedPurpose,
    budgetTier: resolvedBudget,
    dietary: baseInfo.dietary ?? 'NONE',
    isVegan,
    isNonAlcohol,
    residenceCity: resolvedResidence,
    targetCity: resolvedTargetCity,
    cityCode: resolvedTargetCity,
    districtName: resolvedDistrict,
    scheduleSlot: resolvedSlot,
    axisScores,
    axisLabels,
    hasPulseUpdate,
    answeredQuestionCount,
    isDefaultBudget: !hasBudgetInput && !applicationIntent?.targetBudgetTier,
    rawSurveyMap,
    isPaid: Boolean(baseInfo.isPaid),
    memberStage:
      baseInfo.memberStage ??
      (baseInfo.isPaid
        ? 'APPLIED'
        : answeredQuestionCount > 0
        ? 'READY'
        : 'UNQUALIFIED'),
  };
}

// ============================================================================
// 4. 동적 100점 정규화 적합도 계산 & 모수별 자동 분화 매칭 엔진
// ============================================================================

/**
 * 특정 이용자(user)가 특정 방(roomSpec)에 얼마나 부합하는지 0~100점으로 산출합니다.
 * 활성화된 축(axes)의 가중치 합을 자동으로 100점으로 정규화합니다.
 */
export interface BlockedPair {
  fromUserId: string;
  blockedUserId: string;
}

function buildBlockedKeySet(blockedPairs: BlockedPair[] = []): Set<string> {
  const set = new Set<string>();
  for (const b of blockedPairs) {
    if (!b.fromUserId || !b.blockedUserId) continue;
    set.add(`${b.fromUserId}::${b.blockedUserId}`);
    set.add(`${b.blockedUserId}::${b.fromUserId}`);
  }
  return set;
}

function isPairBlocked(a: string, b: string, blockedSet?: Set<string>): boolean {
  if (!blockedSet || blockedSet.size === 0) return false;
  return blockedSet.has(`${a}::${b}`);
}

export function scoreUserAgainstRoom(
  user: UserAxisProfile,
  roomSpec: RoomTargetSpec,
  currentMembers: UserAxisProfile[] = [],
  axes: MatchingAxisSpec[] = DEFAULT_MATCHING_AXES,
  modules: EngineFeatureModules = DEFAULT_ENGINE_MODULES,
  blockedSet?: Set<string>
): { score100: number; blockedReason?: string; axisBreakdown: AxisScoreBreakdown[] } {
  // Tier 1 필수 조건 0: 영구 재매칭 차단 쌍 제외
  if (
    blockedSet &&
    blockedSet.size > 0 &&
    currentMembers.some((m) => m.userId !== user.userId && isPairBlocked(user.userId, m.userId, blockedSet))
  ) {
    return { score100: 0, blockedReason: '재매칭 차단 쌍', axisBreakdown: [] };
  }
  // Tier 1 필수 조건 1: 이번 모임 희망 지역(targetCity) 일치
  if (normalizeRegionCity(user.targetCity) !== normalizeRegionCity(roomSpec.cityCode)) {
    return { score100: 0, blockedReason: '지역 불일치', axisBreakdown: [] };
  }

  // Tier 1 필수 조건 2: 일정·시간 일치
  if (user.scheduleSlot !== roomSpec.scheduleSlot) {
    return { score100: 0, blockedReason: '일정 불일치', axisBreakdown: [] };
  }

  // Tier 1 선택 모듈: 비건 보호 모듈이 ON일 때만 차단 (기본 OFF: 추후 식당 풀 연동 시 ON)
  if (modules.VEGAN_GUARD && user.isVegan && !roomSpec.supportsVegan) {
    return { score100: 0, blockedReason: '비건 미지원', axisBreakdown: [] };
  }

  // Tier 1 필수 조건 3: 기혼/연애중 회원은 ROMANCE 방 진입 불가
  if (
    roomSpec.purpose === 'ROMANCE' &&
    (user.relationshipStatus === 'MARRIED' || user.relationshipStatus === 'DATING')
  ) {
    return { score100: 0, blockedReason: '관계상태-목적 불일치', axisBreakdown: [] };
  }

  const profile = PURPOSE_ENGINE_PROFILES[roomSpec.purpose];
  const activeAxisMap = new Map(axes.filter((a) => a.isActive).map((a) => [a.axisId, a]));

  // 목적별 프로파일에 정의된 1요소 목록 (미완성 고도화 모듈은 OFF 시 평가에서 제외)
  const factorDefs: Array<{ id: keyof PurposeEngineProfile['weights']; label: string }> = [
    { id: 'PURPOSE', label: '목적' },
    { id: 'AGE', label: '나이' },
    { id: 'DEPTH', label: '깊이' },
    { id: 'THEME', label: '테마' },
    { id: 'ENERGY', label: '에너지' },
    { id: 'DIVERSITY', label: '직군' },
    { id: 'BUDGET', label: '예산' },
  ];

  let totalWeight = 0;
  let weightedSum = 0;
  const axisBreakdown: AxisScoreBreakdown[] = [];

  for (const factor of factorDefs) {
    // 모듈 스위치 OFF인 고도화 요소는 당분간 평가에서 제외 (나머지 활성 요소로 100점 자동 정규화)
    if (factor.id === 'BUDGET' && !modules.BUDGET) continue;
    if (factor.id === 'DIVERSITY' && !modules.DIVERSITY) continue;

    if (
      (factor.id === 'PURPOSE' ||
        factor.id === 'DEPTH' ||
        factor.id === 'THEME' ||
        factor.id === 'ENERGY') &&
      !activeAxisMap.has(factor.id)
    ) {
      continue;
    }

    // 목적별 프로파일 가중치(단, 관리자 패널에서 동적 축 가중치를 조절한 경우 비율 반영)
    const baseSpec = activeAxisMap.get(factor.id);
    const defaultAxisWeight =
      DEFAULT_MATCHING_AXES.find((d) => d.axisId === factor.id)?.weight ?? 1;
    const scaleFactor = baseSpec ? baseSpec.weight / defaultAxisWeight : 1;
    const weight = Math.round(profile.weights[factor.id] * scaleFactor);
    if (weight <= 0) continue;

    let ratio = 0.5;

    if (factor.id === 'PURPOSE') {
      const purposeAxis = activeAxisMap.get('PURPOSE');
      const compat = purposeAxis?.compatibilityMap?.[roomSpec.purpose]?.[user.purpose] ?? 0;
      if (compat <= 0 && roomSpec.purpose === 'ROMANCE') {
        return { score100: 0, blockedReason: '인연 트랙 전용 격리', axisBreakdown: [] };
      }
      ratio = compat;
    } else if (factor.id === 'AGE') {
      const ageGap = Math.abs((user.birthYear || 1990) - (roomSpec.targetBirthYear || 1990));
      if (ageGap <= profile.idealAgeGap) {
        ratio = 1.0;
      } else if (ageGap <= profile.maxAgeGap) {
        ratio = Math.max(
          0.25,
          1 - ((ageGap - profile.idealAgeGap) / (profile.maxAgeGap - profile.idealAgeGap)) * 0.75
        );
      } else {
        if (roomSpec.purpose === 'ROMANCE') {
          return { score100: 0, blockedReason: '연령 격차 초과', axisBreakdown: [] };
        }
        ratio = 0.1;
      }
    } else if (factor.id === 'DEPTH' || factor.id === 'THEME') {
      const userVal = user.axisScores[factor.id] ?? 50;
      const targetVal = roomSpec.targetAxisScores[factor.id] ?? 50;
      ratio = Math.max(0, 1 - Math.abs(userVal - targetVal) / 100);
    } else if (factor.id === 'ENERGY') {
      const userVal = user.axisScores.ENERGY ?? 50;
      const others = currentMembers.filter((m) => m.userId !== user.userId);
      if (others.length === 0) {
        ratio = 0.9;
      } else {
        const avg =
          others.reduce((acc, m) => acc + (m.axisScores.ENERGY ?? 50), 0) / others.length;
        const nextAvg = (avg * others.length + userVal) / (others.length + 1);
        ratio = Math.max(0, 1 - Math.abs(nextAvg - 50) / 50);
      }
    } else if (factor.id === 'DIVERSITY') {
      const others = currentMembers.filter((m) => m.userId !== user.userId);
      const sameIndustryCount = others.filter((m) => m.industry === user.industry).length;
      ratio = sameIndustryCount === 0 ? 1.0 : sameIndustryCount === 1 ? 0.65 : 0.25;
    } else if (factor.id === 'BUDGET') {
      if (user.budgetTier === 'ANY') {
        ratio = 1.0;
      } else {
        const tiers = ['$', '$$', '$$$'];
        const userIdx = tiers.indexOf(user.budgetTier);
        const roomIdx = tiers.indexOf(roomSpec.targetBudgetTier);
        const diff = Math.abs((userIdx >= 0 ? userIdx : 1) - (roomIdx >= 0 ? roomIdx : 1));
        ratio = diff === 0 ? 1.0 : diff === 1 ? 0.6 : 0.2;
      }
    }

    totalWeight += weight;
    const earned = Math.round(ratio * weight * 10) / 10;
    weightedSum += ratio * weight;
    axisBreakdown.push({
      axisId: factor.id,
      label: factor.label,
      earned,
      maxWeight: weight,
      ratioPct: Math.round(ratio * 100),
    });
  }

  const score100 = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;
  return { score100, axisBreakdown };
}

const VENUE_CITY_PREFIX_MAP: Record<string, string[]> = {
  서울: ['SEOUL_'],
  부산: ['BUSAN_'],
  뉴욕: ['NYC_'],
  NYC: ['NYC_'],
};

function matchesVenueCity(venueCityCode: string, roomCity: string): boolean {
  const upperVenue = venueCityCode.toUpperCase();
  const normalizedRoom = normalizeRegionCity(roomCity);
  const prefixes = VENUE_CITY_PREFIX_MAP[normalizedRoom] ?? VENUE_CITY_PREFIX_MAP[roomCity] ?? [];
  if (prefixes.some((p) => upperVenue.startsWith(p))) return true;
  return upperVenue.includes(normalizedRoom.toUpperCase());
}

function selectVenuesForRoom(
  cityCode: string,
  scheduleSlot: string,
  targetBudgetTier: '$' | '$$' | '$$$',
  requiresVegan: boolean,
  requiresNonAlcohol: boolean,
  venues: PartnerVenue[],
  venueUsage: Map<string, number>
): { primary?: PartnerVenue; backup?: PartnerVenue } {
  const tiers = ['$', '$$', '$$$'];
  const targetTierIdx = tiers.indexOf(targetBudgetTier);

  const candidates = venues
    .filter((v) => {
      if (!matchesVenueCity(v.cityCode, cityCode)) return false;
      const usageKey = `${v.venueId}|${scheduleSlot}`;
      const used = venueUsage.get(usageKey) ?? 0;
      if (used >= v.maxTablesPerNight) return false;
      if (requiresVegan && !v.supportedDietary.includes('VEGAN')) return false;
      return true;
    })
    .map((v) => {
      const budgetDiff = Math.abs(tiers.indexOf(v.budgetTier) - targetTierIdx);
      const nonAlcBonus = requiresNonAlcohol && v.supportedDietary.includes('ALCOHOL_FREE') ? 20 : 0;
      const veganBonus = requiresVegan && v.supportedDietary.includes('VEGAN') ? 30 : 0;
      const usageKey = `${v.venueId}|${scheduleSlot}`;
      const remainingCap = v.maxTablesPerNight - (venueUsage.get(usageKey) ?? 0);
      const score = 100 - budgetDiff * 15 + nonAlcBonus + veganBonus + remainingCap * 2;
      return { venue: v, score };
    })
    .sort((a, b) => b.score - a.score);

  return {
    primary: candidates[0]?.venue,
    backup: candidates[1]?.venue,
  };
}

/**
 * 모수(인원 수)에 따라 성사 우선(60점대) -> 핵심 분화(80점대) -> 세부 분화(90점대)로
 * 6인 테이블을 자동 편성하고, 코어(3~4명) · 유동(2명) · 스탠바이(2명) · 대기자 1/2순위 방을 산출합니다.
 */
export function matchDynamicTables(
  participants: UserAxisProfile[],
  axes: MatchingAxisSpec[] = DEFAULT_MATCHING_AXES,
  options: {
    tableSize?: number;
    enforceGenderBalance?: boolean;
    coreCount?: number;
    requirePaid?: boolean;
    venues?: PartnerVenue[];
    modules?: EngineFeatureModules;
    blockedPairs?: BlockedPair[];
  } = {}
): DynamicGroupingResult {
  const tableSize = options.tableSize ?? 6;
  const enforceGender = options.enforceGenderBalance ?? true;
  const coreCount = Math.max(3, Math.min(4, options.coreCount ?? 4));
  const requirePaid = options.requirePaid ?? false;
  const venues = options.venues ?? SAMPLE_PARTNER_VENUES;
  const modules = options.modules ?? DEFAULT_ENGINE_MODULES;
  const blockedSet = buildBlockedKeySet(options.blockedPairs);
  const activeAxes = axes.filter((a) => a.isActive);

  const rooms: DynamicMatchedRoom[] = [];
  const usedIds = new Set<string>();
  const venueUsage = new Map<string, number>();
  const veganNoVenueUserIds = new Set<string>();

  // 1단계 Tier 1 클러스터링: 지역 + 일정 단위로 풀 분리 (requirePaid=true 시 미입금자 매칭 풀 진입 차단)
  const geoSlotPools = new Map<
    string,
    { cityCode: string; scheduleSlot: string; members: UserAxisProfile[] }
  >();
  for (const p of participants) {
    if (requirePaid && !p.isPaid) continue;
    const city = normalizeRegionCity(p.targetCity || p.cityCode);
    const slot = p.scheduleSlot || '2026-11-20 (금) 19:30';
    const key = `${city}|${slot}`;
    const bucket = geoSlotPools.get(key) ?? { cityCode: city, scheduleSlot: slot, members: [] };
    bucket.members.push(p);
    geoSlotPools.set(key, bucket);
  }

  const formTablesFromPool = (
    pool: UserAxisProfile[],
    clusterCity: string,
    clusterSlot: string,
    forcedPurpose?: PurposeCode
  ) => {
    const sorted = [...pool].sort((a, b) => {
      const depthDiff = (a.axisScores.DEPTH ?? 50) - (b.axisScores.DEPTH ?? 50);
      if (depthDiff !== 0) return depthDiff;
      return (a.axisScores.THEME ?? 50) - (b.axisScores.THEME ?? 50);
    });

    while (true) {
      const rawRemaining = sorted.filter((p) => !usedIds.has(p.userId));
      const veganVenueExists = selectVenuesForRoom(
        clusterCity,
        clusterSlot,
        '$$',
        true,
        false,
        venues,
        venueUsage
      ).primary;
      const remaining =
        modules.VEGAN_GUARD && !veganVenueExists
          ? rawRemaining.filter((p) => {
              if (p.isVegan) {
                veganNoVenueUserIds.add(p.userId);
                return false;
              }
              return true;
            })
          : rawRemaining;
      if (remaining.length < tableSize) break;

      if (enforceGender) {
        const malesLeft = remaining.filter((p) => p.gender === 'M');
        const femalesLeft = remaining.filter((p) => p.gender === 'F');
        const half = Math.floor(tableSize / 2);
        if (malesLeft.length < half || femalesLeft.length < half) break;
      }

      // Seed 기준 임시 목표 스펙으로 후보자들의 1요소 종합 점수(scoreUserAgainstRoom) 평가
      const seed = remaining[0];
      const seedPurpose = forcedPurpose ?? seed.purpose;
      const seedSpec: RoomTargetSpec = {
        roomId: 'SEED',
        title: 'SEED',
        cityCode: clusterCity,
        scheduleSlot: clusterSlot,
        purpose: seedPurpose,
        targetBirthYear: seed.birthYear || 1992,
        targetBudgetTier: (!seed.budgetTier || seed.budgetTier === 'ANY') ? '$$' : seed.budgetTier,
        diningTrack: 'ALCOHOL',
        isAlcoholRoom: true,
        supportsVegan: false,
        targetAxisScores: seed.axisScores,
        targetLabels: seed.axisLabels,
      };

      let selected: UserAxisProfile[] = [];
      const pickGreedyNonBlocked = (
        list: UserAxisProfile[],
        count: number,
        alreadyPicked: UserAxisProfile[]
      ) => {
        const candidates = [...list]
          .map((m) => ({
            m,
            sc: scoreUserAgainstRoom(m, seedSpec, [seed, ...alreadyPicked], axes, modules, blockedSet),
          }))
          .filter((x) => !x.sc.blockedReason)
          .sort((a, b) => b.sc.score100 - a.sc.score100);
        const picked: UserAxisProfile[] = [];
        for (const item of candidates) {
          if (picked.length >= count) break;
          const conflict = [...alreadyPicked, ...picked].some((p) =>
            isPairBlocked(p.userId, item.m.userId, blockedSet)
          );
          if (!conflict) picked.push(item.m);
        }
        return picked;
      };

      if (enforceGender) {
        const half = Math.floor(tableSize / 2);
        const pickedM = pickGreedyNonBlocked(
          remaining.filter((p) => p.gender === 'M'),
          half,
          []
        );
        const pickedF = pickGreedyNonBlocked(
          remaining.filter((p) => p.gender === 'F'),
          half,
          pickedM
        );
        if (pickedM.length < half || pickedF.length < half) break;
        selected = [...pickedM, ...pickedF];
      } else {
        selected = pickGreedyNonBlocked(remaining, tableSize, []);
      }

      if (selected.length < tableSize) break;
      for (const m of selected) usedIds.add(m.userId);

      const purposeCounts: Record<PurposeCode, number> = {
        RESET: 0,
        FRIEND: 0,
        TASTE: 0,
        ROMANCE: 0,
      };
      for (const m of selected) purposeCounts[m.purpose]++;
      const dominantPurpose =
        forcedPurpose ??
        ((Object.entries(purposeCounts).sort((a, b) => b[1] - a[1])[0][0]) as PurposeCode);

      const targetAxisScores: Record<string, number> = {};
      const targetLabels: Record<string, string> = {};
      for (const ax of activeAxes) {
        if (ax.axisId === 'PURPOSE') {
          targetLabels.PURPOSE = PURPOSE_LABELS[dominantPurpose];
          continue;
        }
        const avg = Math.round(
          selected.reduce((acc, m) => acc + (m.axisScores[ax.axisId] ?? 50), 0) / selected.length
        );
        targetAxisScores[ax.axisId] = avg;
        targetLabels[ax.axisId] = resolveAnchorLabel(avg, ax.anchors);
      }

      const targetBirthYear = Math.round(
        selected.reduce((acc, m) => acc + (m.birthYear || 1992), 0) / selected.length
      );
      const budgetCounts = new Map<'$' | '$$' | '$$$', number>();
      for (const m of selected) {
        if (m.budgetTier && m.budgetTier !== 'ANY') {
          budgetCounts.set(m.budgetTier, (budgetCounts.get(m.budgetTier) ?? 0) + 1);
        }
      }
      const targetBudgetTier =
        Array.from(budgetCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '$$';

      const districtCounts = new Map<string, number>();
      for (const m of selected) {
        if (m.districtName) {
          districtCounts.set(m.districtName, (districtCounts.get(m.districtName) ?? 0) + 1);
        }
      }
      const dominantDistrict = Array.from(districtCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];

      const hasNonAlcohol = selected.some((m) => m.isNonAlcohol);
      const hasVegan = selected.some((m) => m.isVegan);
      const { primary: assignedVenue, backup: backupVenue } = selectVenuesForRoom(
        clusterCity,
        clusterSlot,
        targetBudgetTier,
        hasVegan,
        hasNonAlcohol,
        venues,
        venueUsage
      );
      if (assignedVenue) {
        const usageKey = `${assignedVenue.venueId}|${clusterSlot}`;
        venueUsage.set(usageKey, (venueUsage.get(usageKey) ?? 0) + 1);
      }

      const roomId = `DYN-ROOM-${rooms.length + 1}`;
      const spec: RoomTargetSpec = {
        roomId,
        title: `${clusterCity} · ${PURPOSE_LABELS[dominantPurpose]} · ${targetLabels.DEPTH ?? '균형'} · ${targetLabels.THEME ?? '휴식'}`,
        cityCode: clusterCity,
        districtName: dominantDistrict,
        scheduleSlot: clusterSlot,
        purpose: dominantPurpose,
        targetBirthYear,
        targetBudgetTier,
        diningTrack: hasVegan ? 'VEGAN' : hasNonAlcohol ? 'NON_ALCOHOL' : 'ALCOHOL',
        isAlcoholRoom: !hasNonAlcohol,
        supportsVegan: Boolean(assignedVenue?.supportedDietary.includes('VEGAN')),
        targetAxisScores,
        targetLabels,
      };

      const scoredMembers = selected.map((m) => {
        const res = scoreUserAgainstRoom(m, spec, selected, axes, modules);
        return { member: m, score100: res.score100, axisBreakdown: res.axisBreakdown };
      });

      // 코어 성비 균형: 남/여 각각 상위 2명씩(또는 3명일 때 남2여1/여2남1) CORE 선정
      const sortedM = scoredMembers
        .filter((x) => x.member.gender === 'M')
        .sort((a, b) => b.score100 - a.score100);
      const sortedF = scoredMembers
        .filter((x) => x.member.gender === 'F')
        .sort((a, b) => b.score100 - a.score100);

      const coreMaleTarget = Math.ceil(coreCount / 2);
      const coreFemaleTarget = Math.floor(coreCount / 2);
      const coreIds = new Set<string>([
        ...sortedM.slice(0, coreMaleTarget).map((x) => x.member.userId),
        ...sortedF.slice(0, coreFemaleTarget).map((x) => x.member.userId),
      ]);

      const ranked = [...scoredMembers].sort((a, b) => b.score100 - a.score100);
      const assignments: RoomMemberAssignment[] = ranked.map((item) => ({
        member: item.member,
        score100: item.score100,
        role: coreIds.has(item.member.userId) ? 'CORE' : 'FLEX',
        axisBreakdown: item.axisBreakdown,
      }));

      const expectedScore100 = Math.round(
        scoredMembers.reduce((a, b) => a + b.score100, 0) / scoredMembers.length
      );

      const relaxedConditions: string[] = [];
      const distinctPurposes = new Set(selected.map((m) => m.purpose));
      if (distinctPurposes.size > 1) {
        relaxedConditions.push('목적 병합');
      }
      const distinctBudgets = new Set(selected.map((m) => m.budgetTier));
      if (distinctBudgets.size > 1) {
        relaxedConditions.push('예산 인접');
      }

      const qualityGrade =
        expectedScore100 >= 85
          ? 'OPTIMAL'
          : expectedScore100 >= 70
          ? 'BALANCED'
          : 'MINIMUM_VIABLE';

      rooms.push({
        roomId,
        spec,
        members: selected,
        assignments,
        standbyCandidates: [],
        assignedVenueId: assignedVenue?.venueId,
        assignedVenueName: assignedVenue?.name,
        assignedVenueBudgetTier: assignedVenue?.budgetTier,
        assignedVenueSupportsVegan: Boolean(assignedVenue?.supportedDietary.includes('VEGAN')),
        backupVenueId: backupVenue?.venueId,
        backupVenueName: backupVenue?.name,
        venueAssignmentStatus: assignedVenue ? 'ASSIGNED' : 'WAITLIST_NO_VENUE',
        expectedScore100,
        relaxedConditions,
        qualityGrade,
      });
    }
  };

  for (const bucket of geoSlotPools.values()) {
    // Pass 1: 각 목적별(ROMANCE / TASTE / RESET / FRIEND) 순수 매칭 우선
    for (const pCode of ['ROMANCE', 'TASTE', 'RESET', 'FRIEND'] as const) {
      const purePool = bucket.members.filter(
        (m) => !usedIds.has(m.userId) && m.purpose === pCode
      );
      formTablesFromPool(purePool, bucket.cityCode, bucket.scheduleSlot, pCode);
    }

    // Pass 2: 잔여 비-ROMANCE 인원 호환 병합 매칭
    const residualOpen = bucket.members.filter(
      (m) => !usedIds.has(m.userId) && m.purpose !== 'ROMANCE'
    );
    formTablesFromPool(residualOpen, bucket.cityCode, bucket.scheduleSlot);
  }

  const unassigned = participants.filter((p) => !usedIds.has(p.userId));

  // 각 방에 노쇼 대비 스탠바이 후보 최대 2명 연결
  for (const room of rooms) {
    const candidates = unassigned
      .map((u) => {
        const res = scoreUserAgainstRoom(u, room.spec, room.members, axes);
        return {
          member: u,
          score100: res.score100,
          blockedReason: res.blockedReason,
          axisBreakdown: res.axisBreakdown,
        };
      })
      .filter((c) => !c.blockedReason && c.score100 > 0)
      .sort((a, b) => b.score100 - a.score100)
      .slice(0, 2)
      .map(({ member, score100, axisBreakdown }) => ({
        member,
        score100,
        axisBreakdown,
      }));
    room.standbyCandidates = candidates;
  }

  // 대기자 라우팅 (requirePaid=true인데 미입금이면 차단 사유 명시)
  const waitlistRoutings: WaitlistRoutingPlan[] = unassigned.map((u) => {
    if (veganNoVenueUserIds.has(u.userId)) {
      return {
        member: u,
        primaryRoom: rooms[0]
          ? {
              roomId: rooms[0].roomId,
              title: rooms[0].spec.title,
              score100: 0,
              blockedReason: '비건 가능 식당 없음 → 다음 회차 우선 배정',
            }
          : undefined,
        secondaryRoom: undefined,
        eligibleRoomCount: 0,
      };
    }
    if (requirePaid && !u.isPaid) {
      return {
        member: u,
        primaryRoom: rooms[0]
          ? {
              roomId: rooms[0].roomId,
              title: rooms[0].spec.title,
              score100: 0,
              blockedReason: '미입금(결제대기)',
            }
          : undefined,
        secondaryRoom: undefined,
        eligibleRoomCount: 0,
      };
    }
    const rankedRooms: WaitlistRouteOption[] = rooms
      .map((room) => {
        const res = scoreUserAgainstRoom(u, room.spec, room.members, axes);
        return {
          roomId: room.roomId,
          title: room.spec.title,
          score100: res.score100,
          blockedReason: res.blockedReason,
        };
      })
      .sort((a, b) => {
        if (Boolean(a.blockedReason) !== Boolean(b.blockedReason)) {
          return a.blockedReason ? 1 : -1;
        }
        return b.score100 - a.score100;
      });

    const eligible = rankedRooms.filter((r) => !r.blockedReason && r.score100 > 0);
    return {
      member: u,
      primaryRoom: eligible[0] ?? rankedRooms[0],
      secondaryRoom: eligible[1] ?? rankedRooms[1],
      eligibleRoomCount: eligible.length,
    };
  });

  return {
    rooms,
    unassigned,
    waitlistRoutings,
    totalParticipants: participants.length,
    activeAxisCount: activeAxes.length,
  };
}

// ============================================================================
// 5. 적대적 엣지 케이스 5종 자동 검증 (Red-Team Audit)
// ============================================================================

export interface AdversarialAuditCase {
  caseId: string;
  title: string;
  scenario: string;
  status: 'PASS' | 'FAIL';
  detail: string;
}

export function runAdversarialMatchingAudit(): AdversarialAuditCase[] {
  const results: AdversarialAuditCase[] = [];

  // Case 1: 서울 거주자가 부산 모임을 신청했을 때 부산 방에 정상 배정되는가?
  const seoulToBusan = computeUserAxisProfile(
    { userId: '서울거주자', gender: 'M', birthYear: 1990, residenceCity: '서울' },
    [],
    DEFAULT_ADAPTIVE_QUESTIONS,
    DEFAULT_MATCHING_AXES,
    { targetCity: '부산', targetScheduleSlot: '2026-11-20 (금) 19:30', targetPurpose: 'RESET' }
  );
  const busanPool = [
    seoulToBusan,
    ...(['M', 'M', 'F', 'F', 'F'] as const).map((g, i) =>
      computeUserAxisProfile(
        { userId: `부산-${i}`, gender: g, birthYear: 1990, residenceCity: '부산', purpose: 'RESET' },
        []
      )
    ),
  ];
  const res1 = matchDynamicTables(busanPool);
  const case1Pass =
    res1.rooms.length === 1 &&
    res1.rooms[0].spec.cityCode === '부산' &&
    res1.rooms[0].members.some((m) => m.userId === '서울거주자');
  results.push({
    caseId: 'EDGE-01',
    title: '타지역 신청 분리 (서울거주 → 부산신청)',
    scenario: '거주지(서울)와 신청지(부산)가 다를 때 신청지 기준 방으로 배정되는지 검증',
    status: case1Pass ? 'PASS' : 'FAIL',
    detail: case1Pass
      ? `부산 방 1개 편성 완료 (서울거주자 정상 합류)`
      : `타지역 분리 실패 (편성 방 ${res1.rooms.length}개)`,
  });

  // Case 2: 기혼자가 ROMANCE(인연)를 선택했을 때 차단/교정되는가?
  const marriedRomance = computeUserAxisProfile(
    { userId: '기혼신청자', gender: 'M', birthYear: 1988, residenceCity: '서울' },
    [
      { questionId: 'Q01_RELATIONSHIP', version: 1, value: 'MARRIED' },
      { questionId: 'Q04_PURPOSE', version: 1, value: 'ROMANCE' },
    ]
  );
  const case2Pass = marriedRomance.purpose !== 'ROMANCE';
  results.push({
    caseId: 'EDGE-02',
    title: '안전 규칙 (기혼자 ↔ 인연 트랙 차단)',
    scenario: '기혼 회원이 인연(ROMANCE)을 선택해도 인연 풀 진입을 원천 차단하는지 검증',
    status: case2Pass ? 'PASS' : 'FAIL',
    detail: case2Pass
      ? `기혼자 목적 자동 교정 완료 (${marriedRomance.purpose})`
      : `치명 결함: 기혼자가 ROMANCE 풀에 잔류함`,
  });

  // Case 3: 소수 비건 1명이 일반 풀에 섞였을 때 일반 방이 비건 방으로 왜곡되지 않는가?
  const veganUser = computeUserAxisProfile(
    { userId: '비건1인', gender: 'F', birthYear: 1993, residenceCity: '서울', dietary: 'VEGAN', purpose: 'RESET' },
    []
  );
  const normalUsers = (['M', 'M', 'M', 'F', 'F'] as const).map((g, i) =>
    computeUserAxisProfile(
      { userId: `일반-${i}`, gender: g, birthYear: 1993, residenceCity: '서울', dietary: 'NONE', purpose: 'RESET' },
      []
    )
  );
  const res3 = matchDynamicTables([veganUser, ...normalUsers]);
  const res3NoVeganVenue = matchDynamicTables([veganUser, ...normalUsers], DEFAULT_MATCHING_AXES, {
    venues: SAMPLE_PARTNER_VENUES.filter((v) => !v.supportedDietary.includes('VEGAN')),
  });
  const mixedIntoNormalRoom =
    res3.rooms.some((r) => !r.spec.supportsVegan && r.members.some((m) => m.isVegan)) ||
    res3NoVeganVenue.rooms.some((r) => !r.spec.supportsVegan && r.members.some((m) => m.isVegan));
  results.push({
    caseId: 'EDGE-03',
    title: '소수 제약 보호 (비건 1명 일반방 혼입)',
    scenario: '비건 1명이 일반 5명과 섞일 때 비건 가능 식당 방으로만 배정되고 불가 시 대기 처리되는지 검증',
    status: !mixedIntoNormalRoom ? 'PASS' : 'FAIL',
    detail: !mixedIntoNormalRoom
      ? `비건 회원은 비건 지원 식당(${res3.rooms[0]?.assignedVenueName ?? '배정'}) 방에만 합류, 미지원 시 안전 대기`
      : `결함 감지: 비건 미지원 방(${res3.rooms[0]?.spec.title})에 비건 1명이 그대로 편성됨 (식당 식사 불가 리스크)`,
  });

  // Case 4: 편성된 방에 실제 지역 제휴 식당(Venue)·식사 종류·가격이 연결되어 있는가?
  const roomHasVenue =
    res1.rooms.length > 0 &&
    Boolean(res1.rooms[0].assignedVenueId) &&
    res1.rooms[0].venueAssignmentStatus === 'ASSIGNED';
  results.push({
    caseId: 'EDGE-04',
    title: '공급 풀 연동 (지역 식당·음식·가격 확정)',
    scenario: '편성된 방 결과에 실제 지역 제휴 식당(1·2순위)과 식사·예산이 배정되는지 검증',
    status: roomHasVenue ? 'PASS' : 'FAIL',
    detail: roomHasVenue
      ? `1순위 ${res1.rooms[0].assignedVenueName} (${res1.rooms[0].assignedVenueBudgetTier})${res1.rooms[0].backupVenueName ? ` · 2순위 ${res1.rooms[0].backupVenueName}` : ''} 배정 완료`
      : `미구현 결함: 매칭 엔진이 지역별 PartnerVenue(식당·음식·가격) 풀을 조회/배정하지 않음`,
  });

  // Case 5: 설문 미입력 회원(기본값)과 실입력 회원을 구분할 수 있는가?
  const emptyUser = computeUserAxisProfile(
    { userId: '미입력', gender: 'F', birthYear: 1995, residenceCity: '서울' },
    []
  );
  const fullUser = computeUserAxisProfile(
    { userId: '실입력', gender: 'F', birthYear: 1995, residenceCity: '서울' },
    [{ questionId: 'BASE_06_BUDGET', version: 1, value: '$$$' }]
  );
  const case5Pass = emptyUser.isDefaultBudget === true && fullUser.isDefaultBudget === false;
  results.push({
    caseId: 'EDGE-05',
    title: '데이터 투명성 (기본값 vs 실입력 구분)',
    scenario: '설문 미입력 회원의 기본값($$)과 실입력 회원을 시스템이 구분하는지 검증',
    status: case5Pass ? 'PASS' : 'FAIL',
    detail: case5Pass
      ? `미입력(기본값:true, 응답0) vs 실입력(기본값:false, 예산$$$) 정확히 구분`
      : `기본값 구분 플래그 오류`,
  });

  // Case 6: 입금·결제 미완료 회원이 실전 매칭(requirePaid=true) 풀에 진입하지 못하는가?
  const unpaidUser = computeUserAxisProfile(
    { userId: '미입금회원', gender: 'M', birthYear: 1992, residenceCity: '서울', isPaid: false, purpose: 'RESET' },
    []
  );
  const paid5 = (['M', 'M', 'F', 'F', 'F'] as const).map((g, i) =>
    computeUserAxisProfile(
      { userId: `입금-${i}`, gender: g, birthYear: 1992, residenceCity: '서울', isPaid: true, purpose: 'RESET' },
      []
    )
  );
  const res6 = matchDynamicTables([unpaidUser, ...paid5], DEFAULT_MATCHING_AXES, { requirePaid: true });
  const case6Pass =
    res6.rooms.length === 0 &&
    res6.waitlistRoutings[0]?.primaryRoom?.blockedReason === undefined &&
    res6.unassigned.some((u) => u.userId === '미입금회원');
  results.push({
    caseId: 'EDGE-06',
    title: '결제 관문 (미입금자 매칭 진입 차단)',
    scenario: '입금·결제 미완료 회원이 실매칭(requirePaid) 방에 편성되지 않는지 검증',
    status: case6Pass ? 'PASS' : 'FAIL',
    detail: case6Pass
      ? `미입금회원 매칭 풀 진입 차단 완료 (결제완료자 5명만 대기)`
      : `결함: 미입금 회원이 매칭 방에 포함됨`,
  });

  // Case 7: 영구 재매칭 차단(user_blocks) 쌍이 동일 방에 편성되지 않는가?
  const blockerA = computeUserAxisProfile(
    { userId: '차단자A', gender: 'M', birthYear: 1992, residenceCity: '서울', purpose: 'RESET' },
    []
  );
  const blockedB = computeUserAxisProfile(
    { userId: '차단대상B', gender: 'F', birthYear: 1992, residenceCity: '서울', purpose: 'RESET' },
    []
  );
  const others4 = (['M', 'M', 'F', 'F'] as const).map((g, i) =>
    computeUserAxisProfile(
      { userId: `정상-${i}`, gender: g, birthYear: 1992, residenceCity: '서울', purpose: 'RESET' },
      []
    )
  );
  const res7 = matchDynamicTables([blockerA, blockedB, ...others4], DEFAULT_MATCHING_AXES, {
    blockedPairs: [{ fromUserId: '차단자A', blockedUserId: '차단대상B' }],
  });
  const blockedTogether = res7.rooms.some(
    (r) =>
      r.members.some((m) => m.userId === '차단자A') &&
      r.members.some((m) => m.userId === '차단대상B')
  );
  results.push({
    caseId: 'EDGE-07',
    title: '영구 재매칭 차단 (user_blocks)',
    scenario: '상호를 차단·신고한 회원이 동일 테이블에 절대 재편성되지 않는지 검증',
    status: !blockedTogether ? 'PASS' : 'FAIL',
    detail: !blockedTogether
      ? `차단 쌍(차단자A ↔ 차단대상B) 동일 방 편성 원천 차단 완료`
      : `결함: 차단된 두 회원이 같은 방에 편성됨`,
  });

  return results;
}

// ============================================================================
// 6. 통합 매칭 · 식당 배정 · 예외 검증 단일 파이프라인 (Unified Pipeline Runner)
// ============================================================================

export interface UnifiedPipelineInput {
  participants: UserAxisProfile[];
  axes?: MatchingAxisSpec[];
  requirePaid?: boolean;
  coreCount?: number;
  venues?: PartnerVenue[];
  modules?: EngineFeatureModules;
  blockedPairs?: BlockedPair[];
  tableSize?: number;
  enforceGenderBalance?: boolean;
}

export interface UnifiedPipelineResult {
  grouping: DynamicGroupingResult;
  assignedVenueCount: number;
  rolloverCount: number;
  auditCases: AdversarialAuditCase[];
  allAuditPassed: boolean;
}

export type QuizAbVariant = 'A_TIMELEFT_PURE' | 'B_PULSE_EXTENDED';

export interface AbExperimentSpec {
  experimentId: string;
  name: string;
  controlLabel: string;
  variantLabel: string;
  activeMode: 'A_ONLY' | 'AB_SPLIT' | 'B_ONLY';
}

export const DEFAULT_AB_EXPERIMENTS: AbExperimentSpec[] = [
  {
    experimentId: 'EXP_QUIZ_ONBOARDING',
    name: '온보딩 퀴즈 (타임레프트 A안 vs PULSE B안)',
    controlLabel: 'A안: 타임레프트 표준 (BASE 15문항)',
    variantLabel: 'B안: 복제 + 오늘의 컨디션 PULSE (19문항)',
    activeMode: 'A_ONLY',
  },
];

export function runUnifiedMatchingPipeline(
  input: UnifiedPipelineInput
): UnifiedPipelineResult {
  const axes = input.axes ?? DEFAULT_MATCHING_AXES;
  const grouping = matchDynamicTables(input.participants, axes, {
    tableSize: input.tableSize,
    enforceGenderBalance: input.enforceGenderBalance,
    coreCount: input.coreCount,
    requirePaid: input.requirePaid,
    venues: input.venues,
    modules: input.modules,
    blockedPairs: input.blockedPairs,
  });

  const assignedVenueCount = grouping.rooms.filter(
    (r) => r.venueAssignmentStatus === 'ASSIGNED'
  ).length;
  const rolloverCount = grouping.unassigned.length;
  const auditCases = runAdversarialMatchingAudit();
  const allAuditPassed = auditCases.every((c) => c.status === 'PASS');

  return {
    grouping,
    assignedVenueCount,
    rolloverCount,
    auditCases,
    allAuditPassed,
  };
}
