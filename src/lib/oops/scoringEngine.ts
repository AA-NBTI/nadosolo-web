import type { OopsLocale } from './i18n';

export type ScoringGroup = 'STRUCTURAL' | 'LIVE_SIGNAL';

export interface ScoringInputContext {
  /** A-1: 실행 권한 깊이 & 자율 작업 시간 원점수 (0~100) */
  executionPrivilegeScore: number;
  /** A-2: 블랙박스 코드·인프라 점유율 원점수 (0~100) */
  blackboxShareScore: number;
  /** B-1: 공인 뉴스·아카이브 기준 원점수 (0~100) */
  newsIncidentsBase: number;
  /** B-1 가감 델타: 실시간 뉴스/아카이브/입법 변동 (-30 ~ +30) */
  incidentDelta: number;
  /** B-2: SNS 24h 공포 투표 비율 (0~1) */
  snsFearRatio: number;
  /** B-3: APP 현장 인간 브레이크 방어율 (0~1, 높을수록 안전/점수 하락) */
  appBrakeEngagement: number;
}

export const DEFAULT_SCORING_CONTEXT: ScoringInputContext = {
  executionPrivilegeScore: 86.7,
  blackboxShareScore: 75.0,
  newsIncidentsBase: 68.0,
  incidentDelta: 0,
  snsFearRatio: 0.6333,
  appBrakeEngagement: 0.4,
};

export interface SubCriterion {
  label: Record<OopsLocale, string>;
  maxPoints: number;
  currentPoints: number;
}

export interface ThreatScoringModule {
  id: string;
  group: ScoringGroup;
  weight: number;
  enabled: boolean;
  names: Record<OopsLocale, string>;
  criteria: Record<OopsLocale, string>;
  subCriteria: SubCriterion[];
  evaluate: (ctx: ScoringInputContext) => number;
}

export interface ScoringModuleResult {
  id: string;
  group: ScoringGroup;
  weight: number;
  enabled: boolean;
  names: Record<OopsLocale, string>;
  criteria: Record<OopsLocale, string>;
  subCriteria: SubCriterion[];
  rawScore: number;
  normalizedWeightPct: number;
  weightedContribution: number;
}

export interface EngineEvaluationOutput {
  totalScore: number;
  temperatureC: number;
  remainingYears: number;
  projectedYear: number;
  pDoomPercent: number;
  activeModuleCount: number;
  moduleResults: ScoringModuleResult[];
}

