import {
  CoachingPrescription,
  GrowthCoachingReport,
  MirrorDiagnosisResult,
  SessionGrowthSnapshot,
  SoloCompetencyScores,
} from './types';

/**
 * [Domain A - ③] GrowthCoachingEngine (시계열 자기성장 추적 & 퍼스널 코칭 처방 엔진)
 * - MirrorEngine이 산출한 팩트 데이터와 회차별 스냅샷을 기반으로 유저의 '성장 궤적'을 계산합니다.
 * - 솔로들이 놓치기 쉬운 4대 영역(대화 밸런스, 그루밍/자기관리, 공감 리액션, 라이프 활력) 중
 *   보완이 필요한 영역을 찾아 상처 주지 않는 코칭 처방전과 다음 모임 미션, 자기관리 프로그램을 추천합니다.
 */
export class GrowthCoachingEngine {
  /**
   * 회차별 스냅샷과 최신 미러 진단 결과를 바탕으로 종합 자기성장 & 코칭 리포트 생성
   */
  public static generateCoachingReport(
    userId: string,
    snapshots: SessionGrowthSnapshot[],
    latestMirror: MirrorDiagnosisResult
  ): GrowthCoachingReport {
    const sorted = [...snapshots].sort(
      (a, b) => a.sessionNumber - b.sessionNumber
    );
    const totalSessions = sorted.length;

    const firstComp =
      totalSessions > 0
        ? sorted[0].competencyScores
        : latestMirror.competencyAvg;
    const latestComp =
      totalSessions > 0
        ? sorted[totalSessions - 1].competencyScores
        : latestMirror.competencyAvg;

    const axes: (keyof SoloCompetencyScores)[] = [
      'communicationBalance',
      'groomingAndSelfCare',
      'empathyAndVibe',
      'lifestyleVitality',
    ];

    const competencyTrend = axes.map((axis) => {
      const firstScore = firstComp[axis];
      const latestScore = latestComp[axis];
      return {
        axis,
        firstScore,
        latestScore,
        delta: latestScore - firstScore,
      };
    });

    const overallGrowthDelta = Math.round(
      competencyTrend.reduce((sum, item) => sum + item.delta, 0) / axes.length
    );

    // 1. 획득한 성장 아우라 배지 산출
    const unlockedAuraBadges: string[] = [];
    if (latestComp.empathyAndVibe >= 85) {
      unlockedAuraBadges.push('🏅 따뜻한 경청의 아이콘');
    }
    if (latestComp.communicationBalance >= 85) {
      unlockedAuraBadges.push('🏅 티키타카 대화 마스터');
    }
    if (latestComp.groomingAndSelfCare >= 85) {
      unlockedAuraBadges.push('🏅 첫인상 호감도 상위 10%');
    }
    if (overallGrowthDelta >= 8) {
      unlockedAuraBadges.push('🚀 눈에 띄게 성장하는 솔로');
    }

    // 2. 부족한 영역(75점 미만 또는 최하위 점수 영역)에 대한 맞춤형 코칭 처방전 생성
    const prescriptions = this.createPrescriptions(latestComp, latestMirror);

    // 3. 숨은 매력(Hidden Charm)이 발견되었거나 종합 역량이 상승했을 때 유저 주도 프로필 레벨업 제안
    const hasHiddenCharm = latestMirror.johariInsights.some(
      (i) => i.quadrant === 'HIDDEN_CHARM'
    );
    const shouldPromptProfileLevelUp = hasHiddenCharm || overallGrowthDelta >= 5;

    return {
      userId,
      totalSessionsCompleted: totalSessions,
      overallGrowthDelta,
      competencyTrend,
      unlockedAuraBadges,
      prescriptions,
      shouldPromptProfileLevelUp,
    };
  }

