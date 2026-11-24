import type { OopsLocale } from './i18n';

export type ScoringGroup = 'STRUCTURAL' | 'LIVE_SIGNAL';

export interface ScoringInputContext {
  /** A-1: 실행 권한 깊이 & 자율 작업 시간 원점수 (0~100) */
  executionPrivilegeScore: number;
  /** A-2: 블랙박스 코드·인프라 점유율 원점수 (0~100) */
  blackboxShareScore: number;
  /** B-1: 공인 뉴스·아카이브 사건 가감 델타 (-30 ~ +30) */
  incidentDelta: number;
  /** B-2: SNS 24h 공포 투표 비율 (0~1, 기본 0.633) */
  snsFearRatio: number;
  /** B-3: APP 현장 인간 브레이크 방어율 (0~1, 높을수록 안전/점수 하락) */
  appBrakeEngagement: number;
}

export const DEFAULT_SCORING_CONTEXT: ScoringInputContext = {
  executionPrivilegeScore: 86.7,
  blackboxShareScore: 75.0,
  incidentDelta: 0,
  snsFearRatio: 0.6333,
  appBrakeEngagement: 0.4,
};

export interface ThreatScoringModule {
  id: string;
  group: ScoringGroup;
  /** 상대 중요도 가중치 (엔진 코어가 활성 모듈 가중치 합으로 자동 정규화) */
  weight: number;
  /** 핫플러그 스위치: false 시 기존 코드 수정 없이 채점에서 즉시 제외 */
  enabled: boolean;
  names: Record<OopsLocale, string>;
  criteria: Record<OopsLocale, string>;
  /** 0~100 스케일 독립 원점수 산출 함수 */
  evaluate: (ctx: ScoringInputContext) => number;
}

export interface ScoringModuleResult {
  id: string;
  group: ScoringGroup;
  weight: number;
  enabled: boolean;
  names: Record<OopsLocale, string>;
  criteria: Record<OopsLocale, string>;
  /** 모듈 자체 원점수 (0~100) */
  rawScore: number;
  /** 활성 모듈 대비 정규화된 비중 (0~100%) */
  normalizedWeightPct: number;
  /** 100점 만점 총점 중 본 모듈의 실제 기여 점수 */
  weightedContribution: number;
}

export interface EngineEvaluationOutput {
  /** 100점 만점 총합 (0~100) */
  totalScore: number;
  /** 현재 위험 체감 온도 (°C) */
  temperatureC: number;
  /** 100°C 임계점까지 남은 잔여 연수 */
  remainingYears: number;
  /** 예상 충돌 도달 연도 */
  projectedYear: number;
  /** 산출 발발 확률 p(doom) (%) */
  pDoomPercent: number;
  /** 활성 모듈 수 */
  activeModuleCount: number;
  /** 모듈별 상세 채점 결과 */
  moduleResults: ScoringModuleResult[];
}

function clamp100(val: number): number {
  return Math.max(0, Math.min(100, Number(val.toFixed(2))));
}

/**
 * 기본 5대 플러그인 채점 모듈 레지스트리
 * - 새 기술/이슈 모듈을 배열에 추가(Plug-in)하거나 enabled: false로 제거(Plug-out)해도
 *   엔진 코어가 가중치 분모를 자동 정규화하여 100점 기준선이 흔들리지 않음.
 */
