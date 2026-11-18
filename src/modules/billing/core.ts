import {
  BillingModulePreset,
  BillingPromoCode,
  BillingStorageDriver,
  CancellationPolicyDecision,
  CreditLedgerEntry,
  CreditReason,
  PromoUsageRecord,
} from './types';

export function createBillingEngine(
  preset: BillingModulePreset,
  driver: BillingStorageDriver
) {
  const keys = preset.storageKeys;
  const maxUsageLogs = preset.maxUsageLogs ?? 200;
  const maxLedgerEntries = preset.maxLedgerEntries ?? 300;
  const rule = preset.cancellationRule;

  // --------------------------------------------------------------------------
  // 1. 프로모션 쿠폰 관리 · 할인 계산
  // --------------------------------------------------------------------------
  function getCachedPromos(): BillingPromoCode[] {
    if (typeof window === 'undefined') return preset.defaultPromos;
    try {
      const raw = localStorage.getItem(keys.promoLocalKey);
      if (!raw) return preset.defaultPromos;
      const parsed = JSON.parse(raw) as BillingPromoCode[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : preset.defaultPromos;
    } catch {
      return preset.defaultPromos;
    }
  }

  function savePromos(list: BillingPromoCode[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(keys.promoLocalKey, JSON.stringify(list));
      } catch {}
    }
    void driver.saveConfig(keys.promoConfigKey, keys.promoLocalKey, list);
  }

  async function fetchPromos(): Promise<BillingPromoCode[]> {
    const list = await driver.getConfig<BillingPromoCode[]>(
      keys.promoConfigKey,
      keys.promoLocalKey,
      preset.defaultPromos
    );
    return Array.isArray(list) && list.length > 0 ? list : preset.defaultPromos;
  }

  async function savePromosDb(list: BillingPromoCode[]): Promise<boolean> {
    return driver.saveConfig(keys.promoConfigKey, keys.promoLocalKey, list);
  }

  function resolvePromoFromList(
    code: string,
    basePrice: number,
    list: BillingPromoCode[]
  ): { discountKrw: number; notice: string } | null {
    const hit = list.find((p) => p.active && p.code === code.trim().toUpperCase());
    if (!hit) return null;
    const discountKrw =
      hit.type === 'PERCENT' ? Math.round((basePrice * hit.value) / 100) : hit.value;
    const notice =
      hit.type === 'PERCENT'
        ? `${hit.value}% 할인 (-₩${discountKrw.toLocaleString()}) 적용`
        : `₩${discountKrw.toLocaleString()} 할인 적용`;
    return { discountKrw, notice };
  }

  function resolvePromo(
    code: string,
    basePrice: number
  ): { discountKrw: number; notice: string } | null {
    return resolvePromoFromList(code, basePrice, getCachedPromos());
  }

  // --------------------------------------------------------------------------
  // 2. 프로모션 사용 원장
  // --------------------------------------------------------------------------
  async function fetchPromoUsageLogs(): Promise<PromoUsageRecord[]> {
    const logs = await driver.getConfig<PromoUsageRecord[]>(
      keys.promoUsageConfigKey,
      keys.promoUsageLocalKey,
      []
    );
    return Array.isArray(logs) ? logs : [];
  }

  async function recordPromoUsage(params: {
    orderId: string;
    eventId: string;
    promo: string;
    amount: string;
    userId?: string;
  }): Promise<void> {
    const promo = params.promo.trim().toUpperCase();
    if (!promo) return;

    const list = await fetchPromoUsageLogs();
    if (list.some((x) => x.orderId === params.orderId && x.promo === promo)) {
      return;
    }

    const next: PromoUsageRecord[] = [
      {
        orderId: params.orderId,
        eventId: params.eventId,
        promo,
        amount: params.amount,
        userId: params.userId || 'GUEST',
        at: new Date().toISOString(),
      },
      ...list,
    ].slice(0, maxUsageLogs);

    await driver.saveConfig(keys.promoUsageConfigKey, keys.promoUsageLocalKey, next);
  }

  function computePromoUsageCounts(logs: PromoUsageRecord[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const entry of logs) {
      if (entry.promo) {
        counts[entry.promo] = (counts[entry.promo] || 0) + 1;
      }
    }
    return counts;
  }

  // --------------------------------------------------------------------------
  // 3. 취소 · 이월 규정 판정기
  // --------------------------------------------------------------------------
  function evaluateCancellationPolicy(
    action: 'CANCEL' | 'ROLLOVER',
    targetDateIso?: string
  ): CancellationPolicyDecision {
    const unit = rule.creditUnitName;
    if (targetDateIso) {
      const targetMs = new Date(targetDateIso).getTime();
      if (!Number.isNaN(targetMs)) {
        const hoursLeft = (targetMs - Date.now()) / (1000 * 60 * 60);
        if (hoursLeft < rule.penaltyHours) {
          return {
            grantCredit: false,
            policyNote: `${rule.penaltyHours}시간 이내 임박 취소(크레딧 미보존)`,
            hoursRemaining: hoursLeft,
          };
        }
        if (hoursLeft < rule.freeCancelHours) {
          const allowed = action === 'ROLLOVER' && hoursLeft >= rule.rolloverAllowedHours;
          return {
            grantCredit: allowed,
            policyNote:
              action === 'ROLLOVER'
                ? `${rule.freeCancelHours}시간 이내 이월(${unit} 보존)`
                : `${rule.freeCancelHours}시간 이내 취소`,
            hoursRemaining: hoursLeft,
          };
        }
        return {
          grantCredit: true,
          policyNote:
            action === 'ROLLOVER' ? `다음 회차 이월(${unit} 보존)` : `무료 취소(${unit} 보존)`,
          hoursRemaining: hoursLeft,
        };
      }
    }

    return {
      grantCredit: true,
      policyNote:
        action === 'ROLLOVER' ? `다음 회차 이월(${unit} 보존)` : `무료 취소(${unit} 보존)`,
    };
  }

  // --------------------------------------------------------------------------
  // 4. 크레딧 지갑 & 원장
  // --------------------------------------------------------------------------
  async function getCreditBalance(userId: string): Promise<number> {
    const bal = await driver.getUserCreditBalance(userId);
    return bal > 0 ? bal : 0;
  }

  async function fetchCreditLedger(): Promise<CreditLedgerEntry[]> {
    const list = await driver.getConfig<CreditLedgerEntry[]>(
      keys.creditLedgerConfigKey,
      keys.creditLedgerLocalKey,
      []
    );
    return Array.isArray(list) ? list : [];
  }

  async function adjustCredits(
    userId: string,
    delta: number,
    meta?: { reason?: CreditReason; itemId?: string; note?: string }
  ): Promise<number> {
    const current = await getCreditBalance(userId);
    const nextBalance = Math.max(0, current + delta);
    const saved = await driver.setUserCreditBalance(userId, nextBalance);
    if (!saved) return current;

    if (delta !== 0) {
      const ledger = await fetchCreditLedger();
      const entry: CreditLedgerEntry = {
        id: `CRD_${Date.now()}`,
        userId,
        delta,
        balanceAfter: nextBalance,
        reason: meta?.reason ?? (delta > 0 ? 'ADMIN_ADJUST' : 'REDEEM'),
        itemId: meta?.itemId,
        note: meta?.note,
        at: new Date().toISOString(),
      };
      await driver.saveConfig(
        keys.creditLedgerConfigKey,
        keys.creditLedgerLocalKey,
        [entry, ...ledger].slice(0, maxLedgerEntries)
      );
    }

    return nextBalance;
  }

  return {
    preset,
    getCachedPromos,
    savePromos,
    fetchPromos,
    savePromosDb,
    resolvePromoFromList,
    resolvePromo,
    fetchPromoUsageLogs,
    recordPromoUsage,
    computePromoUsageCounts,
    evaluateCancellationPolicy,
    getCreditBalance,
    adjustCredits,
    fetchCreditLedger,
  };
}
