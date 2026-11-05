import { Gender } from './types';

/**
 * [체계 A: 요소 구분 체계] 5대 대분류 × 5개 중분류 = 25개 표준 요소 (각 20점 × 5 = 100점 정규화)
 */
export type MajorDomainCode = 'APPEARANCE' | 'STYLE' | 'VOICE' | 'CONVERSATION' | 'MANNER';

export interface MajorDomainDef {
  code: MajorDomainCode;
  label: string; // 1단어 표준 명칭: 외모 | 스타일 | 음성 | 대화 | 매너
  weightPercent: number; // 20% (5 × 20 = 100%)
  description: string;
}

export interface SubElementDef {
  id: string; // 예: SUB_APP_EYE
  majorCode: MajorDomainCode;
  slotIndex: 1 | 2 | 3 | 4 | 5; // 대분류 내 1~5번 정규화 슬롯 (각 20점)
  label: string; // 1단어 표준 명칭: 눈 | 코 | 입 | 피부 | 체형 등
  exclusionGroup: string; // 동일 슬롯 중복 방지 제어 코드
  activeInCurrentProcess: boolean; // 현재 모임 평가 프로세스 활성화 여부 (ON/OFF)
  coachingHintLow: string; // 2점 이하 시 개인화 코칭 처방 문구
  coachingHintHigh: string; // 4.5점 이상 시 강점 리포트 문구
}

/**
 * [체계 B: 평가 기준 체계] 5대 평가 기준 (각 4점 × 5 = 중분류 1개당 20점 만점)
 */
export type CriterionCode = 'C1_NEAT' | 'C2_HARMONY' | 'C3_SENSE' | 'C4_STABILITY' | 'C5_APPEAL';

export interface EvaluationCriterionDef {
  code: CriterionCode;
  label: string; // 1단어 표준 명칭: 정돈 | 조화 | 센스 | 안정 | 호감
  stepOrder: 1 | 2 | 3 | 4 | 5;
  maxPoints: 4; // 1~5점 척도를 0.8~4.0점으로 환산 (5개 합산 = 20점)
  definition: string;
}

/**
 * 동석자 1인이 특정 대상(targetUserId)의 특정 중분류(subElementId)를 5대 기준으로 채점한 레코드
 */
export interface MatrixEvaluationRecord {
  recordId: string;
  sessionId: string;
  fromUserId: string;
  fromNickname: string;
  fromGender: Gender;
  toUserId: string;
  subElementId: string;
  // 5대 기준별 1~5점 척도 점수
  scores: Record<CriterionCode, number>;
  createdAt: string;
}

/**
 * 중분류 1개(20점 만점) 집계 결과
 */
export interface SubElementScoreSummary {
  subElementId: string;
  majorCode: MajorDomainCode;
  label: string;
  score20: number; // 20점 만점 환산 점수
  oppositeSexScore20: number; // 이성 관찰자 환산 점수 (20점 만점)
  sameSexScore20: number; // 동성 관찰자 환산 점수 (20점 만점)
  criteriaScores4: Record<CriterionCode, number>; // 각 기준별 4점 만점 점수
  evaluationCount: number;
}

/**
 * 대분류 1개(100점 만점) 집계 결과
 */
export interface MajorDomainScoreSummary {
  majorCode: MajorDomainCode;
  label: string;
  score100: number; // 100점 만점 정규화 점수 (5개 중분류 × 20점)
  oppositeSexScore100: number; // 이성 시선 100점 환산
  sameSexScore100: number; // 동성 시선 100점 환산
  selfScore100: number; // 본인 자가진단 100점 환산
  gapScore: number; // 타인 평가 - 자가 진단 격차
  subSummaries: SubElementScoreSummary[];
}

/**
 * 개인 마스터 프로파일 (Personal Dossier — 5×5×5 100점 표준 지표)
 */
export interface PersonalDossierReport {
  userId: string;
  totalScore100: number; // 5대 대분류 평균 100점 만점
  oppositeSexTotal100: number; // 이성이 평가한 종합 100점
  sameSexTotal100: number; // 동성이 평가한 종합 100점
  domainSummaries: MajorDomainScoreSummary[]; // 5대 대분류 각 100점 성적표
  criteriaRadar20: Record<CriterionCode, number>; // 오각형 5대 기준 지표 (각 20점 만점, 합계 100점)
  topStrengthElements: SubElementScoreSummary[]; // 상위 강점 디테일 3선
  blindSpotElements: SubElementScoreSummary[]; // 집중 교정 필요 사각지대 3선
  earnedBadgeIds: string[]; // 획득한 세분화 뱃지 ID 목록
}

/**
 * 세분화 뱃지 도감 정의 (1모듈 1기능: 뱃지 엔진)
 */
export interface GranularBadgeDef {
  badgeId: string;
  name: string; // 예: 스타일 상의 센스 인증
  icon: string;
  majorCode: MajorDomainCode;
  targetSubElementId?: string; // 특정 중분류 조건일 때
  targetCriterionCode?: CriterionCode; // 특정 평가기준 조건일 때
  minScoreThreshold: number; // 중분류 기준(20점 만점 중 N점) 또는 대분류 기준(100점 만점 중 N점)
  requireOppositeSexVerify: boolean; // 이성 동석자 검증 필수 여부
  description: string;
}

/**
 * 지역 · 상권 정의 (1모듈 1기능: 지역 엔진)
 */
export interface RegionDistrictItem {
  districtId: string;
  countryCode?: string; // 국가 코드: 'kr' | 'jp' | 'us'
  cityCode?: string; // 도시 코드: 'busan' | 'seoul' | 'tokyo'
  districtSlug?: string; // 상권 슬러그: 'haeundae' | 'gwangan' | 'jeonpo' | 'centum' | 'dongnae' | 'seongsu'
  regionName: string; // 권역: 부산 | 서울 | 경기 | 글로벌
  districtName: string; // 상권명: 해운대·마린시티 | 광안리·민락 | 서면·전포 | 성수 등
  active: boolean;
  defaultGatherTime: string; // 예: 토요일 19:00
  description: string;
  tagline?: string;
  heroImage?: string;
  highlights?: string[];
}

/**
 * 조건부 모임 (1모듈 1기능: 모임 조건 게이트)
 */
export interface ConditionalEventItem {
  eventId: string;
  title: string;
  districtId: string;
  venueId: string;
  dateText: string;
  mode: 'ROMANCE' | 'THEME' | 'ONE_ON_ONE'; // 3:3 로맨스 | 미식 모임 | 1:1 매칭
  priceKrw: number;
  targetAgeGroup?: '3045_PRIME' | '5060_GOLDEN' | 'ALL';
  mealNote?: string;
  requiredBadgeIds: string[]; // 필수 보유 뱃지 조건
  minTotalScore100: number; // 최소 종합 점수 커트라인 (0이면 제한 없음)
  minDomainCode?: MajorDomainCode;
  minDomainScore100?: number; // 특정 대분류 최소 점수 조건
  activePresetSubIds: string[]; // 이 모임에서 사용할 평가 중분류 ID 목록
}

