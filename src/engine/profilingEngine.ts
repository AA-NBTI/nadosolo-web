import {
  InterestTag,
  SurveyAnswer,
  SurveyQuestion,
  TraitVector,
} from './types';

/**
 * [Domain A - ①] ProfilingEngine (내가 본 나 & 관심사 벡터 엔진)
 * 자가 진단 설문을 기반으로 '내가 생각하는 나의 5차원 성향(SelfVector)'을 추출하고,
 * 두 유저 간의 기본 성향 시너지 및 관심사(InterestTag) 유사도를 계산합니다.
 */
export class ProfilingEngine {
  public static readonly DEFAULT_TRAIT: TraitVector = {
    extroversion: 0.5,
    talkLead: 0.5,
    lifestyleActive: 0.5,
    romanceIntent: 0.5,
    alcoholPreference: 0.5,
  };

  /**
   * 설문 응답으로부터 정규화된 SelfVector(내가 본 나) 산출
   */
  public static computeSelfVector(
    questions: SurveyQuestion[],
    answers: SurveyAnswer[]
  ): TraitVector {
    const scores: TraitVector = { ...this.DEFAULT_TRAIT };
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) continue;

      const option = question.options.find(
        (opt) => opt.id === answer.selectedOptionId
      );
      if (!option) continue;

      for (const key of Object.keys(scores) as (keyof TraitVector)[]) {
        const delta = option.weights[key];
        if (typeof delta === 'number') {
          scores[key] = this.clamp(scores[key] + delta, 0, 1);
        }
      }
    }

    return scores;
  }

  /**
   * 두 참가자의 성향 시너지 점수 계산 (0 ~ 100)
   * - 라이프스타일/음주/목적은 유사할수록 가산점
   * - 대화 주도성(talkLead)은 화자+청자 상보적일 때 가산점
   */
  public static calculateTraitSynergy(a: TraitVector, b: TraitVector): number {
    const lifestyleSimilarity = 1 - Math.abs(a.lifestyleActive - b.lifestyleActive);
    const alcoholSimilarity = 1 - Math.abs(a.alcoholPreference - b.alcoholPreference);
    const intentSimilarity = 1 - Math.abs(a.romanceIntent - b.romanceIntent);
    const talkComplementarity = 1 - Math.abs((a.talkLead + b.talkLead) - 1.0);

    const weighted =
      intentSimilarity * 0.30 +
      lifestyleSimilarity * 0.25 +
      alcoholSimilarity * 0.20 +
      talkComplementarity * 0.25;

    return Math.round(weighted * 100);
  }

  /**
   * 관심사 태그(InterestTag[]) 간의 공통 분모 및 유사도 계산 (0 ~ 100)
   * 자카드 유사도(Jaccard Similarity) + 최소 1~2개 공통 관심사 보너스 적용
   */
  public static calculateInterestSimilarity(
    tagsA: InterestTag[],
    tagsB: InterestTag[]
  ): number {
    if (tagsA.length === 0 || tagsB.length === 0) return 50;

    const setA = new Set(tagsA);
    const setB = new Set(tagsB);
    let intersection = 0;

    for (const tag of setA) {
      if (setB.has(tag)) intersection++;
    }

    const union = new Set([...tagsA, ...tagsB]).size;
    const jaccard = union > 0 ? intersection / union : 0;

    // 2개 이상 관심사가 겹치면 딥토크가 가능하므로 높은 점수 부여
    const overlapBonus = Math.min(intersection * 0.25, 0.5);
    return Math.round(Math.min(1.0, jaccard * 0.7 + overlapBonus) * 100);
  }

  private static clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, Number(val.toFixed(3))));
  }
}
