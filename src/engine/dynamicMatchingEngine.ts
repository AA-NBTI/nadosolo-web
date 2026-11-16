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

export type ConstraintTier = 'HARD' | 'CORE' | 'FINE';
export type AxisMatchStrategy =
  | 'EXACT'
  | 'COMPATIBILITY_MAP'
  | 'SIMILARITY'
  | 'COMPLEMENTARY'
  | 'DIVERSITY';

export type QuestionLayer = 'BASE' | 'PULSE';
export type QuestionInputType = 'SINGLE' | 'SCALE_1_5';

export type PurposeCode = 'RESET' | 'FRIEND' | 'TASTE' | 'ROMANCE';
export type RelationshipStatus = 'SINGLE' | 'DATING' | 'MARRIED' | 'OTHER';
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
  /** SCALE_1_5일 때 1점/5점 라벨 및 연결 축 */
  scaleConfig?: {
    minLabel: string;
    maxLabel: string;
    axisWeights: Record<string, { weight: number; invert?: boolean }>;
  };
  /** SINGLE일 때 선택지 */
  options?: AdaptiveQuestionOption[];
}

export interface AdaptiveAnswer {
  questionId: string;
  version: number;
  /** SINGLE이면 optionId, SCALE_1_5이면 1~5 문자열 또는 숫자 */
  value: string | number;
}

/**
 * 질문지 응답으로부터 변환된 표준 이용자 축 프로필
 * 문항이 바뀌어도 매칭 엔진은 이 표준 구조만 참조합니다.
 */
export interface UserAxisProfile {
  userId: string;
  gender: 'M' | 'F';
  birthYear: number;
  relationshipStatus: RelationshipStatus;
  industry: IndustryGroup;
  purpose: PurposeCode;
  budgetTier: '$' | '$$' | '$$$';
  dietary: string;
  cityCode: string;
  /** 동적 축별 0~100 점수 (예: { DEPTH: 75, THEME: 50, ENERGY: 25 }) */
  axisScores: Record<string, number>;
  /** 각 축에서 가장 가까운 단일 명사 앵커 라벨 */
  axisLabels: Record<string, string>;
  /** 오늘의 컨디션(PULSE) 체크 여부 */
  hasPulseUpdate: boolean;
}

export interface RoomTargetSpec {
  roomId: string;
  title: string;
  purpose: PurposeCode;
  /** 목표 축 점수 (0~100) */
  targetAxisScores: Record<string, number>;
  /** 목표 축 앵커 라벨 */
  targetLabels: Record<string, string>;
}

export interface DynamicMatchedRoom {
  roomId: string;
  spec: RoomTargetSpec;
  members: UserAxisProfile[];
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
  totalParticipants: number;
  activeAxisCount: number;
}

// ============================================================================
// 1. 기본 동적 축 레지스트리 (4대 축 · 향후 축 추가/수정 자유)
// ============================================================================