/**
 * 서비스 프로세스 모듈 정의 (프로세스 제어용)
 */
export interface ServiceProcessModuleConfig {
  processId: string;
  stepOrder: number;
  label: string; // 1단어/핵심 명칭: 계정정보 | 기본프로필 | 자가진단 | 지역선택 | 모임신청 | 좌석배정 | 대화카드 | 개인평가 | 매칭투표 | 코칭리포트
  enabled: boolean;
  coreRequired: boolean; // 필수 코어 여부
  description: string;
}

// ============================================================================
// 1. 5대 대분류 마스터 정의 (외모 · 스타일 · 음성 · 대화 · 매너)
// ============================================================================
export const INITIAL_MAJOR_DOMAINS: MajorDomainDef[] = [
  {
    code: 'APPEARANCE',
    label: '외모',
    weightPercent: 20,
    description: '신체 조건 및 용모 관리 상태 (20점 × 5요소 = 100점)',
  },
  {
    code: 'STYLE',
    label: '스타일',
    weightPercent: 20,
    description: '착장 아이템 및 스타일링 감각 (20점 × 5요소 = 100점)',
  },
  {
    code: 'VOICE',
    label: '음성',
    weightPercent: 20,
    description: '목소리 질감 및 발화 전달력 (20점 × 5요소 = 100점)',
  },
  {
    code: 'CONVERSATION',
    label: '대화',
    weightPercent: 20,
    description: '언어적 화술 및 상호 소통 역량 (20점 × 5요소 = 100점)',
  },
  {
    code: 'MANNER',
    label: '매너',
    weightPercent: 20,
    description: '비언어적 태도 및 식사·현장 예절 (20점 × 5요소 = 100점)',
  },
];

// ============================================================================
// 2. 5대 평가 기준 마스터 정의 (정돈 · 조화 · 센스 · 안정 · 호감)
// ============================================================================
export const INITIAL_EVALUATION_CRITERIA: EvaluationCriterionDef[] = [
  {
    code: 'C1_NEAT',
    label: '정돈',
    stepOrder: 1,
    maxPoints: 4,
    definition: '결점 없이 깔끔하게 관리·준비된 기초 상태인가?',
  },
  {
    code: 'C2_HARMONY',
    label: '조화',
    stepOrder: 2,
    maxPoints: 4,
    definition: '본인 조건 및 자리·상대방과 균형 있게 어울리는가?',
  },
  {
    code: 'C3_SENSE',
    label: '센스',
    stepOrder: 3,
    maxPoints: 4,
    definition: '세련된 감각이나 재치 있는 포인트가 돋보이는가?',
  },
  {
    code: 'C4_STABILITY',
    label: '안정',
    stepOrder: 4,
    maxPoints: 4,
    definition: '과장되거나 긴장하지 않고 편안한 여유와 신뢰를 주는가?',
  },
  {
    code: 'C5_APPEAL',
    label: '호감',
    stepOrder: 5,
    maxPoints: 4,
    definition: '결과적으로 매력적이며 끌림을 만들어내는가?',
  },
];

