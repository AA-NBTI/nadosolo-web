'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureAttribution } from '@/modules/tracking';
import { tablebaroPartnersEngine } from '@/modules/partners';

export const TABLEBARO_ATTRIBUTION_KEY = 'tablebaro_attribution_v1';

const isTablebaroPath = (p: string) =>
  p.startsWith('/reserve') || p.startsWith('/biz') || p.startsWith('/r/');

/** 테이블바로 경로로 유입된 UTM·추천코드를 30일간 보관하고 파트너 클릭을 기록한다. */
export default function AttributionCapture() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !isTablebaroPath(pathname)) return;
    const search = window.location.search;
    if (!search) return;
    const a = captureAttribution(localStorage, TABLEBARO_ATTRIBUTION_KEY, search);
    if (a?.partnerCode && new URLSearchParams(search).get('ref')) {
      void tablebaroPartnersEngine.trackClick(a.partnerCode);
    }
  }, [pathname]);

  return null;
}