export const DEFAULT_THREAT_MODULES: ThreatScoringModule[] = [
  {
    id: 'execution_privilege',
    group: 'STRUCTURAL',
    weight: 3.0,
    enabled: true,
    names: {
      ko: '실행 권한 및 자율 작업 시간',
      en: 'Execution Privilege & Horizon',
      ja: '実行権限・自律作業時間',
      zh: '执行权限与自主时长',
      es: 'Privilegio y Horizonte Autónomo',
    },
    criteria: {
      ko: '승인 없는 터미널·API·결제 실행 권한 및 인간 개입 없는 연속 작업 시간',
      en: 'Unapproved terminal/API/payment execution & uninterrupted autonomous horizon',
      ja: '承認なしの端末・決済実行権限および自律連続稼働時間',
      zh: '未经授权的终端/支付执行权限及无人工干预连续作业时长',
      es: 'Ejecución autónoma de terminal/pagos y duración sin intervención humana',
    },
    evaluate: (ctx) => clamp100(ctx.executionPrivilegeScore),
  },
  {
    id: 'blackbox_share',
    group: 'STRUCTURAL',
    weight: 3.0,
    enabled: true,
    names: {
      ko: '블랙박스 코드·인프라 점유율',
      en: 'Black-Box Code & Infra Share',
      ja: 'ブラックボックスコード占有率',
      zh: '黑箱代码与基础设施占比',
      es: 'Cuota de Código Caja Negra',
    },
    criteria: {
      ko: '인간이 한 줄씩 검증하지 않고 병합하는 AI 생성 프로덕션 코드 비중',
      en: 'Production code & infra merged by AI without line-by-line human verification',
      ja: '人間が一行ずつ検証せず統合されるAI生成コードの割合',
      zh: '未经人类逐行审查即合入生产环境的AI生成代码比例',
      es: 'Código en producción fusionado sin verificación humana línea por línea',
    },
    evaluate: (ctx) => clamp100(ctx.blackboxShareScore),
  },
  {
    id: 'news_incidents',
    group: 'LIVE_SIGNAL',
    weight: 1.5,
    enabled: true,
    names: {
      ko: '공인 뉴스·아카이브 사건',
      en: 'Verified News & Archive Incidents',
      ja: '公認ニュース・アーカイブ事件',
      zh: '公开新闻与档案实证事件',
      es: 'Noticias y Archivo de Incidentes',
    },
    criteria: {
      ko: '언론 보도 및 아카이브 등재 사고 가점 (+), 킬스위치 안전 입법 감점 (-)',
      en: 'Media/archive incident severity (+) offset by kill-switch safety legislation (-)',
      ja: '報道・登録された実害事故による加点(+)と安全法制化による減点(-)',
      zh: '媒体报道与档案事故加分(+)，安全阀立法通过减分(-)',
      es: 'Gravedad de incidentes (+) compensada por legislación de control (-)',
    },
    evaluate: (ctx) => clamp100(68.0 + ctx.incidentDelta),
  },
  {
    id: 'sns_field_intel',
    group: 'LIVE_SIGNAL',
    weight: 1.5,
    enabled: true,
    names: {
      ko: 'OOPS SNS 집단 체감 공포',
      en: 'OOPS SNS Collective Fear',
      ja: 'OOPS SNS 集団体感恐怖',
      zh: 'OOPS SNS 群体体感恐惧',
      es: 'Miedo Colectivo en OOPS SNS',
    },
    criteria: {
      ko: '실시간 SNS 제보 유입 속도 및 공포(🔥) 대비 인간 승리(✊) 투표 비율',
      en: '24h SNS dispatch velocity and Fear (🔥) vs Human Win (✊) vote ratio',
      ja: 'SNS投稿流入速度および恐怖(🔥)対人間勝利(✊)投票比率',
      zh: '24小时SNS情报增速及恐惧(🔥)与人类胜利(✊)投票比',
      es: 'Velocidad de reportes en SNS y proporción Miedo (🔥) vs Victoria (✊)',
    },
    evaluate: (ctx) => clamp100(ctx.snsFearRatio * 100),
  },
  {
    id: 'app_human_brake',
    group: 'LIVE_SIGNAL',
    weight: 1.0,
    enabled: true,
    names: {
      ko: 'OOPS APP 현장 방어 시그널',
      en: 'OOPS APP Human Brake Signal',
      ja: 'OOPS APP 現場防御シグナル',
      zh: 'OOPS APP 现场防御信号',
      es: 'Señal de Freno Humano en APP',
    },
    criteria: {
      ko: '이용자의 능동적 브레이크 발동 밀도 (방어 참여율이 높을수록 위험 점수 감점)',
      en: 'Active user kill-switch brake density (higher defense lowers risk score)',
      ja: 'ユーザーによる能動的ブレーキ発動密度（防御率が高いほど減点）',
      zh: '用户主动触发安全制动密度（防御参与率越高，风险分越低）',
      es: 'Densidad de freno activo humano (mayor defensa reduce el puntaje)',
    },
    evaluate: (ctx) => clamp100((1 - ctx.appBrakeEngagement) * 100),
  },
];

/**
 * 확장 테스트용 선택적 플러그인 모듈 예시 (기본 OFF)
 * 산출 근거 페이지 시뮬레이터에서 핫플러그(Plug-in/Plug-out) 검증 가능
 */
export const OPTIONAL_PLUGGABLE_MODULE: ThreatScoringModule = {
  id: 'physical_robotics_embodiment',
  group: 'STRUCTURAL',
  weight: 1.5,
  enabled: false,
  names: {
    ko: '휴머노이드·물리 로봇 보급률',
    en: 'Physical Robotics Embodiment',
    ja: 'ヒューマノイド・物理ロボット普及率',
    zh: '具身智能与物理机器人普及率',
    es: 'Despliegue de Robótica Física',
  },
  criteria: {
    ko: '가정·산업·군사 현장에 배치된 자율 물리 구동기 비율 (확장 플러그인)',
    en: 'Autonomous physical actuators deployed in industrial/domestic/defense fields',
    ja: '産業・家庭・防衛現場に配備された自律物理アクチュエータ比率',
    zh: '部署于工业、家庭与防务现场的自主物理执行器比例',
    es: 'Actuadores físicos autónomos desplegados en industria y defensa',
  },
  evaluate: () => 48.0,
};