// ============================================================================
// 3. 5×5 = 25개 표준 중분류 요소 마스터 정의 (1칸 1단어, 중복 제로)
// ============================================================================
export const INITIAL_SUB_ELEMENTS: SubElementDef[] = [
  // [1. 외모] 눈 · 코 · 입 · 피부 · 체형
  {
    id: 'SUB_APP_1',
    majorCode: 'APPEARANCE',
    slotIndex: 1,
    label: '눈',
    exclusionGroup: 'GRP_APP_1',
    activeInCurrentProcess: true,
    coachingHintLow: '아이컨택 시 눈매가 긴장되어 보일 수 있으니 부드러운 눈웃음을 의식해보세요.',
    coachingHintHigh: '따뜻하고 맑은 눈매가 첫인상에서 가장 큰 호감 포인트로 꼽혔습니다.',
  },
  {
    id: 'SUB_APP_2',
    majorCode: 'APPEARANCE',
    slotIndex: 2,
    label: '코',
    exclusionGroup: 'GRP_APP_2',
    activeInCurrentProcess: false,
    coachingHintLow: '안경테나 헤어 가르마 방향으로 얼굴 중안부의 균형감을 살려보세요.',
    coachingHintHigh: '얼굴 중심선을 잡아주는 단정하고 입체적인 인상이 돋보입니다.',
  },
  {
    id: 'SUB_APP_3',
    majorCode: 'APPEARANCE',
    slotIndex: 3,
    label: '입',
    exclusionGroup: 'GRP_APP_3',
    activeInCurrentProcess: true,
    coachingHintLow: '무표정일 때 입꼬리가 내려가 보일 수 있으니 립 케어와 미소 라인을 점검해보세요.',
    coachingHintHigh: '대화할 때 자연스럽게 올라가는 입꼬리와 깔끔한 인상이 매력적입니다.',
  },
  {
    id: 'SUB_APP_4',
    majorCode: 'APPEARANCE',
    slotIndex: 4,
    label: '피부',
    exclusionGroup: 'GRP_APP_4',
    activeInCurrentProcess: true,
    coachingHintLow: '조명 아래에서 유분기나 건조함이 보이지 않도록 기본 톤 정돈을 추천합니다.',
    coachingHintHigh: '깔끔하고 정돈된 피부톤이 자기관리와 청결도를 높게 보여주었습니다.',
  },
  {
    id: 'SUB_APP_5',
    majorCode: 'APPEARANCE',
    slotIndex: 5,
    label: '체형',
    exclusionGroup: 'GRP_APP_5',
    activeInCurrentProcess: false,
    coachingHintLow: '어깨가 움츠러들지 않도록 바른 체형 실루엣을 유지해보세요.',
    coachingHintHigh: '탄탄하고 균형 잡힌 체형 비율이 실물 호감도를 크게 높였습니다.',
  },

  // [2. 스타일] 헤어 · 상의 · 하의 · 신발 · 소품
  {
    id: 'SUB_STY_1',
    majorCode: 'STYLE',
    slotIndex: 1,
    label: '헤어',
    exclusionGroup: 'GRP_STY_1',
    activeInCurrentProcess: true,
    coachingHintLow: '얼굴형과 이마 라인에 맞춘 앞머리·옆머리 볼륨 정돈이 호감도를 크게 올릴 수 있습니다.',
    coachingHintHigh: '본인 얼굴형에 어울리는 자연스러운 헤어 손질 감각이 돋보였습니다.',
  },
  {
    id: 'SUB_STY_2',
    majorCode: 'STYLE',
    slotIndex: 2,
    label: '상의',
    exclusionGroup: 'GRP_STY_2',
    activeInCurrentProcess: true,
    coachingHintLow: '피부톤을 살려주는 밝은 톤 컬러와 어깨선에 맞는 상의 핏 교정을 추천합니다.',
    coachingHintHigh: '장소 분위기와 본인 체형에 어울리는 상의 컬러·핏 센스가 탁월했습니다.',
  },
  {
    id: 'SUB_STY_3',
    majorCode: 'STYLE',
    slotIndex: 3,
    label: '하의',
    exclusionGroup: 'GRP_STY_3',
    activeInCurrentProcess: false,
    coachingHintLow: '상의와 톤온톤으로 어우러지는 깔끔한 기장감의 슬랙스/하의 매치를 추천합니다.',
    coachingHintHigh: '전체 비율을 살려주는 깔끔한 하의 실루엣이 세련된 인상을 주었습니다.',
  },
  {
    id: 'SUB_STY_4',
    majorCode: 'STYLE',
    slotIndex: 4,
    label: '신발',
    exclusionGroup: 'GRP_STY_4',
    activeInCurrentProcess: false,
    coachingHintLow: '이성은 신발의 청결도와 착장 조화를 세심하게 봅니다. 구두/스니커즈 정돈을 챙겨보세요.',
    coachingHintHigh: '신발까지 깔끔하게 신경 쓴 디테일에서 높은 패션 감각이 느껴졌습니다.',
  },
  {
    id: 'SUB_STY_5',
    majorCode: 'STYLE',
    slotIndex: 5,
    label: '소품',
    exclusionGroup: 'GRP_STY_5',
    activeInCurrentProcess: true,
    coachingHintLow: '과하지 않은 은은한 향수나 안경·시계 포인트 하나로 센스를 더해보세요.',
    coachingHintHigh: '향기와 안경·시계 등 소품 디테일이 이성에게 강한 설렘 포인트를 남겼습니다.',
  },

  // [3. 음성] 음색 · 성량 · 속도 · 발음 · 억양
  {
    id: 'SUB_VOI_1',
    majorCode: 'VOICE',
    slotIndex: 1,
    label: '음색',
    exclusionGroup: 'GRP_VOI_1',
    activeInCurrentProcess: true,
    coachingHintLow: '첫 인사 때 목이 잠기지 않도록 가볍게 목을 풀고 편안한 중저음 톤을 유지해보세요.',
    coachingHintHigh: '듣기 편안하고 따뜻한 목소리 음색이 대화 몰입도를 높였습니다.',
  },
  {
    id: 'SUB_VOI_2',
    majorCode: 'VOICE',
    slotIndex: 2,
    label: '성량',
    exclusionGroup: 'GRP_VOI_2',
    activeInCurrentProcess: false,
    coachingHintLow: '레스토랑 소음 속에서도 맞은편 동석자에게 또렷이 들리도록 성량을 반 톤 높여보세요.',
    coachingHintHigh: '공간 울림에 딱 맞는 안정적인 성량으로 테이블 전체에 편안함을 주었습니다.',
  },
  {
    id: 'SUB_VOI_3',
    majorCode: 'VOICE',
    slotIndex: 3,
    label: '속도',
    exclusionGroup: 'GRP_VOI_3',
    activeInCurrentProcess: true,
    coachingHintLow: '긴장하면 말이 빨라지는 경향이 관찰되었습니다. 문장 끝에 1초의 여유를 두어보세요.',
    coachingHintHigh: '차분하고 여유 있는 말속도가 상대방에게 깊은 신뢰감을 주었습니다.',
  },
  {
    id: 'SUB_VOI_4',
    majorCode: 'VOICE',
    slotIndex: 4,
    label: '발음',
    exclusionGroup: 'GRP_VOI_4',
    activeInCurrentProcess: false,
    coachingHintLow: '말끝을 흐리지 않고 마지막 단어를 또렷하게 맺어주면 전달력이 2배 좋아집니다.',
    coachingHintHigh: '명확하고 깔끔한 발음 덕분에 이야기가 귀에 쏙쏙 들어왔다는 평가입니다.',
  },
  {
    id: 'SUB_VOI_5',
    majorCode: 'VOICE',
    slotIndex: 5,
    label: '억양',
    exclusionGroup: 'GRP_VOI_5',
    activeInCurrentProcess: false,
    coachingHintLow: '단조로운 톤보다는 공감할 때 부드러운 높낮이 리듬을 더해보세요.',
    coachingHintHigh: '다정하고 생동감 있는 억양이 대화 분위기를 한층 부드럽게 만들었습니다.',
  },

  // [4. 대화] 주제 · 질문 · 유머 · 공감 · 비중
  {
    id: 'SUB_CON_1',
    majorCode: 'CONVERSATION',
    slotIndex: 1,
    label: '주제',
    exclusionGroup: 'GRP_CON_1',
    activeInCurrentProcess: false,
    coachingHintLow: '업무/일 이야기 비중을 줄이고 미식·여행·취향 등 감성 주제를 넓혀보세요.',
    coachingHintHigh: '모두가 흥미롭게 참여할 수 있는 풍성하고 지적인 대화 주제가 빛났습니다.',
  },
  {
    id: 'SUB_CON_2',
    majorCode: 'CONVERSATION',
    slotIndex: 2,
    label: '질문',
    exclusionGroup: 'GRP_CON_2',
    activeInCurrentProcess: true,
    coachingHintLow: '본인 답변 후 상대방에게 되묻는 오픈형 꼬리질문을 1개씩만 더 던져보세요.',
    coachingHintHigh: '상대방이 신나서 이야기하게 만드는 센스 있는 질문력이 최고 강점입니다.',
  },
  {
    id: 'SUB_CON_3',
    majorCode: 'CONVERSATION',
    slotIndex: 3,
    label: '유머',
    exclusionGroup: 'GRP_CON_3',
    activeInCurrentProcess: true,
    coachingHintLow: '진지한 대화 중간에 가벼운 위트나 미소를 곁들이면 매력이 배가됩니다.',
    coachingHintHigh: '적재적소에 터지는 세련된 유머 감각이 식탁의 온도를 끌어올렸습니다.',
  },
  {
    id: 'SUB_CON_4',
    majorCode: 'CONVERSATION',
    slotIndex: 4,
    label: '공감',
    exclusionGroup: 'GRP_CON_4',
    activeInCurrentProcess: true,
    coachingHintLow: '해결책이나 조언을 주기보다 상대방의 감정에 먼저 맞장구쳐 주면 호감도가 급상승합니다.',
    coachingHintHigh: '상대의 이야기를 진심으로 받아주는 깊은 공감력이 큰 감동을 주었습니다.',
  },
  {
    id: 'SUB_CON_5',
    majorCode: 'CONVERSATION',
    slotIndex: 5,
    label: '비중',
    exclusionGroup: 'GRP_CON_5',
    activeInCurrentProcess: false,
    coachingHintLow: '한 번에 길게 말하기보다 주고받는 티키타카 호흡을 짧게 가져가 보세요.',
    coachingHintHigh: '말하기와 듣기의 황금 밸런스로 모든 동석자를 편안하게 만들었습니다.',
  },

  // [5. 매너] 표정 · 자세 · 식사 · 음주 · 규칙
  {
    id: 'SUB_MAN_1',
    majorCode: 'MANNER',
    slotIndex: 1,
    label: '표정',
    exclusionGroup: 'GRP_MAN_1',
    activeInCurrentProcess: true,
    coachingHintLow: '듣고 있을 때 무표정이 되지 않도록 따뜻한 미소와 시선 맞춤을 유지해보세요.',
    coachingHintHigh: '모임 내내 유지된 밝고 온화한 표정이 주변 사람들을 안심시켰습니다.',
  },
  {
    id: 'SUB_MAN_2',
    majorCode: 'MANNER',
    slotIndex: 2,
    label: '자세',
    exclusionGroup: 'GRP_MAN_2',
    activeInCurrentProcess: false,
    coachingHintLow: '팔짱을 끼거나 뒤로 기대기보다 상체를 살짝 식탁 쪽으로 기울이면 호감 신호가 전달됩니다.',
    coachingHintHigh: '여유롭고 반듯한 착석 자세에서 기품과 안정감이 느껴졌습니다.',
  },
  {
    id: 'SUB_MAN_3',
    majorCode: 'MANNER',
    slotIndex: 3,
    label: '식사',
    exclusionGroup: 'GRP_MAN_3',
    activeInCurrentProcess: true,
    coachingHintLow: '식기 내려놓는 소리와 주변 동석자의 식사 속도에 조금만 더 보폭을 맞춰보세요.',
    coachingHintHigh: '물·앞접시를 자연스럽게 챙기고 깔끔하게 식사하는 테이블 매너가 만점이었습니다.',
  },
  {
    id: 'SUB_MAN_4',
    majorCode: 'MANNER',
    slotIndex: 4,
    label: '음주',
    exclusionGroup: 'GRP_MAN_4',
    activeInCurrentProcess: false,
    coachingHintLow: '상대의 주량과 속도를 배려하며 천천히 페어링을 즐기는 여유를 추천합니다.',
    coachingHintHigh: '절제력 있고 품격 있는 와인·주류 매너가 인상적이었습니다.',
  },
  {
    id: 'SUB_MAN_5',
    majorCode: 'MANNER',
    slotIndex: 5,
    label: '규칙',
    exclusionGroup: 'GRP_MAN_5',
    activeInCurrentProcess: true,
    coachingHintLow: '모임 중 스마트폰 확인을 최소화하고 도착 시간을 여유 있게 챙겨보세요.',
    coachingHintHigh: '칼같은 시간 엄수와 스마트폰을 보지 않는 100% 집중 매너가 돋보였습니다.',
  },
];

