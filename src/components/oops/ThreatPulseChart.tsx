'use client';

import React, { useState } from 'react';
import type { OopsLocale } from '@/lib/oops/i18n';
import {
  CHART_I18N,
  ThreatTheme,
  UNIVERSAL_THREAT_THEMES,
  getAllThreatThemes,
} from '@/lib/oops/universalThreatEngine';

interface ThreatPulseChartProps {
  initialThemeId?: string;
  isEmbed?: boolean;
  locale?: OopsLocale;
}

export default function ThreatPulseChart({
  initialThemeId = 'ai_collision',
  isEmbed = false,
  locale = 'ko',
}: ThreatPulseChartProps) {
  const [activeThemeId, setActiveThemeId] = useState<string>(initialThemeId);
  const themes = getAllThreatThemes();
  const current = UNIVERSAL_THREAT_THEMES[activeThemeId] || UNIVERSAL_THREAT_THEMES.ai_collision;
  const t = CHART_I18N[locale] || CHART_I18N.ko;

  const currentTitle = current.titles[locale] || current.titles.en;
  const currentSubtitle = current.subtitles[locale] || current.subtitles.en;

  return (
    <div className={`w-full bg-[#0c0d12] border border-white/10 rounded-none text-zinc-100 ${isEmbed ? 'p-4' : 'p-6'}`}>
      {/* 1. 상단 통제 바: 테마 스위처 */}
      {!isEmbed && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#f04f74] rounded-full" />
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              {t.coreEngine}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {themes.map((th) => {
              const active = th.id === activeThemeId;
              return (
                <button
                  key={th.id}
                  onClick={() => setActiveThemeId(th.id)}
                  className={`px-2.5 py-1 text-xs font-mono transition-colors border ${
                    active
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-zinc-900/60 text-zinc-400 border-white/10 hover:text-white hover:border-white/30'
                  }`}
                >
                  {th.code}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. 헤더 메트릭 요약: 언어별 제목/부제 자동 렌더링 */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-1">
          <span>{current.code} // {t.observationReport}</span>
          <span>{t.confidence}</span>
        </div>
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-white mb-1.5">
          {currentTitle}
        </h2>
        <p className="text-sm text-zinc-400 mb-4">
          {currentSubtitle}
        </p>

        {/* 핵심 통계 수치 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-zinc-900/40 border border-white/5 font-mono text-xs">
          <div>
            <div className="text-zinc-500 text-[11px] uppercase">{t.globalIndex}</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {current.globalIndex.toFixed(1)}°
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[11px] uppercase">{t.delta24h}</div>
            <div className={`text-xl font-bold mt-0.5 ${current.delta24h >= 0 ? 'text-amber-400' : 'text-zinc-300'}`}>
              {current.delta24h >= 0 ? `+${current.delta24h.toFixed(1)}°` : `${current.delta24h.toFixed(1)}°`}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[11px] uppercase">{t.sampleSize}</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {current.sampleSize.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[11px] uppercase">{t.observedRegions}</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {current.regionCount} REGIONS
            </div>
          </div>
        </div>
      </div>

      {/* 3. 지역별 체감 위험 온도 다이어그램 (도시명 언어별 매핑) */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-white/5 pb-2">
          <span>{t.regionalRiskScale}</span>
          <span>{t.temperatureDelta}</span>
        </div>

        <div className="space-y-3 font-mono">
          {current.regionalMetrics.map((rm) => {
            const cityName = rm.city[locale] || rm.city.en;
            return (
              <div key={cityName} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-200 font-medium">
                    {cityName} <span className="text-zinc-500 text-[10px]">({rm.country})</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] ${rm.delta24h >= 0 ? 'text-amber-400/80' : 'text-zinc-500'}`}>
                      {rm.delta24h >= 0 ? `+${rm.delta24h.toFixed(1)}°` : `${rm.delta24h.toFixed(1)}°`}
                    </span>
                    <span className="text-white font-bold w-9 text-right">{rm.temperature}°</span>
                  </div>
                </div>

                {/* 통계 바 게이지 (고대비 호박색/브론즈 바) */}
                <div className="w-full h-3 bg-zinc-900 border border-white/10 overflow-hidden relative">
                  <div
                    className="h-full bg-[#d97706] transition-all duration-700 ease-out"
                    style={{ width: `${rm.temperature}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. 인식 격차(Divergence Gap) 통계 블록 */}
      <div className="p-3 bg-zinc-900/60 border border-white/10 text-xs font-mono space-y-1.5 mb-4">
        <div className="text-zinc-400 uppercase tracking-wider text-[11px]">
          {t.divergenceTitle}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-zinc-300">
          <span>{t.objRiskLabel}: <strong className="text-white">{current.divergence.objectiveRisk}°</strong></span>
          <span>{t.subFearLabel}: <strong className="text-white">{current.divergence.subjectiveFear}°</strong></span>
          <span>
            {t.gapLabel}: <strong className="text-amber-400">{current.divergence.gap > 0 ? `+${current.divergence.gap}°` : `${current.divergence.gap}°`}</strong>
          </span>
        </div>
        <div className="text-[11px] text-zinc-500 pt-1">
          {current.divergence.gap > 0 ? t.gapHigherDesc : t.gapLowerDesc}
        </div>
      </div>

      {/* 5. 언론사/연구기관 신뢰 메타데이터 주석 */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10 text-[11px] font-mono text-zinc-500">
        <span>{t.sourceText}</span>
        <span>{t.verifiedSample} N={current.sampleSize.toLocaleString()}</span>
      </div>
    </div>
  );
}
