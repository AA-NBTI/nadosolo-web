import { createClient } from '@/lib/supabase/client';
import { getAppConfig, saveAppConfig } from '@/lib/appConfigDb';
import { createBillingEngine } from '../core';
import { BillingModulePreset, BillingStorageDriver } from '../types';

export const NADOSOLO_BILLING_PRESET: BillingModulePreset = {
  namespace: 'nadosolo',
  defaultPromos: [
    { code: 'NADOSOLO10', type: 'PERCENT', value: 10, active: true },
    { code: 'FRIEND20', type: 'PERCENT', value: 20, active: true },
    { code: 'WELCOME5000', type: 'FIXED', value: 5000, active: true },
  ],
  maxUsageLogs: 200,
  maxLedgerEntries: 300,
  cancellationRule: {
    freeCancelHours: 48,
    rolloverAllowedHours: 24,
    penaltyHours: 24,
    creditUnitName: '참가권 1매',
    multiPassRefundRule: {
      singleUnitPriceKrw: 30000,
      nonRefundableAfterUsedCount: 2,
    },
  },
  storageKeys: {
    promoConfigKey: 'promo_codes',
    promoLocalKey: 'nadosolo_promo_codes_v1',
    promoUsageConfigKey: 'promo_usage_logs',
    promoUsageLocalKey: 'nadosolo_promo_usage_logs_v1',
    creditLedgerConfigKey: 'credit_ledger',
    creditLedgerLocalKey: 'nadosolo_credit_ledger_v1',
  },
};

export const nadosoloBillingDriver: BillingStorageDriver = {
  getConfig: getAppConfig,
  saveConfig: saveAppConfig,

  async getUserCreditBalance(userId: string): Promise<number> {
    if (!userId) return 0;
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('self_domain_scores')
        .eq('id', userId)
        .maybeSingle();
      const raw = (data?.self_domain_scores as Record<string, any> | undefined)?._ticket_credits;
      return typeof raw === 'number' && raw > 0 ? raw : 0;
    } catch {
      return 0;
    }
  },

  async setUserCreditBalance(userId: string, nextBalance: number): Promise<boolean> {
    if (!userId) return false;
    try {
      const supabase = createClient();
      const { data: existing } = await supabase
        .from('profiles')
        .select('self_domain_scores')
        .eq('id', userId)
        .maybeSingle();
      if (!existing) return false;
      const prevScores = (existing.self_domain_scores || {}) as Record<string, any>;
      const { error } = await supabase
        .from('profiles')
        .update({
          self_domain_scores: {
            ...prevScores,
            _ticket_credits: Math.max(0, nextBalance),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      return !error;
    } catch {
      return false;
    }
  },
};

export const nadosoloBillingEngine = createBillingEngine(
  NADOSOLO_BILLING_PRESET,
  nadosoloBillingDriver
);
