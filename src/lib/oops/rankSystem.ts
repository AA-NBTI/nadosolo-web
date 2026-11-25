import type { OopsLocale } from './i18n';

export interface MilitaryRank {
  level: number;
  code: string;
  minPoints: number;
  insignia: string; // 계급장 심볼
  names: Record<OopsLocale, string>;
  criteria: Record<OopsLocale, string>;
}

/**
 * OOPS AI 저항군 공식 계급 체계 (기본: 훈련병 시작)
 * - 활동 포인트(XP) 기준 자동 진급:
 *   · 정식 입대(가입): +10 XP (기본 훈련병)
 *   · 전쟁 시나리오 투표: +20 XP
 *   · 현장 제보(SNS) 1건: +50 XP
 *   · 제보 추천(UP) 획득: +10 XP
 *   · 댓글 작성: +15 XP
 */
export const OOPS_MILITARY_RANKS: MilitaryRank[] = [
  {
    level: 1,
    code: 'RECRUIT',
    minPoints: 0,
    insignia: '▬',
    names: { ko: '훈련병', en: 'Recruit', ja: '訓練兵', zh: '新兵', es: 'Recluta' },
    criteria: {
      ko: '초소 정식 등록 완료',
      en: 'Outpost registration',
      ja: '哨所正式登録完了',
      zh: '哨所正式注册',
      es: 'Registro oficial',
    },
  },
  {
    level: 2,
    code: 'PVT',
    minPoints: 50,
    insignia: '━',
    names: { ko: '이병', en: 'Private', ja: '二等兵', zh: '列兵', es: 'Soldado' },
    criteria: {
      ko: '누적 50 XP (투표·제보)',
      en: '50 XP (Vote/Report)',
      ja: '累計 50 XP',
      zh: '累计 50 XP',
      es: '50 XP acumulados',
    },
  },
  {
    level: 3,
    code: 'PFC',
    minPoints: 150,
    insignia: '═',
    names: { ko: '일병', en: 'PFC', ja: '一等兵', zh: '上等兵', es: 'Cabo' },
    criteria: {
      ko: '누적 150 XP',
      en: '150 XP',
      ja: '累計 150 XP',
      zh: '累计 150 XP',
      es: '150 XP',
    },
  },
  {
    level: 4,
    code: 'CPL',
    minPoints: 350,
    insignia: '☰',
    names: { ko: '상병', en: 'Corporal', ja: '上等兵', zh: '下士', es: 'Cabo 1º' },
    criteria: {
      ko: '누적 350 XP',
      en: '350 XP',
      ja: '累計 350 XP',
      zh: '累计 350 XP',
      es: '350 XP',
    },
  },
  {
    level: 5,
    code: 'SGT',
    minPoints: 700,
    insignia: '≣',
    names: { ko: '병장', en: 'Sergeant', ja: '兵長', zh: '中士', es: 'Sargento' },
    criteria: {
      ko: '누적 700 XP',
      en: '700 XP',
      ja: '累計 700 XP',
      zh: '累计 700 XP',
      es: '700 XP',
    },
  },
  {
    level: 6,
    code: 'SSG',
    minPoints: 1400,
    insignia: '▼',
    names: { ko: '하사', en: 'Staff Sgt', ja: '下士', zh: '上士', es: 'Sargento 1º' },
    criteria: {
      ko: '누적 1,400 XP',
      en: '1,400 XP',
      ja: '累計 1,400 XP',
      zh: '累计 1,400 XP',
      es: '1,400 XP',
    },
  },
  {
    level: 7,
    code: 'SFC',
    minPoints: 2800,
    insignia: '▼▼',
    names: { ko: '중사', en: 'Sgt 1st', ja: '中士', zh: '军士长', es: 'Brigada' },
    criteria: {
      ko: '누적 2,800 XP',
      en: '2,800 XP',
      ja: '累計 2,800 XP',
      zh: '累计 2,800 XP',
      es: '2,800 XP',
    },
  },
  {
    level: 8,
    code: '2LT',
    minPoints: 5000,
    insignia: '◆',
    names: { ko: '소위', en: '2nd Lt.', ja: '少尉', zh: '少尉', es: 'Alférez' },
    criteria: {
      ko: '누적 5,000 XP',
      en: '5,000 XP',
      ja: '累計 5,000 XP',
      zh: '累计 5,000 XP',
      es: '5,000 XP',
    },
  },
  {
    level: 9,
    code: 'CPT',
    minPoints: 10000,
    insignia: '◆◆◆',
    names: { ko: '대위', en: 'Captain', ja: '大尉', zh: '上尉', es: 'Capitán' },
    criteria: {
      ko: '누적 10,000 XP',
      en: '10,000 XP',
      ja: '累計 10,000 XP',
      zh: '累计 10,000 XP',
      es: '10,000 XP',
    },
  },
  {
    level: 10,
    code: 'CMD',
    minPoints: 25000,
    insignia: '★',
    names: { ko: '사령관', en: 'Commander', ja: '司令官', zh: '司令官', es: 'Comandante' },
    criteria: {
      ko: '누적 25,000 XP',
      en: '25,000 XP',
      ja: '累計 25,000 XP',
      zh: '累计 25,000 XP',
      es: '25,000 XP',
    },
  },
];

export function resolveRankByPoints(points: number): {
  current: MilitaryRank;
  next: MilitaryRank | null;
  progressPct: number;
} {
  let current = OOPS_MILITARY_RANKS[0];
  let next: MilitaryRank | null = OOPS_MILITARY_RANKS[1] || null;

  for (let i = OOPS_MILITARY_RANKS.length - 1; i >= 0; i--) {
    if (points >= OOPS_MILITARY_RANKS[i].minPoints) {
      current = OOPS_MILITARY_RANKS[i];
      next = OOPS_MILITARY_RANKS[i + 1] || null;
      break;
    }
  }

  let progressPct = 100;
  if (next) {
    const span = next.minPoints - current.minPoints;
    const earned = points - current.minPoints;
    progressPct = span > 0 ? Math.max(0, Math.min(100, Math.round((earned / span) * 100))) : 100;
  }

  return { current, next, progressPct };
}
