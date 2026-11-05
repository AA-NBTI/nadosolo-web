import {
  BudgetTier,
  DietaryRestriction,
  GroupingResult,
  HistoricalEncounter,
  LanguageCode,
  MatchedTable,
  ModePolicyConfig,
  ParticipantProfile,
  SocialMode,
  TraitVector,
} from './types';
import { ProfilingEngine } from './profilingEngine';
import { LocalePolicyEngine } from './localePolicyEngine';

/**
 * [Domain B - ⑤] GroupingEngine (글로벌 다중 제약 & 모드별 동적 가중치 매칭 엔진)
 * - 도시, 소셜 모드(ROMANCE/PLATONIC/THEME), 테이블 언어, 예산 티어별로 참가자 풀을 클러스터링합니다.
 * - MirrorEngine이 산출한 실효 성향 벡터(EffectiveVector)와 관심사 태그(InterestTag)를 기반으로
 *   모드별 동적 가중치 매트릭스를 적용해 최적의 6인 테이블을 편성합니다.
 */
export class GroupingEngine {
  public static matchTables(
    participants: ParticipantProfile[],
    pastEncounters: HistoricalEncounter[] = []
  ): GroupingResult {
    const matchedTables: MatchedTable[] = [];
    const unassignedParticipants: ParticipantProfile[] = [];

    const encounterSet = new Set<string>();
    for (const enc of pastEncounters) {
      encounterSet.add(this.pairKey(enc.userA, enc.userB));
    }

    // 1. 클러스터 키: cityCode | preferredMode | preferredTableLanguage | budgetTier
    const clusters = new Map<string, ParticipantProfile[]>();
    for (const p of participants) {
      const policy = LocalePolicyEngine.getModePolicy(p.preferredMode);
      const userFluency = p.languages[p.preferredTableLanguage];
      // 요청한 테이블 언어의 최소 회화 레벨 미달 시 미배정 처리
      if (!LocalePolicyEngine.isFluencySufficient(userFluency, policy.minFluencyRequired)) {
        unassignedParticipants.push(p);
        continue;
      }

      const key = `${p.cityCode}|${p.preferredMode}|${p.preferredTableLanguage}|${p.budgetTier}`;
      const list = clusters.get(key) ?? [];
      list.push(p);
      clusters.set(key, list);
    }

    let tableSeq = 1;

    // 2. 각 클러스터별로 모드 정책에 따라 테이블 편성
    for (const [clusterKey, pool] of clusters.entries()) {
      const [cityCode, modeStr, langStr, budgetStr] = clusterKey.split('|');
      const mode = modeStr as SocialMode;
      const tableLanguage = langStr as LanguageCode;
      const budgetTier = budgetStr as BudgetTier;
      const policy = LocalePolicyEngine.getModePolicy(mode);

      const usedIds = new Set<string>();

      if (policy.enforceEqualGenderRatio) {
        // [A] ROMANCE 모드: 3:3 성비 강제 매칭
        this.formGenderBalancedTables(
          pool,
          policy,
          encounterSet,
          usedIds,
          cityCode,
          mode,
          tableLanguage,
          budgetTier,
          matchedTables,
          () => tableSeq++
        );
      } else {
        // [B] PLATONIC / THEME 모드: 성비 무관, 관심사 및 대화 시너지 중심 매칭
        this.formOpenSocialTables(
          pool,
          policy,
          encounterSet,
          usedIds,
          cityCode,
          mode,
          tableLanguage,
          budgetTier,
          matchedTables,
          () => tableSeq++
        );
      }

      for (const p of pool) {
        if (!usedIds.has(p.userId)) {
          unassignedParticipants.push(p);
        }
      }
    }

    return { matchedTables, unassignedParticipants };
  }

