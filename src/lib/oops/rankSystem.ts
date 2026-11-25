import type { OopsLocale } from './i18n';

export type RankGroup = 'ENLISTED' | 'NCO' | 'COMPANY_OFFICER' | 'FIELD_OFFICER' | 'GENERAL';

export interface MilitaryRank {
  level: number;
  code: string;
  group: RankGroup;
  minPoints: number;
  stars?: number;
  insignia: string;
  names: Record<OopsLocale, string>;
  criteria: Record<OopsLocale, string>;
}

export const RANK_GROUP_LABELS: Record<RankGroup, Record<OopsLocale, string>> = {
  ENLISTED: { ko: '병사', en: 'Enlisted', ja: '兵士', zh: '士兵', es: 'Tropa' },
  NCO: { ko: '부사관', en: 'NCO', ja: '下士官', zh: '士官', es: 'Suboficiales' },
  COMPANY_OFFICER: { ko: '위관장교', en: 'Company Officer', ja: '尉官', zh: '尉官', es: 'Oficiales Subalternos' },
  FIELD_OFFICER: { ko: '영관장교', en: 'Field Officer', ja: '佐官', zh: '校官', es: 'Oficiales Superiores' },
  GENERAL: { ko: '장성 (1~5스타)', en: 'General (1–5 Star)', ja: '将官 (1~5星)', zh: '将官 (1~5星)', es: 'Generales (1–5★)' },
};

/**
 * OOPS AI 저항군 풀 계급 체계 (총 20계급: 훈련병 ~ 5스타 원수)
 */
