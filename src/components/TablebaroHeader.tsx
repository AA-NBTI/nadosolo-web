'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { getTablebaroSubdomain, isTablebaroHost } from '@/modules/tenancy';

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
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [onTablebaroApex, setOnTablebaroApex] = useState(false);

  useEffect(() => {
    const h = window.location.hostname;
    setSubdomain(getTablebaroSubdomain(h));
    setOnTablebaroApex(isTablebaroHost(h) && !getTablebaroSubdomain(h));
  }, []);

  /** 가맹점 서브도메인(gosu.tablebaro.com)에서는 메인 허브(tablebaro.com)로 빠져나감 */
  const resolveHref = (path: string) => {
    if (subdomain) return `https://tablebaro.com${path}`;
    return path;
  };
  const homeHref = subdomain ? 'https://tablebaro.com' : onTablebaroApex ? '/' : '/reserve';

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

  const handleLogout = () => {
    localStorage.removeItem(BIZ_SESSION_KEY);
    window.dispatchEvent(new Event('tablebaro-biz-session'));
    setBizName(null);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#090a0f] border-b border-white/10">
      <div className="w-full max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20 h-18 flex items-center justify-between gap-4 sm:gap-6">
        <Link
          href={homeHref}
          prefetch={!subdomain}
          className="inline-flex flex-col items-start justify-center shrink-0 hover:opacity-90 transition-opacity group select-none py-1"
        >
          <span className="font-serif-editorial text-[22px] sm:text-[26px] font-normal text-white tracking-[0.04em] uppercase leading-none">
            TABLEBARO
          </span>
          <span className="text-xs font-sans font-medium text-[#3b82f6] tracking-normal mt-1 leading-none">
            선결제예약 테이블바로
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={resolveHref(item.href)}
                prefetch={!subdomain}
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
            <div className="flex items-center gap-2">
              <Link
                href={resolveHref('/biz')}
                prefetch={!subdomain}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-mono text-zinc-200 hover:text-white transition-all"
                title="매장관리"
              >
                <User className="w-3.5 h-3.5 text-[#3b82f6]" />
                <span className="truncate max-w-[100px] sm:max-w-[140px]">{bizName}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href={resolveHref('/biz')}
              prefetch={!subdomain}
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
