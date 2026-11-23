'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureAttribution, loadAttribution } from '@/modules/tracking';
import { nadosoloPartnersEngine, tablebaroPartnersEngine } from '@/modules/partners';

export const TABLEBARO_ATTRIBUTION_KEY = 'tablebaro_attribution_v1';
export const NADOSOLO_ATTRIBUTION_KEY = 'nadosolo_attribution_v1';

const isTablebaroPath = (p: string) =>
  p.startsWith('/reserve') || p.startsWith('/biz') || p.startsWith('/r/');

const extractResourceId = (p: string): string | undefined => {
  const m = p.match(/^\/reserve\/([^/]+)/);
  if (!m) return undefined;
  const id = decodeURIComponent(m[1]);
  return id === 'my' || id === 'affiliate' ? undefined : id;
};

/**
 * 나도솔로 · 테이블바로 양쪽 경로로 유입된 UTM·추천코드를 30일간 독립 보관하고,
 * 추천인 클릭 및 전역 VISIT 이벤트를 각 서비스 트래킹 저장소에 자동 기록한다.
 */
export default function AttributionCapture() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    const search = window.location.search;
    const isTb = isTablebaroPath(pathname);
    const service = isTb ? 'TABLEBARO' : 'NADOSOLO';
    const storageKey = isTb ? TABLEBARO_ATTRIBUTION_KEY : NADOSOLO_ATTRIBUTION_KEY;

    const hasQuery = Boolean(search);
    const hasRef = hasQuery && Boolean(new URLSearchParams(search).get('ref'));
    const attr = hasQuery
      ? captureAttribution(localStorage, storageKey, search)
      : loadAttribution(localStorage, storageKey);

    if (attr?.partnerCode && hasRef) {
      if (isTb) {
        void tablebaroPartnersEngine.trackClick(attr.partnerCode);
      } else {
        localStorage.setItem('nadosolo_referral_code', attr.partnerCode);
        void nadosoloPartnersEngine.trackClick(attr.partnerCode);
      }
    } else if (!isTb && attr?.partnerCode) {
      localStorage.setItem('nadosolo_referral_code', attr.partnerCode);
    }

    // 동일 세션 내 같은 경로+쿼리 중복 VISIT 전송 방지
    const visitKey = `trk_visit_${service}_${pathname}_${search}`;
    if (sessionStorage.getItem(visitKey)) return;
    sessionStorage.setItem(visitKey, '1');

    const resourceId = isTb ? extractResourceId(pathname) : undefined;
    void fetch('/api/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service,
        type: 'VISIT',
        path: pathname,
        attribution: attr,
        resourceId,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
