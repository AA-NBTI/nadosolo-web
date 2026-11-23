import { getAppConfig, saveAppConfig } from '@/lib/appConfigDb';
import { createPartnersEngine } from '../core';
import {
  PartnerApplicationRecord,
  PartnersModulePreset,
  PartnersStorageDriver,
  PromoCodeItem,
} from '../types';

/** 테이블바로 전용 파트너스 프리셋: 나도솔로와 저장 키·세션·추천코드 완전 분리 */
export const TABLEBARO_PARTNERS_PRESET: PartnersModulePreset = {
  namespace: 'tablebaro',
  brandName: '테이블바로',
  referralTargetPath: '/reserve',
  defaultCommissionRate: 5,
  defaultDiscountRate: 0,
  maxEventLogs: 500,
  storageKeys: {
    applicationsTable: 'tablebaro_partner_applications',
    applicationsLocalKey: 'tablebaro_partner_apps_v1',
    metaConfigKey: 'tablebaro_partner_meta',
    metaLocalKey: 'tablebaro_partner_meta_v1',
    eventsConfigKey: 'tablebaro_partner_events',
    eventsLocalKey: 'tablebaro_partner_events_v1',
    payoutsConfigKey: 'tablebaro_partner_payouts',
    payoutsLocalKey: 'tablebaro_partner_payouts_v1',
    suppliersConfigKey: 'tablebaro_partner_suppliers',
    suppliersLocalKey: 'tablebaro_partner_suppliers_v1',
    sessionKey: 'tablebaro_partner_session_v1',
    referralStorageKey: 'tablebaro_referral_code',
  },
};

const K = TABLEBARO_PARTNERS_PRESET.storageKeys;
const PROMO_KEY = 'tablebaro_partner_promos';
const PROMO_LOCAL = 'tablebaro_partner_promos_v1';

type AppRecord = PartnerApplicationRecord;

async function readApps(): Promise<AppRecord[]> {
  const list = await getAppConfig<AppRecord[]>(K.applicationsTable, K.applicationsLocalKey, []);
  return Array.isArray(list) ? list : [];
}

/** 신규 테이블 없이 app_configs 키-값 저장소 사용 (DB 마이그레이션 불필요) */
export const tablebaroPartnersDriver: PartnersStorageDriver = {
  getConfig: getAppConfig,
  saveConfig: saveAppConfig,

  async listApplications() {
    return readApps();
  },

  async insertApplication(params) {
    const apps = await readApps();
    const code = params.code.trim().toUpperCase();
    if (apps.some((a) => String(a.code).toUpperCase() === code)) {
      return { ok: false, error: '이미 사용 중인 추천 코드입니다.' };
    }
    const next: AppRecord[] = [
      { id: `tbp_${Date.now().toString(36)}`, ...params, code },
      ...apps,
    ].slice(0, 500);
    const ok = await saveAppConfig(K.applicationsTable, K.applicationsLocalKey, next);
    return ok ? { ok: true } : { ok: false, error: '저장에 실패했습니다.' };
  },

  async updateApplicationStatus(id, status) {
    const apps = await readApps();
    await saveAppConfig(
      K.applicationsTable,
      K.applicationsLocalKey,
      apps.map((a) => (a.id === id ? { ...a, status } : a))
    );
  },

  async deleteApplication(app) {
    const apps = await readApps();
    const code = app.code.trim().toUpperCase();
    await saveAppConfig(
      K.applicationsTable,
      K.applicationsLocalKey,
      apps.filter((a) => String(a.code).toUpperCase() !== code)
    );
  },

  promoAdapter: {
    fetchPromos: () => getAppConfig<PromoCodeItem[]>(PROMO_KEY, PROMO_LOCAL, []),
    savePromos: (list) => saveAppConfig(PROMO_KEY, PROMO_LOCAL, list),
  },
};

export const tablebaroPartnersEngine = createPartnersEngine(
  TABLEBARO_PARTNERS_PRESET,
  tablebaroPartnersDriver
);
