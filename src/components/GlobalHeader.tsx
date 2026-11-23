'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import { useSiteConfig } from '@/engine/siteConfigEngine';
import { User, LogOut, ShieldCheck, MapPin } from 'lucide-react';

export default function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useNadoSoloEngine();
  const { config } = useSiteConfig();

  const isBizRoute = pathname.startsWith('/biz');
  const isPublicBookingRoute =
    pathname.startsWith('/reserve') || pathname.startsWith('/r/');
  const isTablebaroRoute = isBizRoute || isPublicBookingRoute;
  const isAffiliateRoute =
    pathname.startsWith('/partners') || pathname.startsWith('/affiliate');

  // 일반 이용자 vs 어필리에이트 vs 테이블바로 네비게이션 완전 분리
  const navItems = isTablebaroRoute
    ? [
        { id: 'reserve-list', label: '매장검색', href: '/reserve' },
        { id: 'reserve-my', label: '예약확인', href: '/reserve/my' },
        { id: 'biz-apply', label: '입점신청', href: '/biz?tab=signup' },
      ]
    : isAffiliateRoute
      ? [
          { id: 'affiliate', label: '어필리에이트', href: '/affiliate' },
          { id: 'partner-portal', label: '관리', href: '/partners/dashboard' },
          { id: 'home', label: '다이닝 홈', href: '/' },
        ]
      : [
          { id: 'yot', label: '솔로엿장수', href: '/yot' },
          { id: 'misik', label: '솔로미식단', href: '/misik' },
          { id: 'solotest', label: '솔로테스트', href: '/test' },
          { id: 'meetup', label: '밋업', href: '/meetup' },
        ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    currentUser?.handle === '@admin' ||
    currentUser?.userId === 'ADMIN_01';

  return (
    <header className="sticky top-0 z-50 bg-[#07080a]/90 backdrop-blur-md border-b border-white/[0.08]">
      {/* 아래 메인 캔버스 폭(1280px, px-6 sm:px-12 lg:px-20)과 완벽하게 수평 정렬 */}
      <div className="w-full max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20 h-18 flex items-center justify-between gap-4 sm:gap-6">
        
        {/* [좌측] 브랜드 로고: 테이블바로 경로(/biz, /book, /r) vs 나도솔로 분리 */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {isTablebaroRoute ? (
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
          ) : (
            <Link
              href="/"
              prefetch={true}
              className="inline-flex flex-col items-center justify-center shrink-0 hover:opacity-90 transition-opacity group select-none py-1"
            >
              {/* 상단: 영문 nadosolo */}
              <span className="font-serif-editorial text-[26px] sm:text-[30px] font-light text-white tracking-[-0.02em] lowercase leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] group-hover:text-zinc-100 transition-colors duration-300">
                nadosolo
              </span>

              {/* 하단: 한글 (솔로공감 / 나도솔로) */}
              <div className="w-full flex items-center justify-between mt-1 leading-none select-none">
                <div className="w-[52%] flex justify-between items-center text-[10px] sm:text-[11.5px] font-serif-editorial font-black text-white group-hover:text-[#f04f74] transition-colors duration-200">
                  <span>솔</span>
                  <span>로</span>
                  <span>공</span>
                  <span>감</span>
                </div>

                <div className="w-[6%]" />

                <div className="w-[42%] flex justify-between items-center text-[10px] sm:text-[11.5px] font-serif-editorial font-black text-[#f04f74] group-hover:text-white transition-colors duration-200">
                  <span>나</span>
                  <span>도</span>
                  <span>솔</span>
                  <span>로</span>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* [중앙] 네비게이션 */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === '/dining' && pathname.startsWith('/kr/')) ||
              (item.href === '/salon' && pathname === '/dating');
            return (
              <Link
                key={item.id || item.href}
                href={item.href}
                prefetch={true}
                className={`text-xs font-mono tracking-[0.2em] uppercase transition-colors py-1 ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-zinc-400 hover:text-white font-light'
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* [우측] 프로필/로그인 (어필리에이트 / 테이블바로 분리) */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {isTablebaroRoute ? (
            <div className="flex items-center gap-2">
              <Link
                href="/biz"
                prefetch={true}
                className="px-4 py-1.5 border border-[#3b82f6]/60 bg-[#3b82f6]/15 hover:bg-[#3b82f6]/25 text-white text-xs font-mono tracking-wider uppercase transition-colors"
              >
                로그인
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  prefetch={true}
                  className="w-8 h-8 rounded-none bg-transparent hover:bg-white/[0.05] border border-white/20 hover:border-[#3b82f6] text-zinc-300 hover:text-[#3b82f6] flex items-center justify-center transition-all"
                  title="최고 관리자 대시보드"
                >
                  <ShieldCheck className="w-4 h-4 text-[#3b82f6]" />
                </Link>
              )}
            </div>
          ) : isAffiliateRoute ? (
            <div className="flex items-center gap-2">
              <Link
                href="/partners/dashboard"
                prefetch={true}
                className="px-4 py-1.5 border border-white/25 bg-white/10 hover:bg-white/20 text-white text-xs font-mono tracking-wider uppercase transition-colors"
              >
                어필리에이트
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  prefetch={true}
                  className="w-8 h-8 rounded-none bg-transparent hover:bg-white/[0.05] border border-white/20 hover:border-[#f04f74] text-zinc-300 hover:text-[#f04f74] flex items-center justify-center transition-all"
                  title="최고 관리자 대시보드"
                >
                  <ShieldCheck className="w-4 h-4 text-[#f04f74]" />
                </Link>
              )}
            </div>
          ) : currentUser ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                prefetch={true}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-none border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-mono text-zinc-200 hover:text-white transition-all"
                title="마이페이지 / 대시보드"
              >
                <User className="w-3.5 h-3.5 text-[#f04f74]" />
                <span className="truncate max-w-[80px] sm:max-w-[120px]">
                  {currentUser.nickname || currentUser.handle}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {isAdmin && (
                <Link
                  href="/admin"
                  prefetch={true}
                  className="w-8 h-8 rounded-none bg-transparent hover:bg-white/[0.05] border border-white/20 hover:border-[#f04f74] text-zinc-300 hover:text-[#f04f74] flex items-center justify-center transition-all ml-1"
                  title="최고 관리자 대시보드"
                >
                  <ShieldCheck className="w-4 h-4 text-[#f04f74]" />
                </Link>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              prefetch={true}
              className="px-4 py-1.5 border border-white/20 hover:border-[#f04f74] bg-transparent text-white text-xs font-mono tracking-wider uppercase transition-colors"
            >
              SIGN IN
            </Link>
          )}

        </div>

      </div>
    </header>
  );
}