// ============================================================================
// 4. 세분화 뱃지 도감 초기 정의 (5×5×5 점수 조건 연동)
// ============================================================================
export const INITIAL_GRANULAR_BADGES: GranularBadgeDef[] = [
  {
    badgeId: 'BDG_APP_EYE',
    name: '맑은 눈빛 호감',
    icon: '',
    majorCode: 'APPEARANCE',
    targetSubElementId: 'SUB_APP_1',
    minScoreThreshold: 17,
    requireOppositeSexVerify: true,
    description: '[외모 > 눈] 항목에서 이성 동석자 평점 17점(20점 만점) 이상 달성',
  },
  {
    badgeId: 'BDG_STY_TOP',
    name: '베스트 스타일 핏',
    icon: '',
    majorCode: 'STYLE',
    targetSubElementId: 'SUB_STY_2',
    minScoreThreshold: 17,
    requireOppositeSexVerify: true,
    description: '[스타일 > 상의] 정돈·조화·센스 합산 17점(20점 만점) 이상 달성',
  },
  {
    badgeId: 'BDG_STY_SENSE',
    name: '디테일 센스 장인',
    icon: '',
    majorCode: 'STYLE',
    targetCriterionCode: 'C3_SENSE',
    minScoreThreshold: 17,
    requireOppositeSexVerify: true,
    description: '전 영역 [센스(C3)] 지표 17점(20점 만점) 이상 달성',
  },
  {
    badgeId: 'BDG_VOI_TONE',
    name: '신뢰의 꿀보이스',
    icon: '',
    majorCode: 'VOICE',
    targetSubElementId: 'SUB_VOI_1',
    minScoreThreshold: 17,
    requireOppositeSexVerify: false,
    description: '[음성 > 음색] 항목 17점(20점 만점) 이상 달성',
  },
  {
    badgeId: 'BDG_CON_QUESTION',
    name: '질문의 마법사',
    icon: '',
    majorCode: 'CONVERSATION',
    targetSubElementId: 'SUB_CON_2',
    minScoreThreshold: 17,
    requireOppositeSexVerify: false,
    description: '[대화 > 질문] 항목 17점(20점 만점) 이상 달성',
  },
  {
    badgeId: 'BDG_CON_EMPATHY',
    name: '프로 공감 리스너',
    icon: '',
    majorCode: 'CONVERSATION',
    targetSubElementId: 'SUB_CON_4',
    minScoreThreshold: 18,
    requireOppositeSexVerify: false,
    description: '[대화 > 공감] 항목 18점(20점 만점) 이상 달성',
  },
  {
    badgeId: 'BDG_MAN_DINING',
    name: '퍼펙트 식사매너',
    icon: '',
    majorCode: 'MANNER',
    targetSubElementId: 'SUB_MAN_3',
    minScoreThreshold: 18,
    requireOppositeSexVerify: true,
    description: '[매너 > 식사] 항목 이성 검증 18점(20점 만점) 이상 달성',
  },
  {
    badgeId: 'BDG_MAN_RULE',
    name: '노쇼제로 시간엄수',
    icon: '',
    majorCode: 'MANNER',
    targetSubElementId: 'SUB_MAN_5',
    minScoreThreshold: 18,
    requireOppositeSexVerify: false,
    description: '[매너 > 규칙] 시간 엄수 및 집중도 18점 이상 달성',
  },
];

