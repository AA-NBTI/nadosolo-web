/**
 * ============================================================================
 * [동적 프로세스 게이트 엔진] processGateEngine.ts
 * ============================================================================
 * - 각 단계별 선행 진입 조건을 순수 함수(Pure Function)로 선언 및 판정합니다.
 * - 사용자의 현재 상태를 기반으로 단계별 [미시작 / 진행중 / 완료 / 정체] 상태와
 *   미충족 항목(missingFields), 즉시 안내 문구 및 바로가기 액션을 산출합니다.
 */

import { LoggedInUser } from './types';

export type ProcessStepId =
  | 'P01_IDENTITY'     // 계정 자격 증명 (회원가입/로그인)
  | 'P02_PROFILE'      // 기본 프로필 (닉네임, 성별, 연도, 연락처)
  | 'P03_PREFERENCE'   // 식이 제약 및 관심사 태그
  | 'P04_SELF_ASSESS'  // 성향 자기진단 baseline
  | 'P05_EVENT_APPLY'  // 모임 신청 및 테이블 편성
  | 'P06_SEAT_CONFIRM' // 좌석 배정 및 제휴 공간 안내
  | 'P07_PLAYBOOK'     // 현장 라운드 대화카드
  | 'P08_OBSERVE'      // 동석자 다면 상호 관찰
  | 'P10_REPORT';      // 소셜 코칭 리포트 (상호주의 해금)

export type StepProgressStatus = 'UNSTARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export interface GateRequirement {
  fieldKey: string;
  label: string;
  description: string;
  satisfied: boolean;
}

export interface ProcessGateResult {
  stepId: ProcessStepId;
  stepName: string;
  status: StepProgressStatus;
  allowed: boolean;
  missingRequirements: string[];
  requirements: GateRequirement[];
  guideMessage: string;
  actionLabel?: string;
  actionRoute?: string;
}

export interface UserContextSnapshot {
  user: LoggedInUser | null;
  hasSurveyAnswers?: boolean;
  isSeatReserved?: boolean;
  hasCompletedObservationCount?: number;
  totalObservationPeersCount?: number;
}

/**
 * [순수 함수] 특정 프로세스 단계의 진입 조건을 판정합니다.
 */
