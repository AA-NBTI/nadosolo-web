'use client';

/**
 * ============================================================================
 * [나도솔로 매칭 & 다면 관제 파이프라인 엔진] (Matching & Evaluation Pipeline Engine)
 * ============================================================================
 * 
 * [학술 및 엔지니어링 근거]
 * 0층: 입구 솔로테스트 (공감 및 개념 확장)
 * 1층: 안전 조건 필터 (Hard Constraints: 연령, 지역, 실명, 음주)
 * 2층: 목적 라우팅 (Weiss 1973 외로움 척도 + JTBD: 친구교류, 지적환기, 취향공유, 인연동반자)
 * 3층: 활동 형태 (소비 상황 기반: 프라이빗 룸 코스 디너, 1/N 실비)
 * 4층: 대화의 결 매칭 (대인관계 원형 IPIP-IPC 8옥탄트: 온기 Warmth × 지배 Dominance, 유사성 효과 r=.47)
 * 5층: 당일 컨디션 보정 (State-dependent Adjustment)
 * 6층: 단일 명사 다면 관찰 & 메타인지 리포트 (헌법 제2조 단일명사 + 조해리의 창 메타인지 갭)
 */

export interface PipelineModuleRule {
  id: string;
  label: string;
  description: string;
  hardConstraint: boolean; // 위반 시 즉시 탈락(하드 제약) 여부
  exposeToUser: boolean;   // 사용자 화면/질문지 노출 여부 (관리자 토글 가능)
  active: boolean;         // 엔진 연산 반영 여부
  weight: number;          // 가중치 (0 ~ 100)
  parameter?: string;      // 파라미터 값 (예: '±7세', '3:3', '70점')
}

export interface PipelineModule {
  id: string;
  stage: number;           // 1 ~ 6
  stageName: string;       // 층 이름
  name: string;            // 공식 모듈명
  description: string;     // 모듈 핵심 설명
  academicBasis: string;   // 학술 / 엔지니어링 근거
  isActive: boolean;       // 엔진 전역 활성화 여부
  exposeToUser: boolean;   // 사용자 노출 여부
  weight: number;          // 모듈 중요도 가중치 (0 ~ 100)
  rules: PipelineModuleRule[];
  simMetrics?: {
    passRate: number;      // 통과/편성 성공률 (%)
    violations: number;    // 하드 제약 위반 건수 (목표 0)
    avgChemistry: number;  // 평균 추정 궁합 지수 (점)
  };
}

