// 솔로테스트 v0.1 문항 및 결과 데이터 규격

export interface SoloTestQuestionOption {
  v: string | number;
  label: string;
}

export interface SoloTestQuestion {
  id: string;
  axis: 'context' | 'need' | 'role' | 'depth' | 'interests';
  type: 'single' | 'scale3' | 'multi';
  max?: number;
  text: string;
  options: Array<SoloTestQuestionOption | string>;
}

export const SOLOTEST_VERSION = 'solotest-0.1';

export const SOLOTEST_QUESTIONS: SoloTestQuestion[] = [
  {
    id: 'Q1',
    axis: 'context',
    type: 'single',
    text: '혼자라고 느끼는 순간은 언제인가요?',
    options: [
      { v: 'after_work', label: '퇴근하고 혼자 먹는 저녁' },
      { v: 'among_people', label: '사람들 속에 있는데도 혼자인 것 같을 때' },
      { v: 'new_place', label: '낯선 동네, 낯선 환경에 있을 때' },
      { v: 'restart', label: '관계나 일상이 달라진 뒤' },
      { v: 'taste', label: '좋아하는 걸 같이 할 사람이 없을 때' },
      { v: 'rest', label: '혼자가 편하지만 가끔은 사람이 그리울 때' },
    ],
  },
  {
    id: 'Q2',
    axis: 'need',
    type: 'scale3',
    text: '요즘 더 아쉬운 건?',
    options: [
      { v: 1, label: '같이 어울릴 사람이 많았으면' },
      { v: 2, label: '상황에 따라 둘 다' },
      { v: 3, label: '속마음을 나눌 한 사람이 있었으면' },
    ],
  },
  {
    id: 'Q3',
    axis: 'need',
    type: 'scale3',
    text: '이상적인 저녁은?',
    options: [
      { v: 1, label: '여러 사람과 웃으며 북적북적' },
      { v: 2, label: '상관없어요' },
      { v: 3, label: '한두 사람과 오래 이야기' },
    ],
  },
  {
    id: 'Q4',
    axis: 'role',
    type: 'scale3',
    text: '낯선 사람들과 한 식탁에 앉으면?',
    options: [
      { v: 1, label: '먼저 말을 거는 편' },
      { v: 2, label: '반반' },
      { v: 3, label: '듣고 맞장구치는 편' },
    ],
  },
  {
    id: 'Q5',
    axis: 'role',
    type: 'scale3',
    text: '대화가 잠깐 끊기면?',
    options: [
      { v: 1, label: '내가 먼저 화제를 꺼내요' },
      { v: 2, label: '상황을 봐서요' },
      { v: 3, label: '여백으로 두고 기다려요' },
    ],
  },
  {
    id: 'Q6',
    axis: 'depth',
    type: 'scale3',
    text: '편하게 느끼는 이야기는?',
    options: [
      { v: 1, label: '맛집·취미·일상 수다' },
      { v: 2, label: '적당히 섞어서' },
      { v: 3, label: '고민이나 가치관 이야기' },
    ],
  },
  {
    id: 'Q7',
    axis: 'depth',
    type: 'scale3',
    text: '모임이 끝난 뒤 남았으면 하는 건?',
    options: [
      { v: 1, label: '즐거웠다는 기분' },
      { v: 2, label: '둘 다' },
      { v: 3, label: '마음이 통했다는 느낌' },
    ],
  },
  {
    id: 'Q8',
    axis: 'interests',
    type: 'multi',
    max: 3,
    text: '요즘 관심 있는 것 3가지를 골라 주세요.',
    options: [
      '맛집',
      '여행',
      '운동·산책',
      '영화·드라마',
      '책',
      '음악',
      '반려동물',
      '일과 커리어',
      '건강·웰빙',
      '사진·전시',
      '요리',
      '보드게임',
    ],
  },
];

export interface ContextResultCopy {
  name: string;
  empathy: string;
  moments: string;
  first_step: string;
}

export interface StyleResultCopy {
  name: string;
  line: string;
  tip: string;
}

export interface NeedResultCopy {
  title: string;
  line: string;
}

export interface ThemeResultCopy {
  name: string;
  desc: string;
}