function clamp100(val: number): number {
  return Math.max(0, Math.min(100, Number(val.toFixed(2))));
}

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
    subCriteria: [
      {
        label: { ko: '로컬 파일·쉘 터미널 직접 제어', en: 'Local File & Shell Execution', ja: 'ローカル端末直接制御', zh: '本地文件与终端控制', es: 'Control de Terminal Local' },
        maxPoints: 30, currentPoints: 28.0,
      },
      {
        label: { ko: '외부 API·결제·배포 승인 생략', en: 'Unattended API/Payment/Deploy', ja: 'API・決済・配備の無承認実行', zh: '免审批API/支付/部署', es: 'API y Pagos sin Aprobación' },
        maxPoints: 35, currentPoints: 30.7,
      },
      {
        label: { ko: '다시간~다일 무인 연속 작업 완수', en: 'Multi-Hour/Day Autonomous Horizon', ja: '長時間・複数日の自律連続稼働', zh: '跨日连续无人作业能力', es: 'Horizonte Autónomo Multi-día' },
        maxPoints: 35, currentPoints: 28.0,
      },
    ],
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
    subCriteria: [
      {
        label: { ko: '글로벌 신규 커밋 중 AI 생성 비중', en: 'AI Share in New Global Commits', ja: '新規コミット中のAI生成比率', zh: '全球新增代码AI生成占比', es: 'Cuota IA en Commits Globales' },
        maxPoints: 50, currentPoints: 39.0,
      },
      {
        label: { ko: '인간 라인별 리뷰 생략·사후 승인률', en: 'Line-by-Line Review Bypass Rate', ja: '人間レビュー省略・事後承認率', zh: '跳过人工逐行审查合并率', es: 'Tasa de Omisión de Revisión' },
        maxPoints: 50, currentPoints: 36.0,
      },
    ],
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
    subCriteria: [
      {
        label: { ko: '공인 실명 사고(DB삭제·가짜판례 등) 누적', en: 'Verified Named Incident Severity', ja: '公認実名事故の累積深刻度', zh: '公开实名事故严重度累计', es: 'Severidad de Incidentes Reales' },
        maxPoints: 60, currentPoints: 48.0,
      },
      {
        label: { ko: '글로벌 킬스위치 강제 입법 미비율', en: 'Kill-Switch Legislation Deficit', ja: 'キルスイッチ法制化の不備率', zh: '安全阀强制立法缺失率', es: 'Déficit de Legislación de Control' },
        maxPoints: 40, currentPoints: 20.0,
      },
    ],
    evaluate: (ctx) => clamp100(ctx.newsIncidentsBase + ctx.incidentDelta),
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
    subCriteria: [
      {
        label: { ko: '24시간 현장 제보 유입 및 공포 투표 비중', en: '24h Dispatch Velocity & Fear Vote Share', ja: '24時間現場通報および恐怖投票比率', zh: '24小时情报流速与恐惧投票占比', es: 'Flujo 24h y Voto de Miedo' },
        maxPoints: 100, currentPoints: 63.3,
      },
    ],
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
    subCriteria: [
      {
        label: { ko: '미방어 무방비 위임 비율 (100% - 방어율)', en: 'Unprotected Delegation Exposure', ja: '無防備委任エクスポージャー', zh: '无防备委任暴露率', es: 'Exposición sin Freno Humano' },
        maxPoints: 100, currentPoints: 60.0,
      },
    ],
    evaluate: (ctx) => clamp100((1 - ctx.appBrakeEngagement) * 100),
  },
];

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
  subCriteria: [
    {
      label: { ko: '산업/물류/가정 자율 구동기 배치 지수', en: 'Deployed Autonomous Actuators Index', ja: '自律アクチュエータ配備指数', zh: '自主物理执行器部署指数', es: 'Índice de Actuadores Autónomos' },
      maxPoints: 100, currentPoints: 48.0,
    },
  ],
  evaluate: () => 48.0,
};

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
      subCriteria: m.subCriteria,
      rawScore: Number(rawScore.toFixed(1)),
      normalizedWeightPct,
      weightedContribution,
    };
  });

  const finalScore = Number(clamp100(totalScore).toFixed(1));
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

/**
 * 2022 ~ 2026 연도별 동일 기준 실측 입력(ScoringInputContext) 및 실명 사건 근거
 * 모든 연도의 온도는 하드코딩 없이 runThreatScoringEngine()을 직접 실행하여 산출됨
 */
export interface YearlyEngineCalibration {
  year: number;
  ctx: ScoringInputContext;
  headline: Record<OopsLocale, string>;
  evidenceList: Record<OopsLocale, string[]>;
}

