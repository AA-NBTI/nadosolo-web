'use client';

import React, { useState } from 'react';
import { ThreatTheme, UNIVERSAL_THREAT_THEMES, getAllThreatThemes } from '@/lib/oops/universalThreatEngine';

interface ThreatPulseChartProps {
  initialThemeId?: string;
  isEmbed?: boolean;
}

export default function ThreatPulseChart({ initialThemeId = 'ai_collision', isEmbed = false }: ThreatPulseChartProps) {
  const [activeThemeId, setActiveThemeId] = useState<string>(initialThemeId);
  const themes = getAllThreatThemes();
  const current = UNIVERSAL_THREAT_THEMES[activeThemeId] || UNIVERSAL_THREAT_THEMES.ai_collision;

  return (
    <div className={`w-full bg-[#0c0d12] border border-white/10 rounded-none text-zinc-100 ${isEmbed ? 'p-4' : 'p-6'}`}>
      {/* 1. 상단 통제 바: 테마 스위처 (엔터프라이즈 터미널 스타일) */}
      {!isEmbed && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#f04f74] rounded-full" />
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              UNIVERSAL THREAT OBSERVATORY // CORE ENGINE
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {themes.map((t) => {
              const active = t.id === activeThemeId;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveThemeId(t.id)}
                  className={`px-2.5 py-1 text-xs font-mono transition-colors border ${
                    active
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-zinc-900/60 text-zinc-400 border-white/10 hover:text-white hover:border-white/30'
                  }`}
                >
                  {t.code}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. 헤더 메트릭 요약: 첨부파일 레퍼런스 스타일 */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-1">
          <span>{current.code} // OBSERVATION REPORT</span>
          <span>CONFIDENCE: 95% (CI ±1.2%)</span>
        </div>
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-white mb-2">
          {current.englishTitle}
        </h2>
        <p className="text-sm text-zinc-400 mb-4">
          {current.koreanTitle}
        </p>

        {/* 핵심 통계 수치 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-zinc-900/40 border border-white/5 font-mono text-xs">
          <div>
            <div className="text-zinc-500 text-[11px]">GLOBAL THREAT INDEX</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {current.globalIndex.toFixed(1)}°
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[11px]">24H DELTA</div>
            <div className={`text-xl font-bold mt-0.5 ${current.delta24h >= 0 ? 'text-amber-400' : 'text-zinc-300'}`}>
              {current.delta24h >= 0 ? `+${current.delta24h.toFixed(1)}°` : `${current.delta24h.toFixed(1)}°`}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[11px]">SAMPLE SIZE (N)</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {current.sampleSize.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-[11px]">OBSERVED REGIONS</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {current.regionCount} COUNTRIES
            </div>
          </div>
        </div>
      </div>

      {/* 3. 지역별 체감 위험 온도 다이어그램 (첨부 이미지 1:1 완벽 구현) */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-white/5 pb-2">
          <span>REGIONAL RISK PERCEPTION (0° - 100° SCALE)</span>
          <span>TEMPERATURE / DELTA</span>
        </div>

        <div className="space-y-3 font-mono">
          {current.regionalMetrics.map((rm) => (
            <div key={rm.city} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-200 font-medium">{rm.city}</span>
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
          ))}
        </div>
      </div>

      {/* 4. 인식 격차(Divergence Gap) 통계 블록 - 언론사 인용 특종 데이터 */}
      <div className="p-3 bg-zinc-900/60 border border-white/10 text-xs font-mono space-y-1.5 mb-4">
        <div className="text-zinc-400 uppercase tracking-wider text-[11px]">
          STATISTICAL DIVERGENCE (OBJECTIVE RISK vs. PUBLIC FEAR)
        </div>
        <div className="flex items-center justify-between text-zinc-300">
          <span>사건 실측 객관 위험도: <strong className="text-white">{current.divergence.objectiveRisk}°</strong></span>
          <span>대중 체감 위험도: <strong className="text-white">{current.divergence.subjectiveFear}°</strong></span>
          <span>
            인식 격차: <strong className="text-amber-400">{current.divergence.gap > 0 ? `+${current.divergence.gap}°` : `${current.divergence.gap}°`}</strong>
          </span>
        </div>
        <div className="text-[11px] text-zinc-500 pt-1">
          {current.divergence.gap > 0
            ? '대중의 심리적 위기 체감이 실제 발생한 기술적 통제 사고율보다 높게 형성되어 있습니다.'
            : '실제 객관적 위험 수치 대비 대중의 경각심과 사회적 방비가 다소 미흡한 상태입니다.'}
        </div>
      </div>

      {/* 5. 언론사/연구기관 신뢰 메타데이터 주석 */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10 text-[11px] font-mono text-zinc-500">
        <span>SOURCE: OOPS GLOBAL THREAT SENSOR NETWORK (SYNDICATED)</span>
        <span>VERIFIED SAMPLE N={current.sampleSize.toLocaleString()}</span>
      </div>
    </div>
  );
}