export function evaluateProcessGate(
  stepId: ProcessStepId,
  context: UserContextSnapshot
): ProcessGateResult {
  const { user } = context;

  // 1. 공통: 로그인 여부 검증
  if (!user) {
    return {
      stepId,
      stepName: getStepName(stepId),
      status: 'BLOCKED',
      allowed: false,
      missingRequirements: ['로그인'],
      requirements: [
        { fieldKey: 'auth', label: '로그인', description: '나도솔로 회원 로그인 필요', satisfied: false },
      ],
      guideMessage: '로그인 후 이용할 수 있는 단계입니다.',
      actionLabel: '로그인하기',
      actionRoute: '/auth',
    };
  }

  // 2. 단계별 선행 조건 선언 및 판정
  switch (stepId) {
    case 'P01_IDENTITY': {
      const hasId = Boolean(user.userId && user.handle);
      return {
        stepId,
        stepName: '계정 자격 증명',
        status: hasId ? 'COMPLETED' : 'IN_PROGRESS',
        allowed: true,
        missingRequirements: hasId ? [] : ['아이디'],
        requirements: [
          { fieldKey: 'userId', label: '회원 아이디', description: '고유 식별자', satisfied: Boolean(user.userId) },
          { fieldKey: 'email', label: '이메일', description: '계정 이메일', satisfied: Boolean(user.email) },
        ],
        guideMessage: hasId ? '회원 계정 인증이 완료되었습니다.' : '계정 정보 입력이 필요합니다.',
      };
    }

    case 'P02_PROFILE': {
      const hasPhone = Boolean(user.phone && user.phone !== '미등록' && user.phone !== '010-0000-0000');
      const hasNickname = Boolean(user.nickname && user.nickname.trim() !== '');
      const hasGender = Boolean(user.gender === 'F' || user.gender === 'M');
      const hasBirth = Boolean(user.birthYear && user.birthYear > 1920 && user.birthYear < 2010);
      const hasJob = Boolean(user.jobTitle && user.jobTitle !== '미입력');

      const reqs: GateRequirement[] = [
        { fieldKey: 'phone', label: '연락처', description: '모임 장소 및 비공개 안내 수신 번호', satisfied: hasPhone },
        { fieldKey: 'nickname', label: '활동 닉네임', description: '테이블에서 불릴 이름', satisfied: hasNickname },
        { fieldKey: 'gender', label: '성별', description: '3:3 성비 매칭 필수 기준', satisfied: hasGender },
        { fieldKey: 'birthYear', label: '출생연도', description: '세대별 테이블 편성 기준', satisfied: hasBirth },
        { fieldKey: 'jobTitle', label: '직무', description: '프로필 정보', satisfied: hasJob },
      ];

      const missing = reqs.filter((r) => !r.satisfied).map((r) => r.label);
      const isComplete = missing.length === 0;
      const isStarted = hasNickname || hasPhone;

      return {
        stepId,
        stepName: '기본 프로필 등록',
        status: isComplete ? 'COMPLETED' : isStarted ? 'IN_PROGRESS' : 'UNSTARTED',
        allowed: true,
        missingRequirements: missing,
        requirements: reqs,
        guideMessage: isComplete
          ? '기본 프로필 설정이 완료되었습니다.'
          : `${missing.join(', ')} 등록이 필요합니다.`,
        actionLabel: isComplete ? '수정하기' : '프로필 입력하기',
        actionRoute: '/dashboard',
      };
    }

    case 'P03_PREFERENCE': {
      // 식이 및 취향 설정
      return {
        stepId,
        stepName: '식이 제약 및 관심사',
        status: 'COMPLETED',
        allowed: true,
        missingRequirements: [],
        requirements: [
          { fieldKey: 'dietary', label: '식이 제한', description: '안전한 식사 준비', satisfied: true },
          { fieldKey: 'interests', label: '관심사', description: '공통 화제 매칭', satisfied: true },
        ],
        guideMessage: '식이 제약 및 취향 태그가 설정되었습니다.',
      };
    }

    case 'P04_SELF_ASSESS': {
      const hasAnswers = Boolean(context.hasSurveyAnswers);
      return {
        stepId,
        stepName: '성향 자기진단',
        status: hasAnswers ? 'COMPLETED' : 'IN_PROGRESS',
        allowed: true,
        missingRequirements: hasAnswers ? [] : ['성향 자가진단'],
        requirements: [
          { fieldKey: 'survey', label: '성향 자가진단', description: '소통 스타일 및 baseline 측정', satisfied: hasAnswers },
        ],
        guideMessage: hasAnswers
          ? '소통 성향 자가진단이 완료되었습니다.'
          : '3:3 매칭 및 소셜 리포트 기준선 측정을 위해 자가진단을 완료해 주세요.',
        actionLabel: '자가진단 작성',
        actionRoute: '/test',
      };
    }

    case 'P05_EVENT_APPLY': {
      // 선행 조건: 연락처 + 닉네임 + 성별 + 출생연도 (P02 필수 요소) + 자가진단 (P04)
      const p2Result = evaluateProcessGate('P02_PROFILE', context);
      const p4Result = evaluateProcessGate('P04_SELF_ASSESS', context);
      const missing = [...p2Result.missingRequirements, ...p4Result.missingRequirements];
      const allowed = missing.length === 0;

      const actionLabel = allowed
        ? '모임 신청하기'
        : p2Result.missingRequirements.length > 0
        ? '연락처/프로필 등록'
        : '자가진단 작성';

      const actionRoute = allowed
        ? '/dashboard'
        : p2Result.missingRequirements.length > 0
        ? '/dashboard'
        : '/test';

      return {
        stepId,
        stepName: '모임 신청 (테이블 편성)',
        status: allowed ? 'IN_PROGRESS' : 'BLOCKED',
        allowed,
        missingRequirements: missing,
        requirements: [...p2Result.requirements, ...p4Result.requirements],
        guideMessage: allowed
          ? '배정 가능한 프라이빗 다이닝 모임에 신청할 수 있습니다.'
          : `선행 조건 미충족: ${missing.join(', ')} 완료 후 신청할 수 있습니다.`,
        actionLabel,
        actionRoute,
      };
    }

    case 'P06_SEAT_CONFIRM': {
      // 선행 조건: 모임 신청 및 좌석 확정 (isSeatReserved)
      const isReserved = Boolean(context.isSeatReserved);
      return {
        stepId,
        stepName: '좌석 배정 및 공간 안내',
        status: isReserved ? 'COMPLETED' : 'BLOCKED',
        allowed: isReserved,
        missingRequirements: isReserved ? [] : ['모임 신청 및 테이블 확정'],
        requirements: [
          { fieldKey: 'seat', label: '테이블 예약', description: '참가 확정 티켓', satisfied: isReserved },
        ],
        guideMessage: isReserved
          ? '좌석 배정 및 D-1 식당 안내가 확정되었습니다.'
          : '모임 신청 완료 후 좌석 번호와 프라이빗 룸이 배정됩니다.',
        actionLabel: isReserved ? '좌석 확인' : '모임 신청하러 가기',
        actionRoute: '/dashboard',
      };
    }

    case 'P07_PLAYBOOK': {
      const isReserved = Boolean(context.isSeatReserved);
      return {
        stepId,
        stepName: '현장 라운드 대화카드',
        status: isReserved ? 'IN_PROGRESS' : 'BLOCKED',
        allowed: isReserved,
        missingRequirements: isReserved ? [] : ['테이블 배정 확정'],
        requirements: [
          { fieldKey: 'reservation', label: '모임 참가 확정', description: '현장 세션 입장 자격', satisfied: isReserved },
        ],
        guideMessage: isReserved
          ? '모임 당일 식탁에서 양방향 대화카드가 활성화됩니다.'
          : '모임 신청 완료 후 대화카드가 열립니다.',
      };
    }

    case 'P08_OBSERVE': {
      // 선행 조건: 모임 참가 확정
      const isReserved = Boolean(context.isSeatReserved);
      const count = context.hasCompletedObservationCount ?? 0;
      const total = context.totalObservationPeersCount ?? 5;
      const isAllDone = count >= total && total > 0;

      return {
        stepId,
        stepName: '동석자 5인 상호 관찰',
        status: isAllDone ? 'COMPLETED' : isReserved ? 'IN_PROGRESS' : 'BLOCKED',
        allowed: isReserved,
        missingRequirements: isReserved
          ? isAllDone ? [] : [`동석자 평가 (${count}/${total}명 완료)`]
          : ['모임 참가 자격'],
        requirements: [
          { fieldKey: 'observe', label: '동석자 전원 평가', description: '상호주의 해금 원칙', satisfied: isAllDone },
        ],
        guideMessage: isAllDone
          ? '동석자 전원 상호 관찰 평가가 완료되었습니다.'
          : `동석자 5인에 대한 관찰 평가를 100% 완료해 주세요. (현재 ${count}/${total}명)`,
        actionLabel: '평가 진행하기',
        actionRoute: '/dashboard',
      };
    }

    case 'P10_REPORT': {
      // 헌법 제3조 상호주의 원칙: 동석자 전원 관찰 평가를 100% 완료해야 리포트가 해금됨
      const count = context.hasCompletedObservationCount ?? 0;
      const total = context.totalObservationPeersCount ?? 5;
      const isReciprocalUnlocked = count >= total && total > 0;

      return {
        stepId,
        stepName: '소셜 메타인지 코칭리포트',
        status: isReciprocalUnlocked ? 'COMPLETED' : 'BLOCKED',
        allowed: isReciprocalUnlocked,
        missingRequirements: isReciprocalUnlocked ? [] : ['동석자 전원(5/5) 상호 관찰 평가 100% 완료'],
        requirements: [
          { fieldKey: 'reciprocal', label: '상호주의 해금 조건', description: '동석자 전원 평가 완료 시 즉시 오픈', satisfied: isReciprocalUnlocked },
        ],
        guideMessage: isReciprocalUnlocked
          ? '타인의 시선으로 발견한 내 소셜 리포트가 열람 가능합니다.'
          : '상호주의 해금 규칙: 동석자 전원에 대한 평가를 완료해야 내 리포트가 열립니다.',
        actionLabel: isReciprocalUnlocked ? '리포트 열람' : '동석자 평가 완료하러 가기',
        actionRoute: '/dashboard',
      };
    }

    default:
      return {
        stepId,
        stepName: getStepName(stepId),
        status: 'UNSTARTED',
        allowed: true,
        missingRequirements: [],
        requirements: [],
        guideMessage: '',
      };
  }
}

