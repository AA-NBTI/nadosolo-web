'use client';

import React from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';
import { OBSERVATORY_I18N } from '@/lib/oops/observatoryI18n';

interface WarScenarioPollProps {
  locale: OopsLocale;
  warVote: 'YES' | 'NO' | null;
  onVote: (choice: 'YES' | 'NO') => void;
}

export default function WarScenarioPoll({ locale, warVote, onVote }: WarScenarioPollProps) {
  const copy = OBSERVATORY_I18N[locale] || OBSERVATORY_I18N.ko;

  return (
    <section
      aria-label="AI-Human War Scenario Global Poll"
      className="w-full bg-white border-4 border-black p-4 sm:p-5 shadow-[8px_8px_0_#d4d4d8] text-black font-mono space-y-4"
    >
      {/* 상단 옐로우 헤더 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3 bg-[#ffc900] -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 p-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d00] animate-ping shrink-0" />
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-black">
            {copy.warPollTitle}
          </span>
        </div>

        {warVote && (
          <span className="px-2 py-0.5 bg-zinc-800 text-[#ffc900] text-[10px] font-black border border-black shadow-[1px_1px_0_#d4d4d8]">
            {copy.warVotedMsg} ({warVote})
          </span>
        )}
      </div>

      {/* 질문 본문 */}
      <div className="text-sm sm:text-base font-sans font-black text-black leading-snug">
        {copy.warPollQuestion}
      </div>

      {/* 2지선다 글로벌 참여 버튼 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onVote('YES')}
          className={`py-3 px-4 text-xs sm:text-sm font-mono font-black border-2 border-black cursor-pointer transition-all ${
            warVote === 'YES'
              ? 'bg-[#ff4d00] text-white shadow-[3px_3px_0_#d4d4d8]'
              : 'bg-[#f4f4f0] text-black hover:bg-[#ff4d00] hover:text-white'
          }`}
        >
          {copy.warYesBtn}
        </button>

        <button
          type="button"
          onClick={() => onVote('NO')}
          className={`py-3 px-4 text-xs sm:text-sm font-mono font-black border-2 border-black cursor-pointer transition-all ${
            warVote === 'NO'
              ? 'bg-[#a3e635] text-black shadow-[3px_3px_0_#d4d4d8]'
              : 'bg-[#f4f4f0] text-black hover:bg-[#a3e635]'
          }`}
        >
          {copy.warNoBtn}
        </button>
      </div>

      {/* 참여자 체감치 안내 (대표성 여론조사 구분) */}
      <div className="text-[11px] font-sans font-bold text-zinc-600 pt-1 border-t border-black/15">
        * {copy.pulseDisclaimer}
      </div>
    </section>
  );
}