export const PURPOSE_LABELS: Record<PurposeCode, string> = {
  RESET: '변화',
  FRIEND: '교류',
  TASTE: '취향',
  ROMANCE: '인연',
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
// 2. 12(고정 BASE) + 4(오늘의 컨디션 PULSE) = 16문항 적응형 질문지
// ============================================================================

export const DEFAULT_ADAPTIVE_QUESTIONS: AdaptiveQuestionSpec[] = [
  // --- [BASE 1~4: 현재 상황 & 맥락] ---
  {
    id: 'Q01_RELATIONSHIP',
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
      { id: 'OTHER', label: '돌싱 · 기타', metaTag: { relationshipStatus: 'OTHER' } },
    ],
  },
  {
    id: 'Q02_THIRST',
    version: 1,
    layer: 'BASE',
    categoryLabel: '현황',
    questionText: '지금 이 식탁에서 가장 얻고 싶은 변화는 무엇인가요?',
    inputType: 'SINGLE',
    isActive: true,
    options: [
      { id: 'RESET_WORK', label: '일상과 역할에서 벗어난 건강한 환기', axisScores: { DEPTH: 70, THEME: 20 } },
      { id: 'INSIGHT', label: '낯선 분야 사람들과의 지적 영감', axisScores: { DEPTH: 80, THEME: 90 } },
      { id: 'SOCIAL', label: '결이 통하는 동네·취향 친구', axisScores: { DEPTH: 40, THEME: 50 } },
      { id: 'MIRROR', label: '타인의 시선으로 보는 객관적인 나', axisScores: { DEPTH: 75, THEME: 60 } },
    ],
  },
  {
    id: 'Q03_INDUSTRY',
    version: 1,
    layer: 'BASE',
    categoryLabel: '현황',
    questionText: '현재 주로 몸담고 있는 분야를 선택해 주세요.',
    inputType: 'SINGLE',
    isActive: true,
    options: [
      { id: 'IT_TECH', label: 'IT · 테크 · 엔지니어링', metaTag: { industry: 'IT_TECH' } },
      { id: 'FINANCE', label: '금융 · 컨설팅 · 전략', metaTag: { industry: 'FINANCE' } },
      { id: 'DESIGN_ART', label: '디자인 · 예술 · 미디어', metaTag: { industry: 'DESIGN_ART' } },
      { id: 'PRO_SERVICE', label: '의료 · 법조 · 전문직', metaTag: { industry: 'PRO_SERVICE' } },
      { id: 'COMMERCE', label: '마케팅 · 유통 · 브랜드', metaTag: { industry: 'COMMERCE' } },
      { id: 'FOUNDER', label: '창업 · 경영 · 자영업', metaTag: { industry: 'FOUNDER' } },
      { id: 'EDU_PUBLIC', label: '교육 · 연구 · 공공', metaTag: { industry: 'EDU_PUBLIC' } },
      { id: 'OTHER', label: '기타 자유 분야', metaTag: { industry: 'OTHER' } },
    ],
  },
  {
    id: 'Q04_PURPOSE',
    version: 1,
    layer: 'BASE',
    categoryLabel: '현황',
    questionText: '나도솔로에서 지향하는 핵심 모임 목적은 무엇인가요?',
    inputType: 'SINGLE',
    isActive: true,
    options: [
      { id: 'RESET', label: '변화 (일상·사고의 건강한 환기)', metaTag: { purpose: 'RESET' } },
      { id: 'FRIEND', label: '교류 (편안한 사회적 친구)', metaTag: { purpose: 'FRIEND' } },
      { id: 'TASTE', label: '취향 (와인·미식·문화 공감)', metaTag: { purpose: 'TASTE' } },
      { id: 'ROMANCE', label: '인연 (미혼 한정 설레는 만남)', metaTag: { purpose: 'ROMANCE' } },
    ],
  },

  // --- [BASE 5~8: 기본 기질 & 사고방식] ---
  {
    id: 'Q05_BASE_ENERGY',
    version: 1,
    layer: 'BASE',
    categoryLabel: '기질',
    questionText: '평소 처음 만난 사람들의 모임에서 나의 기본 에너지는?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '조용히 듣고 관찰',
      maxLabel: '먼저 말 걸고 주도',
      axisWeights: { ENERGY: { weight: 1.0 } },
    },
  },
  {
    id: 'Q06_SILENCE',
    version: 1,
    layer: 'BASE',
    categoryLabel: '기질',
    questionText: '대화 중 잠깐의 정적이 흘렀을 때 나의 평소 반응은?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '여백으로 편안히 수용',
      maxLabel: '가벼운 질문으로 환기',
      axisWeights: { ENERGY: { weight: 0.7 } },
    },
  },
  {
    id: 'Q07_LOGIC_EMOTION',
    version: 1,
    layer: 'BASE',
    categoryLabel: '기질',
    questionText: '이야기를 풀어가고 판단할 때 더 가까운 중심축은?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '논리 · 팩트 중심',
      maxLabel: '감정 · 공감 중심',
      axisWeights: { DEPTH: { weight: 0.4 } },
    },
  },
  {
    id: 'Q08_HUMOR_CODE',
    version: 1,
    layer: 'BASE',
    categoryLabel: '기질',
    questionText: '내가 가장 편안하게 느끼는 대화의 결은 무엇인가요?',
    inputType: 'SINGLE',
    isActive: true,
    options: [
      { id: 'WIT', label: '위트 있고 유쾌한 티키타카', axisScores: { DEPTH: 25, ENERGY: 75 } },
      { id: 'WARM', label: '따뜻하고 편안한 일상 공감', axisScores: { DEPTH: 45, ENERGY: 45 } },
      { id: 'DEEP_TALK', label: '차분하고 사유적인 깊은 대화', axisScores: { DEPTH: 90, ENERGY: 30 } },
      { id: 'INSIGHT', label: '아이디어와 영감이 오가는 대화', axisScores: { DEPTH: 75, THEME: 90 } },
    ],
  },

  // --- [BASE 9~12: 가치관 & 경계선] ---
  {
    id: 'Q09_SENSITIVE_TOPIC',
    version: 1,
    layer: 'BASE',
    categoryLabel: '경계',
    questionText: '정치·사회·종교 등 민감할 수 있는 이슈 대화에 대한 태도는?',
    inputType: 'SCALE_1_5',
    isActive: true,
    scaleConfig: {
      minLabel: '가급적 피하고 싶음',
      maxLabel: '다름을 존중하며 토론',
      axisWeights: { DEPTH: { weight: 0.3 } },
    },
  },
  {
    id: 'Q10_FEEDBACK_TONE',
    version: 1,
    layer: 'BASE',
    categoryLabel: '경계',
    questionText: '모임 종료 후 동석자들에게 기대하는 관찰 피드백 톤은?',
    inputType: 'SINGLE',
    isActive: true,
    options: [
      { id: 'OBJECTIVE', label: '성장을 위한 솔직·객관적 리포트', axisScores: { DEPTH: 80 } },
      { id: 'BALANCED', label: '객관적 시선과 따뜻한 격려의 균형', axisScores: { DEPTH: 55 } },
      { id: 'WARM', label: '나의 고유한 매력을 짚어주는 응원', axisScores: { DEPTH: 35 } },
    ],
  },
  {
    id: 'Q11_CULTURE_INTEREST',
    version: 1,
    layer: 'BASE',
    categoryLabel: '경계',
    questionText: '식탁에서 가장 즐겁게 이야기할 수 있는 관심 분야는?',
    inputType: 'SINGLE',
    isActive: true,
    options: [
      { id: 'REST', label: '여행 · 쉼 · 소소한 라이프스타일', axisScores: { THEME: 15 } },
      { id: 'GASTRO', label: '미식 · 와인 · 위스키 · 공간', axisScores: { THEME: 45 } },
      { id: 'ART', label: '책 · 전시 · 영화 · 음악', axisScores: { THEME: 70 } },
      { id: 'WORK', label: '비즈니스 · 트렌드 · 자기계발', axisScores: { THEME: 95 } },
    ],
  },
  {
    id: 'Q12_BUDGET',
    version: 1,
    layer: 'BASE',
    categoryLabel: '경계',
    questionText: '현장 1/N 식사 비용으로 가장 편안한 1인 예산 범위는?',
    inputType: 'SINGLE',
    isActive: true,
    options: [
      { id: '$', label: '3만원대 캐주얼 다이닝', metaTag: { budgetTier: '$' } },
      { id: '$$', label: '5~7만원대 비스트로 · 와인바', metaTag: { budgetTier: '$$' } },
      { id: '$$$', label: '10만원 이상 파인 다이닝', metaTag: { budgetTier: '$$$' } },
    ],
  },

  // --- [PULSE 13~16: 오늘의 컨디션 (재방문 시 15초 빠른 체크)] ---
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
      axisWeights: { ENERGY: { weight: 1.8 } }, // 오늘 컨디션 가중치 우선
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

