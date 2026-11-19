// UCLA 외로움 척도 Version 3 (Russell, 1996) 표준 데이터 및 채점 엔진

export type UCLALonelinessDomain = 'intimacy' | 'belonging' | 'isolation';

export interface UCLAQuestion {
  id: string; // Q1 ~ Q20
  num: number;
  text: string;
  isReverse: boolean; // true면 5 - 선택점수
  domain: UCLALonelinessDomain;
  domainLabel: string;
}

export const UCLA_SCALE_OPTIONS = [
  { value: 1, label: '전혀 그렇지 않다' },
  { value: 2, label: '드물게 그렇다' },
  { value: 3, label: '가끔 그렇다' },
  { value: 4, label: '자주 그렇다' },
];

export const UCLA_QUESTIONS: UCLAQuestion[] = [
  {
    id: 'Q1',
    num: 1,
    text: '주변 사람들과 마음이 잘 통한다고 느끼는 편이다.',
    isReverse: true,
    domain: 'belonging',
    domainLabel: '사회적 소속감',
  },
  {
    id: 'Q2',
    num: 2,
    text: '함께 어울릴 만한 사람이 부족하다고 느낀다.',
    isReverse: false,
    domain: 'belonging',
    domainLabel: '사회적 소속감',
  },
  {
    id: 'Q3',
    num: 3,
    text: '힘들 때 의지할 수 있는 사람이 아무도 없다고 느낀다.',
    isReverse: false,
    domain: 'intimacy',
    domainLabel: '정서적 친밀감',
  },
  {
    id: 'Q4',
    num: 4,
    text: '혼자 남겨진 기분이 든다.',
    isReverse: false,
    domain: 'isolation',
    domainLabel: '관계적 고립감',
  },
  {
    id: 'Q5',
    num: 5,
    text: '내가 속한 모임이나 무리의 일원이라는 소속감을 느낀다.',
    isReverse: true,
    domain: 'belonging',
    domainLabel: '사회적 소속감',
  },
  {
    id: 'Q6',
    num: 6,
    text: '주변 사람들과 공통점이 많다고 느낀다.',
    isReverse: true,
    domain: 'belonging',
    domainLabel: '사회적 소속감',
  },
  {
    id: 'Q7',
    num: 7,
    text: '이제는 그 누구와도 특별히 가깝지 않다고 느낀다.',
    isReverse: false,
    domain: 'intimacy',
    domainLabel: '정서적 친밀감',
  },
  {
    id: 'Q8',
    num: 8,
    text: '내 관심사나 생각을 주변 사람들이 공유해 주지 않는다고 느낀다.',
    isReverse: false,
    domain: 'intimacy',
    domainLabel: '정서적 친밀감',
  },
  {
    id: 'Q9',
    num: 9,
    text: '나는 외향적이고 사람들과 잘 어울리는 편이다.',
    isReverse: true,
    domain: 'belonging',
    domainLabel: '사회적 소속감',
  },
  {
    id: 'Q10',
    num: 10,
    text: '사람들과 정서적으로 가깝다고 느낀다.',
    isReverse: true,
    domain: 'intimacy',
    domainLabel: '정서적 친밀감',
  },
  {
    id: 'Q11',
    num: 11,
    text: '사람들 사이에서 소외된 기분이 든다.',
    isReverse: false,
    domain: 'isolation',
    domainLabel: '관계적 고립감',
  },
  {
    id: 'Q12',
    num: 12,
    text: '다른 사람들과의 관계가 피상적이고 겉도는 느낌이다.',
    isReverse: false,
    domain: 'isolation',
    domainLabel: '관계적 고립감',
  },
  {
    id: 'Q13',
    num: 13,
    text: '나를 진짜로 잘 아는 사람은 아무도 없다고 느낀다.',
    isReverse: false,
    domain: 'intimacy',
    domainLabel: '정서적 친밀감',
  },
  {
    id: 'Q14',
    num: 14,
    text: '다른 사람들로부터 고립되어 있다고 느낀다.',
    isReverse: false,
    domain: 'isolation',
    domainLabel: '관계적 고립감',
  },
  {
    id: 'Q15',
    num: 15,
    text: '내가 원할 때 언제든 함께할 사람을 찾을 수 있다.',
    isReverse: true,
    domain: 'belonging',
    domainLabel: '사회적 소속감',
  },
  {
    id: 'Q16',
    num: 16,
    text: '나를 진심으로 이해해 주는 사람들이 있다.',
    isReverse: true,
    domain: 'intimacy',
    domainLabel: '정서적 친밀감',
  },
  {
    id: 'Q17',
    num: 17,
    text: '수줍음이 많거나 내성적이어서 다가가기 어렵다.',
    isReverse: false,
    domain: 'isolation',
    domainLabel: '관계적 고립감',
  },
  {
    id: 'Q18',
    num: 18,
    text: '주변에 사람은 많지만, 진심으로 내 편은 없는 것 같다.',
    isReverse: false,
    domain: 'isolation',
    domainLabel: '관계적 고립감',
  },
  {
    id: 'Q19',
    num: 19,
    text: '언제든 속마음을 터놓고 이야기할 사람이 있다.',
    isReverse: true,
    domain: 'intimacy',
    domainLabel: '정서적 친밀감',
  },
  {
    id: 'Q20',
    num: 20,
    text: '고민이 있을 때 의지할 수 있는 사람이 있다.',
    isReverse: true,
    domain: 'intimacy',
    domainLabel: '정서적 친밀감',
  },
];

