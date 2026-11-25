'use client';

import React, { useState } from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';
import { OBSERVATORY_I18N } from '@/lib/oops/observatoryI18n';
import { COUNTRIES_REGISTRY, type CountryData } from '@/lib/oops/movementStore';

interface WarScenarioPollProps {
  locale: OopsLocale;
  selectedCountry: string;
  onSelectCountry: (code: string) => void;
  warVote: 'YES' | 'NO' | null;
  onVote: (choice: 'YES' | 'NO', countryCode: string) => void;
  countryData?: CountryData;
  globalTotals?: {
    totalSignatures: number;
    totalVotes: number;
    totalYes: number;
    totalNo: number;
    globalYesPct: number;
    globalNoPct: number;
  };
}

export default function WarScenarioPoll({
  locale,
  selectedCountry,
  warVote,
  onVote,
  countryData = COUNTRIES_REGISTRY[selectedCountry] || COUNTRIES_REGISTRY.KR,
  globalTotals = {
    totalSignatures: 0,
    totalVotes: 0,
    totalYes: 0,
    totalNo: 0,
    globalYesPct: 0,
    globalNoPct: 0,
  },
}: WarScenarioPollProps) {
  const copy = OBSERVATORY_I18N[locale] || OBSERVATORY_I18N.ko;
  const [isChangingVote, setIsChangingVote] = useState(false);

  const countryTotal = countryData.votes.total;
  const countryYesPct = countryTotal > 0 ? Math.round((countryData.votes.yes / countryTotal) * 100) : 0;
  const countryNoPct = countryTotal > 0 ? 100 - countryYesPct : 0;

  const handleVoteClick = (choice: 'YES' | 'NO') => {
    onVote(choice, selectedCountry);
    setIsChangingVote(false);
  };

  const goToOath = () => {
    window.location.href = '/declaration';
  };

  return (
    <section
      aria-label="War Scenario Poll"
      className="w-full bg-white border-4 border-black p-4 sm:p-5 shadow-[8px_8px_0_#d4d4d8] text-black font-mono space-y-4"
    >
      {/* 상단 옐로우 헤더 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3 bg-[#ffc900] -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 p-4">
        <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-black">
          {copy.warPollTitle}
        </span>

        {warVote && !isChangingVote && (
          <span className="px-2.5 py-0.5 bg-zinc-900 text-[#ffc900] text-xs font-black border border-black">
            {copy.warVotedMsg}
          </span>
        )}
      </div>

      {/* 질문 본문 */}
      <div className="text-sm sm:text-base font-sans font-black text-black leading-snug">
        {copy.warPollQuestion}
      </div>

      {/* 2지선다 투표 버튼 (단일 단어 표준) */}
      {(!warVote || isChangingVote) && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleVoteClick('YES')}
              className={`py-3 px-4 text-xs sm:text-sm font-mono font-black border-2 border-black cursor-pointer transition-all ${
                warVote === 'YES'
                  ? 'bg-[#ff4d00] text-white shadow-[3px_3px_0_#d4d4d8]'
                  : 'bg-white text-black hover:bg-[#ff4d00] hover:text-white shadow-[2px_2px_0_#d4d4d8]'
              }`}
            >
              {copy.warYesBtn}
            </button>

            <button
              type="button"
              onClick={() => handleVoteClick('NO')}
              className={`py-3 px-4 text-xs sm:text-sm font-mono font-black border-2 border-black cursor-pointer transition-all ${
                warVote === 'NO'
                  ? 'bg-[#a3e635] text-black shadow-[3px_3px_0_#d4d4d8]'
                  : 'bg-white text-black hover:bg-[#a3e635] shadow-[2px_2px_0_#d4d4d8]'
              }`}
            >
              {copy.warNoBtn}
            </button>
          </div>
          {isChangingVote && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setIsChangingVote(false)}
                className="text-xs text-zinc-600 underline font-bold cursor-pointer"
              >
                {locale === 'ko' ? '취소' : 'Cancel'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 실시간 집계 결과창 */}
      {warVote && !isChangingVote && (
        <div className="space-y-3 pt-2 border-t-2 border-black">
          {/* 전 세계 집계 */}
          <div className="bg-[#fcfcfc] border-2 border-black p-3 space-y-1.5 shadow-[2px_2px_0_#d4d4d8]">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-zinc-900">{copy.globalTallyLabel}</span>
              <span className="text-zinc-600 font-bold">
                {globalTotals.totalVotes.toLocaleString()} {copy.participantsUnit}
              </span>
            </div>

            <div className="w-full h-5 bg-[#a3e635] border-2 border-black flex overflow-hidden">
              <div
                className="h-full bg-[#ff4d00] transition-all duration-700 ease-out border-r-2 border-black flex items-center justify-start px-2 text-[10px] text-white font-black"
                style={{ width: `${globalTotals.globalYesPct}%` }}
              >
                {globalTotals.globalYesPct > 0 ? `${globalTotals.globalYesPct}%` : ''}
              </div>
              <div className="flex-1 flex items-center justify-end px-2 text-[10px] text-black font-black">
                {globalTotals.globalNoPct > 0 ? `${globalTotals.globalNoPct}%` : ''}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#ff4d00] font-black">
                {copy.warYesLabel} {globalTotals.globalYesPct}% ({globalTotals.totalYes.toLocaleString()})
              </span>
              <span className="text-emerald-800 font-black">
                {copy.warNoLabel} {globalTotals.globalNoPct}% ({globalTotals.totalNo.toLocaleString()})
              </span>
            </div>
          </div>

          {/* 선택 국가 집계 */}
          <div className="bg-[#fcfcfc] border-2 border-black p-3 space-y-1.5 shadow-[2px_2px_0_#d4d4d8]">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1.5 text-zinc-900">
                <span>{countryData.flag}</span>
                <span>{countryData.name[locale] || countryData.name.en}</span>
              </span>
              <span className="text-zinc-600 font-bold">
                {countryTotal.toLocaleString()} {copy.participantsUnit}
              </span>
            </div>

            <div className="w-full h-5 bg-[#a3e635] border-2 border-black flex overflow-hidden">
              <div
                className="h-full bg-[#ff4d00] transition-all duration-700 ease-out border-r-2 border-black flex items-center justify-start px-2 text-[10px] text-white font-black"
                style={{ width: `${countryYesPct}%` }}
              >
                {countryYesPct > 0 ? `${countryYesPct}%` : ''}
              </div>
              <div className="flex-1 flex items-center justify-end px-2 text-[10px] text-black font-black">
                {countryNoPct > 0 ? `${countryNoPct}%` : ''}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#ff4d00] font-black">
                {copy.warYesLabel} {countryYesPct}% ({countryData.votes.yes.toLocaleString()})
              </span>
              <span className="text-emerald-800 font-black">
                {copy.warNoLabel} {countryNoPct}% ({countryData.votes.no.toLocaleString()})
              </span>
            </div>
          </div>

          {/* 하단 단일 단어 버튼 */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsChangingVote(true)}
              className="px-3 py-1.5 text-xs bg-white border-2 border-black text-black font-bold cursor-pointer"
            >
              {copy.changeVoteBtn}
            </button>

            <button
              type="button"
              onClick={goToOath}
              className="px-4 py-1.5 bg-[#ff4d00] hover:bg-[#ff621f] text-white text-xs font-black border-2 border-black shadow-[2px_2px_0_#d4d4d8] cursor-pointer"
            >
              {copy.bridgeToEnlist}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
