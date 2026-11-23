'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureAttribution } from '@/modules/tracking';
import { nadosoloPartnersEngine, tablebaroPartnersEngine } from '@/modules/partners';

export const TABLEBARO_ATTRIBUTION_KEY = 'tablebaro_attribution_v1';
export const NADOSOLO_ATTRIBUTION_KEY = 'nadosolo_attribution_v1';

const isTablebaroPath = (p: string) =>
  p.startsWith('/reserve') || p.startsWith('/biz') || p.startsWith('/r/');

/**
 * 나도솔로 · 테이블바로 양쪽 경로로 유입된 UTM·추천코드를 30일간 독립 보관하고
 * 추천인 클릭을 1회 정확히 기록한다.
 */
export default function AttributionCapture() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    const search = window.location.search;
    if (!search) return;

    const hasRef = Boolean(new URLSearchParams(search).get('ref'));
    if (isTablebaroPath(pathname)) {
      const a = captureAttribution(localStorage, TABLEBARO_ATTRIBUTION_KEY, search);
      if (a?.partnerCode && hasRef) {
        void tablebaroPartnersEngine.trackClick(a.partnerCode);
      }
      return;
    }

    const a = captureAttribution(localStorage, NADOSOLO_ATTRIBUTION_KEY, search);
    if (a?.partnerCode) {
      localStorage.setItem('nadosolo_referral_code', a.partnerCode);
      if (hasRef) {
        void nadosoloPartnersEngine.trackClick(a.partnerCode);
      }
    }
  }, [pathname]);

  return null;
}
