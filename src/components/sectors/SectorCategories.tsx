'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SectorConfig, SectorCategoryItem, DEFAULT_CATEGORY_ITEMS } from '@/engine/siteConfigEngine';

interface SectorCategoriesProps {
  config?: SectorConfig;
  onUpdate?: (updates: Partial<SectorConfig>) => void;
}

export default function SectorCategories({ config }: SectorCategoriesProps) {
  // 관리자 설정에서 카테고리 목록을 가져오고, visible=true인 항목만 필터링
  const rawItems: SectorCategoryItem[] =
    config?.categoryItems && config.categoryItems.length > 0
      ? config.categoryItems
      : DEFAULT_CATEGORY_ITEMS;

  const activeItems = rawItems.filter((item) => item.visible);

  // 노출 중인 프로그램이 전혀 없으면 섹터를 렌더링하지 않음
  if (activeItems.length === 0) {
    return null;
  }

  // 노출되는 아이템 개수에 따른 유연한 그리드 레이아웃
  const gridClass =
    activeItems.length === 1
      ? 'grid-cols-1 max-w-xl mx-auto'
      : activeItems.length === 2
      ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
      : activeItems.length === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  const title = config?.title || (activeItems.length === 1 ? '소셜 프로그램' : `${activeItems.length}가지 소셜 프로그램`);
  const subtitle = config?.subtitle || '취향과 속도에 맞는 자리를 선택해 보세요.';

  return (
    <section className="w-full py-16 sm:py-20 bg-[#090a0f] border-b border-white/10">
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6">
        
        {/* 섹션 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Program Lineup
            </p>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-bold text-white mt-1">
              {title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
            {subtitle}
          </p>
        </div>

        {/* 동적 카테고리 카드 그리드 */}
        <div className={`grid gap-5 ${gridClass}`}>
          {activeItems.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href || '/dining'}
              prefetch={true}
              className="group relative flex flex-col rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/30 overflow-hidden transition-all duration-300"
            >
              {/* 상단 이미지 */}
              <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-black/30" />
                
                {/* 뱃지 */}
                {cat.badge && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/60 text-zinc-200 border border-white/10 backdrop-blur-md">
                      {cat.badge}
                    </span>
                  </div>
                )}

                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-zinc-300 group-hover:text-white group-hover:bg-[#f04f74] transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              {/* 본문 */}
              <div className="p-5 flex flex-col flex-1 justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-[#f04f74] transition-colors">
                      {cat.title}
                    </h3>
                    {cat.subtitle && (
                      <span className="text-xs text-zinc-500 font-serif-editorial">
                        {cat.subtitle}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    {cat.desc}
                  </p>
                </div>

                {cat.target && (
                  <div className="pt-3 border-t border-white/5 text-[11px] text-zinc-500">
                    <span>{cat.target}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