export const OOPS_MILITARY_RANKS: MilitaryRank[] = [
  // 1. 병사 (Enlisted)
  {
    level: 1,
    code: 'RECRUIT',
    group: 'ENLISTED',
    minPoints: 0,
    insignia: '▬',
    names: { ko: '훈련병', en: 'Recruit', ja: '訓練兵', zh: '新兵', es: 'Recluta' },
    criteria: { ko: '초소 등록 (0 XP)', en: 'Outpost entry (0 XP)', ja: '哨所登録 (0 XP)', zh: '哨所注册 (0 XP)', es: 'Registro (0 XP)' },
  },
  {
    level: 2,
    code: 'PVT',
    group: 'ENLISTED',
    minPoints: 50,
    insignia: '━',
    names: { ko: '이병', en: 'Private', ja: '二等兵', zh: '列兵', es: 'Soldado' },
    criteria: { ko: '50 XP', en: '50 XP', ja: '50 XP', zh: '50 XP', es: '50 XP' },
  },
  {
    level: 3,
    code: 'PFC',
    group: 'ENLISTED',
    minPoints: 150,
    insignia: '═',
    names: { ko: '일병', en: 'PFC', ja: '一等兵', zh: '上等兵', es: 'Cabo' },
    criteria: { ko: '150 XP', en: '150 XP', ja: '150 XP', zh: '150 XP', es: '150 XP' },
  },
  {
    level: 4,
    code: 'CPL',
    group: 'ENLISTED',
    minPoints: 300,
    insignia: '☰',
    names: { ko: '상병', en: 'Corporal', ja: '上等兵', zh: '下士', es: 'Cabo 1º' },
    criteria: { ko: '300 XP', en: '300 XP', ja: '300 XP', zh: '300 XP', es: '300 XP' },
  },
  {
    level: 5,
    code: 'SGT',
    group: 'ENLISTED',
    minPoints: 500,
    insignia: '≣',
    names: { ko: '병장', en: 'Sergeant', ja: '兵長', zh: '中士', es: 'Sargento' },
    criteria: { ko: '500 XP', en: '500 XP', ja: '500 XP', zh: '500 XP', es: '500 XP' },
  },

  // 2. 부사관 (NCO) - 하사, 중사, 상사, 원사
  {
    level: 6,
    code: 'SSG',
    group: 'NCO',
    minPoints: 800,
    insignia: '▼',
    names: { ko: '하사', en: 'Staff Sgt', ja: '三等軍曹', zh: '下士班长', es: 'Sargento 1º' },
    criteria: { ko: '800 XP', en: '800 XP', ja: '800 XP', zh: '800 XP', es: '800 XP' },
  },
  {
    level: 7,
    code: 'SFC',
    group: 'NCO',
    minPoints: 1200,
    insignia: '▼▼',
    names: { ko: '중사', en: 'Sgt 1st Class', ja: '二等軍曹', zh: '中士长', es: 'Brigada' },
    criteria: { ko: '1,200 XP', en: '1,200 XP', ja: '1,200 XP', zh: '1,200 XP', es: '1,200 XP' },
  },
  {
    level: 8,
    code: 'MSG',
    group: 'NCO',
    minPoints: 1800,
    insignia: '▼▼▼',
    names: { ko: '상사', en: 'Master Sgt', ja: '一等軍曹', zh: '上士长', es: 'Subteniente' },
    criteria: { ko: '1,800 XP', en: '1,800 XP', ja: '1,800 XP', zh: '1,800 XP', es: '1,800 XP' },
  },
  {
    level: 9,
    code: 'SGM',
    group: 'NCO',
    minPoints: 2600,
    insignia: '★▼',
    names: { ko: '원사', en: 'Sgt Major', ja: '曹長', zh: '军士长', es: 'Suboficial Mayor' },
    criteria: { ko: '2,600 XP', en: '2,600 XP', ja: '2,600 XP', zh: '2,600 XP', es: '2,600 XP' },
  },

  // 3. 위관 장교 (Company Officer) - 소위, 중위, 대위
  {
    level: 10,
    code: '2LT',
    group: 'COMPANY_OFFICER',
    minPoints: 3600,
    insignia: '◆',
    names: { ko: '소위', en: '2nd Lt.', ja: '少尉', zh: '少尉', es: 'Alférez' },
    criteria: { ko: '3,600 XP', en: '3,600 XP', ja: '3,600 XP', zh: '3,600 XP', es: '3,600 XP' },
  },
  {
    level: 11,
    code: '1LT',
    group: 'COMPANY_OFFICER',
    minPoints: 5000,
    insignia: '◆◆',
    names: { ko: '중위', en: '1st Lt.', ja: '中尉', zh: '中尉', es: 'Teniente' },
    criteria: { ko: '5,000 XP', en: '5,000 XP', ja: '5,000 XP', zh: '5,000 XP', es: '5,000 XP' },
  },
  {
    level: 12,
    code: 'CPT',
    group: 'COMPANY_OFFICER',
    minPoints: 7000,
    insignia: '◆◆◆',
    names: { ko: '대위', en: 'Captain', ja: '大尉', zh: '上尉', es: 'Capitán' },
    criteria: { ko: '7,000 XP', en: '7,000 XP', ja: '7,000 XP', zh: '7,000 XP', es: '7,000 XP' },
  },

  // 4. 영관 장교 (Field Officer) - 소령, 중령, 대령
  {
    level: 13,
    code: 'MAJ',
    group: 'FIELD_OFFICER',
    minPoints: 10000,
    insignia: '❖',
    names: { ko: '소령', en: 'Major', ja: '少佐', zh: '少校', es: 'Comandante' },
    criteria: { ko: '10,000 XP', en: '10,000 XP', ja: '10,000 XP', zh: '10,000 XP', es: '10,000 XP' },
  },
  {
    level: 14,
    code: 'LTC',
    group: 'FIELD_OFFICER',
    minPoints: 14000,
    insignia: '❖❖',
    names: { ko: '중령', en: 'Lt. Col.', ja: '中佐', zh: '中校', es: 'Tte. Coronel' },
    criteria: { ko: '14,000 XP', en: '14,000 XP', ja: '14,000 XP', zh: '14,000 XP', es: '14,000 XP' },
  },
  {
    level: 15,
    code: 'COL',
    group: 'FIELD_OFFICER',
    minPoints: 20000,
    insignia: '❖❖❖',
    names: { ko: '대령', en: 'Colonel', ja: '大佐', zh: '上校', es: 'Coronel' },
    criteria: { ko: '20,000 XP', en: '20,000 XP', ja: '20,000 XP', zh: '20,000 XP', es: '20,000 XP' },
  },

  // 5. 장성 (General: 1스타 ~ 5스타)
  {
    level: 16,
    code: 'BG',
    group: 'GENERAL',
    minPoints: 30000,
    stars: 1,
    insignia: '★',
    names: { ko: '준장 (1스타)', en: 'Brig. Gen. (1★)', ja: '准将 (1星)', zh: '准将 (1星)', es: 'Gral. Brigada (1★)' },
    criteria: { ko: '30,000 XP · 지부 지휘', en: '30,000 XP', ja: '30,000 XP', zh: '30,000 XP', es: '30,000 XP' },
  },
  {
    level: 17,
    code: 'MG',
    group: 'GENERAL',
    minPoints: 45000,
    stars: 2,
    insignia: '★★',
    names: { ko: '소장 (2스타)', en: 'Maj. Gen. (2★)', ja: '少将 (2星)', zh: '少将 (2星)', es: 'Gral. División (2★)' },
    criteria: { ko: '45,000 XP · 사단 지휘', en: '45,000 XP', ja: '45,000 XP', zh: '45,000 XP', es: '45,000 XP' },
  },
  {
    level: 18,
    code: 'LTG',
    group: 'GENERAL',
    minPoints: 70000,
    stars: 3,
    insignia: '★★★',
    names: { ko: '중장 (3스타)', en: 'Lt. Gen. (3★)', ja: '中将 (3星)', zh: '中将 (3星)', es: 'Tte. General (3★)' },
    criteria: { ko: '70,000 XP · 권역 사령', en: '70,000 XP', ja: '70,000 XP', zh: '70,000 XP', es: '70,000 XP' },
  },
  {
    level: 19,
    code: 'GEN',
    group: 'GENERAL',
    minPoints: 100000,
    stars: 4,
    insignia: '★★★★',
    names: { ko: '대장 (4스타)', en: 'General (4★)', ja: '大将 (4星)', zh: '上将 (4星)', es: 'General (4★)' },
    criteria: { ko: '100,000 XP · 총참모', en: '100,000 XP', ja: '100,000 XP', zh: '100,000 XP', es: '100,000 XP' },
  },
  {
    level: 20,
    code: 'GA',
    group: 'GENERAL',
    minPoints: 200000,
    stars: 5,
    insignia: '★★★★★',
    names: { ko: '원수 (5스타)', en: '5-Star Marshal', ja: '元帥 (5星)', zh: '五星元帅', es: 'Mariscal (5★)' },
    criteria: { ko: '이사회 추대 · 최고지휘', en: 'Council Mandate', ja: '理事会推戴', zh: '理事会任命', es: 'Mandato Supremo' },
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
