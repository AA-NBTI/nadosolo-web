import type { BudgetTier, DietaryRestriction } from '@/engine';
import {
  type NadoSoloVenueFields,
  type PartnerApplicationRecord,
  type PartnerEventRecord,
  type PartnerMetaConfig,
  type PartnerPayoutRecord,
  type SupplierApplicationRecord,
  nadosoloPartnersEngine,
} from '@/modules/partners';

export type AffiliateApplicationRow = PartnerApplicationRecord;
export type PartnerMeta = PartnerMetaConfig;
export type AffiliateEventLog = PartnerEventRecord;
export type AffiliatePayoutRecord = PartnerPayoutRecord;

export interface VenuePartnerApplication {
  applicationId: string;
  venueName: string;
  contactEmail: string;
  passwordPin: string;
  cityCode: string;
  budgetTier: BudgetTier;
  maxTablesPerNight: number;
  supportedDietary: DietaryRestriction[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedVenueId?: string;
  createdAt: string;
}

function toVenueApp(
  rec: SupplierApplicationRecord<NadoSoloVenueFields>
): VenuePartnerApplication {
  return {
    applicationId: rec.applicationId,
    venueName: rec.supplierName,
    contactEmail: rec.contactEmail,
    passwordPin: rec.passwordPin,
    cityCode: rec.custom.cityCode,
    budgetTier: rec.custom.budgetTier,
    maxTablesPerNight: rec.custom.maxTablesPerNight,
    supportedDietary: rec.custom.supportedDietary,
    status: rec.status,
    approvedVenueId: rec.approvedSupplierId,
    createdAt: rec.createdAt,
  };
}

export const fetchAffiliateApplications = nadosoloPartnersEngine.fetchApplications;
export const fetchPartnerMetaMap = nadosoloPartnersEngine.fetchMetaMap;
export const savePartnerMetaMap = nadosoloPartnersEngine.saveMetaMap;
export const fetchAffiliateEvents = nadosoloPartnersEngine.fetchEvents;
export const fetchAffiliatePayouts = nadosoloPartnersEngine.fetchPayouts;
export const saveAffiliatePayouts = nadosoloPartnersEngine.savePayouts;
export const updateAffiliateStatusAndPromo = nadosoloPartnersEngine.updateStatusAndPromo;
export const createAffiliateApplication = nadosoloPartnersEngine.createApplication;
export const authenticateCreatorPartner = nadosoloPartnersEngine.authenticateCreator;
export const requestCreatorPayout = nadosoloPartnersEngine.requestPayout;
export const clearCreatorPayoutRequest = nadosoloPartnersEngine.clearPayoutRequest;
export const deleteAffiliateApplication = nadosoloPartnersEngine.deleteApplication;
export const deleteAffiliatePayout = nadosoloPartnersEngine.deletePayout;
export const trackAffiliateClick = nadosoloPartnersEngine.trackClick;
export const trackAffiliatePurchase = nadosoloPartnersEngine.trackPurchase;

export async function fetchVenueApplications(): Promise<VenuePartnerApplication[]> {
  const list = await nadosoloPartnersEngine.fetchSupplierApplications();
  return list.map(toVenueApp);
}

export async function createVenueApplication(params: {
  venueName: string;
  contactEmail: string;
  passwordPin: string;
  cityCode: string;
  budgetTier: BudgetTier;
  maxTablesPerNight: number;
  supportedDietary: DietaryRestriction[];
}): Promise<{ ok: boolean; error?: string; application?: VenuePartnerApplication }> {
  const res = await nadosoloPartnersEngine.createSupplierApplication({
    supplierName: params.venueName,
    contactEmail: params.contactEmail,
    passwordPin: params.passwordPin,
    custom: {
      cityCode: params.cityCode,
      budgetTier: params.budgetTier,
      maxTablesPerNight: params.maxTablesPerNight,
      supportedDietary: params.supportedDietary,
    },
  });
  return {
    ok: res.ok,
    error: res.error,
    application: res.application ? toVenueApp(res.application) : undefined,
  };
}

export async function updateVenueApplicationStatus(
  applicationId: string,
  status: 'APPROVED' | 'REJECTED',
  approvedVenueId?: string
): Promise<VenuePartnerApplication[]> {
  const next = await nadosoloPartnersEngine.updateSupplierStatus(
    applicationId,
    status,
    approvedVenueId
  );
  return next.map(toVenueApp);
}

export async function authenticateVenuePartner(
  nameOrEmail: string,
  passwordPin: string
): Promise<{
  ok: boolean;
  error?: string;
  application?: VenuePartnerApplication;
}> {
  const res = await nadosoloPartnersEngine.authenticateSupplier(nameOrEmail, passwordPin);
  return {
    ok: res.ok,
    error: res.error,
    application: res.application ? toVenueApp(res.application) : undefined,
  };
}
