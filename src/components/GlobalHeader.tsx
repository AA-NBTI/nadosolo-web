'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useNadoSoloEngine } from '@/engine';

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

  return (
    <header className="sticky top-0 z-50 bg-[#090a0f]/95 backdrop-blur-md border-b border-white/10">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-3 sm:gap-6">
        {/* 브랜드 로고 */}
        <Link
          href="/"
          className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-white tracking-tight lowercase shrink-0 hover:opacity-85 transition-opacity"
        >
          nadosolo
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
                    ? 'text-white font-semibold'
                    : 'text-zinc-400 hover:text-white font-medium'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="현재 접수중" />
                )}
                {isActive && (
                  <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* 우측 영역: 도시 표시 + 언어 스위처 + 계정 */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* 도시 뱃지 */}
          <Link
            href="/dining"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-all"
            title="현재 거점: 부산 전포/서면"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-medium tracking-wider">부산 (전포·서면)</span>
          </Link>

          {/* 언어 전환 버튼 (KO / EN) */}
          <button
            type="button"
            onClick={() => setLang(lang === 'KO' ? 'EN' : 'KO')}
            className="px-2.5 sm:px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer font-medium"
            title="언어 설정 (Language)"
          >
            <span>{lang === 'KO' ? 'EN' : 'KO'}</span>
          </button>

          {/* 로그인 / 마이페이지 */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/dashboard"
                className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-medium text-white bg-white/10 hover:bg-white/15 transition-all"
              >
                대시보드
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:inline-block px-2.5 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
            >
              로그인
            </Link>
          )}
        </div>
      </div>

      {/* 모바일 하단 서브탭 (모바일에서 4대 카테고리 즉시 탭 가능) */}
      <div className="md:hidden flex items-center justify-around border-t border-white/5 bg-[#090a0f] px-2 py-2 text-xs">
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
