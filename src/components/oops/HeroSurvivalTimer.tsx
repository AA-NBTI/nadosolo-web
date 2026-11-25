'use client';

import React, { useEffect, useState } from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';
import type { EngineEvaluationOutput } from '@/lib/oops/scoringEngine';

interface HeroSurvivalTimerProps {
  locale: OopsLocale;
  engineOutput?: EngineEvaluationOutput;
}

const SURVIVAL_LABELS: Record<OopsLocale, string> = {
  ko: '인류생존시간',
  en: 'HUMAN SURVIVAL TIME',
  ja: '人類生存時間',
  zh: '人类生存时间',
  es: 'SUPERVIVENCIA HUMANA',
};

const SSR_REF_NOW = 1795564800000; // 2026-11-25T00:00:00Z

export default function HeroSurvivalTimer({ locale, engineOutput }: HeroSurvivalTimerProps) {
  const baselineRemainingYears = engineOutput ? engineOutput.remainingYears : 9.0;
  const baseTarget = new Date('2035-01-01T00:00:00Z').getTime();
  const offsetMs = (baselineRemainingYears - 9.0) * 365.25 * 24 * 60 * 60 * 1000;
  const targetDate = baseTarget + offsetMs;

  const calc = (nowMs: number) => {
    const diff = Math.max(0, targetDate - nowMs);
    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365);
    const days = totalDays % 365;
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const cs = Math.floor((diff % 1000) / 10);
    return { years, days, hours, minutes, seconds, cs };
  };

  const [t, setT] = useState(() => calc(SSR_REF_NOW));

  useEffect(() => {
    setT(calc(Date.now()));
    const timer = setInterval(() => {
      setT(calc(Date.now()));
    }, 50);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  const pad = (n: number, len = 2) => String(n).padStart(len, '0');

  return (
    <div
      className="bg-black/75 backdrop-blur-md border border-white/25 px-3 py-2 sm:px-4 sm:py-2.5 select-none pointer-events-none"
      aria-label={SURVIVAL_LABELS[locale] || SURVIVAL_LABELS.ko}
    >
      <div className="text-[10px] sm:text-xs font-mono tracking-[0.16em] text-zinc-300 font-medium uppercase leading-none mb-1.5">
        {SURVIVAL_LABELS[locale] || SURVIVAL_LABELS.ko}
      </div>
      <div className="font-mono tabular-nums text-white font-bold text-sm sm:text-lg md:text-xl tracking-tight leading-none flex items-baseline gap-1.5">
        <span>
          {pad(t.years)}Y {pad(t.days, 3)}D
        </span>
        <span className="text-zinc-500 font-normal">|</span>
        <span>
          {pad(t.hours)}:{pad(t.minutes)}:{pad(t.seconds)}
        </span>
        <span className="text-xs sm:text-sm text-zinc-400 font-normal">.{pad(t.cs)}</span>
      </div>
    </div>
  );
}
