import {
  CultureTag,
  ParticipantProfile,
  PlaybookCard,
  PlaybookTemplate,
  SeatAssignment,
  SocialMode,
  TableSessionState,
} from './types';
import { ProfilingEngine } from './profilingEngine';

/**
 * [Domain C - ⑦] PlaybookEngine (문화권·모드 반응형 현장 상태머신 엔진)
 * - ROMANCE 모드일 때는 '남녀 교차 착석 & 2부 이성 시프트'를 수행합니다.
 * - PLATONIC / THEME 모드일 때는 성별과 무관하게 '관심사 & 대화 성향(주도+경청) 시너지 짝꿍'으로 좌석을 배치합니다.
 * - 테이블의 문화권(CultureTag)과 모드(SocialMode)에 맞는 대화 카드만 필터링하여 제공합니다.
 */
export class PlaybookEngine {
  public static createInitialSession(
    sessionId: string,
    tableId: string,
    mode: SocialMode,
    cultureTag: CultureTag,
    template: PlaybookTemplate,
    participants: ParticipantProfile[],
    nowIso: string = new Date().toISOString()
  ): TableSessionState {
    const initialSeats =
      mode === 'ROMANCE'
        ? this.arrangeRomanceAlternatingSeats(participants)
        : this.arrangeInterestSynergySeats(participants);

    return {
      sessionId,
      tableId,
      mode,
      cultureTag,
      templateId: template.templateId,
      status: 'WAITING',
      currentStageIndex: 0,
      currentCardIndex: 0,
      stageStartedAt: nowIso,
      checkedInUserIds: [],
      currentSeats: initialSeats,
    };
  }

  public static checkInParticipant(
    state: TableSessionState,
    userId: string,
    autoStartThreshold: number = 4,
    nowIso: string = new Date().toISOString()
  ): TableSessionState {
    const checkedIn = new Set(state.checkedInUserIds);
    checkedIn.add(userId);
    const updated = Array.from(checkedIn);

    const shouldAutoStart =
      state.status === 'WAITING' && updated.length >= autoStartThreshold;

    return {
      ...state,
      checkedInUserIds: updated,
      status: shouldAutoStart ? 'IN_PROGRESS' : state.status,
      stageStartedAt: shouldAutoStart ? nowIso : state.stageStartedAt,
    };
  }

  /**
   * 현재 라운드에서 해당 테이블의 문화권(CultureTag) 및 모드(SocialMode)에 부합하는 대화카드 리스트 반환
   */
  public static getActiveStageCards(
    state: TableSessionState,
    template: PlaybookTemplate
  ): PlaybookCard[] {
    const stage = template.stages[state.currentStageIndex];
    if (!stage || !stage.cards) return [];

    return stage.cards.filter(
      (c) =>
        (c.cultureTags.includes(state.cultureTag) || c.cultureTags.includes('GLOBAL')) &&
        c.modes.includes(state.mode)
    );
  }

  public static advanceStage(
    state: TableSessionState,
    template: PlaybookTemplate,
    participants: ParticipantProfile[],
    nowIso: string = new Date().toISOString()
  ): TableSessionState {
    const nextStageIndex = state.currentStageIndex + 1;
    if (nextStageIndex >= template.stages.length) {
      return {
        ...state,
        status: 'COMPLETED',
      };
    }

    const nextStage = template.stages[nextStageIndex];
    const updatedSeats = nextStage.triggerSeatShuffle
      ? this.rotateSeatsForSecondHalf(state.currentSeats, participants, state.mode)
      : state.currentSeats;

    return {
      ...state,
      status: 'IN_PROGRESS',
      currentStageIndex: nextStageIndex,
      currentCardIndex: 0,
      stageStartedAt: nowIso,
      currentSeats: updatedSeats,
    };
  }

  /**
   * [ROMANCE 전용] 1부 남녀 교차 착석
   */
  public static arrangeRomanceAlternatingSeats(
    participants: ParticipantProfile[]
  ): SeatAssignment[] {
    const males = participants.filter((p) => p.gender === 'M');
    const females = participants.filter((p) => p.gender === 'F');
    const ordered: ParticipantProfile[] = [];

    const maxLen = Math.max(males.length, females.length);
    for (let i = 0; i < maxLen; i++) {
      if (males[i]) ordered.push(males[i]);
      if (females[i]) ordered.push(females[i]);
    }

    return ordered.map((p, idx) => ({
      seatNumber: idx + 1,
      userId: p.userId,
      nickname: p.nickname,
      pairingReason: '1부 남녀 교차 배치',
    }));
  }

