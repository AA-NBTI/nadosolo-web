/**
 * [전주기 점검 모듈 3] 가변 타임라인 운영 진행 점검 모듈 (ModuleFlowAudit)
 * 모임 시간(90분, 120분 등)과 무관하게 단계별 진행과 시스템 흐름의 매끄러움을 점검하는 독립 모듈
 * GEMINI.md 헌법 2장(단일 명사, 1요소 1기준, 자율 척도) 준수
 */

import { 
  EvaluationModule, 
  ObservationElement, 
  ModuleMetricScale, 
  ParticipantObservationRecord, 
  NormalizedModuleScore, 
  NormalizedElementScore 
} from '../types';

export class ModuleFlowAudit implements EvaluationModule {
  readonly id = 'MOD_AUDIT_FLOW';
  readonly name = '가변 타임라인 운영 진행 점검 모듈';
  readonly targetContext = 'AUDIT_FLOW' as const;
  readonly version = '1.0.0';

  /**
   * [원칙 1 & 2] 순수 단일 명사 1요소 1기준 매핑
   */
  private readonly elements: ObservationElement[] = [
    {
      id: 'EL_FLW_NOTICE',
      anchorNoun: '안내',
      criterionQuestion: '식당 위치와 사전 정보 안내가 명확하고 정시에 도착했는가?',
      category: 'FLOW',
      description: 'D-1 알림톡 및 사전 장소/좌석 안내의 정확성',
    },
    {
      id: 'EL_FLW_SEAT',
      anchorNoun: '좌석',
      criterionQuestion: '지정된 자리 배치가 자연스럽고 착석이 편안했는가?',
      category: 'FLOW',
      description: '사전 큐레이션된 좌석 배치의 편안함과 동선 조화',
    },
    {
      id: 'EL_FLW_CARD',
      anchorNoun: '카드',
      criterionQuestion: '대화카드 키트가 어색함을 깨고 대화를 시작하는 데 유용했는가?',
      category: 'FLOW',
      description: '아이스브레이킹 대화 질문 킷의 실질적 유용성',
    },
    {
      id: 'EL_FLW_MOVE',
      anchorNoun: '이동',
      criterionQuestion: '중간 자리 이동(로테이션)이 혼선 없이 자연스럽게 이루어졌는가?',
      category: 'FLOW',
      description: '하프타임 자리 셔플 가이드의 매끄러운 진행감',
    },
    {
      id: 'EL_FLW_SPLIT',
      anchorNoun: '정산',
      criterionQuestion: '식사 후 식당 카운터에서의 1/N 개별 정산이 혼선 없이 원활했는가?',
      category: 'FLOW',
      description: '테이블 1/N 현장 결제의 투명성과 편의성',
    },
  ];

  /**
   * [원칙 3] 운영 진행 점검에 최적화된 자율 5점 척도 정의
   */
  private readonly metricScale: ModuleMetricScale = {
    scaleId: 'SCALE_FLOW_AUDIT',
    name: '진행 만족도 5점 척도',
    steps: [
      { stepValue: 1, label: '혼선발생', normalizedPoints: 20 },
      { stepValue: 2, label: '다소불편', normalizedPoints: 40 },
      { stepValue: 3, label: '보통', normalizedPoints: 60 },
      { stepValue: 4, label: '원활함', normalizedPoints: 80 },
      { stepValue: 5, label: '완벽함', normalizedPoints: 100 },
    ],
  };

  getObservationElements(): ObservationElement[] {
    return this.elements;
  }

  getMetricScale(): ModuleMetricScale {
    return this.metricScale;
  }

  normalizeScore(records: ParticipantObservationRecord[], targetSessionId: string): NormalizedModuleScore {
    const targetRecords = records.filter(
      (r) => r.sessionId === targetSessionId && r.moduleId === this.id
    );

    const elementScores: NormalizedElementScore[] = this.elements.map((el) => {
      const elRecords = targetRecords.filter((r) => r.elementId === el.id);
      if (elRecords.length === 0) {
        return {
          elementId: el.id,
          anchorNoun: el.anchorNoun,
          score100: 95,
          rawAverageStep: 4.75,
          observationCount: 0,
        };
      }

      const sumSteps = elRecords.reduce((acc, curr) => acc + curr.scoreStep, 0);
      const avgStep = sumSteps / elRecords.length;
      const score100 = Math.round(avgStep * 20);

      return {
        elementId: el.id,
        anchorNoun: el.anchorNoun,
        score100,
        rawAverageStep: Math.round(avgStep * 10) / 10,
        observationCount: elRecords.length,
      };
    });

    const totalScore100 = Math.round(
      elementScores.reduce((acc, curr) => acc + curr.score100, 0) / elementScores.length
    );

    return {
      moduleId: this.id,
      moduleName: this.name,
      totalScore100,
      elementScores,
    };
  }
}
