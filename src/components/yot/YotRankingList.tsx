'use client';

import React, { useEffect, useState } from 'react';
import { YotVenueItem } from '@/lib/yot/yotTypes';
import { MapPin, ArrowRight, RotateCw } from 'lucide-react';

interface YotRankingListProps {
  onSelectVenue?: (venue: YotVenueItem) => void;
}

export default function YotRankingList({ onSelectVenue }: YotRankingListProps) {
  const [ranking, setRanking] = useState<(YotVenueItem & { report_count?: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/yot/ranking?limit=10')
      .then((res) => res.json())
      .then((data) => {
        if (data.ranking) setRanking(data.ranking);
      })
      .catch((err) => console.warn('랭킹 로드 실패:', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="border border-white/10 bg-[#0c0d12] rounded-2xl p-6 sm:p-8 space-y-4">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f04f74]" />
          <h3 className="font-serif-editorial text-lg sm:text-xl text-white font-normal">
            추천 맛집 랭킹
          </h3>
        </div>
        <span className="text-xs font-mono text-zinc-400">
          실시간 집계
        </span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-zinc-500 flex items-center justify-center gap-2 text-sm">
          <RotateCw className="w-4 h-4 animate-spin" />
          <span>집계 중...</span>
        </div>
      ) : ranking.length === 0 ? (
        <div className="py-6 text-center text-sm text-zinc-500">
          아직 추천된 맛집이 없습니다.
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {ranking.map((item, idx) => (
            <div
              key={item.provider_place_id || idx}
              className="py-3 flex items-center justify-between gap-3 group hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-6 text-center font-mono text-sm font-bold shrink-0 ${
                    idx === 0
                      ? 'text-[#f04f74]'
                      : idx < 3
                      ? 'text-white'
                      : 'text-zinc-500'
                  }`}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>

                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate group-hover:text-[#f04f74] transition-colors">
                    {item.place_name}
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0 text-zinc-500" />
                    <span>{item.region_dong || item.region_gu || item.region_city}</span>
                    {item.category_name && (
                      <span className="text-zinc-600 truncate">· {item.category_name.split('>').pop()?.trim()}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono text-zinc-400 border border-white/10 px-2 py-0.5 rounded bg-black/40">
                  {item.report_count || 1}회 제보
                </span>

                {onSelectVenue && (
                  <button
                    type="button"
                    onClick={() => onSelectVenue(item)}
                    className="px-2.5 py-1 rounded bg-white/10 text-white text-xs font-medium hover:bg-[#f04f74] transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>선택</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