// ============================================================================
// 5. 지역 · 상권 초기 데이터 (글로벌 3계층 아키텍처: country / city / district)
// ============================================================================
export const INITIAL_REGION_DISTRICTS: RegionDistrictItem[] = [
  // --- 🇰🇷 대한민국 · 부산 3대 골든 타겟 축 (초기 집중 독점) ---
  {
    districtId: 'DIST_HAEUNDAE',
    countryCode: 'kr',
    cityCode: 'busan',
    districtSlug: 'haeundae',
    regionName: '부산',
    districtName: '해운대·센텀',
    active: true,
    defaultGatherTime: '토요일 19:00',
    description: '마린시티 오션 테라스 & 센텀 독립 룸 파인다이닝, 종합 80점 이상 검증 매너 클럽',
    tagline: '문현 금융단지 & 전문직 하이엔드 프라이빗 클럽',
    heroImage: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&w=1200&q=80',
    highlights: ['금융·의료·전문직 VIP', '마린시티 독립 룸', '종합 80점 이상 인증제'],
  },
  {
    districtId: 'DIST_GWANGAN',
    countryCode: 'kr',
    cityCode: 'busan',
    districtSlug: 'gwangan',
    regionName: '부산',
    districtName: '광안리·민락',
    active: true,
    defaultGatherTime: '금요일 19:30',
    description: '광안대교 파노라마 통창 뷰 & 트렌디 내추럴 와인 페어링, 금요일 밤 6인 시그니처 디너',
    tagline: '광안대교 다이아몬드 야경 3:3 시그니처 로맨스',
    heroImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    highlights: ['광안대교 다이아몬드 야경', '2030 직장인 로맨스', '내추럴 와인 페어링'],
  },
  {
    districtId: 'DIST_JEONPO',
    countryCode: 'kr',
    cityCode: 'busan',
    districtSlug: 'jeonpo',
    regionName: '부산',
    districtName: '서면·전포',
    active: true,
    defaultGatherTime: '토요일 18:30',
    description: '전포 카페거리 아티장 비스트로 & 스타트업·크리에이터·전문직 취향 딥토크',
    tagline: '전리단길 셰프 비스트로 & 2030 영프로페셔널',
    heroImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    highlights: ['2030 영프로페셔널', '전리단길 아티장 비스트로', '취향 & 가치관 딥토크'],
  },

  // --- 🇰🇷 대한민국 · 서울 (2차 확장 대기 권역) ---
  {
    districtId: 'DIST_SEONGSU',
    countryCode: 'kr',
    cityCode: 'seoul',
    districtSlug: 'seongsu',
    regionName: '서울',
    districtName: '성수',
    active: true,
    defaultGatherTime: '토요일 19:00',
    description: '성수·서울숲 와인바 및 프라이빗 다이닝 권역',
    tagline: '서울숲 아티장 와인바 & 크리에이티브 디너',
    heroImage: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    districtId: 'DIST_HANNAM',
    countryCode: 'kr',
    cityCode: 'seoul',
    districtSlug: 'hannam',
    regionName: '서울',
    districtName: '한남',
    active: true,
    defaultGatherTime: '금요일 19:30',
    description: '한남·이태원 파인다이닝 및 라운지 권역',
    tagline: '한남동 하이엔드 파인다이닝 & 라운지',
    heroImage: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80',
  },
  {
    districtId: 'DIST_GANGNAM',
    countryCode: 'kr',
    cityCode: 'seoul',
    districtSlug: 'gangnam',
    regionName: '서울',
    districtName: '강남',
    active: true,
    defaultGatherTime: '토요일 18:30',
    description: '청담·압구정·강남 프라이빗 룸 다이닝 권역',
    tagline: '청담·압구정 1:1 프라이빗 매칭 룸',
    heroImage: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
  },
];

// ============================================================================
// 6. 조건부 모임 초기 데이터 (부산 3대 골든 축 중심 + 3045/5060 트랙 & 2.5만 원 티켓제)
// ============================================================================
export const INITIAL_CONDITIONAL_EVENTS: ConditionalEventItem[] = [
  // --- 부산 핵심 모임 (Timeleft식 2.5만 원 참가비 + 식대 현장 1/N) ---
  {
    eventId: 'EVT_BUSAN_JEONPO_3045',
    title: '서면·전포 3045 프라임 직장인·사업가 디너',
    districtId: 'DIST_JEONPO',
    venueId: 'VEN_BUSAN_JEONPO_03',
    dateText: '이번 주 금요일 19:30',
    mode: 'ROMANCE',
    priceKrw: 25000,
    targetAgeGroup: '3045_PRIME',
    mealNote: '식사 및 주류 비용은 식당 현장에서 동행자들과 1/N 정산됩니다.',
    requiredBadgeIds: [],
    minTotalScore100: 0,
    activePresetSubIds: ['SUB_STY_2', 'SUB_CON_1', 'SUB_CON_2', 'SUB_CON_3', 'SUB_MAN_1'],
  },
  {
    eventId: 'EVT_BUSAN_5060_GOLDEN',
    title: '부산 5060 골든 솔로 와인 & 다이닝 (인생 2막 동반자/교류)',
    districtId: 'DIST_JEONPO',
    venueId: 'VEN_BUSAN_JEONPO_03',
    dateText: '이번 주 토요일 17:30',
    mode: 'THEME',
    priceKrw: 25000,
    targetAgeGroup: '5060_GOLDEN',
    mealNote: '식사 및 주류 비용은 식당 현장에서 동행자들과 1/N 정산됩니다.',
    requiredBadgeIds: [],
    minTotalScore100: 0,
    activePresetSubIds: ['SUB_APP_1', 'SUB_CON_3', 'SUB_MAN_1', 'SUB_MAN_2', 'SUB_MAN_3'],
  },
  {
    eventId: 'EVT_BUSAN_HAEUNDAE_VIP',
    title: '해운대·센텀 3045 커리어 & 비즈니스 디너 (매너 뱃지 조건부)',
    districtId: 'DIST_HAEUNDAE',
    venueId: 'VEN_BUSAN_HAEUNDAE_01',
    dateText: '다음 주 금요일 19:30',
    mode: 'ROMANCE',
    priceKrw: 25000,
    targetAgeGroup: '3045_PRIME',
    mealNote: '식사 및 주류 비용은 식당 현장에서 동행자들과 1/N 정산됩니다.',
    requiredBadgeIds: ['BDG_MAN_DINING', 'BDG_CON_EMPATHY'],
    minTotalScore100: 80,
    minDomainCode: 'MANNER',
    minDomainScore100: 85,
    activePresetSubIds: ['SUB_STY_1', 'SUB_STY_2', 'SUB_CON_3', 'SUB_CON_4', 'SUB_MAN_3'],
  },
  {
    eventId: 'EVT_BUSAN_GWANGAN_ROMANCE',
    title: '광안리 광안대교 오션뷰 3040 로맨틱 다이닝',
    districtId: 'DIST_GWANGAN',
    venueId: 'VEN_BUSAN_GWANGAN_02',
    dateText: '매주 금요일 19:30',
    mode: 'ROMANCE',
    priceKrw: 25000,
    targetAgeGroup: '3045_PRIME',
    mealNote: '식사 및 주류 비용은 식당 현장에서 동행자들과 1/N 정산됩니다.',
    requiredBadgeIds: [],
    minTotalScore100: 0,
    activePresetSubIds: ['SUB_APP_1', 'SUB_STY_1', 'SUB_VOI_1', 'SUB_CON_4', 'SUB_MAN_2'],
  },

  // --- 서울 확장 대기 모임 ---
  {
    eventId: 'EVT_SEONGSU_ROMANCE',
    title: '성수 3040 프라임 와인 다이닝',
    districtId: 'DIST_SEONGSU',
    venueId: 'VEN_SEONGSU_01',
    dateText: '사전 알림 예약중',
    mode: 'ROMANCE',
    priceKrw: 25000,
    targetAgeGroup: '3045_PRIME',
    mealNote: '식사 및 주류 비용은 식당 현장에서 동행자들과 1/N 정산됩니다.',
    requiredBadgeIds: [],
    minTotalScore100: 0,
    activePresetSubIds: ['SUB_APP_1', 'SUB_STY_2', 'SUB_VOI_3', 'SUB_CON_2', 'SUB_MAN_3'],
  },
  {
    eventId: 'EVT_HANNAM_MANNER_VIP',
    title: '한남 검증 매너 클럽 다이닝 (뱃지 조건부)',
    districtId: 'DIST_HANNAM',
    venueId: 'VEN_SEONGSU_02',
    dateText: '사전 알림 예약중',
    mode: 'ROMANCE',
    priceKrw: 35000,
    targetAgeGroup: '3045_PRIME',
    mealNote: '식사 및 주류 비용은 식당 현장에서 동행자들과 1/N 정산됩니다.',
    requiredBadgeIds: ['BDG_MAN_DINING', 'BDG_CON_EMPATHY'],
    minTotalScore100: 80,
    minDomainCode: 'MANNER',
    minDomainScore100: 85,
    activePresetSubIds: ['SUB_STY_1', 'SUB_STY_2', 'SUB_CON_3', 'SUB_CON_4', 'SUB_MAN_3'],
  },
  {
    eventId: 'EVT_GANGNAM_1ON1',
    title: '청담 결혼전제 1:1 프라이빗 매칭 (실전 프로파일 검증)',
    districtId: 'DIST_GANGNAM',
    venueId: 'VEN_SEONGSU_01',
    dateText: '사전 알림 예약중',
    mode: 'ONE_ON_ONE',
    priceKrw: 120000,
    requiredBadgeIds: ['BDG_MAN_RULE'],
    minTotalScore100: 82,
    activePresetSubIds: ['SUB_APP_4', 'SUB_STY_2', 'SUB_VOI_1', 'SUB_CON_4', 'SUB_MAN_3'],
  },
];

