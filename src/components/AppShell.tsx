'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { NadoSoloProvider } from '@/engine';
import { isTablebaroHost, isTablebaroPath } from '@/modules/tenancy';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import TablebaroHeader from '@/components/TablebaroHeader';
import AttributionCapture from '@/components/AttributionCapture';
import AdminViewerBanner from '@/components/admin/AdminViewerBanner';

/** 테이블바로 호스트/경로는 NadoSoloProvider 없이 독립 렌더링하고, 나도솔로만 Provider를 마운트한다. */
export default function AppShell({
  children,
  initialIsTablebaro = false,
}: {
  children: React.ReactNode;
  initialIsTablebaro?: boolean;
}) {
  const pathname = usePathname();
  const clientIsTablebaroHost =
    typeof window !== 'undefined' && isTablebaroHost(window.location.hostname);
  const isTablebaro =
    initialIsTablebaro || clientIsTablebaroHost || isTablebaroPath(pathname);

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
