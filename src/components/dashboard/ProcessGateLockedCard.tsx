'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

interface ProcessGateLockedCardProps {
  title: string;
  badgeLabel?: string;
  description: string;
  subDescription?: string;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
  progressText?: string;
}

export default function ProcessGateLockedCard({
  title,
  badgeLabel = '진입 제한',
  description,
  subDescription,
  actionLabel,
  actionHref,
  onAction,
  progressText,
}: ProcessGateLockedCardProps) {
  return (
    <div className="bg-[#0c0d12] border border-white/10 p-6 sm:p-8 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#f04f74]" />
            <span className="text-sm font-mono px-2 py-0.5 bg-white/10 text-zinc-300 border border-white/10">
              {badgeLabel}
            </span>
          </div>
          <h3 className="font-serif-editorial text-xl sm:text-2xl font-normal text-white pt-1">
            {title}
          </h3>
        </div>

        {progressText && (
          <span className="px-2.5 py-1 text-sm font-mono bg-white/[0.04] text-zinc-400 border border-white/10 shrink-0">
            {progressText}
          </span>
        )}
      </div>

      <p className="text-sm sm:text-sm text-zinc-400 font-light leading-relaxed">
        {description}
      </p>

      {subDescription && (
        <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] text-sm font-light text-zinc-400">
          {subDescription}
        </div>
      )}

      <div className="pt-2">
        {actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

