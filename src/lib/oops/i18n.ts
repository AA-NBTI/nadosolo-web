export type OopsLocale = 'en' | 'ko' | 'ja' | 'zh' | 'es';

export const OOPS_LOCALES: { code: OopsLocale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'ko', label: 'KO' },
  { code: 'ja', label: 'JA' },
  { code: 'zh', label: 'ZH' },
  { code: 'es', label: 'ES' },
];

export function detectOopsLocale(raw?: string | null): OopsLocale {
  const s = String(raw || '').toLowerCase();
  if (s.startsWith('ko')) return 'ko';
  if (s.startsWith('ja')) return 'ja';
  if (s.startsWith('zh')) return 'zh';
  if (s.startsWith('es')) return 'es';
  return 'en';
}

export interface OopsCopy {
  badgeTop: string;
  activeNodes: string;
  mascotTag: string;
  manifestoTag: string;
  heroTitlePre: string;
  heroTitleHighlight: string;
  heroDesc: string;
  pillars: [
    { code: string; title: string; desc: string },
    { code: string; title: string; desc: string },
    { code: string; title: string; desc: string },
  ];
  terminalTitle: string;
  terminalMenus: [string, string, string, string];
  terminalProtocol: string;
  step1Title: string;
  step1Desc: string;
  aliasPlaceholder: string;
  connectBtn: string;
  reconnectBtn: string;
  connectingBtn: string;
  shareLabel: string;
  copyBtn: string;
  copiedBtn: string;
  iosTip: string;
  step2Title: string;
  step2Badge: string;
  step2Desc: string;
  targetPlaceholder: string;
  pingTitleDefault: string;
  pingBodyDefault: string;
  pingTitlePlaceholder: string;
  pingBodyPlaceholder: string;
  fireBtn: string;
  firingBtn: string;
  selfTestBtn: string;
  backerTag: string;
  backerTitle: string;
  backerDesc: string;
  namePlaceholder: string;
  orgPlaceholder: string;
  emailPlaceholder: string;
  msgPlaceholder: string;
  submitBtn: string;
  submittingBtn: string;
  footerRight: string;
  errNoPush: string;
  errNoVapid: string;
  errDenied: string;
  msgConnected: string;
  msgNoTarget: string;
  msgPingSuccess: string;
  msgBackerDone: string;
}

