'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';
import { User, LogOut, ShieldCheck, MapPin } from 'lucide-react';

export default function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useNadoSoloEngine();
  const [lang, setLang] = useState<'KO' | 'EN'>('KO');

  const navLinks = [
    { href: '/dining', label: lang === 'KO' ? '소셜 다이닝' : 'Social Dining' },
    { href: '/salon', label: lang === 'KO' ? '소셜 살롱' : 'Social Salon' },
    { href: '/club', label: lang === 'KO' ? '소셜 클럽' : 'Social Club' },
    { href: '/meetup', label: lang === 'KO' ? '테마 밋업' : 'Theme Meetup' },
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
    <header className="sticky top-0 z-50 bg-[#090a0f]/95 backdrop-blur-md border-b border-white/10">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* ==============================================================
            [좌측] 기존 나도솔로 정통 텍스트 로고
            ============================================================== */}
        <Link
          href="/"
          className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-white tracking-tight lowercase shrink-0 hover:opacity-85 transition-opacity"
        >
          nadosolo
        </Link>

        {/* 4대 핵심 카테고리 네비게이션 (글자 폰트 크기 확대: text-[16px] sm:text-[17px]) */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === '/dining' && pathname.startsWith('/kr/')) ||
              (item.href === '/salon' && pathname === '/dating');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative text-[16px] sm:text-[17px] tracking-normal transition-colors py-1 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-zinc-300 hover:text-white font-medium'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ==============================================================
            [우측] 레드와인 포인트 컬러 적용: 거점 뱃지, 언어 스위처, 로그인/로그아웃/관리자
            ============================================================== */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* 도시 뱃지 */}
          <Link
            href="/dining"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-all"
            title="현재 거점: 부산 전포/서면"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-medium tracking-wider">부산 (전포·서면)</span>
          </Link>

          {/* 언어 전환 버튼 (KO / EN) */}
          <button
            type="button"
            onClick={() => setLang(lang === 'KO' ? 'EN' : 'KO')}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer font-medium"
            title="언어 설정 (Language)"
          >
            <span>{lang === 'KO' ? 'EN' : 'KO'}</span>
          </button>

          {/* 로그인 / 프로필 / 관리자 버튼 */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* 마이페이지/대시보드 이동 프로필 칩 */}
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-zinc-200 hover:text-white transition-all shadow-sm"
                title="마이페이지 / 대시보드 이동"
              >
                <User className="w-3.5 h-3.5 text-rose-400" />
                <span className="truncate max-w-[80px] sm:max-w-[120px]">
                  {currentUser.nickname || currentUser.handle}
                </span>
              </Link>

              {/* 로그아웃 아이콘 버튼 */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all cursor-pointer"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* [요청 3] 최고관리자 로그인 후 오른쪽 상단 방패모양은 로그아웃 버튼 오른쪽 맨 끝으로 배치 */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="w-8 h-8 rounded-full bg-[#881337]/30 hover:bg-[#881337]/50 border border-rose-500/60 text-rose-200 flex items-center justify-center transition-all shadow-[0_0_12px_rgba(190,18,60,0.3)] ml-0.5"
                  title="최고 관리자 대시보드"
                >
                  <ShieldCheck className="w-4 h-4 text-rose-300" />
                </Link>
              )}
            </div>
          ) : (
            /* 비로그인 게스트: 나도솔로 시그니처 레드와인 테두리 로그인 버튼 */
            <Link
              href="/auth"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-rose-200 bg-[#881337]/30 hover:bg-[#881337]/50 border border-rose-500/50 transition-all shadow-sm flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-rose-400" />
              <span>로그인</span>
            </Link>
          )}
        </div>
      </div>

      {/* 모바일 하단 서브탭 (글자 크기 확대: text-sm) */}
      <div className="md:hidden flex items-center justify-around border-t border-white/5 bg-[#090a0f] px-2 py-2.5 text-sm">
        {navLinks.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === '/salon' && pathname === '/dating');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2.5 py-1 rounded-lg transition-colors text-[14px] ${
                isActive ? 'text-white font-bold bg-white/10' : 'text-zinc-400'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
