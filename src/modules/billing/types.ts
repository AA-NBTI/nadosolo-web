/**
 * 범용 빌링 · 프로모션 쿠폰 · 크레딧 지갑 모듈 코어 타입 정의
 * 특정 서비스 도메인에 종속되지 않는 순수 표준 계약.
 */

export interface BillingPromoCode {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  active: boolean;
}

export interface PromoUsageRecord {
  orderId: string;
  eventId: string;
  promo: string;
  amount: string;
  userId: string;
  at: string;
}

export type CreditReason = 'PURCHASE' | 'REDEEM' | 'ROLLOVER' | 'CANCEL_REFUND' | 'ADMIN_ADJUST';

export interface CreditLedgerEntry {
  id: string;
  userId: string;
  delta: number;
  balanceAfter: number;
  reason: CreditReason;
  itemId?: string;
  note?: string;
  at: string;
}

export interface MultiPassRefundRule {
  singleUnitPriceKrw: number;
  nonRefundableAfterUsedCount: number;
}

export interface CancellationPolicyRule {
  freeCancelHours: number;
  rolloverAllowedHours: number;
  penaltyHours: number;
  creditUnitName: string;
  multiPassRefundRule?: MultiPassRefundRule;
}

export interface CancellationPolicyDecision {
  grantCredit: boolean;
  policyNote: string;
  hoursRemaining?: number;
}

export interface BillingStorageKeys {
  promoConfigKey: string;
  promoLocalKey: string;
  promoUsageConfigKey: string;
  promoUsageLocalKey: string;
  creditLedgerConfigKey: string;
  creditLedgerLocalKey: string;
}

export interface BillingModulePreset {
  namespace: string;
  defaultPromos: BillingPromoCode[];
  maxUsageLogs?: number;
  maxLedgerEntries?: number;
  cancellationRule: CancellationPolicyRule;
  storageKeys: BillingStorageKeys;
}

export interface BillingStorageDriver {
  getConfig: <T>(key: string, localKey: string, fallback: T) => Promise<T>;
  saveConfig: <T>(key: string, localKey: string, value: T) => Promise<boolean>;
  getUserCreditBalance: (userId: string) => Promise<number>;
  setUserCreditBalance: (userId: string, nextBalance: number) => Promise<boolean>;
}
