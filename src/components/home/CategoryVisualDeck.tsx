'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface CategoryItem {
  id: string;
  label: string;
  subLabel: string;
  href: string;
  imageSrc: string;
  badge?: string;
}

const CATEGORY_ITEMS: CategoryItem[] = [
  {
    id: 'yot',
    label: '솔로엿장수',
    subLabel: '맛집 정보 거래',
    href: '/yot',
    imageSrc: '/images/themes/yot-hero.jpg?v=2',
    badge: '100% 룰렛',
  },
  {
    id: 'misik',
    label: '솔로미식단',
    subLabel: '6인 미식단 랭킹',
    href: '/misik',
    imageSrc: '/images/themes/misik-hero.jpg',
    badge: '솔미단',
  },
  {
    id: 'solotest',
    label: '솔로테스트',
    subLabel: '소통 성향 진단',
    href: '/test',
    imageSrc: '/images/hero-same-direction.jpg',
  },
  {
    id: 'meetup',
    label: '밋업',
    subLabel: '6인 식탁 예약',
    href: '/meetup',
    imageSrc: '/images/hero-party-first.jpg',
    badge: '금·토',
  },
];

export default function CategoryVisualDeck() {
  const pathname = usePathname();

  return (
    <div className="w-full bg-[#07080a] border-b border-white/10 py-5 select-none overflow-hidden">
      <div className="max-w-[1220px] mx-auto px-4 sm:px-8">
        
        {/* 가로 스와이프 / 데스크톱 그리드 컨테이너 */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1">
          {CATEGORY_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                prefetch={true}
                className={`group flex-1 min-w-[140px] sm:min-w-[180px] p-2.5 rounded-2xl border transition-all flex items-center gap-3 relative overflow-hidden ${
                  isActive
                    ? 'border-[#f04f74] bg-[#f04f74]/10 shadow-[0_4px_20px_rgba(240,79,116,0.2)]'
                    : 'border-white/10 bg-[#0c0d12] hover:border-white/25 hover:bg-white/[0.03]'
                }`}
              >
                {/* 썸네일 이미지 (원형/라운드 스퀘어) */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/15 shadow-md">
                  <img
                    src={item.imageSrc}
                    alt={item.label}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </div>

                {/* 텍스트 라벨 & 서브라벨 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm font-semibold truncate transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-zinc-200 group-hover:text-white'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#f04f74] text-white shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 truncate mt-0.5 group-hover:text-zinc-300">
                    {item.subLabel}
                  </div>
                </div>

                {/* 활성 인디케이터 라인 */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#f04f74]" />
                )}
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