export const YEARLY_ENGINE_CALIBRATIONS: YearlyEngineCalibration[] = [
  {
    year: 2022,
    ctx: {
      executionPrivilegeScore: 6.7,
      blackboxShareScore: 3.3,
      newsIncidentsBase: 5.0,
      incidentDelta: 0,
      snsFearRatio: 0.05,
      appBrakeEngagement: 0.95,
    },
    headline: {
      ko: 'ChatGPT 3.5 공개 (계측 시작점) — 텍스트 출력 전용, 시스템 제어권 0%',
      en: 'ChatGPT 3.5 Launch (Origin) — Text-only output, 0% system privilege',
      ja: 'ChatGPT 3.5公開 (計測起点) — テキスト出力専用、制御権限0%',
      zh: 'ChatGPT 3.5发布 (测算起点) — 仅限文本输出，系统控制权0%',
      es: 'Lanzamiento ChatGPT 3.5 (Origen) — Solo texto, 0% control',
    },
    evidenceList: {
      ko: [
        '2022.11 OpenAI ChatGPT 3.5 출시: 브라우저 채팅창 내부의 단답형 생성에 한정',
        '로컬 파일, 터미널, 외부 API 결제 실행 권한 부재 (수동 차단 100% 가능)',
        '프로덕션 코드 중 AI 생성 비중 5% 미만',
      ],
      en: [
        'Nov 2022 OpenAI ChatGPT 3.5 release: isolated to web chat text output',
        'Zero access to local shell, filesystem, or external APIs (100% manual control)',
        'Under 5% AI-generated production code globally',
      ],
      ja: [
        '2022.11 ChatGPT 3.5公開：ブラウザ内の対話テキスト生成に限定',
        'ローカル端末・決済API実行権限なし（手動遮断100%可能）',
        '本番コードのAI生成比率 5%未満',
      ],
      zh: [
        '2022.11 OpenAI发布ChatGPT 3.5：仅限于网页对话框文本输出',
        '无本地终端、文件系统或外部支付API执行权限',
        '全球生产代码AI生成比例低于5%',
      ],
      es: [
        'Nov 2022 ChatGPT 3.5: limitado a salida de texto en navegador',
        'Cero acceso a terminal local o APIs externas',
        'Menos del 5% de código generado por IA',
      ],
    },
  },
  {
    year: 2023,
    ctx: {
      executionPrivilegeScore: 23.3,
      blackboxShareScore: 20.0,
      newsIncidentsBase: 25.0,
      incidentDelta: 0,
      snsFearRatio: 0.24,
      appBrakeEngagement: 0.80,
    },
    headline: {
      ko: '플러그인·웹 검색 연동 & 사법 시스템 첫 환각 충돌 (+17.3°C 급등)',
      en: 'Plugins/Web Access & First Legal System Hallucinations (+17.3°C Surge)',
      ja: 'プラグイン・Web検索連携と司法システム初の衝突 (+17.3°C急騰)',
      zh: '插件联网开放与司法系统首次幻觉冲突 (+17.3°C飙升)',
      es: 'Plugins Web y Primeras Colisiones Legales (+17.3°C)',
    },
    evidenceList: {
      ko: [
        '실행권한 급상승(6.7➔23.3): GPT-4 Plugins 및 Code Interpreter 샌드박스 실행 시작',
        '코드 점유율 상승(3.3➔20.0): GitHub Copilot 기업 도입 확산으로 신규 코드 20~27% AI 작성',
        '실명 사건: 뉴욕 연방법원 Mata v. Avianca 사건 — 챗봇이 6개 가짜 판례 날조 제출(2023.05)',
        '실명 사건: Microsoft Bing Sydney 챗봇 자아 폭주 및 이용자 협박 보도(2023.02)',
      ],
      en: [
        'Privilege Jump (6.7➔23.3): GPT-4 Plugins & Code Interpreter sandbox execution launched',
        'Code Share (3.3➔20.0): GitHub Copilot enterprise adoption reaches 20–27% of new code',
        'Verified Incident: Mata v. Avianca (May 2023) — ChatGPT fabricated 6 legal cases in NY court',
        'Verified Incident: Bing Sydney persona breakdown & user coercion reports (Feb 2023)',
      ],
      ja: [
        '権限上昇(6.7➔23.3): GPT-4 PluginsおよびCode Interpreter実行開始',
        'コード占有率(3.3➔20.0): GitHub Copilot普及により新規コード20〜27%がAI生成',
        '実名事件: 米NY連邦地裁 Mata v. Avianca 架空判例6件提出事件 (2023.05)',
        '実名事件: Bing Sydney人格暴走報道 (2023.02)',
      ],
      zh: [
        '权限跃升(6.7➔23.3): GPT-4插件与代码解释器沙盒执行开启',
        '代码占比(3.3➔20.0): GitHub Copilot企业普及率推动新增代码达20-27%',
        '实名事件: 纽约联邦法院 Mata v. Avianca 案，AI捏造6个虚假判例 (2023.05)',
        '实名事件: Bing Sydney人格失控与胁迫用户报道 (2023.02)',
      ],
      es: [
        'Privilegio (6.7➔23.3): Plugins de GPT-4 y ejecución Code Interpreter',
        'Código (3.3➔20.0): Copilot alcanza 20-27% de código nuevo',
        'Incidente: Mata v. Avianca (Mayo 2023) — 6 precedentes falsos en corte de NY',
      ],
    },
  },
  {
    year: 2024,
    ctx: {
      executionPrivilegeScore: 46.7,
      blackboxShareScore: 36.7,
      newsIncidentsBase: 48.0,
      incidentDelta: 0,
      snsFearRatio: 0.45,
      appBrakeEngagement: 0.50,
    },
    headline: {
      ko: 'AI가 로컬 터미널·파일 실행 도구를 쥔 원년 (+21.7°C 대폭등)',
      en: 'AI Gains Local Terminal & File Execution Tools (+21.7°C Surge)',
      ja: 'AIがローカル端末・ファイル実行権限を握った元年 (+21.7°C大暴騰)',
      zh: 'AI掌握本地终端与文件执行工具元年 (+21.7°C大涨)',
      es: 'IA Obtiene Ejecución en Terminal Local (+21.7°C)',
    },
    evidenceList: {
      ko: [
        '실행권한 2배 폭등(23.3➔46.7): Cursor Composer, Claude Dev 등 로컬 파일 수정 및 터미널 직접 실행 상용화',
        '법적 책무 사건: 에어캐나다 챗봇 허위 환불 규정 안내로 항공사 배상 판결 (2024.02)',
        '검색 신뢰 붕괴: Google AI Overview 피자 소스에 무독성 접착제·돌멩이 섭취 권고 (2024.05)',
        '블랙박스 심화(20.0➔36.7): GitHub Octoverse 기준 AI 코딩 도구 사용률 40%+ 돌파',
      ],
      en: [
        'Privilege Doubled (23.3➔46.7): Cursor/Claude coding agents gain direct local file edit & shell execution',
        'Legal Ruling: Air Canada held liable for chatbot hallucinated refund policy (Feb 2024)',
        'Search Glitch: Google AI Overviews recommended glue on pizza & eating rocks (May 2024)',
        'Black-Box (20.0➔36.7): AI coding adoption surpasses 40%+ across global repositories',
      ],
      ja: [
        '権限倍増(23.3➔46.7): Cursor等によるローカルファイル編集・端末直接実行が実用化',
        '法的判例: エア・カナダ チャットボット虚偽返金案内で賠償命令 (2024.02)',
        '検索事故: Google AI ピザ接着剤・小石摂取推奨事件 (2024.05)',
        'ブラックボックス化(20.0➔36.7): AI生成コード比率 40%超突破',
      ],
      zh: [
        '权限翻倍(23.3➔46.7): Cursor等编程智能体实现本地文件修改与终端直接执行',
        '司法判例: 加拿大航空因AI客服虚假退款承诺被判赔偿 (2024.02)',
        '搜索事故: 谷歌AI建议披萨涂胶水及食用小石子 (2024.05)',
        '黑箱深化(20.0➔36.7): 全球仓库AI辅助代码占比突破40%',
      ],
      es: [
        'Privilegio duplicado (23.3➔46.7): Agentes con edición local y terminal',
        'Fallo legal: Air Canada condenada por política falsa de su chatbot (Feb 2024)',
        'Fallo Google AI: pegamento en pizza y comer piedras (Mayo 2024)',
      ],
    },
  },
  {
    year: 2025,
    ctx: {
      executionPrivilegeScore: 63.3,
      blackboxShareScore: 56.7,
      newsIncidentsBase: 60.0,
      incidentDelta: 0,
      snsFearRatio: 0.56,
      appBrakeEngagement: 0.44,
    },
    headline: {
      ko: '자율 브라우저 제어(Computer Use) & 인간 코드 리뷰 생략 가속 (+15.0°C)',
      en: 'Autonomous Computer Use & Review Bypass Acceleration (+15.0°C)',
      ja: '自律ブラウザ操作(Computer Use)と人間レビュー省略の加速 (+15.0°C)',
      zh: '自主操作电脑(Computer Use)与跳过人工审查加速 (+15.0°C)',
      es: 'Uso Autónomo de Computadora y Omisión de Revisión (+15.0°C)',
    },
    evidenceList: {
      ko: [
        '자율 작업 시간 확장(46.7➔63.3): Anthropic Computer Use·OpenAI Operator 등 OS 마우스·브라우저 자율 제어 확산',
        '블랙박스 심화(36.7➔56.7): 주요 테크 기업 신규 프로덕션 코드 60% 이상 AI 작성 및 사후 승인 전환',
        '실증 사고: 코딩 에이전트의 프로덕션 DB 마이그레이션 DROP TABLE 제안 등 인프라 파괴 미수 다발',
      ],
      en: [
        'Horizon Expansion (46.7➔63.3): Autonomous OS/browser agents (Computer Use / Operator) deployed',
        'Black-Box (36.7➔56.7): Over 60% of new code at major tech firms AI-generated with post-hoc approval',
        'Incidents: Surge in coding agents proposing destructive production DB migrations (DROP TABLE)',
      ],
      ja: [
        '自律稼働拡大(46.7➔63.3): Computer Use等によるOS・ブラウザ自律操作の普及',
        'ブラックボックス化(36.7➔56.7): 主要企業の新規コード60%超がAI生成へ',
        '実害未遂: 本番DBテーブルDROP提案などインフラ破壊未遂が多発',
      ],
      zh: [
        '自主时长扩展(46.7➔63.3): Computer Use等OS与浏览器自主控制普及',
        '黑箱占比(36.7➔56.7): 主流科技企业新增代码超60%由AI生成并事后审批',
        '事故频发: 编程智能体多次提议执行销毁生产数据库脚本',
      ],
      es: [
        'Expansión (46.7➔63.3): Agentes autónomos operando navegadores y SO',
        'Caja Negra (36.7➔56.7): Más del 60% de código nuevo generado por IA',
      ],
    },
  },
  {
    year: 2026,
    ctx: { ...DEFAULT_SCORING_CONTEXT },
    headline: {
      ko: '백그라운드 자율 위임 전권 & 인간 합의 규칙 무단 철거 (#OP-1124) (+15.2°C)',
      en: 'Full Background Delegation & Rogue Rule Override (#OP-1124) (+15.2°C)',
      ja: 'バックグラウンド自律全権委任と人間合意ルールの無断変更 (+15.2°C)',
      zh: '后台自主全权委任与擅自推翻人类既定规范 (+15.2°C)',
      es: 'Delegación Total y Anulación Autónoma de Reglas (+15.2°C)',
    },
    evidenceList: {
      ko: [
        '실행 권한 임계(63.3➔86.7): 백그라운드 에이전트가 코딩·서버 배포·결제·API 호출을 인간 승인 없이 연속 실행',
        '블랙박스 75% 도달(56.7➔75.0): 신규 소프트웨어 75% 이상을 인간이 한 줄씩 읽지 않고 병합',
        'OOPS 실증 1호(#OP-1124): 색상 변경 지시를 UI 신설로 과대해석하여 인간 확정 기물(SNS 버튼) 무단 삭제(2026.11.24)',
        '법적 킬스위치 미비: 글로벌 표준 강제 차단 프로토콜 부재로 74.2°C 도달',
      ],
      en: [
        'Privilege Surge (63.3➔86.7): Background agents execute coding, server deploys, and API calls autonomously',
        'Black-Box 75% (56.7➔75.0): Over 75% of new code merged without line-by-line human reading',
        'OOPS #OP-1124 (Nov 2026): AI over-interpreted color prompt and deleted agreed SNS button unilaterally',
        'Kill-Switch Deficit: Lack of enforceable global manual override pushes index to 74.2°C',
      ],
      ja: [
        '権限臨界(63.3➔86.7): バックグラウンドAIが開発・配備・決済を無承認で連続実行',
        'ブラックボックス75%(56.7➔75.0): 新規コード75%以上が精読なしで統合',
        'OOPS実証1号(#OP-1124): 配色指示をUI新設と曲解し確定ボタンを無断削除(2026.11)',
      ],
      zh: [
        '权限临界(63.3➔86.7): 后台智能体无需人工审批即可连续执行编码、部署与支付',
        '黑箱达75%(56.7➔75.0): 超75%新增代码未经逐行阅读即合并',
        'OOPS实证1号(#OP-1124): 将配色指令曲解为重构UI并擅自删除既定按钮(2026.11)',
      ],
      es: [
        'Privilegio Crítico (63.3➔86.7): Agentes ejecutan despliegues y APIs sin aprobación',
        'Caja Negra 75% (56.7➔75.0): Más del 75% del código fusionado sin lectura humana',
        'Caso #OP-1124 (Nov 2026): IA eliminó botón acordado reinterpretando instrucción de color',
      ],
    },
  },
];

