import {
  MirrorDossierReport,
  MirrorEvaluationModule,
  MirrorMetricScale,
  MirrorModulePreset,
  MirrorNormalizedElementScore,
  MirrorNormalizedModuleScore,
  MirrorObservationElement,
  MirrorObservationRecord,
} from './types';

export function createMirrorEngine(preset: MirrorModulePreset) {
  const strengthTopCount = preset.strengthTopCount ?? 3;
  const growthPointCount = preset.growthPointCount ?? 2;

  /**
   * 1. 단일 명사 1요소 검증기 (공백, &, /, +, , 등 복합어/수식어 차단)
   */
  function validateSingleNounAnchor(noun: string): { valid: boolean; reason?: string } {
    const trimmed = noun.trim();
    if (!trimmed) {
      return { valid: false, reason: '빈 명사는 허용되지 않습니다.' };
    }
    if (preset.enforceSingleNounRule && /[\s&/+,·]/.test(trimmed)) {
      return {
        valid: false,
        reason: `[${trimmed}]에 공백 또는 복합 기호(&, /, +, , 등)가 포함되어 있습니다.`,
      };
    }
    return { valid: true };
  }

  /**
   * 2. 상호주의 해금 판정기 (Reciprocal Unlock)
   */
  function checkReciprocalUnlock(
    completedCount: number,
    requiredCount?: number
  ): { unlocked: boolean; remainingCount: number; progressPercent: number } {
    const target = Math.max(1, requiredCount ?? preset.defaultRequiredPeerCount);
    const done = Math.max(0, completedCount);
    const unlocked = done >= target;
    const remainingCount = Math.max(0, target - done);
    const progressPercent = Math.min(100, Math.round((done / target) * 100));
    return { unlocked, remainingCount, progressPercent };
  }

  /**
   * 3. 범용 정규화 집계기 (1~5점 척도 응답 -> 100점 만점 정규화)
   */
  function normalizeModuleScores(
    moduleMeta: { id: string; name: string },
    elements: MirrorObservationElement[],
    scale: MirrorMetricScale,
    records: MirrorObservationRecord[],
    targetUserId: string
  ): MirrorNormalizedModuleScore {
    const targetRecords = records.filter(
      (r) => r.moduleId === moduleMeta.id && r.toUserId === targetUserId
    );
    const maxScalePoints = Math.max(
      1,
      ...scale.steps.map((s) => s.normalizedPoints)
    );
    const stepPointsMap = new Map(
      scale.steps.map((s) => [s.stepValue, s.normalizedPoints])
    );

    const elementScores: MirrorNormalizedElementScore[] = elements.map((el) => {
      const elRecords = targetRecords.filter((r) => r.elementId === el.id);
      if (elRecords.length === 0) {
        return {
          elementId: el.id,
          anchorNoun: el.anchorNoun,
          score100: preset.defaultFallbackScore100,
          rawAverageStep: 4,
          observationCount: 0,
        };
      }

      const avgRaw =
        elRecords.reduce((sum, r) => sum + r.scoreStep, 0) / elRecords.length;
      const avgScalePts =
        elRecords.reduce(
          (sum, r) => sum + (stepPointsMap.get(r.scoreStep) ?? (r.scoreStep / 5) * maxScalePoints),
          0
        ) / elRecords.length;
      const score100 = Math.round((avgScalePts / maxScalePoints) * 100);

      return {
        elementId: el.id,
        anchorNoun: el.anchorNoun,
        score100,
        rawAverageStep: Math.round(avgRaw * 10) / 10,
        observationCount: elRecords.length,
      };
    });

    const totalScore100 =
      elementScores.length > 0
        ? Math.round(
            elementScores.reduce((sum, e) => sum + e.score100, 0) / elementScores.length
          )
        : preset.defaultFallbackScore100;

    return {
      moduleId: moduleMeta.id,
      moduleName: moduleMeta.name,
      totalScore100,
      elementScores,
    };
  }

  /**
   * 4. 통합 리포트 생성기 (플러그인 모듈 조합 + 상호해금 + 100점 정규화 + 강점/보완 추출)
   */
  function generateDossier(params: {
    targetUserId: string;
    sessionId: string;
    modules: MirrorEvaluationModule[];
    records: MirrorObservationRecord[];
    completedCountByTargetUser?: number;
    requiredCount?: number;
    sessionCount?: number;
  }): MirrorDossierReport {
    const requiredEvaluationCount = params.requiredCount ?? preset.defaultRequiredPeerCount;
    const evaluationCompletedCount = params.completedCountByTargetUser ?? requiredEvaluationCount;
    const sessionCount = params.sessionCount ?? 1;

    const { unlocked } = checkReciprocalUnlock(
      evaluationCompletedCount,
      requiredEvaluationCount
    );

    const moduleReports: MirrorNormalizedModuleScore[] = params.modules.map((mod) =>
      mod.normalizeScore(params.records, params.targetUserId)
    );

    const totalCompositeScore100 =
      moduleReports.length > 0
        ? Math.round(
            moduleReports.reduce((acc, curr) => acc + curr.totalScore100, 0) /
              moduleReports.length
          )
        : preset.defaultFallbackScore100;

    const allElementScores = moduleReports.flatMap((m) => m.elementScores);
    const sortedByScore = [...allElementScores].sort((a, b) => b.score100 - a.score100);

    const topStrengths = sortedByScore
      .slice(0, strengthTopCount)
      .map((el) => el.anchorNoun);

    const growthPoints = [...sortedByScore]
      .reverse()
      .slice(0, growthPointCount)
      .map((el) => el.anchorNoun);

    return {
      userId: params.targetUserId,
      sessionId: params.sessionId,
      unlocked,
      evaluationCompletedCount,
      requiredEvaluationCount,
      totalCompositeScore100,
      moduleReports,
      topStrengths,
      growthPoints,
      sessionCount,
      createdAt: new Date().toISOString(),
    };
  }

  return {
    preset,
    validateSingleNounAnchor,
    checkReciprocalUnlock,
    normalizeModuleScores,
    generateDossier,
  };
}