export type UCLATypeCode = 'A' | 'B' | 'C' | 'D';

export interface UCLATypeInfo {
  code: UCLATypeCode;
  grade: string;
  name: string;
  rawRangeText: string;
  finalRangeText: string;
  summary: string;
  message: string;
  prescription: string;
  dailyActions: string[];
  recommendMeetup: boolean;
  meetupBadge: string;
  meetupHeadline: string;
  meetupBody: string;
}

export const UCLA_TYPES: Record<UCLATypeCode, UCLATypeInfo> = {
  A: {
    code: 'A',
    grade: '안정적 연결',
    name: '유형 A. 건강한 독립형',
    rawRangeText: '20 ~ 35점',
    finalRangeText: '0 ~ 25점',
    summary: '정서적 지지망이 탄탄하며 혼자 있는 시간도 온전한 휴식으로 즐길 줄 아는 상태입니다.',
    message: '정서적 지지망이 탄탄하며 혼자 있는 시간도 휴식으로 즐길 줄 아는 건강하고 균형 잡힌 상태입니다.',
    prescription: '현재 곁에 있는 소중한 관계에 감사함을 표현하고, 깊은 내면의 여유를 바탕으로 나만의 창작이나 새로운 취향 탐색에 에너지를 쏟아보세요.',
    dailyActions: [
      '소중한 지인에게 부담 없는 따뜻한 안부 인사 전하기',
      '혼자만의 산책이나 독서로 온전한 여유 만끽하기',
      '평소 배우고 싶었던 새로운 취미나 관심사 탐색해 보기',
    ],
    recommendMeetup: false,
    meetupBadge: '선택적 영감 탐색',
    meetupHeadline: '새로운 사람과의 가벼운 영감이 필요할 때',
    meetupBody: '지금은 모임이 절실히 필요한 상태는 아니에요. 일상에 색다른 지적 자극이나 새로운 취향의 대화가 궁금할 때 가벼운 선택지로 둘러보세요.',
  },
  B: {
    code: 'B',
    grade: '일시적 갈증',
    name: '유형 B. 새로운 자극 탐색형',
    rawRangeText: '36 ~ 50점',
    finalRangeText: '26 ~ 50점',
    summary: '기존 관계는 무난하나 반복되는 일상 속 신선한 대화와 새로운 결의 사람에 대한 은근한 갈증이 시작된 단계입니다.',
    message: '기존 관계는 무난하나 반복되는 일상 속 신선한 대화와 새로운 결의 사람에 대한 은근한 갈증이 시작된 단계입니다.',
    prescription: '늘 보던 사람들과의 익숙한 패턴을 넘어, 다른 업계나 다른 취향을 가진 이들과 가볍게 대화를 나누며 사고와 시야를 환기해 보세요.',
    dailyActions: [
      '퇴근길 평소 안 가본 골목이나 서점, 카페 들러보기',
      '최근 관심 가는 주제의 팟캐스트나 아티클 읽고 생각 3줄 메모하기',
      '느슨하게 연결된 지인에게 가볍게 차 한 잔 제안해 보기',
    ],
    recommendMeetup: true,
    meetupBadge: '수요일 사교클럽 추천',
    meetupHeadline: '수요일 저녁, 낯선 6인의 식탁에서 찾는 신선한 영감',
    meetupBody: '일상의 루틴에서 벗어나 조건 없이 둘러앉아 한 끼를 나누며 가벼운 지적 환기를 경험할 수 있는 사교 식탁입니다.',
  },
  C: {
    code: 'C',
    grade: '정서적 고립 주의',
    name: '유형 C. 군중 속의 고독형',
    rawRangeText: '51 ~ 65점',
    finalRangeText: '51 ~ 75점',
    summary: '주변에 연락할 사람은 있지만 정작 깊은 속마음이나 취향을 나눌 상대가 부족해 공허함을 느끼는 피상적 관계 피로 상태입니다.',
    message: '주변에 연락할 사람은 있지만 정작 깊은 속마음이나 취향을 나눌 상대가 부족해 공허함을 느끼는 피상적 관계 피로 상태입니다.',
    prescription: '많은 사람과의 피상적인 만남을 줄이고, 나의 감정과 가치관을 왜곡 없이 온전히 들어줄 수 있는 단 한 사람과의 깊은 연결에 집중하세요.',
    dailyActions: [
      '나의 피로를 유발하는 형식적인 모임이나 대화 줄이기',
      '내 진짜 감정(불안, 서운함, 외로움)을 솔직하게 일기장에 적어보기',
      '신뢰할 수 있는 1명에게 "요즘 조금 지쳤어"라고 조심스럽게 털어놓기',
    ],
    recommendMeetup: true,
    meetupBadge: '소수 대화 식탁 추천',
    meetupHeadline: '평가와 계산 없는 안전한 대화의 식탁',
    meetupBody: '명함과 스펙을 내려놓고, 가면 없이 한 사람의 인간으로서 존중받으며 속 깊은 대화를 나눌 수 있는 6인의 저녁입니다.',
  },
  D: {
    code: 'D',
    grade: '깊은 사회적 단절',
    name: '유형 D. 관계 에너지 방전형',
    rawRangeText: '66 ~ 80점',
    finalRangeText: '76 ~ 100점',
    summary: '사회적 연결감이 크게 약해져 고립감을 느끼고 있습니다. 낯선 만남이 부담스럽지만 동시에 따뜻한 온기가 가장 절실한 상태입니다.',
    message: '사회적 연결감이 크게 약해져 고립감을 느끼고 있습니다. 낯선 만남이 부담스럽지만 동시에 따뜻한 온기가 가장 절실한 상태입니다.',
    prescription: '자신을 탓하지 마세요. 지금은 마음의 배터리가 방전된 상태입니다. 무리한 약속 대신 따뜻한 차 한 잔과 충분한 수면으로 내면의 온기를 먼저 채우세요.',
    dailyActions: [
      '아침 햇살을 받으며 15분 동안 조용히 산책하기',
      '"지금은 잠시 충전하는 시간"이라고 나 자신을 따뜻하게 안아주기',
      '마음이 버거울 때는 언제든 열려 있는 공공 전문 상담에 목소리 건네기',
    ],
    recommendMeetup: true,
    meetupBadge: '조용한 온기의 식탁',
    meetupHeadline: '말을 억지로 많이 하지 않아도 괜찮은 저녁',
    meetupBody: '사람 사이에 있는 것만으로도 잔잔한 온기를 느낄 수 있도록, 부담 없는 분위기에서 함께 식사할 수 있습니다. (마음이 많이 버거울 땐 상담 지원을 먼저 권합니다)',
  },
};

