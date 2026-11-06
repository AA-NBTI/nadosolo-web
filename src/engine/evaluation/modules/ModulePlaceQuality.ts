/**
 * [전주기 점검 모듈 1] 식당 공간 품질 점검 모듈 (ModulePlaceQuality)
 * 모임이 열리는 식당 공간의 물리적 환경과 서비스 품질을 점검하는 독립 모듈
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

export class ModulePlaceQuality implements EvaluationModule {
  readonly id = 'MOD_AUDIT_PLACE';
  readonly name = '식당 공간 환경 점검 모듈';
  readonly targetContext = 'AUDIT_PLACE' as const;
  readonly version = '1.0.0';

  /**
   * [원칙 1 & 2] 순수 단일 명사 1요소 1기준 매핑
   */
  private readonly elements: ObservationElement[] = [
    {
      id: 'EL_PLC_PRIVATE',
      anchorNoun: '독립',
      criterionQuestion: '다른 손님의 시선 간섭 없이 프라이빗하게 분리된 공간인가?',
      category: 'PLACE',
      description: '외부 간섭 없는 프라이빗 룸/단독 테이블 독립성',
    },
    {
      id: 'EL_PLC_NOISE',
      anchorNoun: '소음',
      criterionQuestion: '동석자들의 목소리를 편안하게 들을 수 있도록 소음이 통제되는가?',
      category: 'PLACE',
      description: '대화 몰입을 방해하지 않는 정숙하고 쾌적한 음향 환경',
    },
    {
      id: 'EL_PLC_LIGHT',
      anchorNoun: '조명',
      criterionQuestion: '눈부시거나 어둡지 않고 대화에 집중하기 아늑한 조도인가?',
      category: 'PLACE',
      description: '얼굴을 돋보이게 하고 아늑함을 주는 테이블 조도',
    },
    {
      id: 'EL_PLC_CLEAN',
      anchorNoun: '위생',
      criterionQuestion: '룸 바닥, 테이블, 식기류의 위생과 정돈 상태가 청결한가?',
      category: 'PLACE',
      description: '테이블웨어 청결도와 전반적인 공간 위생 상태',
    },
    {
      id: 'EL_PLC_KIND',
      anchorNoun: '친절',
      criterionQuestion: '식당 매니저와 직원의 예약 확인 및 서빙 태도가 정중한가?',
      category: 'PLACE',
      description: '예약 응대와 식사 서빙 시의 정중함과 품격',
    },
  ];

  /**
   * [원칙 3] 식당 공간 점검에 최적화된 자율 5점 척도 정의
   */
  private readonly metricScale: ModuleMetricScale = {
    scaleId: 'SCALE_PLACE_QUALITY',
    name: '식당 공간 5점 척도',
    steps: [
      { stepValue: 1, label: '매우미흡', normalizedPoints: 20 },
      { stepValue: 2, label: '미흡', normalizedPoints: 40 },
      { stepValue: 3, label: '보통', normalizedPoints: 60 },
      { stepValue: 4, label: '쾌적', normalizedPoints: 80 },
      { stepValue: 5, label: '완벽', normalizedPoints: 100 },
    ],
  };

  getObservationElements(): ObservationElement[] {
    return this.elements;
  }

  getMetricScale(): ModuleMetricScale {
    return this.metricScale;
  }

  normalizeScore(records: ParticipantObservationRecord[], targetVenueOrUserId: string): NormalizedModuleScore {
    const targetRecords = records.filter(
      (r) => r.toUserId === targetVenueOrUserId && r.moduleId === this.id
    );

    const elementScores: NormalizedElementScore[] = this.elements.map((el) => {
      const elRecords = targetRecords.filter((r) => r.elementId === el.id);
      if (elRecords.length === 0) {
        return {
          elementId: el.id,
          anchorNoun: el.anchorNoun,
          score100: 92,
          rawAverageStep: 4.6,
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
