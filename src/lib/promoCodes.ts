export interface PromoCode {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  active: boolean;
}

export const PROMO_STORAGE_KEY = 'nadosolo_promo_codes_v1';

export const DEFAULT_PROMO_CODES: PromoCode[] = [
  { code: 'NADOSOLO10', type: 'PERCENT', value: 10, active: true },
  { code: 'FRIEND20', type: 'PERCENT', value: 20, active: true },
  { code: 'WELCOME5000', type: 'FIXED', value: 5000, active: true },
];

export function getPromoCodes(): PromoCode[] {
  if (typeof window === 'undefined') return DEFAULT_PROMO_CODES;
  try {
    const raw = localStorage.getItem(PROMO_STORAGE_KEY);
    if (!raw) return DEFAULT_PROMO_CODES;
    const parsed = JSON.parse(raw) as PromoCode[];
    return Array.isArray(parsed) ? parsed : DEFAULT_PROMO_CODES;
  } catch {
    return DEFAULT_PROMO_CODES;
  }
}

export function savePromoCodes(list: PromoCode[]) {
  localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(list));
}

export function resolvePromo(
  code: string,
  basePrice: number
): { discountKrw: number; notice: string } | null {
  const hit = getPromoCodes().find((p) => p.active && p.code === code.trim().toUpperCase());
  if (!hit) return null;
  const discountKrw = hit.type === 'PERCENT' ? Math.round((basePrice * hit.value) / 100) : hit.value;
  const notice =
    hit.type === 'PERCENT'
      ? `${hit.value}% 할인 (-₩${discountKrw.toLocaleString()}) 적용`
      : `₩${discountKrw.toLocaleString()} 할인 적용`;
  return { discountKrw, notice };
}