// ============================================================================
// 7. 서비스 프로세스 모듈 초기 설정 (1모듈 1기능)
// ============================================================================
export const INITIAL_SERVICE_PROCESS_MODULES: ServiceProcessModuleConfig[] = [
  {
    processId: 'P01_ACCOUNT',
    stepOrder: 1,
    label: '계정정보',
    enabled: true,
    coreRequired: true,
    description: '@핸들 아이디, 이메일, 연락처, 본인인증 관리',
  },
  {
    processId: 'P02_PROFILE',
    stepOrder: 2,
    label: '기본프로필',
    enabled: true,
    coreRequired: true,
    description: '성별, 출생연도, 직업, 식단, 관심사 등록',
  },
  {
    processId: 'P03_SELF_DIAG',
    stepOrder: 3,
    label: '자가진단',
    enabled: true,
    coreRequired: false,
    description: '5대 대분류(외모·스타일·음성·대화·매너) 본인 예상 점수 입력',
  },
  {
    processId: 'P04_REGION',
    stepOrder: 4,
    label: '지역선택',
    enabled: true,
    coreRequired: true,
    description: '권역 및 세부 상권·제휴 매장 선택',
  },
  {
    processId: 'P05_EVENT_APPLY',
    stepOrder: 5,
    label: '모임신청',
    enabled: true,
    coreRequired: true,
    description: '일반 모임 및 뱃지·점수 조건부 모임 참가 신청',
  },
  {
    processId: 'P06_SEAT',
    stepOrder: 6,
    label: '좌석배정',
    enabled: true,
    coreRequired: false,
    description: '6인 테이블 배정 및 1부/2부 좌석 위치 확인',
  },
  {
    processId: 'P07_DECK',
    stepOrder: 7,
    label: '대화카드',
    enabled: true,
    coreRequired: false,
    description: '라운드별 질문 카드 양방향(이전/다음/전체) 리더기',
  },
  {
    processId: 'P08_EVALUATION',
    stepOrder: 8,
    label: '개인평가',
    enabled: true,
    coreRequired: false,
    description: '동석자 5×5×5 정규화 평가 (정돈·조화·센스·안정·호감)',
  },
  {
    processId: 'P09_VOTE',
    stepOrder: 9,
    label: '매칭투표',
    enabled: true,
    coreRequired: false,
    description: '시크릿 호감 투표 및 상호 매칭 결과 확인',
  },
  {
    processId: 'P10_REPORT',
    stepOrder: 10,
    label: '코칭리포트',
    enabled: true,
    coreRequired: false,
    description: '개인 마스터 프로파일(100점 성적표·오각형 지표·뱃지·1:1 코칭)',
  },
];