  private static formGenderBalancedTables(
    pool: ParticipantProfile[],
    policy: ModePolicyConfig,
    encounterSet: Set<string>,
    usedIds: Set<string>,
    cityCode: string,
    mode: SocialMode,
    tableLanguage: LanguageCode,
    budgetTier: BudgetTier,
    matchedTables: MatchedTable[],
    nextSeq: () => number
  ) {
    const males = pool
      .filter((p) => p.gender === 'M')
      .sort((a, b) => a.birthYear - b.birthYear);
    const females = pool
      .filter((p) => p.gender === 'F')
      .sort((a, b) => a.birthYear - b.birthYear);
    const halfSize = Math.floor(policy.tableSize / 2);

    for (let i = 0; i < males.length; i++) {
      if (usedIds.has(males[i].userId)) continue;
      const candidateMales = [males[i]];

      for (let j = i + 1; j < males.length && candidateMales.length < halfSize; j++) {
        const m = males[j];
        if (usedIds.has(m.userId)) continue;
        if (this.satisfiesConstraints(candidateMales, m, encounterSet, policy)) {
          candidateMales.push(m);
        }
      }

      if (candidateMales.length < halfSize) continue;

      const availableFemales = females.filter((f) => !usedIds.has(f.userId));
      const scoredFemales = availableFemales
        .filter((f) => this.satisfiesConstraints(candidateMales, f, encounterSet, policy))
        .map((f) => ({
          profile: f,
          score: this.averagePairScoreWithGroup(f, candidateMales, policy),
        }))
        .sort((a, b) => b.score - a.score);

      const candidateFemales: ParticipantProfile[] = [];
      for (const item of scoredFemales) {
        if (candidateFemales.length >= halfSize) break;
        const currentGroup = [...candidateMales, ...candidateFemales];
        if (this.satisfiesConstraints(currentGroup, item.profile, encounterSet, policy)) {
          candidateFemales.push(item.profile);
        }
      }

      if (candidateFemales.length === halfSize) {
        const members = [...candidateMales, ...candidateFemales];
        for (const m of members) usedIds.add(m.userId);
        matchedTables.push(
          this.buildMatchedTable(
            nextSeq(),
            cityCode,
            mode,
            tableLanguage,
            budgetTier,
            members,
            policy
          )
        );
      }
    }
  }

  private static formOpenSocialTables(
    pool: ParticipantProfile[],
    policy: ModePolicyConfig,
    encounterSet: Set<string>,
    usedIds: Set<string>,
    cityCode: string,
    mode: SocialMode,
    tableLanguage: LanguageCode,
    budgetTier: BudgetTier,
    matchedTables: MatchedTable[],
    nextSeq: () => number
  ) {
    const sortedPool = [...pool].sort((a, b) => a.birthYear - b.birthYear);

    for (let i = 0; i < sortedPool.length; i++) {
      const seed = sortedPool[i];
      if (usedIds.has(seed.userId)) continue;

      const group: ParticipantProfile[] = [seed];
      const candidates = sortedPool.filter(
        (p) => p.userId !== seed.userId && !usedIds.has(p.userId)
      );

      while (group.length < policy.tableSize) {
        const validNext = candidates
          .filter(
            (c) =>
              !group.some((g) => g.userId === c.userId) &&
              this.satisfiesConstraints(group, c, encounterSet, policy)
          )
          .map((c) => ({
            profile: c,
            score: this.averagePairScoreWithGroup(c, group, policy),
          }))
          .sort((a, b) => b.score - a.score);

        if (validNext.length === 0) break;
        group.push(validNext[0].profile);
      }

      if (group.length === policy.tableSize) {
        for (const m of group) usedIds.add(m.userId);
        matchedTables.push(
          this.buildMatchedTable(
            nextSeq(),
            cityCode,
            mode,
            tableLanguage,
            budgetTier,
            group,
            policy
          )
        );
      }
    }
  }

  private static buildMatchedTable(
    seq: number,
    cityCode: string,
    mode: SocialMode,
    tableLanguage: LanguageCode,
    budgetTier: BudgetTier,
    members: ParticipantProfile[],
    policy: ModePolicyConfig
  ): MatchedTable {
    const evalResult = this.evaluateTableHarmony(members, policy);
    const dietarySet = new Set<DietaryRestriction>();
    for (const m of members) {
      for (const d of m.dietary) {
        if (d !== 'NONE') dietarySet.add(d);
      }
    }

    return {
      tableId: `TBL-${cityCode}-${mode}-${String(seq).padStart(2, '0')}`,
      cityCode,
      mode,
      tableLanguage,
      budgetTier,
      requiredDietarySupport: Array.from(dietarySet),
      participants: members,
      harmonyScore: evalResult.harmonyScore,
      scoreBreakdown: evalResult.scoreBreakdown,
    };
  }

