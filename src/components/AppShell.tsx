'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { NadoSoloProvider } from '@/engine';
import GlobalHeader from '@/components/GlobalHeader';
import GlobalFooter from '@/components/GlobalFooter';
import TablebaroHeader from '@/components/TablebaroHeader';
import AttributionCapture from '@/components/AttributionCapture';
import AdminViewerBanner from '@/components/admin/AdminViewerBanner';

const isTablebaroPath = (p?: string | null) =>
  Boolean(p && (p.startsWith('/reserve') || p.startsWith('/biz') || p.startsWith('/r/')));

/** 테이블바로 경로는 NadoSoloProvider 없이 독립 렌더링하고, 나도솔로 경로만 Provider를 마운트한다. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isTablebaroPath(pathname)) {
    return (
      <>
        <AttributionCapture />
        <TablebaroHeader />
        <div className="flex-1 flex flex-col">{children}</div>
        <GlobalFooter />
      </>
    );
  }

  return (
    <NadoSoloProvider>
      <AdminViewerBanner />
      <AttributionCapture />
      <GlobalHeader />
      <div className="flex-1 flex flex-col">{children}</div>
      <GlobalFooter />
    </NadoSoloProvider>
  );
}
