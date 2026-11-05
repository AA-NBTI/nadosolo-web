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
    { href: '/dining', label: lang === 'KO' ? '소셜 다이닝' : 'Social Dining', badge: 'OPEN' },
    { href: '/dating', label: lang === 'KO' ? '소셜 데이팅' : 'Social Dating' },
    { href: '/club', label: lang === 'KO' ? '소셜 클럽' : 'Social Club' },
    { href: '/events', label: lang === 'KO' ? '프라이빗 이벤트' : 'Private Events' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.handle === '@admin' || currentUser?.userId === 'ADMIN_01';

  return (
    <header className="sticky top-0 z-50 bg-[#0f131d]/95 backdrop-blur-md border-b border-[#f2ca50]/20">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* ==============================================================
            [좌측] 마보살 스타일 브랜드 로고 & 엠블럼
            ============================================================== */}
        <Link
          href="/"
          className="flex items-center gap-2.5 sm:gap-3 group shrink-0"
        >
          {/* 원형 엠블럼 (마보살 스타일 골드 글로우) */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#881337] via-[#5c0d24] to-[#1a040b] border border-[#f2ca50]/50 shadow-[0_0_16px_rgba(242,202,80,0.35)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <span className="font-serif-editorial text-base sm:text-lg font-bold text-[#f2ca50]">N</span>
          </div>
          {/* 브랜드명 + 도메인 */}
          <div className="flex flex-col line-tight">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif-editorial text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                nadosolo
              </span>
              <span className="font-mono text-[10px] sm:text-xs text-[#f2ca50]/80 font-semibold tracking-wider">
                .com
              </span>
            </div>
          </div>
        </Link>

        {/* 4대 핵심 카테고리 네비게이션 */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || (item.href === '/dining' && pathname.startsWith('/kr/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative text-sm tracking-wide transition-colors py-1 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-zinc-400 hover:text-white font-medium'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="현재 접수중" />
                )}
                {isActive && (
                  <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#f2ca50] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ==============================================================
            [우측] 마보살 스타일: 거점 뱃지, 언어 스위처, 로그인/로그아웃/관리자
            ============================================================== */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* 도시 뱃지 */}
          <Link
            href="/dining"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-all"
            title="현재 거점: 부산 전포/서면"
          >
            <MapPin className="w-3.5 h-3.5 text-[#f2ca50]" />
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

          {/* 마보살 스타일 로그인 / 프로필 / 관리자 버튼 */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* 마이페이지/대시보드 이동 프로필 칩 */}
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-zinc-200 hover:text-white transition-all shadow-sm"
                title="마이페이지 / 대시보드 이동"
              >
                <User className="w-3.5 h-3.5 text-[#f2ca50]" />
                <span className="truncate max-w-[80px] sm:max-w-[120px]">
                  {currentUser.nickname || currentUser.handle}
                </span>
              </Link>

              {/* 관리자일 때 나타나는 마보살 스타일 최고 관리자 원형 엠블럼 버튼 */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="w-8 h-8 rounded-full bg-[#f2ca50]/15 hover:bg-[#f2ca50]/25 border border-[#f2ca50]/60 text-[#f2ca50] flex items-center justify-center transition-all shadow-[0_0_12px_rgba(242,202,80,0.25)]"
                  title="최고 관리자 대시보드"
                >
                  <ShieldCheck className="w-4 h-4 text-[#f2ca50]" />
                </Link>
              )}

              {/* 로그아웃 아이콘 버튼 */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all cursor-pointer"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* 비로그인 게스트: 마보살 스타일 골드 테두리 로그인 버튼 */
            <Link
              href="/auth"
              className="px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold text-[#f2ca50] bg-[#f2ca50]/10 hover:bg-[#f2ca50]/20 border border-[#f2ca50]/40 transition-all shadow-sm flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>로그인</span>
            </Link>
          )}
        </div>
      </div>

      {/* 모바일 하단 서브탭 (모바일에서 4대 카테고리 즉시 탭 가능) */}
      <div className="md:hidden flex items-center justify-around border-t border-white/5 bg-[#0f131d] px-2 py-2 text-xs">
        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2 py-1 rounded-lg transition-colors ${
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
