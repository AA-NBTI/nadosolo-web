'use client';

import React from 'react';
import { useNadoSoloEngine } from '@/engine';

interface Props {
  pageId: string;
  defaultBadge: string;
  defaultTitle: string;
  defaultSub: string;
  rightSlot?: React.ReactNode;
}

export default function CmsPageHeader({
  pageId,
  defaultBadge,
  defaultTitle,
  defaultSub,
  rightSlot,
}: Props) {
  const { cmsPages } = useNadoSoloEngine();
  const cms = cmsPages.find((p) => p.pageId === pageId);

  const badge = cms?.badgeText || defaultBadge;
  const title = cms?.headline || defaultTitle;
  const sub = cms?.subheadline || defaultSub;

  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-8">
      <div className="space-y-3">
        <span className="text-xs font-mono tracking-[0.25em] text-[#f04f74] uppercase font-semibold block">
          {badge}
        </span>
        <h1 className="font-serif-editorial text-3xl sm:text-5xl text-white font-normal">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-zinc-300 font-light max-w-2xl leading-relaxed">
          {sub}
        </p>
      </div>
      {rightSlot && <div className="flex items-center gap-2 shrink-0">{rightSlot}</div>}
    </header>
  );
}
