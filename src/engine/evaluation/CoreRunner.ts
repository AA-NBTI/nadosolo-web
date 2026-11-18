/**
 * [평가 엔진 코어 실행기] CoreRunner
 * 모듈 자율 척도 데이터를 받아 표준 100점(score100) 정규화 및 개인화 리포트 집계
 * 상호주의 해금 원칙(Reciprocal Unlock) 및 절대 익명성 정책 강제
 * GEMINI.md 헌법 2장 [원칙 3] 및 3장 [규칙 1, 2] 준수
 */

import { EvaluationRegistry } from './EvaluationRegistry';
import { nadosoloMirrorEngine } from '@/modules/mirror';
import { 
  ParticipantObservationRecord, 
  PersonalSocialDossier, 
  FullJourneyAuditReport 
} from './types';

export class CoreRunner {
  /**
   * 개인별 다면 소셜 프로필 도시에 (Dossier) 리포트 산출
   * 
   * @param targetUserId 리포트를 발급받을 대상 회원 ID
   * @param sessionId 해당 다이닝 모임 세션 ID
   * @param targetAgeGroup 모임의 세대 트랙 (3040 vs 5060)
   * @param allRecords 세션 전체에서 수집된 익명 평가 레코드들
   * @param completedCountByTargetUser 대상 회원이 동석자들에게 완료한 평가 수
   * @param requiredCount 대상 회원이 완료해야 할 동석자 수 (예: 5명)
   * @param sessionCount 누적 참여 회차
   */
  static generateDossier(
    targetUserId: string,
    sessionId: string,
    targetAgeGroup: '3045_PRIME' | '5060_GOLDEN' | 'ALL' = '3045_PRIME',
    allRecords: ParticipantObservationRecord[] = [],
    completedCountByTargetUser: number = 5,
    requiredCount: number = 5,
    sessionCount: number = 1
  ): PersonalSocialDossier {
    // 해당 모임 컨텍스트에 꽂힌 활성 모듈 조합 로드 후 범용 미러 코어 엔진에 위임
    const activeModules = EvaluationRegistry.getModulesForContext(targetAgeGroup);

    return nadosoloMirrorEngine.generateDossier({
      targetUserId,
      sessionId,
      modules: activeModules,
      records: allRecords,
      completedCountByTargetUser,
      requiredCount,
      sessionCount,
    });
  }

  /**
   * 전주기 모임 점검 감사 리포트 산출 (식당 공간 · 식사 미식 · 가변 진행 프로세스)
   */
  static generateFullAuditReport(
    sessionId: string,
    allRecords: ParticipantObservationRecord[] = []
  ): FullJourneyAuditReport {
    const auditModules = EvaluationRegistry.getAuditModules();
    const placeMod = auditModules.find((m) => m.id === 'MOD_AUDIT_PLACE')!;
    const mealMod = auditModules.find((m) => m.id === 'MOD_AUDIT_MEAL')!;
    const flowMod = auditModules.find((m) => m.id === 'MOD_AUDIT_FLOW')!;

    const placeReport = placeMod.normalizeScore(allRecords, sessionId);
    const mealReport = mealMod.normalizeScore(allRecords, sessionId);
    const flowReport = flowMod.normalizeScore(allRecords, sessionId);

    const totalAuditScore100 = Math.round(
      (placeReport.totalScore100 + mealReport.totalScore100 + flowReport.totalScore100) / 3
    );

    return {
      sessionId,
      totalAuditScore100,
      placeReport,
      mealReport,
      flowReport,
      verifiedPartnerEligible: totalAuditScore100 >= 80,
      createdAt: new Date().toISOString(),
    };
  }
}

