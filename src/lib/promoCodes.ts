import { getAppConfig, saveAppConfig } from '@/lib/appConfigDb';

export interface PromoCode {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  active: boolean;
}

export const PROMO_STORAGE_KEY = 'nadosolo_promo_codes_v1';
const PROMO_CONFIG_KEY = 'promo_codes';

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
  if (typeof window !== 'undefined') {
    localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(list));
  }
  void saveAppConfig(PROMO_CONFIG_KEY, PROMO_STORAGE_KEY, list);
}

export async function fetchPromoCodes(): Promise<PromoCode[]> {
  const list = await getAppConfig<PromoCode[]>(PROMO_CONFIG_KEY, PROMO_STORAGE_KEY, DEFAULT_PROMO_CODES);
  return Array.isArray(list) && list.length > 0 ? list : DEFAULT_PROMO_CODES;
}

export async function savePromoCodesDb(list: PromoCode[]): Promise<boolean> {
  return saveAppConfig(PROMO_CONFIG_KEY, PROMO_STORAGE_KEY, list);
}

export function resolvePromoFromList(
  code: string,
  basePrice: number,
  list: PromoCode[]
): { discountKrw: number; notice: string } | null {
  const hit = list.find((p) => p.active && p.code === code.trim().toUpperCase());
  if (!hit) return null;
  const discountKrw = hit.type === 'PERCENT' ? Math.round((basePrice * hit.value) / 100) : hit.value;
  const notice =
    hit.type === 'PERCENT'
      ? `${hit.value}% 할인 (-₩${discountKrw.toLocaleString()}) 적용`
      : `₩${discountKrw.toLocaleString()} 할인 적용`;
  return { discountKrw, notice };
}

export function resolvePromo(
  code: string,
  basePrice: number
): { discountKrw: number; notice: string } | null {
  return resolvePromoFromList(code, basePrice, getPromoCodes());
}
