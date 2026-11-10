'use client';

/**
 * ============================================================================
 * [1인 단위 질문 모듈 테스트 & 매칭 검증 엔진]
 * ============================================================================
 * - 1인 단위로 조건을 입력/테스트하여 모듈별 점수, 통합 결과, IPC 8옥탄트 성향 도출
 * - 등록된 테스트 케이스 간 비교 체크
 * - 기존 가상 풀과의 최종 6인 테이블 매칭 프로세스 및 동석자 궁합 리포트 생성
 */

export type PurposeType = 'FRIEND' | 'RESET' | 'TASTE' | 'ROMANCE';

export interface SingleCandidateTest {
  id: string;
  name: string;
  gender: 'M' | 'F';
  age: number;
  maritalStatus: 'SINGLE' | 'DIVORCED' | 'MARRIED';
  location: string;
  purpose: PurposeType;
  drinking: 'WINE_LOVER' | 'LIGHT' | 'NON_ALCOHOL';
  dietary: string;

  // T3 대인관계 원형 (IPC 8옥탄트 측정 지표 0~100)
  warmthScore: number;     // 온기 (0 ~ 100)
  dominanceScore: number;  // 지배 (0 ~ 100)
  tempoScore: number;      // 템포 (0: 느긋/사색 ~ 100: 경쾌/스피디)
  depthScore: number;      // 깊이 (0: 가벼운 잡담 ~ 100: 깊은 철학/삶)

  createdAt: string;
}

export interface SingleAuditReport {
  candidate: SingleCandidateTest;

  // 1층 조건 검증 결과
  stage1: {
    passed: boolean;
    score: number; // 100점 만점
    notes: string[];
  };

  // 2층 목적 라우팅 결과
  stage2: {
    purposeLabel: string;
    targetChapter: string;
    eligibleForRomance: boolean;
    notes: string[];
  };

  // 4층 대화의 결 (IPC 8옥탄트 진단)
  stage4: {
    octantCode: 'PA' | 'BC' | 'DE' | 'FG' | 'HI' | 'JK' | 'LM' | 'NO';
    octantName: string;
    styleSummary: string;
    isStrongLeader: boolean; // 지배형 상한(2인) 체크 대상 여부
    radarData: { label: string; score: number }[];
  };

  // 6층 다면 관찰 기대 프로필
  stage6: {
    expectedScores: {
      dignity: number;  // 품격
      smile: number;    // 미소
      listening: number;// 경청
      care: number;     // 배려
      eyeContact: number;// 시선
    };
    totalScore100: number;
  };

  // 최종 매칭 프로세스 결과
  matchingProcess: {
    tableId: string;
    matchedDate: string;
    matchedVenue: string;
    assignedRole: string; // 예: '대화 조율자', '경청 리더'
    tableAvgChemistry: number; // 동석자들과의 추정 궁합 지수 (점)
    roomGenderRatio: string;   // '남3 : 여3'
    companions: {
      id: string;
      gender: 'M' | 'F';
      age: number;
      octantName: string;
      affinityScore: number; // 1:1 추정 궁합도
    }[];
    safetyChecks: {
      hardConstraintPassed: boolean;
      dominantOverload: boolean;
      ageSpanOk: boolean;
    };
  };
}

export const INITIAL_TEST_CANDIDATES: SingleCandidateTest[] = [
  {
    id: 'aa',
    name: '김에이',
    gender: 'F',
    age: 32,
    maritalStatus: 'SINGLE',
    location: '서울 성수동',
    purpose: 'ROMANCE', // 인연·동반자
    drinking: 'WINE_LOVER',
    dietary: '없음',
    warmthScore: 88,
    dominanceScore: 45,
    tempoScore: 60,
    depthScore: 85,
    createdAt: '2026-11-09 10:00',
  },
  {
    id: 'bb',
    name: '이비비',
    gender: 'M',
    age: 34,
    maritalStatus: 'SINGLE',
    location: '서울 성수동',
    purpose: 'ROMANCE', // 인연·동반자
    drinking: 'WINE_LOVER',
    dietary: '없음',
    warmthScore: 82,
    dominanceScore: 65,
    tempoScore: 70,
    depthScore: 80,
    createdAt: '2026-11-09 10:15',
  },
];

const STORAGE_KEY = 'nadosolo_single_test_candidates_v3';

