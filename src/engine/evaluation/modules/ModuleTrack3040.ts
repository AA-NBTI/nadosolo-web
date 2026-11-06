/**
 * [마이크로 모듈 1] 3040 트랙 전용 소셜 관찰 모듈 (ModuleTrack3040)
 * 3040 직장인/싱글의 라이프스타일과 소통 양상을 온전히 책임지는 독립 모듈
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

export class ModuleTrack3040 implements EvaluationModule {
  readonly id = 'MOD_TRACK_3040';
  readonly name = '3040 소셜 커뮤니케이션 모듈';
  readonly targetContext = 'AGE_3040' as const;
  readonly version = '1.0.0';

  /**
   * [원칙 1 & 2] 순수 단일 명사 1요소 1기준 매핑
   */
  private readonly elements: ObservationElement[] = [
    {
      id: 'EL_3040_LISTEN',
      anchorNoun: '경청',
      criterionQuestion: '상대방의 이야기를 끊지 않고 끝까지 주의 깊게 듣는가?',
      category: 'COMMUNICATION',
      description: '상대방 발언에 대한 집중도와 대화 존중 태도',
    },
    {
      id: 'EL_3040_QUESTION',
      anchorNoun: '질문',
      criterionQuestion: '상대방의 일상과 취향을 편안하게 이끌어내는 센스가 있는가?',
      category: 'COMMUNICATION',
      description: '대화를 티키타카로 확장시키는 질문 감각',
    },
    {
      id: 'EL_3040_EXPRESS',
      anchorNoun: '표현',
      criterionQuestion: '자신의 생각이나 가치관을 솔직하고 담백하게 전달하는가?',
      category: 'COMMUNICATION',
      description: '과시나 포장 없는 자연스럽고 명료한 자기표현력',
    },
    {
      id: 'EL_3040_SENSE',
      anchorNoun: '센스',
      criterionQuestion: '대화의 흐름을 읽고 위트 있게 분위기를 밝히는가?',
      category: 'ATMOSPHERE',
      description: '과하지 않은 적재적소의 유머와 상황 대처 센스',
    },
    {
      id: 'EL_3040_CARE',
      anchorNoun: '배려',
      criterionQuestion: '대화를 독점하지 않고 모든 동석자에게 고르게 시선을 나누는가?',
      category: 'ETIQUETTE',
      description: '말없는 동석자를 챙기고 대화 기회를 나누는 포용력',
    },
  ];

  /**
   * [원칙 3] 3040 컨텍스트에 최적화된 자율 5점 척도 정의
   */
  private readonly metricScale: ModuleMetricScale = {
    scaleId: 'SCALE_3040_COMM',
    name: '3040 소통 5점 척도',
    steps: [
      { stepValue: 1, label: '미흡', normalizedPoints: 20 },
      { stepValue: 2, label: '다소부족', normalizedPoints: 40 },
      { stepValue: 3, label: '보통', normalizedPoints: 60 },
      { stepValue: 4, label: '우수', normalizedPoints: 80 },
      { stepValue: 5, label: '탁월', normalizedPoints: 100 },
    ],
  };

  getObservationElements(): ObservationElement[] {
    return this.elements;
  }

  getMetricScale(): ModuleMetricScale {
    return this.metricScale;
  }

  /**
   * 100점 만점 표준 정규화 출력
   */
  normalizeScore(records: ParticipantObservationRecord[], targetUserId: string): NormalizedModuleScore {
    const targetRecords = records.filter(
      (r) => r.toUserId === targetUserId && r.moduleId === this.id
    );

    const elementScores: NormalizedElementScore[] = this.elements.map((el) => {
      const elRecords = targetRecords.filter((r) => r.elementId === el.id);
      if (elRecords.length === 0) {
        // 평가 데이터가 아직 없을 때 기본 표준 80점 세팅
        return {
          elementId: el.id,
          anchorNoun: el.anchorNoun,
          score100: 80,
          rawAverageStep: 4.0,
          observationCount: 0,
        };
      }

      const sumSteps = elRecords.reduce((acc, curr) => acc + curr.scoreStep, 0);
      const avgStep = sumSteps / elRecords.length;
      // 1~5점 단계를 20~100점 점수로 1:1 정규화 (1=20점, 5=100점)
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