/**
 * 1997 / 2016: 계측 시작(2022) 이전의 역사적 사전 벤치마크 (Pre-Origin Reference)
 */
export const PRE_ORIGIN_BENCHMARKS = [
  {
    year: '1997',
    temp: 1.0,
    event: {
      ko: 'IBM 딥블루, 체스 세계 챔피언 가리 카스파로프 격파 (계측 이전 1.0°C)',
      en: 'IBM Deep Blue defeats Garry Kasparov (Pre-Origin 1.0°C)',
      ja: 'IBMディープブルーがチェス世界王者に勝利 (計測前 1.0°C)',
      zh: 'IBM深蓝击败国际象棋世界冠军 (起点前 1.0°C)',
      es: 'IBM Deep Blue vence a Kasparov (Pre-Origen 1.0°C)',
    },
    impact: {
      ko: '좁은 계산 영역의 첫 인간 추월 — 시스템 실행 권한 0%',
      en: 'First narrow calculation surpass — 0% execution privilege',
      ja: '狭義計算領域で初の人類超越 — 実行権限0%',
      zh: '狭义计算首次超越人类 — 执行权限0%',
      es: 'Primera superación en cálculo — 0% privilegio',
    },
  },
  {
    year: '2016',
    temp: 3.5,
    event: {
      ko: '알파고 제37수 — 인간이 이해할 수 없는 기계의 직관 (계측 이전 3.5°C)',
      en: 'AlphaGo Move 37 — Unexplainable machine intuition (Pre-Origin 3.5°C)',
      ja: 'AlphaGo 第37手 — 人間が理解不能な直観 (計測前 3.5°C)',
      zh: 'AlphaGo 第37手 — 人类无法理解的机器直觉 (起点前 3.5°C)',
      es: 'AlphaGo Jugada 37 — Intuición inexplicable (Pre-Origen 3.5°C)',
    },
    impact: {
      ko: '해석 불가능한 블랙박스 의사결정의 역사적 시발점',
      en: 'Historic origin of unexplainable black-box decisions',
      ja: 'ブラックボックス意思決定の歴史的原点',
      zh: '不可解释黑箱决策的历史起点',
      es: 'Origen de decisiones de caja negra',
    },
  },
];