/**
 * 전체 프로세스 여정을 일괄 진단하여 최우선 해결 과제(Next Action)를 도출합니다.
 */
export function evaluateFullJourney(context: UserContextSnapshot): {
  steps: ProcessGateResult[];
  currentStalledStep: ProcessGateResult | null;
  nextRecommendedAction: {
    title: string;
    description: string;
    actionLabel: string;
    actionRoute: string;
  } | null;
} {
  const allStepIds: ProcessStepId[] = [
    'P01_IDENTITY',
    'P02_PROFILE',
    'P03_PREFERENCE',
    'P04_SELF_ASSESS',
    'P05_EVENT_APPLY',
    'P06_SEAT_CONFIRM',
    'P07_PLAYBOOK',
    'P08_OBSERVE',
    'P10_REPORT',
  ];

  const results = allStepIds.map((id) => evaluateProcessGate(id, context));
  const blockedOrIncomplete = results.find(
    (r) => r.status === 'BLOCKED' || r.status === 'IN_PROGRESS' || r.status === 'UNSTARTED'
  );

  let nextAction = null;
  if (blockedOrIncomplete) {
    nextAction = {
      title: blockedOrIncomplete.stepName,
      description: blockedOrIncomplete.guideMessage,
      actionLabel: blockedOrIncomplete.actionLabel || '진행하기',
      actionRoute: blockedOrIncomplete.actionRoute || '/dashboard',
    };
  }

  return {
    steps: results,
    currentStalledStep: blockedOrIncomplete || null,
    nextRecommendedAction: nextAction,
  };
}