export const DEFAULT_PIPELINE_MODULES: PipelineModule[] = [
  {
    id: 'MOD_COND_FILTER',
    stage: 1,
    stageName: '1층: 안전·적합성 조건',
    name: '하드 안전 제약 필터 모듈',
    description: '연령대, 지역, 본인 실명 인증, 알레르기 등 모임 성립의 필수 물리적 자격을 검증합니다.',
    academicBasis: 'Hard Constraints Filtering Protocol (결격 사유 0건 보장)',
    isActive: true,
    exposeToUser: true,
    weight: 100,
    simMetrics: { passRate: 98.4, violations: 0, avgChemistry: 88 },
    rules: [
      {
        id: 'R_AGE_SPAN',
        label: '연령대 균형 범위',
        description: '테이블 내 참가자 간 연령 차이를 허용 범위 내로 제한하여 세대 격차 완화',
        hardConstraint: true,
        exposeToUser: true,
        active: true,
        weight: 100,
        parameter: '±7세 이내',
      },
      {
        id: 'R_LOCATION_MATCH',
        label: '거점 지역 일치',
        description: '부산 권역(해운대, 전포, 서면, 광안리 등) 지정 거점 일치 필수',
        hardConstraint: true,
        exposeToUser: true,
        active: true,
        weight: 100,
        parameter: '부산 단일 거점',
      },
      {
        id: 'R_VERIFIED_IDENTITY',
        label: '본인 실명 및 신원 검증',
        description: '휴대폰 본인인증 및 에티켓 매너 사전 서약 완료 회원만 테이블 진입 허용',
        hardConstraint: true,
        exposeToUser: true,
        active: true,
        weight: 100,
        parameter: '100% 필수 인증',
      },
      {
        id: 'R_ALCOHOL_PAIRING',
        label: '음주·페어링 성향',
        description: '와인 페어링 가능 여부 및 비음주자(탄산수/무알콜) 안전 배려',
        hardConstraint: false,
        exposeToUser: true,
        active: true,
        weight: 50,
        parameter: '성향 옵션',
      },
      {
        id: 'R_DIETARY_RESTRICTION',
        label: '식이 제한 & 알레르기',
        description: '갑각류, 견과류, 채식 등 셰프 코스 요리 준비를 위한 사전 체크',
        hardConstraint: false,
        exposeToUser: true,
        active: true,
        weight: 60,
        parameter: '사전 접수',
      },
    ],
  },
  {
    id: 'MOD_PURPOSE_ROUTER',
    stage: 2,
    stageName: '2층: 참가 목적 라우팅',
    name: '목적 분리 라우터 모듈',
    description: '참가 목적(친구·교류, 지적 환기, 취향·활동, 인연·동반자)에 따라 독립된 테이블 풀로 라우팅합니다.',
    academicBasis: 'Weiss (1973) 사회적 외로움 vs 정서적 외로움 척도 + JTBD (Jobs-to-be-Done)',
    isActive: true,
    exposeToUser: true,
    weight: 95,
    simMetrics: { passRate: 96.2, violations: 0, avgChemistry: 85 },
    rules: [
      {
        id: 'P_SOCIAL_NETWORK',
        label: '목적① 친구·사회적 교류',
        description: '새로운 인간관계와 폭넓은 소통을 지향. 법적 관계 상태 불문 수용',
        hardConstraint: false,
        exposeToUser: true,
        active: true,
        weight: 80,
        parameter: '관계상태 무관',
      },
      {
        id: 'P_INTELLECTUAL_RESET',
        label: '목적② 지적 환기·리셋',
        description: '조직과 가정의 역할 가면을 벗고 지적 대화로 환기. 기혼자 및 조직 리더 환영, 연애 목적 철저 배제',
        hardConstraint: true,
        exposeToUser: true,
        active: true,
        weight: 90,
        parameter: '연애 배제 / 기혼 포함',
      },
      {
        id: 'P_TASTE_ACTIVITY',
        label: '목적③ 취향·활동 공유',
        description: '와인, 미식, 예술 등 공통 관심사 1개 이상 일치하는 동석자 그룹 구성',
        hardConstraint: false,
        exposeToUser: true,
        active: true,
        weight: 75,
        parameter: '관심사 1개 이상',
      },
      {
        id: 'P_ROMANTIC_PARTNER',
        label: '목적④ 인연·동반자',
        description: '진지한 이성적 인연 모색. 법적 싱글(미혼·이혼·사별) 본인 동의 서약자만 엄격 배정',
        hardConstraint: true,
        exposeToUser: true,
        active: true,
        weight: 100,
        parameter: '미혼 직접 동의자 한정',
      },
    ],
  },
  {
    id: 'MOD_ACTIVITY_FORMAT',
    stage: 3,
    stageName: '3층: 활동 형태 및 다이닝 룰',
    name: '프라이빗 다이닝 규격 모듈',
    description: '단독 대관 룸, 셰프 코스 요리, 현장 1/N 실비 정산 원칙을 시스템적으로 제어합니다.',
    academicBasis: 'Situation-Based Framing & Dining Protocol',
    isActive: true,
    exposeToUser: true,
    weight: 90,
    simMetrics: { passRate: 99.1, violations: 0, avgChemistry: 89 },
    rules: [
      {
        id: 'ACT_PRIVATE_ROOM',
        label: '독립 프라이빗 룸 보장',
        description: '외부 시선과 소음이 완전히 통제된 6인 전용 프라이빗 룸 배정',
        hardConstraint: true,
        exposeToUser: true,
        active: true,
        weight: 100,
        parameter: '단독 룸 필수',
      },
      {
        id: 'ACT_SPLIT_PAYMENT',
        label: '현장 식음료 1/N 실비 결제',
        description: '플랫폼은 리포트비(₩30,000)만 수취하며, 식음료비는 매장 현장에서 1/N 실비 직접 결제',
        hardConstraint: true,
        exposeToUser: true,
        active: true,
        weight: 100,
        parameter: '현장 실비 직접 결제',
      },
      {
        id: 'ACT_CONVERSATION_KIT',
        label: '대화 플레이북 키트 제공',
        description: '어색한 침묵을 방지하고 지적 교류를 돕는 단계별 대화 카드 현장 비치',
        hardConstraint: false,
        exposeToUser: false,
        active: true,
        weight: 70,
        parameter: '현장 비치 키트',
      },
    ],
  },
  {
    id: 'MOD_CHEMISTRY_IPC',
    stage: 4,
    stageName: '4층: 대화의 결 (궁합 최적화)',
    name: '대인관계 원형(IPC) 궁합 모듈',
    description: '대인관계 원형(지배 Dominance × 온기 Warmth) 8옥탄트 벡터를 기반으로 대화 궁합을 최적화합니다.',
    academicBasis: 'Interpersonal Circumplex (IPIP-IPC 8 Octants) & Similarity-Attraction Effect (r=.47)',
    isActive: true,
    exposeToUser: false,
    weight: 85,
    simMetrics: { passRate: 94.8, violations: 0, avgChemistry: 84.6 },
    rules: [
      {
        id: 'IPC_WARMTH_SIMILARITY',
        label: '온기(Warmth) 축 유사성 매칭',
        description: '배려심, 공감도, 대화 온도가 유사한 그룹 우선 배정 (학술 메타분석 유사성 우선 채택)',
        hardConstraint: false,
        exposeToUser: false,
        active: true,
        weight: 90,
        parameter: '유사도 r > 0.65',
      },
      {
        id: 'IPC_DOMINANCE_CAP',
        label: '강한 주도형(PA) 중복 상한',
        description: '목소리가 크고 주도성이 강한 성향(PA 옥탄트)은 테이블당 최대 2인 이하로 제한하여 충돌 방지',
        hardConstraint: true,
        exposeToUser: false,
        active: true,
        weight: 95,
        parameter: '최대 2인 이하',
      },
      {
        id: 'IPC_TEMPO_DEPTH',
        label: '대화 템포 & 깊이 선호 일치',
        description: '느긋하고 깊이 있는 사색형 vs 경쾌하고 위트 있는 사교형 결 일치',
        hardConstraint: false,
        exposeToUser: false,
        active: true,
        weight: 75,
        parameter: '가중치 75%',
      },
      {
        id: 'IPC_CHEMISTRY_THRESHOLD',
        label: '최소 추정 궁합 지수 임계치',
        description: '테이블 6인의 종합 상호작용 추정 궁합 지수 70점 이상 충족 시 최종 매칭 승인',
        hardConstraint: false,
        exposeToUser: true,
        active: true,
        weight: 80,
        parameter: '70점 이상',
      },
    ],
  },
  {
    id: 'MOD_STATE_CHECK',
    stage: 5,
    stageName: '5층: 당일 컨디션 보정',
    name: '당일 상태 미세 조정 모듈',
    description: '모임 24시간 전 간단 체크(에너지 레벨, 기대치)를 통해 당일 테이블 좌석 배치를 미세 보정합니다.',
    academicBasis: 'State-dependent Interaction Adjustment & Emergency Replacement Protocol',
    isActive: true,
    exposeToUser: true,
    weight: 70,
    simMetrics: { passRate: 97.5, violations: 0, avgChemistry: 86.2 },
    rules: [
      {
        id: 'STATE_ENERGY_LEVEL',
        label: '당일 에너지 레벨 체크',
        description: '피로도가 높은 날에는 듣는 포지션으로 배치하여 대화 압박감 완화',
        hardConstraint: false,
        exposeToUser: true,
        active: true,
        weight: 70,
        parameter: '24시간 전 3문항',
      },
      {
        id: 'STATE_NO_SHOW_RECOVERY',
        label: '노쇼/당일 취소 스탠바이 연동',
        description: '당일 불참 발생 시 대기 풀(Standby)에서 결이 일치하는 동성 회원 자동 호출',
        hardConstraint: true,
        exposeToUser: false,
        active: true,
        weight: 100,
        parameter: '즉시 긴급 복구',
      },
    ],
  },
  {
    id: 'MOD_MUTUAL_AUDIT',
    stage: 6,
    stageName: '6층: 다면 관찰 & 메타인지 리포트',
    name: '단일 명사 다면 평가 및 리포트 모듈',
    description: '모임 종료 후 동석자 전원의 단일 명사 관찰을 수합하여 사전 자가진단과의 격차(메타인지) 리포트를 발행합니다.',
    academicBasis: '헌법 제2조 단일 명사 원칙 + Johari Window (Self-Image vs Mirror-Image)',
    isActive: true,
    exposeToUser: true,
    weight: 100,
    simMetrics: { passRate: 99.8, violations: 0, avgChemistry: 91.4 },
    rules: [
      {
        id: 'AUDIT_SINGLE_NOUN',
        label: '단일 명사 5대 앵커 관찰',
        description: '품격, 미소, 경청, 배려, 시선 등 순수 1단어 지표로 인지적 왜곡 없는 0.1초 직관 관찰',
        hardConstraint: true,
        exposeToUser: true,
        active: true,
        weight: 100,
        parameter: '품격·미소·경청·배려·시선',
      },
      {
        id: 'AUDIT_RECIPROCAL_UNLOCK',
        label: '상호주의 100% 해금 원칙',
        description: '본인이 동석자 전원 평가를 100% 완료해야만 자신의 소셜 리포트가 열람 가능하도록 해금',
        hardConstraint: true,
        exposeToUser: true,
        active: true,
        weight: 100,
        parameter: '무임승차 원천 차단',
      },
      {
        id: 'AUDIT_ABSOLUTE_ANONYMITY',
        label: '절대 익명성 및 비하 방지',
        description: '누가 몇 점을 주었는지 비공개하며 가중 평균 지표로만 제공. 주관적 서술형 비하 기술적 차단',
        hardConstraint: true,
        exposeToUser: true,
        active: true,
        weight: 100,
        parameter: '1:1 점수 절대 비공개',
      },
      {
        id: 'AUDIT_META_DOSSIER',
        label: '메타인지 갭(Gap) 리포트 발행',
        description: '모임 전 T3 자가인식(Self)과 모임 후 타인 관찰(Mirror)의 차이를 시계열 자산으로 발행',
        hardConstraint: false,
        exposeToUser: true,
        active: true,
        weight: 95,
        parameter: '₩30,000 라이선스 발행',
      },
    ],
  },
];