// ============================================================================
// 8. 초기 동석자 5인(이성 3 · 동성 2) 정밀 평가 샘플 데이터 (대상: U01)
// ============================================================================
export const INITIAL_MATRIX_EVALUATIONS: MatrixEvaluationRecord[] = [
  // 이성 동석자 1 (F/M 구분용) - 눈, 상의, 속도, 질문, 식사 등 정밀 평가
  {
    recordId: 'REC_01',
    sessionId: 'SES_SEONGSU_38',
    fromUserId: 'U04',
    fromNickname: '현우',
    fromGender: 'M',
    toUserId: 'U01',
    subElementId: 'SUB_APP_1', // 외모 > 눈
    scores: { C1_NEAT: 5, C2_HARMONY: 5, C3_SENSE: 4, C4_STABILITY: 5, C5_APPEAL: 5 },
    createdAt: '2026-11-03T21:10:00Z',
  },
  {
    recordId: 'REC_02',
    sessionId: 'SES_SEONGSU_38',
    fromUserId: 'U04',
    fromNickname: '현우',
    fromGender: 'M',
    toUserId: 'U01',
    subElementId: 'SUB_APP_3', // 외모 > 입
    scores: { C1_NEAT: 5, C2_HARMONY: 4, C3_SENSE: 4, C4_STABILITY: 5, C5_APPEAL: 5 },
    createdAt: '2026-11-03T21:10:00Z',
  },
  {
    recordId: 'REC_03',
    sessionId: 'SES_SEONGSU_38',
    fromUserId: 'U04',
    fromNickname: '현우',
    fromGender: 'M',
    toUserId: 'U01',
    subElementId: 'SUB_APP_4', // 외모 > 피부
    scores: { C1_NEAT: 5, C2_HARMONY: 5, C3_SENSE: 4, C4_STABILITY: 5, C5_APPEAL: 4 },
    createdAt: '2026-11-03T21:10:00Z',
  },
  {
    recordId: 'REC_04',
    sessionId: 'SES_SEONGSU_38',
    fromUserId: 'U04',
    fromNickname: '현우',
    fromGender: 'M',
    toUserId: 'U01',
    subElementId: 'SUB_STY_1', // 스타일 > 헤어
    scores: { C1_NEAT: 4, C2_HARMONY: 3, C3_SENSE: 2, C4_STABILITY: 4, C5_APPEAL: 3 },
    createdAt: '2026-11-03T21:11:00Z',
  },
  {
    recordId: 'REC_05',
    sessionId: 'SES_SEONGSU_38',
    fromUserId: 'U04',
    fromNickname: '현우',
    fromGender: 'M',
    toUserId: 'U01',
    subElementId: 'SUB_STY_2', // 스타일 > 상의
    scores: { C1_NEAT: 5, C2_HARMONY: 3, C3_SENSE: 2, C4_STABILITY: 4, C5_APPEAL: 3 },
    createdAt: '2026-11-03T21:11:00Z',
  },
  {
    recordId: 'REC_06',
    sessionId: 'SES_SEONGSU_38',
    fromUserId: 'U05',
    fromNickname: '도윤',
    fromGender: 'M',
    toUserId: 'U01',
    subElementId: 'SUB_STY_5', // 스타일 > 소품
    scores: { C1_NEAT: 4, C2_HARMONY: 4, C3_SENSE: 3, C4_STABILITY: 4, C5_APPEAL: 4 },
    createdAt: '2026-11-03T21:12:00Z',
  },
  {
    recordId: 'REC_07',
    sessionId: 'SES_SEONGSU_38',
    fromUserId: 'U05',
    fromNickname: '도윤',
    fromGender: 'M',
    toUserId: 'U01',
    subElementId: 'SUB_VOI_1', // 음성 > 음색
    scores: { C1_NEAT: 5, C2_HARMONY: 5, C3_SENSE: 4, C4_STABILITY: 5, C5_APPEAL: 5 },
    createdAt: '2026-11-03T21:12:00Z',
  },
  {
    recordId: 'REC_08',
    sessionId: 'SES_SEONGSU_38',
    fromUserId: 'U06',
    fromNickname: '준호',
    fromGender: 'M',
    toUserId: 'U01',
    subElementId: 'SUB_VOI_3', // 음성 > 속도 (살짝 빠름 -> 안정/조화 낮음)
    scores: { C1_NEAT: 4, C2_HARMONY: 2, C3_SENSE: 3, C4_STABILITY: 2, C5_APPEAL: 3 },
    createdAt: '2026-11-03T21:13:00Z',
  },
  {
    recordId: 'REC_09',
    sessionId: 'SES_SEONGSU_38',
    fromUserId: 'U06',
    fromNickname: '준호',
    fromGender: 'M',
    toUserId: 'U01',
    subElementId: 'SUB_CON_2', // 대화 > 질문
    scores: { C1_NEAT: 5, C2_HARMONY: 5, C3_SENSE: 5, C4_STABILITY: 4, C5_APPEAL: 5 },
    createdAt: '2026-11-03T21:13:00Z',
  },
  {
    recordId: 'REC_10',
    sessionId: 'SES_SEONGSU_38',
    fromUserId: 'U02',
    fromNickname: '서연',
    fromGender: 'F',
    toUserId: 'U01',
    subElementId: 'SUB_CON_3', // 대화 > 유머
    scores: { C1_NEAT: 4, C2_HARMONY: 4, C3_SENSE: 4, C4_STABILITY: 4, C5_APPEAL: 4 },
    createdAt: '2026-11-03T21:14:00Z',
  },
  {
    recordId: 'REC_11',
    sessionId: 'SES_SEONGSU_38',
    fromUserId: 'U02',
    fromNickname: '서연',
    fromGender: 'F',
    toUserId: 'U01',
    subElementId: 'SUB_CON_4', // 대화 > 공감
    scores: { C1_NEAT: 5, C2_HARMONY: 5, C3_SENSE: 5, C4_STABILITY: 5, C5_APPEAL: 5 },
    createdAt: '2026-11-03T21:14:00Z',
  },
  {
    recordId: 'REC_12',
    sessionId: 'SES_SEONGSU_38',
    fromUserId: 'U03',
    fromNickname: '민지',
    fromGender: 'F',
    toUserId: 'U01',
    subElementId: 'SUB_MAN_1', // 매너 > 표정
    scores: { C1_NEAT: 5, C2_HARMONY: 5, C3_SENSE: 4, C4_STABILITY: 5, C5_APPEAL: 5 },
    createdAt: '2026-11-03T21:15:00Z',
  },
  {
    recordId: 'REC_13',
    sessionId: 'SES_SEONGSU_38',
    fromUserId: 'U04',
    fromNickname: '현우',
    fromGender: 'M',
    toUserId: 'U01',
    subElementId: 'SUB_MAN_3', // 매너 > 식사
    scores: { C1_NEAT: 5, C2_HARMONY: 5, C3_SENSE: 5, C4_STABILITY: 5, C5_APPEAL: 5 },
    createdAt: '2026-11-03T21:15:00Z',
  },
  {
    recordId: 'REC_14',
    sessionId: 'SES_SEONGSU_38',
    fromUserId: 'U03',
    fromNickname: '민지',
    fromGender: 'F',
    toUserId: 'U01',
    subElementId: 'SUB_MAN_5', // 매너 > 규칙
    scores: { C1_NEAT: 5, C2_HARMONY: 5, C3_SENSE: 5, C4_STABILITY: 5, C5_APPEAL: 5 },
    createdAt: '2026-11-03T21:15:00Z',
  },
];

// ============================================================================
// 9. 5×5×5 정규화 평가 & 코칭 계산 엔진 클래스
// ============================================================================
export class EvaluationMatrixEngine {
  /**
   * 1~5점 척도로 입력된 5대 기준 점수를 20점 만점(기준당 4점 × 5)으로 정규화 환산
   */
  public static computeSubScore20(scores: Record<CriterionCode, number>): number {
    const criteria: CriterionCode[] = [
      'C1_NEAT',
      'C2_HARMONY',
      'C3_SENSE',
      'C4_STABILITY',
      'C5_APPEAL',
    ];
    // 각 기준은 1~5점으로 입력되며, (점수 / 5) * 4점 = 최대 4점
    const sum20 = criteria.reduce((acc, code) => {
      const raw = scores[code] ?? 3;
      return acc + (raw / 5) * 4;
    }, 0);
    return Math.round(sum20 * 10) / 10;
  }