export interface StalledUserCase {
  userId: string;
  handle: string;
  nickname: string;
  gender: string;
  stepId: ProcessStepId;
  stepName: string;
  missingField: string;
  durationLabel: string;
  severity: 'WARNING' | 'CRITICAL';
  suggestedMessage: string;
}

/**
 * [순수 함수] 회원 정보를 분석하여 정체·이탈 여부 및 미충족 단계를 진단합니다.
 */
export function detectStalledUserJourney(
  user: LoggedInUser,
  context: Partial<UserContextSnapshot>
): StalledUserCase | null {
  const fullSnapshot: UserContextSnapshot = {
    user,
    hasSurveyAnswers: context.hasSurveyAnswers,
    isSeatReserved: context.isSeatReserved,
    hasCompletedObservationCount: context.hasCompletedObservationCount,
    totalObservationPeersCount: context.totalObservationPeersCount,
  };

  const gate = evaluateFullJourney(fullSnapshot);
  if (!gate.currentStalledStep) return null;

  const stalled = gate.currentStalledStep;
  const missing = stalled.missingRequirements.join(', ') || '요구조건 미충족';

  let durationLabel = '가입 후 진행 정체';
  let severity: 'WARNING' | 'CRITICAL' = 'WARNING';
  let suggestedMessage = `${stalled.stepName} 단계가 완료되지 않았습니다.`;

  if (stalled.stepId === 'P02_PROFILE') {
    durationLabel = '가입 후 24시간 경과';
    severity = 'WARNING';
    suggestedMessage = `[나도솔로] ${user.nickname || user.handle}님, 연락처와 기본 프로필을 등록하시면 맞춤형 테이블이 배정됩니다.`;
  } else if (stalled.stepId === 'P04_SELF_ASSESS') {
    durationLabel = '프로필 작성 후 36시간 정체';
    severity = 'WARNING';
    suggestedMessage = `[나도솔로] ${user.nickname || user.handle}님, 5개 문항의 소통 성향 자가진단을 완료하고 나의 식탁 아키타입을 확인해보세요.`;
  } else if (stalled.stepId === 'P05_EVENT_APPLY') {
    durationLabel = '진단 완료 후 모임 미신청';
    severity = 'WARNING';
    suggestedMessage = `[나도솔로] 이번 주말 열리는 6인의 프라이빗 소셜 다이닝 좌석 신청이 가능합니다.`;
  } else if (stalled.stepId === 'P08_OBSERVE' || stalled.stepId === 'P10_REPORT') {
    durationLabel = '모임 종료 후 12시간 경과';
    severity = 'CRITICAL';
    suggestedMessage = `[나도솔로] 동석자 5인 관찰 평가를 완료하시면 타인의 시선으로 관찰된 나의 소셜 코칭 리포트가 즉시 해금됩니다.`;
  }

  return {
    userId: user.userId,
    handle: user.handle,
    nickname: user.nickname || '이용자',
    gender: user.gender,
    stepId: stalled.stepId,
    stepName: stalled.stepName,
    missingField: missing,
    durationLabel,
    severity,
    suggestedMessage,
  };
}