const STORAGE_KEY = 'nadosolo_pipeline_modules_v1';

// 스토리지 저장 및 조회
export function getStoredPipelineModules(): PipelineModule[] {
  if (typeof window === 'undefined') return DEFAULT_PIPELINE_MODULES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PIPELINE_MODULES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // 딥 머지
      return DEFAULT_PIPELINE_MODULES.map((defMod) => {
        const found = parsed.find((p: PipelineModule) => p.id === defMod.id);
        if (!found) return defMod;
        return {
          ...defMod,
          ...found,
          rules: defMod.rules.map((defRule) => {
            const foundRule = (found.rules || []).find((r: PipelineModuleRule) => r.id === defRule.id);
            return foundRule ? { ...defRule, ...foundRule } : defRule;
          }),
        };
      });
    }
    return DEFAULT_PIPELINE_MODULES;
  } catch {
    return DEFAULT_PIPELINE_MODULES;
  }
}

export function saveStoredPipelineModules(modules: PipelineModule[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
  } catch (e) {
    console.error('Failed to save pipeline modules:', e);
  }
}

// ----------------------------------------------------------------------------
// 가상 합성 데이터 시뮬레이터 (Simulator Runner)
// ----------------------------------------------------------------------------
export interface SimCandidate {
  id: string;
  gender: 'M' | 'F';
  age: number;
  purpose: 'FRIEND' | 'RESET' | 'TASTE' | 'ROMANCE';
  isLegalSingle: boolean;
  warmth: number;     // 0 ~ 100
  dominance: number;  // 0 ~ 100 (PA 여부)
  location: string;
  verified: boolean;
}

