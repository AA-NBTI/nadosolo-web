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

  // 전역 설정에서 네비게이션 메뉴 가져오기 ('프로그램 이용안내' 제외)
  const navItems = [...(config?.header?.navItems || [])]
    .filter((item) => item.visible && item.id !== 'guide' && item.href !== '/guide')
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
    <header className="sticky top-0 z-50 bg-[#07080a]/90 backdrop-blur-md border-b border-white/[0.08]">
      {/* 아래 메인 캔버스 폭(1280px, px-6 sm:px-12 lg:px-20)과 완벽하게 수평 정렬 */}
      <div className="w-full max-w-[1280px] mx-auto px-6 sm:px-12 lg:px-20 h-18 flex items-center justify-between gap-4 sm:gap-6">
        
        {/* [좌측] 나도솔로 정통 로고 (상단 nadosolo + 하단 '솔로공감 나도솔로' 폭 일치) + 섬세한 보조 문구 */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Link
            href="/"
            className="inline-flex flex-col items-center justify-center shrink-0 hover:opacity-90 transition-opacity group select-none py-1"
          >
            {/* 상단: 현재 럭셔리 에디토리얼 세리프 디자인 톤으로 정밀 조율된 영문 nadosolo */}
            <span className="font-serif-editorial text-[26px] sm:text-[30px] font-light text-white tracking-[-0.02em] lowercase leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] group-hover:text-zinc-100 transition-colors duration-300">
              nadosolo
            </span>

            {/* 하단: 영문 기준 비율에 완벽히 매칭된 한글 (솔로공감 ↔ nado / 나도솔로 ↔ solo) */}
            <div className="w-full flex items-center justify-between mt-1 leading-none select-none">
              {/* 솔로공감: nado 영역(약 52%) - 순백색 화이트(text-white font-black) ➔ 호버 시 포인트 컬러(#f04f74) 전환 */}
              <div className="w-[52%] flex justify-between items-center text-[10px] sm:text-[11.5px] font-serif-editorial font-black text-white group-hover:text-[#f04f74] transition-colors duration-200">
                <span>솔</span>
                <span>로</span>
                <span>공</span>
                <span>감</span>
              </div>

              {/* 감-나 사이의 분기 여백 */}
              <div className="w-[6%]" />

              {/* 나도솔로: solo 영역(약 42%) - 진한 핑크로즈(#f04f74) ➔ 호버 시 화이트 전환 */}
              <div className="w-[42%] flex justify-between items-center text-[10px] sm:text-[11.5px] font-serif-editorial font-black text-[#f04f74] group-hover:text-white transition-colors duration-200">
                <span>나</span>
                <span>도</span>
                <span>솔</span>
                <span>로</span>
              </div>
            </div>
          </Link>

          {/* 로고 옆 세련된 보조 문구 디자인 (디바이더 라인 + 핑크로즈 도트) */}
          <div className="hidden sm:inline-flex items-center gap-2 pl-3.5 border-l border-white/15 text-[11px] font-mono tracking-[0.2em] text-zinc-400 font-light uppercase">
            <span>Private Salon</span>
            <span className="w-1 h-1 rounded-full bg-[#f04f74]" />
            <span>Busan</span>
          </div>
        </div>

        {/* [중앙] 절제된 럭셔리 네비게이션 */}
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

        {/* [우측] INVITATION ONLY 뱃지 & 프로필/로그인 */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          
          {/* INVITATION ONLY 뱃지 */}
          <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono tracking-[0.2em] text-zinc-400 uppercase font-light">
            INVITATION ONLY
          </span>

          {/* 로그인 / 프로필 / 관리자 버튼 */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
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