  public static evaluateTableHarmony(
    members: ParticipantProfile[],
    policy: ModePolicyConfig
  ): {
    harmonyScore: number;
    scoreBreakdown: MatchedTable['scoreBreakdown'];
  } {
    const birthYears = members.map((m) => m.birthYear);
    const maxGap = Math.max(...birthYears) - Math.min(...birthYears);
    const ageCompatibility = Math.max(0, Math.round(100 - (maxGap / policy.maxAgeGapYears) * 40));

    let traitSum = 0;
    let interestSum = 0;
    let pairCount = 0;

    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const vecA = this.getEffectiveVector(members[i]);
        const vecB = this.getEffectiveVector(members[j]);
        traitSum += ProfilingEngine.calculateTraitSynergy(vecA, vecB);
        interestSum += ProfilingEngine.calculateInterestSimilarity(
          members[i].interests,
          members[j].interests
        );
        pairCount++;
      }
    }

    const traitSynergy = pairCount > 0 ? Math.round(traitSum / pairCount) : 50;
    const interestSimilarity = pairCount > 0 ? Math.round(interestSum / pairCount) : 50;

    const intents = members.map((m) => this.getEffectiveVector(m).romanceIntent);
    const avgIntent = intents.reduce((a, b) => a + b, 0) / intents.length;
    const variance =
      intents.reduce((s, val) => s + Math.pow(val - avgIntent, 2), 0) / intents.length;
    const intentAlignment = Math.round(Math.max(0, (1 - Math.sqrt(variance) * 2) * 100));

    const avgExtroversion =
      members.reduce((s, m) => s + this.getEffectiveVector(m).extroversion, 0) /
      members.length;
    const energyBalance = Math.round(
      Math.max(0, (1 - Math.abs(avgExtroversion - 0.6) * 1.5) * 100)
    );

    const w = policy.weights;
    const harmonyScore = Math.round(
      ageCompatibility * w.ageCompatibilityWeight +
        traitSynergy * w.traitSynergyWeight +
        interestSimilarity * w.interestSimilarityWeight +
        intentAlignment * w.intentAlignmentWeight +
        energyBalance * w.energyBalanceWeight
    );

    return {
      harmonyScore,
      scoreBreakdown: {
        ageCompatibility,
        traitSynergy,
        interestSimilarity,
        intentAlignment,
        energyBalance,
      },
    };
  }

  private static averagePairScoreWithGroup(
    candidate: ParticipantProfile,
    group: ParticipantProfile[],
    policy: ModePolicyConfig
  ): number {
    if (group.length === 0) return 0;
    const w = policy.weights;
    const vecCand = this.getEffectiveVector(candidate);

    let total = 0;
    for (const member of group) {
      const vecMem = this.getEffectiveVector(member);
      const traitScore = ProfilingEngine.calculateTraitSynergy(vecCand, vecMem);
      const interestScore = ProfilingEngine.calculateInterestSimilarity(
        candidate.interests,
        member.interests
      );
      total +=
        traitScore * (w.traitSynergyWeight + w.energyBalanceWeight) +
        interestScore * (w.interestSimilarityWeight + w.ageCompatibilityWeight);
    }

    return total / group.length;
  }

  private static satisfiesConstraints(
    currentMembers: ParticipantProfile[],
    candidate: ParticipantProfile,
    encounterSet: Set<string>,
    policy: ModePolicyConfig
  ): boolean {
    for (const member of currentMembers) {
      const ageGap = Math.abs(member.birthYear - candidate.birthYear);
      if (ageGap > policy.maxAgeGapYears) return false;
      if (encounterSet.has(this.pairKey(member.userId, candidate.userId))) {
        return false;
      }
    }
    return true;
  }

  private static getEffectiveVector(p: ParticipantProfile): TraitVector {
    return p.effectiveVector ?? p.selfVector;
  }

  private static pairKey(userA: string, userB: string): string {
    return userA < userB ? `${userA}:${userB}` : `${userB}:${userA}`;
  }
}
