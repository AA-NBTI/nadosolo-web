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

// 7-세그먼트 매핑 (a:상, b:우상, c:우하, d:하, e:좌하, f:좌상, g:중앙)
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
  const off = 'fill-white/10';

  return (
    <svg
      viewBox="0 0 28 48"
      className="w-3.5 h-6 sm:w-5 sm:h-9 md:w-6 md:h-10 shrink-0 drop-shadow-[0_0_5px_rgba(255,255,255,0.35)]"
      aria-hidden="true"
    >
      {/* a (상) */}
      <polygon points="5,2 23,2 20,6 8,6" className={segs[0] ? on : off} />
      {/* b (우상) */}
      <polygon points="24,3 26,5 26,22 24,23 21,20 21,7" className={segs[1] ? on : off} />
      {/* c (우하) */}
      <polygon points="24,25 26,26 26,43 24,45 21,41 21,28" className={segs[2] ? on : off} />
      {/* d (하) */}
      <polygon points="8,42 20,42 23,46 5,46" className={segs[3] ? on : off} />
      {/* e (좌하) */}
      <polygon points="4,25 7,28 7,41 4,45 2,43 2,26" className={segs[4] ? on : off} />
      {/* f (좌상) */}
      <polygon points="4,3 7,7 7,20 4,23 2,22 2,5" className={segs[5] ? on : off} />
      {/* g (중앙) */}
      <polygon points="5,24 8,21 20,21 23,24 20,27 8,27" className={segs[6] ? on : off} />
    </svg>
  );
}

function SevenSegColon() {
  return (
    <svg
      viewBox="0 0 10 48"
      className="w-1.5 h-6 sm:w-2 sm:h-9 md:w-2.5 md:h-10 shrink-0"
      aria-hidden="true"
    >
      <rect x="2.5" y="13" width="5" height="5" rx="1" className="fill-white/90" />
      <rect x="2.5" y="30" width="5" height="5" rx="1" className="fill-white/90" />
    </svg>
  );
}

export default function HeroSurvivalTimer({ locale, engineOutput }: HeroSurvivalTimerProps) {
  const baselineRemainingYears = engineOutput ? engineOutput.remainingYears : 9.0;
  const baseTarget = new Date('2035-01-01T00:00:00Z').getTime();
  const offsetMs = (baselineRemainingYears - 9.0) * 365.25 * 24 * 60 * 60 * 1000;
  const targetDate = baseTarget + offsetMs;

  // 요일/연수 없이 총 잔여 시간(Hours)으로 통합 계산 -> 실제 디지털 시계 HH:MM:SS 포맷
  const calc = (nowMs: number) => {
    const diff = Math.max(0, targetDate - nowMs);
    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { totalHours, minutes, seconds };
  };

  const [t, setT] = useState(() => calc(SSR_REF_NOW));

  useEffect(() => {
    setT(calc(Date.now()));
    const timer = setInterval(() => {
      setT(calc(Date.now()));
    }, 250);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  const hoursStr = String(t.totalHours).padStart(5, '0');
  const minsStr = String(t.minutes).padStart(2, '0');
  const secsStr = String(t.seconds).padStart(2, '0');

  return (
    <div
      className="bg-black/35 backdrop-blur-[2px] border border-white/25 px-3 py-2 sm:px-4 sm:py-2.5 select-none pointer-events-none rounded-sm"
      aria-label={SURVIVAL_LABELS[locale] || SURVIVAL_LABELS.ko}
    >
      <div className="text-[10px] sm:text-xs font-mono tracking-[0.18em] text-white/90 font-bold uppercase leading-none mb-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {SURVIVAL_LABELS[locale] || SURVIVAL_LABELS.ko}
      </div>

      {/* 모든 자릿수 동일 크기의 정통 7-세그먼트 디지털 시계 */}
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
      </div>
    </div>
  );
}
