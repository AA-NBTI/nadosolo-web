/**
 * 나도솔로 (NN-nadosolo) 마이크로 플러그인 평가 엔진 공통 규약 (Data Contract)
 * GEMINI.md 헌법 2장(엔진 아키텍처) 및 3장(데이터 운영) 준수
 */

import { Gender } from '../types';

/**
 * 1. 단일 명사 1요소 관찰 정의 (Single Noun Anchor)
 * ❌ 수식어/복합어/엠퍼샌드 금지
 * ⭕ 순수 단일 명사 1단어 (예: '경청', '질문', '배려', '품격')
 */
export interface ObservationElement {
  id: string; // 예: 'EL_3040_LISTEN'
  anchorNoun: string; // 1단어 단일 명사 (예: '경청')
  criterionQuestion: string; // 1:1 단일 관찰 질문 (예: '상대방의 말을 끊지 않고 끝까지 듣는가?')
  category: 'COMMUNICATION' | 'ETIQUETTE' | 'ATMOSPHERE' | 'CHARACTER' | 'PLACE' | 'MEAL' | 'FLOW';
  description?: string;
}

/**
 * 2. 모듈 고유 관찰 척도 정의 (Self-Contained Metric Scale)
 * 모듈이 자신의 맥락에 맞게 자율 정의하는 1~5점 척도 정의
 */
export interface MetricScaleStep {
  stepValue: 1 | 2 | 3 | 4 | 5; // 1~5점
  label: string; // 1단어 직관 척도 (예: '매우아쉬움' | '아쉬움' | '보통' | '좋음' | '매우좋음')
  normalizedPoints: number; // 100점 만점 환산 점수 (예: 20점 만점 환산 시 4점씩)
}

export interface ModuleMetricScale {
  scaleId: string;
  name: string;
  steps: MetricScaleStep[];
}

/**
 * 3. 개별 참여자의 동석자 관찰 평가 레코드
 */
export interface ParticipantObservationRecord {
  recordId: string;
  sessionId: string;
  moduleId: string;
  fromUserId: string;
  toUserId: string;
  elementId: string;
  scoreStep: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
}

/**
 * 4. 마이크로 1기능 1모듈 플러그인 공통 인터페이스 (Pluggable Micro-Module)
 */
export interface EvaluationModule {
  id: string; // 고유 모듈 ID (예: 'MOD_TRACK_3040')
  name: string; // 모듈 명칭 (예: '3040 소셜 커뮤니케이션 모듈')
  targetContext: 'AGE_3040' | 'AGE_5060' | 'THEME_DINING' | 'THEME_WINE' | 'GLOBAL' | 'AUDIT_PLACE' | 'AUDIT_MEAL' | 'AUDIT_FLOW';
  version: string;

  // 1) 관찰 앵커 목록 반환 (단일 명사 1요소 1기준 목록)
  getObservationElements(): ObservationElement[];

  // 2) 이 모듈 전용 관찰 척도 반환
  getMetricScale(): ModuleMetricScale;

  // 3) 모듈 평가 집계 및 정규화 (100점 만점 표준 점수 환산)
  normalizeScore(records: ParticipantObservationRecord[], targetUserId: string): NormalizedModuleScore;
}

/**
 * 5. 정규화 집계 결과 (엔진 코어 출력 규격)
 */
export interface NormalizedElementScore {
  elementId: string;
  anchorNoun: string; // 1단어 (예: '경청')
  score100: number; // 100점 환산 점수
  rawAverageStep: number; // 1~5점 평균
  oppositeSexScore100?: number;
  sameSexScore100?: number;
  observationCount: number;
}

export interface NormalizedModuleScore {
  moduleId: string;
  moduleName: string;
  totalScore100: number; // 모듈 종합 100점 만점 점수
  elementScores: NormalizedElementScore[];
}

/**
 * 6. 개인 소셜 분석 리포트 모델 (PersonalSocialReport)
 * 상호주의 해금 원칙에 의해 동석자 전원 평가 완료 시에만 unlocked: true
 */
export interface PersonalSocialDossier {
  userId: string;
  sessionId: string;
  unlocked: boolean; // 상호주의 해금 상태 (내가 전원 평가 완료해야 true)
  evaluationCompletedCount: number; // 내가 완료한 동석자 평가 수
  requiredEvaluationCount: number; // 완료해야 할 총 동석자 수
  totalCompositeScore100: number; // 참여 모듈들의 가중 정규화 종합 100점 점수
  moduleReports: NormalizedModuleScore[];
  topStrengths: string[]; // 가장 높은 평가를 받은 단일 명사 3선 (예: ['경청', '배려', '미소'])
  growthPoints: string[]; // 개선 보완 단일 명사 (예: ['시선', '속도'])
  sessionCount: number; // 누적 참여 횟수 (시계열 아카이빙)
  createdAt: string;
}

/**
 * 7. 전주기 모임 점검 감사 리포트 (식당 공간 · 식사 미식 · 가변 타임라인 진행)
 */
export interface FullJourneyAuditReport {
  sessionId: string;
  totalAuditScore100: number; // 전주기 종합 100점 점수
  placeReport: NormalizedModuleScore; // 식당 공간 점검 결과
  mealReport: NormalizedModuleScore; // 식사 미식 점검 결과
  flowReport: NormalizedModuleScore; // 가변 진행 점검 결과
  verifiedPartnerEligible: boolean; // 식당 파트너 신뢰 유지 여부 (80점 이상)
  createdAt: string;
}