export function computeUserAxisProfile(
  baseInfo: {
    userId: string;
    gender: 'M' | 'F';
    birthYear: number;
    cityCode?: string;
    dietary?: string;
    purpose?: PurposeCode;
    budgetTier?: '$' | '$$' | '$$$';
  },
  answers: AdaptiveAnswer[],
  questions: AdaptiveQuestionSpec[] = DEFAULT_ADAPTIVE_QUESTIONS,
  axes: MatchingAxisSpec[] = DEFAULT_MATCHING_AXES
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
  let budgetTier: '$' | '$$' | '$$$' = baseInfo.budgetTier ?? '$$';
  let hasPulseUpdate = false;

  for (const q of questions) {
    if (!q.isActive) continue;
    const ans = answerMap.get(q.id);
    if (!ans) continue;

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
    } else if (q.inputType === 'SINGLE' && q.options) {
      const opt = q.options.find((o) => o.id === String(ans.value));
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
          budgetTier = opt.metaTag.budgetTier as '$' | '$$' | '$$$';
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

  return {
    userId: baseInfo.userId,
    gender: baseInfo.gender,
    birthYear: baseInfo.birthYear,
    relationshipStatus,
    industry,
    purpose,
    budgetTier,
    dietary: baseInfo.dietary ?? 'NONE',
    cityCode: baseInfo.cityCode ?? 'SEOUL',
    axisScores,
    axisLabels,
    hasPulseUpdate,
  };
}

// ============================================================================
// 4. 동적 100점 정규화 적합도 계산 & 모수별 자동 분화 매칭 엔진
// ============================================================================

/**
 * 특정 이용자(user)가 특정 방(roomSpec)에 얼마나 부합하는지 0~100점으로 산출합니다.
 * 활성화된 축(axes)의 가중치 합을 자동으로 100점으로 정규화합니다.
 */
export function scoreUserAgainstRoom(
  user: UserAxisProfile,
  roomSpec: RoomTargetSpec,
  currentMembers: UserAxisProfile[] = [],
  axes: MatchingAxisSpec[] = DEFAULT_MATCHING_AXES
): { score100: number; blockedReason?: string } {
  // Tier 1 안전선: 기혼/연애중 회원은 ROMANCE 방 진입 불가
  if (
    roomSpec.purpose === 'ROMANCE' &&
    (user.relationshipStatus === 'MARRIED' || user.relationshipStatus === 'DATING')
  ) {
    return { score100: 0, blockedReason: '관계상태-목적 불일치' };
  }

  const activeAxes = axes.filter((a) => a.isActive);
  let totalWeight = 0;
  let weightedSum = 0;

  for (const axis of activeAxes) {
    totalWeight += axis.weight;
    let ratio = 0.5;

    if (axis.axisId === 'PURPOSE') {
      const compat = axis.compatibilityMap?.[roomSpec.purpose]?.[user.purpose] ?? 0;
      if (compat <= 0 && roomSpec.purpose === 'ROMANCE') {
        return { score100: 0, blockedReason: '인연 트랙 전용 격리' };
      }
      ratio = compat;
    } else if (axis.strategy === 'SIMILARITY') {
      const userVal = user.axisScores[axis.axisId] ?? 50;
      const targetVal = roomSpec.targetAxisScores[axis.axisId] ?? 50;
      ratio = Math.max(0, 1 - Math.abs(userVal - targetVal) / 100);
    } else if (axis.strategy === 'COMPLEMENTARY') {
      // 에너지 축: 방 평균을 50(화자-청자 균형)으로 맞추는 방향에 가점
      const userVal = user.axisScores[axis.axisId] ?? 50;
      if (currentMembers.length === 0) {
        ratio = 0.85;
      } else {
        const avg =
          currentMembers.reduce((acc, m) => acc + (m.axisScores[axis.axisId] ?? 50), 0) /
          currentMembers.length;
        const nextAvg = (avg * currentMembers.length + userVal) / (currentMembers.length + 1);
        ratio = Math.max(0, 1 - Math.abs(nextAvg - 50) / 50);
      }
    } else if (axis.strategy === 'DIVERSITY') {
      ratio = 0.8;
    }

    weightedSum += ratio * axis.weight;
  }

  const score100 = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;
  return { score100 };
}

/**
 * 모수(인원 수)에 따라 성사 우선(60점대) -> 핵심 분화(80점대) -> 세부 분화(90점대)로
 * 6인 테이블을 자동 편성합니다.
 */
export function matchDynamicTables(
  participants: UserAxisProfile[],
  axes: MatchingAxisSpec[] = DEFAULT_MATCHING_AXES,
  options: { tableSize?: number; enforceGenderBalance?: boolean } = {}
): DynamicGroupingResult {
  const tableSize = options.tableSize ?? 6;
  const enforceGender = options.enforceGenderBalance ?? true;
  const activeAxes = axes.filter((a) => a.isActive);

  const rooms: DynamicMatchedRoom[] = [];
  const usedIds = new Set<string>();

  // 1단계: ROMANCE 풀과 비-ROMANCE 풀(RESET/FRIEND/TASTE) 분리
  const romancePool = participants.filter((p) => p.purpose === 'ROMANCE');
  const openPool = participants.filter((p) => p.purpose !== 'ROMANCE');

  const processPool = (pool: UserAxisProfile[], isRomance: boolean) => {
    // 모수가 충분할수록(12명, 18명+) DEPTH 및 THEME 기준 정렬 후 순차 분할
    const sorted = [...pool].sort((a, b) => {
      const depthDiff = (a.axisScores.DEPTH ?? 50) - (b.axisScores.DEPTH ?? 50);
      if (depthDiff !== 0) return depthDiff;
      return (a.axisScores.THEME ?? 50) - (b.axisScores.THEME ?? 50);
    });

    while (true) {
      const remaining = sorted.filter((p) => !usedIds.has(p.userId));
      if (remaining.length < tableSize) break;

      let selected: UserAxisProfile[] = [];
      if (enforceGender) {
        const half = Math.floor(tableSize / 2);
        const males = remaining.filter((p) => p.gender === 'M');
        const females = remaining.filter((p) => p.gender === 'F');
        if (males.length < half || females.length < half) break;

        const seed = remaining[0];
        const seedDepth = seed.axisScores.DEPTH ?? 50;
        const pickClosest = (list: UserAxisProfile[], count: number) =>
          [...list]
            .sort(
              (a, b) =>
                Math.abs((a.axisScores.DEPTH ?? 50) - seedDepth) -
                Math.abs((b.axisScores.DEPTH ?? 50) - seedDepth)
            )
            .slice(0, count);

        selected = [...pickClosest(males, half), ...pickClosest(females, half)];
      } else {
        selected = remaining.slice(0, tableSize);
      }

      if (selected.length < tableSize) break;
      for (const m of selected) usedIds.add(m.userId);

      // 방 목표 스펙 계산 (참가자 평균 기반 대표 성격 산출)
      const purposeCounts: Record<PurposeCode, number> = {
        RESET: 0,
        FRIEND: 0,
        TASTE: 0,
        ROMANCE: 0,
      };
      for (const m of selected) purposeCounts[m.purpose]++;
      const dominantPurpose = isRomance
        ? 'ROMANCE'
        : ((Object.entries(purposeCounts).sort((a, b) => b[1] - a[1])[0][0]) as PurposeCode);

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

      const roomId = `DYN-ROOM-${rooms.length + 1}`;
      const spec: RoomTargetSpec = {
        roomId,
        title: `${PURPOSE_LABELS[dominantPurpose]} · ${targetLabels.DEPTH ?? '균형'} · ${targetLabels.THEME ?? '휴식'}`,
        purpose: dominantPurpose,
        targetAxisScores,
        targetLabels,
      };

      const memberScores = selected.map((m) =>
        scoreUserAgainstRoom(m, spec, selected, axes).score100
      );
      const expectedScore100 = Math.round(
        memberScores.reduce((a, b) => a + b, 0) / memberScores.length
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
        expectedScore100,
        relaxedConditions,
        qualityGrade,
      });
    }
  };

  processPool(romancePool, true);
  processPool(openPool, false);

  const unassigned = participants.filter((p) => !usedIds.has(p.userId));
  return {
    rooms,
    unassigned,
    totalParticipants: participants.length,
    activeAxisCount: activeAxes.length,
  };
}
