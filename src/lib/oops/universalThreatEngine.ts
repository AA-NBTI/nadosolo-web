/**
 * OOPS UNIVERSAL THREAT INDEX ENGINE
 * 엔터프라이즈급 글로벌 위험 지수 및 지역별 체감 온도 통계 엔진
 * - 이모티콘 100% 영구 배제
 * - 신뢰구간(CI 95%), 가중 표본수(N), 24h 변동 델타, 지역별 정규화 게이지 제공
 */

export interface RegionalMetric {
  city: string;
  country: string;
  temperature: number; // 0 - 100
  sampleSize: number;
  delta24h: number;    // e.g. +3.2 or -1.4
}

export interface ThreatTheme {
  id: string;
  code: string;
  category: 'AI_SOVEREIGNTY' | 'GEOPOLITICS' | 'ECONOMY' | 'LABOR' | 'TECH_CONTROL' | 'SOCIETY';
  englishTitle: string;
  koreanTitle: string;
  globalIndex: number;
  sampleSize: number;
  regionCount: number;
  delta24h: number;
  regionalMetrics: RegionalMetric[];
  divergence: {
    objectiveRisk: number;  // 실제 사건/기술 사고 지표
    subjectiveFear: number; // 대중 체감 위기 지표
    gap: number;            // 격차
  };
}