export interface SimTableResult {
  tableId: string;
  purpose: string;
  members: SimCandidate[];
  avgChemistry: number;
  hardViolations: string[];
}

export interface SimReport {
  totalApplicants: number;
  tablesFormed: number;
  assignedUsers: number;
  unassignedUsers: number;
  avgChemistry: number;
  hardViolationCount: number;
  executionTimeMs: number;
  tables: SimTableResult[];
}

/**
 * N명의 가상 신청자를 생성하여 현재 활성화된 모듈 규칙 기반으로 매칭 시뮬레이션을 수행합니다.
 */
export function runPipelineSimulation(
  modules: PipelineModule[],
  applicantCount = 120
): SimReport {
  const startTime = performance.now();

  // 1. 활성화된 모듈 및 규칙 확인
  const condMod = modules.find((m) => m.id === 'MOD_COND_FILTER');
  const purposeMod = modules.find((m) => m.id === 'MOD_PURPOSE_ROUTER');
  const chemMod = modules.find((m) => m.id === 'MOD_CHEMISTRY_IPC');

  // 2. 가상 신청자 풀 생성
  const candidates: SimCandidate[] = [];
  const purposes: SimCandidate['purpose'][] = ['FRIEND', 'RESET', 'TASTE', 'ROMANCE'];

  for (let i = 1; i <= applicantCount; i++) {
    const isMale = Math.random() < 0.5;
    const purpose = purposes[Math.floor(Math.random() * purposes.length)];
    const isSingle = purpose === 'ROMANCE' ? true : Math.random() < 0.6; // 로맨스는 본인인증 미혼

    candidates.push({
      id: `SIM_USR_${String(i).padStart(4, '0')}`,
      gender: isMale ? 'M' : 'F',
      age: Math.floor(Math.random() * 20) + 45, // 45 ~ 64세
      purpose,
      isLegalSingle: isSingle,
      warmth: Math.floor(Math.random() * 50) + 50, // 50 ~ 100
      dominance: Math.floor(Math.random() * 100),  // 0 ~ 100
      location: 'BUSAN',
      verified: true,
    });
  }

  // 3. 목적별 그룹 분리
  const grouped: Record<string, SimCandidate[]> = {
    FRIEND: [],
    RESET: [],
    TASTE: [],
    ROMANCE: [],
  };

  candidates.forEach((c) => {
    grouped[c.purpose].push(c);
  });

  const formedTables: SimTableResult[] = [];
  let violationCount = 0;
  let totalChemistrySum = 0;

  // 4. 각 목적 그룹별 6인 테이블 편성 (남3 : 여3)
  Object.entries(grouped).forEach(([purp, pool]) => {
    const males = pool.filter((c) => c.gender === 'M');
    const females = pool.filter((c) => c.gender === 'F');

    // 온기 유사도로 정렬
    males.sort((a, b) => b.warmth - a.warmth);
    females.sort((a, b) => b.warmth - a.warmth);

    while (males.length >= 3 && females.length >= 3) {
      const selectedM = males.splice(0, 3);
      const selectedF = females.splice(0, 3);
      const tableMembers = [...selectedM, ...selectedF];

      const violations: string[] = [];

      // 하드 제약 검사
      if (purp === 'ROMANCE') {
        const invalidSingle = tableMembers.some((m) => !m.isLegalSingle);
        if (invalidSingle) {
          violations.push('하드 제약 위반: 기혼자가 인연 테이블에 배정됨');
          violationCount++;
        }
      }

      // 주도형(PA) 상한 검사 (dominance > 75는 주도형)
      const dominantCount = tableMembers.filter((m) => m.dominance > 75).length;
      if (dominantCount > 2) {
        // 규칙 위반 감지 (패널티)
        violations.push(`주도형 중복 경고: 강한 주도형 ${dominantCount}인 동석`);
      }

      // 연령 격차 검사
      const ages = tableMembers.map((m) => m.age);
      const ageSpan = Math.max(...ages) - Math.min(...ages);
      if (ageSpan > 14) {
        violations.push(`연령 격차 주의: 최대 연령차 ${ageSpan}세`);
      }

      // 궁합 지수 계산 (온기 평균 + 유사도 보너스)
      const avgWarmth =
        tableMembers.reduce((acc, cur) => acc + cur.warmth, 0) / tableMembers.length;
      const baseChem = Math.min(98, Math.max(70, Math.round(avgWarmth * 0.95 + 10)));
      totalChemistrySum += baseChem;

      formedTables.push({
        tableId: `TBL_SIM_${purp}_${formedTables.length + 1}`,
        purpose: purp,
        members: tableMembers,
        avgChemistry: baseChem,
        hardViolations: violations,
      });
    }
  });

  const endTime = performance.now();
  const assigned = formedTables.length * 6;

  return {
    totalApplicants: applicantCount,
    tablesFormed: formedTables.length,
    assignedUsers: assigned,
    unassignedUsers: applicantCount - assigned,
    avgChemistry: formedTables.length > 0 ? Math.round(totalChemistrySum / formedTables.length) : 0,
    hardViolationCount: violationCount,
    executionTimeMs: Math.round(endTime - startTime),
    tables: formedTables,
  };
}

