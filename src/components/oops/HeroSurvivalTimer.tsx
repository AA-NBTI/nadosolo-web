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

const SEG_MAP: Record<string, [boolean, boolean, boolean, boolean, boolean, boolean, boolean]> = {
  '0': [true, true, true, true, true, true, false],
  '1': [false, true, true, false, false, false, false],
  '2': [true, true, false, true, true, false, true],
  '3': [true, true, true, true, false, false, true],
  '4': [false, true, true, false, false, true, true],
  '5': [true, false, true, true, false, true, true],
  '6': [true, false, true, true, true, true, true],
  '7': [true, true, true, false, false, false, false],
  '8': [true, true, true, true, true, true, true],
  '9': [true, true, true, true, false, true, true],
};

function SevenSegDigit({ char }: { char: string }) {
  const segs = SEG_MAP[char] || SEG_MAP['0'];
  const on = 'fill-white';
  const off = 'fill-white/[0.03]';

  return (
    <svg
      viewBox="0 0 28 48"
      className="w-2.5 h-4 sm:w-4 sm:h-7 md:w-[18px] md:h-8 shrink-0 drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]"
      aria-hidden="true"
    >
      <polygon points="5,2 23,2 20,6 8,6" className={segs[0] ? on : off} />
      <polygon points="24,3 26,5 26,22 24,23 21,20 21,7" className={segs[1] ? on : off} />
      <polygon points="24,25 26,26 26,43 24,45 21,41 21,28" className={segs[2] ? on : off} />
      <polygon points="8,42 20,42 23,46 5,46" className={segs[3] ? on : off} />
      <polygon points="4,25 7,28 7,41 4,45 2,43 2,26" className={segs[4] ? on : off} />
      <polygon points="4,3 7,7 7,20 4,23 2,22 2,5" className={segs[5] ? on : off} />
      <polygon points="5,24 8,21 20,21 23,24 20,27 8,27" className={segs[6] ? on : off} />
    </svg>
  );
}

function SevenSegColon() {
  return (
    <svg
      viewBox="0 0 10 48"
      className="w-1 h-4 sm:w-1.5 sm:h-7 md:w-2 md:h-8 shrink-0"
      aria-hidden="true"
    >
      <rect x="2.5" y="13" width="5" height="5" rx="1" className="fill-white/95" />
      <rect x="2.5" y="30" width="5" height="5" rx="1" className="fill-white/95" />
    </svg>
  );
}

function SevenSegDot() {
  return (
    <svg
      viewBox="0 0 10 48"
      className="w-1 h-4 sm:w-1.5 sm:h-7 md:w-2 md:h-8 shrink-0"
      aria-hidden="true"
    >
      <rect x="2.5" y="39" width="5" height="5" rx="1" className="fill-white/95" />
    </svg>
  );
}

export default function HeroSurvivalTimer({ locale, engineOutput }: HeroSurvivalTimerProps) {
  const baselineRemainingYears = engineOutput ? engineOutput.remainingYears : 9.0;
  const baseTarget = new Date('2035-01-01T00:00:00Z').getTime();
  const offsetMs = (baselineRemainingYears - 9.0) * 365.25 * 24 * 60 * 60 * 1000;
  const targetDate = baseTarget + offsetMs;

  const calc = (nowMs: number) => {
    const diff = Math.max(0, targetDate - nowMs);
    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const cs = Math.floor((diff % 1000) / 10);
    return { totalHours, minutes, seconds, cs };
  };

  const [t, setT] = useState(() => calc(SSR_REF_NOW));

  useEffect(() => {
    setT(calc(Date.now()));
    const timer = setInterval(() => {
      setT(calc(Date.now()));
    }, 47);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  const hoursStr = String(t.totalHours).padStart(5, '0');
  const minsStr = String(t.minutes).padStart(2, '0');
  const secsStr = String(t.seconds).padStart(2, '0');
  const csStr = String(t.cs).padStart(2, '0');

  return (
    <div
      className="inline-block select-none pointer-events-none"
      aria-label={SURVIVAL_LABELS[locale] || SURVIVAL_LABELS.ko}
    >
      {/* 순수 디지털 시계 본체 (상하좌우 여백 50% 축소, 카운터 크기 유지) */}
      <div className="bg-black/85 backdrop-blur-sm border-2 border-white/30 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-sm shadow-[0_6px_20px_rgba(0,0,0,0.85)]">
        <div className="flex items-center gap-0.5 sm:gap-1">
          {hoursStr.split('').map((ch, idx) => (
            <SevenSegDigit key={`h-${idx}`} char={ch} />
          ))}
          <SevenSegColon />
          {minsStr.split('').map((ch, idx) => (
            <SevenSegDigit key={`m-${idx}`} char={ch} />
          ))}
          <SevenSegColon />
          {secsStr.split('').map((ch, idx) => (
            <SevenSegDigit key={`s-${idx}`} char={ch} />
          ))}
          <SevenSegDot />
          {csStr.split('').map((ch, idx) => (
            <SevenSegDigit key={`cs-${idx}`} char={ch} />
          ))}
        </div>
      </div>
    </div>
  );
}