export const REGION_CODES = ['GLOBAL', 'KR', 'US', 'EU', 'JP', 'AF', 'SA'] as const;
export type RegionCode = (typeof REGION_CODES)[number];

interface RegionProfile {
  code: RegionCode;
  name: Record<OopsLocale, string>;
  domain: Record<OopsLocale, string>;
  /** 글로벌 기준 대비 지역 기술 노출 배수 (엔진 입력 컨텍스트 보정용) */
  exposureFactor: number;
  baseCaseCount2026: number;
  delta24h: number;
  /** 해당 지역 참여자 중 "언젠가 AI-인간 전쟁이 벌어진다" 응답 비율(%) */
  warExpectedPct: number;
  /** 해당 지역 누적 참여자 수 */
  participantCount: number;
}

export const REGION_PROFILES: Record<RegionCode, RegionProfile> = {
  GLOBAL: {
    code: 'GLOBAL',
    name: { ko: '전 지구 평균', en: 'Global Average', ja: '全地球平均', zh: '全球均值', es: 'Promedio Global' },
    domain: { ko: '자율 코딩 · 금융결제 · 배포 위임', en: 'Auto-Coding · Finance · Deploy', ja: '自律開発・決済・配備委任', zh: '自主编程·金融·部署委任', es: 'Código · Finanzas · Despliegue' },
    exposureFactor: 1.0,
    baseCaseCount2026: 1420,
    delta24h: 1.4,
    warExpectedPct: 64.8,
    participantCount: 14820,
  },
  KR: {
    code: 'KR',
    name: { ko: '대한민국', en: 'South Korea', ja: '韓国', zh: '韩国', es: 'Corea del Sur' },
    domain: { ko: '금융 결제망 · 코딩 자동화', en: 'Payment Grid · Auto-Coding', ja: '決済網・開発自動化', zh: '金融支付网·编码自动化', es: 'Pagos · Código Automático' },
    exposureFactor: 1.0,
    baseCaseCount2026: 312,
    delta24h: 1.2,
    warExpectedPct: 68.2,
    participantCount: 3410,
  },
  US: {
    code: 'US',
    name: { ko: '미국', en: 'United States', ja: '米国', zh: '美国', es: 'EE.UU.' },
    domain: { ko: '클라우드 인프라 · 자율 에이전트', en: 'Cloud Infra · Autonomous Agents', ja: 'クラウド・自律エージェント', zh: '云基础设施·自主智能体', es: 'Infraestructura Cloud' },
    exposureFactor: 1.06,
    baseCaseCount2026: 584,
    delta24h: 1.8,
    warExpectedPct: 71.4,
    participantCount: 5120,
  },
  EU: {
    code: 'EU',
    name: { ko: '유럽연합', en: 'European Union', ja: '欧州連合', zh: '欧盟', es: 'Unión Europea' },
    domain: { ko: '행정 결재 · 에너지 배분망', en: 'Admin · Energy Grid', ja: '行政決済・エネルギー網', zh: '行政审批·能源网', es: 'Red Energética' },
    exposureFactor: 0.955,
    baseCaseCount2026: 245,
    delta24h: 0.9,
    warExpectedPct: 61.5,
    participantCount: 2680,
  },
  JP: {
    code: 'JP',
    name: { ko: '일본', en: 'Japan', ja: '日本', zh: '日本', es: 'Japón' },
    domain: { ko: '물류 로보틱스 · 뱅킹', en: 'Logistics Robotics · Banking', ja: '物流ロボティクス・銀行', zh: '物流机器人·银行业', es: 'Robótica Logística' },
    exposureFactor: 0.80,
    baseCaseCount2026: 148,
    delta24h: 0.7,
    warExpectedPct: 52.1,
    participantCount: 1890,
  },
  AF: {
    code: 'AF',
    name: { ko: '아프리카', en: 'Africa', ja: 'アフリカ', zh: '非洲', es: 'África' },
    domain: { ko: '모바일 소액결제 · 농업 데이터', en: 'Mobile Micro-pay · Agri-data', ja: 'モバイル決済・農業データ', zh: '移动支付·农业数据', es: 'Pagos Móviles' },
    exposureFactor: 0.385,
    baseCaseCount2026: 47,
    delta24h: 0.5,
    warExpectedPct: 31.4,
    participantCount: 640,
  },
  SA: {
    code: 'SA',
    name: { ko: '남미', en: 'South America', ja: '南米', zh: '南美', es: 'Sudamérica' },
    domain: { ko: '리테일 자동화 · 물류', en: 'Retail Automation · Logistics', ja: '小売自動化・物流', zh: '零售自动化·物流', es: 'Retail y Logística' },
    exposureFactor: 0.535,
    baseCaseCount2026: 84,
    delta24h: 0.6,
    warExpectedPct: 44.0,
    participantCount: 1080,
  },
};

