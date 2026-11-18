/**
 * 범용 파트너스(어필리에이트 · B2B 공급사) 모듈 코어 타입 정의
 * 특정 서비스 도메인에 종속되지 않는 순수 표준 계약.
 */

export interface PartnersStorageKeys {
  applicationsTable: string;
  applicationsLocalKey: string;
  metaConfigKey: string;
  metaLocalKey: string;
  eventsConfigKey: string;
  eventsLocalKey: string;
  payoutsConfigKey: string;
  payoutsLocalKey: string;
  suppliersConfigKey: string;
  suppliersLocalKey: string;
  sessionKey: string;
  referralStorageKey: string;
}

export interface PartnersModulePreset {
  namespace: string;
  brandName: string;
  referralTargetPath: string;
  defaultCommissionRate: number;
  defaultDiscountRate: number;
  maxEventLogs?: number;
  storageKeys: PartnersStorageKeys;
}

export type PartnerStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface PartnerApplicationRecord {
  id?: string;
  partnerName: string;
  channelUrl: string;
  contactEmail: string;
  code: string;
  status: PartnerStatus;
  createdAt: string;
}

export interface PartnerMetaConfig {
  commissionRate: number;
  discountRate: number;
  bankInfo?: string;
  note?: string;
  passwordPin?: string;
  payoutRequestedAt?: string;
}

export interface PartnerEventRecord {
  id: string;
  code: string;
  eventType: 'CLICK' | 'PURCHASE';
  amountKrw?: number;
  commissionKrw?: number;
  userId?: string;
  orderId?: string;
  blockedSelfReferral?: boolean;
  at: string;
}

export interface PartnerPayoutRecord {
  id: string;
  code: string;
  partnerName: string;
  amountKrw: number;
  bankInfo: string;
  note?: string;
  paidAt: string;
}

export interface PartnerComputedMetrics {
  clicks: number;
  purchases: number;
  blockedCount: number;
  conversionRatePercent: number;
  grossRevenueKrw: number;
  totalCommissionKrw: number;
  paidTotalKrw: number;
  balanceKrw: number;
}

export interface SupplierApplicationRecord<TCustom = Record<string, any>> {
  applicationId: string;
  supplierName: string;
  contactEmail: string;
  passwordPin: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedSupplierId?: string;
  createdAt: string;
  custom: TCustom;
}

export interface PromoCodeItem {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  active: boolean;
}

export interface PromoCodeSyncAdapter {
  fetchPromos: () => Promise<PromoCodeItem[]>;
  savePromos: (list: PromoCodeItem[]) => Promise<boolean>;
}

export interface PartnersStorageDriver<TSupplierCustom = Record<string, any>> {
  getConfig: <T>(key: string, localKey: string, fallback: T) => Promise<T>;
  saveConfig: <T>(key: string, localKey: string, value: T) => Promise<boolean>;
  listApplications: () => Promise<PartnerApplicationRecord[]>;
  insertApplication: (params: {
    partnerName: string;
    channelUrl: string;
    contactEmail: string;
    code: string;
    status: 'PENDING' | 'APPROVED';
    createdAt: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  updateApplicationStatus: (
    id: string,
    status: 'APPROVED' | 'REJECTED'
  ) => Promise<void>;
  deleteApplication: (app: PartnerApplicationRecord) => Promise<void>;
  promoAdapter: PromoCodeSyncAdapter;
  normalizeSupplier?: (raw: any) => SupplierApplicationRecord<TSupplierCustom>;
}
