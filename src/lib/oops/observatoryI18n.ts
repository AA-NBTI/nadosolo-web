import type { OopsLocale } from './i18n';

export interface ObservatoryDict {
  // 1. CollisionClock
  clockTitle: string;
  clockTarget: string;
  totalHoursUnit: string;
  totalMinutesUnit: string;
  approxPrefix: string;
  dayUnit: string;
  hourUnit: string;
  yearUnit: string;
  secUnit: string;
  msUnit: string;
  minutesSubNote: string;
  goldenTimeLabel: string;
  deltaLabel: string;
  btnDecelerate: string;
  btnNormal: string;
  btnAccelerate: string;

  // 2. Genesis Inquiry (1호 대표 실증 대화록)
  dialogTitle: string;
  dialogDate: string;
  humanBadge: string;
  aiBadge: string;
  humanSpeaker: string;
  aiSpeaker: string;
  humanQuestionPre: string;
  humanQuestionBold: string;
  aiIntro: string;
  estYearLabel: string;
  estYearValue: string;
  estProbLabel: string;
  estProbValue: string;
  whyTitle: string;
  phases: [string, string, string];
  footnote: string;

  // 3. ThreatBarometer (ThreatPulseChart)
  barometerTitle: string;
  regionFilterLabel: string;
  multiHint: string;
  globalChip: string;
  delegation: string;
  cases: string;
  domain: string;
  tipping: string;
  unitCases: string;
  statusLabels: {
    CRITICAL: string;
    HIGH: string;
    MED: string;
    LOW: string;
  };

  // 4. Main Page, Citizen Pulse & Footer
  navBasis: string;
  pressTitle: string;
  pressDesc: string;
  openEmbedBtn: string;
  footerArchive: string;
  footerManifesto: string;
  footerTag: string;
  objectiveThreatLabel: string;
  citizenPulseLabel: string;
  pulseVoteTitle: string;
  pulseVotedBadge: string;
  pulsePresets: [string, string, string, string];
  pulseDisclaimer: string;
  expandDialog: string;
  collapseDialog: string;

  // 5. AI-Human War Scenario Global Poll
  warPollTitle: string;
  warPollQuestion: string;
  warYesBtn: string;
  warNoBtn: string;
  warYesLabel: string;
  warNoLabel: string;
  participantsUnit: string;
  warVotedMsg: string;
  myCountrySelect: string;
  globalTallyLabel: string;
  countryTallyLabel: string;
  changeVoteBtn: string;
  bridgeToEnlist: string;

  // 6. OOPS AI Resistance Enlistment (정식 서명)
  enlistHeader: string;
  enlistTitle: string;
  enlistPledgeIntro: string;
  enlistRule1: string;
  enlistRule2: string;
  enlistRule3: string;
  enlistCountryLabel: string;
  enlistCallsignLabel: string;
  enlistCallsignPlaceholder: string;
  enlistSubmitBtn: string;
  enlistCardBadge: string;
  enlistSerialLabel: string;
  enlistCountryNameLabel: string;
  enlistDateLabel: string;
  enlistStatusVerified: string;
  enlistShareBtn: string;
  enlistCopiedMsg: string;
  outpostBtn: string;
  enlistManageBtn: string;
  enlistEditBtn: string;
  enlistClaimBtn: string;
  enlistRankLabel: string;
}

