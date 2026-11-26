'use client';

import React, { useState } from 'react';
import type { WarBriefingEntry } from '@/lib/oops/featureModulesStore';

interface OopsWarBriefingSectionProps {
  briefings: WarBriefingEntry[];
}

export default function OopsWarBriefingSection({ briefings }: OopsWarBriefingSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(briefings[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!briefings || briefings.length === 0) return null;

  const latest = briefings[0];
  const archives = briefings.slice(1);

  const handleShareBriefing = (item: WarBriefingEntry) => {
    const shareText = `[OOPS 전시 브리핑 ${item.issueNo}] ${item.title}\n\n${item.bullets.map((b) => `• ${b}`).join('\n')}\n\n충돌 온도 변화: ${item.impactTemp}\n출처: https://oops.monster`;
    navigator.clipboard.writeText(shareText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section aria-label="War Room Briefing" className="w-full space-y-4">
      {/* 1. 최신 긴급 전선 브리핑 (Hero Media Dispatch) */}
      <div className="bg-white border-4 border-black shadow-[8px_8px_0_#000] text-black font-mono overflow-hidden">
        {/* 상단 긴급 타전 헤더 */}
        <div className="bg-[#ffc900] border-b-4 border-black px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#ff4d00] border border-black animate-pulse" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-black">
              {latest.issueNo} · 오늘의 전시 브리핑
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-black text-[#ffc900] text-xs font-black">
              {latest.category}
            </span>
            <span className="px-2 py-0.5 bg-[#ff4d00] text-white text-xs font-black border border-black">
              온도 {latest.impactTemp}
            </span>
          </div>
        </div>

        {/* 본문: 강렬한 헤드라인 + 3줄 핵심 요약 */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
            <span>발행일: {latest.date}</span>
            <button
              type="button"
              onClick={() => handleShareBriefing(latest)}
              className="px-2.5 py-1 bg-[#a3e635] text-black font-black border-2 border-black shadow-[2px_2px_0_#000] hover:bg-black hover:text-[#a3e635] transition-all cursor-pointer"
            >
              {copiedId === latest.id ? '✓ 브리핑 복사됨' : '📢 브리핑 공유 복사'}
            </button>
          </div>

          <h2 className="text-lg sm:text-xl font-sans font-black text-black leading-snug">
            {latest.title}
          </h2>

          <div className="bg-[#fffae0] border-2 border-black p-3.5 sm:p-4 space-y-2">
            {latest.bullets.map((line, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm font-sans font-bold text-zinc-900 leading-relaxed">
                <span className="text-[#ff4d00] font-black shrink-0">▶</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. 이전 전시 브리핑 아카이브 (컴팩트 접힘/펼침 리스트) */}
      {archives.length > 0 && (
        <div className="bg-white border-2 border-black p-3 sm:p-4 shadow-[4px_4px_0_#000] space-y-2 font-mono">
          <div className="text-xs font-black uppercase text-zinc-600 border-b border-black pb-1.5">
            과거 전시 타전 기록 ({archives.length}건)
          </div>
          <div className="space-y-2">
            {archives.map((item) => {
              const isOpen = expandedId === item.id;
              return (
                <div key={item.id} className="border-2 border-black bg-[#fcfcfc]">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : item.id)}
                    className="w-full p-2.5 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-[#ffc900]/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 bg-black text-white text-[11px] font-black shrink-0">
                        {item.issueNo}
                      </span>
                      <span className="text-xs font-bold text-zinc-500 shrink-0">{item.date}</span>
                      <span className="text-xs sm:text-sm font-sans font-bold text-black truncate">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-xs font-black text-black shrink-0">{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {isOpen && (
                    <div className="p-3 border-t-2 border-black bg-white space-y-2">
                      {item.bullets.map((line, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs font-sans font-medium text-zinc-800">
                          <span className="text-[#ff4d00] font-black">•</span>
                          <span>{line}</span>
                        </div>
                      ))}
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleShareBriefing(item)}
                          className="px-2 py-1 text-[11px] font-black bg-[#ffc900] border border-black hover:bg-black hover:text-[#ffc900] cursor-pointer"
                        >
                          {copiedId === item.id ? '✓ 복사됨' : '📋 인용 복사'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
