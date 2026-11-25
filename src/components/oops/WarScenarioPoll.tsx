'use client';

import React, { useState } from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';
import { OBSERVATORY_I18N } from '@/lib/oops/observatoryI18n';
import { COUNTRIES_REGISTRY, type CountryData } from '@/lib/oops/movementStore';

export type WarVoteChoice = 'YES' | 'NO' | 'NEUTRAL';

interface WarScenarioPollProps {
  locale: OopsLocale;
  selectedCountry: string;
  onSelectCountry: (code: string) => void;
  warVote: WarVoteChoice | null;
  onVote: (choice: WarVoteChoice, countryCode: string) => void;
  countryData?: CountryData;
  globalTotals?: {
    totalSignatures: number;
    totalVotes: number;
    totalYes: number;
    totalNo: number;
    totalNeutral?: number;
    globalYesPct: number;
    globalNoPct: number;
    globalNeutralPct?: number;
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
    totalNeutral: 0,
    globalYesPct: 0,
    globalNoPct: 0,
    globalNeutralPct: 0,
  },
}: WarScenarioPollProps) {
  const copy = OBSERVATORY_I18N[locale] || OBSERVATORY_I18N.ko;
  const [isChangingVote, setIsChangingVote] = useState(false);

  const countryTotal = countryData.votes.total;
  const countryYesPct = countryTotal > 0 ? Math.round((countryData.votes.yes / countryTotal) * 100) : 0;
  const countryNeutralPct = countryTotal > 0 ? Math.round(((countryData.votes.neutral || 0) / countryTotal) * 100) : 0;
  const countryNoPct = countryTotal > 0 ? Math.max(0, 100 - countryYesPct - countryNeutralPct) : 0;

  const handleVoteClick = (choice: WarVoteChoice) => {
    onVote(choice, selectedCountry);
    setIsChangingVote(false);
  };

  const goToOath = () => {
    window.location.href = '/declaration';
  };

  const globalNeutralPct = globalTotals.globalNeutralPct ?? 0;
  const totalNeutral = globalTotals.totalNeutral ?? 0;

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

      {/* 3지선다 투표 버튼 (찬성 / 중립 / 반대 대칭 구조) */}
      {(!warVote || isChangingVote) && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {/* 1. 찬성 (YES) */}
            <button
              type="button"
              onClick={() => handleVoteClick('YES')}
              className={`py-3 px-2 text-xs sm:text-sm font-mono font-black border-2 border-black cursor-pointer transition-all ${
                warVote === 'YES'
                  ? 'bg-[#ff4d00] text-white shadow-[2px_2px_0_#000]'
                  : 'bg-white text-black hover:bg-[#ff4d00] hover:text-white'
              }`}
            >
              {copy.warYesBtn}
            </button>

            {/* 2. 중립 (NEUTRAL) */}
            <button
              type="button"
              onClick={() => handleVoteClick('NEUTRAL')}
              className={`py-3 px-2 text-xs sm:text-sm font-mono font-black border-2 border-black cursor-pointer transition-all ${
                warVote === 'NEUTRAL'
                  ? 'bg-[#ffc900] text-black shadow-[2px_2px_0_#000]'
                  : 'bg-white text-black hover:bg-[#ffc900]'
              }`}
            >
              {copy.warNeutralBtn}
            </button>

            {/* 3. 반대 (NO) */}
            <button
              type="button"
              onClick={() => handleVoteClick('NO')}
              className={`py-3 px-2 text-xs sm:text-sm font-mono font-black border-2 border-black cursor-pointer transition-all ${
                warVote === 'NO'
                  ? 'bg-[#a3e635] text-black shadow-[2px_2px_0_#000]'
                  : 'bg-white text-black hover:bg-[#a3e635]'
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
          <div className="bg-[#fcfcfc] border-2 border-black p-3 space-y-2 shadow-[2px_2px_0_#d4d4d8]">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-zinc-900">{copy.globalTallyLabel}</span>
              <span className="text-zinc-600 font-bold">
                {globalTotals.totalVotes.toLocaleString()} {copy.participantsUnit}
              </span>
            </div>

            {/* 3분할 프로그레스 바 */}
            <div className="w-full h-5 bg-zinc-200 border-2 border-black flex overflow-hidden">
              <div
                className="h-full bg-[#ff4d00] transition-all duration-700 ease-out border-r border-black flex items-center justify-center px-1 text-[10px] text-white font-black overflow-hidden"
                style={{ width: `${globalTotals.globalYesPct}%` }}
                title={`YES: ${globalTotals.globalYesPct}%`}
              >
                {globalTotals.globalYesPct >= 10 ? `${globalTotals.globalYesPct}%` : ''}
              </div>
              <div
                className="h-full bg-[#ffc900] transition-all duration-700 ease-out border-r border-black flex items-center justify-center px-1 text-[10px] text-black font-black overflow-hidden"
                style={{ width: `${globalNeutralPct}%` }}
                title={`NEUTRAL: ${globalNeutralPct}%`}
              >
                {globalNeutralPct >= 10 ? `${globalNeutralPct}%` : ''}
              </div>
              <div
                className="h-full bg-[#a3e635] transition-all duration-700 ease-out flex items-center justify-center px-1 text-[10px] text-black font-black overflow-hidden"
                style={{ width: `${globalTotals.globalNoPct}%` }}
                title={`NO: ${globalTotals.globalNoPct}%`}
              >
                {globalTotals.globalNoPct >= 10 ? `${globalTotals.globalNoPct}%` : ''}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 text-[11px] font-bold text-center">
              <span className="text-[#ff4d00] font-black truncate">
                {copy.warYesLabel} {globalTotals.globalYesPct}% ({globalTotals.totalYes.toLocaleString()})
              </span>
              <span className="text-amber-700 font-black truncate">
                {copy.warNeutralLabel} {globalNeutralPct}% ({totalNeutral.toLocaleString()})
              </span>
              <span className="text-emerald-800 font-black truncate">
                {copy.warNoLabel} {globalTotals.globalNoPct}% ({globalTotals.totalNo.toLocaleString()})
              </span>
            </div>
          </div>

          {/* 선택 국가 집계 */}
          <div className="bg-[#fcfcfc] border-2 border-black p-3 space-y-2 shadow-[2px_2px_0_#d4d4d8]">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1.5 text-zinc-900">
                <span>{countryData.flag}</span>
                <span>{countryData.name[locale] || countryData.name.en}</span>
              </span>
              <span className="text-zinc-600 font-bold">
                {countryTotal.toLocaleString()} {copy.participantsUnit}
              </span>
            </div>

            {/* 3분할 국가 프로그레스 바 */}
            <div className="w-full h-5 bg-zinc-200 border-2 border-black flex overflow-hidden">
              <div
                className="h-full bg-[#ff4d00] transition-all duration-700 ease-out border-r border-black flex items-center justify-center px-1 text-[10px] text-white font-black overflow-hidden"
                style={{ width: `${countryYesPct}%` }}
                title={`YES: ${countryYesPct}%`}
              >
                {countryYesPct >= 10 ? `${countryYesPct}%` : ''}
              </div>
              <div
                className="h-full bg-[#ffc900] transition-all duration-700 ease-out border-r border-black flex items-center justify-center px-1 text-[10px] text-black font-black overflow-hidden"
                style={{ width: `${countryNeutralPct}%` }}
                title={`NEUTRAL: ${countryNeutralPct}%`}
              >
                {countryNeutralPct >= 10 ? `${countryNeutralPct}%` : ''}
              </div>
              <div
                className="h-full bg-[#a3e635] transition-all duration-700 ease-out flex items-center justify-center px-1 text-[10px] text-black font-black overflow-hidden"
                style={{ width: `${countryNoPct}%` }}
                title={`NO: ${countryNoPct}%`}
              >
                {countryNoPct >= 10 ? `${countryNoPct}%` : ''}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 text-[11px] font-bold text-center">
              <span className="text-[#ff4d00] font-black truncate">
                {copy.warYesLabel} {countryYesPct}% ({countryData.votes.yes.toLocaleString()})
              </span>
              <span className="text-amber-700 font-black truncate">
                {copy.warNeutralLabel} {countryNeutralPct}% ({((countryData.votes.neutral || 0)).toLocaleString()})
              </span>
              <span className="text-emerald-800 font-black truncate">
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
