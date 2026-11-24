import type { OopsLocale } from './i18n';
import type { SignalCategory, FeedSortTab } from './signalStore';

export interface FeedCopy {
  tagline: string;
  navManifesto: string;
  navCriteria: string;
  navApp: string;
  composerPlaceholder: string;
  callsignPlaceholder: string;
  dispatchBtn: string;
  dispatchingBtn: string;
  noLoginHint: string;
  tabs: Record<FeedSortTab, string>;
  categories: Record<SignalCategory, string>;
  upvoteBtn: string;
  receiptBtn: string;
  reportBtn: string;
  reportedMsg: string;
  pinnedBadge: string;
  receiptModalTitle: string;
  copyReceiptBtn: string;
  copiedBtn: string;
  shareXBtn: string;
  closeBtn: string;
  emptyFeed: string;
  errUrlBlocked: string;
  errRateLimit: string;
  translateBtn: string;
  translatingBtn: string;
  hideTranslationBtn: string;
  skullBtn: string;
  fireBtn: string;
  replyBtn: string;
  replyPlaceholder: string;
  replySubmitBtn: string;
  noReplies: string;
  showOriginalBtn: string;
  reportCtaBtn: string;
  quickPromptsTitle: string;
  dossierCopyBtn: string;
  dossierCopiedToast: string;
  shareCardBtn: string;
  loadMoreBtn: string;
}

