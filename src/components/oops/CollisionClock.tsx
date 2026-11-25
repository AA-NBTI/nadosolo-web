'use client';

import React, { useState, useEffect } from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';
import { OBSERVATORY_I18N } from '@/lib/oops/observatoryI18n';
import type { EngineEvaluationOutput } from '@/lib/oops/scoringEngine';

interface CollisionClockProps {
  locale: OopsLocale;
  engineOutput?: EngineEvaluationOutput;
}

export default function CollisionClock({ locale, engineOutput }: CollisionClockProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const baselineRemainingYears = engineOutput ? engineOutput.remainingYears : 9.0;
  const remainingYears = baselineRemainingYears.toFixed(1);
  const projectedYear = (2026 + baselineRemainingYears).toFixed(1);

  const getTimeLeft = (targetMs: number) => {
    const now = Date.now();
    const diff = Math.max(0, targetMs - now);
    return {
      totalHours: Math.floor(diff / (1000 * 60 * 60)),
      totalMinutes: Math.floor(diff / (1000 * 60)),
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hoursInDay: Math.floor((diff / (1000 * 60 * 60)) % 24),
      seconds: Math.floor((diff / 1000) % 60),
      milliseconds: Math.floor((diff % 1000) / 10),
    };
  };

  const baseTarget = new Date('2035-01-01T00:00:00Z').getTime();
  const offsetMs = (baselineRemainingYears - 9.0) * 365.25 * 24 * 60 * 60 * 1000;
  const targetDate = baseTarget + offsetMs;

  const [timeLeft, setTimeLeft] = useState<{
    totalHours: number;
    totalMinutes: number;
    days: number;
    hoursInDay: number;
    seconds: number;
    milliseconds: number;
  }>(() => getTimeLeft(targetDate));

  useEffect(() => {
    setTimeLeft(getTimeLeft(targetDate));
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 47);

    return () => clearInterval(interval);
  }, [targetDate]);

  const copy = OBSERVATORY_I18N[locale] || OBSERVATORY_I18N.ko;

  return (
    <section className="bg-white border-4 border-black p-4 sm:p-6 shadow-[8px_8px_0px_#d4d4d8] space-y-6 font-mono text-black">
      {/* 1. 계측기 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3 bg-[#ffc900] -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 p-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d00] animate-ping shrink-0" />
          <span className="text-sm sm:text-base font-black uppercase tracking-wider text-black">
            {copy.clockTitle}
          </span>
        </div>
        <span className="px-2.5 py-0.5 bg-zinc-800 text-[#ffc900] font-black text-xs border border-black shadow-[2px_2px_0_#d4d4d8]">
          {projectedYear}
        </span>
      </div>

      {/* 2. 전광판: TOTAL HOURS & TOTAL MINUTES 공간 분할 */}
      <div className="p-4 sm:p-5 bg-[#f4f4f0] border-2 border-black shadow-[4px_4px_0_#d4d4d8] space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
          {/* 전체 잔여 시간 */}
          <div className="p-4 bg-[#ffc900] border-2 border-black shadow-[3px_3px_0_#d4d4d8] flex flex-col justify-center items-center">
            <div className="text-3xl xs:text-4xl sm:text-5xl font-black text-black tracking-tight font-mono">
              {timeLeft.totalHours.toLocaleString()}
            </div>
            <div className="text-xs text-black font-black uppercase mt-1">
              {copy.totalHoursUnit}
            </div>
            <div className="text-[11px] text-zinc-900 font-sans mt-1 font-bold">
              {copy.approxPrefix}{' '}
              <strong className="text-black bg-white px-1.5 py-0.5 border border-black">
                {timeLeft.days.toLocaleString()}{copy.dayUnit}
              </strong>{' '}
              ({timeLeft.hoursInDay}{copy.hourUnit})
            </div>
          </div>

          {/* 전체 잔여 분 */}
          <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0_#d4d4d8] flex flex-col justify-center items-center">
            <div className="text-3xl xs:text-4xl sm:text-5xl font-black text-[#ff4d00] tracking-tight font-mono">
              {timeLeft.totalMinutes.toLocaleString()}
            </div>
            <div className="text-xs text-black font-black uppercase mt-1">
              {copy.totalMinutesUnit}
            </div>
            <div className="text-[11px] text-zinc-800 font-sans mt-1 font-bold">
              {copy.minutesSubNote}
            </div>
          </div>
        </div>

        {/* 실시간 초/밀리초 & 기준선 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1 border-t-2 border-black">
          <div className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0_#d4d4d8] flex flex-col justify-center items-center">
            <div className="text-2xl sm:text-3xl font-black text-[#dc2626] tracking-tight font-mono">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-600 font-black uppercase mt-0.5">{copy.secUnit}</div>
          </div>

          <div className="p-2.5 bg-[#dc2626] text-white border-2 border-black shadow-[2px_2px_0_#d4d4d8] flex flex-col justify-center items-center">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {String(timeLeft.milliseconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-white/90 font-black uppercase mt-0.5">{copy.msUnit}</div>
          </div>

          <div className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0_#d4d4d8] flex flex-col justify-center items-center">
            <div className="text-xl sm:text-2xl font-black font-mono text-black">
              {remainingYears}{copy.yearUnit}
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-600 font-black uppercase mt-0.5">{copy.goldenTimeLabel}</div>
          </div>

          <div className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0_#d4d4d8] flex flex-col justify-center items-center">
            <div className="text-xl sm:text-2xl font-black font-mono text-[#ff4d00]">
              {engineOutput ? `${engineOutput.pDoomPercent}%` : '18.4%'}
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-600 font-black uppercase mt-0.5">P(DOOM)</div>
          </div>
        </div>
      </div>

      {/* 3. 대표 실증 대화록 (접이식 아코디언 - 첫 화면 밀도 최적화) */}
      <div className="bg-white border-2 border-black shadow-[4px_4px_0_#d4d4d8]">
        <button
          type="button"
          onClick={() => setIsDialogOpen((prev) => !prev)}
          className="w-full p-3.5 sm:px-5 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-[#ffc900]/20 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d00] shrink-0" />
            <span className="text-xs sm:text-sm font-black text-black uppercase tracking-wider truncate">
              {copy.dialogTitle}
            </span>
            <span className="text-[11px] font-mono font-black text-black px-2 py-0.5 bg-[#ffc900] border border-black hidden sm:inline shrink-0">
              {copy.dialogDate}
            </span>
          </div>
          <span className="px-2.5 py-1 bg-[#f4f4f0] border border-black text-[11px] font-black shrink-0">
            {isDialogOpen ? `${copy.collapseDialog} ▴` : `${copy.expandDialog} ▾`}
          </span>
        </button>

        {isDialogOpen && (
          <div className="p-4 sm:p-5 border-t-2 border-black space-y-4 font-sans text-xs sm:text-sm">
          {/* 인간의 질문 */}
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="w-11 h-9 rounded-none bg-zinc-800 text-[#ffc900] font-mono font-black text-[11px] flex items-center justify-center shrink-0 border-2 border-black shadow-[2px_2px_0_#d4d4d8]">
              {copy.humanBadge}
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-[11px] font-mono font-bold text-zinc-600">
                {copy.dialogDate} · {copy.humanSpeaker}
              </div>
              <div className="p-3.5 bg-[#f4f4f0] border-2 border-black text-black font-bold leading-relaxed shadow-[2px_2px_0_#d4d4d8]">
                &ldquo;{copy.humanQuestionPre}<strong>{copy.humanQuestionBold}</strong>&rdquo;
              </div>
            </div>
          </div>

          {/* AI의 답변 */}
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="w-11 h-9 rounded-none bg-[#ff4d00] text-white font-mono font-black text-[11px] flex items-center justify-center shrink-0 border-2 border-black shadow-[2px_2px_0_#d4d4d8]">
              {copy.aiBadge}
            </div>
            <div className="flex-1 space-y-1">
              <div className="text-[11px] font-mono text-[#ff4d00] font-black">
                {copy.aiSpeaker}
              </div>
              <div className="p-4 bg-white border-2 border-black text-black space-y-3 font-mono leading-relaxed shadow-[4px_4px_0_#d4d4d8]">
                <div className="text-xs text-zinc-800 border-b-2 border-black pb-2.5 font-sans leading-relaxed">
                  &ldquo;{copy.aiIntro}&rdquo;
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-1">
                  <div className="p-3 bg-[#ffc900] border-2 border-black shadow-[2px_2px_0_#d4d4d8]">
                    <div className="text-[11px] text-zinc-800 font-bold">{copy.estYearLabel}:</div>
                    <div className="text-2xl font-black text-black mt-0.5">{copy.estYearValue}</div>
                  </div>
                  <div className="p-3 bg-[#ff90e8] border-2 border-black shadow-[2px_2px_0_#d4d4d8]">
                    <div className="text-[11px] text-zinc-800 font-bold">{copy.estProbLabel}:</div>
                    <div className="text-2xl font-black text-black mt-0.5">{copy.estProbValue}</div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="text-black font-black font-sans">{copy.whyTitle}</div>
                  <div className="p-2.5 bg-[#f4f4f0] border-2 border-black space-y-1.5 text-zinc-800 font-sans text-xs">
                    {copy.phases.map((phase, idx) => (
                      <div key={idx}>• {phase}</div>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-[#ff4d00] font-bold border-t-2 border-black pt-2 font-sans">
                  {copy.footnote}
                </div>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>
    </section>
  );
}
