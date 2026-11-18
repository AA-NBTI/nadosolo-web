import {
  type BillingPromoCode,
  NADOSOLO_BILLING_PRESET,
  nadosoloBillingEngine,
} from '@/modules/billing';

export type PromoCode = BillingPromoCode;

export const PROMO_STORAGE_KEY = NADOSOLO_BILLING_PRESET.storageKeys.promoLocalKey;
export const DEFAULT_PROMO_CODES = NADOSOLO_BILLING_PRESET.defaultPromos;

export const getPromoCodes = nadosoloBillingEngine.getCachedPromos;
export const savePromoCodes = nadosoloBillingEngine.savePromos;
export const fetchPromoCodes = nadosoloBillingEngine.fetchPromos;
export const savePromoCodesDb = nadosoloBillingEngine.savePromosDb;
export const resolvePromoFromList = nadosoloBillingEngine.resolvePromoFromList;
export const resolvePromo = nadosoloBillingEngine.resolvePromo;
