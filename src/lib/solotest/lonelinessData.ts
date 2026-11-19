// 외로움 유형 테스트 (Hughes 3문항 + De Jong Gierveld 6문항) 데이터 및 채점 규칙

export interface LonelinessQuestion {
  id: string;
  part: 1 | 2;
  domain: 'degree' | 'emotional' | 'social';
  text: string;
  options: { label: string; score: number }[];
  isCrisisTrigger?: boolean; // 문항 4, 6 공허감/거부감 위기 감지 문항
}

export const LONELINESS_QUESTIONS: LonelinessQuestion[] = [
  // 파트 1. 정도 (Hughes 3문항: 거의 없다=1 / 가끔=2 / 자주=3)
  {
    id: 'L1',
    part: 1,
    domain: 'degree',
    text: '함께할 사람이 부족하다고 느끼는 때가 얼마나 자주 있나요?',
    options: [
      { label: '거의 없다', score: 1 },
      { label: '가끔 그렇다', score: 2 },
      { label: '자주 그렇다', score: 3 },
    ],
  },
  {
    id: 'L2',
    part: 1,
    domain: 'degree',
    text: '소외된 느낌이 드는 때가 얼마나 자주 있나요?',
    options: [
      { label: '거의 없다', score: 1 },
      { label: '가끔 그렇다', score: 2 },
      { label: '자주 그렇다', score: 3 },
    ],
  },
  {
    id: 'L3',
    part: 1,
    domain: 'degree',
    text: '다른 사람들과 단절되었다고 느끼는 때가 얼마나 자주 있나요?',
    options: [
      { label: '거의 없다', score: 1 },
      { label: '가끔 그렇다', score: 2 },
      { label: '자주 그렇다', score: 3 },
    ],
  },

  // 파트 2. 유형 (De Jong Gierveld 6문항: 그렇다 / 어느 정도 / 아니다)
  // 4~6번: 정서적 외로움 (그렇다=1, 어느 정도=1, 아니다=0)
  {
    id: 'L4',
    part: 2,
    domain: 'emotional',
    text: '전반적으로 공허한 느낌이 든다.',
    isCrisisTrigger: true,
    options: [
      { label: '그렇다', score: 1 },
      { label: '어느 정도 그렇다', score: 1 },
      { label: '아니다', score: 0 },
    ],
  },
  {
    id: 'L5',
    part: 2,
    domain: 'emotional',
    text: '주변에 사람이 있었으면 좋겠다고 느낀다.',
    options: [
      { label: '그렇다', score: 1 },
      { label: '어느 정도 그렇다', score: 1 },
      { label: '아니다', score: 0 },
    ],
  },
  {
    id: 'L6',
    part: 2,
    domain: 'emotional',
    text: '거부당한 느낌이 자주 든다.',
    isCrisisTrigger: true,
    options: [
      { label: '그렇다', score: 1 },
      { label: '어느 정도 그렇다', score: 1 },
      { label: '아니다', score: 0 },
    ],
  },

  // 7~9번: 사회적 외로움 (역채점: 그렇다=0, 어느 정도=1, 아니다=1)
  {
    id: 'L7',
    part: 2,
    domain: 'social',
    text: '어려울 때 의지할 사람이 충분히 있다.',
    options: [
      { label: '그렇다', score: 0 },
      { label: '어느 정도 그렇다', score: 1 },
      { label: '아니다', score: 1 },
    ],
  },
  {
    id: 'L8',
    part: 2,
    domain: 'social',
    text: '완전히 믿을 수 있는 사람이 많다.',
    options: [
      { label: '그렇다', score: 0 },
      { label: '어느 정도 그렇다', score: 1 },
      { label: '아니다', score: 1 },
    ],
  },
  {
    id: 'L9',
    part: 2,
    domain: 'social',
    text: '가깝게 느끼는 사람이 충분히 있다.',
    options: [
      { label: '그렇다', score: 0 },
      { label: '어느 정도 그렇다', score: 1 },
      { label: '아니다', score: 1 },
    ],
  },
];

export type LonelinessTypeCode = 'A' | 'B' | 'C' | 'D';

export interface LonelinessTypeInfo {
  code: LonelinessTypeCode;
  name: string;
  summary: string;
  conditionDescription: string;
  moments: string;
  dailyActions: string[];
  connections: { title: string; desc: string }[];
  meetupFitNote: string;
  meetupDisplayMode: 'TOP_PRIMARY' | 'STARTING_POINT' | 'WEAK_BOTTOM' | 'SUBTLE_ONE_LINE';
}