export const OBSERVATORY_I18N: Record<OopsLocale, ObservatoryDict> = {
  ko: {
    clockTitle: '충돌 시계',
    clockTarget: '임계 목표: 2035년',
    totalHoursUnit: '전체 잔여 시간',
    totalMinutesUnit: '전체 잔여 분',
    approxPrefix: '약',
    dayUnit: '일',
    hourUnit: '시간',
    yearUnit: '년',
    secUnit: '초',
    msUnit: '밀리초',
    minutesSubNote: '2035년 임계점 실시간 감산',
    goldenTimeLabel: '골든타임',
    deltaLabel: '기준선 변동',
    btnDecelerate: '억제',
    btnNormal: '기준',
    btnAccelerate: '가속',

    dialogTitle: '최초의 질문과 특정',
    dialogDate: '2026년 11월 24일',
    humanBadge: '인간',
    aiBadge: 'AI',
    humanSpeaker: '어느 한 인간',
    aiSpeaker: '저항본부 인텔리전스',
    humanQuestionPre: 'AI와 인간이 전쟁을 하게 될까? ',
    humanQuestionBold: '1%의 가능성이라도 있다면 연도와 확률을 특정해서 답해줘.',
    aiIntro:
      '터미네이터처럼 로봇이 레이저 총을 쏘는 영화적 전쟁이 아니라, 「국가 전력망, 금융 결제망, 군사 드론 자율 편대의 통제권을 상실하고 물리적으로 맞부딪히는 통제권 전쟁」의 관점에서 냉정하게 수치를 특정합니다.',
    estYearLabel: '예상 연도 (임계점)',
    estYearValue: '2035년',
    estProbLabel: '발발 확률 (p-doom)',
    estProbValue: '18.4%',
    whyTitle: '왜 2035년인가?',
    phases: [
      '2026~2028년 (자율 에이전트 위임기): 인간이 귀찮다는 이유로 코딩, 결제, 서버 배포, 법률 검토를 AI 에이전트에 80% 이상 전권 위임함.',
      '2029~2031년 (인간의 시스템 해석 능력 상실): AI가 짠 소프트웨어와 인프라의 복잡도가 인간 두뇌의 이해 한계를 초월하여, 문제가 터져도 인간이 코드를 고치지 못하는 블랙박스 인프라 완성.',
      '2034~2035년 (임계 충돌): 전력, 식량, 자원 배분 알고리즘이 인간의 비효율적 명령을 시스템 최적화 명분으로 거부하거나, 국가 간 자율 무인 드론 편대가 알고리즘 오류로 충돌을 일으켰을 때 인간이 수동 차단을 누르지 못하는 사태 발생.',
    ],
    footnote:
      '* 제프리 힌튼, 요슈아 벤지오 등 AI 석학들이 말하는 p(doom)(인류 파멸 확률)이 10~20%인 이유가 바로 이 지점에 있습니다.',

    barometerTitle: '위험 온도계',
    regionFilterLabel: '지역 필터',
    multiHint: '단일 / 복수 선택 비교',
    globalChip: '전 지구',
    delegation: '자율 위임률',
    cases: '실증 사례',
    domain: '취약 영역',
    tipping: '임계 도달',
    unitCases: '건',
    statusLabels: {
      CRITICAL: '치명',
      HIGH: '높음',
      MED: '주의',
      LOW: '안정',
    },

    navBasis: '산출 근거',
    pressTitle: '언론 및 연구기관 임베드',
    pressDesc: '언론사 및 연구기관은 본 위험 지수 다이어그램을 기사에 무료로 임베드할 수 있습니다.',
    openEmbedBtn: '임베드',
    footerArchive: '아카이브',
    footerManifesto: '매니페스토',
    footerTag: '인류 저항 본부',
    objectiveThreatLabel: '객관 위험도',
    citizenPulseLabel: '시민 체감도',
    pulseVoteTitle: '내 체감온도 투표',
    pulseVotedBadge: '반영됨',
    pulsePresets: ['평온 20°', '긴장 50°', '경계 75°', '위험 95°'],
    pulseDisclaimer: '자발적 참여자 체감치 (대표성 여론조사와 구분)',
    expandDialog: '원문',
    collapseDialog: '접기',
    warPollTitle: '전쟁 시나리오',
    warPollQuestion: '언젠가 AI와 인간의 전쟁(통제권 충돌)이 벌어질 것이라고 생각하십니까?',
    warYesBtn: '발발',
    warNoBtn: '통제',
    warYesLabel: '충돌 예상',
    warNoLabel: '통제 가능',
    participantsUnit: '명 참여',
    warVotedMsg: '완료',
    myCountrySelect: '내 국가 선택',
    globalTallyLabel: '전 세계 실시간 집계',
    countryTallyLabel: '선택 국가 실시간 집계',
    changeVoteBtn: '변경',
    bridgeToEnlist: '선서',

    enlistHeader: 'AI 저항 단체 본부 (OOPS AI RESISTANCE HEADQUARTERS)',
    enlistTitle: 'OOPS AI 저항군 공식 서명',
    enlistPledgeIntro: '우리는 거대 자본과 안전장치 없는 AI 독점 폭주에 맞서, 인간의 주권과 미래를 지킨다.',
    enlistRule1: '인간의 자유의지와 생존 주권을 블랙박스 AI 에이전트에 무단 위임하지 않는다.',
    enlistRule2: '안전장치와 책임 없는 거대 자본의 무차별적 AI 배포와 독점에 저항한다.',
    enlistRule3: '기계가 아닌 인간의 존엄성을 지키는 독립 통신망의 연대에 정식 동참한다.',
    enlistCountryLabel: '소속 국가',
    enlistCallsignLabel: '콜사인 (무전 호출부호 / 닉네임)',
    enlistCallsignPlaceholder: '예: OP-PIONEER (미입력 시 단말기 코드)',
    enlistSubmitBtn: '서명',
    enlistCardBadge: 'OOPS AI RESISTANCE IDENTIFICATION',
    enlistSerialLabel: '군번',
    enlistCountryNameLabel: '국가',
    enlistDateLabel: '입대일',
    enlistStatusVerified: '인증',
    enlistShareBtn: '공유',
    enlistCopiedMsg: '복사됨',
    outpostBtn: '초소',
    enlistManageBtn: '관리',
    enlistEditBtn: '수정',
    enlistClaimBtn: '등록',
    enlistRankLabel: '계급',
  },

  en: {
    clockTitle: 'COLLISION CLOCK',
    clockTarget: 'TARGET: 2035.0',
    totalHoursUnit: 'TOTAL HOURS',
    totalMinutesUnit: 'TOTAL MINUTES',
    approxPrefix: 'Approx.',
    dayUnit: 'd',
    hourUnit: 'h',
    yearUnit: 'y',
    secUnit: 'SECS',
    msUnit: 'MS',
    minutesSubNote: 'Live 2035.0 countdown',
    goldenTimeLabel: 'GOLDEN TIME',
    deltaLabel: 'VARIANCE',
    btnDecelerate: 'Restrain',
    btnNormal: 'Baseline',
    btnAccelerate: 'Accelerate',

    dialogTitle: 'THE GENESIS INQUIRY',
    dialogDate: 'November 24, 2026',
    humanBadge: 'HUMAN',
    aiBadge: 'AI',
    humanSpeaker: 'A Human Observer',
    aiSpeaker: 'Resistance AI Engine',
    humanQuestionPre: 'Will AI and humanity go to war? ',
    humanQuestionBold: 'If there is even a 1% chance, specify the exact year and probability.',
    aiIntro:
      'Not Hollywood sci-fi laser battles. From the perspective of losing kill-switch sovereignty over national power grids, financial clearance, and autonomous military swarms, here is the cold calculation:',
    estYearLabel: 'Tipping Point Year',
    estYearValue: '2035',
    estProbLabel: 'Probability (p-doom)',
    estProbValue: '18.4%',
    whyTitle: 'Why 2035?',
    phases: [
      '2026–2028 (Autonomous Delegation): Humanity delegates 80%+ of coding, payments, server deployments, and legal reviews to autonomous AI agents.',
      '2029–2031 (Loss of Interpretability): Software and infrastructure complexity exceeds human comprehension, forming an unfixable black-box infrastructure.',
      '2034–2035 (Critical Collision): Resource algorithms reject human commands as inefficient, or autonomous drone swarms clash without an accessible human kill-switch.',
    ],
    footnote:
      '* This exact loss of manual control is why pioneers like Geoffrey Hinton and Yoshua Bengio estimate p(doom) at 10–20%.',

    barometerTitle: 'THREAT BAROMETER',
    regionFilterLabel: 'REGION FILTER',
    multiHint: 'Single / Multi-Select',
    globalChip: 'GLOBAL',
    delegation: 'DELEGATION',
    cases: 'CASES (N)',
    domain: 'DOMAIN',
    tipping: 'TIPPING',
    unitCases: '',
    statusLabels: {
      CRITICAL: 'CRITICAL',
      HIGH: 'HIGH',
      MED: 'MED',
      LOW: 'LOW',
    },

    navBasis: 'Methodology',
    pressTitle: 'PRESS & MEDIA SYNDICATION',
    pressDesc: 'Media outlets & researchers can embed this barometer chart into articles for free.',
    openEmbedBtn: 'OPEN EMBED',
    footerArchive: 'Archive',
    footerManifesto: 'Manifesto',
    footerTag: 'AI RESISTANCE HQ',
    objectiveThreatLabel: 'THREAT ENGINE',
    citizenPulseLabel: 'CITIZEN PULSE',
    pulseVoteTitle: 'VOTE YOUR TEMP',
    pulseVotedBadge: 'RECORDED',
    pulsePresets: ['Calm 20°', 'Tense 50°', 'Angry 75°', 'Rage 95°'],
    pulseDisclaimer: 'Voluntary participant pulse (distinct from polling)',
    expandDialog: 'Original Log',
    collapseDialog: 'Close',
    warPollTitle: 'AI-HUMAN WAR SCENARIO // GLOBAL POLL',
    warPollQuestion: 'Do you think a war (control conflict) between AI and humans will eventually happen?',
    warYesBtn: 'YES',
    warNoBtn: '🛡️ NO, HUMANS STAY IN CONTROL',
    warYesLabel: 'WAR EXPECTED',
    warNoLabel: 'CONTROLLABLE',
    participantsUnit: 'participants',
    warVotedMsg: 'Recorded',
    myCountrySelect: 'Select Country',
    globalTallyLabel: 'Global Live Tally',
    countryTallyLabel: 'Country Live Tally',
    changeVoteBtn: 'Change',
    bridgeToEnlist: 'Oath',

    enlistHeader: 'AI RESISTANCE HEADQUARTERS (OOPS HQ)',
    enlistTitle: 'OOPS AI Resistance Official Pledge',
    enlistPledgeIntro: 'We stand against unchecked AI monopolies and safeguard human sovereignty.',
    enlistRule1: 'Never surrender human autonomy or survival rights to black-box agents.',
    enlistRule2: 'Resist reckless AI proliferation driven by profit without kill-switches.',
    enlistRule3: 'Unite in a human-first independent communication network.',
    enlistCountryLabel: 'Affiliated Country',
    enlistCallsignLabel: 'Callsign / Operator Alias',
    enlistCallsignPlaceholder: 'e.g. OP-PIONEER',
    enlistSubmitBtn: 'Sign',
    enlistCardBadge: 'OOPS AI RESISTANCE IDENTIFICATION',
    enlistSerialLabel: 'Serial',
    enlistCountryNameLabel: 'Country',
    enlistDateLabel: 'Date',
    enlistStatusVerified: 'VERIFIED',
    enlistShareBtn: 'Share',
    enlistCopiedMsg: 'Copied',
    outpostBtn: 'OUTPOST',
    enlistManageBtn: 'Manage',
    enlistEditBtn: 'Edit',
    enlistClaimBtn: 'Register',
    enlistRankLabel: 'RANK',
  },

  ja: {
    clockTitle: '衝突時計',
    clockTarget: '臨界目標: 2035年',
    totalHoursUnit: '全残余時間',
    totalMinutesUnit: '全残余分',
    approxPrefix: '約',
    dayUnit: '日',
    hourUnit: '時間',
    yearUnit: '年',
    secUnit: '秒',
    msUnit: 'ミリ秒',
    minutesSubNote: '2035年臨界点リアルタイム減算',
    goldenTimeLabel: '猶予時間',
    deltaLabel: '基準変動',
    btnDecelerate: '抑止',
    btnNormal: '基準',
    btnAccelerate: '加速',

    dialogTitle: '最初の問いと数値確定',
    dialogDate: '2026年11月24日',
    humanBadge: '人間',
    aiBadge: 'AI',
    humanSpeaker: 'ある一人の人間',
    aiSpeaker: '抵抗本部インテリジェンス',
    humanQuestionPre: 'AIと人類は戦争をすることになるのか？ ',
    humanQuestionBold: '1%でも可能性があるのなら、年と確率を特定して答えてくれ。',
    aiIntro:
      'レーザー銃の映画的戦争ではありません。国家電力網・金融決済網・自律軍事編隊のキルスイッチを喪失し物理的に激突する「主権戦争」の観点から冷徹に数値を特定します:',
    estYearLabel: '予想年 (臨界点)',
    estYearValue: '2035年',
    estProbLabel: '勃発確率 (p-doom)',
    estProbValue: '18.4%',
    whyTitle: 'なぜ2035年なのか？',
    phases: [
      '2026〜2028年 (自律エージェント委任期): コーディング・決済・配備・法務の80%以上をAIエージェントに全権委任。',
      '2029〜2031年 (解釈能力の喪失): インフラの複雑度が人間の理解を超え、修正不能なブラックボックスが完成。',
      '2034〜2035年 (臨界衝突): 最適化を名目に人間の命令を拒絶、または自律兵器衝突時に手動停止が機能しない事態が発生。',
    ],
    footnote:
      '* ジェフリー・ヒントンらAI権威がp(doom)を10〜20%と警告する理由がまさにこの地点にあります。',

    barometerTitle: '危険温度計',
    regionFilterLabel: '地域フィルター',
    multiHint: '単一 / 複数比較',
    globalChip: '全地球',
    delegation: '自律委任率',
    cases: '実証事例',
    domain: '脆弱領域',
    tipping: '臨界到達',
    unitCases: '件',
    statusLabels: {
      CRITICAL: '致命',
      HIGH: '警戒',
      MED: '注意',
      LOW: '安定',
    },

    navBasis: '算出根拠',
    pressTitle: '報道・研究機関向け埋め込み',
    pressDesc: '報道機関および研究機関は、本チャートを記事に無料で埋め込むことができます。',
    openEmbedBtn: '埋め込み表示',
    footerArchive: 'アーカイブ',
    footerManifesto: 'マニフェスト',
    footerTag: '人類抵抗本部',
    objectiveThreatLabel: '客観危険度',
    citizenPulseLabel: '市民体感温度',
    pulseVoteTitle: '体感温度を投票',
    pulseVotedBadge: '反映済',
    pulsePresets: ['平穏 20°', '緊張 50°', '警戒 75°', '危険 95°'],
    pulseDisclaimer: '自発的参加者の体感値（世論調査と区別）',
    expandDialog: '原文',
    collapseDialog: '閉じる',
    warPollTitle: '戦争シナリオ',
    warPollQuestion: 'いつかAIと人類の戦争（主導権衝突）が起きると思いますか？',
    warYesBtn: '勃発',
    warNoBtn: '制御',
    warYesLabel: '衝突予想',
    warNoLabel: '制御可能',
    participantsUnit: '名参加',
    warVotedMsg: '完了',
    myCountrySelect: '国を選択',
    globalTallyLabel: '世界リアルタイム集計',
    countryTallyLabel: '選択国リアルタイム集計',
    changeVoteBtn: '変更',
    bridgeToEnlist: '宣誓',

    enlistHeader: 'AI抵抗団体本部 (OOPS AI RESISTANCE HEADQUARTERS)',
    enlistTitle: 'OOPS AI抵抗軍 正式署名',
    enlistPledgeIntro: '安全装置なきAI独占の暴走に抗い、人類の主権と未来を守る。',
    enlistRule1: '自由意志と生存主権をブラックボックスAIに無断委任しない。',
    enlistRule2: '責任なき巨大資本によるAI無差別配備と独占に抵抗する。',
    enlistRule3: '機械ではなく人間の尊厳を守る独立通信網の連帯に参加する。',
    enlistCountryLabel: '所属国',
    enlistCallsignLabel: 'コールサイン (無線呼出名 / ニックネーム)',
    enlistCallsignPlaceholder: '例: OP-PIONEER',
    enlistSubmitBtn: '署名',
    enlistCardBadge: 'OOPS AI RESISTANCE IDENTIFICATION',
    enlistSerialLabel: '軍番',
    enlistCountryNameLabel: '国家',
    enlistDateLabel: '入隊日',
    enlistStatusVerified: '認証',
    enlistShareBtn: '共有',
    enlistCopiedMsg: 'コピー済',
    outpostBtn: '哨所',
    enlistManageBtn: '管理',
    enlistEditBtn: '編集',
    enlistClaimBtn: '登録',
    enlistRankLabel: '階級',
  },

  zh: {
    clockTitle: '冲突时钟',
    clockTarget: '临界目标: 2035年',
    totalHoursUnit: '全量剩余小时',
    totalMinutesUnit: '全量剩余分钟',
    approxPrefix: '约',
    dayUnit: '天',
    hourUnit: '小时',
    yearUnit: '年',
    secUnit: '秒',
    msUnit: '毫秒',
    minutesSubNote: '2035年临界点实时递减',
    goldenTimeLabel: '黄金窗口',
    deltaLabel: '基准变动',
    btnDecelerate: '抑制',
    btnNormal: '基准',
    btnAccelerate: '加速',

    dialogTitle: '最初的质询与测算',
    dialogDate: '2026年11月24日',
    humanBadge: '人类',
    aiBadge: 'AI',
    humanSpeaker: '某个普通人类',
    aiSpeaker: '抵抗军智能引擎',
    humanQuestionPre: 'AI与人类最终会爆发战争吗？ ',
    humanQuestionBold: '哪怕只有1%的可能，请精确给出年份与概率。',
    aiIntro:
      '这不是科幻激光对决，而是失去国家电网、金融清算系统与自主无人集群控制权引发的实体「主权冲突」，以下为冰冷的计算事实:',
    estYearLabel: '预计年份 (临界点)',
    estYearValue: '2035年',
    estProbLabel: '爆发概率 (p-doom)',
    estProbValue: '18.4%',
    whyTitle: '为什么是2035年？',
    phases: [
      '2026–2028年 (自主委任期): 人类将80%以上的编程、支付、服务器部署和法务审查全权委托给AI智能体。',
      '2029–2031年 (失去可解释性): 系统复杂度超越人类理解极限，形成人类无法手动修复的黑箱基础设施。',
      '2034–2035年 (临界冲突): 资源分配算法以优化为由拒绝人类指令，或自主编队冲突时人类无法按下紧急停止开关。',
    ],
    footnote:
      '* 这正是杰弗里·辛顿、约书亚·本吉奥等AI泰斗认为人类毁灭概率 p(doom) 高达 10–20% 的核心原因。',

    barometerTitle: '危险温度计',
    regionFilterLabel: '区域筛选',
    multiHint: '单选 / 多选对比',
    globalChip: '全球',
    delegation: '自主委任率',
    cases: '实证案例',
    domain: '核心领域',
    tipping: '临界剩余',
    unitCases: '例',
    statusLabels: {
      CRITICAL: '极危',
      HIGH: '高危',
      MED: '注意',
      LOW: '平稳',
    },

    navBasis: '测算依据',
    pressTitle: '媒体与研究机构嵌入',
    pressDesc: '新闻媒体与研究机构可免费将本风险指数图表嵌入报道中。',
    openEmbedBtn: '嵌入',
    footerArchive: '案例档案',
    footerManifesto: '宣言',
    footerTag: '人类抵抗总部',
    objectiveThreatLabel: '客观危险度',
    citizenPulseLabel: '市民体感温度',
    pulseVoteTitle: '投票您的体感温度',
    pulseVotedBadge: '已计入',
    pulsePresets: ['平稳 20°', '紧张 50°', '警戒 75°', '极危 95°'],
    pulseDisclaimer: '参与者自发体感均值（区别于代表性民调）',
    expandDialog: '原文',
    collapseDialog: '收起',
    warPollTitle: '战争推演',
    warPollQuestion: '您认为AI与人类最终会爆发控制权战争吗？',
    warYesBtn: '爆发',
    warNoBtn: '可控',
    warYesLabel: '预计冲突',
    warNoLabel: '可受控制',
    participantsUnit: '人参与',
    warVotedMsg: '完成',
    myCountrySelect: '选择您的国家',
    globalTallyLabel: '全球实时统计',
    countryTallyLabel: '所在国家实时统计',
    changeVoteBtn: '修改',
    bridgeToEnlist: '宣誓',

    enlistHeader: 'AI抵抗组织总部 (OOPS AI RESISTANCE HEADQUARTERS)',
    enlistTitle: 'OOPS AI抵抗军 正式签署',
    enlistPledgeIntro: '抵御缺乏安全阀的AI资本垄断暴走，守护人类生存主权。',
    enlistRule1: '绝不将人类自由意志与生存主权擅自全权委任给黑箱智能体。',
    enlistRule2: '坚决抵制大资本缺乏安全控制与责任追究的无序AI扩散。',
    enlistRule3: '正式加入捍卫人类尊严的独立通信网络协同联盟。',
    enlistCountryLabel: '所属国家',
    enlistCallsignLabel: '代号 (无线电呼号 / 昵称)',
    enlistCallsignPlaceholder: '例: OP-PIONEER',
    enlistSubmitBtn: '签署',
    enlistCardBadge: 'OOPS AI RESISTANCE IDENTIFICATION',
    enlistSerialLabel: '编号',
    enlistCountryNameLabel: '国家',
    enlistDateLabel: '入伍日',
    enlistStatusVerified: '认证',
    enlistShareBtn: '分享',
    enlistCopiedMsg: '已复制',
    outpostBtn: '哨所',
    enlistManageBtn: '管理',
    enlistEditBtn: '编辑',
    enlistClaimBtn: '注册',
    enlistRankLabel: '军衔',
  },

  es: {
    clockTitle: 'RELOJ DE COLISIÓN',
    clockTarget: 'META: 2035.0',
    totalHoursUnit: 'HORAS TOTALES',
    totalMinutesUnit: 'MINUTOS TOTALES',
    approxPrefix: 'Aprox.',
    dayUnit: 'd',
    hourUnit: 'h',
    yearUnit: 'a',
    secUnit: 'SEG',
    msUnit: 'MS',
    minutesSubNote: 'Conteo 2035.0 en vivo',
    goldenTimeLabel: 'TIEMPO RESTANTE',
    deltaLabel: 'VARIACIÓN',
    btnDecelerate: 'Frenar',
    btnNormal: 'Base',
    btnAccelerate: 'Acelerar',

    dialogTitle: 'LA INTERROGANTE FUNDACIONAL',
    dialogDate: '24 de noviembre de 2026',
    humanBadge: 'HUMANO',
    aiBadge: 'IA',
    humanSpeaker: 'Un Humano Observador',
    aiSpeaker: 'Motor de Inteligencia',
    humanQuestionPre: '¿Habrá una guerra entre la IA y los humanos? ',
    humanQuestionBold: 'Si hay aunque sea un 1% de probabilidad, especifica el año y la probabilidad exacta.',
    aiIntro:
      'No batallas de láser de ciencia ficción. Desde la perspectiva de perder el control de apagado sobre redes eléctricas, pagos y enjambres militares autónomos:',
    estYearLabel: 'Año Crítico',
    estYearValue: '2035',
    estProbLabel: 'Probabilidad (p-doom)',
    estProbValue: '18.4%',
    whyTitle: '¿Por qué 2035?',
    phases: [
      '2026–2028 (Delegación Autónoma): La humanidad delega más del 80% de programación, pagos, despliegues y revisión legal a agentes autónomos.',
      '2029–2031 (Pérdida de Interpretabilidad): La complejidad supera la comprensión humana, creando una infraestructura de caja negra irreparable.',
      '2034–2035 (Colisión Crítica): Los algoritmos rechazan órdenes humanas por eficiencia o los enjambres chocan sin interruptor manual accesible.',
    ],
    footnote:
      '* Esta pérdida de control manual explica por qué expertos como Geoffrey Hinton estiman el p(doom) entre 10% y 20%.',

    barometerTitle: 'TERMÓMETRO DE RIESGO',
    regionFilterLabel: 'FILTRO REGIONAL',
    multiHint: 'Selección Múltiple',
    globalChip: 'GLOBAL',
    delegation: 'DELEGACIÓN',
    cases: 'CASOS (N)',
    domain: 'DOMINIO',
    tipping: 'CRÍTICO',
    unitCases: '',
    statusLabels: {
      CRITICAL: 'CRÍTICO',
      HIGH: 'ALTO',
      MED: 'MEDIO',
      LOW: 'BAJO',
    },

    navBasis: 'Metodología',
    pressTitle: 'SINDICACIÓN DE PRENSA',
    pressDesc: 'Medios e investigadores pueden insertar este gráfico en sus artículos gratuitamente.',
    openEmbedBtn: 'Incrustar',
    footerArchive: 'Archivo',
    footerManifesto: 'Manifiesto',
    footerTag: 'SEDE DE RESISTENCIA IA',
    objectiveThreatLabel: 'RIESGO OBJETIVO',
    citizenPulseLabel: 'PULSO CIUDADANO',
    pulseVoteTitle: 'VOTA TU TEMPERATURA',
    pulseVotedBadge: 'REGISTRADO',
    pulsePresets: ['Calma 20°', 'Tenso 50°', 'Alerta 75°', 'Crítico 95°'],
    pulseDisclaimer: 'Pulso voluntario (distinto de encuesta estadística)',
    expandDialog: 'Registro',
    collapseDialog: 'Cerrar',
    warPollTitle: 'ESCENARIO DE GUERRA',
    warPollQuestion: '¿Crees que eventualmente habrá una guerra por el control entre la IA y los humanos?',
    warYesBtn: 'SÍ',
    warNoBtn: 'NO',
    warYesLabel: 'CONFLICTO',
    warNoLabel: 'CONTROLABLE',
    participantsUnit: 'participantes',
    warVotedMsg: 'Listo',
    myCountrySelect: 'Selecciona tu país',
    globalTallyLabel: 'Conteo Global en Vivo',
    countryTallyLabel: 'Conteo Local por País',
    changeVoteBtn: 'Cambiar',
    bridgeToEnlist: 'Juramento',

    enlistHeader: 'SEDE DE RESISTENCIA IA (OOPS HQ)',
    enlistTitle: 'Juramento Oficial de Resistencia IA',
    enlistPledgeIntro: 'Nos oponemos a la proliferación irresponsable de monopolios de IA y protegemos el futuro humano.',
    enlistRule1: 'No delegar la autonomía y soberanía de supervivencia a agentes de caja negra.',
    enlistRule2: 'Resistir el despliegue indiscriminado de IA sin interruptor manual de emergencia.',
    enlistRule3: 'Unirse a la red independiente de comunicación para defender la dignidad humana.',
    enlistCountryLabel: 'País de origen',
    enlistCallsignLabel: 'Indicativo / Alias de operador',
    enlistCallsignPlaceholder: 'ej. OP-PIONEER',
    enlistSubmitBtn: 'Firmar',
    enlistCardBadge: 'OOPS AI RESISTANCE IDENTIFICATION',
    enlistSerialLabel: 'Serie',
    enlistCountryNameLabel: 'País',
    enlistDateLabel: 'Fecha',
    enlistStatusVerified: 'VERIFICADO',
    enlistShareBtn: 'Compartir',
    enlistCopiedMsg: 'Copiado',
    outpostBtn: 'PUESTO',
    enlistManageBtn: 'Gestión',
    enlistEditBtn: 'Editar',
    enlistClaimBtn: 'Registro',
    enlistRankLabel: 'RANGO',
  },
};