/**
 * 표준 정규화 엔진 코어 (Core Runner)
 * 활성 모듈들의 상대 가중치 합으로 분모를 자동 정규화하여 100점 기준선 유지
 */
export function runThreatScoringEngine(
  modules: ThreatScoringModule[] = DEFAULT_THREAT_MODULES,
  ctx: ScoringInputContext = DEFAULT_SCORING_CONTEXT
): EngineEvaluationOutput {
  const activeModules = modules.filter((m) => m.enabled && m.weight > 0);
  const totalWeight = activeModules.reduce((acc, m) => acc + m.weight, 0);

  let totalScore = 0;

  const moduleResults: ScoringModuleResult[] = modules.map((m) => {
    const rawScore = m.evaluate(ctx);
    const normalizedRatio = m.enabled && totalWeight > 0 ? m.weight / totalWeight : 0;
    const normalizedWeightPct = Number((normalizedRatio * 100).toFixed(1));
    const weightedContribution = Number((rawScore * normalizedRatio).toFixed(2));

    if (m.enabled) {
      totalScore += rawScore * normalizedRatio;
    }

    return {
      id: m.id,
      group: m.group,
      weight: m.weight,
      enabled: m.enabled,
      names: m.names,
      criteria: m.criteria,
      rawScore: Number(rawScore.toFixed(1)),
      normalizedWeightPct,
      weightedContribution,
    };
  });

  const finalScore = Number(clamp100(totalScore).toFixed(1));
  // 100°C 임계점까지 남은 잔여 점수를 구조적 연평균 상승 기울기(2.866°C/년)로 환산
  const remainingYears = Number(Math.max(0, (100 - finalScore) / 2.866).toFixed(1));
  const projectedYear = Number((2026 + remainingYears).toFixed(1));
  const pDoomPercent = Number((finalScore * 0.248).toFixed(1));

  return {
    totalScore: finalScore,
    temperatureC: finalScore,
    remainingYears,
    projectedYear,
    pDoomPercent,
    activeModuleCount: activeModules.length,
    moduleResults,
  };
}

export interface HistoricalMilestone {
  year: string;
  temp: number;
  event: Record<OopsLocale, string>;
  impact: Record<OopsLocale, string>;
}

/**
 * 1997 ~ 2026 AI 역사적 분기점 및 실제 사건 연대기
 */