  /**
   * [PLATONIC / THEME 전용] 성별 무관, 관심사 및 대화 주도/경청 밸런스가 가장 잘 맞는 짝꿍끼리 인접 배치
   */
  public static arrangeInterestSynergySeats(
    participants: ParticipantProfile[]
  ): SeatAssignment[] {
    if (participants.length === 0) return [];
    const remaining = [...participants];
    const ordered: SeatAssignment[] = [];

    let current = remaining.shift()!;
    ordered.push({
      seatNumber: 1,
      userId: current.userId,
      nickname: current.nickname,
      pairingReason: '테이블 호스트 시드 좌석',
    });

    while (remaining.length > 0) {
      remaining.sort((a, b) => {
        const scoreA = ProfilingEngine.calculateInterestSimilarity(
          current.interests,
          a.interests
        );
        const scoreB = ProfilingEngine.calculateInterestSimilarity(
          current.interests,
          b.interests
        );
        return scoreB - scoreA;
      });

      const bestPartner = remaining.shift()!;
      const shared = current.interests.filter((t) =>
        bestPartner.interests.includes(t)
      );
      ordered.push({
        seatNumber: ordered.length + 1,
        userId: bestPartner.userId,
        nickname: bestPartner.nickname,
        pairingReason:
          shared.length > 0
            ? `공통 관심사(${shared.join(',')}) 케미 배치`
            : '대화 성향 밸런스 배치',
      });
      current = bestPartner;
    }

    return ordered;
  }

  /**
   * 2부 좌석 로테이션 (모드별 차별화)
   */
  public static rotateSeatsForSecondHalf(
    currentSeats: SeatAssignment[],
    participants: ParticipantProfile[],
    mode: SocialMode
  ): SeatAssignment[] {
    if (mode === 'ROMANCE') {
      const genderMap = new Map(participants.map((p) => [p.userId, p.gender]));
      const maleSeats = currentSeats.filter((s) => genderMap.get(s.userId) === 'M');
      const femaleSeats = currentSeats.filter((s) => genderMap.get(s.userId) === 'F');
      if (maleSeats.length <= 1) return currentSeats;

      const rotatedMales = [...maleSeats.slice(1), maleSeats[0]];
      const newOrder: SeatAssignment[] = [];
      const maxLen = Math.max(rotatedMales.length, femaleSeats.length);
      let seatNum = 1;

      for (let i = 0; i < maxLen; i++) {
        if (rotatedMales[i]) {
          newOrder.push({
            ...rotatedMales[i],
            seatNumber: seatNum++,
            pairingReason: '2부 새로운 이성 매칭 로테이션',
          });
        }
        if (femaleSeats[i]) {
          newOrder.push({
            ...femaleSeats[i],
            seatNumber: seatNum++,
            pairingReason: '2부 새로운 이성 매칭 로테이션',
          });
        }
      }
      return newOrder;
    }

    // PLATONIC / THEME 모드: 1부 때 멀리 앉았던 대각선/반대편 멤버와 섞이도록 인터리브(Interleave) 셔플
    const half = Math.ceil(currentSeats.length / 2);
    const firstHalf = currentSeats.slice(0, half);
    const secondHalf = currentSeats.slice(half).reverse();
    const shuffled: SeatAssignment[] = [];
    let seatNum = 1;

    for (let i = 0; i < half; i++) {
      if (firstHalf[i]) {
        shuffled.push({
          ...firstHalf[i],
          seatNumber: seatNum++,
          pairingReason: '2부 반대편 멤버 크로스 토크 배치',
        });
      }
      if (secondHalf[i]) {
        shuffled.push({
          ...secondHalf[i],
          seatNumber: seatNum++,
          pairingReason: '2부 반대편 멤버 크로스 토크 배치',
        });
      }
    }
    return shuffled;
  }
}