  /**
   * 특정 회원의 [개인 마스터 프로파일 (5×5×5 100점 성적표 + 오각형 지표 + 뱃지)] 산출
   */
  public static buildPersonalDossier(params: {
    userId: string;
    userGender: Gender;
    majorDomains: MajorDomainDef[];
    subElements: SubElementDef[];
    records: MatrixEvaluationRecord[];
    selfDomainScores100: Record<MajorDomainCode, number>;
    badges: GranularBadgeDef[];
  }): PersonalDossierReport {
    const userRecords = params.records.filter((r) => r.toUserId === params.userId);

    const criteriaCodes: CriterionCode[] = [
      'C1_NEAT',
      'C2_HARMONY',
      'C3_SENSE',
      'C4_STABILITY',
      'C5_APPEAL',
    ];

    // 1) 중분류별(25개) 20점 만점 집계
    const subSummaries: SubElementScoreSummary[] = params.subElements.map((sub) => {
      const subRecs = userRecords.filter((r) => r.subElementId === sub.id);
      const oppRecs = subRecs.filter((r) => r.fromGender !== params.userGender);
      const sameRecs = subRecs.filter((r) => r.fromGender === params.userGender);

      const calcAvg20 = (list: MatrixEvaluationRecord[], fallback: number): number => {
        if (list.length === 0) return fallback;
        const total = list.reduce((s, r) => s + this.computeSubScore20(r.scores), 0);
        return Math.round((total / list.length) * 10) / 10;
      };

      const baseScore20 = calcAvg20(subRecs, 15.2); // 미평가 중분류는 기본 평균값(15.2/20 = 76%)으로 정규화 보정
      const oppScore20 = calcAvg20(oppRecs, baseScore20);
      const sameScore20 = calcAvg20(sameRecs, baseScore20);

      const criteriaScores4: Record<CriterionCode, number> = {
        C1_NEAT: 3.0,
        C2_HARMONY: 3.0,
        C3_SENSE: 3.0,
        C4_STABILITY: 3.0,
        C5_APPEAL: 3.0,
      };

      for (const cCode of criteriaCodes) {
        if (subRecs.length > 0) {
          const avgRaw =
            subRecs.reduce((s, r) => s + (r.scores[cCode] ?? 3), 0) / subRecs.length;
          criteriaScores4[cCode] = Math.round(((avgRaw / 5) * 4) * 10) / 10;
        }
      }

      return {
        subElementId: sub.id,
        majorCode: sub.majorCode,
        label: sub.label,
        score20: baseScore20,
        oppositeSexScore20: oppScore20,
        sameSexScore20: sameScore20,
        criteriaScores4,
        evaluationCount: subRecs.length,
      };
    });

    // 2) 대분류별(5개) 100점 만점 집계 (각 대분류 산하 5개 중분류 합산 = 20 × 5 = 100점)
    const domainSummaries: MajorDomainScoreSummary[] = params.majorDomains.map((dom) => {
      const domSubs = subSummaries.filter((s) => s.majorCode === dom.code);
      const evaluatedSubs = domSubs.filter((s) => s.evaluationCount > 0);
      const targetList = evaluatedSubs.length > 0 ? evaluatedSubs : domSubs;

      const avgSub20 =
        targetList.reduce((s, x) => s + x.score20, 0) / Math.max(1, targetList.length);
      const avgOpp20 =
        targetList.reduce((s, x) => s + x.oppositeSexScore20, 0) /
        Math.max(1, targetList.length);
      const avgSame20 =
        targetList.reduce((s, x) => s + x.sameSexScore20, 0) /
        Math.max(1, targetList.length);

      // 5개 중분류 환산 (평균 20점 만점 × 5 = 100점 만점)
      const score100 = Math.round(avgSub20 * 5);
      const oppositeSexScore100 = Math.round(avgOpp20 * 5);
      const sameSexScore100 = Math.round(avgSame20 * 5);
      const selfScore100 = params.selfDomainScores100[dom.code] ?? 75;

      return {
        majorCode: dom.code,
        label: dom.label,
        score100,
        oppositeSexScore100,
        sameSexScore100,
        selfScore100,
        gapScore: score100 - selfScore100,
        subSummaries: domSubs,
      };
    });

    // 3) 개인 종합 100점 점수 (5대 대분류 각 20% = 평균)
    const totalScore100 = Math.round(
      domainSummaries.reduce((s, d) => s + d.score100, 0) / domainSummaries.length
    );
    const oppositeSexTotal100 = Math.round(
      domainSummaries.reduce((s, d) => s + d.oppositeSexScore100, 0) /
        domainSummaries.length
    );
    const sameSexTotal100 = Math.round(
      domainSummaries.reduce((s, d) => s + d.sameSexScore100, 0) /
        domainSummaries.length
    );

    // 4) 오각형 5대 평가 기준 지표 (정돈·조화·센스·안정·호감 각 20점 만점, 합산 100점)
    const criteriaRadar20: Record<CriterionCode, number> = {
      C1_NEAT: 15,
      C2_HARMONY: 15,
      C3_SENSE: 15,
      C4_STABILITY: 15,
      C5_APPEAL: 15,
    };

    if (userRecords.length > 0) {
      for (const cCode of criteriaCodes) {
        const avgRaw5 =
          userRecords.reduce((s, r) => s + (r.scores[cCode] ?? 3), 0) /
          userRecords.length;
        // 5점 만점 평균 × 4 = 20점 만점
        criteriaRadar20[cCode] = Math.round(avgRaw5 * 4 * 10) / 10;
      }
    }

    // 5) 실제 평가된 중분류 중 상위 강점 3선 & 보완 사각지대 3선 추출
    const evaluatedOnly = subSummaries.filter((s) => s.evaluationCount > 0);
    const sortedDesc = [...evaluatedOnly].sort((a, b) => b.score20 - a.score20);
    const sortedAsc = [...evaluatedOnly].sort((a, b) => a.score20 - b.score20);

    const topStrengthElements = sortedDesc.slice(0, 3);
    const blindSpotElements = sortedAsc.filter((s) => s.score20 < 17).slice(0, 3);

    // 6) 세분화 뱃지 도감 자동 판별
    const earnedBadgeIds: string[] = [];
    for (const badge of params.badges) {
      if (badge.targetSubElementId) {
        const subStat = subSummaries.find(
          (s) => s.subElementId === badge.targetSubElementId
        );
        if (subStat && subStat.evaluationCount > 0) {
          const checkScore = badge.requireOppositeSexVerify
            ? subStat.oppositeSexScore20
            : subStat.score20;
          if (checkScore >= badge.minScoreThreshold) {
            earnedBadgeIds.push(badge.badgeId);
          }
        }
      } else if (badge.targetCriterionCode) {
        const critScore20 = criteriaRadar20[badge.targetCriterionCode] ?? 0;
        if (critScore20 >= badge.minScoreThreshold) {
          earnedBadgeIds.push(badge.badgeId);
        }
      }
    }

    return {
      userId: params.userId,
      totalScore100,
      oppositeSexTotal100,
      sameSexTotal100,
      domainSummaries,
      criteriaRadar20,
      topStrengthElements,
      blindSpotElements,
      earnedBadgeIds,
    };
  }
}

