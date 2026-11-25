'use client';

import React, { useState } from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';
import { OBSERVATORY_I18N } from '@/lib/oops/observatoryI18n';
import {
  COUNTRIES_REGISTRY,
  ORDERED_COUNTRY_CODES,
  type CountryData,
} from '@/lib/oops/movementStore';

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
  onSelectCountry,
  warVote,
  onVote,
  countryData = COUNTRIES_REGISTRY[selectedCountry] || COUNTRIES_REGISTRY.KR,
  globalTotals = {
    totalSignatures: 48900,
    totalVotes: 58600,
    totalYes: 41800,
    totalNo: 16800,
    globalYesPct: 71.3,
    globalNoPct: 28.7,
  },
}: WarScenarioPollProps) {
  const copy = OBSERVATORY_I18N[locale] || OBSERVATORY_I18N.ko;
  const [isChangingVote, setIsChangingVote] = useState(false);

  const countryTotal = countryData.votes.total;
  const countryYesPct = countryTotal > 0 ? Math.round((countryData.votes.yes / countryTotal) * 100) : 68;
  const countryNoPct = 100 - countryYesPct;

  const handleVoteClick = (choice: 'YES' | 'NO') => {
    onVote(choice, selectedCountry);
    setIsChangingVote(false);
  };

  const scrollToEnlist = () => {
    const el = document.getElementById('oops-enlistment-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      aria-label="AI-Human War Scenario Global Poll"
      className="w-full bg-white border-4 border-black p-4 sm:p-5 shadow-[8px_8px_0_#d4d4d8] text-black font-mono space-y-4"
    >
      {/* 1. 상단 옐로우 헤더 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3 bg-[#ffc900] -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 p-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d00] animate-ping shrink-0" />
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-black">
            {copy.warPollTitle}
          </span>
        </div>

        {warVote && !isChangingVote && (
          <span className="px-2.5 py-0.5 bg-zinc-800 text-[#ffc900] text-[11px] font-black border border-black shadow-[1px_1px_0_#d4d4d8]">
            {copy.warVotedMsg} ({warVote})
          </span>
        )}
      </div>

      {/* 2. 국가 직접 선택 바 (소속감 & 조국 대표 자부심) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f4f4f0] p-2.5 border-2 border-black text-xs font-mono">
        <div className="flex items-center gap-1.5 font-bold text-zinc-700">
          <span>🚩</span>
          <span>{copy.myCountrySelect}:</span>
        </div>
        <select
          value={selectedCountry}
          onChange={(e) => onSelectCountry(e.target.value)}
          className="bg-white border-2 border-black px-2.5 py-1 text-xs font-black text-black cursor-pointer shadow-[2px_2px_0_#d4d4d8] focus:outline-none"
        >
          {ORDERED_COUNTRY_CODES.map((code) => {
            const c = COUNTRIES_REGISTRY[code];
            if (!c) return null;
            return (
              <option key={code} value={code}>
                {c.flag} {c.name[locale] || c.name.en} ({code})
              </option>
            );
          })}
        </select>
      </div>

      {/* 3. 질문 본문 */}
      <div className="text-sm sm:text-base font-sans font-black text-black leading-snug">
        {copy.warPollQuestion}
      </div>

      {/* 4. 투표 버튼 (미투표 상태이거나 '선택 변경' 클릭 시 노출) */}
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
                className="text-[11px] text-zinc-500 underline font-bold"
              >
                취소
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. 실시간 집계 반영 결과창 (투표 완료 즉시 반응) */}
      {warVote && !isChangingVote && (
        <div className="space-y-4 pt-2 border-t-2 border-black">
          {/* A. 전 세계 실시간 집계 바 */}
          <div className="bg-[#fcfcfc] border-2 border-black p-3 space-y-1.5 shadow-[2px_2px_0_#d4d4d8]">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1 text-zinc-800">
                <span>🌐</span>
                <span>{copy.globalTallyLabel}</span>
              </span>
              <span className="text-zinc-600 font-bold">
                {globalTotals.totalVotes.toLocaleString()} {copy.participantsUnit}
              </span>
            </div>

            <div className="w-full h-5 bg-[#a3e635] border-2 border-black flex overflow-hidden">
              <div
                className="h-full bg-[#ff4d00] transition-all duration-700 ease-out border-r-2 border-black flex items-center justify-start px-2 text-[10px] text-white font-black"
                style={{ width: `${globalTotals.globalYesPct}%` }}
              >
                {globalTotals.globalYesPct}%
              </div>
              <div className="flex-1 flex items-center justify-end px-2 text-[10px] text-black font-black">
                {globalTotals.globalNoPct}%
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#ff4d00] font-black">
                ⚔️ {copy.warYesLabel} {globalTotals.globalYesPct}% ({globalTotals.totalYes.toLocaleString()}명)
              </span>
              <span className="text-emerald-800 font-black">
                🛡️ {copy.warNoLabel} {globalTotals.globalNoPct}% ({globalTotals.totalNo.toLocaleString()}명)
              </span>
            </div>
          </div>

          {/* B. 선택 국가 실시간 집계 바 */}
          <div className="bg-[#fcfcfc] border-2 border-black p-3 space-y-1.5 shadow-[2px_2px_0_#d4d4d8]">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1.5 text-zinc-800">
                <span className="text-sm">{countryData.flag}</span>
                <span>{countryData.name[locale] || countryData.name.en} {copy.countryTallyLabel}</span>
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
                {countryYesPct}%
              </div>
              <div className="flex-1 flex items-center justify-end px-2 text-[10px] text-black font-black">
                {countryNoPct}%
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#ff4d00] font-black">
                ⚔️ {copy.warYesLabel} {countryYesPct}% ({countryData.votes.yes.toLocaleString()}명)
              </span>
              <span className="text-emerald-800 font-black">
                🛡️ {copy.warNoLabel} {countryNoPct}% ({countryData.votes.no.toLocaleString()}명)
              </span>
            </div>
          </div>

          {/* C. 컨트롤 및 서명 유도 브릿지 */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsChangingVote(true)}
              className="px-2.5 py-1 text-[11px] bg-white border border-black text-zinc-600 hover:text-black hover:border-black font-bold cursor-pointer"
            >
              🔄 {copy.changeVoteBtn}
            </button>

            <button
              type="button"
              onClick={scrollToEnlist}
              className="px-3 py-1.5 bg-[#ff4d00] hover:bg-[#ff621f] text-white text-xs font-black border-2 border-black shadow-[2px_2px_0_#d4d4d8] cursor-pointer flex items-center gap-1 active:translate-x-[1px] active:translate-y-[1px]"
            >
              <span>{copy.bridgeToEnlist}</span>
              <span>▼</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. 참여자 체감치 안내 (대표성 여론조사 구분) */}
      <div className="text-[11px] font-sans font-bold text-zinc-600 pt-1 border-t border-black/15">
        * {copy.pulseDisclaimer}
      </div>
    </section>
  );
}
