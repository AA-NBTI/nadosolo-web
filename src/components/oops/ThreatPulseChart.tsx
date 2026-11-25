'use client';

import React, { useEffect, useState } from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';
import { OBSERVATORY_I18N } from '@/lib/oops/observatoryI18n';
import {
  evaluateRegionForYear,
  REGION_CODES,
  type RegionCode,
  type ScoringInputContext,
} from '@/lib/oops/scoringEngine';

interface ThreatPulseChartProps {
  initialThemeId?: string;
  isEmbed?: boolean;
  locale?: OopsLocale;
  liveCtx?: ScoringInputContext;
  warVote?: 'YES' | 'NO' | 'NEUTRAL' | null;
}

function ThermometerGraphic({ temp }: { temp: number }) {
  const clamped = Math.max(6, Math.min(100, temp));
  const fillColor =
    temp >= 80
      ? '#dc2626'
      : temp >= 60
      ? '#ff4d00'
      : temp >= 30
      ? '#ffc900'
      : '#3b82f6';

  return (
    <div className="flex flex-col items-center justify-between select-none shrink-0 w-12 sm:w-14 py-1" aria-hidden="true">
      <span className="text-[9px] font-mono font-black text-zinc-500 leading-none mb-1">100°</span>
      <div className="relative flex flex-col items-center">
        <div className="w-5 h-24 sm:h-28 bg-white border-2 border-black rounded-t-full overflow-hidden relative flex items-end shadow-[2px_2px_0_#d4d4d8]">
          <div className="absolute inset-x-0 top-1/4 border-t border-black/25 z-10 pointer-events-none" />
          <div className="absolute inset-x-0 top-2/4 border-t border-black/25 z-10 pointer-events-none" />
          <div className="absolute inset-x-0 top-3/4 border-t border-black/25 z-10 pointer-events-none" />
          <div
            className="w-full transition-all duration-700 ease-out"
            style={{
              height: `${clamped}%`,
              backgroundColor: fillColor,
            }}
          />
        </div>
        <div
          className="w-9 h-9 -mt-2 rounded-full border-2 border-black shadow-[2px_2px_0_#d4d4d8] flex items-center justify-center relative z-20 transition-colors duration-500"
          style={{ backgroundColor: fillColor }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white/50 -translate-x-1 -translate-y-1" />
        </div>
      </div>
      <span className="text-[9px] font-mono font-black text-zinc-500 leading-none mt-1">0°</span>
    </div>
  );
}

function HumanTempAvatar({ temp }: { temp: number }) {
  const stage: 'CALM' | 'TENSE' | 'ANGRY' | 'CRITICAL' =
    temp >= 80 ? 'CRITICAL' : temp >= 60 ? 'ANGRY' : temp >= 35 ? 'TENSE' : 'CALM';

  const faceBg =
    stage === 'CRITICAL'
      ? '#dc2626'
      : stage === 'ANGRY'
      ? '#ff4d00'
      : stage === 'TENSE'
      ? '#ffc900'
      : '#e0f2fe';

  const strokeColor = stage === 'CRITICAL' ? '#ffffff' : '#000000';

  return (
    <div
      className={`relative flex flex-col items-center justify-center shrink-0 select-none ${
        stage === 'CRITICAL' ? 'animate-pulse' : ''
      }`}
      aria-hidden="true"
    >
      {(stage === 'ANGRY' || stage === 'CRITICAL') && (
        <div className="flex items-center gap-1.5 mb-0.5 text-[11px] font-black leading-none text-[#dc2626] animate-bounce">
          <span>~</span>
          <span>~</span>
        </div>
      )}

      <div
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-black shadow-[3px_3px_0_#d4d4d8] flex items-center justify-center transition-colors duration-500 overflow-hidden"
        style={{ backgroundColor: faceBg }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {stage === 'ANGRY' || stage === 'CRITICAL' ? (
            <>
              <circle cx="23" cy="58" r="7" fill="#fca5a5" opacity="0.55" />
              <circle cx="77" cy="58" r="7" fill="#fca5a5" opacity="0.55" />
            </>
          ) : stage === 'CALM' ? (
            <>
              <circle cx="24" cy="57" r="6" fill="#f9a8d4" opacity="0.45" />
              <circle cx="76" cy="57" r="6" fill="#f9a8d4" opacity="0.45" />
            </>
          ) : null}

          {stage === 'CALM' && (
            <>
              <path d="M 27 36 Q 35 32 43 36" fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
              <path d="M 57 36 Q 65 32 73 36" fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
            </>
          )}
          {stage === 'TENSE' && (
            <>
              <line x1="26" y1="36" x2="43" y2="39" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />
              <line x1="74" y1="36" x2="57" y2="39" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />
            </>
          )}
          {(stage === 'ANGRY' || stage === 'CRITICAL') && (
            <>
              <line x1="24" y1="31" x2="44" y2="42" stroke={strokeColor} strokeWidth="5.5" strokeLinecap="round" />
              <line x1="76" y1="31" x2="56" y2="42" stroke={strokeColor} strokeWidth="5.5" strokeLinecap="round" />
            </>
          )}

          {stage === 'CALM' ? (
            <>
              <path d="M 28 48 Q 35 42 42 48" fill="none" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />
              <path d="M 58 48 Q 65 42 72 48" fill="none" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />
            </>
          ) : stage === 'CRITICAL' ? (
            <>
              <circle cx="35" cy="49" r="5.5" fill="#fef08a" stroke="#000" strokeWidth="2" />
              <circle cx="65" cy="49" r="5.5" fill="#fef08a" stroke="#000" strokeWidth="2" />
              <circle cx="35" cy="49" r="2" fill="#000" />
              <circle cx="65" cy="49" r="2" fill="#000" />
            </>
          ) : (
            <>
              <circle cx="35" cy="48" r="5" fill={strokeColor} />
              <circle cx="65" cy="48" r="5" fill={strokeColor} />
            </>
          )}

          {stage === 'CALM' && (
            <path d="M 35 64 Q 50 75 65 64" fill="none" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />
          )}
          {stage === 'TENSE' && (
            <path d="M 36 67 Q 50 65 64 67" fill="none" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />
          )}
          {stage === 'ANGRY' && (
            <path d="M 33 72 Q 50 59 67 72" fill="none" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" />
          )}
          {stage === 'CRITICAL' && (
            <>
              <rect x="33" y="61" width="34" height="16" rx="4" fill="#000" stroke="#fff" strokeWidth="2" />
              <line x1="39" y1="61" x2="39" y2="77" stroke="#fff" strokeWidth="2" />
              <line x1="50" y1="61" x2="50" y2="77" stroke="#fff" strokeWidth="2" />
              <line x1="61" y1="61" x2="61" y2="77" stroke="#fff" strokeWidth="2" />
              <line x1="33" y1="69" x2="67" y2="69" stroke="#fff" strokeWidth="2" />
            </>
          )}

          {stage === 'TENSE' && (
            <path d="M 80 32 Q 85 40 80 44 Q 75 40 80 32 Z" fill="#38bdf8" stroke="#000" strokeWidth="1.5" />
          )}
        </svg>
      </div>
    </div>
  );
}

const CALIBRATED_YEARS = [2022, 2023, 2024, 2025, 2026];

export default function ThreatPulseChart({
  isEmbed = false,
  locale = 'ko',
  liveCtx,
  warVote: externalWarVote,
}: ThreatPulseChartProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedRegions, setSelectedRegions] = useState<RegionCode[]>(['GLOBAL']);
  const [localWarVote, setLocalWarVote] = useState<'YES' | 'NO' | 'NEUTRAL' | null>(null);

  useEffect(() => {
    if (externalWarVote !== undefined) return;
    try {
      const saved = localStorage.getItem('oops_war_vote_v1');
      if (saved === 'YES' || saved === 'NO' || saved === 'NEUTRAL') setLocalWarVote(saved);
    } catch {
      // ignore storage failure
    }
  }, [externalWarVote]);

  const warVote = externalWarVote !== undefined ? externalWarVote : localWarVote;

  const handleToggleRegion = (code: RegionCode) => {
    if (code === 'GLOBAL') {
      setSelectedRegions(['GLOBAL']);
      return;
    }

    setSelectedRegions((prev) => {
      const withoutGlobal = prev.filter((c) => c !== 'GLOBAL');
      if (withoutGlobal.includes(code)) {
        const next = withoutGlobal.filter((c) => c !== code);
        return next.length === 0 ? ['GLOBAL'] : next;
      }
      return [...withoutGlobal, code];
    });
  };

  const copy = OBSERVATORY_I18N[locale] || OBSERVATORY_I18N.ko;

  return (
    <section className={`w-full bg-white border-4 border-black shadow-[8px_8px_0_#d4d4d8] text-black font-mono ${isEmbed ? 'p-4' : 'p-4 sm:p-6'} space-y-5`}>
      {/* 1. 계측기 헤더 + 연도별 실측 캘리브레이션 선택 (2022 ~ 2026) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3 bg-[#ffc900] -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 p-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#ff4d00] rounded-full animate-pulse shrink-0" />
          <span className="text-sm sm:text-base font-black tracking-wider text-black uppercase">
            {copy.barometerTitle}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {CALIBRATED_YEARS.map((y) => {
            const active = selectedYear === y;
            return (
              <button
                key={y}
                type="button"
                onClick={() => setSelectedYear(y)}
                className={`px-2 py-1 text-xs font-mono font-black border-2 border-black cursor-pointer transition-all ${
                  active
                    ? 'bg-[#ff4d00] text-white shadow-[2px_2px_0_#d4d4d8]'
                    : 'bg-white text-black hover:bg-zinc-100'
                }`}
              >
                {y}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 국가/지역 단일·복수 선택 필터 (전부 scoringEngine 실시간 산출) */}
      <div className="space-y-2 border-b-2 border-black pb-4">
        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-600">
          <span>{copy.regionFilterLabel} ({selectedRegions.map((c) => c === 'GLOBAL' ? copy.globalChip : c).join(', ')})</span>
          <span>{copy.multiHint}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {REGION_CODES.map((code) => {
            const active = selectedRegions.includes(code);
            const { output } = evaluateRegionForYear(code, selectedYear, liveCtx);
            const chipLabel = code === 'GLOBAL' ? copy.globalChip : code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => handleToggleRegion(code)}
                className={`px-2.5 py-1.5 text-xs font-mono font-black border-2 border-black cursor-pointer transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-zinc-800 text-[#ffc900] shadow-[2px_2px_0_#ff4d00]'
                    : 'bg-[#f4f4f0] text-black hover:bg-[#ffc900]/40'
                }`}
              >
                <span>{chipLabel}</span>
                <span className={`text-[11px] px-1 border border-black ${
                  active ? 'bg-[#ff4d00] text-white' : 'bg-white text-zinc-800'
                }`}>
                  {output.temperatureC.toFixed(1)}°
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 선택된 대상 집중 관제 뷰 (전부 엔진 산출값) */}
      <div className={`grid gap-4 ${selectedRegions.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {selectedRegions.map((code) => {
          const { profile, output, caseCount, delegationRate } = evaluateRegionForYear(code, selectedYear, liveCtx);
          const temp = output.temperatureC;
          // AI-인간 전쟁 예상 비율 & 참여자 수 (참여자 투표 시 실시간 반영)
          const totalParticipants = profile.participantCount + (warVote ? 1 : 0);
          const warExpectedPct =
            warVote === 'YES'
              ? Number(Math.min(99.9, profile.warExpectedPct + 0.1).toFixed(1))
              : warVote === 'NO'
              ? Number(Math.max(0.1, profile.warExpectedPct - 0.1).toFixed(1))
              : profile.warExpectedPct;
          const controlPct = Number((100 - warExpectedPct).toFixed(1));
          const regionName = profile.name[locale] || profile.name.en;
          const statusKey = temp >= 80 ? 'CRITICAL' : temp >= 60 ? 'HIGH' : temp >= 30 ? 'MED' : 'LOW';
          const statusLabel = copy.statusLabels[statusKey];

          return (
            <div key={code} className="p-4 bg-[#f4f4f0] border-2 border-black shadow-[4px_4px_0_#d4d4d8] space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2.5">
                <div>
                  <div className="text-[11px] text-zinc-600 font-bold">
                    {selectedYear} // {profile.code === 'GLOBAL' ? copy.globalChip : profile.code}
                  </div>
                  <div className="text-base sm:text-lg font-black text-black">{regionName}</div>
                </div>

                {/* 전쟁 예상 비율 vs 객관 위험도 분리 표기 */}
                <div className="flex items-center gap-2">
                  <div className="text-right px-2.5 py-1 bg-white border-2 border-black">
                    <div className="text-[9px] text-zinc-500 font-bold uppercase">{copy.warYesLabel}</div>
                    <div className="text-lg sm:text-xl font-black text-[#ff4d00] leading-none mt-0.5">{warExpectedPct}%</div>
                  </div>
                  <div className={`text-right px-2.5 py-1 border-2 border-black ${
                    temp >= 80 ? 'bg-[#dc2626] text-white' :
                    temp >= 60 ? 'bg-[#ff4d00] text-white' :
                    temp >= 30 ? 'bg-[#ffc900] text-black' : 'bg-white text-black'
                  }`}>
                    <div className="text-[9px] font-bold uppercase opacity-90">{copy.objectiveThreatLabel}</div>
                    <div className="text-lg sm:text-xl font-black leading-none mt-0.5">{temp.toFixed(1)}°C</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-3 shrink-0">
                  <HumanTempAvatar temp={temp} />
                  <ThermometerGraphic temp={temp} />
                </div>

                <div className="w-full flex-1 space-y-3 min-w-0">
                  {/* AI-인간 전쟁 예상 vs 통제 가능 비율 바 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-black">
                      <span className="text-[#ff4d00]">{copy.warYesLabel} {warExpectedPct}%</span>
                      <span className="text-zinc-500 font-bold">{totalParticipants.toLocaleString()} {copy.participantsUnit}</span>
                      <span className="text-emerald-700">{copy.warNoLabel} {controlPct}%</span>
                    </div>
                    <div className="w-full h-4 bg-[#a3e635] border-2 border-black overflow-hidden flex">
                      <div
                        className="h-full bg-[#ff4d00] transition-all duration-500 ease-out border-r-2 border-black"
                        style={{ width: `${warExpectedPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white border border-black">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">{copy.delegation}</div>
                      <div className="text-sm font-black text-black mt-0.5">{delegationRate}%</div>
                    </div>
                    <div className="p-2 bg-white border border-black">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">{copy.cases}</div>
                      <div className="text-sm font-black text-[#ff4d00] mt-0.5">{caseCount.toLocaleString()}{copy.unitCases}</div>
                    </div>
                    <div className="p-2 bg-white border border-black">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">{copy.tipping}</div>
                      <div className="text-sm font-black text-black mt-0.5">
                        {output.remainingYears.toFixed(1)}{copy.yearUnit} <span className="text-[10px] text-zinc-500">[{statusLabel}]</span>
                      </div>
                    </div>
                    <div className="p-2 bg-white border border-black">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">{copy.domain}</div>
                      <div className="text-xs font-bold text-black mt-0.5 truncate" title={profile.domain[locale] || profile.domain.en}>
                        {profile.domain[locale] || profile.domain.en}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