export interface UCLADomainAnalysis {
  domain: UCLALonelinessDomain;
  label: string;
  itemCount: number;
  rawScore: number;
  score100: number;
  avgScore: number;
  interpretation: string;
  prescription: string;
}

export const UCLA_DOMAIN_DETAILS: Record<
  UCLALonelinessDomain,
  { label: string; interpretation: string; prescription: string }
> = {
  intimacy: {
    label: '정서적 친밀감',
    interpretation:
      '속마음을 터놓고 이해받을 수 있는 깊은 관계의 결핍도입니다. 주변에 사람이 있어도 내밀한 감정이나 취약성을 온전히 수용받지 못할 때 높아집니다.',
    prescription:
      '새로운 사람 여러 명보다, 이미 알고 있는 사람 중 가장 신뢰할 수 있는 1명에게 오늘 느낀 감정을 작게 털어놓아 보세요.',
  },
  belonging: {
    label: '사회적 소속감',
    interpretation:
      '집단이나 무리 속에서 공통점을 느끼고 유대감을 형성하는 정도의 결핍도입니다. 주변과 겉도는 이방인처럼 느껴질 때 높아집니다.',
    prescription:
      '거창한 관계를 맺으려 하기보다, 취향이나 관심사를 공유하는 작은 모임이나 클래스 등 같은 방향을 바라보는 자리에 앉아보세요.',
  },
  isolation: {
    label: '관계적 고립감',
    interpretation:
      '주변에 사람이 있더라도 나 혼자 남겨지거나 세상과 단절되었다고 느끼는 소외감의 정도입니다. 관계 피로와 내성적 위축이 복합될 수 있습니다.',
    prescription:
      '무리해서 사교를 시도하지 마세요. 카페 직원에게 가벼운 눈인사를 건네거나 짧은 동네 산책 등 위협 없는 작은 접촉부터 시작하세요.',
  },
};

