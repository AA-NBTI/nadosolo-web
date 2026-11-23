'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { id: 'reserve-list', label: '매장검색', href: '/reserve' },
  { id: 'reserve-my', label: '예약확인', href: '/reserve/my' },
  { id: 'biz-apply', label: '입점신청', href: '/biz?tab=signup' },
];

/** 테이블바로 전용 헤더 (NadoSoloProvider 비종속) */
export default function TablebaroHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full bg-[#090a0f] border-b border-white/10">
      <div className="w-full max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20 h-18 flex items-center justify-between gap-4 sm:gap-6">
        <Link
          href="/reserve"
          prefetch={true}
          className="inline-flex flex-col items-start justify-center shrink-0 hover:opacity-90 transition-opacity group select-none py-1"
        >
          <span className="font-serif-editorial text-[24px] sm:text-[28px] font-light text-white tracking-[-0.02em] lowercase leading-none">
            tablebaro
          </span>
          <span className="text-[11px] font-mono tracking-[0.22em] text-[#3b82f6] mt-1 leading-none">
            테이블바로
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                prefetch={true}
                className={`text-xs font-mono tracking-[0.2em] uppercase transition-colors py-1 ${
                  isActive ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white font-light'
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/biz"
            prefetch={true}
            className="px-4 py-1.5 border border-[#3b82f6]/60 bg-[#3b82f6]/15 hover:bg-[#3b82f6]/25 text-white text-xs font-mono tracking-wider uppercase transition-colors"
          >
            로그인
          </Link>
        </div>
      </div>
    </header>
  );
}
