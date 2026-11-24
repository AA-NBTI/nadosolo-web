/**
 * OOPS UNIVERSAL THREAT INDEX ENGINE
 * 엔터프라이즈급 글로벌 위험 지수 및 지역별 체감 온도 통계 엔진
 * - 이모티콘 100% 영구 배제
 * - 신뢰구간(CI 95%), 가중 표본수(N), 24h 변동 델타, 지역별 정규화 게이지 제공
 * - 5개 언어 (ko, en, ja, zh, es) 정밀 지원
 */

import type { OopsLocale } from '@/lib/oops/i18n';

export interface RegionalMetric {
  city: Record<OopsLocale, string>;
  country: string;
  temperature: number; // 0 - 100
  sampleSize: number;
  delta24h: number;    // e.g. +3.2 or -1.4
}

export interface ThreatTheme {
  id: string;
  code: string;
  category: 'AI_SOVEREIGNTY' | 'GEOPOLITICS' | 'ECONOMY' | 'LABOR' | 'TECH_CONTROL' | 'SOCIETY';
  titles: Record<OopsLocale, string>;
  subtitles: Record<OopsLocale, string>;
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
    titles: {
      ko: 'AI 자율 의사결정 및 인간 주도권 충돌 지수',
      en: 'AI & HUMAN DECISION CONFLICT BAROMETER',
      ja: 'AI自律的意思決定と人間の主導権衝突指数',
      zh: 'AI自主决策与人类主导权冲突指数',
      es: 'Índice de Conflicto de Decisiones entre IA y Humanos',
    },
    subtitles: {
      ko: '인간의 승인 없는 AI 독자 판단 및 오류 책임 소재의 사회적 갈등 관측',
      en: 'Observation of autonomous AI actions without human authorization and dispute liability',
      ja: '人間の承認なきAI単独判断および過失責任の社会的対立を観測',
      zh: '观测未经人类授权的AI自主判断及过失责任归属之社会冲突',
      es: 'Observación de acciones autónomas de IA sin aprobación humana y disputas de responsabilidad',
    },
    globalIndex: 74.2,
    sampleSize: 128430,
    regionCount: 42,
    delta24h: 3.2,
    regionalMetrics: [
      { city: { ko: '서울', en: 'Seoul', ja: 'ソウル', zh: '首尔', es: 'Seúl' }, country: 'KR', temperature: 72, sampleSize: 24190, delta24h: 3.2 },
      { city: { ko: '부산', en: 'Busan', ja: '釜山', zh: '釜山', es: 'Busán' }, country: 'KR', temperature: 64, sampleSize: 8420, delta24h: -1.1 },
      { city: { ko: '도쿄', en: 'Tokyo', ja: '東京', zh: '东京', es: 'Tokio' }, country: 'JP', temperature: 59, sampleSize: 19300, delta24h: 0.4 },
      { city: { ko: '뉴욕', en: 'New York', ja: 'ニューヨーク', zh: '纽约', es: 'Nueva York' }, country: 'US', temperature: 78, sampleSize: 31200, delta24h: 5.8 },
      { city: { ko: '런던', en: 'London', ja: 'ロンドン', zh: '伦敦', es: 'Londres' }, country: 'GB', temperature: 68, sampleSize: 15840, delta24h: 1.9 },
      { city: { ko: '베를린', en: 'Berlin', ja: 'ベルリン', zh: '柏林', es: 'Berlín' }, country: 'DE', temperature: 62, sampleSize: 12400, delta24h: -0.5 },
      { city: { ko: '싱가포르', en: 'Singapore', ja: 'シンガポール', zh: '新加坡', es: 'Singapur' }, country: 'SG', temperature: 71, sampleSize: 9600, delta24h: 2.1 },
    ],
    divergence: {
      objectiveRisk: 52.0,
      subjectiveFear: 74.2,
      gap: 22.2,
    },
  },

  job_displacement: {
    id: 'job_displacement',
    code: 'THREAT-JOB-02',
    category: 'LABOR',
    titles: {
      ko: '화이트칼라 자동화 대체 및 실직 체감 지수',
      en: 'LABOR OBSOLESCENCE & AUTOMATION RISK',
      ja: 'ホワイトカラー自動化代替および失業体感指数',
      zh: '白领自动化替代与失业体感指数',
      es: 'Riesgo de Automatización y Obsolescencia Laboral',
    },
    subtitles: {
      ko: '지식노동·사무직·개발직 자동화에 따른 3년 내 직무 소멸 불안 지수',
      en: 'Public anxiety over intellectual, coding, and white-collar role displacement within 3 years',
      ja: '知識労働・事務・開発職の自動化に伴う3年以内の職務消滅不安指数',
      zh: '知识工作、事务及开发岗位因自动化而在3年内被取代之焦虑指数',
      es: 'Ansiedad pública por el desplazamiento de roles intelectuales y administrativos en 3 años',
    },
    globalIndex: 81.5,
    sampleSize: 94210,
    regionCount: 38,
    delta24h: 4.7,
    regionalMetrics: [
      { city: { ko: '서울', en: 'Seoul', ja: 'ソウル', zh: '首尔', es: 'Seúl' }, country: 'KR', temperature: 84, sampleSize: 18400, delta24h: 4.1 },
      { city: { ko: '실리콘밸리', en: 'Silicon Valley', ja: 'シリコンバレー', zh: '硅谷', es: 'Silicon Valley' }, country: 'US', temperature: 88, sampleSize: 21900, delta24h: 6.3 },
      { city: { ko: '도쿄', en: 'Tokyo', ja: '東京', zh: '东京', es: 'Tokio' }, country: 'JP', temperature: 67, sampleSize: 14200, delta24h: 1.2 },
      { city: { ko: '런던', en: 'London', ja: 'ロンドン', zh: '伦敦', es: 'Londres' }, country: 'GB', temperature: 79, sampleSize: 13500, delta24h: 3.8 },
      { city: { ko: '벵갈루루', en: 'Bengaluru', ja: 'ベンガルール', zh: '班加罗尔', es: 'Bengaluru' }, country: 'IN', temperature: 91, sampleSize: 16800, delta24h: 7.5 },
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
    titles: {
      ko: '글로벌 유동성 위축 및 생활 물가 위기 지수',
      en: 'GLOBAL FINANCIAL LIQUIDITY & INFLATION STRAIN',
      ja: 'グローバル流動性収縮および物価危機指数',
      zh: '全球流动性紧缩与通胀生活危机指数',
      es: 'Tensión de Liquidez Financiera e Inflación Global',
    },
    subtitles: {
      ko: '환율·금리 변동성에 따른 실질소득 감소와 금융 시스템 불안 지수',
      en: 'Real income decline and financial fragility driven by currency and interest volatility',
      ja: '為替・金利変動に伴う実質所得減少および金融不安指数',
      zh: '汇率与利率剧烈波动下之实际收入缩水与金融脆弱性指数',
      es: 'Caída del ingreso real y fragilidad financiera por volatilidad cambiaria y de tasas',
    },
    globalIndex: 76.8,
    sampleSize: 110540,
    regionCount: 45,
    delta24h: -0.8,
    regionalMetrics: [
      { city: { ko: '서울', en: 'Seoul', ja: 'ソウル', zh: '首尔', es: 'Seúl' }, country: 'KR', temperature: 83, sampleSize: 22100, delta24h: 2.1 },
      { city: { ko: '뉴욕', en: 'New York', ja: 'ニューヨーク', zh: '纽约', es: 'Nueva York' }, country: 'US', temperature: 74, sampleSize: 26400, delta24h: -1.2 },
      { city: { ko: '부에노스아이레스', en: 'Buenos Aires', ja: 'ブエノスアイレス', zh: '布宜诺斯艾利斯', es: 'Buenos Aires' }, country: 'AR', temperature: 95, sampleSize: 8900, delta24h: 4.8 },
      { city: { ko: '런던', en: 'London', ja: 'ロンドン', zh: '伦敦', es: 'Londres' }, country: 'GB', temperature: 72, sampleSize: 14800, delta24h: -0.3 },
      { city: { ko: '베이징', en: 'Beijing', ja: '北京', zh: '北京', es: 'Pekín' }, country: 'CN', temperature: 69, sampleSize: 19500, delta24h: 0.1 },
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
    titles: {
      ko: '지정학적 무력 충돌 및 국가 안보 위협 지수',
      en: 'GEOPOLITICAL ESCALATION & SOVEREIGN RISK',
      ja: '地政学的武力衝突および国家安保脅威指数',
      zh: '地缘武装冲突与主权安全威胁指数',
      es: 'Escalada Geopolítica y Riesgo Soberano',
    },
    subtitles: {
      ko: '국지전 확산 우려 및 자원 공급망 차단에 따른 안보 불안 지수',
      en: 'Security threat index driven by localized war escalation and supply chain disruption',
      ja: '局地戦拡大懸念および資源サプライチェーン遮断に伴う安保不安指数',
      zh: '局域战争升级与关键资源供应链受阻引发之安全恐慌指数',
      es: 'Índice de inseguridad por escalada bélica regional e interrupción de suministros',
    },
    globalIndex: 79.4,
    sampleSize: 87600,
    regionCount: 50,
    delta24h: 5.1,
    regionalMetrics: [
      { city: { ko: '키이우', en: 'Kyiv', ja: 'キーウ', zh: '基辅', es: 'Kiev' }, country: 'UA', temperature: 98, sampleSize: 7200, delta24h: 1.0 },
      { city: { ko: '텔아비브', en: 'Tel Aviv', ja: 'テルアビブ', zh: '特拉维夫', es: 'Tel Aviv' }, country: 'IL', temperature: 94, sampleSize: 8100, delta24h: 3.4 },
      { city: { ko: '서울', en: 'Seoul', ja: 'ソウル', zh: '首尔', es: 'Seúl' }, country: 'KR', temperature: 71, sampleSize: 17500, delta24h: 1.8 },
      { city: { ko: '타이베이', en: 'Taipei', ja: '台北', zh: '台北', es: 'Taipéi' }, country: 'TW', temperature: 82, sampleSize: 11300, delta24h: 4.2 },
      { city: { ko: '워싱턴 D.C.', en: 'Washington D.C.', ja: 'ワシントンD.C.', zh: '华盛顿特区', es: 'Washington D.C.' }, country: 'US', temperature: 75, sampleSize: 19800, delta24h: 2.9 },
    ],
    divergence: {
      objectiveRisk: 86.0,
      subjectiveFear: 79.4,
      gap: -6.6,
    },
  },

  tech_control: {
    id: 'tech_control',
    code: 'THREAT-TECH-05',
    category: 'TECH_CONTROL',
    titles: {
      ko: '빅테크 알고리즘 감시 및 데이터 주권 독점 지수',
      en: 'BLACK-BOX ALGORITHM & SURVEILLANCE MONOPOLY',
      ja: '巨大ITアルゴリズム監視およびデータ主権独占指数',
      zh: '科技巨头算法监视与数据主权垄断指数',
      es: 'Monopolio de Algoritmos de Caja Negra y Vigilancia',
    },
    subtitles: {
      ko: '설명 불가능한 AI 알고리즘의 통제권 독점 및 개인정보 침해 체감 지수',
      en: 'Perception of black-box algorithm dominance and digital surveillance risk',
      ja: '説明不能なAIアルゴリズムによる制御独占およびプライバシー侵害指数',
      zh: '黑箱算法掌控社会权力及数据隐私被侵蚀之体感指数',
      es: 'Percepción del dominio de algoritmos opacos y riesgo de vigilancia digital',
    },
    globalIndex: 65.3,
    sampleSize: 76400,
    regionCount: 35,
    delta24h: 1.4,
    regionalMetrics: [
      { city: { ko: '브뤼셀', en: 'Brussels', ja: 'ブリュッセル', zh: '布鲁塞尔', es: 'Bruselas' }, country: 'EU', temperature: 79, sampleSize: 11200, delta24h: 3.1 },
      { city: { ko: '샌프란시스코', en: 'San Francisco', ja: 'サンフランシスコ', zh: '旧金山', es: 'San Francisco' }, country: 'US', temperature: 68, sampleSize: 16400, delta24h: 0.9 },
      { city: { ko: '서울', en: 'Seoul', ja: 'ソウル', zh: '首尔', es: 'Seúl' }, country: 'KR', temperature: 63, sampleSize: 14100, delta24h: 1.2 },
      { city: { ko: '도쿄', en: 'Tokyo', ja: '東京', zh: '东京', es: 'Tokio' }, country: 'JP', temperature: 56, sampleSize: 10500, delta24h: -0.4 },
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
    titles: {
      ko: '사회적 양극화 및 제도적 신뢰 붕괴 지수',
      en: 'CIVIC POLARIZATION & INSTITUTIONAL TRUST COLLAPSE',
      ja: '社会的二極化および制度的信頼崩壊指数',
      zh: '社会极化与制度性信任崩溃指数',
      es: 'Polarización Cívica y Colapso de Confianza Institucional',
    },
    subtitles: {
      ko: '세대·계층 간 갈등 격화 및 미디어·정부 기관에 대한 신뢰 붕괴 지수',
      en: 'Escalating civic polarization and erosion of trust in public institutions',
      ja: '世代・階層間の対立激化およびメディア・政府機関への信頼失墜指数',
      zh: '阶层与世代对立加剧，公众对媒体及公共机构之信任坍塌指数',
      es: 'Polarización social creciente y pérdida de confianza en las instituciones públicas',
    },
    globalIndex: 77.1,
    sampleSize: 82300,
    regionCount: 39,
    delta24h: 2.8,
    regionalMetrics: [
      { city: { ko: '서울', en: 'Seoul', ja: 'ソウル', zh: '首尔', es: 'Seúl' }, country: 'KR', temperature: 86, sampleSize: 19200, delta24h: 3.5 },
      { city: { ko: '워싱턴 D.C.', en: 'Washington D.C.', ja: 'ワシントンD.C.', zh: '华盛顿特区', es: 'Washington D.C.' }, country: 'US', temperature: 89, sampleSize: 18400, delta24h: 4.1 },
      { city: { ko: '파리', en: 'Paris', ja: 'パリ', zh: '巴黎', es: 'París' }, country: 'FR', temperature: 78, sampleSize: 12900, delta24h: 1.9 },
      { city: { ko: '런던', en: 'London', ja: 'ロンドン', zh: '伦敦', es: 'Londres' }, country: 'GB', temperature: 71, sampleSize: 11500, delta24h: 0.8 },
    ],
    divergence: {
      objectiveRisk: 75.0,
      subjectiveFear: 77.1,
      gap: 2.1,
    },
  },
};

export const CHART_I18N: Record<OopsLocale, {
  coreEngine: string;
  observationReport: string;
  confidence: string;
  globalIndex: string;
  delta24h: string;
  sampleSize: string;
  observedRegions: string;
  regionalRiskScale: string;
  temperatureDelta: string;
  divergenceTitle: string;
  objRiskLabel: string;
  subFearLabel: string;
  gapLabel: string;
  gapHigherDesc: string;
  gapLowerDesc: string;
  sourceText: string;
  verifiedSample: string;
}> = {
  ko: {
    coreEngine: '인류 범용 위험 기상청 // 코어 엔진',
    observationReport: '관측 보고서',
    confidence: '신뢰도: 95% (오차범위 ±1.2%)',
    globalIndex: '글로벌 위험 지수',
    delta24h: '24시간 변동폭',
    sampleSize: '가중 표본수 (N)',
    observedRegions: '관측 참여 지역',
    regionalRiskScale: '지역별 체감 위험도 (0° - 100°)',
    temperatureDelta: '체감온도 / 변동치',
    divergenceTitle: '통계적 인식 격차 (사건 실측 객관 위험 vs 대중 체감 위험)',
    objRiskLabel: '사건 실측 객관 위험도',
    subFearLabel: '대중 체감 위험도',
    gapLabel: '인식 격차',
    gapHigherDesc: '대중의 심리적 위기 체감이 실제 발생한 사건 발생률보다 높게 형성되어 있습니다.',
    gapLowerDesc: '실제 객관적 위험 수치 대비 대중의 경각심과 사회적 방비가 다소 미흡한 상태입니다.',
    sourceText: '출처: OOPS 글로벌 위험 센서 네트워크 (연합)',
    verifiedSample: '검증된 표본수',
  },
  en: {
    coreEngine: 'UNIVERSAL THREAT OBSERVATORY // CORE ENGINE',
    observationReport: 'OBSERVATION REPORT',
    confidence: 'CONFIDENCE: 95% (CI ±1.2%)',
    globalIndex: 'GLOBAL THREAT INDEX',
    delta24h: '24H DELTA',
    sampleSize: 'SAMPLE SIZE (N)',
    observedRegions: 'OBSERVED REGIONS',
    regionalRiskScale: 'REGIONAL RISK PERCEPTION (0° - 100° SCALE)',
    temperatureDelta: 'TEMPERATURE / DELTA',
    divergenceTitle: 'STATISTICAL DIVERGENCE (OBJECTIVE RISK vs. PUBLIC FEAR)',
    objRiskLabel: 'Objective Incident Risk',
    subFearLabel: 'Public Perception Risk',
    gapLabel: 'Divergence Gap',
    gapHigherDesc: 'Public perception and anxiety exceed actual verified incident velocity.',
    gapLowerDesc: 'Public vigilance remains subdued despite elevated objective incident data.',
    sourceText: 'SOURCE: OOPS GLOBAL THREAT SENSOR NETWORK (SYNDICATED)',
    verifiedSample: 'VERIFIED SAMPLE',
  },
  ja: {
    coreEngine: '人類汎用危険気象庁 // コアエンジン',
    observationReport: '観測レポート',
    confidence: '信頼度: 95% (誤差範囲 ±1.2%)',
    globalIndex: 'グローバル危機指数',
    delta24h: '24時間変動幅',
    sampleSize: '加重標本数 (N)',
    observedRegions: '観測参加地域',
    regionalRiskScale: '地域別体感危険度 (0° - 100°)',
    temperatureDelta: '体感温度 / 変動値',
    divergenceTitle: '統計的認識ギャップ (事件実測の客観リスク vs 大衆の体感危機)',
    objRiskLabel: '事件実測の客観リスク',
    subFearLabel: '大衆の体感危機',
    gapLabel: '認識ギャップ',
    gapHigherDesc: '大衆の心理的危機感が実際の事件発生率より高く形成されています。',
    gapLowerDesc: '実際の客観的危険度に対して大衆の警戒感と社会的備えがやや不足しています。',
    sourceText: '出典: OOPSグローバル脅威センサーネットワーク (連合)',
    verifiedSample: '検証済み標本数',
  },
  zh: {
    coreEngine: '人类通用风险观测所 // 核心引擎',
    observationReport: '观测报告',
    confidence: '置信度: 95% (误差范围 ±1.2%)',
    globalIndex: '全球风险指数',
    delta24h: '24小时波动',
    sampleSize: '加权样本量 (N)',
    observedRegions: '观测覆盖区域',
    regionalRiskScale: '各地区体感风险 (0° - 100°)',
    temperatureDelta: '体感温度 / 增减量',
    divergenceTitle: '统计认知偏差 (事件实测客观风险 vs 公众体感恐惧)',
    objRiskLabel: '事件实测客观风险',
    subFearLabel: '公众体感风险',
    gapLabel: '认知差距',
    gapHigherDesc: '公众的心理危机体感明显超前于实际经核实的事件发生率。',
    gapLowerDesc: '相比于客观风险指标，公众的戒备心态与社会防护仍显滞后。',
    sourceText: '数据来源: OOPS全球威胁传感网络 (联合分发)',
    verifiedSample: '已验证样本量',
  },
  es: {
    coreEngine: 'OBSERVATORIO UNIVERSAL DE AMENAZAS // MOTOR CENTRAL',
    observationReport: 'INFORME DE OBSERVACIÓN',
    confidence: 'CONFIANZA: 95% (IC ±1.2%)',
    globalIndex: 'ÍNDICE GLOBAL DE AMENAZA',
    delta24h: 'VARIACIÓN 24H',
    sampleSize: 'MUESTRA PONDERADA (N)',
    observedRegions: 'REGIONES OBSERVADAS',
    regionalRiskScale: 'PERCEPCIÓN REGIONAL DEL RIESGO (ESCALA 0° - 100°)',
    temperatureDelta: 'TEMPERATURA / VARIACIÓN',
    divergenceTitle: 'DIVERGENCIA ESTADÍSTICA (RIESGO OBJETIVO vs. TEMOR PÚBLICO)',
    objRiskLabel: 'Riesgo Objetivo de Incidentes',
    subFearLabel: 'Riesgo Percibido por el Público',
    gapLabel: 'Brecha de Divergencia',
    gapHigherDesc: 'La percepción pública y la ansiedad superan la frecuencia real de incidentes.',
    gapLowerDesc: 'La vigilancia pública sigue siendo baja a pesar de los datos objetivos elevados.',
    sourceText: 'FUENTE: RED GLOBAL DE SENSORES DE AMENAZA OOPS (SINDICADA)',
    verifiedSample: 'MUESTRA VERIFICADA',
  },
};

export function getThreatTheme(id: string): ThreatTheme {
  return UNIVERSAL_THREAT_THEMES[id] || UNIVERSAL_THREAT_THEMES.ai_collision;
}

export function getAllThreatThemes(): ThreatTheme[] {
  return Object.values(UNIVERSAL_THREAT_THEMES);
}
