'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { DailyChronicleEntry } from '@/lib/oops/chronicleStore';
import { generateCitation } from '@/lib/oops/chronicleStore';

interface OopsArchiveQuickBarProps {
  chronicles: DailyChronicleEntry[];
  todayDateStr?: string;
}

export default function OopsArchiveQuickBar({
  chronicles,
  todayDateStr = '2026-11-26',
}: OopsArchiveQuickBarProps) {
  const [selectedEntry, setSelectedEntry] = useState<DailyChronicleEntry | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyCitation = (entry: DailyChronicleEntry) => {
    const text = generateCitation(entry);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section aria-label="OOPS Threat Archive Quick Bar" className="w-full">
      {/* 1줄 컴팩트 네오 브루탈리즘 날짜 필터 바 */}
      <div className="bg-white border-4 border-black p-3 sm:p-4 shadow-[6px_6px_0_#000] text-black font-mono space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#ff4d00] border border-black animate-pulse" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-black">
              일일 전선 기록 (2026-11-24 출범 ~ 현재)
            </span>
          </div>

          <Link
            href="/oops/archive"
            className="px-2.5 py-1 text-xs font-black bg-[#ffc900] text-black border-2 border-black shadow-[2px_2px_0_#000] hover:bg-black hover:text-[#ffc900] transition-all cursor-pointer"
          >
            월간·연간 필터 전체보기 ➔
          </Link>
        </div>

        {/* 날짜 선택 태그 목록 */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {chronicles.slice(0, 7).map((entry) => {
            const isToday = entry.date === todayDateStr;
            const isSelected = selectedEntry?.date === entry.date;

            return (
              <button
                key={entry.date}
                type="button"
                onClick={() => setSelectedEntry(isSelected ? null : entry)}
                className={`px-3 py-1.5 text-xs font-black border-2 border-black cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-black text-[#ffc900] shadow-[2px_2px_0_#ff4d00]'
                    : isToday
                    ? 'bg-[#ffc900] text-black shadow-[2px_2px_0_#000] hover:bg-black hover:text-white'
                    : 'bg-zinc-100 text-black shadow-[2px_2px_0_#000] hover:bg-white hover:text-black'
                }`}
              >
                {entry.date} ({entry.votes.temp.toFixed(1)}°C){isToday ? ' ★오늘' : ''}
              </button>
            );
          })}
        </div>

        {/* 날짜 클릭 시 노출되는 컴팩트 팝오버 (온도, 투표율, 인용 복사) */}
        {selectedEntry && (
          <div className="mt-3 p-3.5 bg-[#fcfcfc] border-2 border-black shadow-[4px_4px_0_#000] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black bg-black text-white px-2 py-0.5">
                  Day {selectedEntry.dayNumber} · {selectedEntry.date}
                </span>
                <span className="text-xs sm:text-sm font-black text-[#ff4d00]">
                  충돌 온도 {selectedEntry.votes.temp.toFixed(1)}°C
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyCitation(selectedEntry)}
                  className="px-2.5 py-1 text-xs font-black bg-[#a3e635] text-black border-2 border-black shadow-[2px_2px_0_#000] hover:bg-black hover:text-[#a3e635] transition-all cursor-pointer"
                >
                  {copied ? '✓ 인용 복사됨' : '📋 공식 인용 복사'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEntry(null)}
                  className="px-2 py-1 text-xs font-black bg-zinc-200 text-black border border-black hover:bg-black hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 당일 투표 비율 요약 */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
              <div className="p-2 border border-black bg-[#ff4d00]/10 text-[#ff4d00]">
                전쟁 찬성 {selectedEntry.votes.total > 0 ? Math.round((selectedEntry.votes.yes / selectedEntry.votes.total) * 100) : 0}% ({selectedEntry.votes.yes}표)
              </div>
              <div className="p-2 border border-black bg-[#ffc900]/20 text-black">
                중립 {selectedEntry.votes.total > 0 ? Math.round((selectedEntry.votes.neutral / selectedEntry.votes.total) * 100) : 0}% ({selectedEntry.votes.neutral}표)
              </div>
              <div className="p-2 border border-black bg-[#a3e635]/20 text-black">
                전쟁 반대 {selectedEntry.votes.total > 0 ? Math.round((selectedEntry.votes.no / selectedEntry.votes.total) * 100) : 0}% ({selectedEntry.votes.no}표)
              </div>
            </div>

            {/* 당일 사건사고 요약 */}
            {selectedEntry.incidents.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-black text-black">
                  당일 접수 사건 ({selectedEntry.incidents.length}건):
                </div>
                <div className="space-y-1 text-xs">
                  {selectedEntry.incidents.map((inc) => (
                    <div key={inc.id} className="p-2 border border-black bg-white flex items-center justify-between gap-2">
                      <span className="font-bold text-black truncate">
                        [{inc.category}] {inc.title}
                      </span>
                      <span className="text-zinc-600 shrink-0">{inc.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
