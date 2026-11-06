/**
 * [전주기 점검 모듈 2] 식사 및 미식 품질 점검 모듈 (ModuleMealQuality)
 * 현장에서 제공된 요리와 음료의 품질 및 가격 적정성을 점검하는 독립 모듈
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

export class ModuleMealQuality implements EvaluationModule {
  readonly id = 'MOD_AUDIT_MEAL';
  readonly name = '식사 및 미식 품질 점검 모듈';
  readonly targetContext = 'AUDIT_MEAL' as const;
  readonly version = '1.0.0';

  /**
   * [원칙 1 & 2] 순수 단일 명사 1요소 1기준 매핑
   */
  private readonly elements: ObservationElement[] = [
    {
      id: 'EL_MEL_TASTE',
      anchorNoun: '맛',
      criterionQuestion: '식재료의 신선도와 조리의 완성도가 훌륭한가?',
      category: 'MEAL',
      description: '제공된 요리의 맛과 식재료의 퀄리티',
    },
    {
      id: 'EL_MEL_TEMP',
      anchorNoun: '온도',
      criterionQuestion: '음식이 식지 않고 알맞은 온도로 적시에 제공되는가?',
      category: 'MEAL',
      description: '플레이트 온도 관리 및 따뜻하고 신선한 서빙 상태',
    },
    {
      id: 'EL_MEL_COURSE',
      anchorNoun: '구성',
      criterionQuestion: '함께 나누어 먹기에 요리의 양과 조화가 적절한가?',
      category: 'MEAL',
      description: '전채부터 메인까지 메뉴의 영양 및 포만감 균형',
    },
    {
      id: 'EL_MEL_DRINK',
      anchorNoun: '음료',
      criterionQuestion: '요리와 곁들이기에 와인 또는 음료의 조합이 좋은가?',
      category: 'MEAL',
      description: '와인 및 논알콜 페어링 음료의 셀렉션 수준',
    },
    {
      id: 'EL_MEL_VALUE',
      anchorNoun: '비용',
      criterionQuestion: '현장에서 1/N 정산한 식대 대비 음식의 가치가 충분한가?',
      category: 'MEAL',
      description: '지불한 식사 금액 대비 체감 만족도와 가성비',
    },
  ];

  /**
   * [원칙 3] 식사 품질 점검에 최적화된 자율 5점 척도 정의
   */
  private readonly metricScale: ModuleMetricScale = {
    scaleId: 'SCALE_MEAL_QUALITY',
    name: '식사 품질 5점 척도',
    steps: [
      { stepValue: 1, label: '불만족', normalizedPoints: 20 },
      { stepValue: 2, label: '다소아쉬움', normalizedPoints: 40 },
      { stepValue: 3, label: '보통', normalizedPoints: 60 },
      { stepValue: 4, label: '만족', normalizedPoints: 80 },
      { stepValue: 5, label: '매우만족', normalizedPoints: 100 },
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
          score100: 88,
          rawAverageStep: 4.4,
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