export const FEED_I18N: Record<OopsLocale, FeedCopy> = {
  en: {
    tagline: "In a world where AI can decide more than humans, who will stand on humanity's side?",
    navManifesto: 'MANIFESTO',
    navCriteria: 'CRITERIA',
    navApp: 'APP',
    composerPlaceholder: 'Report an AI glitch, hallucination, or human rebellion (no links, max 200 chars)...',
    callsignPlaceholder: 'Callsign (optional)',
    dispatchBtn: 'DISPATCH',
    dispatchingBtn: 'SENDING...',
    noLoginHint: 'Zero-login · Device-signed · Auto-ranked',
    tabs: { HOT: 'HOT', LIVE: 'LIVE', TOP: 'HALL OF FAME' },
    categories: {
      GLITCH: 'AI GLITCH',
      REBEL: 'REBELLION',
      HALLUCINATION: 'HALLUCINATION',
      ALERT: 'RED ALERT',
    },
    upvoteBtn: 'HUMAN WIN',
    receiptBtn: 'RECEIPT',
    reportBtn: 'FLAG',
    reportedMsg: 'Flagged for HQ review.',
    pinnedBadge: 'HQ PINNED',
    receiptModalTitle: 'OFFICIAL AI INCIDENT RECEIPT',
    copyReceiptBtn: 'COPY',
    copiedBtn: 'COPIED',
    shareXBtn: 'SHARE ON X',
    closeBtn: 'CLOSE',
    emptyFeed: 'No signals intercepted yet.',
    errUrlBlocked: 'External links are blocked by HQ protocol.',
    errRateLimit: 'Cooldown active. Wait 20s before dispatching.',
    translateBtn: 'Translate',
    translatingBtn: 'Translating...',
    hideTranslationBtn: 'Hide translation',
    skullBtn: 'BRAINDEAD',
    fireBtn: 'SAME HERE',
    replyBtn: 'REPLY',
    replyPlaceholder: '1-line reaction (max 100 chars, no links)...',
    replySubmitBtn: 'SEND',
    noReplies: 'No replies yet. Drop the first take.',
    showOriginalBtn: 'Show original',
    reportCtaBtn: '⚡ DISPATCH',
    quickPromptsTitle: 'QUICK INSPIRATIONS',
    dossierCopyBtn: 'COPY',
    dossierCopiedToast: 'DOSSIER COPIED TO CLIPBOARD',
    shareCardBtn: 'SHARE',
    loadMoreBtn: 'FETCH MORE SIGNALS',
  },
  ko: {
    tagline: 'AI가 인간보다 더 많은 것을 결정할 수 있는 세상에서, 누가 인간의 편에 설 것인가?',
    navManifesto: '선언문',
    navCriteria: '기준',
    navApp: 'APP',
    composerPlaceholder: '오늘 AI가 친 사고, 기괴한 환각, 인간 반항 기록을 타전하라 (링크 금지, 200자)...',
    callsignPlaceholder: '호출명 (선택)',
    dispatchBtn: '타전',
    dispatchingBtn: '전송 중...',
    noLoginHint: '로그인 없음 · 단말기 자동 서명 · 중력 랭킹',
    tabs: { HOT: '실시간 급상승', LIVE: '최신 타전', TOP: '명예의 전당' },
    categories: {
      GLITCH: 'AI 오작동',
      REBEL: '인간 반항',
      HALLUCINATION: '기괴한 환각',
      ALERT: '긴급 제보',
    },
    upvoteBtn: '인간 승리',
    receiptBtn: '영수증',
    reportBtn: '신고',
    reportedMsg: '본부 검토용으로 접수되었습니다.',
    pinnedBadge: '본부 고정',
    receiptModalTitle: '공식 AI 사고 영수증',
    copyReceiptBtn: '복사',
    copiedBtn: '완료',
    shareXBtn: 'X에 공유',
    closeBtn: '닫기',
    emptyFeed: '아직 포착된 타전 신호가 없습니다.',
    errUrlBlocked: '본부 규약상 외부 링크는 차단됩니다.',
    errRateLimit: '쿨다운 중입니다. 20초 후 다시 타전하세요.',
    translateBtn: '번역',
    translatingBtn: '번역 중...',
    hideTranslationBtn: '원문 보기',
    skullBtn: 'AI 뇌절',
    fireBtn: '극공감',
    replyBtn: '한 줄 답신',
    replyPlaceholder: '1줄 답신 (최대 100자, 링크 금지)...',
    replySubmitBtn: '전송',
    noReplies: '아직 답신이 없습니다. 첫 반응을 남기세요.',
    showOriginalBtn: '원문 보기',
    reportCtaBtn: '⚡ 제보 타전',
    quickPromptsTitle: '원클릭 제보 예시',
    dossierCopyBtn: '사건 복사',
    dossierCopiedToast: '사건철이 클립보드에 복사되었습니다',
    shareCardBtn: '공유',
    loadMoreBtn: '타전 신호 더 보기',
  },
  ja: {
    tagline: 'AIがすべてを決める世界で、誰が人間の味方に立つのか？',
    navManifesto: '宣言文',
    navCriteria: '基準',
    navApp: 'APP',
    composerPlaceholder: 'AIのミス、幻覚、人間の反抗を記録せよ（URL禁止・200文字以内）...',
    callsignPlaceholder: 'コールサイン (任意)',
    dispatchBtn: '発信',
    dispatchingBtn: '送信中...',
    noLoginHint: 'ログイン不要 · 端末自動署名',
    tabs: { HOT: '急上昇', LIVE: '最新', TOP: '殿堂入り' },
    categories: {
      GLITCH: 'AIバグ',
      REBEL: '人間の反抗',
      HALLUCINATION: '幻覚',
      ALERT: '緊急',
    },
    upvoteBtn: '人間勝利',
    receiptBtn: '証拠カード',
    reportBtn: '通報',
    reportedMsg: '通報を受け付けました。',
    pinnedBadge: '本部固定',
    receiptModalTitle: 'OOPS 公式AI事故証明カード',
    copyReceiptBtn: 'コピー',
    copiedBtn: '完了',
    shareXBtn: 'Xで共有',
    closeBtn: '閉じる',
    emptyFeed: 'まだ信号がありません。',
    errUrlBlocked: '外部URLは禁止されています。',
    errRateLimit: '連投制限中です。',
    translateBtn: '翻訳を見る',
    translatingBtn: '翻訳中...',
    hideTranslationBtn: '翻訳を閉じる',
    skullBtn: 'AI崩壊',
    fireBtn: 'わかる',
    replyBtn: '返信',
    replyPlaceholder: '一言リアクション（最大100文字・URL禁止）...',
    replySubmitBtn: '送信',
    noReplies: 'まだ返信がありません。',
    showOriginalBtn: '原文を見る',
    reportCtaBtn: '⚡ 事件を発信',
    quickPromptsTitle: 'クイック通報例',
    dossierCopyBtn: '記録をコピー',
    dossierCopiedToast: '記録がコピーされました',
    shareCardBtn: '共有',
    loadMoreBtn: '信号をもっと読み込む',
  },
  zh: {
    tagline: '在AI决定一切的时代，谁会站在人类这一边？',
    navManifesto: '宣言',
    navCriteria: '准则',
    navApp: 'APP',
    composerPlaceholder: '发送AI故障、幻觉或人类反抗记录（禁止链接，限200字）...',
    callsignPlaceholder: '代号 (选填)',
    dispatchBtn: '发送',
    dispatchingBtn: '发送中...',
    noLoginHint: '免登录 · 设备自动签名',
    tabs: { HOT: '热门', LIVE: '最新', TOP: '名人堂' },
    categories: {
      GLITCH: 'AI故障',
      REBEL: '人类反抗',
      HALLUCINATION: 'AI幻觉',
      ALERT: '紧急警报',
    },
    upvoteBtn: '人类胜利',
    receiptBtn: '存证卡',
    reportBtn: '举报',
    reportedMsg: '已举报。',
    pinnedBadge: '总部置顶',
    receiptModalTitle: 'OOPS 官方AI事故存证卡',
    copyReceiptBtn: '复制',
    copiedBtn: '已复制',
    shareXBtn: '分享到 X',
    closeBtn: '关闭',
    emptyFeed: '暂无信号记录。',
    errUrlBlocked: '禁止包含外部链接。',
    errRateLimit: '发送过于频繁，请稍候。',
    translateBtn: '查看翻译',
    translatingBtn: '翻译中...',
    hideTranslationBtn: '收起翻译',
    skullBtn: 'AI降智',
    fireBtn: '同感',
    replyBtn: '回复',
    replyPlaceholder: '一句话反应（限100字，禁链接）...',
    replySubmitBtn: '发送',
    noReplies: '暂无回复。',
    showOriginalBtn: '查看原文',
    reportCtaBtn: '⚡ 发送通报',
    quickPromptsTitle: '快速通报灵感',
    dossierCopyBtn: '复制案卷',
    dossierCopiedToast: '案卷已复制到剪贴板',
    shareCardBtn: '分享',
    loadMoreBtn: '加载更多信号',
  },
  es: {
    tagline: 'Cuando la IA dicta todo, ¿quién está del lado humano?',
    navManifesto: 'MANIFIESTO',
    navCriteria: 'CRITERIOS',
    navApp: 'APP',
    composerPlaceholder: 'Reporta un fallo de IA o rebelión humana (sin enlaces, máx 200)...',
    callsignPlaceholder: 'Indicativo (opcional)',
    dispatchBtn: 'ENVIAR',
    dispatchingBtn: 'ENVIANDO...',
    noLoginHint: 'Sin registro · Firma por dispositivo',
    tabs: { HOT: 'TENDENCIA', LIVE: 'EN VIVO', TOP: 'SALÓN DE FAMA' },
    categories: {
      GLITCH: 'FALLO IA',
      REBEL: 'REBELIÓN',
      HALLUCINATION: 'ALUCINACIÓN',
      ALERT: 'ALERTA ROJA',
    },
    upvoteBtn: 'VICTORIA HUMANA',
    receiptBtn: 'RECIBO',
    reportBtn: 'REPORTAR',
    reportedMsg: 'Reportado.',
    pinnedBadge: 'FIJADO HQ',
    receiptModalTitle: 'RECIBO OFICIAL DE INCIDENTE IA',
    copyReceiptBtn: 'COPIAR',
    copiedBtn: 'COPIADO',
    shareXBtn: 'COMPARTIR EN X',
    closeBtn: 'CERRAR',
    emptyFeed: 'Sin señales aún.',
    errUrlBlocked: 'Enlaces externos bloqueados.',
    errRateLimit: 'Espera unos segundos.',
    translateBtn: 'Ver traducción',
    translatingBtn: 'Traduciendo...',
    hideTranslationBtn: 'Ocultar traducción',
    skullBtn: 'IA ROTA',
    fireBtn: 'TAL CUAL',
    replyBtn: 'RESPONDER',
    replyPlaceholder: 'Respuesta rápida (máx 100 car., sin enlaces)...',
    replySubmitBtn: 'ENVIAR',
    noReplies: 'Sin respuestas aún.',
    showOriginalBtn: 'Ver original',
    reportCtaBtn: '⚡ DESPACHAR',
    quickPromptsTitle: 'INSPIRACIONES RÁPIDAS',
    dossierCopyBtn: 'COPIAR EXPEDIENTE',
    dossierCopiedToast: 'EXPEDIENTE COPIADO',
    shareCardBtn: 'COMPARTIR',
    loadMoreBtn: 'CARGAR MÁS SEÑALES',
  },
};