export const UNIVERSAL_THREAT_THEMES: Record<string, ThreatTheme> = {
  ai_collision: {
    id: 'ai_collision',
    code: 'THREAT-AI-01',
    category: 'AI_SOVEREIGNTY',
    englishTitle: 'AI & HUMAN CONFLICT BAROMETER',
    koreanTitle: 'AI 자율 의사결정 및 인간 주도권 충돌 지수',
    globalIndex: 74.2,
    sampleSize: 128430,
    regionCount: 42,
    delta24h: 3.2,
    regionalMetrics: [
      { city: '서울', country: 'KR', temperature: 72, sampleSize: 24190, delta24h: 3.2 },
      { city: '부산', country: 'KR', temperature: 64, sampleSize: 8420, delta24h: -1.1 },
      { city: '도쿄', country: 'JP', temperature: 59, sampleSize: 19300, delta24h: 0.4 },
      { city: '뉴욕', country: 'US', temperature: 78, sampleSize: 31200, delta24h: 5.8 },
      { city: '런던', country: 'GB', temperature: 68, sampleSize: 15840, delta24h: 1.9 },
      { city: '베를린', country: 'DE', temperature: 62, sampleSize: 12400, delta24h: -0.5 },
      { city: '싱가포르', country: 'SG', temperature: 71, sampleSize: 9600, delta24h: 2.1 },
    ],
    divergence: {
      objectiveRisk: 52.0,
      subjectiveFear: 74.2,
      gap: 22.2, // 대중 체감이 실제 기술적 통제사고보다 22.2° 앞서 과열
    },
  },

  job_displacement: {
    id: 'job_displacement',
    code: 'THREAT-JOB-02',
    category: 'LABOR',
    englishTitle: 'LABOR OBSOLESCENCE & AUTOMATION RISK',
    koreanTitle: '화이트칼라 자동화 대체 및 실직 체감 지수',
    globalIndex: 81.5,
    sampleSize: 94210,
    regionCount: 38,
    delta24h: 4.7,
    regionalMetrics: [
      { city: '서울', country: 'KR', temperature: 84, sampleSize: 18400, delta24h: 4.1 },
      { city: '실리콘밸리', country: 'US', temperature: 88, sampleSize: 21900, delta24h: 6.3 },
      { city: '도쿄', country: 'JP', temperature: 67, sampleSize: 14200, delta24h: 1.2 },
      { city: '런던', country: 'GB', temperature: 79, sampleSize: 13500, delta24h: 3.8 },
      { city: '벵갈루루', country: 'IN', temperature: 91, sampleSize: 16800, delta24h: 7.5 },
    ],
    divergence: {
      objectiveRisk: 61.0,
      subjectiveFear: 81.5,
      gap: 20.5,
    },
  },

  economy_panic: {
    id: 'economy_panic',
    code: 'THREAT-ECON-03',
    category: 'ECONOMY',
    englishTitle: 'GLOBAL FINANCIAL LIQUIDITY & INFLATION STRAIN',
    koreanTitle: '글로벌 유동성 위축 및 생활 물가 위기 지수',
    globalIndex: 76.8,
    sampleSize: 110540,
    regionCount: 45,
    delta24h: -0.8,
    regionalMetrics: [
      { city: '서울', country: 'KR', temperature: 83, sampleSize: 22100, delta24h: 2.1 },
      { city: '뉴욕', country: 'US', temperature: 74, sampleSize: 26400, delta24h: -1.2 },
      { city: '부에노스아이레스', country: 'AR', temperature: 95, sampleSize: 8900, delta24h: 4.8 },
      { city: '런던', country: 'GB', temperature: 72, sampleSize: 14800, delta24h: -0.3 },
      { city: '베이징', country: 'CN', temperature: 69, sampleSize: 19500, delta24h: 0.1 },
    ],
    divergence: {
      objectiveRisk: 74.0,
      subjectiveFear: 76.8,
      gap: 2.8,
    },
  },

  geopolitical_war: {
    id: 'geopolitical_war',
    code: 'THREAT-WAR-04',
    category: 'GEOPOLITICS',
    englishTitle: 'GEOPOLITICAL ESCALATION & SOVEREIGN RISK',
    koreanTitle: '지정학적 무력 충돌 및 국가 안보 위협 지수',
    globalIndex: 79.4,
    sampleSize: 87600,
    regionCount: 50,
    delta24h: 5.1,
    regionalMetrics: [
      { city: '키이우', country: 'UA', temperature: 98, sampleSize: 7200, delta24h: 1.0 },
      { city: '텔아비브', country: 'IL', temperature: 94, sampleSize: 8100, delta24h: 3.4 },
      { city: '서울', country: 'KR', temperature: 71, sampleSize: 17500, delta24h: 1.8 },
      { city: '타이베이', country: 'TW', temperature: 82, sampleSize: 11300, delta24h: 4.2 },
      { city: '워싱턴 D.C.', country: 'US', temperature: 75, sampleSize: 19800, delta24h: 2.9 },
    ],
    divergence: {
      objectiveRisk: 86.0,
      subjectiveFear: 79.4,
      gap: -6.6, // 실제 분쟁 위험도보다 대중 체감이 다소 무딘 상태
    },
  },

  tech_control: {
    id: 'tech_control',
    code: 'THREAT-TECH-05',
    category: 'TECH_CONTROL',
    englishTitle: 'BLACK-BOX ALGORITHM & SURVEILLANCE MONOPOLY',
    koreanTitle: '빅테크 알고리즘 감시 및 데이터 주권 독점 지수',
    globalIndex: 65.3,
    sampleSize: 76400,
    regionCount: 35,
    delta24h: 1.4,
    regionalMetrics: [
      { city: '브뤼셀', country: 'EU', temperature: 79, sampleSize: 11200, delta24h: 3.1 },
      { city: '샌프란시스코', country: 'US', temperature: 68, sampleSize: 16400, delta24h: 0.9 },
      { city: '서울', country: 'KR', temperature: 63, sampleSize: 14100, delta24h: 1.2 },
      { city: '도쿄', country: 'JP', temperature: 56, sampleSize: 10500, delta24h: -0.4 },
    ],
    divergence: {
      objectiveRisk: 72.0,
      subjectiveFear: 65.3,
      gap: -6.7,
    },
  },

  social_rift: {
    id: 'social_rift',
    code: 'THREAT-SOC-06',
    category: 'SOCIETY',
    englishTitle: 'CIVIC POLARIZATION & INSTITUTIONAL TRUST COLLAPSE',
    koreanTitle: '사회적 양극화 및 제도적 신뢰 붕괴 지수',
    globalIndex: 77.1,
    sampleSize: 82300,
    regionCount: 39,
    delta24h: 2.8,
    regionalMetrics: [
      { city: '서울', country: 'KR', temperature: 86, sampleSize: 19200, delta24h: 3.5 },
      { city: '워싱턴 D.C.', country: 'US', temperature: 89, sampleSize: 18400, delta24h: 4.1 },
      { city: '파리', country: 'FR', temperature: 78, sampleSize: 12900, delta24h: 1.9 },
      { city: '런던', country: 'GB', temperature: 71, sampleSize: 11500, delta24h: 0.8 },
    ],
    divergence: {
      objectiveRisk: 75.0,
      subjectiveFear: 77.1,
      gap: 2.1,
    },
  },
};

/**
 * 특정 테마 조회 유틸리티
 */
export function getThreatTheme(id: string): ThreatTheme {
  return UNIVERSAL_THREAT_THEMES[id] || UNIVERSAL_THREAT_THEMES.ai_collision;
}

/**
 * 전체 테마 목록 조회
 */
export function getAllThreatThemes(): ThreatTheme[] {
  return Object.values(UNIVERSAL_THREAT_THEMES);
}