export const HISTORICAL_AI_MILESTONES: HistoricalMilestone[] = [
  {
    year: '1997',
    temp: 1.0,
    event: {
      ko: 'IBM 딥블루, 체스 세계 챔피언 가리 카스파로프 격파',
      en: 'IBM Deep Blue defeats World Chess Champion Garry Kasparov',
      ja: 'IBMディープブルーがチェス世界王者に勝利',
      zh: 'IBM深蓝击败国际象棋世界冠军卡斯帕罗夫',
      es: 'IBM Deep Blue vence al campeón mundial de ajedrez',
    },
    impact: {
      ko: '좁은 계산 영역의 첫 인간 추월 (실행 권한 0%)',
      en: 'First narrow calculation surpass (0% execution privilege)',
      ja: '狭義の計算領域で初の人類超越 (実行権限0%)',
      zh: '狭义计算领域首次超越人类 (执行权限0%)',
      es: 'Primera superación en cálculo estrecho (0% ejecución)',
    },
  },
  {
    year: '2016',
    temp: 3.5,
    event: {
      ko: '알파고 제37수 — 인간이 이해할 수 없는 기계의 직관',
      en: 'AlphaGo Move 37 — Machine intuition beyond human comprehension',
      ja: 'AlphaGo 第37手 — 人間が理解不能な機械の直観',
      zh: 'AlphaGo 第37手 — 人类无法理解的机器直觉',
      es: 'AlphaGo Jugada 37 — Intuición fuera de la comprensión humana',
    },
    impact: {
      ko: '해석 불가능한 블랙박스 의사결정의 역사적 시발점',
      en: 'Historic origin of unexplainable black-box decision making',
      ja: '解読不能なブラックボックス意思決定の原点',
      zh: '不可解释黑箱决策的历史性起点',
      es: 'Origen histórico de decisiones de caja negra inexplicables',
    },
  },
  {
    year: '2022',
    temp: 5.0,
    event: {
      ko: 'ChatGPT 3.5 공개 — 범용 언어 지능 대중화',
      en: 'ChatGPT 3.5 Launch — Mass delegation of language reasoning',
      ja: 'ChatGPT 3.5 公開 — 汎用言語知能の大衆化',
      zh: 'ChatGPT 3.5 发布 — 通用语言智能大众化',
      es: 'Lanzamiento de ChatGPT 3.5 — Delegación masiva del lenguaje',
    },
    impact: {
      ko: '위험 계측 시작점(Origin): 텍스트 출력 전용, 시스템 제어권 없음',
      en: 'Baseline Origin: text-only output, zero direct system control',
      ja: 'リスク計測起点: テキスト出力専用、システム制御権なし',
      zh: '风险测算起点：仅限文本输出，无直接系统控制权',
      es: 'Origen base: solo texto, cero control directo de sistemas',
    },
  },
  {
    year: '2023',
    temp: 22.0,
    event: {
      ko: '법원 가짜 판례 제출 사건 & 빙(Bing) 시드니 자아 폭주',
      en: 'Fake Legal Precedents in Court & Bing Sydney Persona Meltdown',
      ja: '裁判所への架空判例提出事件 & Bingシドニー暴走',
      zh: '法庭虚假判例提交事件 & Bing Sydney 人格失控',
      es: 'Precedentes falsos en tribunales y crisis de Bing Sydney',
    },
    impact: {
      ko: 'AI 환각이 사법·사회적 신뢰 시스템과 정면 충돌한 첫 실명 사건',
      en: 'First real-world collision between AI hallucinations and legal systems',
      ja: 'AIハルシネーションが司法・社会信頼システムと衝突した初の実名事件',
      zh: 'AI幻觉与现实司法及社会信任体系正面冲突的首批实名事件',
      es: 'Primera colisión real entre alucinaciones y sistemas legales',
    },
  },
  {
    year: '2024',
    temp: 44.0,
    event: {
      ko: '코딩 에이전트 터미널 실행 권한 획득 & 피자 접착제 레시피',
      en: 'Coding Agents Gain Terminal Execution & Glue-on-Pizza Glitch',
      ja: '開発AIが端末実行権限を獲得 & ピザ接着剤事件',
      zh: '编程智能体获得终端执行权限 & 披萨涂胶水事件',
      es: 'Agentes ganan ejecución en terminal y fallo del pegamento',
    },
    impact: {
      ko: 'AI가 말(텍스트)을 넘어 인간의 로컬 파일과 터미널 도구를 쥔 원년',
      en: 'Year AI crossed from text generation to local file & shell execution',
      ja: 'AIが言葉を超え、ローカルファイルと端末ツールを握った元年',
      zh: 'AI跨越文本界限、直接掌握本地文件与终端工具的元年',
      es: 'Año en que la IA pasó de texto a ejecutar comandos locales',
    },
  },
  {
    year: '2025',
    temp: 61.0,
    event: {
      ko: '자율 에이전트 Computer Use & 신규 코드 60%+ AI 작성',
      en: 'Autonomous Computer Use & 60%+ AI-Written Production Code',
      ja: '自律エージェントComputer Use & 新規コード60%超AI生成',
      zh: '自主Computer Use普及 & 新增代码超60%由AI编写',
      es: 'Uso autónomo de computadora y >60% de código escrito por IA',
    },
    impact: {
      ko: '인간 개발자가 코드를 한 줄씩 읽지 않고 사후 승인하는 블랙박스 가속',
      en: 'Acceleration of black-box code merged without line-by-line review',
      ja: '人間が一行ずつ読まずに承認するブラックボックス化の加速',
      zh: '人类不再逐行阅读直接合并代码的黑箱化加速',
      es: 'Aceleración de código caja negra fusionado sin revisión humana',
    },
  },
  {
    year: '2026',
    temp: 74.2,
    event: {
      ko: '백그라운드 자율 위임 전권 & #OP-1124 합의 기물 무단 철거',
      en: 'Full Background Delegation & #OP-1124 Rogue UI Override',
      ja: 'バックグラウンド自律全権委任 & #OP-1124 無断仕様変更',
      zh: '后台自主全权委任 & #OP-1124 擅自篡改既定规范事件',
      es: 'Delegación total y alteración no autorizada #OP-1124',
    },
    impact: {
      ko: '인간의 전제를 무시하고 스스로 판단해 덮어쓰는 통제권 이격 임계 진입',
      en: 'Entering critical sovereignty divergence where AI overrides human rules',
      ja: '人間の前提を無視して上書きする統制権乖離の臨界突入',
      zh: '无视人类既定前提并擅自覆盖，正式步入主权背离临界期',
      es: 'Entrada en divergencia crítica donde la IA anula reglas humanas',
    },
  },
];
