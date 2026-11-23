'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { NadoSoloProvider } from '@/engine';
import { isOopsHost, isOopsPath, isTablebaroHost, isTablebaroPath } from '@/modules/tenancy';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import TablebaroHeader from '@/components/TablebaroHeader';
import AttributionCapture from '@/components/AttributionCapture';
import AdminViewerBanner from '@/components/admin/AdminViewerBanner';

export type BrandKind = 'nadosolo' | 'tablebaro' | 'oops';

/** 호스트/경로에 따라 나도솔로·테이블바로·OOPS 3개 브랜드를 완전 독립 쉘로 분기한다. */
export default function AppShell({
  children,
  initialBrand = 'nadosolo',
}: {
  children: React.ReactNode;
  initialBrand?: BrandKind;
}) {
  const pathname = usePathname();
  const clientHost = typeof window !== 'undefined' ? window.location.hostname : null;

  const isOops =
    initialBrand === 'oops' || isOopsHost(clientHost) || isOopsPath(pathname);

  if (isOops) {
    return (
      <>
        <AttributionCapture />
        <div className="flex-1 flex flex-col">{children}</div>
      </>
    );
  }

  const isTablebaro =
    initialBrand === 'tablebaro' || isTablebaroHost(clientHost) || isTablebaroPath(pathname);

  if (isTablebaro) {
    return (
      <>
        <AttributionCapture />
        <TablebaroHeader />
        <div className="flex-1 flex flex-col">{children}</div>
        <GlobalFooter isTablebaro={true} />
      </>
    );
  }

  return (
    <NadoSoloProvider>
      <AdminViewerBanner />
      <AttributionCapture />
      <GlobalHeader />
      <div className="flex-1 flex flex-col">{children}</div>
      <GlobalFooter isTablebaro={false} />
    </NadoSoloProvider>
  );
}
