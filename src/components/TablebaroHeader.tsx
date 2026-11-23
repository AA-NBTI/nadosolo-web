'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BIZ_SESSION_KEY = 'tablebaro_biz_session_v1';

const NAV_ITEMS = [
  { id: 'reserve-list', label: '매장검색', href: '/reserve' },
  { id: 'reserve-my', label: '예약확인', href: '/reserve/my' },
  { id: 'biz-apply', label: '입점신청', href: '/biz?tab=signup' },
];

/** 테이블바로 전용 헤더 (NadoSoloProvider 비종속) */
export default function TablebaroHeader() {
  const pathname = usePathname();
  const [bizName, setBizName] = useState<string | null>(null);

  useEffect(() => {
    const syncSession = () => {
      try {
        const raw = localStorage.getItem(BIZ_SESSION_KEY);
        if (!raw) {
          setBizName(null);
          return;
        }
        const parsed = JSON.parse(raw) as { name?: string };
        setBizName(parsed?.name || '매장관리');
      } catch {
        setBizName(null);
      }
    };
    syncSession();
    window.addEventListener('storage', syncSession);
    window.addEventListener('tablebaro-biz-session', syncSession);
    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('tablebaro-biz-session', syncSession);
    };
  }, [pathname]);

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
          {bizName ? (
            <Link
              href="/biz"
              prefetch={true}
              className="px-4 py-1.5 border border-white/30 bg-white/10 hover:bg-white/20 text-white text-xs font-mono tracking-wider inline-flex items-center gap-2 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="max-w-[120px] truncate">{bizName}</span>
            </Link>
          ) : (
            <Link
              href="/biz"
              prefetch={true}
              className="px-4 py-1.5 border border-[#3b82f6]/60 bg-[#3b82f6]/15 hover:bg-[#3b82f6]/25 text-white text-xs font-mono tracking-wider uppercase transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
