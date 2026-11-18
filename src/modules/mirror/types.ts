/**
 * 범용 다면 관찰 · 상호주의 해금 · 100점 정규화 리포트 모듈 타입 정의
 * 특정 서비스 도메인에 종속되지 않는 순수 표준 계약.
 */

export interface MirrorObservationElement {
  id: string;
  anchorNoun: string;
  criterionQuestion: string;
  category: string;
  description?: string;
}

export interface MirrorMetricScaleStep {
  stepValue: 1 | 2 | 3 | 4 | 5;
  label: string;
  normalizedPoints: number;
}

export interface MirrorMetricScale {
  scaleId: string;
  name: string;
  steps: MirrorMetricScaleStep[];
}

export interface MirrorObservationRecord {
  recordId: string;
  sessionId: string;
  moduleId: string;
  fromUserId: string;
  toUserId: string;
  elementId: string;
  scoreStep: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
}

export interface MirrorNormalizedElementScore {
  elementId: string;
  anchorNoun: string;
  score100: number;
  rawAverageStep: number;
  oppositeSexScore100?: number;
  sameSexScore100?: number;
  observationCount: number;
}

export interface MirrorNormalizedModuleScore {
  moduleId: string;
  moduleName: string;
  totalScore100: number;
  elementScores: MirrorNormalizedElementScore[];
}

export interface MirrorEvaluationModule {
  id: string;
  name: string;
  version: string;
  getObservationElements(): MirrorObservationElement[];
  getMetricScale(): MirrorMetricScale;
  normalizeScore(
    records: MirrorObservationRecord[],
    targetUserId: string
  ): MirrorNormalizedModuleScore;
}

export interface MirrorDossierReport {
  userId: string;
  sessionId: string;
  unlocked: boolean;
  evaluationCompletedCount: number;
  requiredEvaluationCount: number;
  totalCompositeScore100: number;
  moduleReports: MirrorNormalizedModuleScore[];
  topStrengths: string[];
  growthPoints: string[];
  sessionCount: number;
  createdAt: string;
}

export interface MirrorModulePreset {
  namespace: string;
  defaultRequiredPeerCount: number;
  enforceSingleNounRule: boolean;
  defaultFallbackScore100: number;
  strengthTopCount?: number;
  growthPointCount?: number;
}
