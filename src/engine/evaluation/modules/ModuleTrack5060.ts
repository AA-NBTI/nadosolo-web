/**
 * [마이크로 모듈 2] 5060 골든 트랙 전용 소셜 관찰 모듈 (ModuleTrack5060)
 * 5060 세대의 연륜과 품격, 온화한 태도를 온전히 책임지는 독립 모듈
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

export class ModuleTrack5060 implements EvaluationModule {
  readonly id = 'MOD_TRACK_5060';
  readonly name = '5060 골든 소셜 품격 모듈';
  readonly targetContext = 'AGE_5060' as const;
  readonly version = '1.0.0';

  /**
   * [원칙 1 & 2] 순수 단일 명사 1요소 1기준 매핑
   */
  private readonly elements: ObservationElement[] = [
    {
      id: 'EL_5060_DIGNITY',
      anchorNoun: '품격',
      criterionQuestion: '식사 자리에서의 몸가짐과 사용하는 어휘에서 교양과 단정함이 느껴지는가?',
      category: 'CHARACTER',
      description: '말투와 태도에서 우러나오는 삶의 기품과 단정함',
    },
    {
      id: 'EL_5060_WARMTH',
      anchorNoun: '온화',
      criterionQuestion: '상대방을 편안하게 맞이하는 부드러운 인상과 미소를 유지하는가?',
      category: 'ATMOSPHERE',
      description: '주변 사람들을 무장해제시키는 따뜻하고 편안한 표정',
    },
    {
      id: 'EL_5060_EMPATHY',
      anchorNoun: '공감',
      criterionQuestion: '상대방의 인생 이야기나 의견에 훈계 없이 진심으로 고개를 끄덕여주는가?',
      category: 'COMMUNICATION',
      description: '평가나 충고 대신 경청하고 지지하는 포용적 공감력',
    },
    {
      id: 'EL_5060_CHARACTER',
      anchorNoun: '인품',
      criterionQuestion: '과거 경력이나 조건을 과시하지 않고 겸손하고 진솔하게 대화하는가?',
      category: 'CHARACTER',
      description: '과시 없는 소탈함과 인격적 깊이에서 오는 신뢰감',
    },
    {
      id: 'EL_5060_ETIQUETTE',
      anchorNoun: '예절',
      criterionQuestion: '식당 직원 및 동석자들을 존중하며 배려하는 매너를 지키는가?',
      category: 'ETIQUETTE',
      description: '식사 공간과 타인을 정중하게 존중하는 기본 에티켓',
    },
  ];

  /**
   * [원칙 3] 5060 컨텍스트에 최적화된 자율 5점 척도 정의
   */
  private readonly metricScale: ModuleMetricScale = {
    scaleId: 'SCALE_5060_DIGNITY',
    name: '5060 품격 5점 척도',
    steps: [
      { stepValue: 1, label: '아쉬움', normalizedPoints: 20 },
      { stepValue: 2, label: '보통이하', normalizedPoints: 40 },
      { stepValue: 3, label: '편안함', normalizedPoints: 60 },
      { stepValue: 4, label: '돋보임', normalizedPoints: 80 },
      { stepValue: 5, label: '깊은감동', normalizedPoints: 100 },
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
          score100: 85,
          rawAverageStep: 4.25,
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