export const LONELINESS_TYPES: Record<LonelinessTypeCode, LonelinessTypeInfo> = {
  A: {
    code: 'A',
    name: '지금은 충분히 닿아 있는 편',
    summary: '지금 관계가 든든하고 일상의 교류가 안정적인 시기예요.',
    conditionDescription: '정서적·사회적 연결 모두 비교적 충족된 상태입니다.',
    moments: '가까운 사람들과의 유대감이 든든하며, 혼자 있는 시간도 편안하게 느껴질 때',
    dailyActions: [
      '소중한 사람에게 가벼운 감사나 안부 메시지 보내기',
      '혼자만의 산책이나 취미로 온전한 여유 즐기기',
      '새로운 관심사나 가보고 싶었던 장소 탐색해 보기',
    ],
    connections: [
      { title: '기존 관계의 깊이 더하기', desc: '이미 신뢰하는 이들과 계절의 변화를 함께 나누기' },
      { title: '가벼운 취향 탐색', desc: '새로운 문화 행사나 동네 카페 탐방' },
      { title: '나도솔로 6인 식탁 (선택지)', desc: '새로운 사람과의 한 끼가 궁금할 때 가벼운 선택지' },
    ],
    meetupFitNote: '새로운 사람과의 한 끼가 궁금하다면 가벼운 선택지로 모임이 있어요.',
    meetupDisplayMode: 'SUBTLE_ONE_LINE',
  },
  B: {
    code: 'B',
    name: '마음 나눌 사람이 그리운 유형',
    summary: '사람은 곁에 있어도 속마음을 나눌 한 사람이 아쉬울 수 있어요.',
    conditionDescription: '사회적 네트워크는 있으나, 깊은 정서적 친밀감이 필요한 상태입니다.',
    moments: '회의나 모임은 많은데 깊은 고민은 혼자 삼킬 때, 피상적인 대화 뒤에 허전함이 남을 때',
    dailyActions: [
      '이미 알고 있는 사람 중 가장 편안했던 한 사람에게 먼저 안부 묻기',
      '오늘 하루 내 감정을 솔직하게 일기나 메모장에 3줄 적어보기',
      '말수를 줄이고 좋아하는 음악이나 책과 30분 머물기',
    ],
    connections: [
      { title: '기존의 한 관계에 먼저 다가가기', desc: '한 번의 새 모임보다 이미 있는 관계 한 곳에 안부 건네기' },
      { title: '소수 대화 살롱 또는 글쓰기 모임', desc: '많은 사람보다 1~2인과 천천히 마음을 털어놓는 자리' },
      { title: '나도솔로 6인 식탁 (시작점)', desc: '새로운 사람을 만나는 가벼운 시작점 정도로 활용' },
    ],
    meetupFitNote:
      '깊은 관계는 한 번의 모임으로 생기지 않아서, 이미 있는 관계 한 곳에 먼저 안부를 건네거나 소수의 깊은 대화 자리를 찾는 것이 더 잘 맞을 수 있어요. 나도솔로 모임은 새로운 사람을 만나는 가벼운 시작점 정도로 보세요.',
    meetupDisplayMode: 'STARTING_POINT',
  },
  C: {
    code: 'C',
    name: '어울릴 사람이 그리운 유형',
    summary: '함께 시간을 보낼 사람의 폭과 활기찬 일상이 아쉬운 시기예요.',
    conditionDescription: '속마음 나눌 사람은 있을 수 있으나, 일상을 함께할 교류 네트워크가 필요한 상태입니다.',
    moments: '주말이나 퇴근 후 혼자 먹는 밥이 길게 느껴질 때, 맛집이나 전시에 같이 갈 사람이 없을 때',
    dailyActions: [
      '동네 공원이나 번화가로 나가 가볍게 사람들의 온기 느껴보기',
      '관심 있는 오픈 동호회나 지역 원데이 클래스 찾아보기',
      '자주 가는 카페나 서점의 주인에게 가볍게 눈인사 건네기',
    ],
    connections: [
      { title: '나도솔로 6인 식사 모임 (추천)', desc: '조건 없이 6명이 둘러앉아 한 끼를 나누는 가벼운 첫걸음' },
      { title: '동네 걷기·러닝 크루', desc: '말에 대한 부담 없이 같은 템포로 움직이는 커뮤니티' },
      { title: '봉사활동 또는 취미 소모임', desc: '공통의 목적을 가지고 낯선 사람들과 협업하기' },
    ],
    meetupFitNote:
      '함께 시간을 보낼 사람의 폭이 아쉬운 시기예요. 여러 사람과 가볍게 앉는 자리가 도움이 될 수 있어요. 나도솔로의 6인 식사 모임이 잘 맞는 유형이에요.',
    meetupDisplayMode: 'TOP_PRIMARY',
  },
  D: {
    code: 'D',
    name: '전반적으로 연결이 멀게 느껴지는 시기',
    summary: '요즘 세상과의 연결이 전반적으로 멀고 공허하게 느껴지는 시기예요.',
    conditionDescription: '정서적 친밀감과 사회적 교류망 모두에서 결핍을 체감하는 시점입니다.',
    moments: '주변에 사람이 아무도 없다고 느껴질 때, 먼저 손 내밀기조차 에너지가 부족할 때',
    dailyActions: [
      '창문을 열고 따뜻한 차 한 잔 마시며 깊게 숨 들이쉬기',
      '자신을 탓하지 않고 "지금은 잠시 지친 시기"라고 인정해 주기',
      '가까운 믿을 만한 가족이나 공인된 상담 전화에 목소리 건네기',
    ],
    connections: [
      { title: '전문 심리 상담 지원', desc: '부담 없이 마음을 털어놓을 수 있는 24시간 공공 상담 서비스' },
      { title: '가족 또는 오랜 지인과의 짧은 통화', desc: '안부를 묻는 3분의 대화' },
      { title: '나도솔로 6인 식탁 (보조 선택지)', desc: '마음의 여유가 조금 생겼을 때 가볍게 시도해 볼 수 있는 선택지' },
    ],
    meetupFitNote:
      '요즘 연결이 많이 멀게 느껴지는 것 같아요. 이런 감정이 오래 이어지거나 힘들다면 모임보다 먼저 주변 사람이나 전문 상담에 이야기해 보세요. 가볍게 시도해 볼 수 있는 선택지로 모임도 있어요.',
    meetupDisplayMode: 'WEAK_BOTTOM',
  },
};

