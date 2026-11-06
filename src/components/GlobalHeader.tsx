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

  // 전역 설정에서 네비게이션 메뉴 가져오기
  const navItems = [...(config?.header?.navItems || [])]
    .filter((item) => item.visible)
    .sort((a, b) => a.order - b.order);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    currentUser?.handle === '@admin' ||
    currentUser?.userId === 'ADMIN_01';

  return (
    <header className="sticky top-0 z-50 bg-[#090a0f]/95 backdrop-blur-md border-b border-white/10">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* [좌측] 나도솔로 정통 로고 (연결된 영문 nadosolo 기준 + 하단 nado/solo 완벽 대칭 한글 밸런스) */}
        <Link
          href="/"
          className="inline-flex flex-col items-center justify-center shrink-0 hover:opacity-90 transition-opacity group select-none py-1"
        >
          {/* 상단: 연결된 오리지널 영문 로고 (기준 앵커: 폰트 및 디자인 불변 유지) */}
          <span className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-white tracking-tight lowercase leading-none">
            nadosolo
          </span>

          {/* 하단: 영문 기준 비율에 완벽히 매칭된 한글 (솔로공감 ↔ nado / 나도솔로 ↔ solo) */}
          <div className="w-full flex items-center justify-between mt-1 leading-none select-none">
            {/* 솔로공감: nado 영역(약 52%) - 순수 font-black(900), 인위적 외곽선 제거로 깨끗한 원본 렌더링 */}
            <div className="w-[52%] flex justify-between items-center text-[11px] sm:text-[12.5px] font-serif-editorial font-black text-white group-hover:text-[#f04f74] transition-colors duration-200">
              <span>솔</span>
              <span>로</span>
              <span>공</span>
              <span>감</span>
            </div>

            {/* 감-나 사이의 균형 잡힌 단어 분리 여백 (영문 o-s 분기점과 일치) */}
            <div className="w-[6%]" />

            {/* 나도솔로: solo 영역(약 42%) - 순수 font-black(900), 진한 핑크로즈(#f04f74) */}
            <div className="w-[42%] flex justify-between items-center text-[11px] sm:text-[12.5px] font-serif-editorial font-black text-[#f04f74] group-hover:text-white transition-colors duration-200">
              <span>나</span>
              <span>도</span>
              <span>솔</span>
              <span>로</span>
            </div>
          </div>
        </Link>

        {/* 4대 핵심 카테고리 네비게이션 (사족 뱃지 제거, 텍스트 컬러로만 심플하게 표시) */}
        <nav className="hidden md:flex items-center gap-7">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === '/dining' && pathname.startsWith('/kr/')) ||
              (item.href === '/salon' && pathname === '/dating');
            return (
              <Link
                key={item.id || item.href}
                href={item.href}
                className={`relative text-[16px] sm:text-[17px] tracking-normal transition-colors py-1 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-zinc-300 hover:text-white font-medium'
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* [우측] 거점 라벨(단일 '부산'), 로그인/로그아웃/관리자 */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* 부산 단일 거점 뱃지 (하위 장소 제거) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300">
            <MapPin className="w-3.5 h-3.5 text-[#f04f74]" />
            <span className="font-medium tracking-wider">
              {config?.header?.activeCityLabel || '부산'}
            </span>
          </div>

          {/* 로그인 / 프로필 / 관리자 버튼 */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-zinc-200 hover:text-white transition-all shadow-sm"
                title="마이페이지 / 대시보드 이동"
              >
                <User className="w-3.5 h-3.5 text-[#f04f74]" />
                <span className="truncate max-w-[80px] sm:max-w-[120px]">
                  {currentUser.nickname || currentUser.handle}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all cursor-pointer"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="w-8 h-8 rounded-full bg-[#f04f74]/15 hover:bg-[#f04f74]/25 border border-[#f04f74]/40 text-[#f04f74] flex items-center justify-center transition-all shadow-[0_0_12px_rgba(240,79,116,0.3)] ml-0.5"
                  title="관리자 대시보드"
                >
                  <ShieldCheck className="w-4 h-4 text-[#f04f74]" />
                </Link>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#f04f74]/15 hover:bg-[#f04f74]/25 border border-[#f04f74]/40 hover:border-[#f04f74] transition-all shadow-sm flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-[#f04f74]" />
              <span>로그인</span>
            </Link>
          )}
        </div>
      </div>

      {/* 모바일 하단 서브 네비게이션 (사족 뱃지 제거) */}
      <div className="md:hidden flex items-center justify-around border-t border-white/5 bg-[#090a0f] px-2 py-2.5 text-sm">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === '/salon' && pathname === '/dating');
          return (
            <Link
              key={item.id || item.href}
              href={item.href}
              className={`px-2.5 py-1 rounded-lg transition-colors text-[14px] flex items-center gap-1 ${
                isActive ? 'text-white font-bold bg-white/10' : 'text-zinc-400'
              }`}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