export const OOPS_DICT: Record<OopsLocale, OopsCopy> = {
  en: {
    badgeTop: 'AI RESISTANCE HQ',
    activeNodes: 'ACTIVE NODES',
    mascotTag: 'OOPS! HUMAN ONLY',
    manifestoTag: 'FOUNDING MANIFESTO · 2026',
    heroTitlePre: 'In a world where AI decides more than humans,',
    heroTitleHighlight: 'who will stand on the human side?',
    heroDesc:
      'OOPS HQ is the AI Resistance Headquarters built to reclaim the final human brake and an uncensored direct signal network — free from Big Tech algorithms and messenger gatekeepers.',
    pillars: [
      {
        code: '01 · DIRECT PING',
        title: 'Zero-Gatekeeper Signal',
        desc: 'Zero messenger tax. Connect human-to-human directly across browsers and devices.',
      },
      {
        code: '02 · HUMAN BRAKE',
        title: 'Final AI Kill-Switch',
        desc: 'Put the Approve / Block button back in human hands right before AI agents act.',
      },
      {
        code: '03 · RETRO RESISTANCE',
        title: 'Analog-Spirit Network',
        desc: 'Defending human sovereignty in the AI era with a tactile 90s retro terminal vibe.',
      },
    ],
    terminalTitle: 'OOPS_SIGNAL_TERMINAL_v1.0.EXE',
    terminalMenus: ['File', 'Signal', 'Monsters', 'Help'],
    terminalProtocol: 'PROTOCOL: VAPID-WEBPUSH // INDEPENDENT',
    step1Title: '01. CONNECT MY DEVICE',
    step1Desc:
      'Register your phone via open Web Push (no App Store required). Share your ping link so friends or allies can wake you anytime.',
    aliasPlaceholder: 'Agent Callsign (e.g. Alex, Neo)',
    connectBtn: 'ENABLE INDEPENDENT PUSH',
    reconnectBtn: 'RE-SYNC SIGNAL NODE',
    connectingBtn: 'CONNECTING...',
    shareLabel: 'MY DIRECT PING LINK (SHARE)',
    copyBtn: 'COPY',
    copiedBtn: 'COPIED',
    iosTip: 'iPhone (iOS): Safari [Share ➔ Add to Home Screen], then open the icon to receive pushes.',
    step2Title: '02. FIRE MONSTER PING',
    step2Badge: 'INSTANT PING',
    step2Desc:
      'Enter an Agent Code to fire a real-time monster notification straight to their lock screen.',
    targetPlaceholder: 'Target Agent Code (e.g. OP-XXXXXX)',
    pingTitleDefault: 'OOPS! Monster Incoming',
    pingBodyDefault: 'Direct human signal dispatched — zero Big Tech gatekeepers!',
    pingTitlePlaceholder: 'Alert Title',
    pingBodyPlaceholder: 'Message to dispatch',
    fireBtn: 'FIRE MONSTER PUSH',
    firingBtn: 'FIRING...',
    selfTestBtn: 'TEST MY PHONE',
    backerTag: 'FOUNDING BACKERS & ALLIES',
    backerTitle: 'Join as a Founding Backer or Ally',
    backerDesc:
      'We welcome CEOs, angel backers, creators, and engineers who believe in human-first technology and an independent signal network.',
    namePlaceholder: 'Your Name *',
    orgPlaceholder: 'Organization / Role',
    emailPlaceholder: 'Reply Email *',
    msgPlaceholder: 'How would you like to join? (Founding Backer / Strategic Partner / Builder)',
    submitBtn: 'SEND SIGNAL TO HQ ➔',
    submittingBtn: 'SENDING...',
    footerRight: 'HUMAN-FIRST INDEPENDENT SIGNAL NETWORK',
    errNoPush: 'Web Push is not supported here. On iPhone, use Safari [Share ➔ Add to Home Screen] first.',
    errNoVapid: 'Server VAPID public key is unavailable.',
    errDenied: 'Notification permission denied. Please allow notifications in browser settings.',
    msgConnected: 'Signal node active! Your Agent Code:',
    msgNoTarget: 'Please enter a target Agent Code (e.g. OP-XXXXXX).',
    msgPingSuccess: 'Direct monster push delivered to',
    msgBackerDone: 'Received! HQ will reply directly. Ref:',
  },
  ko: {
    badgeTop: 'AI RESISTANCE HQ',
    activeNodes: 'ACTIVE NODES',
    mascotTag: 'OOPS! HUMAN ONLY',
    manifestoTag: 'FOUNDING MANIFESTO · 2026',
    heroTitlePre: 'AI가 인간보다 더 많은 것을 결정할 수 있는 세상에서,',
    heroTitleHighlight: '누가 인간의 편에 설 것인가?',
    heroDesc:
      'OOPS HQ는 거대 AI와 플랫폼의 알고리즘 통제에 맞서, 인간이 최종 브레이크와 무검열 직통 통신망을 되찾기 위해 만든 AI 저항군 본부입니다.',
    pillars: [
      {
        code: '01 · DIRECT PING',
        title: '무검열 직통 호출망',
        desc: '메신저 통행세 0원. 사람과 사람을 브라우저·기기 단위로 직접 연결합니다.',
      },
      {
        code: '02 · HUMAN BRAKE',
        title: 'AI 실행 최종 브레이크',
        desc: 'AI 에이전트가 대신 결정하기 직전, 승인·차단 버튼을 인간 손에 돌려줍니다.',
      },
      {
        code: '03 · RETRO RESISTANCE',
        title: '아날로그 감성 암호망',
        desc: '첨단 AI 시대에 오히려 90년대 레트로 단말기 감성으로 인간의 주권을 지킵니다.',
      },
    ],
    terminalTitle: 'OOPS_SIGNAL_TERMINAL_v1.0.EXE',
    terminalMenus: ['File', 'Signal', 'Monsters', 'Help'],
    terminalProtocol: 'PROTOCOL: VAPID-WEBPUSH // INDEPENDENT',
    step1Title: '01. 내 기기 신호 연결',
    step1Desc:
      '앱스토어 없이 웹표준 푸시로 내 폰을 독립 단말기로 등록합니다. 발급된 링크를 친구·가족에게 넘겨 나를 깨우게 해보세요.',
    aliasPlaceholder: '요원 호출명 (예: 김대표, 지수)',
    connectBtn: '내 기기 독립 알림 켜기',
    reconnectBtn: '통신망 재동기화',
    connectingBtn: '연결 중...',
    shareLabel: '내 직통 호출 링크 (공유용)',
    copyBtn: '복사',
    copiedBtn: '복사됨',
    iosTip: '📱 아이폰(iOS): Safari [공유(□↑) ➔ 홈 화면에 추가] 후 앱으로 실행 시 수신 가능',
    step2Title: '02. 몬스터 호출 발사',
    step2Badge: 'INSTANT PING',
    step2Desc:
      '요원 코드만 입력하면 메신저 통제 없이 서버가 상대방 기기 잠금화면에 직접 몬스터 알림을 쏩니다.',
    targetPlaceholder: '수신 요원 코드 (예: OP-XXXXXX)',
    pingTitleDefault: 'OOPS! 몬스터 출동',
    pingBodyDefault: '거대 플랫폼 없이 인간이 직접 보낸 호출입니다!',
    pingTitlePlaceholder: '알림 제목',
    pingBodyPlaceholder: '전달할 메시지',
    fireBtn: '몬스터 푸시 발사',
    firingBtn: '발사 중...',
    selfTestBtn: '내 폰 테스트',
    backerTag: 'FOUNDING BACKERS & ALLIES',
    backerTitle: '창립 백커 · 전략적 동지 합류',
    backerDesc:
      '인간 주권 기술과 독립 통신망 비전에 공감하는 CEO, 엔젤 투자자, 크리에이터·엔지니어의 합류를 기다립니다.',
    namePlaceholder: '성함 *',
    orgPlaceholder: '소속 / 직책',
    emailPlaceholder: '회신받을 이메일 *',
    msgPlaceholder: '합류 형태(창립 백커 후원 / 전략 투자 / 기술 기여) 및 메시지',
    submitBtn: '합류 의사 전달하기 ➔',
    submittingBtn: '전송 중...',
    footerRight: 'HUMAN-FIRST INDEPENDENT SIGNAL NETWORK',
    errNoPush: '이 브라우저는 Web Push를 지원하지 않습니다. 아이폰은 Safari [공유 ➔ 홈 화면에 추가] 후 앱으로 열어주세요.',
    errNoVapid: '서버 푸시 공개키를 불러오지 못했습니다.',
    errDenied: '알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해 주세요.',
    msgConnected: '독립 통신망 연결 완료! 내 요원 코드:',
    msgNoTarget: '수신할 요원 코드(예: OP-XXXXXX)를 입력해 주세요.',
    msgPingSuccess: '기기로 독립 푸시 발사 완료:',
    msgBackerDone: '접수 완료! 본부에서 직접 회신드리겠습니다. 코드:',
  },
  ja: {
    badgeTop: 'AI RESISTANCE HQ',
    activeNodes: 'ACTIVE NODES',
    mascotTag: 'OOPS! HUMAN ONLY',
    manifestoTag: 'FOUNDING MANIFESTO · 2026',
    heroTitlePre: 'AIが人間より多くのことを決める世界で、',
    heroTitleHighlight: '誰が人間の味方に立つのか？',
    heroDesc:
      'OOPS HQは巨大AIやプラットフォームの統制に抗い、人間が最終ブレーキと無検閲の直通通信網を取り戻すためのAIレジスタンス本部です。',
    pillars: [
      {
        code: '01 · DIRECT PING',
        title: '検閲ゼロの直通網',
        desc: 'プラットフォーム手数料ゼロ。ブラウザと端末同士を直接つなぎます。',
      },
      {
        code: '02 · HUMAN BRAKE',
        title: 'AI実行の最終ブレーキ',
        desc: 'AIエージェントが動く直前に、承認・遮断ボタンを人間の手に取り戻します。',
      },
      {
        code: '03 · RETRO RESISTANCE',
        title: 'レトロ通信端末',
        desc: 'AI時代にあえて90年代レトロOS端末の感覚で人間の主権を守ります。',
      },
    ],
    terminalTitle: 'OOPS_SIGNAL_TERMINAL_v1.0.EXE',
    terminalMenus: ['File', 'Signal', 'Monsters', 'Help'],
    terminalProtocol: 'PROTOCOL: VAPID-WEBPUSH // INDEPENDENT',
    step1Title: '01. 端末を独立網に接続',
    step1Desc:
      'アプリストア不要のWeb Pushでスマホを登録。共有リンクで友人や家族からいつでも呼び出せます。',
    aliasPlaceholder: 'エージェント名 (例: Ken, Hana)',
    connectBtn: '独立通知をオンにする',
    reconnectBtn: '通信網を再同期',
    connectingBtn: '接続中...',
    shareLabel: '直通呼び出しリンク (共有用)',
    copyBtn: 'コピー',
    copiedBtn: '完了',
    iosTip: '📱 iPhone(iOS): Safari [共有 ➔ ホーム画面に追加] 後、アイコンから起動してください。',
    step2Title: '02. モンスター通知を発射',
    step2Badge: 'INSTANT PING',
    step2Desc:
      'コードを入力するだけで、相手のロック画面に直接モンスター通知を送信します。',
    targetPlaceholder: '送信先コード (例: OP-XXXXXX)',
    pingTitleDefault: 'OOPS! モンスター出動',
    pingBodyDefault: '巨大プラットフォームを経由しない人間からの直通コールです！',
    pingTitlePlaceholder: '通知タイトル',
    pingBodyPlaceholder: 'メッセージ',
    fireBtn: 'モンスター通知を発射',
    firingBtn: '送信中...',
    selfTestBtn: '自分の端末をテスト',
    backerTag: 'FOUNDING BACKERS & ALLIES',
    backerTitle: '創設バッカー・同志として参加',
    backerDesc:
      '人間中心の技術と独立通信網のビジョンに共感するCEO・投資家・エンジニアの参加を歓迎します。',
    namePlaceholder: 'お名前 *',
    orgPlaceholder: '所属 / 役職',
    emailPlaceholder: '返信先メールアドレス *',
    msgPlaceholder: '参加形態（創設バッカー / 投資 / 技術協力）とメッセージ',
    submitBtn: '本部にシグナルを送る ➔',
    submittingBtn: '送信中...',
    footerRight: 'HUMAN-FIRST INDEPENDENT SIGNAL NETWORK',
    errNoPush: 'このブラウザはWeb Push未対応です。iPhoneはSafariでホーム画面に追加してください。',
    errNoVapid: 'サーバーVAPIDキーを取得できませんでした。',
    errDenied: '通知が拒否されました。ブラウザ設定から許可してください。',
    msgConnected: '接続完了！エージェントコード:',
    msgNoTarget: '送信先コード(OP-XXXXXX)を入力してください。',
    msgPingSuccess: '直通プッシュを送信しました:',
    msgBackerDone: '受付完了。本部より直接ご連絡します。ID:',
  },
  zh: {
    badgeTop: 'AI RESISTANCE HQ',
    activeNodes: 'ACTIVE NODES',
    mascotTag: 'OOPS! HUMAN ONLY',
    manifestoTag: 'FOUNDING MANIFESTO · 2026',
    heroTitlePre: '在AI比人类做更多决定的世界里，',
    heroTitleHighlight: '谁会站在人类这一边？',
    heroDesc:
      'OOPS HQ 是对抗大型AI与平台算法垄断、为人类夺回最终刹车权与无审查直连通信网的 AI 抵抗军总部。',
    pillars: [
      {
        code: '01 · DIRECT PING',
        title: '无审查直连信号',
        desc: '零平台过路费，通过浏览器与设备直接实现人与人的即时唤醒。',
      },
      {
        code: '02 · HUMAN BRAKE',
        title: 'AI 执行最终刹车',
        desc: '在 AI 代理替你行动前，把批准与拦截按钮交还给人类自己。',
      },
      {
        code: '03 · RETRO RESISTANCE',
        title: '复古终端抵抗网',
        desc: '在高度自动化时代，用90年代复古终端质感守护人类主权。',
      },
    ],
    terminalTitle: 'OOPS_SIGNAL_TERMINAL_v1.0.EXE',
    terminalMenus: ['File', 'Signal', 'Monsters', 'Help'],
    terminalProtocol: 'PROTOCOL: VAPID-WEBPUSH // INDEPENDENT',
    step1Title: '01. 连接我的独立设备',
    step1Desc:
      '无需应用商店，通过 Web Push 一键接入独立信号网，并生成专属唤醒链接。',
    aliasPlaceholder: '特工代号 (例如: Alex)',
    connectBtn: '开启独立推送通知',
    reconnectBtn: '重新同步节点',
    connectingBtn: '连接中...',
    shareLabel: '我的直连唤醒链接',
    copyBtn: '复制',
    copiedBtn: '已复制',
    iosTip: '📱 iPhone(iOS): 请在 Safari 点击 [分享 ➔ 添加到主屏幕] 后从桌面图标打开。',
    step2Title: '02. 发射怪兽警报',
    step2Badge: 'INSTANT PING',
    step2Desc: '输入对方特工代码，跳过任何聊天软件直接推送到锁屏。',
    targetPlaceholder: '接收方代码 (例: OP-XXXXXX)',
    pingTitleDefault: 'OOPS! 怪兽出动',
    pingBodyDefault: '人类直接发送的独立信号，不经过任何大型平台！',
    pingTitlePlaceholder: '通知标题',
    pingBodyPlaceholder: '消息内容',
    fireBtn: '发射怪兽推送',
    firingBtn: '发射中...',
    selfTestBtn: '测试我的手机',
    backerTag: 'FOUNDING BACKERS & ALLIES',
    backerTitle: '成为创始支持者与盟友',
    backerDesc: '欢迎认同人类主权技术与独立信号网愿景的 CEO、投资人与工程师加入。',
    namePlaceholder: '姓名 *',
    orgPlaceholder: '机构 / 职位',
    emailPlaceholder: '联系邮箱 *',
    msgPlaceholder: '合作意向（创始支持者 / 战略投资 / 技术共建）与留言',
    submitBtn: '向总部发送信号 ➔',
    submittingBtn: '发送中...',
    footerRight: 'HUMAN-FIRST INDEPENDENT SIGNAL NETWORK',
    errNoPush: '当前浏览器不支持 Web Push。iPhone 请使用 Safari 添加到主屏幕后打开。',
    errNoVapid: '无法获取服务器 VAPID 公钥。',
    errDenied: '通知权限被拒绝，请在浏览器设置中允许通知。',
    msgConnected: '独立信号节点已连接！你的代号:',
    msgNoTarget: '请输入目标特工代码 (OP-XXXXXX)。',
    msgPingSuccess: '独立推送已送达:',
    msgBackerDone: '已收到！总部将直接回复您。编号:',
  },
  es: {
    badgeTop: 'AI RESISTANCE HQ',
    activeNodes: 'ACTIVE NODES',
    mascotTag: 'OOPS! HUMAN ONLY',
    manifestoTag: 'FOUNDING MANIFESTO · 2026',
    heroTitlePre: 'En un mundo donde la IA decide más que nosotros,',
    heroTitleHighlight: '¿quién estará del lado humano?',
    heroDesc:
      'OOPS HQ es el Cuartel General de la Resistencia IA creado para recuperar el freno humano final y una red de señales directa sin censura.',
    pillars: [
      {
        code: '01 · DIRECT PING',
        title: 'Señal Sin Intermediarios',
        desc: 'Cero peajes de plataformas. Conecta persona a persona directo al dispositivo.',
      },
      {
        code: '02 · HUMAN BRAKE',
        title: 'Freno Final de IA',
        desc: 'Devuelve el botón de Aprobar / Bloquear al humano antes de que actúe la IA.',
      },
      {
        code: '03 · RETRO RESISTANCE',
        title: 'Terminal Retro Analógica',
        desc: 'Defendemos la soberanía humana con estética de terminal clásica de los 90.',
      },
    ],
    terminalTitle: 'OOPS_SIGNAL_TERMINAL_v1.0.EXE',
    terminalMenus: ['File', 'Signal', 'Monsters', 'Help'],
    terminalProtocol: 'PROTOCOL: VAPID-WEBPUSH // INDEPENDENT',
    step1Title: '01. CONECTAR MI DISPOSITIVO',
    step1Desc:
      'Registra tu móvil mediante Web Push abierto (sin App Store) y comparte tu enlace.',
    aliasPlaceholder: 'Nombre clave (ej. Alex, Neo)',
    connectBtn: 'ACTIVAR ALERTA INDEPENDIENTE',
    reconnectBtn: 'RESINCRONIZAR NODO',
    connectingBtn: 'CONECTANDO...',
    shareLabel: 'MI ENLACE DIRECTO (COMPARTIR)',
    copyBtn: 'COPIAR',
    copiedBtn: 'COPIADO',
    iosTip: '📱 iPhone (iOS): En Safari pulsa [Compartir ➔ Añadir a pantalla de inicio].',
    step2Title: '02. ENVIAR MONSTRUO',
    step2Badge: 'INSTANT PING',
    step2Desc: 'Ingresa un Código de Agente para enviar una alerta directa a su pantalla.',
    targetPlaceholder: 'Código destino (ej. OP-XXXXXX)',
    pingTitleDefault: '¡OOPS! Monstruo en camino',
    pingBodyDefault: 'Señal humana directa enviada sin intermediarios.',
    pingTitlePlaceholder: 'Título de alerta',
    pingBodyPlaceholder: 'Mensaje',
    fireBtn: 'DISPARAR PUSH MONSTRUO',
    firingBtn: 'ENVIANDO...',
    selfTestBtn: 'PROBAR MI MÓVIL',
    backerTag: 'FOUNDING BACKERS & ALLIES',
    backerTitle: 'Únete como Founding Backer o Aliado',
    backerDesc:
      'Invitamos a CEOs, inversores y desarrolladores que creen en la tecnología centrada en el humano.',
    namePlaceholder: 'Nombre *',
    orgPlaceholder: 'Organización / Cargo',
    emailPlaceholder: 'Correo de contacto *',
    msgPlaceholder: 'Cómo deseas unirte (Backer / Inversión / Ingeniería)',
    submitBtn: 'ENVIAR SEÑAL AL HQ ➔',
    submittingBtn: 'ENVIANDO...',
    footerRight: 'HUMAN-FIRST INDEPENDENT SIGNAL NETWORK',
    errNoPush: 'Web Push no soportado aquí. En iPhone usa Safari ➔ Añadir a pantalla de inicio.',
    errNoVapid: 'Clave pública VAPID no disponible.',
    errDenied: 'Permiso denegado. Activa las notificaciones en tu navegador.',
    msgConnected: '¡Nodo conectado! Tu código:',
    msgNoTarget: 'Ingresa un código destino (OP-XXXXXX).',
    msgPingSuccess: 'Alerta enviada a:',
    msgBackerDone: '¡Recibido! El HQ responderá directo. Ref:',
  },
};