  private static createPrescriptions(
    comp: SoloCompetencyScores,
    mirror: MirrorDiagnosisResult
  ): CoachingPrescription[] {
    const prescriptions: CoachingPrescription[] = [];

    // ① 대화 균형감 코칭
    if (
      comp.communicationBalance < 75 ||
      mirror.topGrowthPoints.includes('NEED_MORE_QUESTIONS')
    ) {
      prescriptions.push({
        focusArea: 'communicationBalance',
        currentScore: comp.communicationBalance,
        coachingTitle: '내 이야기 40% : 상대방 질문 60%의 황금 비율 만들기',
        gentleAdvice:
          '열정적으로 이야기 나누는 모습은 좋았지만, 내 이야기를 마친 뒤 "혹시 ~님은 어떠세요?"라고 마이크를 넘겨주면 상대방이 느끼는 호감도가 2배 이상 높아집니다.',
        nextSessionMicroMission:
          '다음 모임에서 내 대답 끝에 상대방에게 열린 질문 최소 3번 던지기',
        recommendedProgram: {
          programId: 'PRG_SPEECH_01',
          category: 'CONVERSATION_SPEECH',
          title: '[나도솔로 클래스] 호감을 부르는 스몰토크 & 질문의 기술 1:1 코칭',
        },
      });
    }

    // ② 첫인상 & 자기관리/그루밍 코칭
    if (
      comp.groomingAndSelfCare < 75 ||
      mirror.topGrowthPoints.includes('UPGRADE_STYLING')
    ) {
      prescriptions.push({
        focusArea: 'groomingAndSelfCare',
        currentScore: comp.groomingAndSelfCare,
        coachingTitle: '대화 매력을 200% 살려줄 첫인상 & 스타일링 디테일 업그레이드',
        gentleAdvice:
          '대화가 깊어질수록 진가가 드러나는 분입니다! 여기에 본인의 체형과 이미지에 맞는 헤어 스타일링과 핏만 살짝 다듬으면 첫인상 설렘 지수가 급상승할 거예요.',
        nextSessionMicroMission:
          '모임 전 나에게 어울리는 웜/쿨 톤 셔츠·니트 코디 및 깔끔한 그루밍 체크하기',
        recommendedProgram: {
          programId: 'PRG_STYLE_01',
          category: 'STYLING_GROOMING',
          title: '[제휴 컨설팅] 1인가구 솔로 맞춤 퍼스널컬러 & 데이트룩 스타일링 진단',
        },
      });
    }

    // ③ 공감 & 리액션/표정 코칭
    if (
      comp.empathyAndVibe < 75 ||
      mirror.topGrowthPoints.includes('RELAX_FACIAL_TENSION')
    ) {
      prescriptions.push({
        focusArea: 'empathyAndVibe',
        currentScore: comp.empathyAndVibe,
        coachingTitle: '초반 15분 긴장을 녹이는 미소와 눈맞춤 코칭',
        gentleAdvice:
          '처음 낯선 자리에서 살짝 긴장하셨던 모습이 차가운 인상으로 오해받을 수 있어요. 상대방이 말할 때 가벼운 고개 끄덕임과 미소만 더해도 분위기가 훨씬 부드러워집니다.',
        nextSessionMicroMission:
          '1교시 자기소개 시간 동안 발언하는 분과 눈 맞추며 미소로 고개 끄덕이기',
        recommendedProgram: {
          programId: 'PRG_MIND_01',
          category: 'MINDSET',
          title: '[셀프 코칭] 낯가림 극복 & 편안한 표정 근육 트레이닝 가이드',
        },
      });
    }

    // ④ 라이프 활력 코칭
    if (
      comp.lifestyleVitality < 75 ||
      mirror.topGrowthPoints.includes('EXPAND_LIFE_TOPICS')
    ) {
      prescriptions.push({
        focusArea: 'lifestyleVitality',
        currentScore: comp.lifestyleVitality,
        coachingTitle: '일상에 작은 취미 하나를 더해 대화의 매력 스펙트럼 넓히기',
        gentleAdvice:
          '집-회사 반복 루틴에서 벗어나 주말에 작은 취미(원팬 요리, 동네 러닝, 와인 테이스팅) 하나만 시작해 보세요. 테이블에서 나눌 나만의 스토리가 훨씬 풍성해집니다.',
        nextSessionMicroMission:
          '이번 주 나만의 새로운 자취 요리나 주말 산책 플레이스 1곳 경험해보기',
        recommendedProgram: {
          programId: 'PRG_LIFE_01',
          category: 'LIFESTYLE_CLUB',
          title: '[나도솔로 챌린지] 2주 1인가구 미식 & 라이프 활력 루틴 클럽',
        },
      });
    }

    return prescriptions;
  }
}