export const UCLA_COUNSELING_HOTLINES = [
  { name: '정신건강 위기상담전화', tel: '1577-0199', desc: '24시간 전문가 심리 상담' },
  { name: '자살예방 상담전화', tel: '109', desc: '24시간 위기 대응' },
  { name: '한국생명의전화', tel: '1588-9191', desc: '24시간 생명의 전화' },
];

export interface UCLAScoringOutput {
  rawScore: number; // 20 ~ 80
  finalScore: number; // 0 ~ 100 (POMP 변환)
  type: UCLATypeCode;
  typeInfo: UCLATypeInfo;
  domains: Record<UCLALonelinessDomain, UCLADomainAnalysis>;
  topDeficitDomain: UCLADomainAnalysis; // 결핍도가 가장 높은 영역 1순위
  hasCrisisFlag: boolean;
}

export function computeUCLAResult(answers: Record<string, number>): UCLAScoringOutput {
  let totalRaw = 0;
  let intimacyRaw = 0;
  let belongingRaw = 0;
  let isolationRaw = 0;

  for (const q of UCLA_QUESTIONS) {
    const rawVal = answers[q.id] ?? 1; // 1 ~ 4
    const scoredVal = q.isReverse ? 5 - rawVal : rawVal; // 1 ~ 4

    totalRaw += scoredVal;

    if (q.domain === 'intimacy') {
      intimacyRaw += scoredVal;
    } else if (q.domain === 'belonging') {
      belongingRaw += scoredVal;
    } else if (q.domain === 'isolation') {
      isolationRaw += scoredVal;
    }
  }

  // 1. 원점수 바운드 보정 (20 ~ 80)
  const clampedRaw = Math.max(20, Math.min(80, totalRaw));

  // 2. 원점수 기준 유형 판별 (오차 0%)
  let typeCode: UCLATypeCode = 'A';
  if (clampedRaw <= 35) {
    typeCode = 'A';
  } else if (clampedRaw <= 50) {
    typeCode = 'B';
  } else if (clampedRaw <= 65) {
    typeCode = 'C';
  } else {
    typeCode = 'D';
  }

  // 3. 100점 환산 점수 (POMP 공식: (raw - 20) / 60 * 100)
  const finalScore = Math.round(((clampedRaw - 20) / 60) * 100);

  // 4. 세부 영역별 산출
  const intimacyScore100 = Math.round(((intimacyRaw - 8) / 24) * 100);
  const intimacyAnalysis: UCLADomainAnalysis = {
    domain: 'intimacy',
    label: UCLA_DOMAIN_DETAILS.intimacy.label,
    itemCount: 8,
    rawScore: intimacyRaw,
    score100: Math.max(0, Math.min(100, intimacyScore100)),
    avgScore: Number((intimacyRaw / 8).toFixed(1)),
    interpretation: UCLA_DOMAIN_DETAILS.intimacy.interpretation,
    prescription: UCLA_DOMAIN_DETAILS.intimacy.prescription,
  };

  const belongingScore100 = Math.round(((belongingRaw - 6) / 18) * 100);
  const belongingAnalysis: UCLADomainAnalysis = {
    domain: 'belonging',
    label: UCLA_DOMAIN_DETAILS.belonging.label,
    itemCount: 6,
    rawScore: belongingRaw,
    score100: Math.max(0, Math.min(100, belongingScore100)),
    avgScore: Number((belongingRaw / 6).toFixed(1)),
    interpretation: UCLA_DOMAIN_DETAILS.belonging.interpretation,
    prescription: UCLA_DOMAIN_DETAILS.belonging.prescription,
  };

  const isolationScore100 = Math.round(((isolationRaw - 6) / 18) * 100);
  const isolationAnalysis: UCLADomainAnalysis = {
    domain: 'isolation',
    label: UCLA_DOMAIN_DETAILS.isolation.label,
    itemCount: 6,
    rawScore: isolationRaw,
    score100: Math.max(0, Math.min(100, isolationScore100)),
    avgScore: Number((isolationRaw / 6).toFixed(1)),
    interpretation: UCLA_DOMAIN_DETAILS.isolation.interpretation,
    prescription: UCLA_DOMAIN_DETAILS.isolation.prescription,
  };

  const domainList = [intimacyAnalysis, belongingAnalysis, isolationAnalysis];
  domainList.sort((a, b) => b.score100 - a.score100);
  const topDeficitDomain = domainList[0];

  const hasCrisisFlag =
    clampedRaw >= 66 ||
    (answers.Q3 === 4 && answers.Q4 === 4 && answers.Q14 === 4);

  return {
    rawScore: clampedRaw,
    finalScore,
    type: typeCode,
    typeInfo: UCLA_TYPES[typeCode],
    domains: {
      intimacy: intimacyAnalysis,
      belonging: belongingAnalysis,
      isolation: isolationAnalysis,
    },
    topDeficitDomain,
    hasCrisisFlag,
  };
}