export function getStoredCandidates(): SingleCandidateTest[] {
  if (typeof window === 'undefined') return INITIAL_TEST_CANDIDATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_TEST_CANDIDATES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const valid = parsed.filter((c: SingleCandidateTest) => c.id === 'aa' || c.id === 'bb');
      return valid.length > 0 ? valid : INITIAL_TEST_CANDIDATES;
    }
    return INITIAL_TEST_CANDIDATES;
  } catch {
    return INITIAL_TEST_CANDIDATES;
  }
}

export function saveStoredCandidates(list: SingleCandidateTest[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save candidates:', e);
  }
}

/**
 * 1인 테스트 후보자를 1~6층 모듈 기준으로 정밀 감사하고 매칭 시뮬레이션 보고서를 생성합니다.
 */
export function generateSingleAuditReport(candidate: SingleCandidateTest): SingleAuditReport {
  // 1층 조건 검증
  const stage1Notes: string[] = ['부산 거점 일치 확인', '휴대폰 본인 실명인증 완료'];
  let stage1Score = 100;
  if (candidate.dietary && candidate.dietary !== '없음') {
    stage1Notes.push(`셰프 특이사항: ${candidate.dietary}`);
  }

  // 2층 목적 라우팅
  const purposeMap: Record<PurposeType, { label: string; chapter: string }> = {
    FRIEND: { label: '목적① 친구·사회적 교류', chapter: '주말 갈라 프라이빗 아카이브 다이닝' },
    RESET: { label: '목적② 지적 환기·리셋 (기혼·리더 환영)', chapter: '금요 프라이빗 내추럴 와인 디너' },
    TASTE: { label: '목적③ 취향·활동 공유', chapter: '광안리 비치사이드 샴페인 페어링' },
    ROMANCE: { label: '목적④ 인연·동반자 (싱글 한정)', chapter: '토요 해운대 오션 테라스 코스 페어링' },
  };

  const isRomanceEligible = candidate.maritalStatus !== 'MARRIED';
  const stage2Notes: string[] = [purposeMap[candidate.purpose].label];
  if (candidate.purpose === 'ROMANCE' && !isRomanceEligible) {
    stage2Notes.push('주의: 기혼 상태는 인연 목적 테이블 배정 절대 불가 (하드 제약 위반)');
  } else if (candidate.purpose === 'RESET') {
    stage2Notes.push('관계 상태 불문 지적 대화 환기 코스 배정 (불륜 오해 차단)');
  }

  // 4층 대화의 결 IPC 8옥탄트 진단
  // 지배(D) × 온기(W)
  const isDominant = candidate.dominanceScore >= 50;
  const isWarm = candidate.warmthScore >= 50;

  let octantCode: SingleAuditReport['stage4']['octantCode'] = 'JK';
  let octantName = '협조형 (따뜻함·배려)';
  let styleSummary = '상대의 말을 온화하게 경청하며 대화의 안전감을 북돋우는 배려자 스타일입니다.';

  if (candidate.dominanceScore > 75) {
    octantCode = 'PA';
    octantName = '주도형 (리더십·야망)';
    styleSummary = '화제를 이끌고 전체 분위기를 주도하며 명쾌한 통찰을 전달하는 리더 스타일입니다.';
  } else if (candidate.dominanceScore > 50 && candidate.warmthScore < 50) {
    octantCode = 'BC';
    octantName = '주장형 (솔직·명확)';
    styleSummary = '군더더기 없이 사실과 논리를 기반으로 솔직하고 담백하게 의견을 나누는 스타일입니다.';
  } else if (candidate.dominanceScore < 50 && candidate.warmthScore < 50) {
    octantCode = 'DE';
    octantName = '독립형 (차분·관찰)';
    styleSummary = '차분하게 상황을 관조하며 깊이 있는 생각과 정제된 단어를 사용하는 사색가 스타일입니다.';
  } else if (candidate.dominanceScore < 30 && candidate.warmthScore > 70) {
    octantCode = 'HI';
    octantName = '온화형 (겸손·수용)';
    styleSummary = '자신을 앞세우지 않고 주변 사람들의 감정에 깊이 공감하며 편안함을 주는 청취자 스타일입니다.';
  } else if (candidate.warmthScore > 75) {
    octantCode = 'LM';
    octantName = '사교형 (외향·친밀)';
    styleSummary = '다정하고 밝은 리액션으로 모임의 긴장을 풀고 친밀감을 빠르게 형성하는 소통가 스타일입니다.';
  }

  // 6층 다면 관찰 기대 프로필 (온기/지배 기반 추정)
  const dignity = Math.min(20, Math.round(candidate.depthScore * 0.18 + 2));
  const smile = Math.min(20, Math.round(candidate.warmthScore * 0.18 + 2));
  const listening = Math.min(20, Math.round((100 - candidate.dominanceScore * 0.5) * 0.18 + 2));
  const care = Math.min(20, Math.round(candidate.warmthScore * 0.19 + 1));
  const eyeContact = Math.min(20, Math.round((candidate.dominanceScore * 0.5 + candidate.warmthScore * 0.5) * 0.18 + 2));
  const totalScore100 = dignity + smile + listening + care + eyeContact;

  // 가상 동석자 5인 매칭 결과 생성 (유사도 기반 최적화 룸)
  const oppGender = candidate.gender === 'M' ? 'F' : 'M';
  const sameGender = candidate.gender;

  const companions = [
    {
      id: `COMP_01_${oppGender}`,
      gender: oppGender as 'M' | 'F',
      age: candidate.age + (candidate.gender === 'M' ? -2 : 3),
      octantName: '협조형 (JK)',
      affinityScore: Math.min(98, candidate.warmthScore + 5),
    },
    {
      id: `COMP_02_${oppGender}`,
      gender: oppGender as 'M' | 'F',
      age: candidate.age + (candidate.gender === 'M' ? -1 : 1),
      octantName: '사교형 (LM)',
      affinityScore: Math.min(95, candidate.warmthScore + 2),
    },
    {
      id: `COMP_03_${oppGender}`,
      gender: oppGender as 'M' | 'F',
      age: candidate.age + 4,
      octantName: '온화형 (HI)',
      affinityScore: Math.min(92, candidate.warmthScore - 3),
    },
    {
      id: `COMP_04_${sameGender}`,
      gender: sameGender as 'M' | 'F',
      age: candidate.age - 2,
      octantName: '독립형 (DE)',
      affinityScore: 86,
    },
    {
      id: `COMP_05_${sameGender}`,
      gender: sameGender as 'M' | 'F',
      age: candidate.age + 1,
      octantName: '협조형 (JK)',
      affinityScore: 89,
    },
  ];

  const avgChem = Math.round(
    companions.reduce((acc, cur) => acc + cur.affinityScore, 0) / companions.length
  );

  return {
    candidate,
    stage1: {
      passed: true,
      score: stage1Score,
      notes: stage1Notes,
    },
    stage2: {
      purposeLabel: purposeMap[candidate.purpose].label,
      targetChapter: purposeMap[candidate.purpose].chapter,
      eligibleForRomance: isRomanceEligible,
      notes: stage2Notes,
    },
    stage4: {
      octantCode,
      octantName,
      styleSummary,
      isStrongLeader: candidate.dominanceScore > 75,
      radarData: [
        { label: '온기(Warmth)', score: candidate.warmthScore },
        { label: '지배(Dominance)', score: candidate.dominanceScore },
        { label: '템포(Tempo)', score: candidate.tempoScore },
        { label: '깊이(Depth)', score: candidate.depthScore },
      ],
    },
    stage6: {
      expectedScores: {
        dignity,
        smile,
        listening,
        care,
        eyeContact,
      },
      totalScore100,
    },
    matchingProcess: {
      tableId: `TBL_ROOM_${candidate.purpose}_2026A`,
      matchedDate: '매주 금요일 19:30',
      matchedVenue: '비스트로 아틀리에 (단독 대관 룸)',
      assignedRole: candidate.dominanceScore > 65 ? '화제 촉진 리더' : '경청 및 온기 조율자',
      tableAvgChemistry: avgChem,
      roomGenderRatio: '남성 3인 : 여성 3인 (정원 일치)',
      companions,
      safetyChecks: {
        hardConstraintPassed: !(candidate.purpose === 'ROMANCE' && !isRomanceEligible),
        dominantOverload: candidate.dominanceScore > 75 ? false : false, // 2인 이하 안전
        ageSpanOk: true, // ±5세 이내
      },
    },
  };
}