export const SOLOTEST_COPY = {
  context: {
    after_work: {
      name: '퇴근 후 솔로',
      empathy: '하루는 끝났는데, 이야기할 사람이 없는 저녁이 있죠.',
      moments: '혼자 먹는 저녁이 길게 느껴질 때, 오늘 일을 누군가에게 말하고 싶을 때',
      first_step: '한 끼를 같이 먹는 것만으로 저녁의 온도가 달라져요.',
    },
    among_people: {
      name: '사람 속 솔로',
      empathy: '사람은 많은데, 마음 놓고 말할 곳은 많지 않죠.',
      moments: '회의와 모임 속에서도 혼자인 것 같을 때, 맡은 역할 때문에 속마음을 꺼내기 어려울 때',
      first_step: '역할을 내려놓고 만나는 낯선 사람이 오히려 편할 때가 있어요.',
    },
    new_place: {
      name: '새동네 솔로',
      empathy: '아는 사람이 아직 없는 곳에서의 시작은 누구에게나 낯설어요.',
      moments: '이사나 발령, 이직 후 주말이 비어 있을 때',
      first_step: '동네에서 처음 아는 얼굴을 만드는 데는 한 끼가 가장 가벼운 시작이에요.',
    },
    restart: {
      name: '다시 시작 솔로',
      empathy: '달라진 일상 속에서 새 리듬을 만드는 중이시군요.',
      moments: '관계나 생활이 바뀐 뒤 혼자 보내는 시간이 낯설 때',
      first_step: '서두를 필요 없어요. 편한 속도로 새 사람들과 앉아 보는 정도면 충분해요.',
    },
    taste: {
      name: '취향 솔로',
      empathy: '좋아하는 건 많은데, 같이 할 사람이 없을 뿐이죠.',
      moments: '가고 싶은 맛집이나 전시 앞에서 혼자 망설일 때',
      first_step: '취향이 통하는 사람 한두 명이면 혼자는 못 가던 곳도 갈 수 있어요.',
    },
    rest: {
      name: '쉬어가는 솔로',
      empathy: '혼자인 시간도 좋지만, 가끔은 사람이 그리운 거죠.',
      moments: '혼자가 편하면서도 문득 대화가 그리울 때',
      first_step: '길게 약속하지 않아도 돼요. 한 번의 저녁으로 가볍게 시작해요.',
    },
  } as Record<string, ContextResultCopy>,

  style: {
    mood: {
      name: '분위기 메이커',
      line: '식탁의 첫 화제를 던지는 사람. 웃음으로 분위기를 여는 편이에요.',
      tip: '대화가 한쪽으로 쏠리지 않게, 가끔 옆 사람에게 질문을 넘겨 보세요.',
    },
    react: {
      name: '맞장구 장인',
      line: '리액션으로 대화를 살리는 사람. 들어주는 것만으로 식탁이 편해져요.',
      tip: '가끔은 내 이야기도 한 줄 꺼내 보세요. 더 가까워져요.',
    },
    collector: {
      name: '이야기 수집가',
      line: '질문으로 이야기를 끌어내는 사람. 깊은 이야기에 끌려요.',
      tip: '처음엔 가벼운 주제로 시작하면 더 편하게 열려요.',
    },
    glow: {
      name: '조용한 불빛',
      line: '말은 적어도 오래 남는 한마디를 건네는 사람이에요.',
      tip: '한 번쯤 먼저 말을 걸어 보세요. 생각보다 모두가 기다리고 있어요.',
    },
    flex: {
      name: '유연한 동석자',
      line: '상황에 따라 이끌기도 듣기도 하는 사람. 어떤 식탁에서도 잘 어울려요.',
      tip: '오늘은 어떤 역할이고 싶은지 정해 보면 더 편해요.',
    },
  } as Record<string, StyleResultCopy>,

  need: {
    wide: {
      title: '여럿이 어울릴 때 힘이 나요',
      line: '6명이 앉는 식탁이 잘 맞아요. 가볍게 시작하는 모임을 추천해요.',
    },
    balanced: {
      title: '그때그때 다른 연결이 필요해요',
      line: '상황에 따라 가볍게도, 깊게도. 첫 식탁에서 내 속도를 찾아 보세요.',
    },
    deep: {
      title: '한두 사람과 오래 이야기하고 싶어요',
      line: '깊은 이야기가 오가는 테마 모임을 추천해요.',
    },
  } as Record<string, NeedResultCopy>,

  theme: {
    after_work_dinner: {
      name: '퇴근 후 저녁',
      desc: '혼자 먹기 싫은 저녁, 6명이 한 식탁에 앉아요.',
    },
    new_neighborhood: {
      name: '이사 온 동네 첫 식탁',
      desc: '이 동네에서 처음 아는 얼굴을 만나요.',
    },
    hidden_restaurant: {
      name: '혼자는 못 가던 맛집',
      desc: '혼자서는 가기 어려웠던 맛집에 같이 앉아요.',
    },
  } as Record<string, ThemeResultCopy>,

  share_text: '나는 {context.name} × {style.name}. 나도 솔로야.',
  footer: [
    '이 테스트는 공감과 재미를 위한 것이며 진단이 아닙니다.',
    '마음이 많이 힘들다면 전문 상담의 도움을 받아 보세요. {TODO: 공식 상담 연락처 삽입}',
    '응답은 통계와 모임 추천에만 쓰이고, 다른 사람에게 공개되지 않습니다.',
  ],
};

