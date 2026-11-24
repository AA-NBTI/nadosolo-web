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
    <div className={`w-full bg-white border-4 border-black p-4 sm:p-6 shadow-[8px_8px_0_#000] text-black font-mono ${isEmbed ? 'p-4' : 'p-6'}`}>
      {/* 1. 상단 통제 바: OOPS 옐로우 (#ffc900) 헤더 & 로고 오렌지 (#ff4d00) 활성 테마 */}
      {!isEmbed && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3 bg-[#ffc900] -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#ff4d00] rounded-full animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-black tracking-wider text-black uppercase">
              {t.coreEngine}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {themes.map((th) => {
              const active = th.id === activeThemeId;
              return (
                <button
                  key={th.id}
                  onClick={() => setActiveThemeId(th.id)}
                  className={`px-3 py-1 text-xs font-mono font-black transition-all border-2 border-black cursor-pointer ${
                    active
                      ? 'bg-[#ff4d00] text-white shadow-[2px_2px_0_#000]'
                      : 'bg-white text-zinc-800 hover:text-black hover:bg-zinc-100'
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
        <div className="flex items-center justify-between text-xs font-mono text-zinc-600 mb-1">
          <span className="font-bold">{current.code} // {t.observationReport}</span>
          <span className="bg-[#ffc900] text-black px-2 py-0.5 border border-black font-black text-[11px] shadow-[1px_1px_0_#000]">
            {t.confidence}
          </span>
        </div>
        <h2 className="text-xl md:text-2xl font-black tracking-tight text-black mb-1.5">
          {currentTitle}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-700 font-sans font-medium mb-4">
          {currentSubtitle}
        </p>

        {/* 핵심 통계 수치 그리드 (OOPS 시그니처 옐로우 & 네오브루탈 박스) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3.5 bg-[#f4f4f0] border-2 border-black shadow-[3px_3px_0_#000] font-mono text-xs">
          <div>
            <div className="text-zinc-600 font-black text-[11px] uppercase">{t.globalIndex}</div>
            <div className="text-2xl font-black text-[#ff4d00] mt-0.5">
              {current.globalIndex.toFixed(1)}°
            </div>
          </div>
          <div>
            <div className="text-zinc-600 font-black text-[11px] uppercase">{t.delta24h}</div>
            <div className={`text-2xl font-black mt-0.5 ${current.delta24h >= 0 ? 'text-[#ff4d00]' : 'text-zinc-800'}`}>
              {current.delta24h >= 0 ? `+${current.delta24h.toFixed(1)}°` : `${current.delta24h.toFixed(1)}°`}
            </div>
          </div>
          <div>
            <div className="text-zinc-600 font-black text-[11px] uppercase">{t.sampleSize}</div>
            <div className="text-2xl font-black text-black mt-0.5">
              {current.sampleSize.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-zinc-600 font-black text-[11px] uppercase">{t.observedRegions}</div>
            <div className="text-2xl font-black text-black mt-0.5">
              {current.regionCount} REGIONS
            </div>
          </div>
        </div>
      </div>

      {/* 3. 지역별 체감 위험 온도 다이어그램 (도시명 언어별 매핑) */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between text-xs font-mono text-black font-black border-b-2 border-black pb-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ff4d00]" />
            {t.regionalRiskScale}
          </span>
          <span>{t.temperatureDelta}</span>
        </div>

        <div className="space-y-2.5 font-mono">
          {current.regionalMetrics.map((rm) => {
            const cityName = rm.city[locale] || rm.city.en;
            return (
              <div key={cityName} className="p-2.5 bg-[#f4f4f0] border-2 border-black shadow-[2px_2px_0_#000] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-black font-black">
                    {cityName} <span className="text-zinc-600 font-bold text-[11px]">({rm.country})</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold ${rm.delta24h >= 0 ? 'text-[#ff4d00]' : 'text-zinc-600'}`}>
                      {rm.delta24h >= 0 ? `+${rm.delta24h.toFixed(1)}°` : `${rm.delta24h.toFixed(1)}°`}
                    </span>
                    <span className={`font-black text-xs px-1.5 py-0.2 border border-black ${
                      rm.temperature >= 80 ? 'bg-[#ff4d00] text-white' :
                      rm.temperature >= 60 ? 'bg-[#ffc900] text-black' :
                      rm.temperature >= 30 ? 'bg-[#a3e635] text-black' : 'bg-white text-black'
                    }`}>
                      {rm.temperature}°
                    </span>
                  </div>
                </div>

                {/* 통계 바 게이지 */}
                <div className="w-full h-3 bg-white border-2 border-black overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-700 ease-out ${
                      rm.temperature >= 80 ? 'bg-[#ff4d00]' :
                      rm.temperature >= 60 ? 'bg-[#ffc900]' :
                      rm.temperature >= 30 ? 'bg-[#a3e635]' : 'bg-blue-400'
                    }`}
                    style={{ width: `${Math.min(100, rm.temperature)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. 인식 격차(Divergence Gap) 통계 블록 (OOPS 옐로우 & 오렌지 포인트) */}
      <div className="p-4 bg-[#ffc900]/25 border-2 border-black shadow-[3px_3px_0_#000] text-xs font-mono space-y-2 mb-4">
        <div className="text-black uppercase tracking-wider font-black text-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ff4d00]" />
          {t.divergenceTitle}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-zinc-900 font-bold">
          <span className="bg-white px-2 py-1 border border-black shadow-[1px_1px_0_#000]">
            {t.objRiskLabel}: <strong className="text-black font-black">{current.divergence.objectiveRisk}°</strong>
          </span>
          <span className="bg-white px-2 py-1 border border-black shadow-[1px_1px_0_#000]">
            {t.subFearLabel}: <strong className="text-black font-black">{current.divergence.subjectiveFear}°</strong>
          </span>
          <span className="bg-[#ff4d00] text-white px-2 py-1 border border-black font-black shadow-[1px_1px_0_#000]">
            {t.gapLabel}: {current.divergence.gap > 0 ? `+${current.divergence.gap}°` : `${current.divergence.gap}°`}
          </span>
        </div>
        <div className="text-xs text-zinc-800 font-sans font-medium pt-1">
          {current.divergence.gap > 0 ? t.gapHigherDesc : t.gapLowerDesc}
        </div>
      </div>

      {/* 5. 언론사/연구기관 신뢰 메타데이터 주석 */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t-2 border-black text-[11px] font-mono text-zinc-600 font-bold">
        <span>{t.sourceText}</span>
        <span className="bg-white px-1.5 py-0.5 border border-black text-black shadow-[1px_1px_0_#000]">
          {t.verifiedSample} N={current.sampleSize.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
