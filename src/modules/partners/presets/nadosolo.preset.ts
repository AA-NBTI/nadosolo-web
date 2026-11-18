import { createClient } from '@/lib/supabase/client';
import type { BudgetTier, DietaryRestriction } from '@/engine';
import { getAppConfig, saveAppConfig } from '@/lib/appConfigDb';
import { fetchPromoCodes, savePromoCodesDb } from '@/lib/promoCodes';
import { createPartnersEngine } from '../core';
import {
  PartnerApplicationRecord,
  PartnersModulePreset,
  PartnersStorageDriver,
  SupplierApplicationRecord,
} from '../types';

export interface NadoSoloVenueFields {
  cityCode: string;
  budgetTier: BudgetTier;
  maxTablesPerNight: number;
  supportedDietary: DietaryRestriction[];
}

export const NADOSOLO_PARTNERS_PRESET: PartnersModulePreset = {
  namespace: 'nadosolo',
  brandName: '나도솔로',
  referralTargetPath: '/meetup',
  defaultCommissionRate: 10,
  defaultDiscountRate: 10,
  maxEventLogs: 500,
  storageKeys: {
    applicationsTable: 'affiliate_applications',
    applicationsLocalKey: 'nadosolo_affiliate_apps_v1',
    metaConfigKey: 'affiliate_partner_meta',
    metaLocalKey: 'nadosolo_affiliate_meta_v1',
    eventsConfigKey: 'affiliate_events',
    eventsLocalKey: 'nadosolo_affiliate_events_v1',
    payoutsConfigKey: 'affiliate_payouts',
    payoutsLocalKey: 'nadosolo_affiliate_payouts_v1',
    suppliersConfigKey: 'venue_partner_applications',
    suppliersLocalKey: 'nadosolo_venue_apps_v1',
    sessionKey: 'nadosolo_partner_session_v1',
    referralStorageKey: 'nadosolo_referral_code',
  },
};

const { applicationsTable, applicationsLocalKey } = NADOSOLO_PARTNERS_PRESET.storageKeys;

export const nadosoloPartnersDriver: PartnersStorageDriver<NadoSoloVenueFields> = {
  getConfig: getAppConfig,
  saveConfig: saveAppConfig,

  async listApplications(): Promise<PartnerApplicationRecord[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(applicationsTable)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error && data) {
        return data.map((r: any) => ({
          id: r.id,
          partnerName: r.partner_name,
          channelUrl: r.channel_url,
          contactEmail: r.contact_email,
          code: String(r.code || '').toUpperCase(),
          status: (r.status || 'PENDING') as PartnerApplicationRecord['status'],
          createdAt: r.created_at,
        }));
      }
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        const local = JSON.parse(localStorage.getItem(applicationsLocalKey) || '[]');
        if (Array.isArray(local)) return local;
      } catch {}
    }
    return [];
  },

  async insertApplication(params) {
    if (typeof window !== 'undefined') {
      try {
        const prev = JSON.parse(localStorage.getItem(applicationsLocalKey) || '[]');
        const next = Array.isArray(prev) ? prev : [];
        next.unshift(params);
        localStorage.setItem(applicationsLocalKey, JSON.stringify(next));
      } catch {}
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from(applicationsTable).insert({
        partner_name: params.partnerName,
        channel_url: params.channelUrl,
        contact_email: params.contactEmail,
        code: params.code,
        status: params.status,
      });
      if (error) return { ok: false, error: error.message };
    } catch (e: any) {
      return { ok: false, error: e?.message || '등록 중 오류가 발생했습니다.' };
    }
    return { ok: true };
  },

  async updateApplicationStatus(id, status) {
    const supabase = createClient();
    await supabase.from(applicationsTable).update({ status }).eq('id', id);
  },

  async deleteApplication(app) {
    const code = app.code.trim().toUpperCase();
    if (app.id) {
      try {
        const supabase = createClient();
        await supabase.from(applicationsTable).delete().eq('id', app.id);
      } catch {}
    }
    if (typeof window !== 'undefined') {
      try {
        const prev = JSON.parse(localStorage.getItem(applicationsLocalKey) || '[]');
        if (Array.isArray(prev)) {
          const next = prev.filter((item: any) => String(item.code || '').toUpperCase() !== code);
          localStorage.setItem(applicationsLocalKey, JSON.stringify(next));
        }
      } catch {}
    }
  },

  promoAdapter: {
    fetchPromos: fetchPromoCodes,
    savePromos: savePromoCodesDb,
  },

  normalizeSupplier(raw: any): SupplierApplicationRecord<NadoSoloVenueFields> {
    if (raw && raw.custom && raw.supplierName) {
      return raw as SupplierApplicationRecord<NadoSoloVenueFields>;
    }
    return {
      applicationId: raw.applicationId,
      supplierName: raw.venueName || raw.supplierName || '',
      contactEmail: raw.contactEmail || '',
      passwordPin: raw.passwordPin || '',
      status: raw.status || 'PENDING',
      approvedSupplierId: raw.approvedVenueId || raw.approvedSupplierId,
      createdAt: raw.createdAt || new Date().toISOString(),
      custom: {
        cityCode: raw.cityCode || 'SEOUL_SEONGSU',
        budgetTier: raw.budgetTier || '$$',
        maxTablesPerNight: raw.maxTablesPerNight ?? 2,
        supportedDietary: raw.supportedDietary || ['NONE'],
      },
    };
  },
};

export const nadosoloPartnersEngine = createPartnersEngine<NadoSoloVenueFields>(
  NADOSOLO_PARTNERS_PRESET,
  nadosoloPartnersDriver
);
