/**
 * [마이크로 모듈 3] 다이닝 환경 공통 관찰 모듈 (ModuleDiningEnvironment)
 * 세대와 무관하게 120분 식사 자리에서 나타나는 현장 에티켓과 참여 태도를 온전히 책임지는 독립 모듈
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

export class ModuleDiningEnvironment implements EvaluationModule {
  readonly id = 'MOD_THEME_DINING';
  readonly name = '소셜 다이닝 테이블 에티켓 모듈';
  readonly targetContext = 'THEME_DINING' as const;
  readonly version = '1.0.0';

  /**
   * [원칙 1 & 2] 순수 단일 명사 1요소 1기준 매핑
   */
  private readonly elements: ObservationElement[] = [
    {
      id: 'EL_DIN_NEAT',
      anchorNoun: '정돈',
      criterionQuestion: '식사 전후 주변 식기와 냅킨을 깔끔하게 정돈하는가?',
      category: 'ETIQUETTE',
      description: '테이블 정리 정돈 및 단정한 식사 자세',
    },
    {
      id: 'EL_DIN_GAZE',
      anchorNoun: '시선',
      criterionQuestion: '스마트폰을 보지 않고 동석자들과 눈을 맞추며 대화에 몰입하는가?',
      category: 'ETIQUETTE',
      description: '동석자에 대한 집중도와 스마트폰 미사용 매너',
    },
    {
      id: 'EL_DIN_PACE',
      anchorNoun: '속도',
      criterionQuestion: '동석자들의 식사 속도와 대화 호흡에 자연스럽게 보폭을 맞추는가?',
      category: 'ETIQUETTE',
      description: '혼자 급하게 먹거나 처지지 않고 함께하는 템포 조화',
    },
    {
      id: 'EL_DIN_REACTION',
      anchorNoun: '호응',
      criterionQuestion: '음식이나 와인, 대화 주제에 대해 긍정적인 감상과 반응을 건네는가?',
      category: 'ATMOSPHERE',
      description: '식탁 분위기를 즐겁게 북돋우는 따뜻한 리액션',
    },
    {
      id: 'EL_DIN_RULE',
      anchorNoun: '규칙',
      criterionQuestion: '정시 도착과 1/N 식대 정산 등 모임 약속을 깔끔하게 준수하는가?',
      category: 'ETIQUETTE',
      description: '시간 엄수 및 신뢰할 수 있는 상호 에티켓 준수',
    },
  ];

  /**
   * [원칙 3] 다이닝 환경에 최적화된 자율 5점 척도 정의
   */
  private readonly metricScale: ModuleMetricScale = {
    scaleId: 'SCALE_DINING_ETIQUETTE',
    name: '다이닝 에티켓 5점 척도',
    steps: [
      { stepValue: 1, label: '개선필요', normalizedPoints: 20 },
      { stepValue: 2, label: '주의필요', normalizedPoints: 40 },
      { stepValue: 3, label: '양호함', normalizedPoints: 60 },
      { stepValue: 4, label: '깔끔함', normalizedPoints: 80 },
      { stepValue: 5, label: '모범적임', normalizedPoints: 100 },
    ],
  };

  getObservationElements(): ObservationElement[] {
    return this.elements;
  }

  getMetricScale(): ModuleMetricScale {
    return this.metricScale;
  }

  normalizeScore(records: ParticipantObservationRecord[], targetUserId: string): NormalizedModuleScore {
    const targetRecords = records.filter(
      (r) => r.toUserId === targetUserId && r.moduleId === this.id
    );

    const elementScores: NormalizedElementScore[] = this.elements.map((el) => {
      const elRecords = targetRecords.filter((r) => r.elementId === el.id);
      if (elRecords.length === 0) {
        return {
          elementId: el.id,
          anchorNoun: el.anchorNoun,
          score100: 90,
          rawAverageStep: 4.5,
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

