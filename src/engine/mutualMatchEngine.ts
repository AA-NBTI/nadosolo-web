import {
  MutualMatchPair,
  PeerMirrorFeedback,
  SecretVote,
  VoteCategory,
} from './types';
import { LocalePolicyEngine } from './localePolicyEngine';

/**
 * [Domain C - ⑧] MutualMatchEngine (시크릿 투표 & 글로벌 자정 공개 & 2차 VIP Unlock 엔진)
 * - 방향 그래프에서 상호 지목(A↔B)을 추출하고, 교차 지목(ROMANCE vs DINING_FRIEND) 시 부담 없는 카테고리로 안전 매칭합니다.
 * - 도시별 타임존(IANA Timezone) 기준 자정 공개 시각을 관리합니다.
 * - 모임에서 다수의 호감표와 높은 매너 피드백을 받은 우수 참가자에게 '2차 검증 멤버 전용 VIP 라운드' 초대권을 부여합니다.
 */
export class MutualMatchEngine {
  public static resolveMutualMatches(
    sessionId: string,
    cityCode: string,
    votes: SecretVote[],
    revealScheduledAtUtc: string
  ): MutualMatchPair[] {
    const cityConfig = LocalePolicyEngine.getCityConfig(cityCode);
    const sessionVotes = votes.filter(
      (v) => v.sessionId === sessionId && v.fromUserId !== v.toUserId
    );

    const voteMap = new Map<string, SecretVote>();
    for (const v of sessionVotes) {
      voteMap.set(`${v.fromUserId}->${v.toUserId}`, v);
    }

    const processedPairs = new Set<string>();
    const results: MutualMatchPair[] = [];

    for (const voteAB of sessionVotes) {
      const userA = voteAB.fromUserId;
      const userB = voteAB.toUserId;

      const canonicalKey = userA < userB ? `${userA}:${userB}` : `${userB}:${userA}`;
      if (processedPairs.has(canonicalKey)) continue;

      const voteBA = voteMap.get(`${userB}->${userA}`);
      if (!voteBA) continue;

      processedPairs.add(canonicalKey);

      const isSameCategory = voteAB.category === voteBA.category;
      const matchedCategory: VoteCategory = isSameCategory
        ? voteAB.category
        : 'DINING_FRIEND';

      results.push({
        sessionId,
        userA: userA < userB ? userA : userB,
        userB: userA < userB ? userB : userA,
        matchedCategory,
        isCrossCategoryMatch: !isSameCategory,
        cityCode,
        ianaTimezone: cityConfig.ianaTimezone,
        revealScheduledAtUtc,
      });
    }

    return results;
  }

  public static getVisibleMatchesForUser(
    userId: string,
    allMatches: MutualMatchPair[],
    currentTimeUtcIso: string = new Date().toISOString()
  ): MutualMatchPair[] {
    const nowMs = new Date(currentTimeUtcIso).getTime();

    return allMatches.filter((m) => {
      const isParticipant = m.userA === userId || m.userB === userId;
      const isRevealTimePassed =
        new Date(m.revealScheduledAtUtc).getTime() <= nowMs;
      return isParticipant && isRevealTimePassed;
    });
  }

  /**
   * 2차 스페셜 라운드(VIP 프라이빗 파티 / 검증된 와인·요리 클럽) Unlock 대상자 추출
   * 조건: 해당 세션에서 최소 2표 이상의 호감/친구 지목을 받고, 동석자 평균 공감/매너 점수가 80점 이상인 유저
   */
  public static evaluateVipTierUnlocks(
    sessionId: string,
    votes: SecretVote[],
    feedbacks: PeerMirrorFeedback[]
  ): string[] {
    const voteCounts = new Map<string, number>();
    for (const v of votes.filter((x) => x.sessionId === sessionId)) {
      voteCounts.set(v.toUserId, (voteCounts.get(v.toUserId) ?? 0) + 1);
    }

    const unlockedUsers: string[] = [];
    for (const [userId, count] of voteCounts.entries()) {
      if (count < 2) continue;

      const userFeedbacks = feedbacks.filter(
        (f) => f.sessionId === sessionId && f.toUserId === userId
      );
      if (userFeedbacks.length === 0) continue;

      const avgEmpathy =
        userFeedbacks.reduce((s, f) => s + f.competencyRatings.empathyAndVibe, 0) /
        userFeedbacks.length;

      if (avgEmpathy >= 80) {
        unlockedUsers.push(userId);
      }
    }

    return unlockedUsers;
  }
}