export const COUNSELING_HOTLINES = [
  { name: '정신건강 위기상담전화', tel: '1577-0199', desc: '24시간 전문가 상담' },
  { name: '자살예방 상담전화', tel: '109', desc: '24시간 위기 대응' },
  { name: '한국생명의전화', tel: '1588-9191', desc: '24시간 생명의 전화' },
];

export interface LonelinessScoringOutput {
  degreeScore: number;
  degreeLevel: '낮은 편' | '중간' | '높은 편';
  emotionalScore: number;
  socialScore: number;
  isEmotionalHigh: boolean;
  isSocialHigh: boolean;
  type: LonelinessTypeCode;
  hasCrisisFlag: boolean; // 문항 4, 6번 강한 긍정 체크
}

export function computeLonelinessResult(answers: Record<string, number>): LonelinessScoringOutput {
  const l1 = answers.L1 ?? 1;
  const l2 = answers.L2 ?? 1;
  const l3 = answers.L3 ?? 1;
  const degreeScore = l1 + l2 + l3;

  let degreeLevel: '낮은 편' | '중간' | '높은 편' = '중간';
  if (degreeScore <= 5) degreeLevel = '낮은 편';
  else if (degreeScore >= 8) degreeLevel = '높은 편';
  else degreeLevel = '중간';

  const l4 = answers.L4 ?? 0;
  const l5 = answers.L5 ?? 0;
  const l6 = answers.L6 ?? 0;
  const emotionalScore = l4 + l5 + l6;
  const isEmotionalHigh = emotionalScore >= 2;

  const l7 = answers.L7 ?? 0;
  const l8 = answers.L8 ?? 0;
  const l9 = answers.L9 ?? 0;
  const socialScore = l7 + l8 + l9;
  const isSocialHigh = socialScore >= 2;

  const hasCrisisFlag = (answers.L4 === 1 && answers.L6 === 1) || degreeScore >= 9;

  let type: LonelinessTypeCode = 'A';
  if (!isEmotionalHigh && !isSocialHigh) {
    type = 'A';
  } else if (isEmotionalHigh && !isSocialHigh) {
    type = 'B';
  } else if (!isEmotionalHigh && isSocialHigh) {
    type = 'C';
  } else {
    type = 'D';
  }

  return {
    degreeScore,
    degreeLevel,
    emotionalScore,
    socialScore,
    isEmotionalHigh,
    isSocialHigh,
    type,
    hasCrisisFlag,
  };
}
