import {
  PartnerApplicationRecord,
  PartnerComputedMetrics,
  PartnerEventRecord,
  PartnerMetaConfig,
  PartnerPayoutRecord,
  PartnersModulePreset,
  PartnersStorageDriver,
  SupplierApplicationRecord,
} from './types';

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

function stripSuspendTag(note?: string): string {
  return (note ?? '').replace(/^\[정지\]\s*/g, '').trim();
}

export function createPartnersEngine<TSupplierCustom = Record<string, any>>(
  preset: PartnersModulePreset,
  driver: PartnersStorageDriver<TSupplierCustom>
) {
  const keys = preset.storageKeys;
  const maxEvents = preset.maxEventLogs ?? 500;

  const defaultMeta = (): PartnerMetaConfig => ({
    commissionRate: preset.defaultCommissionRate,
    discountRate: preset.defaultDiscountRate,
  });

  // --------------------------------------------------------------------------
  // 1. 메타 & 출금요청 관리
  // --------------------------------------------------------------------------
  async function fetchMetaMap(): Promise<Record<string, PartnerMetaConfig>> {
    const res = await driver.getConfig<Record<string, PartnerMetaConfig>>(
      keys.metaConfigKey,
      keys.metaLocalKey,
      {}
    );
    return res && typeof res === 'object' ? res : {};
  }

  async function saveMetaMap(map: Record<string, PartnerMetaConfig>): Promise<boolean> {
    return driver.saveConfig(keys.metaConfigKey, keys.metaLocalKey, map);
  }

  async function requestPayout(
    code: string,
    bankInfo: string
  ): Promise<{ ok: boolean; error?: string; meta?: PartnerMetaConfig }> {
    const trimmedBank = bankInfo.trim();
    if (!trimmedBank) {
      return { ok: false, error: '정산 계좌 정보를 입력해 주세요.' };
    }
    const upperCode = code.trim().toUpperCase();
    const metaMap = await fetchMetaMap();
    const updated: PartnerMetaConfig = {
      ...(metaMap[upperCode] || defaultMeta()),
      bankInfo: trimmedBank,
      payoutRequestedAt: new Date().toISOString(),
    };
    metaMap[upperCode] = updated;
    await saveMetaMap(metaMap);
    return { ok: true, meta: updated };
  }

  async function clearPayoutRequest(code: string): Promise<void> {
    const upperCode = code.trim().toUpperCase();
    const metaMap = await fetchMetaMap();
    if (!metaMap[upperCode]) return;
    const { payoutRequestedAt: _removed, ...rest } = metaMap[upperCode];
    metaMap[upperCode] = rest;
    await saveMetaMap(metaMap);
  }

  // --------------------------------------------------------------------------
  // 2. 어필리에이트 파트너 관리 & 인증
  // --------------------------------------------------------------------------
  async function fetchApplications(): Promise<PartnerApplicationRecord[]> {
    return driver.listApplications();
  }

  async function createApplication(params: {
    partnerName: string;
    contactEmail: string;
    channelUrl: string;
    code: string;
    passwordPin?: string;
    status?: 'PENDING' | 'APPROVED';
  }): Promise<{ ok: boolean; error?: string }> {
    const partnerName = params.partnerName.trim();
    const contactEmail = params.contactEmail.trim();
    const channelUrl = (params.channelUrl || '').trim();
    const code = normalizeCode(params.code);
    const passwordPin = (params.passwordPin || '').trim();
    const status = params.status || 'PENDING';

    if (!partnerName || !contactEmail || !code) {
      return { ok: false, error: '파트너명, 이메일, 추천 코드를 모두 입력해 주세요.' };
    }

    const existing = await fetchApplications();
    const dup = existing.some(
      (a) =>
        a.code.toUpperCase() === code ||
        a.contactEmail.trim().toLowerCase() === contactEmail.toLowerCase()
    );
    if (dup) {
      return { ok: false, error: '이미 등록된 추천 코드 또는 이메일입니다.' };
    }

    const insertRes = await driver.insertApplication({
      partnerName,
      channelUrl,
      contactEmail,
      code,
      status,
      createdAt: new Date().toISOString(),
    });
    if (!insertRes.ok) {
      return insertRes;
    }

    if (status === 'APPROVED') {
      const promos = await driver.promoAdapter.fetchPromos();
      if (!promos.some((p) => p.code === code)) {
        await driver.promoAdapter.savePromos([
          ...promos,
          { code, type: 'PERCENT', value: preset.defaultDiscountRate, active: true },
        ]);
      }
    }

    if (passwordPin) {
      const metaMap = await fetchMetaMap();
      metaMap[code] = {
        ...(metaMap[code] || defaultMeta()),
        passwordPin,
      };
      await saveMetaMap(metaMap);
    }

    return { ok: true };
  }

  async function updateStatusAndPromo(
    app: PartnerApplicationRecord,
    nextStatus: 'APPROVED' | 'REJECTED' | 'SUSPENDED',
    meta?: PartnerMetaConfig
  ): Promise<void> {
    const code = app.code.trim().toUpperCase();
    const dbStatus = nextStatus === 'SUSPENDED' ? 'REJECTED' : nextStatus;

    if (app.id) {
      await driver.updateApplicationStatus(app.id, dbStatus);
    }

    const metaMap = await fetchMetaMap();
    const prevMeta = metaMap[code] || defaultMeta();
    const rawNote = stripSuspendTag(meta?.note ?? prevMeta.note);
    const mergedMeta: PartnerMetaConfig = {
      ...prevMeta,
      ...(meta || {}),
      note:
        nextStatus === 'SUSPENDED'
          ? rawNote
            ? `[정지] ${rawNote}`
            : '[정지]'
          : rawNote,
    };
    metaMap[code] = mergedMeta;
    await saveMetaMap(metaMap);

    const promos = await driver.promoAdapter.fetchPromos();
    const exists = promos.some((p) => p.code === code);
    const nextPromos = exists
      ? promos.map((p) =>
          p.code === code
            ? {
                ...p,
                value: mergedMeta.discountRate,
                type: 'PERCENT' as const,
                active: nextStatus === 'APPROVED',
              }
            : p
        )
      : nextStatus === 'APPROVED'
      ? [
          ...promos,
          { code, type: 'PERCENT' as const, value: mergedMeta.discountRate, active: true },
        ]
      : promos;
    await driver.promoAdapter.savePromos(nextPromos);
  }

  async function deleteApplication(app: PartnerApplicationRecord): Promise<void> {
    const code = app.code.trim().toUpperCase();
    await driver.deleteApplication(app);
    const promos = await driver.promoAdapter.fetchPromos();
    if (promos.some((p) => p.code === code)) {
      await driver.promoAdapter.savePromos(promos.filter((p) => p.code !== code));
    }
  }

  async function authenticateCreator(
    codeOrEmail: string,
    passwordPin: string
  ): Promise<{
    ok: boolean;
    error?: string;
    partner?: PartnerApplicationRecord;
    meta?: PartnerMetaConfig;
  }> {
    const key = codeOrEmail.trim().toLowerCase();
    const pin = passwordPin.trim();
    if (!key || !pin) {
      return { ok: false, error: '추천 코드(또는 이메일)와 비밀번호를 모두 입력해 주세요.' };
    }

    const [apps, metaMap] = await Promise.all([fetchApplications(), fetchMetaMap()]);
    const hit = apps.find(
      (a) => a.code.toLowerCase() === key || a.contactEmail.trim().toLowerCase() === key
    );
    if (!hit) {
      return { ok: false, error: '등록된 크리에이터 파트너 계정이 없습니다.' };
    }

    const existingMeta = metaMap[hit.code] || defaultMeta();
    if (existingMeta.passwordPin && existingMeta.passwordPin !== pin) {
      return { ok: false, error: '파트너 비밀번호가 일치하지 않습니다.' };
    }

    if (!existingMeta.passwordPin) {
      const updatedMeta: PartnerMetaConfig = { ...existingMeta, passwordPin: pin };
      metaMap[hit.code] = updatedMeta;
      await saveMetaMap(metaMap);
      return { ok: true, partner: hit, meta: updatedMeta };
    }

    return { ok: true, partner: hit, meta: existingMeta };
  }

  // --------------------------------------------------------------------------
  // 3. 퍼널 · 어트리뷰션 엔진
  // --------------------------------------------------------------------------
  async function fetchEvents(): Promise<PartnerEventRecord[]> {
    const res = await driver.getConfig<PartnerEventRecord[]>(
      keys.eventsConfigKey,
      keys.eventsLocalKey,
      []
    );
    return Array.isArray(res) ? res : [];
  }

  async function trackClick(rawCode: string, userId?: string): Promise<void> {
    const code = rawCode.trim().toUpperCase();
    if (!code || typeof window === 'undefined') return;
    const dedupKey = `${preset.namespace}_ref_clicked_${code}`;
    if (sessionStorage.getItem(dedupKey)) return;
    sessionStorage.setItem(dedupKey, '1');

    const events = await fetchEvents();
    const next: PartnerEventRecord[] = [
      {
        id: `CLK_${Date.now()}`,
        code,
        eventType: 'CLICK' as const,
        userId: userId || 'GUEST',
        at: new Date().toISOString(),
      },
      ...events,
    ].slice(0, maxEvents);
    await driver.saveConfig(keys.eventsConfigKey, keys.eventsLocalKey, next);
  }

  async function trackPurchase(params: {
    code: string;
    orderId: string;
    amountKrw: number;
    userId?: string;
    userEmail?: string;
    userHandle?: string;
  }): Promise<void> {
    const code = params.code.trim().toUpperCase();
    if (!code) return;

    const [events, apps, metaMap] = await Promise.all([
      fetchEvents(),
      fetchApplications(),
      fetchMetaMap(),
    ]);

    if (events.some((e) => e.eventType === 'PURCHASE' && e.orderId === params.orderId)) {
      return;
    }

    const partner = apps.find((a) => a.code === code);
    const meta = metaMap[code] || defaultMeta();
    const normalizedHandle = (params.userHandle || '').replace(/^@/, '').toUpperCase();
    const isSelfReferral = Boolean(
      (partner?.contactEmail &&
        params.userEmail &&
        partner.contactEmail.toLowerCase() === params.userEmail.toLowerCase()) ||
        (normalizedHandle && normalizedHandle === code)
    );

    const commissionKrw = isSelfReferral
      ? 0
      : Math.round((params.amountKrw * meta.commissionRate) / 100);

    const next: PartnerEventRecord[] = [
      {
        id: `PUR_${Date.now()}`,
        code,
        eventType: 'PURCHASE' as const,
        amountKrw: params.amountKrw,
        commissionKrw,
        userId: params.userId || 'GUEST',
        orderId: params.orderId,
        blockedSelfReferral: isSelfReferral,
        at: new Date().toISOString(),
      },
      ...events,
    ].slice(0, maxEvents);

    await driver.saveConfig(keys.eventsConfigKey, keys.eventsLocalKey, next);
  }

  function computePartnerMetrics(
    code: string,
    events: PartnerEventRecord[],
    payouts: PartnerPayoutRecord[]
  ): PartnerComputedMetrics {
    const upper = code.trim().toUpperCase();
    const clicks = events.filter((e) => e.code === upper && e.eventType === 'CLICK').length;
    const pur = events.filter(
      (e) => e.code === upper && e.eventType === 'PURCHASE' && !e.blockedSelfReferral
    );
    const blockedCount = events.filter((e) => e.code === upper && e.blockedSelfReferral).length;
    const grossRevenueKrw = pur.reduce((s, e) => s + (e.amountKrw || 0), 0);
    const totalCommissionKrw = pur.reduce((s, e) => s + (e.commissionKrw || 0), 0);
    const paidTotalKrw = payouts
      .filter((p) => p.code === upper)
      .reduce((s, p) => s + (p.amountKrw || 0), 0);

    return {
      clicks,
      purchases: pur.length,
      blockedCount,
      conversionRatePercent: clicks > 0 ? Math.round((pur.length / clicks) * 100) : 0,
      grossRevenueKrw,
      totalCommissionKrw,
      paidTotalKrw,
      balanceKrw: Math.max(0, totalCommissionKrw - paidTotalKrw),
    };
  }

  // --------------------------------------------------------------------------
  // 4. 정산 지급 원장
  // --------------------------------------------------------------------------
  async function fetchPayouts(): Promise<PartnerPayoutRecord[]> {
    const res = await driver.getConfig<PartnerPayoutRecord[]>(
      keys.payoutsConfigKey,
      keys.payoutsLocalKey,
      []
    );
    return Array.isArray(res) ? res : [];
  }

  async function savePayouts(list: PartnerPayoutRecord[]): Promise<boolean> {
    return driver.saveConfig(keys.payoutsConfigKey, keys.payoutsLocalKey, list);
  }

  async function recordPayout(params: {
    code: string;
    partnerName: string;
    amountKrw: number;
    bankInfo: string;
    note?: string;
  }): Promise<PartnerPayoutRecord[]> {
    const current = await fetchPayouts();
    const rec: PartnerPayoutRecord = {
      id: `PAY_${Date.now()}`,
      code: params.code.trim().toUpperCase(),
      partnerName: params.partnerName,
      amountKrw: params.amountKrw,
      bankInfo: params.bankInfo,
      note: params.note || `${params.code} 정산 지급`,
      paidAt: new Date().toISOString(),
    };
    const next = [rec, ...current];
    await savePayouts(next);
    await clearPayoutRequest(params.code);
    return next;
  }

  async function deletePayout(payoutId: string): Promise<PartnerPayoutRecord[]> {
    const current = await fetchPayouts();
    const next = current.filter((p) => p.id !== payoutId);
    await savePayouts(next);
    return next;
  }

  // --------------------------------------------------------------------------
  // 5. B2B 공급사 (입점 파트너) 제네릭 심사 원장
  // --------------------------------------------------------------------------
  async function fetchSupplierApplications(): Promise<
    SupplierApplicationRecord<TSupplierCustom>[]
  > {
    const raw = await driver.getConfig<any[]>(
      keys.suppliersConfigKey,
      keys.suppliersLocalKey,
      []
    );
    if (!Array.isArray(raw)) return [];
    if (driver.normalizeSupplier) {
      return raw.map((item) => driver.normalizeSupplier!(item));
    }
    return raw as SupplierApplicationRecord<TSupplierCustom>[];
  }

  async function createSupplierApplication(params: {
    supplierName: string;
    contactEmail: string;
    passwordPin: string;
    custom: TSupplierCustom;
  }): Promise<{
    ok: boolean;
    error?: string;
    application?: SupplierApplicationRecord<TSupplierCustom>;
  }> {
    const supplierName = params.supplierName.trim();
    const contactEmail = params.contactEmail.trim();
    const passwordPin = params.passwordPin.trim();
    if (!supplierName || !contactEmail || !passwordPin) {
      return { ok: false, error: '업체명, 담당자 이메일, 비밀번호를 모두 입력해 주세요.' };
    }

    const existing = await fetchSupplierApplications();
    if (
      existing.some(
        (s) =>
          s.supplierName.trim().toLowerCase() === supplierName.toLowerCase() ||
          s.contactEmail.trim().toLowerCase() === contactEmail.toLowerCase()
      )
    ) {
      return { ok: false, error: '이미 등록 신청된 업체명 또는 이메일입니다.' };
    }

    const created: SupplierApplicationRecord<TSupplierCustom> = {
      applicationId: `SAPP_${Date.now().toString().slice(-6)}`,
      supplierName,
      contactEmail,
      passwordPin,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      custom: params.custom,
    };

    await driver.saveConfig(keys.suppliersConfigKey, keys.suppliersLocalKey, [
      created,
      ...existing,
    ]);
    return { ok: true, application: created };
  }

  async function updateSupplierStatus(
    applicationId: string,
    status: 'APPROVED' | 'REJECTED',
    approvedSupplierId?: string
  ): Promise<SupplierApplicationRecord<TSupplierCustom>[]> {
    const list = await fetchSupplierApplications();
    const next = list.map((item) =>
      item.applicationId === applicationId
        ? {
            ...item,
            status,
            approvedSupplierId: approvedSupplierId ?? item.approvedSupplierId,
          }
        : item
    );
    await driver.saveConfig(keys.suppliersConfigKey, keys.suppliersLocalKey, next);
    return next;
  }

  async function authenticateSupplier(
    nameOrEmail: string,
    passwordPin: string
  ): Promise<{
    ok: boolean;
    error?: string;
    application?: SupplierApplicationRecord<TSupplierCustom>;
  }> {
    const key = nameOrEmail.trim().toLowerCase();
    const pin = passwordPin.trim();
    if (!key || !pin) {
      return { ok: false, error: '업체명(또는 이메일)과 비밀번호를 입력해 주세요.' };
    }
    const apps = await fetchSupplierApplications();
    const hit = apps.find(
      (s) =>
        s.supplierName.trim().toLowerCase() === key ||
        s.contactEmail.trim().toLowerCase() === key
    );
    if (!hit) {
      return { ok: false, error: '등록된 B2B 파트너 계정이 없습니다.' };
    }
    if (hit.passwordPin !== pin) {
      return { ok: false, error: '파트너 비밀번호가 일치하지 않습니다.' };
    }
    return { ok: true, application: hit };
  }

  return {
    preset,
    fetchMetaMap,
    saveMetaMap,
    requestPayout,
    clearPayoutRequest,
    fetchApplications,
    createApplication,
    updateStatusAndPromo,
    deleteApplication,
    authenticateCreator,
    fetchEvents,
    trackClick,
    trackPurchase,
    computePartnerMetrics,
    fetchPayouts,
    savePayouts,
    recordPayout,
    deletePayout,
    fetchSupplierApplications,
    createSupplierApplication,
    updateSupplierStatus,
    authenticateSupplier,
  };
}