/**
 * 관리자 관제용 샘플 정체 회원 목록 프리셋
 */
export const SAMPLE_STALLED_USER_CASES: StalledUserCase[] = [
  {
    userId: 'user_stalled_01',
    handle: '@minji_98',
    nickname: '민지',
    gender: 'F',
    stepId: 'P02_PROFILE',
    stepName: '기본 프로필 등록',
    missingField: '연락처 (미등록)',
    durationLabel: '가입 후 28시간 경과',
    severity: 'WARNING',
    suggestedMessage: '[나도솔로] 민지님, 모임 장소 비공개 수신을 위해 연락처 등록을 완료해 주세요.',
  },
  {
    userId: 'user_stalled_02',
    handle: '@hyuk_architect',
    nickname: '준혁',
    gender: 'M',
    stepId: 'P04_SELF_ASSESS',
    stepName: '성향 자기진단',
    missingField: '성향 자가진단 (미완료)',
    durationLabel: '프로필 작성 후 36시간 정체',
    severity: 'WARNING',
    suggestedMessage: '[나도솔로] 준혁님, 6인의 식탁 3:3 균형 매칭을 위해 5문항의 소통 성향 자가진단을 완료해 주세요.',
  },
  {
    userId: 'user_stalled_03',
    handle: '@clara_seo',
    nickname: '클라라',
    gender: 'F',
    stepId: 'P08_OBSERVE',
    stepName: '동석자 5인 상호 관찰',
    missingField: '동석자 평가 (2/5명 완료)',
    durationLabel: '모임 종료 후 18시간 경과',
    severity: 'CRITICAL',
    suggestedMessage: '[나도솔로] 클라라님, 남은 동석자 3인에 대한 평가를 완료하시면 100점 코칭 리포트가 상호주의 해금됩니다.',
  },
];

function getStepName(stepId: ProcessStepId): string {
  switch (stepId) {
    case 'P01_IDENTITY': return '계정 자격 증명';
    case 'P02_PROFILE': return '기본 프로필';
    case 'P03_PREFERENCE': return '식이 제약 및 관심사';
    case 'P04_SELF_ASSESS': return '성향 자기진단';
    case 'P05_EVENT_APPLY': return '모임 신청';
    case 'P06_SEAT_CONFIRM': return '좌석 배정';
    case 'P07_PLAYBOOK': return '현장 대화카드';
    case 'P08_OBSERVE': return '동석자 상호 관찰';
    case 'P10_REPORT': return '소셜 리포트 해금';
    default: return stepId;
  }
}