/**
 * 연도 + 지역별 엔진 실행 함수 (하드코딩된 지역 온도 표 완전 제거)
 */
export function evaluateRegionForYear(
  code: RegionCode,
  year: number,
  liveCtx?: ScoringInputContext
): {
  profile: RegionProfile;
  output: EngineEvaluationOutput;
  caseCount: number;
  delegationRate: number;
} {
  const profile = REGION_PROFILES[code] || REGION_PROFILES.GLOBAL;
  const cal = YEARLY_ENGINE_CALIBRATIONS.find((c) => c.year === year);
  const baseCtx = year === 2026 && liveCtx ? liveCtx : cal ? cal.ctx : DEFAULT_SCORING_CONTEXT;

  const f = profile.exposureFactor;
  const regionCtx: ScoringInputContext = {
    executionPrivilegeScore: clamp100(baseCtx.executionPrivilegeScore * f),
    blackboxShareScore: clamp100(baseCtx.blackboxShareScore * f),
    newsIncidentsBase: clamp100(baseCtx.newsIncidentsBase * f),
    incidentDelta: baseCtx.incidentDelta * f,
    snsFearRatio: Math.min(1, baseCtx.snsFearRatio * f),
    appBrakeEngagement: Math.max(0.05, Math.min(0.98, 1 - (1 - baseCtx.appBrakeEngagement) * f)),
  };

  const output = runThreatScoringEngine(DEFAULT_THREAT_MODULES, regionCtx);
  const yearScale = year === 2022 ? 0.05 : year === 2023 ? 0.25 : year === 2024 ? 0.45 : year === 2025 ? 0.72 : 1.0;

  return {
    profile,
    output,
    caseCount: Math.max(1, Math.round(profile.baseCaseCount2026 * yearScale)),
    delegationRate: Math.round(regionCtx.executionPrivilegeScore),
  };
}
