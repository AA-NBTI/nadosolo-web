import {
  GrowthPointTag,
  JohariGapInsight,
  MirrorDiagnosisResult,
  PeerMirrorFeedback,
  PositiveCharmTag,
  SoloCompetencyScores,
  TraitVector,
} from './types';

/**
 * [Domain A - ②] MirrorEngine (타인이 본 나 & 조하리의 창 객관화 엔진)
 * - 내가 본 나(SelfVector) 데이터를 훼손하지 않고, 동석자 다면 피드백으로부터 '타인이 본 나(MirrorVector)'를 독립 산출합니다.
 * - 두 벡터 간의 Gap을 분석해 '숨은 매력(Hidden Charm)'과 '사각지대(Blind Spot)'를 진단합니다.
 * - 매칭 엔진에 주입할 합성 실효 벡터(EffectiveVector = Self * α + Mirror * (1-α))를 생성합니다.
 */
export class MirrorEngine {
  /**
   * 누적된 동석자 피드백과 본인의 SelfVector를 비교하여 미러 진단 결과 및 EffectiveVector 산출
   */
  public static analyzeMirror(
    userId: string,
    selfVector: TraitVector,
    feedbacks: PeerMirrorFeedback[]
  ): MirrorDiagnosisResult {
    const userFeedbacks = feedbacks.filter((f) => f.toUserId === userId);
    const count = userFeedbacks.length;

    if (count === 0) {
      return {
        userId,
        feedbackCount: 0,
        selfVector,
        mirrorVector: { ...selfVector },
        effectiveVector: { ...selfVector },
        competencyAvg: {
          communicationBalance: 70,
          groomingAndSelfCare: 70,
          empathyAndVibe: 70,
          lifestyleVitality: 70,
        },
        topCharms: [],
        topGrowthPoints: [],
        johariInsights: [],
      };
    }

    // 1. 타인이 관찰한 성향 평균(MirrorVector) 산출
    const mirrorVector: TraitVector = { ...selfVector };
    const keys: (keyof TraitVector)[] = [
      'extroversion',
      'talkLead',
      'lifestyleActive',
      'romanceIntent',
      'alcoholPreference',
    ];

    for (const key of keys) {
      const validValues = userFeedbacks
        .map((f) => f.observedTraitHint[key])
        .filter((v): v is number => typeof v === 'number');

      if (validValues.length > 0) {
        const avg = validValues.reduce((a, b) => a + b, 0) / validValues.length;
        mirrorVector[key] = Number(avg.toFixed(3));
      }
    }

    // 2. 매칭용 합성 실효 벡터(EffectiveVector) 산출
    // 피드백이 쌓일수록 타인 관찰 비중(1-α)을 최대 0.45까지 점진적 반영 (Self 0.55 + Mirror 0.45)
    const mirrorWeight = Math.min(0.45, count * 0.1);
    const selfWeight = 1 - mirrorWeight;
    const effectiveVector: TraitVector = {
      extroversion: this.blend(selfVector.extroversion, mirrorVector.extroversion, selfWeight),
      talkLead: this.blend(selfVector.talkLead, mirrorVector.talkLead, selfWeight),
      lifestyleActive: this.blend(selfVector.lifestyleActive, mirrorVector.lifestyleActive, selfWeight),
      romanceIntent: this.blend(selfVector.romanceIntent, mirrorVector.romanceIntent, selfWeight),
      alcoholPreference: this.blend(selfVector.alcoholPreference, mirrorVector.alcoholPreference, selfWeight),
    };

    // 3. 4대 솔로 역량 평균 점수 산출
    const competencyAvg: SoloCompetencyScores = {
      communicationBalance: Math.round(
        userFeedbacks.reduce((s, f) => s + f.competencyRatings.communicationBalance, 0) / count
      ),
      groomingAndSelfCare: Math.round(
        userFeedbacks.reduce((s, f) => s + f.competencyRatings.groomingAndSelfCare, 0) / count
      ),
      empathyAndVibe: Math.round(
        userFeedbacks.reduce((s, f) => s + f.competencyRatings.empathyAndVibe, 0) / count
      ),
      lifestyleVitality: Math.round(
        userFeedbacks.reduce((s, f) => s + f.competencyRatings.lifestyleVitality, 0) / count
      ),
    };

    // 4. 최다 득표 매력 태그 & 성장 포인트 태그 집계
    const topCharms = this.rankTags<PositiveCharmTag>(
      userFeedbacks.map((f) => f.selectedCharmTag)
    );
    const topGrowthPoints = this.rankTags<GrowthPointTag>(
      userFeedbacks
        .map((f) => f.selectedGrowthTipTag)
        .filter((t): t is GrowthPointTag => Boolean(t))
    );

    // 5. 조하리의 창(Johari Window) Gap 인사이트 도출
    const johariInsights = this.buildJohariInsights(selfVector, mirrorVector);

    return {
      userId,
      feedbackCount: count,
      selfVector,
      mirrorVector,
      effectiveVector,
      competencyAvg,
      topCharms,
      topGrowthPoints,
      johariInsights,
    };
  }

  private static buildJohariInsights(
    self: TraitVector,
    mirror: TraitVector
  ): JohariGapInsight[] {
    const axisLabels: Record<keyof TraitVector, string> = {
      extroversion: '외향성·현장 에너지',
      talkLead: '대화 리드·질문력',
      lifestyleActive: '라이프스타일 활력',
      romanceIntent: '설렘·호감 표현력',
      alcoholPreference: '자리 분위기 동조력',
    };

    const insights: JohariGapInsight[] = [];

    for (const axis of Object.keys(axisLabels) as (keyof TraitVector)[]) {
      const selfScore = Math.round(self[axis] * 100);
      const mirrorScore = Math.round(mirror[axis] * 100);
      const gap = mirrorScore - selfScore;

      let quadrant: JohariGapInsight['quadrant'] = 'NEUTRAL_ALIGNED';
      let summaryMessage = `[${axisLabels[axis]}] 본인의 인식(${selfScore}점)과 타인의 시선(${mirrorScore}점)이 일치합니다.`;

      if (gap >= 15) {
        quadrant = 'HIDDEN_CHARM';
        summaryMessage = `🌱 [숨은 매력 발견 - ${axisLabels[axis]}] 스스로는 ${selfScore}점으로 겸손하게 평가하셨지만, 동석자들은 ${mirrorScore}점(+${gap})의 매력적인 모습으로 기억했어요!`;
      } else if (gap <= -15) {
        quadrant = 'BLIND_SPOT';
        summaryMessage = `💡 [돌아볼 사각지대 - ${axisLabels[axis]}] 본인은 ${selfScore}점으로 생각하셨으나, 현장에서는 ${mirrorScore}점(${gap})으로 비쳤어요. 표정이나 대화 비중을 점검해 보면 어떨까요?`;
      } else if (selfScore >= 70 && mirrorScore >= 70) {
        quadrant = 'OPEN_STRENGTH';
        summaryMessage = `✨ [검증된 핵심 강점 - ${axisLabels[axis]}] 본인과 타인 모두 인정하는 확실한 매력 포인트(${mirrorScore}점)입니다.`;
      }

      insights.push({
        axis,
        selfScore,
        mirrorScore,
        gap,
        quadrant,
        summaryMessage,
      });
    }

    return insights;
  }

  private static rankTags<T extends string>(tags: T[]): T[] {
    const counts = new Map<T, number>();
    for (const t of tags) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }

  private static blend(a: number, b: number, weightA: number): number {
    return Number((a * weightA + b * (1 - weightA)).toFixed(3));
  }
}