export interface SoloTestResultOutput {
  context: string;
  need: 'wide' | 'balanced' | 'deep';
  role: 'lead' | 'listen' | 'mid';
  depth: 'light' | 'deep' | 'mid';
  style: 'mood' | 'react' | 'collector' | 'glow' | 'flex';
  theme: 'after_work_dinner' | 'new_neighborhood' | 'hidden_restaurant';
  tags: string[];
  interests?: string[];
}

export function computeSoloTestResult(
  answers: Record<string, any>
): SoloTestResultOutput {
  // Q1: context
  const context = String(answers.Q1 || 'after_work');

  // need: Q2 + Q3
  const q2 = Number(answers.Q2) || 2;
  const q3 = Number(answers.Q3) || 2;
  const needSum = q2 + q3;
  let needLetter: 'A' | 'B' | 'M' = 'M';
  if (needSum >= 2 && needSum <= 3) {
    needLetter = 'A';
  } else if (needSum >= 5 && needSum <= 6) {
    needLetter = 'B';
  } else {
    // 동점 4점 처리
    if (q3 === 1) needLetter = 'A';
    else if (q3 === 3) needLetter = 'B';
    else needLetter = 'M';
  }
  const needKey: 'wide' | 'balanced' | 'deep' =
    needLetter === 'A' ? 'wide' : needLetter === 'B' ? 'deep' : 'balanced';

  // role: Q4 + Q5
  const q4 = Number(answers.Q4) || 2;
  const q5 = Number(answers.Q5) || 2;
  const roleSum = q4 + q5;
  let roleLetter: 'A' | 'B' | 'M' = 'M';
  if (roleSum >= 2 && roleSum <= 3) {
    roleLetter = 'A';
  } else if (roleSum >= 5 && roleSum <= 6) {
    roleLetter = 'B';
  } else {
    // 동점 4점 처리
    if (q5 === 1) roleLetter = 'A';
    else if (q5 === 3) roleLetter = 'B';
    else roleLetter = 'M';
  }
  const roleKey: 'lead' | 'listen' | 'mid' =
    roleLetter === 'A' ? 'lead' : roleLetter === 'B' ? 'listen' : 'mid';

  // depth: Q6 + Q7
  const q6 = Number(answers.Q6) || 2;
  const q7 = Number(answers.Q7) || 2;
  const depthSum = q6 + q7;
  let depthLetter: 'A' | 'B' | 'M' = 'M';
  if (depthSum >= 2 && depthSum <= 3) {
    depthLetter = 'A';
  } else if (depthSum >= 5 && depthSum <= 6) {
    depthLetter = 'B';
  } else {
    // 동점 4점 처리
    if (q7 === 1) depthLetter = 'A';
    else if (q7 === 3) depthLetter = 'B';
    else depthLetter = 'M';
  }
  const depthKey: 'light' | 'deep' | 'mid' =
    depthLetter === 'A' ? 'light' : depthLetter === 'B' ? 'deep' : 'mid';

  // style (결 유형)
  let styleKey: 'mood' | 'react' | 'collector' | 'glow' | 'flex' = 'flex';
  if (roleLetter === 'M' || depthLetter === 'M') {
    styleKey = 'flex';
  } else if (roleLetter === 'A' && depthLetter === 'A') {
    styleKey = 'mood';
  } else if (roleLetter === 'B' && depthLetter === 'A') {
    styleKey = 'react';
  } else if (roleLetter === 'A' && depthLetter === 'B') {
    styleKey = 'collector';
  } else if (roleLetter === 'B' && depthLetter === 'B') {
    styleKey = 'glow';
  }

  // theme (추천 테마 방)
  let themeKey: 'after_work_dinner' | 'new_neighborhood' | 'hidden_restaurant' =
    'after_work_dinner';
  if (['after_work', 'among_people', 'restart', 'rest'].includes(context)) {
    themeKey = 'after_work_dinner';
  } else if (context === 'new_place') {
    themeKey = 'new_neighborhood';
  } else if (context === 'taste') {
    themeKey = 'hidden_restaurant';
  }

  const tags: string[] = [];
  if (needKey === 'deep') {
    tags.push('deep_talk');
  }

  const rawQ8 = answers.Q8;
  const interests: string[] = Array.isArray(rawQ8)
    ? rawQ8
    : typeof rawQ8 === 'string'
    ? rawQ8.split(',').filter(Boolean)
    : [];

  return {
    context,
    need: needKey,
    role: roleKey,
    depth: depthKey,
    style: styleKey,
    theme: themeKey,
    tags,
    interests,
  };
}
